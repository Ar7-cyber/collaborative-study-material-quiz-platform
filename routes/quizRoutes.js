const express = require('express');
const router = express.Router();
const quizService = require('../services/quizService');
const { requireAuth, requireRole, authenticate } = require('../middleware/auth');

// List quizzes
router.get('/', (req, res) => {
    try {
        const { subject_id, topic_id } = req.query;
        const quizzes = quizService.listQuizzes({ subject_id, topic_id });
        res.json({ quizzes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CSQP-F-019: Dynamic Leaderboard (TC-QUIZ-07)
router.get('/leaderboard', (req, res) => {
    try {
        const { quiz_id } = req.query;
        const leaderboard = quizService.getLeaderboard(quiz_id);
        res.json({ leaderboard });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CSQP-F-018: Completed Quiz History for Current User (TC-QUIZ-06)
router.get('/my-history', requireAuth, (req, res) => {
    try {
        const history = quizService.getUserQuizHistory(req.user.id);
        res.json({ history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CSQP-F-015: Retrieve Quiz Questions for an Attempt (TC-QUIZ-03)
router.get('/:id', authenticate, (req, res) => {
    try {
        const quiz = quizService.getQuizForAttempt(Number(req.params.id));
        res.json({ quiz });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

// CSQP-F-016 & CSQP-SR-006: Server-side Evaluation & Instant Results (TC-QUIZ-04, TC-QUIZ-05, TC-SEC-07)
router.post('/:id/submit', requireAuth, (req, res) => {
    try {
        const { answers, time_taken_seconds } = req.body;
        const result = quizService.evaluateAttempt(
            Number(req.params.id),
            { answers, time_taken_seconds },
            req.user,
            req.ip
        );
        res.json({
            message: 'Quiz submitted and evaluated successfully',
            result
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// CSQP-F-013 & CSQP-F-014: Create Quiz (TC-QUIZ-01, TC-QUIZ-02)
router.post('/', requireAuth, requireRole('Content Contributor / Quiz Creator', 'Administrator'), (req, res) => {
    try {
        const { title, description, subject_id, topic_id, duration_minutes, randomize_questions, instant_results, questions } = req.body;
        const quiz = quizService.createQuiz({
            title,
            description,
            subject_id,
            topic_id,
            duration_minutes,
            randomize_questions,
            instant_results,
            questions
        }, req.user, req.ip);

        res.status(201).json({
            message: 'Quiz created and published successfully',
            quiz
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
