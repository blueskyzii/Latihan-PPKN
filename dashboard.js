document.addEventListener('DOMContentLoaded', () => {
    const quizList = document.getElementById('quiz-list');
    const wibClock = document.getElementById('wib-clock');

    // --- Token Modal Elements ---
    let selectedQuiz = null;
    const tokenModal = document.getElementById('token-modal');
    const tokenInput = document.getElementById('token-input');
    const tokenError = document.getElementById('token-error');
    const submitTokenBtn = document.getElementById('submit-token-btn');
    const cancelTokenBtn = document.getElementById('cancel-token-btn');

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
            const response = await fetch('quizzes.json');
            const quizzes = await response.json();

            quizList.innerHTML = '';
            quizzes.forEach(quiz => {
                const card = document.createElement('div');
                card.className = 'quiz-card';
                card.innerHTML = `
                    <div class="quiz-icon">${quiz.icon || '📝'}</div>
                    <div class="card-content">
                        <h3>${quiz.title}</h3>
                        <p>${quiz.description}</p>
                        <div class="meta-tags">
                            <span class="tag">⏱️ ${quiz.duration ? `${quiz.duration} Menit` : 'Unlimited'}</span>
                            <span class="tag">📝 ${quiz.file ? 'Ready' : 'Draft'}</span>
                        </div>
                    </div>
                `;

                // Click Handler: Open Token Modal instead of direct link
                card.addEventListener('click', () => openTokenModal(quiz));

                quizList.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading quizzes:', error);
            quizList.innerHTML = '<p style="text-align:center; color:red;">Gagal memuat data ujian.</p>';
        }
    }

    // --- Token Modal Logic ---
    function openTokenModal(quiz) {
        selectedQuiz = quiz;
        tokenInput.value = ''; // Clear previous input
        tokenError.classList.add('hidden'); // Hide error
        tokenInput.classList.remove('input-error'); // Remove error style
        tokenModal.classList.remove('hidden');
        tokenModal.classList.add('active');
        tokenInput.focus();
    }

    function closeTokenModal() {
        tokenModal.classList.remove('active');
        setTimeout(() => tokenModal.classList.add('hidden'), 300);
        selectedQuiz = null;
    }

    function validateToken() {
        if (!selectedQuiz) return;

        const enteredToken = tokenInput.value.trim().toUpperCase();
        const correctToken = selectedQuiz.token ? selectedQuiz.token.toUpperCase() : '';

        if (enteredToken === correctToken) {
            // Correct Token
            // Reset old state for a fresh start
            localStorage.removeItem('exam_state');
            // Set new quiz target
            localStorage.setItem('current_quiz_id', selectedQuiz.id);
            // Redirect
            window.location.href = 'exam.html';
        } else {
            // Wrong Token
            tokenError.classList.remove('hidden');
            tokenInput.classList.add('input-error'); // Optional shake/red border
            tokenInput.value = '';
            tokenInput.focus();
        }
    }

    // Events for Token Modal
    submitTokenBtn.addEventListener('click', validateToken);

    // Allow 'Enter' key to submit
    tokenInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission if any
            validateToken();
        }
    });

    // Reset error style on typing
    tokenInput.addEventListener('input', () => {
        tokenError.classList.add('hidden');
        tokenInput.classList.remove('input-error');
    });

    cancelTokenBtn.addEventListener('click', closeTokenModal);

    // --- Mobile Sidebar Logic ---
    const menuBtn = document.getElementById('dash-menu-btn');
    const sidebar = document.querySelector('.dashboard-sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuBtn && sidebar && overlay) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
});
