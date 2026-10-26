const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/database');
const authService = require('./authService');

class MaterialService {
    constructor(db = null) {
        this.getDb = () => db || getDb();
    }

    // CSQP-F-005: Subject & Topic Hierarchy
    getSubjectsAndTopics() {
        const db = this.getDb();
        const subjects = db.prepare('SELECT * FROM subjects ORDER BY name ASC').all();
        const topics = db.prepare('SELECT * FROM topics ORDER BY name ASC').all();

        return subjects.map(s => ({
            ...s,
            topics: topics.filter(t => t.subject_id === s.id)
        }));
    }

    // CSQP-F-006: Search & Filtering Facilities
    searchMaterials({ search, subject_id, topic_id, contributor }) {
        const db = this.getDb();
        let query = `
            SELECT m.*, 
                   s.name as subject_name, 
                   s.code as subject_code,
                   t.name as topic_name,
                   u.username as contributor_name,
                   COALESCE(AVG(r.rating), 0) as average_rating,
                   COUNT(r.id) as rating_count
            FROM materials m
            JOIN subjects s ON m.subject_id = s.id
            JOIN topics t ON m.topic_id = t.id
            JOIN users u ON m.contributor_id = u.id
            LEFT JOIN ratings r ON m.id = r.material_id
            WHERE m.status = 'ACTIVE'
        `;
        const params = [];

        if (search && search.trim()) {
            query += ` AND (m.title LIKE ? OR m.description LIKE ? OR m.content LIKE ?)`;
            const term = `%${search.trim()}%`;
            params.push(term, term, term);
        }

        if (subject_id) {
            query += ` AND m.subject_id = ?`;
            params.push(Number(subject_id));
        }

        if (topic_id) {
            query += ` AND m.topic_id = ?`;
            params.push(Number(topic_id));
        }

        if (contributor && contributor.trim()) {
            query += ` AND u.username LIKE ?`;
            params.push(`%${contributor.trim()}%`);
        }

        query += ` GROUP BY m.id ORDER BY m.created_at DESC`;

        const results = db.prepare(query).all(...params);
        return results.map(row => ({
            ...row,
            average_rating: Number(row.average_rating.toFixed(1))
        }));
    }

    getMaterialById(id, currentUserId = null) {
        const db = this.getDb();
        const material = db.prepare(`
            SELECT m.*, 
                   s.name as subject_name, 
                   s.code as subject_code,
                   t.name as topic_name,
                   u.username as contributor_name,
                   COALESCE(AVG(r.rating), 0) as average_rating,
                   COUNT(r.id) as rating_count
            FROM materials m
            JOIN subjects s ON m.subject_id = s.id
            JOIN topics t ON m.topic_id = t.id
            JOIN users u ON m.contributor_id = u.id
            LEFT JOIN ratings r ON m.id = r.material_id
            WHERE m.id = ? AND m.status = 'ACTIVE'
            GROUP BY m.id
        `).get(id);

        if (!material) {
            return null;
        }

        // Fetch user's own rating if authenticated
        let userRating = null;
        if (currentUserId) {
            const r = db.prepare('SELECT rating FROM ratings WHERE material_id = ? AND user_id = ?').get(id, currentUserId);
            if (r) userRating = r.rating;
        }

        // Fetch comments thread (CSQP-F-010)
        const comments = db.prepare(`
            SELECT c.id, c.comment_text, c.created_at, u.username as author_name, u.role as author_role
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.material_id = ? AND c.status = 'ACTIVE'
            ORDER BY c.created_at ASC
        `).all(id);

        return {
            ...material,
            average_rating: Number(material.average_rating.toFixed(1)),
            user_rating: userRating,
            comments
        };
    }

    // CSQP-F-004: In-platform Note Creation
    createNote({ title, description, subject_id, topic_id, content }, user, ipAddress = '127.0.0.1') {
        const db = this.getDb();

        if (!title || !title.trim()) throw new Error('Title is required');
        if (!content || !content.trim()) throw new Error('Note content cannot be empty');
        if (!subject_id || !topic_id) throw new Error('Subject and Topic must be selected');

        // Verify subject and topic
        const topic = db.prepare('SELECT * FROM topics WHERE id = ? AND subject_id = ?').get(topic_id, subject_id);
        if (!topic) throw new Error('Selected topic does not belong to the selected subject');

        const insert = db.prepare(`
            INSERT INTO materials (title, description, subject_id, topic_id, contributor_id, content_type, content, status)
            VALUES (?, ?, ?, ?, ?, 'NOTE', ?, 'ACTIVE')
        `);

        const result = insert.run(
            title.trim(),
            (description || '').trim(),
            Number(subject_id),
            Number(topic_id),
            user.id,
            content.trim()
        );

        authService.logAudit(user.id, 'CREATE_NOTE', `Created note #${result.lastInsertRowid}: ${title.trim()}`, ipAddress);
        return this.getMaterialById(result.lastInsertRowid, user.id);
    }

