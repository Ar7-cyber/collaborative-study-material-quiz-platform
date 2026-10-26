const express = require('express');
const router = express.Router();
const adminService = require('../services/adminService');
const { requireAuth, requireRole } = require('../middleware/auth');

// All admin routes strictly enforce Administrator role (CSQP-SR-003, TC-SEC-04)
router.use(requireAuth, requireRole('Administrator'));

// CSQP-F-020: Manage User Accounts (TC-ADMIN-01)
router.get('/users', (req, res) => {
    try {
        const users = adminService.getAllUsers();
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/users/:id/status', (req, res) => {
    try {
        const { status } = req.body;
        adminService.updateUserStatus(Number(req.params.id), status, req.user, req.ip);
        res.json({ message: 'User status updated successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.patch('/users/:id/role', (req, res) => {
    try {
        const { role } = req.body;
        adminService.updateUserRole(Number(req.params.id), role, req.user, req.ip);
        res.json({ message: 'User role updated successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// CSQP-F-021: Content Moderation (TC-ADMIN-02)
router.patch('/materials/:id/moderate', (req, res) => {
    try {
        const { status } = req.body;
        adminService.moderateMaterial(Number(req.params.id), status, req.user, req.ip);
        res.json({ message: 'Material moderation status updated' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.patch('/comments/:id/moderate', (req, res) => {
    try {
        const { status } = req.body;
        adminService.moderateComment(Number(req.params.id), status, req.user, req.ip);
        res.json({ message: 'Comment moderation status updated' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// CSQP-F-022: Tamper-proof Audit Log Inspection (TC-SEC-01)
router.get('/audit-logs', (req, res) => {
    try {
        const limit = Number(req.query.limit) || 50;
        const logs = adminService.getAuditLogs(limit);
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
