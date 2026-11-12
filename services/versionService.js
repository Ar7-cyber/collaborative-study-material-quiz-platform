const { getDb } = require('../db/database');
const authService = require('./authService');

class VersionService {
    constructor(db = null) {
        this.getDb = () => db || getDb();
    }

    // CSQP-F-011 & CSQP-F-012: Collaborative Revision & Version History
    createRevision(materialId, { title, content, change_summary }, user, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        const material = db.prepare("SELECT * FROM materials WHERE id = ? AND status = 'ACTIVE'").get(materialId);

        if (!material) throw new Error('Study material not found');

        // Check contributor or administrator permission
        if (user.role !== 'Content Contributor / Quiz Creator' && user.role !== 'Administrator') {
            throw new Error('Forbidden: Only authorized contributors or administrators can collaborate on study material');
        }

        // Get latest version number
        const latest = db.prepare('SELECT MAX(version_number) as max_v FROM material_versions WHERE material_id = ?').get(materialId);
        let nextVersion = 2;
        if (!latest || !latest.max_v) {
            // Preserve initial base version snapshot (v1) before first collaborative revision
            db.prepare(`
                INSERT INTO material_versions (material_id, version_number, title, content, contributor_id, change_summary)
                VALUES (?, 1, ?, ?, ?, 'Initial document creation')
            `).run(materialId, material.title, material.content, material.contributor_id);
            nextVersion = 2;
        } else {
            nextVersion = latest.max_v + 1;
        }

        const newTitle = (title && title.trim()) ? title.trim() : material.title;
        const newContent = content !== undefined ? content : material.content;
        const summary = (change_summary && change_summary.trim()) ? change_summary.trim() : `Revision v${nextVersion}`;

        // Save historical version snapshot (CSQP-F-011)
        db.prepare(`
            INSERT INTO material_versions (material_id, version_number, title, content, contributor_id, change_summary)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(materialId, nextVersion, newTitle, newContent, user.id, summary);

        // Update active material record
        db.prepare(`
            UPDATE materials 
            SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(newTitle, newContent, materialId);

        authService.logAudit(user.id, 'COLLABORATIVE_EDIT', `Created revision v${nextVersion} on material #${materialId}: ${summary}`, ipAddress);

        return {
            material_id: materialId,
            version_number: nextVersion,
            title: newTitle,
            content: newContent,
            change_summary: summary,
            contributor_name: user.username
        };
    }

    getVersionHistory(materialId) {
        const db = this.getDb();
        const versions = db.prepare(`
            SELECT v.id, v.material_id, v.version_number, v.title, v.change_summary, v.created_at,
                   u.username as contributor_name, u.role as contributor_role
            FROM material_versions v
            JOIN users u ON v.contributor_id = u.id
            WHERE v.material_id = ?
            ORDER BY v.version_number DESC
        `).all(materialId);

        return versions;
    }

    getVersionDetails(versionId) {
        const db = this.getDb();
        const version = db.prepare(`
            SELECT v.*, u.username as contributor_name
            FROM material_versions v
            JOIN users u ON v.contributor_id = u.id
            WHERE v.id = ?
        `).get(versionId);

        return version || null;
    }

    // CSQP-F-013: Rollback to Prior Version
    rollbackToVersion(materialId, versionNumber, user, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        const targetVersion = db.prepare('SELECT * FROM material_versions WHERE material_id = ? AND version_number = ?').get(materialId, versionNumber);
        if (!targetVersion) throw new Error(`Version v${versionNumber} not found for material #${materialId}`);

        return this.createRevision(materialId, {
            title: targetVersion.title,
            content: targetVersion.content,
            change_summary: `Reverted to revision v${versionNumber}`
        }, user, ipAddress);
    }
}

module.exports = new VersionService();
