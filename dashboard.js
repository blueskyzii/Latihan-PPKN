document.addEventListener('DOMContentLoaded', () => {
    const quizList = document.getElementById('quiz-list');
    const wibClock = document.getElementById('wib-clock');

    // --- Init ---
    init();

    function init() {
        startDashboardClock();
        loadQuizzes();
    }

    // --- Clock ---
    function startDashboardClock() {
        updateClock();
        setInterval(updateClock, 1000);
    }

    function updateClock() {
        const now = new Date();
        const wibTime = new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).format(now);
        wibClock.textContent = wibTime;
    }

    // --- Load Quizzes ---
    async function loadQuizzes() {
        try {
            const res = await fetch('quizzes.json');
            const quizzes = await res.json();
            renderDashboard(quizzes);
        } catch (e) {
            quizList.innerHTML = '<div class="error">Gagal memuat data ujian.</div>';
            console.error(e);
        }
    }

    function renderDashboard(quizzes) {
        quizList.innerHTML = '';
        quizzes.forEach(quiz => {
            const durationText = quiz.duration ? `${quiz.duration} Menit` : 'Unlimited';
            const card = document.createElement('div');
            card.className = 'quiz-card';
            card.innerHTML = `
                <div class="quiz-icon">${quiz.icon || '📝'}</div>
                <h3>${quiz.title}</h3>
                <p>
                    ${quiz.description}<br>
                    <strong>Waktu: ${durationText}</strong>
                </p>
                <button class="btn-start">Mulai Ujian</button>
            `;
            const btn = card.querySelector('.btn-start');
            btn.onclick = () => startQuiz(quiz.id);
            quizList.appendChild(card);
        });
    }

    function startQuiz(quizId) {
        // Reset old state for a fresh start
        localStorage.removeItem('exam_state');
        // Set new quiz target
        localStorage.setItem('current_quiz_id', quizId);
        // Redirect
        window.location.href = 'exam.html';
    }
});
