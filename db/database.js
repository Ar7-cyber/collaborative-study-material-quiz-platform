const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.NODE_ENV === 'test'
    ? ':memory:'
    : path.join(__dirname, '..', 'data', 'csqp.db');

let dbInstance = null;

function getDb(customPath = null) {
    if (customPath) {
        const db = new Database(customPath);
        initSchema(db);
        return db;
    }

    if (!dbInstance) {
        const targetPath = DB_PATH;
        if (targetPath !== ':memory:') {
            const dataDir = path.dirname(targetPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
        }
        dbInstance = new Database(targetPath);
        dbInstance.pragma('foreign_keys = ON');
        initSchema(dbInstance);
    }
    return dbInstance;
}

function initSchema(db) {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schemaSql);
    // Backward-compatible migration for databases created before hash chaining.
    const auditColumns = db.prepare('PRAGMA table_info(audit_logs)').all().map(column => column.name);
    if (!auditColumns.includes('previous_hash')) db.exec('ALTER TABLE audit_logs ADD COLUMN previous_hash TEXT');
    if (!auditColumns.includes('record_hash')) db.exec('ALTER TABLE audit_logs ADD COLUMN record_hash TEXT');
    backfillAuditHashes(db);
}

function backfillAuditHashes(db) {
    const crypto = require('crypto');
    const rows = db.prepare('SELECT id, user_id, action, details, ip_address, created_at, previous_hash, record_hash FROM audit_logs ORDER BY id ASC').all();
    let previousHash = 'GENESIS';
    const update = db.prepare('UPDATE audit_logs SET previous_hash = ?, record_hash = ? WHERE id = ?');
    const hashRecord = row => crypto.createHash('sha256').update(JSON.stringify({
        id: row.id, user_id: row.user_id, action: row.action, details: row.details,
        ip_address: row.ip_address, created_at: row.created_at, previous_hash: previousHash
    })).digest('hex');
    for (const row of rows) {
        if (row.record_hash && row.previous_hash) {
            previousHash = row.record_hash;
            continue;
        }
        const recordHash = hashRecord(row);
        update.run(previousHash, recordHash, row.id);
        previousHash = recordHash;
    }
}

function closeDb() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}

module.exports = {
    getDb,
    closeDb,
    initSchema
};
