const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const { getDb } = require('../db/database');
const authService = require('../services/authService');
const quizService = require('../services/quizService');

describe('Quiz Engine & Test Automation Suite (Authored by A Sheiman Joshi - QA Lead)', () => {
    let studentUser, studentUser2, contributorUser;
    let subjectId, topicId, sampleQuizId;

    before(() => {
        const db = getDb();
        // Unique user registration for isolated QA suite
        studentUser = authService.register('sheiman_student_1', 'Pass@1234', 'Student/User');
        studentUser2 = authService.register('sheiman_student_2', 'Pass@1234', 'Student/User');
        contributorUser = authService.register('sheiman_contributor', 'Pass@1234', 'Content Contributor / Quiz Creator');

        // Create test subject & topic
        const sub = db.prepare('INSERT INTO subjects (name, code, description) VALUES (?, ?, ?)').run(
            'Algorithms & Data Structures', 'CS-DS201', 'Algorithm design paradigms'
        );
        subjectId = sub.lastInsertRowid;

        const top = db.prepare('INSERT INTO topics (subject_id, name, description) VALUES (?, ?, ?)').run(
            subjectId, 'Greedy & Dynamic Programming', 'Optimization techniques'
        );
        topicId = top.lastInsertRowid;
    });

    test('TC-QZ-01: Quiz creation input validation boundary constraints (CSQP-F-013)', () => {
        // Negative test: empty title rejected
        assert.throws(() => {
            quizService.createQuiz({
                title: '',
                subject_id: subjectId,
                topic_id: topicId,
                questions: [{ type: 'MCQ', question: 'Q1?', correct_answer: 'A', points: 1 }]
            }, contributorUser);
        }, /Quiz title is required/);

        // Negative test: missing questions array rejected
        assert.throws(() => {
            quizService.createQuiz({
                title: 'Invalid Quiz',
                subject_id: subjectId,
                topic_id: topicId,
                questions: []
            }, contributorUser);
        }, /At least one question is required/);

        // Positive test: valid creation
        const quiz = quizService.createQuiz({
            title: 'Greedy Algorithms Diagnostic Quiz',
            description: 'Covers Huffman Coding and Kruskal Algorithm',
            subject_id: subjectId,
            topic_id: topicId,
            duration_minutes: 15,
            randomize_questions: 1,
            instant_results: 1,
            questions: [
                {
                    type: 'MCQ',
                    question: 'What is the greedy criterion in Kruskals algorithm?',
                    options: ['Smallest weight edge', 'Largest weight edge', 'Random edge', 'Adjacent edge'],
                    correct_answer: 'Smallest weight edge',
                    points: 2
                },
                {
                    type: 'TRUE_FALSE',
                    question: 'Huffman coding produces variable-length prefix-free codes.',
                    correct_answer: 'True',
                    points: 1
                },
                {
                    type: 'FILL_BLANK',
                    question: 'Fractional knapsack problem can be solved greedily in O(n log n) by sorting by value per unit _______.',
                    correct_answer: 'weight',
                    points: 2
                }
            ]
        }, contributorUser);

        assert.ok(quiz.id, 'Quiz ID must be generated');
        assert.strictEqual(quiz.title, 'Greedy Algorithms Diagnostic Quiz');
        assert.strictEqual(quiz.questions.length, 3);
        sampleQuizId = quiz.id;
    });

    test('TC-QZ-02: Answer redaction prevents client-side inspection attacks (CSQP-SR-006)', () => {
        const attemptPayload = quizService.getQuizForAttempt(sampleQuizId);
        assert.strictEqual(attemptPayload.questions.length, 3);

        // Verify correct_answer field is stripped from all questions
        attemptPayload.questions.forEach(q => {
            assert.strictEqual(q.correct_answer, undefined, 'Sensitive correct answer must be redacted');
            assert.ok(q.question_text, 'Question text must be visible');
            assert.ok(q.points > 0, 'Points value must be present');
        });
    });

    test('TC-QZ-03: Server-authoritative scoring across heterogeneous question types (CSQP-F-016)', () => {
        const attempt = quizService.getQuizForAttempt(sampleQuizId);
        const qMcq = attempt.questions.find(q => q.question_type === 'MCQ');
        const qTf = attempt.questions.find(q => q.question_type === 'TRUE_FALSE');
        const qFill = attempt.questions.find(q => q.question_type === 'FILL_BLANK');

        // Submit: 2 correct, 1 incorrect
        const answers = {};
        answers[qMcq.id] = 'Smallest weight edge'; // Correct: 2 pts
        answers[qTf.id] = 'True';                 // Correct: 1 pt
        answers[qFill.id] = 'volume';             // Incorrect: 0 pts (expected 'weight')

        const result = quizService.evaluateAttempt(sampleQuizId, {
            answers,
            time_taken_seconds: 60
        }, studentUser);

        assert.strictEqual(result.score, 3, 'Total score should be 3 (2 + 1)');
        assert.strictEqual(result.max_score, 5, 'Max points should be 5 (2 + 1 + 2)');
        assert.strictEqual(result.percentage, 60, 'Percentage should be 60%');
        assert.strictEqual(result.instant_results, true, 'Instant results enabled');
    });

    test('TC-QZ-04: Perfect score boundary evaluation (CSQP-F-016)', () => {
        const attempt = quizService.getQuizForAttempt(sampleQuizId);
        const answers = {};
        attempt.questions.forEach(q => {
            if (q.question_type === 'MCQ') answers[q.id] = 'Smallest weight edge';
            if (q.question_type === 'TRUE_FALSE') answers[q.id] = 'True';
            if (q.question_type === 'FILL_BLANK') answers[q.id] = 'weight';
        });

        const result = quizService.evaluateAttempt(sampleQuizId, {
            answers,
            time_taken_seconds: 35
        }, studentUser2);

        assert.strictEqual(result.score, 5, 'Perfect score should earn all 5 points');
        assert.strictEqual(result.percentage, 100, 'Score should be 100%');
    });

    test('TC-QZ-05: Dynamic leaderboard ranks attempts by score and completion latency (CSQP-F-017)', () => {
        const leaderboard = quizService.getLeaderboard(sampleQuizId);
        assert.ok(Array.isArray(leaderboard), 'Leaderboard must be an array');
        assert.ok(leaderboard.length >= 2, 'Should contain at least 2 student attempts');

        // Rank 1 must be studentUser2 with 100% in 35s
        assert.strictEqual(leaderboard[0].username, studentUser2.username);
        assert.strictEqual(leaderboard[0].score, 5);

        // Rank 2 must be studentUser with 60% in 60s
        assert.strictEqual(leaderboard[1].username, studentUser.username);
        assert.strictEqual(leaderboard[1].score, 3);
    });

    test('TC-QZ-06: Historical quiz attempt archive retrieval for authenticated students (CSQP-F-018)', () => {
        const history = quizService.getUserQuizHistory(studentUser.id);
        assert.ok(Array.isArray(history), 'History must be an array');
        const record = history.find(h => h.quiz_id === sampleQuizId);
        assert.ok(record, 'Student attempt record must exist in history');
        assert.strictEqual(record.score, 3);
        assert.strictEqual(record.percentage, 60);
    });

    test('TC-QZ-07: Quiz listing and subject/topic filtering (CSQP-F-013)', () => {
        const allQuizzes = quizService.listQuizzes({});
        assert.ok(allQuizzes.length > 0, 'Should return active quizzes');

        const filtered = quizService.listQuizzes({ subject_id: subjectId, topic_id: topicId });
        assert.ok(filtered.some(q => q.id === sampleQuizId), 'Target quiz must exist in topic listing');
    });
});
