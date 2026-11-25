// THE VAULT — Authentication Controller (auth.html)
(function () {
  'use strict';

  function initAuth() {
    const auth = window.vaultAuth;
    if (!auth) return;

    const q = s => document.querySelector(s);
    const val = s => q(s)?.value || '';
    const forms = {
      login: q('#auth-login-form'),
      register: q('#auth-register-form'),
      recovery: q('#auth-recovery-form'),
      reset: q('#auth-reset-form')
    };

    const accountPanel = q('#auth-account');
    const statusBox = q('#auth-status');
    const modeLabel = q('#auth-mode-label');
    const panelTitle = q('#auth-panel-title');
    const authModes = q('.auth-modes');

    const params = new URLSearchParams(window.location.search);
    const initialMode = (window.location.hash.includes('type=recovery') || params.get('mode') === 'reset')
      ? 'reset' : 'login';
    let currentMode = initialMode;

    // Validation & UI status helpers
    function displayStatus(msg, type = '') {
      if (!statusBox) return;
      statusBox.textContent = msg;
      statusBox.className = `auth-status ${type}`.trim();
      statusBox.hidden = !msg;
    }

    const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    const isValidPassword = v => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);

    function assertConfigured() {
      if (auth.configured) return true;
      displayStatus('Authentication is not configured yet. Add the Supabase project URL and publishable key before using this form.', 'error');
      return false;
    }

    async function runAuth(fn) {
      try { return await fn(); }
      catch (err) {
        console.error('Authentication service failure:', err);
        displayStatus('The authentication service could not be reached. Please try again.', 'error');
        return null;
      }
    }

    // SPA tab switching across login, register, recovery, and reset forms
    function switchMode(mode) {
      currentMode = mode;
      Object.entries(forms).forEach(([k, form]) => { if (form) form.hidden = k !== mode; });
      document.querySelectorAll('[data-auth-mode]').forEach(btn => btn.classList.toggle('active', btn.dataset.authMode === mode));

      if (modeLabel) modeLabel.textContent = mode === 'register' ? 'CREATE ACCOUNT' : mode.toUpperCase();
      if (panelTitle) {
        panelTitle.innerHTML = mode === 'register' ? 'Make an <em>entrance.</em>'
          : mode === 'reset' ? 'A fresh <em>start.</em>' : 'Welcome <em>back.</em>';
      }
      displayStatus('', '');
    }

    function syncAccountState(session) {
      const signedIn = Boolean(session);
      if (accountPanel) accountPanel.hidden = !signedIn;
      if (authModes) authModes.hidden = signedIn;

      if (signedIn) {
        Object.values(forms).forEach(f => { if (f) f.hidden = true; });
        if (modeLabel) modeLabel.textContent = 'SIGNED IN';
        if (panelTitle) panelTitle.innerHTML = 'You are <em>inside.</em>';
      } else {
        switchMode(currentMode);
      }
    }

    // Form submit handlers
    forms.login?.addEventListener('submit', async e => {
      e.preventDefault();
      const email = val('#login-email'), password = val('#login-password');
      if (!isValidEmail(email)) return displayStatus('Enter a valid email address.', 'error');
      if (!password) return displayStatus('Enter your password.', 'error');
      if (!assertConfigured()) return;

      displayStatus('Entering the room…', 'loading');
      const res = await runAuth(() => auth.signIn(email.trim(), password));
      if (!res) return;
      if (res.error) return displayStatus('We could not sign you in with those details.', 'error');

      displayStatus('You are signed in.', 'success');
      if (params.get('next') === 'admin') window.location.href = 'admin.html';
    });

    forms.register?.addEventListener('submit', async e => {
      e.preventDefault();
      const email = val('#register-email'), pw = val('#register-password'), confirm = val('#register-confirm');
      if (!isValidEmail(email)) return displayStatus('Enter a valid email address.', 'error');
      if (!isValidPassword(pw)) return displayStatus('Use at least 8 characters, including one letter and one number.', 'error');
      if (pw !== confirm) return displayStatus('The passwords do not match.', 'error');
      if (!assertConfigured()) return;

      displayStatus('Preparing your account…', 'loading');
      const res = await runAuth(() => auth.signUp(email.trim(), pw));
      if (!res) return;
      if (res.error) return displayStatus('We could not create that account. The email may already be registered.', 'error');

      displayStatus(res.data?.session ? 'Your account is ready.' : 'Check your email to verify your account before signing in.', 'success');
    });

    forms.recovery?.addEventListener('submit', async e => {
      e.preventDefault();
      const email = val('#recovery-email');
      if (!isValidEmail(email)) return displayStatus('Enter a valid email address.', 'error');
      if (!assertConfigured()) return;

      displayStatus('Sending a recovery link…', 'loading');
      const res = await runAuth(() => auth.requestPasswordReset(email.trim()));
      if (!res) return;
      if (res.error) return displayStatus('We could not send a recovery link for that address.', 'error');
      displayStatus('If an account exists for that address, a recovery link has been sent.', 'success');
    });

    forms.reset?.addEventListener('submit', async e => {
      e.preventDefault();
      const pw = val('#reset-password'), confirm = val('#reset-confirm');
      if (!isValidPassword(pw)) return displayStatus('Use at least 8 characters, including one letter and one number.', 'error');
      if (pw !== confirm) return displayStatus('The passwords do not match.', 'error');
      if (!assertConfigured()) return;

      displayStatus('Updating your password…', 'loading');
      const res = await runAuth(() => auth.updatePassword(pw));
      if (!res) return;
      if (res.error) return displayStatus('The password could not be updated. Request a new recovery link and try again.', 'error');
      switchMode('login');
      displayStatus('Your password has been updated. You can now sign in.', 'success');
    });

    // Google OAuth & Logout
    async function onGoogleSignIn() {
      if (!assertConfigured()) return;
      displayStatus('Opening Google sign-in…', 'loading');
      const res = await runAuth(() => auth.signInWithGoogle());
      if (res?.error) displayStatus('Google sign-in is not available until its Supabase and Google Cloud settings are configured.', 'error');
    }

    document.querySelectorAll('[data-auth-mode]').forEach(btn => btn.addEventListener('click', () => switchMode(btn.dataset.authMode)));
    q('#google-login')?.addEventListener('click', onGoogleSignIn);
    q('#google-register')?.addEventListener('click', onGoogleSignIn);
    q('#auth-logout')?.addEventListener('click', async () => {
      const res = await runAuth(() => auth.signOut());
      if (res && !res.error) { displayStatus('You have been signed out.', 'success'); switchMode('login'); }
    });

    // Session synchronization
    auth.onAuthStateChange((event, session) => {
      syncAccountState(session);
      if (event === 'PASSWORD_RECOVERY') switchMode('reset');
    });

    auth.getSession()
      .then(res => {
        syncAccountState(res.session);
        if (res.error && auth.configured) displayStatus('Your session could not be restored. Please sign in again.', 'error');
      })
      .catch(() => displayStatus('Your session could not be restored. Please sign in again.', 'error'));

    switchMode(initialMode);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAuth);
  else initAuth();
})();
