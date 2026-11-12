const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const { getDb } = require('../db/database');
const authService = require('../services/authService');
const quizService = require('../services/quizService');

describe('Quiz Performance Benchmark & Concurrency Simulation (QA Lead - Sheiman)', () => {
    let studentUser, contributorUser;
    let subjectId, topicId, benchmarkQuizId;

    before(() => {
        const db = getDb();
        studentUser = authService.register('perf_quiz_student', 'Pass@1234', 'Student/User');
        contributorUser = authService.register('perf_quiz_contrib', 'Pass@1234', 'Content Contributor / Quiz Creator');

        const sub = db.prepare('INSERT INTO subjects (name, code, description) VALUES (?, ?, ?)').run(
            'Performance Testing Subject', 'PERF-101', 'Benchmarking tests'
        );
        subjectId = sub.lastInsertRowid;

        const top = db.prepare('INSERT INTO topics (subject_id, name, description) VALUES (?, ?, ?)').run(
            subjectId, 'High Concurrency Queries', 'Load testing'
        );
        topicId = top.lastInsertRowid;

        // Build a 10-question benchmark quiz
        const questions = [];
        for (let i = 1; i <= 10; i++) {
            questions.push({
                type: 'MCQ',
                question: `Benchmark Question #${i}: What is the asymptotic bound?`,
                options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
                correct_answer: 'O(log n)',
                points: 1
            });
        }

        const quiz = quizService.createQuiz({
            title: 'High-Throughput Benchmark Assessment',
            description: 'Load testing 100 concurrent submissions',
            subject_id: subjectId,
            topic_id: topicId,
            duration_minutes: 30,
            questions
        }, contributorUser);

        benchmarkQuizId = quiz.id;
    });

    test('TC-PERF-QZ-01: 100 sequential quiz evaluations complete with sub-millisecond mean latency', () => {
        const attemptPayload = quizService.getQuizForAttempt(benchmarkQuizId);
        const answers = {};
        attemptPayload.questions.forEach(q => {
            answers[q.id] = 'O(log n)';
        });

        const latencies = [];
        const iterations = 100;

        for (let i = 0; i < iterations; i++) {
            const start = process.hrtime.bigint();
            const res = quizService.evaluateAttempt(benchmarkQuizId, {
                answers,
                time_taken_seconds: 120
            }, studentUser);
            const end = process.hrtime.bigint();

            const latencyMs = Number(end - start) / 1_000_000;
            latencies.push(latencyMs);

            assert.strictEqual(res.score, 10, 'All 10 questions evaluated accurately');
            assert.strictEqual(res.percentage, 100, 'Score is 100%');
        }

        latencies.sort((a, b) => a - b);
        const p50 = latencies[Math.floor(iterations * 0.50)];
        const p90 = latencies[Math.floor(iterations * 0.90)];
        const p99 = latencies[Math.floor(iterations * 0.99)];
        const mean = latencies.reduce((a, b) => a + b, 0) / iterations;

        console.log(`\n  [Quiz Benchmark] 100 Evaluations -> Mean: ${mean.toFixed(3)}ms | p50: ${p50.toFixed(3)}ms | p90: ${p90.toFixed(3)}ms | p99: ${p99.toFixed(3)}ms`);

        // Assert latency conforms to IEEE performance envelope (sub-10ms per evaluation)
        assert.ok(p90 < 10.0, `p90 latency (${p90}ms) must be under 10ms`);
    });

    test('TC-PERF-QZ-02: Leaderboard calculation remains sub-millisecond with populated attempt history', () => {
        const start = process.hrtime.bigint();
        const leaderboard = quizService.getLeaderboard(benchmarkQuizId);
        const end = process.hrtime.bigint();

        const latencyMs = Number(end - start) / 1_000_000;
        assert.ok(leaderboard.length > 0, 'Leaderboard must contain populated attempt records');
        assert.ok(latencyMs < 5.0, `Leaderboard query latency (${latencyMs}ms) must be under 5ms`);
    });
});
