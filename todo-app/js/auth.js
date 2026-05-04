// js/auth.js

window.Auth = (function () {

  // ── Validation ─────────────────────────────────────
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function validatePassword(pass) {
    const len     = pass.length;
    const hasUpper = /[A-Z]/.test(pass);
    const hasDigit = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass);

    if (len < 6)  return { valid: false, strength: 'weak',   message: 'Minimal 6 karakter diperlukan' };
    if (len < 8 || (!hasDigit && !hasUpper)) return { valid: true, strength: 'weak', message: 'Lemah' };
    if (len >= 8 && (hasDigit || hasUpper) && !hasSpecial) return { valid: true, strength: 'medium', message: 'Sedang' };
    return { valid: true, strength: 'strong', message: 'Kuat' };
  }

  // ── Simple hash ────────────────────────────────────
  function hashPassword(pass) {
    return btoa(encodeURIComponent(pass));
  }

  // ── Register ───────────────────────────────────────
  function register(name, email, password) {
    const users  = Utils.getUsers();
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) {
      return { success: false, message: 'Email sudah terdaftar.' };
    }

    const userId = Utils.generateId();
    const user   = {
      id:         userId,
      name:       name.trim(),
      email:      email.trim().toLowerCase(),
      password:   hashPassword(password),
      createdAt:  new Date().toISOString()
    };

    users.push(user);
    Utils.saveUsers(users);

    // Seed tasks
    const seeds = getSeedTasks(userId);
    Utils.saveTasksByUser(userId, seeds);

    // Save session (sans password)
    const { password: _, ...safeUser } = user;
    Utils.saveSession(safeUser);

    return { success: true };
  }

  // ── Login ──────────────────────────────────────────
  function login(email, password) {
    const users = Utils.getUsers();
    const user  = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) return { success: false, message: 'Tidak ada akun dengan email ini.' };
    if (user.password !== hashPassword(password)) return { success: false, message: 'Kata sandi salah.' };

    const { password: _, ...safeUser } = user;
    Utils.saveSession(safeUser);
    return { success: true };
  }

  // ── Logout ─────────────────────────────────────────
  function logout() {
    Utils.clearSession();
    Utils.navigateTo('auth.html');
  }

  // ── Auth Check ─────────────────────────────────────
  function checkAuth() {
    return Utils.getSession();
  }

  function requireAuth() {
    const session = Utils.getSession();
    if (!session) {
      Utils.navigateTo('auth.html');
      return null;
    }
    return session;
  }

  function redirectIfLoggedIn() {
    const session = Utils.getSession();
    if (session) {
      Utils.navigateTo('dashboard.html');
    }
  }

  // ── Seed Tasks ─────────────────────────────────────
  function getSeedTasks(userId) {
    const now    = new Date();
    const today  = now.toISOString().split('T')[0];
    const tmr    = new Date(now); tmr.setDate(tmr.getDate() + 1);
    const next3  = new Date(now); next3.setDate(next3.getDate() + 3);
    const next7  = new Date(now); next7.setDate(next7.getDate() + 7);

    return [
      {
        id: Utils.generateId(), userId,
        title:       'Tinjau proposal proyek',
        description: 'Periksa proposal proyek Q3 dan tinggalkan komentar untuk tim.',
        priority:    'high',
        category:    'work',
        deadline:    today,
        isCompleted: false, isImportant: true, isTrashed: false,
        createdAt:   new Date().toISOString(), completedAt: null
      },
      {
        id: Utils.generateId(), userId,
        title:       'Olahraga pagi',
        description: '30 menit kardio + latihan kekuatan. Jangan dilewatkan!',
        priority:    'medium',
        category:    'health',
        deadline:    tmr.toISOString().split('T')[0],
        isCompleted: false, isImportant: false, isTrashed: false,
        createdAt:   new Date().toISOString(), completedAt: null
      },
      {
        id: Utils.generateId(), userId,
        title:       'Baca "Atomic Habits" bab 5',
        description: 'Fokus pada konsep habit stacking dan buat catatan.',
        priority:    'low',
        category:    'learning',
        deadline:    next3.toISOString().split('T')[0],
        isCompleted: true, isImportant: false, isTrashed: false,
        createdAt:   new Date(now.getTime() - 86400000).toISOString(),
        completedAt: new Date().toISOString()
      },
      {
        id: Utils.generateId(), userId,
        title:       'Rencanakan liburan akhir pekan',
        description: 'Cari destinasi, pesan akomodasi, dan tetapkan anggaran.',
        priority:    'low',
        category:    'personal',
        deadline:    next7.toISOString().split('T')[0],
        isCompleted: false, isImportant: false, isTrashed: false,
        createdAt:   new Date(now.getTime() - 3600000).toISOString(), completedAt: null
      }
    ];
  }

  return {
    validateEmail, validatePassword,
    register, login, logout,
    checkAuth, requireAuth, redirectIfLoggedIn,
    getSeedTasks
  };
})();

