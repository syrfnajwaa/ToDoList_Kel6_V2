// js/tasks.js

window.Tasks = (function () {
  let _userId = null;
  let _tasks  = [];
  let _filter   = 'all';
  let _category = 'all';
  let _search   = '';
  let _sort     = 'newest';

  // ── Init ────────────────────────────────────────────
  function init(userId) {
    _userId = userId;
    _tasks  = Utils.getTasksByUser(userId);
  }

  // ── Save ────────────────────────────────────────────
  function _save() {
    Utils.saveTasksByUser(_userId, _tasks);
  }

  // ── CRUD ────────────────────────────────────────────
  function add(taskData) {
    const task = {
      id:          Utils.generateId(),
      userId:      _userId,
      title:       taskData.title.trim(),
      description: (taskData.description || '').trim(),
      priority:    taskData.priority  || 'medium',
      category:    taskData.category  || 'other',
      deadline:    taskData.deadline  || null,
      isCompleted: false,
      isImportant: false,
      isTrashed:   false,
      createdAt:   new Date().toISOString(),
      completedAt: null
    };
    _tasks.unshift(task);
    _save();
    UI.renderAll();
    Utils.showToast('Tugas ditambahkan!', 'success');
    return task;
  }

  function update(id, changes) {
    const idx = _tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    _tasks[idx] = { ..._tasks[idx], ...changes };
    _save();
    UI.renderAll();
    Utils.showToast('Tugas diperbarui!', 'success');
  }

  function remove(id) {
    const idx = _tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    _tasks[idx].isTrashed = true;
    _save();
    UI.renderAll();
    Utils.showToast('Dipindahkan ke Sampah', 'info');
  }

  function restore(id) {
    const idx = _tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    _tasks[idx].isTrashed = false;
    _save();
    UI.renderAll();
    Utils.showToast('Tugas dipulihkan', 'success');
  }

  function permanentDelete(id) {
    _tasks = _tasks.filter(t => t.id !== id);
    _save();
    UI.renderAll();
    Utils.showToast('Dihapus permanen', 'info');
  }

  function toggleComplete(id) {
    const idx = _tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    _tasks[idx].isCompleted  = !_tasks[idx].isCompleted;
    _tasks[idx].completedAt  = _tasks[idx].isCompleted ? new Date().toISOString() : null;
    _save();
    UI.renderAll();
  }

  function toggleImportant(id) {
    const idx = _tasks.findIndex(t => t.id === id);
    if (idx === -1) return;
    _tasks[idx].isImportant = !_tasks[idx].isImportant;
    _save();
    UI.renderAll();
  }

  // ── Getters ─────────────────────────────────────────
  function getAll() { return _tasks; }

  function getById(id) { return _tasks.find(t => t.id === id); }

  function getFiltered() {
    let list = [..._tasks];

    // Filter by view
    switch (_filter) {
      case 'today':
        list = list.filter(t => !t.isTrashed && Utils.isToday(t.deadline));
        break;
      case 'important':
        list = list.filter(t => !t.isTrashed && t.isImportant);
        break;
      case 'completed':
        list = list.filter(t => !t.isTrashed && t.isCompleted);
        break;
      case 'trash':
        list = list.filter(t => t.isTrashed);
        break;
      default:
        list = list.filter(t => !t.isTrashed);
    }

    // Filter by category
    if (_category !== 'all') {
      list = list.filter(t => t.category === _category);
    }

    // Search
    if (_search.trim()) {
      const q = _search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }

    // Sort
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    switch (_sort) {
      case 'oldest':
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'priority':
        list.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
        break;
      case 'az':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default: // newest
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }

  // ── Setters ─────────────────────────────────────────
  function setFilter(f)   { _filter   = f; _category = 'all'; UI.renderAll(); }
  function setCategory(c) { _category = c; UI.renderAll(); }
  function setSort(s)     { _sort     = s; UI.renderAll(); }

  let _searchTimer;
  function setSearch(q) {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => {
      _search = q;
      UI.renderAll();
    }, 300);
  }

  // ── Stats ────────────────────────────────────────────
  function getStats() {
    const active  = _tasks.filter(t => !t.isTrashed);
    const today   = active.filter(t => Utils.isToday(t.deadline));
    const now     = new Date(); now.setHours(0,0,0,0);

    return {
      total:         active.length,
      completed:     active.filter(t => t.isCompleted).length,
      today:         today.length,
      todayCompleted:today.filter(t => t.isCompleted).length,
      important:     active.filter(t => t.isImportant).length,
      trashed:       _tasks.filter(t => t.isTrashed).length,
      overdue:       active.filter(t => {
        if (!t.deadline || t.isCompleted) return false;
        return new Date(t.deadline + 'T00:00:00') < now;
      }).length,
      currentFilter:    _filter,
      currentCategory:  _category,
      currentSearch:    _search
    };
  }

  return {
    init,
    add, update, remove, restore, permanentDelete,
    toggleComplete, toggleImportant,
    getAll, getById, getFiltered,
    setFilter, setCategory, setSort, setSearch,
    getStats
  };
})();
