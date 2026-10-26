const test = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');

test('database schema creates the required tables', () => {
    const db = new Database(':memory:');

    try {
        db.pragma('foreign_keys = ON');

        const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        db.exec(schema);

        const tables = db.prepare(`
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
        `).all().map(row => row.name);

        for (const table of [
            'users',
            'sessions',
            'subjects',
            'topics',
            'materials',
            'ratings',
            'comments',
            'audit_logs',
            'material_versions',
            'quizzes',
            'quiz_questions',
            'quiz_attempts'
        ]) {
            assert.ok(tables.includes(table), `Expected table "${table}" to exist`);
        }
    } finally {
        db.close();
    }
});

test('users table rejects duplicate usernames', () => {
    const db = new Database(':memory:');

    try {
        db.exec(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK (
                    role IN (
                        'Student/User',
                        'Content Contributor / Quiz Creator',
                        'Administrator'
                    )
                )
            )
        `);

        const insert = db.prepare(`
            INSERT INTO users (username, password_hash, role)
            VALUES (?, ?, ?)
        `);

        insert.run('student_test', 'test_hash', 'Student/User');

        assert.throws(() => {
            insert.run('student_test', 'another_hash', 'Student/User');
        });
    } finally {
        db.close();
    }
});
