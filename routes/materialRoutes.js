const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const materialService = require('../services/materialService');
const versionService = require('../services/versionService');
const adminService = require('../services/adminService');
const { requireAuth, requireRole, authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// CSQP-F-005: Browse Subject & Topic Hierarchy
router.get('/hierarchy', (req, res) => {
    try {
        const hierarchy = materialService.getSubjectsAndTopics();
        res.json({ subjects: hierarchy });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CSQP-F-006: Search & Filter Study Material
router.get('/', (req, res) => {
    try {
        const { search, subject_id, topic_id, contributor } = req.query;
        const materials = materialService.searchMaterials({
            search,
            subject_id,
            topic_id,
            contributor
        });
        res.json({ materials, count: materials.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single material details
router.get('/:id', authenticate, (req, res) => {
    try {
        const material = materialService.getMaterialById(Number(req.params.id), req.user?.id);
        if (!material) {
            return res.status(404).json({ error: 'Study material not found' });
        }
        res.json({ material });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CSQP-F-007: Download Available Study Material (TC-MAT-05)
router.get('/:id/download', authenticate, (req, res) => {
    try {
        const material = materialService.getMaterialById(Number(req.params.id), req.user?.id);
        if (!material) {
            return res.status(404).json({ error: 'Study material not found' });
        }

        if (material.content_type === 'DOCUMENT') {
            const filePath = path.join(__dirname, '..', 'uploads', material.file_path);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ error: 'Stored document file not found on server' });
            }
            res.setHeader('Content-Disposition', `attachment; filename="${material.file_name}"`);
            res.setHeader('Content-Type', material.mime_type || 'application/octet-stream');
            return fs.createReadStream(filePath).pipe(res);
        } else {
            // For in-platform note, generate a downloadable text/markdown file
            const safeTitle = material.title.replace(/[^a-zA-Z0-9_-]/g, '_');
            res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_notes.md"`);
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            return res.send(material.content || '');
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CSQP-F-004: Create Study Notes Directly Within Platform (TC-MAT-02)
router.post('/note', requireAuth, requireRole('Content Contributor / Quiz Creator', 'Administrator'), (req, res) => {
    try {
        const { title, description, subject_id, topic_id, content } = req.body;
        const note = materialService.createNote({
            title,
            description,
            subject_id,
            topic_id,
            content
        }, req.user, req.ip);

        res.status(201).json({
            message: 'Study note created successfully',
            material: note
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// CSQP-F-003: Upload Study Notes and PDF Documents with Validation (TC-MAT-01)
router.post('/upload', requireAuth, requireRole('Content Contributor / Quiz Creator', 'Administrator'), (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        try {
            const { title, description, subject_id, topic_id } = req.body;
            const doc = materialService.uploadDocument({
                title,
                description,
                subject_id,
                topic_id
            }, req.file, req.user, req.ip);

            res.status(201).json({
                message: 'Document uploaded successfully',
                material: doc
            });
        } catch (innerErr) {
            // Cleanup uploaded file if metadata failed
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(400).json({ error: innerErr.message });
        }
    });
});

// CSQP-F-008: Edit Study Material (TC-MAT-06)
router.put('/:id', requireAuth, requireRole('Content Contributor / Quiz Creator', 'Administrator'), (req, res) => {
    try {
        const { title, description, content } = req.body;
        const updated = materialService.updateMaterial(Number(req.params.id), {
            title,
            description,
            content
        }, req.user, req.ip);

        res.json({
            message: 'Study material updated successfully',
            material: updated
        });
    } catch (err) {
        const status = err.message.startsWith('Forbidden') ? 403 : 400;
        res.status(status).json({ error: err.message });
    }
});

// CSQP-F-008: Delete Study Material (TC-MAT-06)
router.delete('/:id', requireAuth, requireRole('Content Contributor / Quiz Creator', 'Administrator'), (req, res) => {
    try {
        materialService.deleteMaterial(Number(req.params.id), req.user, req.ip);
        res.json({ message: 'Study material deleted successfully' });
    } catch (err) {
        const status = err.message.startsWith('Forbidden') ? 403 : 400;
        res.status(status).json({ error: err.message });
    }
});

// CSQP-F-009: Rate Study Material (TC-MAT-07)
router.post('/:id/rate', requireAuth, (req, res) => {
    try {
        const { rating } = req.body;
        const updated = materialService.rateMaterial(Number(req.params.id), rating, req.user, req.ip);
        res.json({
            message: 'Rating recorded successfully',
            average_rating: updated.average_rating,
            rating_count: updated.rating_count,
            user_rating: updated.user_rating
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// CSQP-F-010: Post Comments and Discussions (TC-MAT-08)
router.post('/:id/comments', requireAuth, (req, res) => {
    try {
        const { comment_text } = req.body;
        const comment = materialService.addComment(Number(req.params.id), comment_text, req.user, req.ip);
        res.status(201).json({
            message: 'Comment posted successfully',
            comment
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// CSQP-AM-06: Authenticated users can flag materials and comments for review.
router.post('/:id/flag', requireAuth, (req, res) => {
    try {
        const result = adminService.flagMaterial(Number(req.params.id), req.user, req.body.reason);
        res.status(201).json({ message: 'Material reported for moderation', ...result });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/:materialId/comments/:commentId/flag', requireAuth, (req, res) => {
    try {
        const result = adminService.flagComment(Number(req.params.commentId), req.user, req.body.reason);
        res.status(201).json({ message: 'Comment reported for moderation', ...result });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// CSQP-F-011: Version History for Study Material (TC-MAT-09)
router.get('/:id/versions', authenticate, (req, res) => {
    try {
        const versions = versionService.getVersionHistory(Number(req.params.id));
        res.json({ versions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CSQP-F-012: Controlled Collaborative Revision Updates (TC-COL-01)
router.post('/:id/versions', requireAuth, requireRole('Content Contributor / Quiz Creator', 'Administrator'), (req, res) => {
    try {
        const { title, content, change_summary } = req.body;
        const revision = versionService.createRevision(Number(req.params.id), {
            title,
            content,
            change_summary
        }, req.user, req.ip);

        res.status(201).json({
            message: 'Collaborative revision saved successfully',
            revision
        });
    } catch (err) {
        const status = err.message.startsWith('Forbidden') ? 403 : 400;
        res.status(status).json({ error: err.message });
    }
});

// CSQP-F-013: Rollback to Prior Version
router.post('/:id/rollback/:version', requireAuth, requireRole('Content Contributor / Quiz Creator', 'Administrator'), (req, res) => {
    try {
        const rollback = versionService.rollbackToVersion(Number(req.params.id), Number(req.params.version), req.user, req.ip);
        res.json({
            message: `Successfully rolled back to version v${req.params.version}`,
            rollback
        });
    } catch (err) {
        const status = err.message.startsWith('Forbidden') ? 403 : 400;
        res.status(status).json({ error: err.message });
    }
});

module.exports = router;
