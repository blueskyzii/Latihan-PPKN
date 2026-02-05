document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const state = {
        quizMetadata: null,
        questions: [],
        currentQuestionIndex: 0,
        userAnswers: {},
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

    // Modal Elements
    const modal = {
        overlay: document.getElementById('custom-modal'),
        icon: document.getElementById('modal-icon'),
        title: document.getElementById('modal-title'),
        msg: document.getElementById('modal-msg'),
        actions: document.getElementById('modal-actions')
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
            const resMeta = await fetch('quizzes.json');
            const allQuizzes = await resMeta.json();
            const quiz = allQuizzes.find(q => q.id === quizId);

            if (!quiz) throw new Error('Quiz not found');
            state.quizMetadata = quiz;
            quizDisplay.title.textContent = quiz.title;

            const resQ = await fetch(quiz.file);
            const loadedQuestions = await resQ.json();

            // Randomize options
            loadedQuestions.forEach(q => {
                if (q.options) shuffleArray(q.options);
            });

            state.questions = loadedQuestions;

        } catch (e) {
            console.error(e);
            showAlert('Error', 'Gagal memuat data ujian.', 'danger', () => window.location.href = 'index.html');
        }
    }

    function initializeNewExam() {
        state.currentQuestionIndex = 0;
        state.userAnswers = {};
        state.violationCount = 0;
        state.isExamActive = true;

        const durationMinutes = state.quizMetadata.duration || 60;
        state.examEndTime = Date.now() + (durationMinutes * 60 * 1000);

        startTimer();
        saveState();
        renderUI();
        activateAntiCheat();
    }

    function restoreState(saved) {
        if (saved.quizId !== state.quizMetadata.id) {
            initializeNewExam();
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

    // --- UI Logic ---
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

        quizDisplay.hintBox.classList.add('hidden');
        if (question.hint) {
            quizDisplay.hintBtn.classList.remove('hidden');
            quizDisplay.hintText.textContent = question.hint;
        } else {
            quizDisplay.hintBtn.classList.add('hidden');
        }

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
        renderQuestion();
        updatePaletteItem(index);
        saveState();
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
        saveState();
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
            showAlert('Belum Selesai', `Masih ada ${total - answeredCount} soal belum dijawab. Mohon lengkapi semua jawaban sebelum mengumpulkan.`, 'warning');
            return;
        }

        if (isForced) {
            showAlert('Waktu Habis', 'Waktu ujian telah habis. Jawaban Anda akan otomatis dikumpulkan.', 'warning', () => {
                completeProcess();
            });
        } else {
            showConfirm('Konfirmasi', 'Apakah Anda yakin ingin menyelesaikan ujian ini? Jawaban tidak dapat diubah setelah ini.', () => {
                completeProcess();
            });
        }
    }

    function completeProcess() {
        showLoading('Mengirim jawaban ke server...');
        setTimeout(() => {
            closeModal();
            stopExam();
            calculateResults();
            localStorage.removeItem('exam_state');
        }, 2000); // 2 seconds delay simulation
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

        // Block Back Button
        history.pushState(null, document.title, location.href);
        window.addEventListener('popstate', handlePopState);

        // Prevent accidental tab close/refresh (Standard Browser Confirmation)
        window.addEventListener('beforeunload', handleBeforeUnload);
    }

    function deactivateAntiCheat() {
        document.removeEventListener('contextmenu', preventDefault);
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    function preventDefault(e) { e.preventDefault(); }

    function handlePopState(e) {
        // Trap the user: push state again so they stay on the page
        history.pushState(null, document.title, location.href);
        showAlert('Akses Ditolak', 'Anda tidak diperbolehkan kembali ke halaman sebelumnya selama ujian berlangsung.', 'warning');
    }

    function handleBeforeUnload(e) {
        // This triggers the browser's native "Leave site?" dialog
        e.preventDefault();
        e.returnValue = '';
    }

    function handleVisibility() {
        if (document.hidden && state.isExamActive) {
            state.violationCount++;
            saveState();

            const max = 5;
            if (state.violationCount < max) {
                showAlert('FOKUS!', `Anda terdeteksi keluar dari halaman ujian (${state.violationCount}/${max}).\nJika mencapai batas maksimal, ujian akan direset.`, 'warning');
            } else {
                showAlert('FOKUS!', 'Anda telah melanggar batas toleransi. Ujian akan direset dari awal.', 'danger', () => {
                    resetExamHard();
                });
            }
        }
    }

    function resetExamHard() {
        localStorage.removeItem('exam_state');
        window.location.reload();
    }

    // --- Custom Modal System ---
    function showModal(title, msg, type = 'info', actions = []) {
        modal.title.textContent = title;
        modal.msg.textContent = msg;

        // Icon & Color
        if (type === 'danger') {
            modal.icon.textContent = '⛔';
            modal.icon.style.color = 'var(--danger)';
        } else if (type === 'warning') {
            modal.icon.textContent = '⚠️';
            modal.icon.style.color = 'var(--warning)';
        } else {
            modal.icon.textContent = 'ℹ️';
            modal.icon.style.color = 'var(--primary)';
        }

        // Buttons
        modal.actions.innerHTML = '';
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `modal-btn ${action.cls || 'confirm'}`;
            btn.textContent = action.text;
            btn.onclick = () => {
                closeModal();
                if (action.onClick) action.onClick();
            };
            modal.actions.appendChild(btn);
        });

        modal.overlay.classList.remove('hidden');
        // Add active class for animation/visibility
        setTimeout(() => modal.overlay.classList.add('active'), 10);
    }

    function showLoading(msg) {
        modal.title.textContent = 'Mohon Tunggu';
        modal.msg.textContent = msg;
        modal.icon.innerHTML = '<div class="spinner"></div>'; // Use innerHTML for spinner
        modal.actions.innerHTML = ''; // No buttons
        modal.actions.innerHTML = ''; // No buttons
        modal.overlay.classList.remove('hidden');
        setTimeout(() => modal.overlay.classList.add('active'), 10);
    }

    function closeModal() {
        modal.overlay.classList.remove('active');
        setTimeout(() => modal.overlay.classList.add('hidden'), 300);
    }

    // Helper Wrappers
    function showAlert(title, msg, type = 'info', onOk = null) {
        showModal(title, msg, type, [
            { text: 'OK', cls: 'confirm', onClick: onOk }
        ]);
    }

    function showConfirm(title, msg, onYes) {
        showModal(title, msg, 'info', [
            { text: 'Batal', cls: 'cancel' },
            { text: 'Ya, Selesaikan', cls: 'confirm', onClick: onYes }
        ]);
    }

    // Print Button
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.onclick = () => window.print();
    }

    // --- Utility ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

});
