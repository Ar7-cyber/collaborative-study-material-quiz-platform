const { getDb } = require('../db/database');
const authService = require('./authService');

class AdminService {
    constructor(db = null) {
        this.getDb = () => db || getDb();
    }

    // CSQP-F-020: Manage User Accounts (TC-ADMIN-01)
    getAllUsers() {
        const db = this.getDb();
        return db.prepare(`
            SELECT id, username, role, status, created_at
            FROM users
            ORDER BY id ASC
        `).all();
    }

    updateUserStatus(userId, status, adminUser, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        if (!['ACTIVE', 'DISABLED'].includes(status)) {
            throw new Error('Invalid status. Allowed values: ACTIVE, DISABLED');
        }

        if (userId === adminUser.id && status === 'DISABLED') {
            throw new Error('Administrators cannot disable their own active account');
        }

        db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId);

        // Invalidate sessions if user is disabled
        if (status === 'DISABLED') {
            db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
        }

        authService.logAudit(adminUser.id, 'ADMIN_UPDATE_USER_STATUS', `Set status of user #${userId} to '${status}'`, ipAddress);
        return true;
    }

    updateUserRole(userId, newRole, adminUser, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        const validRoles = ['Student/User', 'Content Contributor / Quiz Creator', 'Administrator'];
        if (!validRoles.includes(newRole)) {
            throw new Error(`Invalid role '${newRole}'`);
        }

        db.prepare('UPDATE users SET role = ? WHERE id = ?').run(newRole, userId);
        authService.logAudit(adminUser.id, 'ADMIN_CHANGE_USER_ROLE', `Changed role of user #${userId} to '${newRole}'`, ipAddress);
        return true;
    }

    // CSQP-F-021: Content Moderation for Materials and Comments (TC-ADMIN-02)
    moderateMaterial(materialId, newStatus, adminUser, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        if (!['ACTIVE', 'FLAGGED', 'DELETED'].includes(newStatus)) {
            throw new Error('Invalid status. Allowed values: ACTIVE, FLAGGED, DELETED');
        }

        db.prepare('UPDATE materials SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, materialId);
        authService.logAudit(adminUser.id, 'ADMIN_MODERATE_MATERIAL', `Set material #${materialId} status to '${newStatus}'`, ipAddress);
        return true;
    }

    moderateComment(commentId, newStatus, adminUser, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        if (!['ACTIVE', 'FLAGGED', 'DELETED'].includes(newStatus)) {
            throw new Error('Invalid status. Allowed values: ACTIVE, FLAGGED, DELETED');
        }

        db.prepare('UPDATE comments SET status = ? WHERE id = ?').run(newStatus, commentId);
        authService.logAudit(adminUser.id, 'ADMIN_MODERATE_COMMENT', `Set comment #${commentId} status to '${newStatus}'`, ipAddress);
        return true;
    }

    // CSQP-F-022: Tamper-proof Audit Log Inspection (TC-SEC-01)
    getAuditLogs(limit = 50) {
        const db = this.getDb();
        return db.prepare(`
            SELECT a.id, a.user_id, a.action, a.details, a.ip_address, a.created_at, u.username
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT ?
        `).all(limit);
    }
}

module.exports = new AdminService();
