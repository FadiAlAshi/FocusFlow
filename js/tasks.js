// ========== FocusFlow - Task Manager ==========
(function () {
    'use strict';

    const form          = document.getElementById('taskForm');
    const tbody         = document.getElementById('tasksBody');
    const filterStatus  = document.getElementById('filterStatus');
    const searchInput   = document.getElementById('searchTask');
    const totalEl       = document.getElementById('totalTasks');
    const doneEl        = document.getElementById('doneTasks');
    const activeEl      = document.getElementById('activeTasks');
    const progressFill  = document.getElementById('progressFill');
    const progressLabel = document.getElementById('progressLabel');
    const clearAllBtn   = document.getElementById('clearAll');
    const errTitle      = document.getElementById('errTitle');

    if (!form) return;

    let tasks = JSON.parse(localStorage.getItem('ff_tasks') || '[]');

    // ----- Save & Render -----
    function save() {
        localStorage.setItem('ff_tasks', JSON.stringify(tasks));
    }

    function priorityLabel(p) {
        return { low: 'Low', medium: 'Medium', high: 'High' }[p] || p;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function render() {
        const filter = filterStatus.value;
        const query  = searchInput.value.trim().toLowerCase();

        let list = tasks.slice();
        if (filter === 'active') list = list.filter(t => !t.done);
        if (filter === 'done')   list = list.filter(t =>  t.done);
        if (query) list = list.filter(t =>
            t.title.toLowerCase().includes(query) ||
            (t.subject || '').toLowerCase().includes(query)
        );

        // Sort: active first, then by priority (high→low), then by due date
        const prio = { high: 0, medium: 1, low: 2 };
        list.sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1;
            if (prio[a.priority] !== prio[b.priority]) return prio[a.priority] - prio[b.priority];
            return (a.due || '').localeCompare(b.due || '');
        });

        if (list.length === 0) {
            tbody.innerHTML = `<tr class="empty-row"><td colspan="6">${
                tasks.length === 0
                    ? 'No tasks yet. Add your first task from the form! 🎯'
                    : 'No tasks match the current filter.'
            }</td></tr>`;
        } else {
            tbody.innerHTML = list.map(t => `
                <tr class="${t.done ? 'done' : ''}" data-id="${t.id}">
                    <td>
                        <input type="checkbox" ${t.done ? 'checked' : ''} class="toggle-done" aria-label="Toggle done">
                    </td>
                    <td>
                        <strong>${escapeHtml(t.title)}</strong>
                        ${t.notes ? `<br><small style="color:var(--text-muted)">${escapeHtml(t.notes)}</small>` : ''}
                    </td>
                    <td>${escapeHtml(t.subject || 'General')}</td>
                    <td><span class="priority-badge priority-${t.priority}">${priorityLabel(t.priority)}</span></td>
                    <td>${t.due ? formatDate(t.due) : '—'}</td>
                    <td>
                        <button class="icon-btn delete-btn" aria-label="Delete">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }

        updateSummary();
    }

    function formatDate(iso) {
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return iso; }
    }

    function updateSummary() {
        const total = tasks.length;
        const done  = tasks.filter(t => t.done).length;
        const active = total - done;
        const pct = total ? Math.round((done / total) * 100) : 0;

        totalEl.textContent  = total;
        doneEl.textContent   = done;
        activeEl.textContent = active;
        progressFill.style.width = pct + '%';
        progressLabel.textContent = pct + '%';
    }

    // ----- Form Submit -----
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const title = (data.get('title') || '').trim();

        errTitle.textContent = '';
        if (title.length < 3) {
            errTitle.textContent = 'Title must be at least 3 characters.';
            return;
        }

        const task = {
            id: Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            title,
            subject:  data.get('subject') || 'General',
            priority: data.get('priority') || 'medium',
            due:      data.get('due') || '',
            notes:    (data.get('notes') || '').trim(),
            done: false,
            created: new Date().toISOString()
        };

        tasks.unshift(task);
        save();
        render();
        form.reset();
        window.showToast && window.showToast('✅ Task added.');
    });

    // ----- Table delegated events -----
    tbody.addEventListener('click', (e) => {
        const row = e.target.closest('tr[data-id]');
        if (!row) return;
        const id = row.dataset.id;

        if (e.target.classList.contains('toggle-done')) {
            const t = tasks.find(x => x.id === id);
            if (t) {
                t.done = e.target.checked;
                save();
                render();
            }
        }

        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Delete this task?')) {
                tasks = tasks.filter(x => x.id !== id);
                save();
                render();
                window.showToast && window.showToast('🗑️ Task deleted.');
            }
        }
    });

    // ----- Filters -----
    filterStatus.addEventListener('change', render);
    searchInput.addEventListener('input', render);

    // ----- Clear All -----
    clearAllBtn.addEventListener('click', () => {
        if (tasks.length === 0) return;
        if (confirm('Clear all tasks? This cannot be undone.')) {
            tasks = [];
            save();
            render();
            window.showToast && window.showToast('All tasks cleared.');
        }
    });

    // Init
    render();
})();
