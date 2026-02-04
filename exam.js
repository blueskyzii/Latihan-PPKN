document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const state = {
        quizMetadata: null,
        questions: [],
        currentQuestionIndex: 0,
        userAnswers: {}, // { index: answer }
        isExamActive: false,
        examEndTime: 0,
        timerInterval: null,
        violationCount: 0
    };

    // --- DOM Elements ---
    const quizView = document.getElementById('quiz-view');
    const resultView = document.getElementById('result-view');

    const quizDisplay = {
        title: document.getElementById('exam-title-display'),
        timer: document.getElementById('timer'),
        qNumber: document.getElementById('q-number'),
        qText: document.getElementById('q-text'),
        options: document.getElementById('options-container'),
        paletteGrid: document.getElementById('palette-grid'),
        sidebar: document.getElementById('palette-sidebar'),
        overlay: document.getElementById('overlay'),
        hintBtn: document.getElementById('hint-btn'),
        hintBox: document.getElementById('hint-box'),
        hintText: document.getElementById('hint-text')
    };

    const nav = {
        prev: document.getElementById('prev-btn'),
        next: document.getElementById('next-btn'),
        finish: document.getElementById('finish-btn'),
        togglePalette: document.getElementById('toggle-palette-btn'),
        closePalette: document.getElementById('close-palette-btn')
    };

    const resultDisplay = {
        examTitle: document.getElementById('result-exam-title'),
        score: document.getElementById('score-final'),
        correct: document.getElementById('res-correct'),
        wrong: document.getElementById('res-wrong'),
        total: document.getElementById('res-total')
    };

    // --- Init ---
    init();

    async function init() {
        const quizId = localStorage.getItem('current_quiz_id');
        if (!quizId) {
            alert('Tidak ada ujian yang dipilih. Kembali ke Dashboard.');
            window.location.href = 'index.html';
            return;
        }

        // Check for saved state (Persistence)
        const savedState = localStorage.getItem('exam_state');

        await loadQuizData(quizId);

        if (savedState) {
            restoreState(JSON.parse(savedState));
        } else {
            initializeNewExam();
        }
    }

    async function loadQuizData(quizId) {
        try {
            // Get Metadata first (from quizzes.json)
            const resMeta = await fetch('quizzes.json');
            const allQuizzes = await resMeta.json();
            const quiz = allQuizzes.find(q => q.id === quizId);

            if (!quiz) throw new Error('Quiz not found');
            state.quizMetadata = quiz;
            quizDisplay.title.textContent = quiz.title;

            // Load Questions
            const resQ = await fetch(quiz.file);
            state.questions = await resQ.json();

        } catch (e) {
            console.error(e);
            alert('Gagal memuat data ujian.');
            window.location.href = 'index.html';
        }
    }

    function initializeNewExam() {
        state.currentQuestionIndex = 0;
        state.userAnswers = {};
        state.violationCount = 0;
        state.isExamActive = true;

        // Timer Setup
        const durationMinutes = state.quizMetadata.duration || 60;
        state.examEndTime = Date.now() + (durationMinutes * 60 * 1000);

        startTimer();
        saveState(); // Save Initial State
        renderUI();
        activateAntiCheat();
    }

    function restoreState(saved) {
        // Validate if saved state matches current quiz
        if (saved.quizId !== state.quizMetadata.id) {
            initializeNewExam(); // Mismatch (shouldn't happen usually), reset
            return;
        }

        state.currentQuestionIndex = saved.currentQuestionIndex || 0;
        state.userAnswers = saved.userAnswers || {};
        state.violationCount = saved.violationCount || 0;
        state.examEndTime = saved.examEndTime;
        state.isExamActive = true;

        startTimer();
        renderUI();
        activateAntiCheat();
    }

    function saveState() {
        if (!state.isExamActive) return;
        const payload = {
            quizId: state.quizMetadata.id,
            currentQuestionIndex: state.currentQuestionIndex,
            userAnswers: state.userAnswers,
            violationCount: state.violationCount,
            examEndTime: state.examEndTime
        };
        localStorage.setItem('exam_state', JSON.stringify(payload));
    }

    // --- Timer ---
    function startTimer() {
        updateTimerDisplay();
        state.timerInterval = setInterval(() => {
            const remaining = state.examEndTime - Date.now();
            if (remaining <= 0) {
                finishExam(true);
            } else {
                updateTimerDisplay(remaining);
            }
        }, 1000);
    }

    function updateTimerDisplay(remainingMs) {
        if (remainingMs === undefined) remainingMs = state.examEndTime - Date.now();
        if (remainingMs < 0) remainingMs = 0;

        const totalSeconds = Math.floor(remainingMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (n) => n.toString().padStart(2, '0');
        quizDisplay.timer.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

        if (totalSeconds < 60) quizDisplay.timer.style.color = '#ef4444';
        else quizDisplay.timer.style.color = 'white';
    }

    // --- Render Logic ---
    function renderUI() {
        renderQuestion();
        renderPalette();
        updateNavButtons();
    }

    function renderQuestion() {
        const index = state.currentQuestionIndex;
        const question = state.questions[index];
        const userAnswer = state.userAnswers[index];

        quizDisplay.qNumber.textContent = index + 1;
        quizDisplay.qText.textContent = question.question;

        // Hint
        quizDisplay.hintBox.classList.add('hidden');
        if (question.hint) {
            quizDisplay.hintBtn.classList.remove('hidden');
            quizDisplay.hintText.textContent = question.hint;
        } else {
            quizDisplay.hintBtn.classList.add('hidden');
        }

        // Options
        quizDisplay.options.innerHTML = '';
        question.options.forEach(opt => {
            const el = document.createElement('div');
            el.className = `option-item ${userAnswer === opt ? 'selected' : ''}`;
            el.textContent = opt;
            el.onclick = () => selectAnswer(index, opt);
            quizDisplay.options.appendChild(el);
        });
    }

    function selectAnswer(index, answer) {
        state.userAnswers[index] = answer;
        renderQuestion(); // Update UI selection
        updatePaletteItem(index);
        saveState(); // Persist
    }

    function renderPalette() {
        quizDisplay.paletteGrid.innerHTML = '';
        state.questions.forEach((_, idx) => {
            const btn = document.createElement('div');
            btn.className = getPaletteClass(idx);
            btn.textContent = idx + 1;
            btn.onclick = () => jumpToQuestion(idx);
            quizDisplay.paletteGrid.appendChild(btn);
        });
    }

    function updatePaletteItem(idx) {
        const btn = quizDisplay.paletteGrid.children[idx];
        if (btn) btn.className = getPaletteClass(idx);
    }

    function getPaletteClass(idx) {
        const isCurrent = idx === state.currentQuestionIndex;
        const isAnswered = state.userAnswers[idx] !== undefined;
        let cls = 'p-btn';
        if (isAnswered) cls += ' filled';
        if (isCurrent) cls += ' current';
        return cls;
    }

    function jumpToQuestion(idx) {
        const oldIndex = state.currentQuestionIndex;
        state.currentQuestionIndex = idx;

        updatePaletteItem(oldIndex);
        updatePaletteItem(idx);
        renderQuestion();
        updateNavButtons();
        saveState(); // Save current index
    }

    function updateNavButtons() {
        const idx = state.currentQuestionIndex;
        nav.prev.disabled = idx === 0;

        if (idx === state.questions.length - 1) {
            nav.next.classList.add('hidden');
            nav.finish.classList.remove('hidden');
        } else {
            nav.next.classList.remove('hidden');
            nav.finish.classList.add('hidden');
        }
    }

    // --- Inputs ---
    nav.prev.onclick = () => { if (state.currentQuestionIndex > 0) jumpToQuestion(state.currentQuestionIndex - 1); };
    nav.next.onclick = () => { if (state.currentQuestionIndex < state.questions.length - 1) jumpToQuestion(state.currentQuestionIndex + 1); };
    nav.finish.onclick = () => finishExam(false);

    quizDisplay.hintBtn.onclick = () => quizDisplay.hintBox.classList.toggle('hidden');

    function togglePalette() {
        quizDisplay.sidebar.classList.toggle('open');
        quizDisplay.overlay.classList.toggle('active');
    }
    nav.togglePalette.onclick = togglePalette;
    nav.closePalette.onclick = togglePalette;
    quizDisplay.overlay.onclick = togglePalette;


    // --- Finish Logic ---
    function finishExam(isForced) {
        const answeredCount = Object.keys(state.userAnswers).length;
        const total = state.questions.length;
        const remaining = state.examEndTime - Date.now();

        if (!isForced && remaining > 0 && answeredCount < total) {
            alert(`Masih ada ${total - answeredCount} soal belum dijawab. Waktu masih tersedia.`);
            return;
        }

        if (!isForced && !confirm('Yakin ingin menyelesaikan ujian?')) return;

        if (isForced) alert('Waktu Habis!');

        // Clear Persistence Logic
        // We only clear the state AFTER we've successfully calculated results.
        stopExam();
        calculateResults();

        // Remove state so if they refresh, they go back to start? 
        // Or keep result view logic? Result view is transient in memory here.
        // If user refreshes on Result View, they will be sent back to exam start because 'exam_state' is gone.
        // This is acceptable behavior for "Reset ke nomer 1".
        localStorage.removeItem('exam_state');
    }

    function stopExam() {
        clearInterval(state.timerInterval);
        deactivateAntiCheat();
        state.isExamActive = false;
    }

    function calculateResults() {
        let correct = 0;
        state.questions.forEach((q, idx) => {
            if (state.userAnswers[idx] === q.answer) correct++;
        });
        const wrong = state.questions.length - correct;
        const score = Math.round((correct / state.questions.length) * 100);

        resultDisplay.examTitle.textContent = state.quizMetadata.title;
        resultDisplay.score.textContent = score;
        resultDisplay.correct.textContent = correct;
        resultDisplay.wrong.textContent = wrong;
        resultDisplay.total.textContent = state.questions.length;

        quizView.classList.remove('active');
        quizView.classList.add('hidden');
        resultView.classList.remove('hidden');
        resultView.classList.add('active');
    }

    // --- Anti Cheat ---
    function activateAntiCheat() {
        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('visibilitychange', handleVisibility);
    }
    function deactivateAntiCheat() {
        document.removeEventListener('contextmenu', preventDefault);
        document.removeEventListener('visibilitychange', handleVisibility);
    }
    function preventDefault(e) { e.preventDefault(); }

    function handleVisibility() {
        if (document.hidden && state.isExamActive) {
            state.violationCount++;
            saveState(); // Persist violation

            const max = 5;
            if (state.violationCount < max) {
                alert(`PERINGATAN (${state.violationCount}/${max}): Jangan keluar dari halaman ujian! Toleransi sisa ${max - state.violationCount}.`);
            } else {
                alert('PELANGGARAN MAKSIMAL! Ujian akan direset dari awal.');
                resetExamHard();
            }
        }
    }

    function resetExamHard() {
        localStorage.removeItem('exam_state');
        window.location.reload(); // Will verify state is gone and start fresh
    }

});
