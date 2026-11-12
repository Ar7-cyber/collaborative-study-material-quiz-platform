const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const { getDb } = require('../db/database');
const { seedDatabase } = require('../db/seed');

describe('System Health & Deployment Readiness Test Suite', () => {
    let db;

    before(() => {
        db = getDb();
        seedDatabase();
    });

    test('TC-SYS-01: SQLite storage engine verifies relational schema and foreign keys', () => {
        const fk = db.prepare('PRAGMA foreign_keys').get();
        assert.ok(fk.foreign_keys === 1, 'Foreign keys must be enabled for referential integrity');

        const tables = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table'").get();
        assert.ok(tables.count >= 8, 'All application relational tables must be successfully initialized');
    });

    test('TC-SYS-02: Initial seed catalog contains valid academic subjects and syllabus topics', () => {
        const subjects = db.prepare('SELECT * FROM subjects ORDER BY id ASC').all();
        assert.ok(subjects.length >= 3, 'Must seed core subjects: Web Tech, Operating Systems, Computer Networks');

        const topics = db.prepare('SELECT * FROM topics').all();
        assert.ok(topics.length >= 6, 'Must seed topics linked to academic curriculum');
    });

    test('TC-SYS-03: System audit log subsystem ready and capable of recording audit trails', () => {
        const authService = require('../services/authService');
        const user = db.prepare("SELECT id FROM users WHERE role = 'Administrator'").get();
        assert.ok(user, 'Admin user must exist in seeded environment');

        authService.logAudit(user.id, 'HEALTH_PROBE', 'Automated health probe ping', '127.0.0.1');
        const latest = db.prepare("SELECT * FROM audit_logs WHERE action = 'HEALTH_PROBE' ORDER BY id DESC LIMIT 1").get();
        assert.ok(latest, 'Audit trail entry must be recorded');
        assert.strictEqual(latest.user_id, user.id);
    });
});
