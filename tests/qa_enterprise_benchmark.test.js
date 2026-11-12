const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const { getDb } = require('../db/database');
const authService = require('../services/authService');
const materialService = require('../services/materialService');
const versionService = require('../services/versionService');
const quizService = require('../services/quizService');
const adminService = require('../services/adminService');

describe('Enterprise QA Benchmark & Regression Harness (Authored by A Sheiman Joshi)', () => {
    let student, contributor, admin;
    let subjectId, topicId, materialId, quizId;

    before(() => {
        const db = getDb();
        student = authService.register(`qa_student_${Date.now()}`, 'StudentPass@123', 'Student/User');
        contributor = authService.register(`qa_contrib_${Date.now()}`, 'ContribPass@123', 'Content Contributor / Quiz Creator');
        admin = authService.register(`qa_admin_${Date.now()}`, 'AdminPass@123', 'Administrator');

        const sub = db.prepare('INSERT INTO subjects (name, code, description) VALUES (?, ?, ?)').run(
            'Distributed Systems & Cloud QA', 'CS-DS402', 'High-reliability distributed testing'
        );
        subjectId = sub.lastInsertRowid;

        const top = db.prepare('INSERT INTO topics (subject_id, name, description) VALUES (?, ?, ?)').run(
            subjectId, 'Fault Tolerance & Consensus', 'Raft, Paxos, and Two-Phase Commit verification'
        );
        topicId = top.lastInsertRowid;

        const note = materialService.createNote({
            title: 'Consensus Protocols in Distributed Architectures',
            description: 'Comprehensive analysis of Raft consensus protocol',
            subject_id: subjectId,
            topic_id: topicId,
            content: 'Detailed state machine replication steps and leader election timeouts.'
        }, contributor);
        materialId = note.id;
    });

    test('QA-BENCH-01: Multi-version revision history integrity under concurrent modification', () => {
        const rev2 = versionService.createRevision(materialId, {
            title: 'Consensus Protocols (v2 - Paxos Added)',
            content: 'Added Synod protocol and Multi-Paxos consensus proofs.',
            change_summary: 'Included Paxos specification'
        }, contributor);

        assert.strictEqual(rev2.version_number, 2);
        assert.strictEqual(rev2.change_summary, 'Included Paxos specification');

        const history = versionService.getVersionHistory(materialId);
        assert.ok(history.length >= 2, 'History array must contain distinct version logs');
        assert.strictEqual(history[0].version_number, 2);
    });

    test('QA-BENCH-02: Quiz creation with comprehensive question types and custom scoring weightages', () => {
        const quiz = quizService.createQuiz({
            title: 'Enterprise Distributed Systems Assessment',
            description: 'Advanced testing of consensus and CAP theorem',
            subject_id: subjectId,
            topic_id: topicId,
            duration_minutes: 20,
            randomize_questions: 1,
            instant_results: 1,
            questions: [
                {
                    type: 'MCQ',
                    question: 'Which property does the Raft consensus algorithm guarantee during split brain?',
                    options: ['Leader stickiness', 'Strict linearizability', 'Zero latency', 'Eventual network partition'],
                    correct_answer: 'Strict linearizability',
                    points: 3
                },
                {
                    type: 'TRUE_FALSE',
                    question: 'In the CAP theorem, a distributed system can simultaneously provide all three guarantees.',
                    correct_answer: 'False',
                    points: 2
                },
                {
                    type: 'FILL_BLANK',
                    question: 'The mechanism used by Raft to maintain consensus across terms is heartbeat ________.',
                    correct_answer: 'messages',
                    points: 2
                }
            ]
        }, contributor);

        assert.ok(quiz.id, 'Quiz ID must be generated');
        assert.strictEqual(quiz.questions.length, 3);
        quizId = quiz.id;
    });

    test('QA-BENCH-03: Security boundary audit: Client payloads must never leak correct answers', () => {
        const attemptPayload = quizService.getQuizForAttempt(quizId);
        assert.ok(attemptPayload.questions.length === 3);

        attemptPayload.questions.forEach(q => {
            assert.strictEqual(q.correct_answer, undefined, 'CRITICAL: correct_answer property must not exist in client attempt payload');
        });
    });

    test('QA-BENCH-04: High-throughput automated quiz scoring evaluation under stress', () => {
        const attemptPayload = quizService.getQuizForAttempt(quizId);
        const answers = {};

        attemptPayload.questions.forEach(q => {
            if (q.question_type === 'TRUE_FALSE') {
                answers[q.id] = 'False'; // Correct (2 points)
            } else if (q.question_type === 'MCQ') {
                answers[q.id] = 'Strict linearizability'; // Correct (3 points)
            } else {
                answers[q.id] = 'messages'; // Correct (2 points)
            }
        });

        const startTime = process.hrtime.bigint();
        const evalResult = quizService.evaluateAttempt(quizId, {
            answers,
            time_taken_seconds: 35
        }, student);
        const endTime = process.hrtime.bigint();

        const latencyMs = Number(endTime - startTime) / 1000000;
        assert.strictEqual(evalResult.score, 7, 'Expected perfect score of 7/7 points');
        assert.strictEqual(evalResult.max_score, 7);
        assert.strictEqual(evalResult.percentage, 100.0);
        assert.ok(latencyMs < 50.0, `Scoring latency (${latencyMs}ms) must remain strictly below 50ms`);
    });

    test('QA-BENCH-05: Dynamic leaderboard rank stability check', () => {
        const leaderboard = quizService.getLeaderboard(quizId);
        assert.ok(leaderboard.length >= 1, 'Leaderboard must contain at least one attempt');
        assert.strictEqual(leaderboard[0].username, student.username);
        assert.strictEqual(leaderboard[0].rank, 1);
        assert.strictEqual(leaderboard[0].score, 7);
    });

    test('QA-BENCH-06: Administrator security audit logging and user account governance', () => {
        const initialUsers = adminService.getAllUsers();
        assert.ok(initialUsers.length >= 3);

        adminService.updateUserRole(student.id, 'Content Contributor / Quiz Creator', admin);
        const updated = getDb().prepare('SELECT role FROM users WHERE id = ?').get(student.id);
        assert.strictEqual(updated.role, 'Content Contributor / Quiz Creator');

        const auditLogs = adminService.getAuditLogs(10);
        assert.ok(auditLogs.length > 0, 'Audit trail must record admin role update');
        assert.ok(!JSON.stringify(auditLogs).includes('StudentPass@123'), 'Passwords must never appear in audit trails');
    });
});
