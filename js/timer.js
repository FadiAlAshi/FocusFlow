// ========== FocusFlow - Pomodoro Timer ==========
(function () {
    'use strict';

    const MODES = {
        focus: { label: 'Focus Session', minutes: 25 },
        short: { label: 'Short Break', minutes: 5 },
        long:  { label: 'Long Break', minutes: 15 }
    };

    const timeDisplay  = document.getElementById('timeDisplay');
    const modeLabel    = document.getElementById('modeLabel');
    const startBtn     = document.getElementById('startBtn');
    const pauseBtn     = document.getElementById('pauseBtn');
    const resetBtn     = document.getElementById('resetBtn');
    const tabs         = document.querySelectorAll('.tab');
    const progressRing = document.getElementById('progressRing');
    const sessionCount = document.getElementById('sessionCount');
    const minuteCount  = document.getElementById('minuteCount');
    const currentSess  = document.getElementById('currentSession');
    const resetStats   = document.getElementById('resetStats');
    const alertSound   = document.getElementById('alertSound');
    const taskInput    = document.getElementById('currentTask');

    if (!timeDisplay) return;

    const CIRCUMFERENCE = 2 * Math.PI * 90; // r=90
    progressRing.style.strokeDasharray = CIRCUMFERENCE;
    progressRing.style.strokeDashoffset = 0;

    let currentMode = 'focus';
    let totalSeconds = MODES.focus.minutes * 60;
    let remaining = totalSeconds;
    let intervalId = null;
    let isRunning = false;

    // ----- LocalStorage helpers -----
    function getTodayKey() { return new Date().toDateString(); }

    function getStats() {
        const all = JSON.parse(localStorage.getItem('ff_stats') || '{}');
        const today = getTodayKey();
        return all[today] || { sessions: 0, minutes: 0 };
    }

    function saveStats(stats) {
        const all = JSON.parse(localStorage.getItem('ff_stats') || '{}');
        all[getTodayKey()] = stats;
        localStorage.setItem('ff_stats', JSON.stringify(all));
    }

    function refreshStatsUI() {
        const s = getStats();
        sessionCount.textContent = s.sessions;
        minuteCount.textContent  = s.minutes;
        currentSess.textContent  = s.sessions + 1;
    }

    // ----- Saved task -----
    const savedTask = localStorage.getItem('ff_currentTask');
    if (savedTask) taskInput.value = savedTask;
    taskInput.addEventListener('input', () => {
        localStorage.setItem('ff_currentTask', taskInput.value);
    });

    // ----- Render time -----
    function render() {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        const text = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        timeDisplay.textContent = text;
        document.title = `${text} · FocusFlow`;

        const ratio = remaining / totalSeconds;
        progressRing.style.strokeDashoffset = CIRCUMFERENCE * (1 - ratio);
    }

    // ----- Tab switching -----
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (isRunning && !confirm('Switching mode will reset the current timer. Continue?')) return;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMode = tab.dataset.mode;
            totalSeconds = parseInt(tab.dataset.time, 10) * 60;
            remaining = totalSeconds;
            modeLabel.textContent = MODES[currentMode].label;
            stopTimer();
            render();
        });
    });

    // ----- Start / Pause / Reset -----
    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        startBtn.textContent = '▶ Running...';

        intervalId = setInterval(() => {
            remaining--;
            render();
            if (remaining <= 0) finishTimer();
        }, 1000);
    }

    function pauseTimer() {
        if (!isRunning) return;
        isRunning = false;
        clearInterval(intervalId);
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        startBtn.textContent = '▶ Resume';
    }

    function stopTimer() {
        clearInterval(intervalId);
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        startBtn.textContent = '▶ Start';
    }

    function resetTimer() {
        stopTimer();
        remaining = totalSeconds;
        render();
    }

    function finishTimer() {
        stopTimer();
        try { alertSound.play().catch(() => {}); } catch (e) {}
        // Browser notification beep using the AudioContext
        playBeep();

        if (currentMode === 'focus') {
            const stats = getStats();
            stats.sessions += 1;
            stats.minutes += MODES.focus.minutes;
            saveStats(stats);
            refreshStatsUI();
            window.showToast && window.showToast('🎉 Great job! Focus session complete.');
        } else {
            window.showToast && window.showToast('⏰ Break over — back to work!');
        }
        // Reset
        remaining = totalSeconds;
        render();
    }

    function playBeep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
            osc.start();
            osc.stop(ctx.currentTime + 0.8);
        } catch (e) {}
    }

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    if (resetStats) {
        resetStats.addEventListener('click', () => {
            if (confirm('Reset all of today\'s stats?')) {
                saveStats({ sessions: 0, minutes: 0 });
                refreshStatsUI();
                window.showToast && window.showToast('Stats reset.');
            }
        });
    }

    // Init
    modeLabel.textContent = MODES[currentMode].label;
    render();
    refreshStatsUI();

    // Warn before leaving while running
    window.addEventListener('beforeunload', (e) => {
        if (isRunning) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
})();
