const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getDb } = require('../db/database');

const VALID_ROLES = [
    'Student/User',
    'Content Contributor / Quiz Creator',
    'Administrator'
];

class AuthService {
    constructor(db = null) {
        this.getDb = () => db || getDb();
    }

    register(username, password, role = 'Student/User', ipAddress = '127.0.0.1') {
        const db = this.getDb();

        if (!username || typeof username !== 'string' || username.trim().length < 3) {
            throw new Error('Username must be at least 3 characters long');
        }

        if (!password || typeof password !== 'string' || password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        const normalizedRole = VALID_ROLES.includes(role) ? role : 'Student/User';

        const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.trim());
        if (existing) {
            throw new Error('Username is already taken');
        }

        // CSQP-SR-001: Store only secure one-way password hash
        const passwordHash = bcrypt.hashSync(password, 10);

        const insert = db.prepare(`
            INSERT INTO users (username, password_hash, role, status)
            VALUES (?, ?, ?, 'ACTIVE')
        `);
        const result = insert.run(username.trim(), passwordHash, normalizedRole);
        const userId = result.lastInsertRowid;

        // CSQP-F-022: Audit log without passwords
        this.logAudit(userId, 'USER_REGISTER', `New user registered with role: ${normalizedRole}`, ipAddress);

        return {
            id: userId,
            username: username.trim(),
            role: normalizedRole,
            status: 'ACTIVE'
        };
    }

    login(username, password, ipAddress = '127.0.0.1') {
        const db = this.getDb();

        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim());
        if (!user) {
            this.logAudit(null, 'LOGIN_FAILED', `Failed attempt for unknown username: ${username}`, ipAddress);
            throw new Error('Invalid username or password');
        }

        if (user.status !== 'ACTIVE') {
            this.logAudit(user.id, 'LOGIN_BLOCKED', 'Inactive or disabled account attempted login', ipAddress);
            throw new Error('Account is disabled. Contact system administrator.');
        }

        const isValidPassword = bcrypt.compareSync(password, user.password_hash);
        if (!isValidPassword) {
            this.logAudit(user.id, 'LOGIN_FAILED', 'Invalid password supplied', ipAddress);
            throw new Error('Invalid username or password');
        }

        // CSQP-SR-005: Create secure session with expiration
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        db.prepare(`
            INSERT INTO sessions (token, user_id, expires_at)
            VALUES (?, ?, ?)
        `).run(token, user.id, expiresAt);

        this.logAudit(user.id, 'LOGIN_SUCCESS', 'User logged in successfully', ipAddress);

        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                status: user.status
            }
        };
    }

    logout(token, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        if (!token) return true;

        const session = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token);
        if (session) {
            this.logAudit(session.user_id, 'LOGOUT', 'User logged out and session invalidated', ipAddress);
            db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
        }
        return true;
    }

    validateSession(token) {
        if (!token) return null;
        const db = this.getDb();

        const row = db.prepare(`
            SELECT s.token, s.expires_at, u.id, u.username, u.role, u.status
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
        `).get(token);

        if (!row) {
            return null;
        }

        if (row.status !== 'ACTIVE') {
            db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
            return null;
        }

        return {
            id: row.id,
            username: row.username,
            role: row.role,
            status: row.status
        };
    }

    logAudit(userId, action, details, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        try {
            db.prepare(`
                INSERT INTO audit_logs (user_id, action, details, ip_address)
                VALUES (?, ?, ?, ?)
            `).run(userId, action, details, ipAddress);
        } catch (err) {
            console.error('Audit log error:', err.message);
        }
    }
}

module.exports = new AuthService();
