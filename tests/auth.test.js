const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const authService = require('../services/authService');
const { getDb } = require('../db/database');

test('registration stores a bcrypt password hash', () => {
    const username = `test_student_${Date.now()}`;

    const user = authService.register(username, 'password123');
    const db = getDb();

    const stored = db.prepare(
        'SELECT password_hash, role FROM users WHERE id = ?'
    ).get(user.id);

    assert.ok(stored);
    assert.ok(bcrypt.compareSync('password123', stored.password_hash));
    assert.notEqual(stored.password_hash, 'password123');
    assert.equal(stored.role, 'Student/User');
});

test('registration rejects duplicate usernames', () => {
    const username = `duplicate_student_${Date.now()}`;

    authService.register(username, 'password123');

    assert.throws(
        () => authService.register(username, 'anotherpass'),
        /already taken/i
    );
});

test('login creates a session and logout invalidates it', () => {
    const username = `session_student_${Date.now()}`;

    authService.register(username, 'password123');

    const result = authService.login(username, 'password123');

    assert.ok(result.token);

    const sessionUser = authService.validateSession(result.token);

    assert.ok(sessionUser);
    assert.equal(sessionUser.username, username);

    authService.logout(result.token);

    assert.equal(authService.validateSession(result.token), null);
});
