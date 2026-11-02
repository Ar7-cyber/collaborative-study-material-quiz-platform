const express = require('express');
const router = express.Router();
const adminService = require('../services/adminService');
const { requireAuth, requireRole } = require('../middleware/auth');
router.use(requireAuth, requireRole('Administrator'));

router.get('/users', (req, res) => { try { res.json({ users: adminService.getAllUsers() }); } catch (e) { res.status(500).json({ error: e.message }); } });
router.patch('/users/:id/status', (req, res) => { try { adminService.updateUserStatus(Number(req.params.id), req.body.status, req.user, req.ip); res.json({ message: 'User status updated successfully' }); } catch (e) { res.status(400).json({ error: e.message }); } });
router.patch('/users/:id/role', (req, res) => { try { adminService.updateUserRole(Number(req.params.id), req.body.role, req.user, req.ip); res.json({ message: 'User role updated successfully' }); } catch (e) { res.status(400).json({ error: e.message }); } });

router.get('/moderation-queue', (req, res) => { try { res.json(adminService.getModerationQueue()); } catch (e) { res.status(500).json({ error: e.message }); } });
router.patch('/materials/:id/moderate', (req, res) => { try { adminService.moderateMaterial(Number(req.params.id), req.body.status, req.user, req.ip); res.json({ message: 'Material moderation status updated' }); } catch (e) { res.status(400).json({ error: e.message }); } });
router.patch('/comments/:id/moderate', (req, res) => { try { adminService.moderateComment(Number(req.params.id), req.body.status, req.user, req.ip); res.json({ message: 'Comment moderation status updated' }); } catch (e) { res.status(400).json({ error: e.message }); } });

router.get('/audit-logs', (req, res) => { try { res.json({ logs: adminService.getAuditLogs(req.query.limit || 50), integrity: adminService.verifyAuditIntegrity() }); } catch (e) { res.status(500).json({ error: e.message }); } });
router.get('/audit-logs/verify', (req, res) => { try { const result = adminService.verifyAuditIntegrity(); res.status(result.valid ? 200 : 409).json(result); } catch (e) { res.status(500).json({ error: e.message }); } });
router.get('/audit-logs/export', (req, res) => {
    try {
        const logs = adminService.getAuditLogs(10000).reverse();
        const columns = ['id', 'created_at', 'username', 'user_id', 'action', 'details', 'ip_address', 'previous_hash', 'record_hash'];
        const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const csv = [columns.join(','), ...logs.map(row => columns.map(key => escape(row[key])).join(','))].join('\r\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="csqp-audit-logs.csv"');
        res.send(csv);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