    // CSQP-F-003: Upload Study Notes & PDF Documents with Validation
    uploadDocument({ title, description, subject_id, topic_id }, file, user, ipAddress = '127.0.0.1') {
        const db = this.getDb();

        if (!file) throw new Error('File is required for document upload');
        if (!title || !title.trim()) throw new Error('Title is required');
        if (!subject_id || !topic_id) throw new Error('Subject and Topic must be selected');

        const topic = db.prepare('SELECT * FROM topics WHERE id = ? AND subject_id = ?').get(topic_id, subject_id);
        if (!topic) throw new Error('Selected topic does not belong to the selected subject');

        const insert = db.prepare(`
            INSERT INTO materials (
                title, description, subject_id, topic_id, contributor_id, 
                content_type, file_path, file_name, file_size, mime_type, status
            )
            VALUES (?, ?, ?, ?, ?, 'DOCUMENT', ?, ?, ?, ?, 'ACTIVE')
        `);

        const result = insert.run(
            title.trim(),
            (description || '').trim(),
            Number(subject_id),
            Number(topic_id),
            user.id,
            file.filename,
            file.originalname,
            file.size,
            file.mimetype
        );

        authService.logAudit(user.id, 'UPLOAD_DOCUMENT', `Uploaded file '${file.originalname}' (${file.size} bytes) for material #${result.lastInsertRowid}`, ipAddress);
        return this.getMaterialById(result.lastInsertRowid, user.id);
    }

    // CSQP-F-008: Edit Study Material
    updateMaterial(id, { title, description, content }, user, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        const material = db.prepare('SELECT * FROM materials WHERE id = ? AND status = ' + "'ACTIVE'").get(id);

        if (!material) throw new Error('Study material not found');

        // Check ownership or administrator role
        if (material.contributor_id !== user.id && user.role !== 'Administrator') {
            throw new Error('Forbidden: You are not authorized to modify this material');
        }

        const newTitle = title && title.trim() ? title.trim() : material.title;
        const newDesc = description !== undefined ? description.trim() : material.description;
        const newContent = content !== undefined ? content : material.content;

        db.prepare(`
            UPDATE materials 
            SET title = ?, description = ?, content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(newTitle, newDesc, newContent, id);

        authService.logAudit(user.id, 'UPDATE_MATERIAL', `Updated material #${id}: ${newTitle}`, ipAddress);
        return this.getMaterialById(id, user.id);
    }

    // CSQP-F-008: Delete Study Material
    deleteMaterial(id, user, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        const material = db.prepare('SELECT * FROM materials WHERE id = ? AND status = ' + "'ACTIVE'").get(id);

        if (!material) throw new Error('Study material not found');

        if (material.contributor_id !== user.id && user.role !== 'Administrator') {
            throw new Error('Forbidden: You are not authorized to delete this material');
        }

        // Soft delete: remove from normal listings (TC-MAT-06)
        db.prepare("UPDATE materials SET status = 'DELETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);

        authService.logAudit(user.id, 'DELETE_MATERIAL', `Deleted material #${id}`, ipAddress);
        return true;
    }

    // CSQP-F-009: Rate Study Material (1-5 scale, duplicate updates previous value)
    rateMaterial(materialId, rating, user, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        const score = Number(rating);

        if (!score || score < 1 || score > 5 || !Number.isInteger(score)) {
            throw new Error('Rating must be an integer between 1 and 5');
        }

        const material = db.prepare("SELECT id FROM materials WHERE id = ? AND status = 'ACTIVE'").get(materialId);
        if (!material) throw new Error('Study material not found');

        // Upsert: replace previous rating on duplicate (TC-MAT-07)
        db.prepare(`
            INSERT INTO ratings (material_id, user_id, rating, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(material_id, user_id) 
            DO UPDATE SET rating = excluded.rating, updated_at = CURRENT_TIMESTAMP
        `).run(materialId, user.id, score);

        authService.logAudit(user.id, 'RATE_MATERIAL', `Rated material #${materialId} with score ${score}`, ipAddress);

        return this.getMaterialById(materialId, user.id);
    }

    // CSQP-F-010: Post Comments and Discussions
    addComment(materialId, commentText, user, ipAddress = '127.0.0.1') {
        const db = this.getDb();

        if (!commentText || !commentText.trim()) {
            throw new Error('Comment cannot be empty');
        }

        const material = db.prepare("SELECT id FROM materials WHERE id = ? AND status = 'ACTIVE'").get(materialId);
        if (!material) throw new Error('Study material not found');

        const insert = db.prepare(`
            INSERT INTO comments (material_id, user_id, comment_text, status)
            VALUES (?, ?, ?, 'ACTIVE')
        `);
        const result = insert.run(materialId, user.id, commentText.trim());

        authService.logAudit(user.id, 'ADD_COMMENT', `Added comment #${result.lastInsertRowid} on material #${materialId}`, ipAddress);

        return db.prepare(`
            SELECT c.id, c.comment_text, c.created_at, u.username as author_name, u.role as author_role
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `).get(result.lastInsertRowid);
    }
}

module.exports = new MaterialService();
