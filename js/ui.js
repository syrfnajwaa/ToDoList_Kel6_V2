// js/ui.js

window.UI = (function () {
  let _currentUser = null;

  // ── Set User ─────────────────────────────────────────
  function setUser(user) { _currentUser = user; }

  // ── Render All ───────────────────────────────────────
  function renderAll() {
    renderSidebar();
    renderHeader();
    renderTaskList(Tasks.getFiltered());
    renderCategoryChips();
  }

  // ── Render Sidebar ───────────────────────────────────
  function renderSidebar() {
    if (!_currentUser) return;
    const stats    = Tasks.getStats();
    const initials = Utils.getInitials(_currentUser.name);
    const color    = Utils.getAvatarColor(_currentUser.name);

    const avatarEl = document.getElementById('user-avatar');
    const nameEl   = document.getElementById('user-name');
    const emailEl  = document.getElementById('user-email');
    if (avatarEl) { avatarEl.textContent = initials; avatarEl.style.background = color; }
    if (nameEl)   nameEl.textContent  = _currentUser.name;
    if (emailEl)  emailEl.textContent = _currentUser.email;

    // Badges
    const badges = {
      'badge-all':       stats.total,
      'badge-today':     stats.today,
      'badge-important': stats.important,
      'badge-completed': stats.completed,
      'badge-trash':     stats.trashed
    };
    Object.entries(badges).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    // Today badge alert if overdue
    const todayBadge = document.getElementById('badge-today');
    if (todayBadge) {
      todayBadge.classList.toggle('alert', stats.overdue > 0);
    }

    // Active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.filter === stats.currentFilter);
    });

    // Bottom nav active (mobile)
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.filter === stats.currentFilter);
    });
  }

  // ── Render Header ─────────────────────────────────────
  function renderHeader() {
    const stats = Tasks.getStats();
    const titles = {
      all:       'Semua Tugas',
      today:     'Hari Ini',
      important: 'Penting',
      completed: 'Selesai',
      trash:     'Sampah'
    };
    const subtitles = {
      all:       'Semua tugas dalam satu tempat',
      today:     'Fokus pada hari ini',
      important: 'Tugas berbintang Anda',
      completed: 'Kerja bagus sejauh ini!',
      trash:     'Item menunggu penghapusan'
    };

    const titleEl    = document.getElementById('header-title');
    const subtitleEl = document.getElementById('header-subtitle');
    if (titleEl)    titleEl.textContent    = titles[stats.currentFilter]    || 'Tasks';
    if (subtitleEl) subtitleEl.textContent = subtitles[stats.currentFilter] || '';

    // Progress bar (today only)
    const progressWrap = document.getElementById('today-progress');
    if (progressWrap) {
      const showProgress = stats.currentFilter === 'today';
      progressWrap.classList.toggle('visible', showProgress);
      if (showProgress) updateProgressBar(stats.todayCompleted, stats.today);
    }

    // Trash banner
    const trashBanner = document.getElementById('trash-banner');
    if (trashBanner) {
      trashBanner.classList.toggle('visible', stats.currentFilter === 'trash');
    }
  }

  // ── Progress Bar ──────────────────────────────────────
  function updateProgressBar(done, total) {
    const fill  = document.getElementById('progress-fill');
    const label = document.getElementById('progress-label-text');
    if (!fill) return;
    const pct = total ? Math.round((done / total) * 100) : 0;
    requestAnimationFrame(() => { fill.style.width = pct + '%'; });
    if (label) label.textContent = done + ' / ' + total + ' tasks completed today';
  }

  // ── Category Chips ────────────────────────────────────
  function renderCategoryChips() {
    const stats = Tasks.getStats();
    document.querySelectorAll('.cat-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.cat === stats.currentCategory);
    });
  }

  // ── Render Task List ──────────────────────────────────
  function renderTaskList(tasks) {
    const container = document.getElementById('task-list');
    if (!container) return;

    // Show skeleton briefly on first load
    if (container.dataset.firstLoad !== 'done') {
      container.innerHTML = _skeletonHTML();
      container.dataset.firstLoad = 'done';
      setTimeout(() => _renderTasks(container, tasks), 500);
    } else {
      _renderTasks(container, tasks);
    }
  }

  function _renderTasks(container, tasks) {
    if (!tasks.length) {
      container.innerHTML = _emptyStateHTML(Tasks.getStats().currentFilter);
      return;
    }
    container.innerHTML = tasks.map((task, i) => renderTaskCard(task, i)).join('');
    _attachCardEvents(container);
  }

  // ── Render Task Card ──────────────────────────────────
  function renderTaskCard(task, index) {
    const deadline = Utils.getDeadlineStatus(task.deadline);
    const isTrash  = Tasks.getStats().currentFilter === 'trash';

    const deadlineHTML = deadline.type !== 'none' ? `
      <span class="task-deadline ${deadline.type}">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        ${deadline.label}
      </span>` : '';

    const categoryHTML = `<span class="task-category-tag">${task.category}</span>`;

    const trashActions = isTrash ? `
      <button class="task-action-btn restore" data-id="${task.id}" aria-label="Restore task" title="Restore">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.87"/>
        </svg>
      </button>
      <button class="task-action-btn delete perm" data-id="${task.id}" aria-label="Delete permanently" title="Delete forever">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>` : `
      <button class="task-action-btn star ${task.isImportant ? 'active' : ''}" data-id="${task.id}" aria-label="Star task" title="Star">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="${task.isImportant ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>
      <button class="task-action-btn edit" data-id="${task.id}" aria-label="Edit task" title="Edit">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="task-action-btn delete" data-id="${task.id}" aria-label="Delete task" title="Move to Trash">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>`;

    return `
      <div class="task-card" data-id="${task.id}"
           style="animation-delay:${index * 50}ms">
        <div class="task-check-wrapper">
          <input type="checkbox" class="task-checkbox" id="check-${task.id}"
                 ${task.isCompleted ? 'checked' : ''}
                 data-id="${task.id}" ${isTrash ? 'disabled' : ''}
                 aria-label="Mark task complete">
          <label class="task-check-label" for="check-${task.id}"></label>
        </div>

        <div class="task-body">
          <div class="task-top">
            <span class="task-title ${task.isCompleted ? 'completed' : ''}">${_esc(task.title)}</span>
            <span class="priority-badge ${task.priority}">${task.priority}</span>
          </div>
          ${task.description ? `<p class="task-desc">${_esc(task.description)}</p>` : ''}
          <div class="task-meta">
            ${deadlineHTML}
            ${categoryHTML}
          </div>
        </div>

        <div class="task-actions">
          ${trashActions}
        </div>
      </div>`;
  }

  // ── Empty State ────────────────────────────────────────
  function _emptyStateHTML(filter) {
    const states = {
      all: {
        title: 'No tasks yet',
        desc:  'Click "+ New Task" or the button below to add your first task.',
        action: true
      },
      today: {
        title: 'Nothing due today',
        desc:  'You\'re all clear! Enjoy your day or plan tomorrow.',
        action: false
      },
      important: {
        title: 'No starred tasks',
        desc:  'Star tasks to highlight what matters most to you.',
        action: false
      },
      completed: {
        title: 'Nothing completed yet',
        desc:  'Start checking off tasks to see them here.',
        action: false
      },
      trash: {
        title: 'Trash is empty',
        desc:  'Deleted tasks will appear here before permanent removal.',
        action: false
      }
    };

    const s = states[filter] || states.all;

    return `
      <div class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <h3 class="empty-title">${s.title}</h3>
        <p class="empty-desc">${s.desc}</p>
        ${s.action ? `
          <button class="btn btn-primary" onclick="UI.openModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tambah Tugas Pertama
          </button>` : ''}
      </div>`;
  }

  // ── Skeleton ───────────────────────────────────────────
  function _skeletonHTML() {
    const card = `
      <div class="skeleton-card">
        <div class="skeleton skeleton-circle"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line w-3-4"></div>
          <div class="skeleton skeleton-line w-1-2"></div>
          <div class="skeleton skeleton-line w-1-3"></div>
        </div>
      </div>`;
    return card + card + card;
  }

  // ── Attach Card Events ────────────────────────────────
  function _attachCardEvents(container) {
    // Checkbox toggle
    container.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const id   = cb.dataset.id;
        const card = cb.closest('.task-card');
        card.classList.add('completing');
        setTimeout(() => Tasks.toggleComplete(id), 250);
      });
    });

    // Star
    container.querySelectorAll('.task-action-btn.star').forEach(btn => {
      btn.addEventListener('click', () => Tasks.toggleImportant(btn.dataset.id));
    });

    // Edit
    container.querySelectorAll('.task-action-btn.edit').forEach(btn => {
      btn.addEventListener('click', () => openModal(btn.dataset.id));
    });

    // Trash (soft delete)
    container.querySelectorAll('.task-action-btn.delete:not(.perm)').forEach(btn => {
      btn.addEventListener('click', () => Tasks.remove(btn.dataset.id));
    });

    // Restore from trash
    container.querySelectorAll('.task-action-btn.restore').forEach(btn => {
      btn.addEventListener('click', () => Tasks.restore(btn.dataset.id));
    });

    // Permanent delete
    container.querySelectorAll('.task-action-btn.perm').forEach(btn => {
      btn.addEventListener('click', () => _confirmDelete(btn.dataset.id));
    });
  }

  // ── Confirm Delete Dialog ──────────────────────────────
  function _confirmDelete(id) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-card">
        <div class="confirm-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </div>
        <h3 class="confirm-title">Hapus permanen?</h3>
        <p class="confirm-message">Tindakan ini tidak bisa dibatalkan. Tugas akan dihapus selamanya.</p>
        <div class="confirm-actions">
          <button class="btn btn-ghost" id="confirm-cancel">Batal</button>
          <button class="btn btn-danger" id="confirm-ok">Hapus</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('#confirm-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#confirm-ok').addEventListener('click', () => {
      Tasks.permanentDelete(id);
      overlay.remove();
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  // ── Modal ──────────────────────────────────────────────
  function openModal(taskId = null) {
    const overlay = document.getElementById('modal-overlay');
    const title   = document.getElementById('modal-title');
    const fab     = document.getElementById('fab');
    if (!overlay) return;

    // Reset form
    _resetForm();

    if (taskId) {
      const task = Tasks.getById(taskId);
      if (!task) return;
      title.textContent = 'Edit Task';
      document.getElementById('modal-task-id').value     = task.id;
      document.getElementById('task-title-input').value  = task.title;
      document.getElementById('task-desc-input').value   = task.description || '';
      document.getElementById('task-deadline-input').value = task.deadline || '';
      _setPriority(task.priority);
      _setCategory(task.category);
    } else {
      title.textContent = 'New Task';
    }

    overlay.classList.add('open');
    if (fab) fab.classList.add('open');
    setTimeout(() => document.getElementById('task-title-input')?.focus(), 100);
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    const fab     = document.getElementById('fab');
    if (!overlay) return;
    overlay.classList.remove('open');
    if (fab) fab.classList.remove('open');
    _resetForm();
  }

  function _resetForm() {
    const form = document.getElementById('task-form');
    if (form) form.reset();
    document.getElementById('modal-task-id').value = '';
    _setPriority('medium');
    _setCategory('other');
  }

  function _setPriority(p) {
    document.querySelectorAll('.priority-btn').forEach(btn => {
      btn.className = 'priority-btn';
      if (btn.dataset.priority === p) btn.classList.add('active-' + p);
    });
    document.getElementById('priority-hidden').value = p;
  }

  function _setCategory(c) {
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === c);
    });
    document.getElementById('category-hidden').value = c;
  }

  function getFormData() {
    return {
      title:       document.getElementById('task-title-input').value.trim(),
      description: document.getElementById('task-desc-input').value.trim(),
      deadline:    document.getElementById('task-deadline-input').value || null,
      priority:    document.getElementById('priority-hidden').value || 'medium',
      category:    document.getElementById('category-hidden').value || 'other'
    };
  }

  function onFormSubmit() {
    const data = getFormData();
    if (!data.title) {
      document.getElementById('task-title-input').focus();
      Utils.showToast('Judul tugas wajib diisi!', 'error');
      return;
    }
    const taskId = document.getElementById('modal-task-id').value;
    if (taskId) {
      Tasks.update(taskId, data);
    } else {
      Tasks.add(data);
    }
    closeModal();
  }

  // ── Escape Helper ──────────────────────────────────────
  function _esc(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
              .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ── Init ───────────────────────────────────────────────
  function init(user) {
    setUser(user);

    Tasks.init(user.id);
    renderAll();

    // ── Sidebar nav items ──
    document.querySelectorAll('.nav-item[data-filter]').forEach(item => {
      item.addEventListener('click', () => {
        Tasks.setFilter(item.dataset.filter);
        // Close mobile sidebar
        document.getElementById('sidebar')?.classList.remove('mobile-open');
        document.getElementById('sidebar-overlay')?.classList.remove('active');
      });
    });

    // ── Bottom nav ──
    document.querySelectorAll('.bottom-nav-item[data-filter]').forEach(item => {
      item.addEventListener('click', () => Tasks.setFilter(item.dataset.filter));
    });

    // ── Search ──
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => Tasks.setSearch(searchInput.value));
      searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
    }

    // ── Sort ──
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => Tasks.setSort(sortSelect.value));
    }

    // ── Category chips ──
    document.querySelectorAll('.cat-chip').forEach(chip => {
      chip.addEventListener('click', () => Tasks.setCategory(chip.dataset.cat));
    });

    // ── New Task button ──
    document.getElementById('btn-new-task')?.addEventListener('click', () => openModal());

    // ── FAB ──
    document.getElementById('fab')?.addEventListener('click', () => {
      const overlay = document.getElementById('modal-overlay');
      if (overlay?.classList.contains('open')) closeModal();
      else openModal();
    });

    // ── Modal overlay click ──
    document.getElementById('modal-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'modal-overlay') closeModal();
    });

    // ── Modal close button ──
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-cancel')?.addEventListener('click', closeModal);

    // ── Modal form submit ──
    document.getElementById('modal-save')?.addEventListener('click', onFormSubmit);

    // ── Priority buttons ──
    document.querySelectorAll('.priority-btn').forEach(btn => {
      btn.addEventListener('click', () => _setPriority(btn.dataset.priority));
    });

    // ── Category buttons ──
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => _setCategory(btn.dataset.category));
    });

    // ── Escape key ──
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });

    // ── Hamburger (mobile) ──
    document.getElementById('hamburger')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('mobile-open');
      document.getElementById('sidebar-overlay')?.classList.toggle('active');
    });

    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.remove('mobile-open');
      document.getElementById('sidebar-overlay')?.classList.remove('active');
    });

    // ── Logout ──
    document.getElementById('btn-logout')?.addEventListener('click', () => Auth.logout());

    // ── Trash empty all ──
    document.getElementById('btn-empty-trash')?.addEventListener('click', () => {
      const trashed = Tasks.getAll().filter(t => t.isTrashed);
      if (!trashed.length) return;
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-card">
          <div class="confirm-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </div>
          <h3 class="confirm-title">Kosongkan Sampah?</h3>
          <p class="confirm-message">${trashed.length} tugas di sampah akan dihapus permanen.</p>
          <div class="confirm-actions">
            <button class="btn btn-ghost" id="confirm-cancel">Batal</button>
            <button class="btn btn-danger" id="confirm-ok">Kosongkan Sampah</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#confirm-cancel').addEventListener('click', () => overlay.remove());
      overlay.querySelector('#confirm-ok').addEventListener('click', () => {
        trashed.forEach(t => Tasks.permanentDelete(t.id));
        overlay.remove();
      });
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    });
  }

  return {
    init, setUser,
    renderAll, renderSidebar, renderHeader,
    renderTaskList, renderTaskCard,
    openModal, closeModal, getFormData, onFormSubmit
  };
})();