// ── Auth Page Logic ─────────────────────────────────
(function () {
  const isAuthPage = document.querySelector('.auth-page');
  if (!isAuthPage) return;

  Auth.redirectIfLoggedIn();

  // Tab toggle
  const tabs    = document.querySelectorAll('.auth-tab');
  const panels  = document.querySelectorAll('.auth-form-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel-' + target).classList.add('active');
    });
  });

  // Switch links
  document.querySelectorAll('[data-switch]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const target = el.dataset.switch;
      document.querySelector('[data-tab="' + target + '"]').click();
    });
  });

  // Password show/hide
  document.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling || btn.parentElement.querySelector('input');
      if (input && input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
      } else if (input) {
        input.type = 'password';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
      }
    });
  });

  // Password strength indicator
  const regPassInput = document.getElementById('reg-password');
  if (regPassInput) {
    regPassInput.addEventListener('input', () => {
      const { strength } = Auth.validatePassword(regPassInput.value);
      const bar   = document.getElementById('strength-bar');
      const label = document.getElementById('strength-label');
      if (!bar || !label) return;
      bar.className   = 'strength-bar-fill ' + strength;
      label.className = 'strength-label '    + strength;
      const msgs = { weak: 'Kata sandi lemah', medium: 'Kekuatan sedang', strong: 'Kata sandi kuat' };
      label.textContent = regPassInput.value ? msgs[strength] : '';
    });
  }

  // Show field error helper
  function showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
    const input = el.previousElementSibling?.querySelector('input') ||
                  el.parentElement.querySelector('input');
    if (input) input.classList.add('error');
  }

  function clearErrors(formId) {
    document.querySelectorAll('#' + formId + ' .field-error').forEach(el => {
      el.classList.remove('visible');
      el.textContent = '';
    });
    document.querySelectorAll('#' + formId + ' .form-input').forEach(el => {
      el.classList.remove('error');
    });
  }

  // ── Login Form ─────────────────────────────────────
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors('login-form');

      const email    = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      let valid      = true;

      if (!Auth.validateEmail(email)) {
        showError('login-email-error', 'Masukkan email yang valid.'); valid = false;
      }
      if (!password) {
        showError('login-pass-error', 'Kata sandi wajib diisi.'); valid = false;
      }
      if (!valid) return;

      const btn = loginForm.querySelector('.btn-submit');
      btn.classList.add('loading');

      setTimeout(() => {
        const result = Auth.login(email, password);
        btn.classList.remove('loading');
        if (result.success) {
          Utils.showToast('Selamat datang kembali!', 'success');
          setTimeout(() => Utils.navigateTo('dashboard.html'), 500);
        } else {
          showError('login-email-error', result.message);
        }
      }, 600);
    });
  }

  // ── Register Form ──────────────────────────────────
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', e => {
      e.preventDefault();
      clearErrors('register-form');

      const name     = document.getElementById('reg-name').value;
      const email    = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const confirm  = document.getElementById('reg-confirm').value;
      let valid      = true;

      if (!name.trim()) {
        showError('reg-name-error', 'Nama lengkap wajib diisi.'); valid = false;
      }
      if (!Auth.validateEmail(email)) {
        showError('reg-email-error', 'Masukkan email yang valid.'); valid = false;
      }
      const passResult = Auth.validatePassword(password);
      if (!passResult.valid) {
        showError('reg-pass-error', passResult.message); valid = false;
      }
      if (password !== confirm) {
        showError('reg-confirm-error', 'Kata sandi tidak cocok.'); valid = false;
      }
      if (!valid) return;

      const btn = registerForm.querySelector('.btn-submit');
      btn.classList.add('loading');

      setTimeout(() => {
        const result = Auth.register(name, email, password);
        btn.classList.remove('loading');
        if (result.success) {
          Utils.showToast('Akun berhasil dibuat!', 'success');
          setTimeout(() => Utils.navigateTo('dashboard.html'), 500);
        } else {
          showError('reg-email-error', result.message);
        }
      }, 700);
    });
  }
})();
