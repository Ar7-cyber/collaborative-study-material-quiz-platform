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
