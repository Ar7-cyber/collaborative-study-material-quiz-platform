const crypto = require('crypto');
const { getDb } = require('../db/database');
const authService = require('./authService');

const VALID_ROLES = ['Student/User', 'Content Contributor / Quiz Creator', 'Administrator'];

class AdminService {
    constructor(db = null) { this.getDb = () => db || getDb(); }

    getAllUsers() {
        return this.getDb().prepare(`SELECT id, username, role, status, created_at FROM users ORDER BY id ASC`).all();
    }

    updateUserStatus(userId, status, adminUser, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        if (!Number.isInteger(userId) || !['ACTIVE', 'DISABLED'].includes(status)) throw new Error('Invalid user or status');
        if (userId === adminUser.id && status === 'DISABLED') throw new Error('Administrators cannot disable their own active account');
        const result = db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId);
        if (!result.changes) throw new Error('User not found');
        if (status === 'DISABLED') db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
        authService.logAudit(adminUser.id, 'ADMIN_UPDATE_USER_STATUS', `Set status of user #${userId} to '${status}'`, ipAddress);
        return true;
    }

    updateUserRole(userId, newRole, adminUser, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        if (!Number.isInteger(userId) || !VALID_ROLES.includes(newRole)) throw new Error('Invalid user or role');
        if (userId === adminUser.id && newRole !== 'Administrator') throw new Error('Administrators cannot remove their own administrator role');
        const result = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, userId);
        if (!result.changes) throw new Error('User not found');
        authService.logAudit(adminUser.id, 'ADMIN_CHANGE_USER_ROLE', `Changed role of user #${userId} to '${newRole}'`, ipAddress);
        return true;
    }

    flagMaterial(materialId, reporter, reason = 'Inappropriate or policy-violating content') {
        const db = this.getDb();
        const material = db.prepare("SELECT id FROM materials WHERE id = ? AND status != 'DELETED'").get(materialId);
        if (!material) throw new Error('Material not found');
        const result = db.prepare(`INSERT OR IGNORE INTO content_flags (reporter_id, material_id, reason) VALUES (?, ?, ?)`).run(reporter.id, materialId, String(reason).slice(0, 500));
        db.prepare("UPDATE materials SET status = 'FLAGGED', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'ACTIVE'").run(materialId);
        authService.logAudit(reporter.id, 'CONTENT_FLAG_MATERIAL', `Flagged material #${materialId}`, '127.0.0.1');
        return { flagged: true, duplicate: result.changes === 0 };
    }

    flagComment(commentId, reporter, reason = 'Inappropriate or policy-violating content') {
        const db = this.getDb();
        const comment = db.prepare("SELECT id FROM comments WHERE id = ? AND status != 'DELETED'").get(commentId);
        if (!comment) throw new Error('Comment not found');
        const result = db.prepare(`INSERT OR IGNORE INTO content_flags (reporter_id, comment_id, reason) VALUES (?, ?, ?)`).run(reporter.id, commentId, String(reason).slice(0, 500));
        db.prepare("UPDATE comments SET status = 'FLAGGED' WHERE id = ? AND status = 'ACTIVE'").run(commentId);
        authService.logAudit(reporter.id, 'CONTENT_FLAG_COMMENT', `Flagged comment #${commentId}`, '127.0.0.1');
        return { flagged: true, duplicate: result.changes === 0 };
    }

    getModerationQueue() {
        const db = this.getDb();
        const materials = db.prepare(`SELECT m.id, m.title, m.description, m.status, m.created_at, u.username AS contributor_name,
            COUNT(cf.id) AS flag_count, GROUP_CONCAT(DISTINCT cf.reason) AS flag_reasons
            FROM materials m LEFT JOIN users u ON u.id = m.contributor_id
            LEFT JOIN content_flags cf ON cf.material_id = m.id AND cf.status = 'OPEN'
            WHERE m.status = 'FLAGGED' GROUP BY m.id ORDER BY m.updated_at DESC`).all();
        const comments = db.prepare(`SELECT c.id, c.material_id, c.comment_text, c.status, c.created_at, u.username AS author_name,
            COUNT(cf.id) AS flag_count, GROUP_CONCAT(DISTINCT cf.reason) AS flag_reasons
            FROM comments c LEFT JOIN users u ON u.id = c.user_id
            LEFT JOIN content_flags cf ON cf.comment_id = c.id AND cf.status = 'OPEN'
            WHERE c.status = 'FLAGGED' GROUP BY c.id ORDER BY c.created_at DESC`).all();
        return { materials, comments };
    }

    moderateMaterial(materialId, newStatus, adminUser, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        if (!['ACTIVE', 'FLAGGED', 'DELETED'].includes(newStatus)) throw new Error('Invalid status');
        const result = db.prepare('UPDATE materials SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, materialId);
        if (!result.changes) throw new Error('Material not found');
        if (newStatus !== 'FLAGGED') db.prepare("UPDATE content_flags SET status = 'RESOLVED' WHERE material_id = ?").run(materialId);
        authService.logAudit(adminUser.id, 'ADMIN_MODERATE_MATERIAL', `Set material #${materialId} status to '${newStatus}'`, ipAddress);
        return true;
    }

    moderateComment(commentId, newStatus, adminUser, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        if (!['ACTIVE', 'FLAGGED', 'DELETED'].includes(newStatus)) throw new Error('Invalid status');
        const result = db.prepare('UPDATE comments SET status = ? WHERE id = ?').run(newStatus, commentId);
        if (!result.changes) throw new Error('Comment not found');
        if (newStatus !== 'FLAGGED') db.prepare("UPDATE content_flags SET status = 'RESOLVED' WHERE comment_id = ?").run(commentId);
        authService.logAudit(adminUser.id, 'ADMIN_MODERATE_COMMENT', `Set comment #${commentId} status to '${newStatus}'`, ipAddress);
        return true;
    }

    getAuditLogs(limit = 50) {
        const safeLimit = Math.max(1, Math.min(10000, Number.isInteger(Number(limit)) ? Number(limit) : 50));
        return this.getDb().prepare(`SELECT a.id, a.user_id, a.action, a.details, a.ip_address, a.created_at,
            a.previous_hash, a.record_hash, u.username FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.id DESC LIMIT ?`).all(safeLimit);
    }

    verifyAuditIntegrity() {
        const rows = this.getDb().prepare('SELECT id, user_id, action, details, ip_address, created_at, previous_hash, record_hash FROM audit_logs ORDER BY id ASC').all();
        let previousHash = 'GENESIS';
        for (const row of rows) {
            const expected = crypto.createHash('sha256').update(JSON.stringify({
                id: row.id, user_id: row.user_id, action: row.action, details: row.details,
                ip_address: row.ip_address, created_at: row.created_at, previous_hash: previousHash
            })).digest('hex');
            if (row.previous_hash !== previousHash || row.record_hash !== expected) {
                return { valid: false, invalid_record_id: row.id, checked: rows.length };
            }
            previousHash = row.record_hash;
        }
        return { valid: true, checked: rows.length };
    }
}

module.exports = new AdminService();
