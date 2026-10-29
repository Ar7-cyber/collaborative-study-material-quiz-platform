const { getDb } = require('../db/database');
const authService = require('./authService');

class QuizService {
    constructor(db = null) {
        this.getDb = () => db || getDb();
    }

    // CSQP-F-013 & CSQP-F-014: Create Quiz with Supported Question Types & Configuration
    createQuiz({ title, description, subject_id, topic_id, duration_minutes = 10, randomize_questions = 1, instant_results = 1, questions = [] }, user, ipAddress = '127.0.0.1') {
        const db = this.getDb();

        if (!title || !title.trim()) throw new Error('Quiz title is required');
        if (!subject_id || !topic_id) throw new Error('Subject and Topic are required');
        if (!Array.isArray(questions) || questions.length === 0) throw new Error('At least one question is required');

        const insertQuiz = db.prepare(`
            INSERT INTO quizzes (title, description, subject_id, topic_id, creator_id, duration_minutes, randomize_questions, instant_results, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED')
        `);

        const qRes = insertQuiz.run(
            title.trim(),
            (description || '').trim(),
            Number(subject_id),
            Number(topic_id),
            user.id,
            Number(duration_minutes) || 10,
            randomize_questions ? 1 : 0,
            instant_results ? 1 : 0
        );

        const quizId = qRes.lastInsertRowid;

        const insertQuestion = db.prepare(`
            INSERT INTO quiz_questions (quiz_id, question_text, question_type, options_json, correct_answer, points, order_num)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        questions.forEach((q, idx) => {
            const qType = ['MCQ', 'TRUE_FALSE', 'FILL_BLANK'].includes(q.type) ? q.type : 'MCQ';
            const options = qType === 'MCQ' ? JSON.stringify(q.options || []) : (qType === 'TRUE_FALSE' ? JSON.stringify(['True', 'False']) : null);
            insertQuestion.run(
                quizId,
                q.question.trim(),
                qType,
                options,
                q.correct_answer.toString().trim(),
                Number(q.points) || 1,
                idx + 1
            );
        });

        authService.logAudit(user.id, 'CREATE_QUIZ', `Created quiz #${quizId}: ${title.trim()} (${questions.length} questions)`, ipAddress);
        return this.getQuizById(quizId);
    }

    // List all published quizzes
    listQuizzes({ subject_id, topic_id }) {
        const db = this.getDb();
        let sql = `
            SELECT q.*, s.name as subject_name, t.name as topic_name, u.username as creator_name,
                   COUNT(qq.id) as question_count,
                   COALESCE(SUM(qq.points), 0) as total_points
            FROM quizzes q
            JOIN subjects s ON q.subject_id = s.id
            JOIN topics t ON q.topic_id = t.id
            JOIN users u ON q.creator_id = u.id
            LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
            WHERE q.status = 'PUBLISHED'
        `;
        const params = [];

        if (subject_id) {
            sql += ` AND q.subject_id = ?`;
            params.push(Number(subject_id));
        }
        if (topic_id) {
            sql += ` AND q.topic_id = ?`;
            params.push(Number(topic_id));
        }

        sql += ` GROUP BY q.id ORDER BY q.created_at DESC`;
        return db.prepare(sql).all(...params);
    }

    // CSQP-F-015: Retrieve Quiz Questions for an Attempt (stripping correct answers for security)
    getQuizForAttempt(quizId) {
        const db = this.getDb();
        const quiz = db.prepare(`
            SELECT q.*, s.name as subject_name, t.name as topic_name
            FROM quizzes q
            JOIN subjects s ON q.subject_id = s.id
            JOIN topics t ON q.topic_id = t.id
            WHERE q.id = ? AND q.status = 'PUBLISHED'
        `).get(quizId);

        if (!quiz) throw new Error('Quiz not found or not published');

        let questions = db.prepare(`
            SELECT id, question_text, question_type, options_json, points, order_num
            FROM quiz_questions
            WHERE quiz_id = ?
            ORDER BY order_num ASC
        `).all(quizId);

        // Parse options JSON
        questions = questions.map(q => ({
            ...q,
            options: q.options_json ? JSON.parse(q.options_json) : null
        }));

        // CSQP-F-014: Question Randomization
        if (quiz.randomize_questions) {
            questions = questions.sort(() => Math.random() - 0.5);
        }

        return {
            ...quiz,
            questions
        };
    }

    // Full quiz definition for creators/admins
    getQuizById(quizId) {
        const db = this.getDb();
        const quiz = db.prepare(`
            SELECT q.*, s.name as subject_name, t.name as topic_name, u.username as creator_name
            FROM quizzes q
            JOIN subjects s ON q.subject_id = s.id
            JOIN topics t ON q.topic_id = t.id
            JOIN users u ON q.creator_id = u.id
            WHERE q.id = ?
        `).get(quizId);

        if (!quiz) return null;

        const questions = db.prepare(`
            SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_num ASC
        `).all(quizId).map(q => ({
            ...q,
            options: q.options_json ? JSON.parse(q.options_json) : null
        }));

        return {
            ...quiz,
            questions
        };
    }

    // CSQP-F-016 & CSQP-SR-006: Server-Side Automated Evaluation & Anti-Tamper Logic
    evaluateAttempt(quizId, { answers = {}, time_taken_seconds = 0 }, user, ipAddress = '127.0.0.1') {
        const db = this.getDb();
        const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ? AND status = ' + "'PUBLISHED'").get(quizId);
        if (!quiz) throw new Error('Quiz not found or inactive');

        const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ?').all(quizId);
        if (questions.length === 0) throw new Error('Quiz has no questions');

        let userScore = 0;
        let maxScore = 0;
        const evaluationDetails = [];

        // Evaluated strictly on server (CSQP-SR-006)
        questions.forEach(q => {
            maxScore += q.points;
            const submittedAnswer = answers[q.id] !== undefined ? String(answers[q.id]).trim() : '';
            const correctAnswer = String(q.correct_answer).trim();

            let isCorrect = false;
            if (q.question_type === 'FILL_BLANK') {
                isCorrect = submittedAnswer.toLowerCase() === correctAnswer.toLowerCase();
            } else {
                isCorrect = submittedAnswer.toLowerCase() === correctAnswer.toLowerCase();
            }

            const pointsAwarded = isCorrect ? q.points : 0;
            userScore += pointsAwarded;

            evaluationDetails.push({
                question_id: q.id,
                question_text: q.question_text,
                question_type: q.question_type,
                submitted_answer: submittedAnswer,
                correct_answer: correctAnswer,
                is_correct: isCorrect,
                points_awarded: pointsAwarded,
                max_points: q.points
            });
        });

        const percentage = maxScore > 0 ? Number(((userScore / maxScore) * 100).toFixed(1)) : 0;
        const timeSpent = Math.max(0, Number(time_taken_seconds) || 0);

        // Store authoritative attempt record in database (CSQP-F-018)
        const insertAttempt = db.prepare(`
            INSERT INTO quiz_attempts (quiz_id, user_id, score, max_score, percentage, time_taken_seconds, responses_json)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertAttempt.run(
            quizId,
            user.id,
            userScore,
            maxScore,
            percentage,
            timeSpent,
            JSON.stringify(evaluationDetails)
        );

        authService.logAudit(user.id, 'SUBMIT_QUIZ', `Completed quiz #${quizId} with score ${userScore}/${maxScore} (${percentage}%) in ${timeSpent}s`, ipAddress);

        return {
            attempt_id: result.lastInsertRowid,
            quiz_id: quizId,
            quiz_title: quiz.title,
            score: userScore,
            max_score: maxScore,
            percentage,
            time_taken_seconds: timeSpent,
            instant_results: Boolean(quiz.instant_results),
            breakdown: Boolean(quiz.instant_results) ? evaluationDetails : null
        };
    }

    // CSQP-F-018: Completed Quiz Attempt History for User
    getUserQuizHistory(userId) {
        const db = this.getDb();
        return db.prepare(`
            SELECT qa.id, qa.score, qa.max_score, qa.percentage, qa.time_taken_seconds, qa.submitted_at,
                   q.id as quiz_id, q.title as quiz_title, s.name as subject_name
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            JOIN subjects s ON q.subject_id = s.id
            WHERE qa.user_id = ?
            ORDER BY qa.submitted_at DESC
        `).all(userId);
    }

    // CSQP-F-019: Dynamic Leaderboard (Ranked by Score DESC, Time ASC)
    getLeaderboard(quizId = null) {
        const db = this.getDb();
        let sql = `
            SELECT qa.id, qa.quiz_id, q.title as quiz_title, qa.score, qa.max_score, qa.percentage,
                   qa.time_taken_seconds, qa.submitted_at, u.username
            FROM quiz_attempts qa
            JOIN quizzes q ON qa.quiz_id = q.id
            JOIN users u ON qa.user_id = u.id
        `;
        const params = [];

        if (quizId) {
            sql += ` WHERE qa.quiz_id = ?`;
            params.push(Number(quizId));
        }

        sql += ` ORDER BY qa.percentage DESC, qa.score DESC, qa.time_taken_seconds ASC LIMIT 25`;

        const rows = db.prepare(sql).all(...params);
        return rows.map((r, idx) => ({
            rank: idx + 1,
            ...r
        }));
    }
}

module.exports = new QuizService();
