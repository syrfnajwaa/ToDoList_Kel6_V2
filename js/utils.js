// js/utils.js

window.Utils = (function () {
  // ── ID Generation ─────────────────────────────────
  function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // ── Users ─────────────────────────────────────────
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem('taskly_users') || '[]');
    } catch { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem('taskly_users', JSON.stringify(users));
  }

  // ── Session ───────────────────────────────────────
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem('taskly_session') || 'null');
    } catch { return null; }
  }

  function saveSession(user) {
    localStorage.setItem('taskly_session', JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem('taskly_session');
  }

  // ── Tasks Storage ──────────────────────────────────
  function getTasksByUser(userId) {
    try {
      return JSON.parse(localStorage.getItem('taskly_tasks_' + userId) || '[]');
    } catch { return []; }
  }

  function saveTasksByUser(userId, tasks) {
    localStorage.setItem('taskly_tasks_' + userId, JSON.stringify(tasks));
  }

  // ── Date Formatting ────────────────────────────────
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function isToday(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    const d = new Date(dateStr + 'T00:00:00');
    return d.getFullYear() === today.getFullYear() &&
           d.getMonth()    === today.getMonth()    &&
           d.getDate()     === today.getDate();
  }

  function getDeadlineStatus(dateStr) {
    if (!dateStr) return { label: '', type: 'none' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(dateStr + 'T00:00:00');
    deadline.setHours(0, 0, 0, 0);
    const diffMs   = deadline - today;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0)  return { label: 'Terlambat ' + formatDate(dateStr), type: 'overdue' };
    if (diffDays === 0) return { label: 'Hari ini',                           type: 'today'  };
    if (diffDays <= 3)  return { label: 'Dalam ' + diffDays + ' hari',        type: 'soon'   };

    return { label: formatDate(dateStr), type: 'safe' };
  }

  // ── String Helpers ─────────────────────────────────
  function getInitials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('');
  }

  const AVATAR_COLORS = [
    '#00F5D4', '#9B72CF', '#FF6B6B', '#FFB347', '#2ED573', '#54A0FF'
  ];

  function getAvatarColor(name) {
    if (!name) return AVATAR_COLORS[0];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
  }

  // ── Page Transition ────────────────────────────────
  function navigateTo(url) {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.25s ease';
    setTimeout(() => { window.location.href = url; }, 250);
  }

  // ── Toast ──────────────────────────────────────────
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 2800);
  }

  return {
    generateId,
    getUsers, saveUsers,
    getSession, saveSession, clearSession,
    getTasksByUser, saveTasksByUser,
    formatDate, isToday, getDeadlineStatus,
    getInitials, getAvatarColor,
    navigateTo, showToast
  };
})();
