-- Collaborative Study Material & Quiz Platform (CSQP)
-- Database Schema for SQLite

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Student/User', 'Content Contributor / Quiz Creator', 'Administrator')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    UNIQUE(subject_id, name)
);

CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    contributor_id INTEGER NOT NULL REFERENCES users(id),
    content_type TEXT NOT NULL CHECK(content_type IN ('NOTE', 'DOCUMENT')),
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER DEFAULT 0,
    mime_type TEXT,
    content TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'FLAGGED', 'DELETED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'FLAGGED', 'DELETED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sprint 2 Tables: Collaboration & Versioning (CSQP-F-011, CSQP-F-012)
CREATE TABLE IF NOT EXISTS material_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    contributor_id INTEGER NOT NULL REFERENCES users(id),
    change_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sprint 2 Tables: Quiz Engine (CSQP-F-013 .. CSQP-F-019)
CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    creator_id INTEGER NOT NULL REFERENCES users(id),
    duration_minutes INTEGER NOT NULL DEFAULT 10,
    randomize_questions INTEGER NOT NULL DEFAULT 1 CHECK(randomize_questions IN (0, 1)),
    instant_results INTEGER NOT NULL DEFAULT 1 CHECK(instant_results IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK(status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK(question_type IN ('MCQ', 'TRUE_FALSE', 'FILL_BLANK')),
    options_json TEXT, -- JSON string array of choices for MCQ
    correct_answer TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 1,
    order_num INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER NOT NULL DEFAULT 0,
    percentage REAL NOT NULL DEFAULT 0.0,
    time_taken_seconds INTEGER NOT NULL DEFAULT 0,
    responses_json TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_materials_subject_topic ON materials(subject_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_materials_contributor ON materials(contributor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_material ON comments(material_id);
CREATE INDEX IF NOT EXISTS idx_ratings_material ON ratings(material_id);
CREATE INDEX IF NOT EXISTS idx_material_versions_material ON material_versions(material_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user ON quiz_attempts(quiz_id, user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_score ON quiz_attempts(score DESC, time_taken_seconds ASC);
