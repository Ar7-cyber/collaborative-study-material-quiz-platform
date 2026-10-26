const bcrypt = require('bcryptjs');
const { getDb } = require('./database');

function seedDatabase(db = getDb()) {
    const saltRounds = 10;

    // Seed default users if not already present
    const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (existingUsers.count === 0) {
        const insertUser = db.prepare(`
            INSERT INTO users (username, password_hash, role, status)
            VALUES (?, ?, ?, 'ACTIVE')
        `);

        // Passwords hashed using bcrypt (CSQP-SR-001)
        insertUser.run('admin_user', bcrypt.hashSync('Admin@1234', saltRounds), 'Administrator');
        insertUser.run('prof_contributor', bcrypt.hashSync('Contrib@1234', saltRounds), 'Content Contributor / Quiz Creator');
        insertUser.run('student_aditya', bcrypt.hashSync('Student@1234', saltRounds), 'Student/User');
        insertUser.run('student_sheiman', bcrypt.hashSync('Student@1234', saltRounds), 'Student/User');
        insertUser.run('student_ahan', bcrypt.hashSync('Student@1234', saltRounds), 'Student/User');
        insertUser.run('lead_amrit', bcrypt.hashSync('Lead@1234', saltRounds), 'Content Contributor / Quiz Creator');
    }

    // Seed default subjects and topics
    const existingSubjects = db.prepare('SELECT COUNT(*) as count FROM subjects').get();
    if (existingSubjects.count === 0) {
        const insertSubject = db.prepare(`
            INSERT INTO subjects (name, code, description) VALUES (?, ?, ?)
        `);
        const insertTopic = db.prepare(`
            INSERT INTO topics (subject_id, name, description) VALUES (?, ?, ?)
        `);

        const seSub = insertSubject.run('Software Engineering', 'CS-SE301', 'Software development lifecycle, requirements, design, architecture and testing');
        insertTopic.run(seSub.lastInsertRowid, 'Requirements Engineering & SRS', 'Functional, Non-functional, and System Requirements');
        insertTopic.run(seSub.lastInsertRowid, 'Software Architecture & SAD', 'Layered, Microservices, and Component Diagrams');
        insertTopic.run(seSub.lastInsertRowid, 'Software Testing & STP', 'Test plans, test cases, RTM, and quality assurance');
        insertTopic.run(seSub.lastInsertRowid, 'Agile & Scrum Sprints', 'Sprint planning, user stories, and GitHub PR workflows');

        const dbSub = insertSubject.run('Database Systems', 'CS-DB202', 'Relational design, normalization, SQL, and indexing');
        insertTopic.run(dbSub.lastInsertRowid, 'SQL Queries & Joins', 'Structured query language and joins');
        insertTopic.run(dbSub.lastInsertRowid, 'Normalization & Schema Design', '1NF, 2NF, 3NF, BCNF');

        const osSub = insertSubject.run('Operating Systems', 'CS-OS204', 'Processes, threads, CPU scheduling, and memory management');
        insertTopic.run(osSub.lastInsertRowid, 'CPU Scheduling Algorithms', 'FCFS, SJF, Round Robin, Priority');
        insertTopic.run(osSub.lastInsertRowid, 'Memory Management & Paging', 'Virtual memory, paging, and replacement algorithms');
    }

    // Seed a couple of initial sample study materials
    const existingMaterials = db.prepare('SELECT COUNT(*) as count FROM materials').get();
    if (existingMaterials.count === 0) {
        const contributor = db.prepare("SELECT id FROM users WHERE role = 'Content Contributor / Quiz Creator' LIMIT 1").get();
        const seTopic = db.prepare("SELECT id, subject_id FROM topics WHERE name = 'Software Architecture & SAD' LIMIT 1").get();

        if (contributor && seTopic) {
            const insertMaterial = db.prepare(`
                INSERT INTO materials (title, description, subject_id, topic_id, contributor_id, content_type, content, status)
                VALUES (?, ?, ?, ?, ?, 'NOTE', ?, 'ACTIVE')
            `);

            const matRes = insertMaterial.run(
                'Layered Architecture Overview & Lab 3 Notes',
                'Comprehensive breakdown of Layered Architecture (Presentation, Business, Data layers) and interface specifications.',
                seTopic.subject_id,
                seTopic.id,
                contributor.id,
                `# Layered Architecture Notes\n\n### 1. Presentation Layer (Web UI)\nHandles client browser interactions, views, input forms, and response rendering.\n\n### 2. Business Layer\nEncapsulates business rules, Authentication & RBAC, Study Material Management, and Quiz engines.\n\n### 3. Data Layer\nProvides persistence via SQLite database and File Storage.`
            );

            // Seed initial version (CSQP-F-011)
            db.prepare(`
                INSERT INTO material_versions (material_id, version_number, title, content, contributor_id, change_summary)
                VALUES (?, 1, ?, ?, ?, 'Initial document creation')
            `).run(matRes.lastInsertRowid, 'Layered Architecture Overview & Lab 3 Notes', 'Initial version notes...', contributor.id);
        }
    }

    // Seed default quiz (TD-QUIZ-01, CSQP-F-013)
    const existingQuizzes = db.prepare('SELECT COUNT(*) as count FROM quizzes').get();
    if (existingQuizzes.count === 0) {
        const creator = db.prepare("SELECT id FROM users WHERE role = 'Content Contributor / Quiz Creator' LIMIT 1").get();
        const seTopic = db.prepare("SELECT id, subject_id FROM topics WHERE name = 'Software Architecture & SAD' LIMIT 1").get();

        if (creator && seTopic) {
            const insertQuiz = db.prepare(`
                INSERT INTO quizzes (title, description, subject_id, topic_id, creator_id, duration_minutes, randomize_questions, instant_results, status)
                VALUES (?, ?, ?, ?, ?, 10, 1, 1, 'PUBLISHED')
            `);

            const qRes = insertQuiz.run(
                'Software Architecture & SAD Assessment Quiz',
                'Test your knowledge on Layered Architecture, Component Modeling, and Interfaces.',
                seTopic.subject_id,
                seTopic.id,
                creator.id
            );
            const quizId = qRes.lastInsertRowid;

            const insertQuestion = db.prepare(`
                INSERT INTO quiz_questions (quiz_id, question_text, question_type, options_json, correct_answer, points, order_num)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            // MCQ
            insertQuestion.run(
                quizId,
                'Which layer in Layered Architecture is responsible for client interaction and response presentation?',
                'MCQ',
                JSON.stringify(['Presentation Layer', 'Business Layer', 'Data Layer', 'Network Layer']),
                'Presentation Layer',
                1,
                1
            );

            // True / False
            insertQuestion.run(
                quizId,
                'Microservices architecture is required for a four-member academic team project according to the SAD.',
                'TRUE_FALSE',
                JSON.stringify(['True', 'False']),
                'False',
                1,
                2
            );

            // Fill-in-the-blank
            insertQuestion.run(
                quizId,
                'In UML component diagrams, a ball notation represents a ________ interface.',
                'FILL_BLANK',
                null,
                'provided',
                1,
                3
            );
        }
    }

    console.log('Database seeded successfully.');
}

if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };
