const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const { getDb } = require('../db/database');
const authService = require('../services/authService');
const materialService = require('../services/materialService');
const versionService = require('../services/versionService');
const quizService = require('../services/quizService');
const adminService = require('../services/adminService');

describe('Sprint 2 Quality Suite: Collaboration, Quiz Engine, Admin & Security', () => {
    let studentUser, contributorUser1, contributorUser2, adminUser;
    let subjectId, topicId, materialId, quizId;

    before(() => {
        const db = getDb();
        studentUser = authService.register('student_sprint2', 'Student@123', 'Student/User');
        contributorUser1 = authService.register('contrib_sprint2_a', 'Contrib@123', 'Content Contributor / Quiz Creator');
        contributorUser2 = authService.register('contrib_sprint2_b', 'Contrib@123', 'Content Contributor / Quiz Creator');
        adminUser = authService.register('admin_sprint2', 'Admin@123', 'Administrator');

        const sub = db.prepare('INSERT INTO subjects (name, code, description) VALUES (?, ?, ?)').run(
            'Algorithms & Complexity', 'CS-AL301', 'Algorithm design and analysis'
        );
        subjectId = sub.lastInsertRowid;

        const top = db.prepare('INSERT INTO topics (subject_id, name, description) VALUES (?, ?, ?)').run(
            subjectId, 'Dynamic Programming', 'Optimal substructure and memoization'
        );
        topicId = top.lastInsertRowid;

        const note = materialService.createNote({
            title: 'Dynamic Programming Foundations',
            description: 'Memoization vs Tabulation guide',
            subject_id: subjectId,
            topic_id: topicId,
            content: 'Initial notes on Fibonacci DP.'
        }, contributorUser1);
        materialId = note.id;
    });

    // CSQP-F-011 & CSQP-F-012: Collaborative Editing & Versioning (TC-MAT-09, TC-COL-01)
    test('TC-COL-01 & TC-MAT-09: Multiple authorized contributors collaborate and create version history', () => {
        // Contributor 2 submits revision 2
        const rev2 = versionService.createRevision(materialId, {
            title: 'Dynamic Programming Foundations (v2)',
            content: 'Added Longest Common Subsequence formula.',
            change_summary: 'Added LCS explanation'
        }, contributorUser2);

        assert.strictEqual(rev2.version_number, 2);
        assert.strictEqual(rev2.contributor_name, contributorUser2.username);

        // Contributor 1 submits revision 3
        const rev3 = versionService.createRevision(materialId, {
            title: 'Dynamic Programming Foundations (v3)',
            content: 'Added 0/1 Knapsack problem details.',
            change_summary: 'Added Knapsack algorithm'
        }, contributorUser1);

        assert.strictEqual(rev3.version_number, 3);

        // Fetch version history (TC-MAT-09)
        const history = versionService.getVersionHistory(materialId);
        assert.ok(history.length >= 2, 'Should maintain distinct version sequence');
        assert.strictEqual(history[0].version_number, 3);
        assert.strictEqual(history[1].version_number, 2);
    });

    // CSQP-F-013 & CSQP-F-014: Quiz Builder with MCQ, True/False, and Fill-in-the-blank (TC-QUIZ-01, TC-QUIZ-02)
    test('TC-QUIZ-01 & TC-QUIZ-02: Create quiz with supported question types, duration and randomization', () => {
        const quiz = quizService.createQuiz({
            title: 'Dynamic Programming Mastery Quiz',
            description: 'Test memoization and optimal substructure concepts',
            subject_id: subjectId,
            topic_id: topicId,
            duration_minutes: 15,
            randomize_questions: 1,
            instant_results: 1,
            questions: [
                {
                    type: 'MCQ',
                    question: 'What is the time complexity of naive recursive Fibonacci vs DP Fibonacci?',
                    options: ['O(2^n) vs O(n)', 'O(n) vs O(1)', 'O(n^2) vs O(n)', 'O(log n) vs O(n)'],
                    correct_answer: 'O(2^n) vs O(n)',
                    points: 2
                },
                {
                    type: 'TRUE_FALSE',
                    question: 'Dynamic programming requires optimal substructure and overlapping subproblems.',
                    correct_answer: 'True',
                    points: 1
                },
                {
                    type: 'FILL_BLANK',
                    question: 'The top-down approach in dynamic programming is also known as ________.',
                    correct_answer: 'memoization',
                    points: 2
                }
            ]
        }, contributorUser1);

        assert.ok(quiz.id, 'Quiz ID must be generated');
        assert.strictEqual(quiz.questions.length, 3);
        assert.strictEqual(quiz.duration_minutes, 15);
        quizId = quiz.id;
    });

    // CSQP-F-015, CSQP-F-016 & CSQP-SR-006: Quiz Attempt, Server-Side Auto-Evaluation & Anti-Tamper (TC-QUIZ-03, TC-QUIZ-04, TC-SEC-07)
    test('TC-QUIZ-03, TC-QUIZ-04, TC-QUIZ-05: Attempt quiz, evaluate known answers, and verify instant results', () => {
        const attemptQuiz = quizService.getQuizForAttempt(quizId);
        assert.strictEqual(attemptQuiz.questions.length, 3);
        // Correct answers must NOT be exposed in student attempt payload (CSQP-SR-006)
        attemptQuiz.questions.forEach(q => {
            assert.strictEqual(q.correct_answer, undefined, 'Correct answers must remain hidden on attempt retrieval');
        });

        // Submit known answers: 2 correct, 1 wrong
        const answers = {};
        const qMcq = attemptQuiz.questions.find(q => q.question_type === 'MCQ');
        const qTf = attemptQuiz.questions.find(q => q.question_type === 'TRUE_FALSE');
        const qFill = attemptQuiz.questions.find(q => q.question_type === 'FILL_BLANK');

        answers[qMcq.id] = 'O(2^n) vs O(n)'; // Correct (2 pts)
        answers[qTf.id] = 'True';           // Correct (1 pt)
        answers[qFill.id] = 'tabulation';   // Wrong (0 pts, expected memoization)

        const evalResult = quizService.evaluateAttempt(quizId, {
            answers,
            time_taken_seconds: 45
        }, studentUser);

        assert.strictEqual(evalResult.score, 3, 'Calculated score should be 3/5');
        assert.strictEqual(evalResult.max_score, 5);
        assert.strictEqual(evalResult.percentage, 60.0);
        assert.strictEqual(evalResult.time_taken_seconds, 45);
        assert.strictEqual(evalResult.instant_results, true);
    });

    // CSQP-F-018: Quiz Attempt History Archive (TC-QUIZ-06)
    test('TC-QUIZ-06: Student quiz history archive contains completed attempt', () => {
        const history = quizService.getUserQuizHistory(studentUser.id);
        assert.ok(history.length >= 1, 'Attempt should appear in student history');
        assert.strictEqual(history[0].quiz_id, quizId);
        assert.strictEqual(history[0].score, 3);
    });

    // CSQP-F-019: Dynamic Leaderboard (TC-QUIZ-07)
    test('TC-QUIZ-07: Dynamic leaderboard ranks attempts by score and time', () => {
        const leaderboard = quizService.getLeaderboard(quizId);
        assert.ok(leaderboard.length >= 1, 'Leaderboard must contain at least 1 attempt');
        assert.strictEqual(leaderboard[0].username, studentUser.username);
        assert.strictEqual(leaderboard[0].rank, 1);
    });

    // CSQP-F-020: Admin User Management (TC-ADMIN-01)
    test('TC-ADMIN-01: Admin can update user role and account status', () => {
        const users = adminService.getAllUsers();
        assert.ok(users.length >= 4);

        // Change role of studentUser
        adminService.updateUserRole(studentUser.id, 'Content Contributor / Quiz Creator', adminUser);
        const updatedUser = getDb().prepare('SELECT role FROM users WHERE id = ?').get(studentUser.id);
        assert.strictEqual(updatedUser.role, 'Content Contributor / Quiz Creator');

        // Toggle status to DISABLED
        adminService.updateUserStatus(studentUser.id, 'DISABLED', adminUser);
        const disabledUser = getDb().prepare('SELECT status FROM users WHERE id = ?').get(studentUser.id);
        assert.strictEqual(disabledUser.status, 'DISABLED');

        // Reactivate
        adminService.updateUserStatus(studentUser.id, 'ACTIVE', adminUser);
        const activeUser = getDb().prepare('SELECT status FROM users WHERE id = ?').get(studentUser.id);
        assert.strictEqual(activeUser.status, 'ACTIVE');
    });

    // CSQP-F-021: Admin Content Moderation (TC-ADMIN-02)
    test('TC-ADMIN-02: Admin can moderate study material status', () => {
        adminService.moderateMaterial(materialId, 'FLAGGED', adminUser);
        const flagged = getDb().prepare('SELECT status FROM materials WHERE id = ?').get(materialId);
        assert.strictEqual(flagged.status, 'FLAGGED');

        // Reset to ACTIVE
        adminService.moderateMaterial(materialId, 'ACTIVE', adminUser);
    });

    // CSQP-F-022: Tamper-proof Audit Log (TC-SEC-01)
    test('TC-SEC-01: Audit log records important actions without plaintext passwords', () => {
        const logs = adminService.getAuditLogs(10);
        assert.ok(logs.length >= 1, 'Audit logs must exist');
        logs.forEach(entry => {
            assert.ok(!entry.details || !entry.details.includes('Admin@123'), 'Passwords must never appear in logs');
            assert.ok(entry.action, 'Action must be recorded');
            assert.ok(entry.created_at, 'Timestamp must be recorded');
        });
    });
});
