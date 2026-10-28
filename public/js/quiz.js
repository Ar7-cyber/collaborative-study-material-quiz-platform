const QuizApp = {
    currentQuiz: null,
    timerInterval: null,
    secondsRemaining: 0,
    timeTakenSeconds: 0,

    async init() {
        await this.loadQuizzes();
        this.setupAttemptForm();
    },

    switchTab(tab) {
        clearInterval(this.timerInterval);
        ['quizzes', 'active-quiz', 'results', 'leaderboard', 'history'].forEach(s => {
            const el = document.getElementById(`section-${s}`);
            if (el) el.style.display = 'none';
        });

        ['quizzes', 'leaderboard', 'history'].forEach(t => {
            const btn = document.getElementById(`tab-${t}-btn`);
            if (btn) btn.classList.remove('active');
        });

        const activeSec = document.getElementById(`section-${tab}`);
        if (activeSec) activeSec.style.display = 'block';

        const activeBtn = document.getElementById(`tab-${tab}-btn`);
        if (activeBtn) activeBtn.classList.add('active');

        if (tab === 'quizzes') this.loadQuizzes();
        if (tab === 'leaderboard') this.loadLeaderboard();
        if (tab === 'history') this.loadHistory();
    },

    async loadQuizzes() {
        const grid = document.getElementById('quizzes-grid');
        grid.innerHTML = '<p style="color: var(--text-muted);">Loading quizzes...</p>';

        try {
            const res = await fetch('/api/quizzes');
            const data = await res.json();
            const quizzes = data.quizzes || [];

            if (quizzes.length === 0) {
                grid.innerHTML = '<p style="color: var(--text-muted);">No quizzes published yet.</p>';
                return;
            }

            grid.innerHTML = quizzes.map(q => `
                <div class="material-card">
                    <div>
                        <span class="card-badge badge-doc">⏱️ ${q.duration_minutes} Mins • ${q.question_count} Questions</span>
                        <h3 class="card-title">${q.title}</h3>
                        <p class="card-desc">${q.description || 'No description provided.'}</p>
                        <div style="font-size: 0.85rem; color: var(--primary); font-weight: 600; margin-bottom: 0.75rem;">
                            📖 ${q.subject_name} &rsaquo; ${q.topic_name}
                        </div>
                    </div>
                    <div style="border-top: 1px solid var(--border); padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">By: ${q.creator_name}</span>
                        <button class="btn btn-primary btn-sm" onclick="QuizApp.startQuiz(${q.id})">Start Quiz</button>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            grid.innerHTML = '<p style="color: var(--danger);">Failed to load quizzes.</p>';
        }
    },

    async startQuiz(quizId) {
        if (!App.currentUser) {
            App.showToast('Please log in before starting a quiz attempt', 'danger');
            setTimeout(() => { window.location.href = '/login.html'; }, 1000);
            return;
        }

        try {
            const res = await fetch(`/api/quizzes/${quizId}`);
            if (!res.ok) throw new Error('Could not fetch quiz questions');
            const data = await res.json();
            this.currentQuiz = data.quiz;

            document.getElementById('active-quiz-title').innerText = this.currentQuiz.title;
            document.getElementById('active-quiz-sub').innerText = `📖 ${this.currentQuiz.subject_name} › ${this.currentQuiz.topic_name}`;

            this.renderQuestions(this.currentQuiz.questions);
            this.startTimer(this.currentQuiz.duration_minutes * 60);

            this.switchTab('active-quiz');
        } catch (err) {
            App.showToast(err.message, 'danger');
        }
    },

    renderQuestions(questions) {
        const container = document.getElementById('questions-container');
        container.innerHTML = questions.map((q, idx) => {
            let inputArea = '';

            if (q.question_type === 'MCQ' || q.question_type === 'TRUE_FALSE') {
                const options = q.options || (q.question_type === 'TRUE_FALSE' ? ['True', 'False'] : []);
                inputArea = options.map(opt => `
                    <label class="option-label">
                        <input type="radio" name="question_${q.id}" value="${opt}" required>
                        <span>${opt}</span>
                    </label>
                `).join('');
            } else {
                // FILL_BLANK
                inputArea = `
                    <input type="text" name="question_${q.id}" class="form-control" placeholder="Type your answer here..." required style="max-width: 400px;">
                `;
            }

            return `
                <div class="question-card">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                        <span style="font-weight: 700; color: var(--primary);">Question ${idx + 1}</span>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${q.points} Point${q.points > 1 ? 's' : ''} • [${q.question_type}]</span>
                    </div>
                    <p style="font-size: 1.05rem; font-weight: 600; margin-bottom: 1rem;">${q.question_text}</p>
                    ${inputArea}
                </div>
            `;
        }).join('');
    },

    startTimer(seconds) {
        clearInterval(this.timerInterval);
        this.secondsRemaining = seconds;
        this.timeTakenSeconds = 0;

        const timerDisplay = document.getElementById('quiz-timer-display');

        const updateDisplay = () => {
            const mins = Math.floor(this.secondsRemaining / 60);
            const secs = this.secondsRemaining % 60;
            timerDisplay.innerText = `⏳ Time Left: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        updateDisplay();

        this.timerInterval = setInterval(() => {
            this.secondsRemaining--;
            this.timeTakenSeconds++;
            updateDisplay();

            if (this.secondsRemaining <= 0) {
                clearInterval(this.timerInterval);
                App.showToast('Time expired! Submitting answers automatically...', 'warning');
                document.getElementById('quiz-attempt-form').requestSubmit();
            }
        }, 1000);
    },

    setupAttemptForm() {
        const form = document.getElementById('quiz-attempt-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearInterval(this.timerInterval);

            const formData = new FormData(form);
            const answers = {};

            this.currentQuiz.questions.forEach(q => {
                const val = formData.get(`question_${q.id}`);
                answers[q.id] = val !== null ? val : '';
            });

            try {
                const res = await fetch(`/api/quizzes/${this.currentQuiz.id}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        answers,
                        time_taken_seconds: this.timeTakenSeconds
                    })
                });

                const data = await res.json();
                if (res.ok) {
                    this.showResults(data.result);
                } else {
                    App.showToast(data.error || 'Evaluation failed', 'danger');
                }
            } catch (err) {
                App.showToast('Network error during evaluation submission', 'danger');
            }
        });
    },

    showResults(result) {
        this.switchTab('results');
        document.getElementById('result-score').innerText = `${result.score} / ${result.max_score}`;
        document.getElementById('result-percentage').innerText = `Overall Score: ${result.percentage}%`;
        document.getElementById('result-time').innerText = `Time Taken: ${result.time_taken_seconds} seconds`;

        const icon = document.getElementById('result-icon');
        icon.innerText = result.percentage >= 70 ? '🏆' : (result.percentage >= 40 ? '👍' : '📚');

        const breakdown = document.getElementById('result-breakdown');
        if (result.breakdown && result.breakdown.length > 0) {
            breakdown.innerHTML = '<h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem;">Performance & Evaluation Review</h3>' +
                result.breakdown.map(item => `
                    <div style="background: ${item.is_correct ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${item.is_correct ? '#bbf7d0' : '#fecaca'}; border-radius: 6px; padding: 1rem; margin-bottom: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 700; color: ${item.is_correct ? 'var(--success)' : 'var(--danger)'};">
                            <span>${item.is_correct ? '✅ Correct (+'+item.points_awarded+' pts)' : '❌ Incorrect (0 pts)'}</span>
                            <span>[${item.question_type}]</span>
                        </div>
                        <p style="font-weight: 600; margin: 0.35rem 0;">${item.question_text}</p>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">
                            <span>Your Answer: <strong>${item.submitted_answer || '(Blank)'}</strong></span> |
                            <span>Correct Answer: <strong>${item.correct_answer}</strong></span>
                        </div>
                    </div>
                `).join('');
        } else {
            breakdown.innerHTML = '';
        }
    },

    async loadLeaderboard() {
        const body = document.getElementById('leaderboard-body');
        body.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading rankings...</td></tr>';

        try {
            const res = await fetch('/api/quizzes/leaderboard');
            const data = await res.json();
            const list = data.leaderboard || [];

            if (list.length === 0) {
                body.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No attempts logged on the leaderboard yet.</td></tr>';
                return;
            }

            body.innerHTML = list.map(item => `
                <tr>
                    <td style="font-weight: 700; color: var(--primary);">#${item.rank}</td>
                    <td><strong>${item.username}</strong></td>
                    <td>${item.quiz_title}</td>
                    <td>${item.score}/${item.max_score}</td>
                    <td><span style="font-weight: 600; color: var(--success);">${item.percentage}%</span></td>
                    <td>${item.time_taken_seconds}s</td>
                </tr>
            `).join('');
        } catch (err) {
            body.innerHTML = '<tr><td colspan="6" style="color: var(--danger); text-align: center;">Failed to load leaderboard.</td></tr>';
        }
    },

    async loadHistory() {
        const body = document.getElementById('history-body');
        if (!App.currentUser) {
            body.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger);">Please log in to view your quiz history.</td></tr>';
            return;
        }

        body.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading history...</td></tr>';

        try {
            const res = await fetch('/api/quizzes/my-history');
            const data = await res.json();
            const list = data.history || [];

            if (list.length === 0) {
                body.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">You have not attempted any quizzes yet.</td></tr>';
                return;
            }

            body.innerHTML = list.map(item => `
                <tr>
                    <td><strong>${item.quiz_title}</strong></td>
                    <td>${item.subject_name}</td>
                    <td>${item.score}/${item.max_score}</td>
                    <td><span style="font-weight: 600;">${item.percentage}%</span></td>
                    <td>${item.time_taken_seconds}s</td>
                    <td>${new Date(item.submitted_at).toLocaleString()}</td>
                </tr>
            `).join('');
        } catch (err) {
            body.innerHTML = '<tr><td colspan="6" style="color: var(--danger); text-align: center;">Failed to load history.</td></tr>';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    QuizApp.init();
});
