// ========== FocusFlow - Shared Main Script ==========
// Handles: theme toggle, mobile menu, year, hero stats, toast utility

(function () {
    'use strict';

    // ----- Year in footer -----
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // ----- Theme Toggle (light / dark) -----
    const themeBtn = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('ff_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeBtn) {
        themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        themeBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('ff_theme', next);
            themeBtn.textContent = next === 'dark' ? '☀️' : '🌙';
        });
    }

    // ----- Mobile Menu Toggle -----
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
        });
        // Close menu when a nav link is clicked
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mainNav.classList.remove('open'));
        });
    }

    // ----- Update Home Page Stats from LocalStorage -----
    const statSessions = document.getElementById('statSessions');
    const statTasks = document.getElementById('statTasks');
    const statMinutes = document.getElementById('statMinutes');

    if (statSessions || statTasks || statMinutes) {
        const today = new Date().toDateString();
        const stats = JSON.parse(localStorage.getItem('ff_stats') || '{}');
        const todayStats = stats[today] || { sessions: 0, minutes: 0 };
        const tasks = JSON.parse(localStorage.getItem('ff_tasks') || '[]');
        const doneCount = tasks.filter(t => t.done).length;

        if (statSessions) animateNumber(statSessions, todayStats.sessions);
        if (statMinutes) animateNumber(statMinutes, todayStats.minutes);
        if (statTasks) animateNumber(statTasks, doneCount);
    }

    function animateNumber(el, target) {
        const duration = 1000;
        const start = performance.now();
        const initial = 0;
        function step(now) {
            const progress = Math.min((now - start) / duration, 1);
            el.textContent = Math.floor(initial + (target - initial) * progress);
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // ----- Toast Utility (global) -----
    window.showToast = function (msg) {
        let toast = document.querySelector('.toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
    };
})();
