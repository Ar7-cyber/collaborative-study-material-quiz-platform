const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { getDb } = require('../db/database');
const authService = require('../services/authService');
const bcrypt = require('bcryptjs');

describe('Authentication & RBAC Test Suite (Amrit & Sheiman - Sprint 1)', () => {
    let testDb;

    before(() => {
        testDb = getDb(':memory:');
    });

    test('TC-AUTH-01: Valid user registration and authentication succeeds', () => {
        const user = authService.register('test_student_1', 'SecurePass@123', 'Student/User');
        assert.ok(user.id, 'User ID should be generated');
        assert.strictEqual(user.username, 'test_student_1');
        assert.strictEqual(user.role, 'Student/User');

        const loginResult = authService.login('test_student_1', 'SecurePass@123');
        assert.ok(loginResult.token, 'Session token should be returned');
        assert.strictEqual(loginResult.user.username, 'test_student_1');
    });

    test('TC-AUTH-01: Invalid password is rejected', () => {
        assert.throws(() => {
            authService.login('test_student_1', 'WrongPassword');
        }, /Invalid username or password/);
    });

    test('TC-AUTH-01: Unknown username is rejected', () => {
        assert.throws(() => {
            authService.login('non_existent_user', 'AnyPassword');
        }, /Invalid username or password/);
    });

    test('TC-SEC-02: Inspect password database - no plaintext passwords stored (CSQP-SR-001)', () => {
        const db = authService.getDb();
        const row = db.prepare('SELECT password_hash FROM users WHERE username = ?').get('test_student_1');
        assert.ok(row, 'User record must exist in DB');
        assert.notStrictEqual(row.password_hash, 'SecurePass@123', 'Password must NOT be plaintext');
        assert.ok(row.password_hash.startsWith('$2'), 'Password must be a bcrypt hash');
        assert.strictEqual(bcrypt.compareSync('SecurePass@123', row.password_hash), true);
    });

    test('TC-SEC-06: Session logout invalidates session token (CSQP-SR-005)', () => {
        const login = authService.login('test_student_1', 'SecurePass@123');
        const token = login.token;

        const validSession = authService.validateSession(token);
        assert.ok(validSession, 'Session should be valid before logout');

        authService.logout(token);

        const invalidSession = authService.validateSession(token);
        assert.strictEqual(invalidSession, null, 'Session must be null after logout');
    });

    test('TC-AUTH-02: Role-based permissions enforcement (CSQP-F-002)', () => {
        const contrib = authService.register('test_contrib_1', 'ContribPass@123', 'Content Contributor / Quiz Creator');
        const admin = authService.register('test_admin_1', 'AdminPass@123', 'Administrator');

        assert.strictEqual(contrib.role, 'Content Contributor / Quiz Creator');
        assert.strictEqual(admin.role, 'Administrator');
    });
});
