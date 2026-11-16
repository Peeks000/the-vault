/**
 * THE VAULT — Authentication Controller
 *
 * Manages client sign-in, account creation, password recovery,
 * password reset, and OAuth redirection state.
 */

(function () {
  'use strict';

  function initAuth() {
    const auth = window.vaultAuth;
    if (!auth) {
      console.warn('VaultAuth client interface is not available.');
      return;
    }

    const forms = {
      login: document.querySelector('#auth-login-form'),
      register: document.querySelector('#auth-register-form'),
      recovery: document.querySelector('#auth-recovery-form'),
      reset: document.querySelector('#auth-reset-form')
    };

    const accountPanel = document.querySelector('#auth-account');
    const statusBox = document.querySelector('#auth-status');
    const modeLabel = document.querySelector('#auth-mode-label');
    const panelTitle = document.querySelector('#auth-panel-title');
    const authModesContainer = document.querySelector('.auth-modes');

    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    const initialMode = hash.includes('type=recovery') || searchParams.get('mode') === 'reset'
      ? 'reset'
      : 'login';

    let currentMode = initialMode;

    // -------------------------------------------------------------------------
    // Validation & Status Feedback
    // -------------------------------------------------------------------------

    function displayStatus(message, statusType = '') {
      if (!statusBox) return;
      statusBox.textContent = message;
      statusBox.className = `auth-status ${statusType}`.trim();
      statusBox.hidden = !message;
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    function isValidPassword(value) {
      return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
    }

    function assertConfigured() {
      if (auth.configured) return true;
      displayStatus(
        'Authentication is not configured yet. Add the Supabase project URL and publishable key before using this form.',
        'error'
      );
      return false;
    }

    async function executeAuthAction(actionFn) {
      try {
        return await actionFn();
      } catch (err) {
        console.error('Authentication service failure:', err);
        displayStatus('The authentication service could not be reached. Please try again.', 'error');
        return null;
      }
    }

    // -------------------------------------------------------------------------
    // Mode Switching
    // -------------------------------------------------------------------------

    function switchMode(newMode) {
      currentMode = newMode;

      // Show the selected form, hide others
      Object.keys(forms).forEach(key => {
        if (forms[key]) forms[key].hidden = key !== newMode;
      });

      // Update mode switcher buttons
      document.querySelectorAll('[data-auth-mode]').forEach(button => {
        button.classList.toggle('active', button.dataset.authMode === newMode);
      });

      // Update header labels and titles
      if (modeLabel) {
        modeLabel.textContent = newMode === 'register' ? 'CREATE ACCOUNT' : newMode.toUpperCase();
      }

      if (panelTitle) {
        if (newMode === 'register') {
          panelTitle.innerHTML = 'Make an <em>entrance.</em>';
        } else if (newMode === 'reset') {
          panelTitle.innerHTML = 'A fresh <em>start.</em>';
        } else {
          panelTitle.innerHTML = 'Welcome <em>back.</em>';
        }
      }

      displayStatus('', '');
    }

    function redirectPostAuth() {
      const nextTarget = searchParams.get('next');
      if (nextTarget === 'admin') {
        window.location.href = 'admin.html';
      }
    }

    function syncAccountState(session) {
      const hasActiveSession = Boolean(session);

      if (accountPanel) accountPanel.hidden = !hasActiveSession;

      if (hasActiveSession) {
        Object.keys(forms).forEach(key => {
          if (forms[key]) forms[key].hidden = true;
        });

        if (authModesContainer) authModesContainer.hidden = true;
        if (modeLabel) modeLabel.textContent = 'SIGNED IN';
        if (panelTitle) panelTitle.innerHTML = 'You are <em>inside.</em>';
      } else {
        if (authModesContainer) authModesContainer.hidden = false;
        switchMode(currentMode);
      }
    }

    // -------------------------------------------------------------------------
    // Form Submission Handlers
    // -------------------------------------------------------------------------

    async function onLoginSubmit(event) {
      event.preventDefault();

      const emailInput = document.querySelector('#login-email');
      const passwordInput = document.querySelector('#login-password');
      const email = emailInput ? emailInput.value : '';
      const password = passwordInput ? passwordInput.value : '';

      if (!isValidEmail(email)) {
        return displayStatus('Enter a valid email address.', 'error');
      }
      if (!password) {
        return displayStatus('Enter your password.', 'error');
      }
      if (!assertConfigured()) return;

      displayStatus('Entering the room…', 'loading');

      const result = await executeAuthAction(() => auth.signIn(email.trim(), password));
      if (!result) return;

      if (result.error) {
        return displayStatus('We could not sign you in with those details.', 'error');
      }

      displayStatus('You are signed in.', 'success');
      redirectPostAuth();
    }

    async function onRegisterSubmit(event) {
      event.preventDefault();

      const emailInput = document.querySelector('#register-email');
      const passwordInput = document.querySelector('#register-password');
      const confirmInput = document.querySelector('#register-confirm');

      const email = emailInput ? emailInput.value : '';
      const password = passwordInput ? passwordInput.value : '';
      const confirm = confirmInput ? confirmInput.value : '';

      if (!isValidEmail(email)) {
        return displayStatus('Enter a valid email address.', 'error');
      }
      if (!isValidPassword(password)) {
        return displayStatus('Use at least 8 characters, including one letter and one number.', 'error');
      }
      if (password !== confirm) {
        return displayStatus('The passwords do not match.', 'error');
      }
      if (!assertConfigured()) return;

      displayStatus('Preparing your account…', 'loading');

      const result = await executeAuthAction(() => auth.signUp(email.trim(), password));
      if (!result) return;

      if (result.error) {
        return displayStatus('We could not create that account. The email may already be registered.', 'error');
      }

      const successNotice = result.data?.session
        ? 'Your account is ready.'
        : 'Check your email to verify your account before signing in.';

      displayStatus(successNotice, 'success');
    }

    async function onRecoverySubmit(event) {
      event.preventDefault();

      const emailInput = document.querySelector('#recovery-email');
      const email = emailInput ? emailInput.value : '';

      if (!isValidEmail(email)) {
        return displayStatus('Enter a valid email address.', 'error');
      }
      if (!assertConfigured()) return;

      displayStatus('Sending a recovery link…', 'loading');

      const result = await executeAuthAction(() => auth.requestPasswordReset(email.trim()));
      if (!result) return;

      if (result.error) {
        return displayStatus('We could not send a recovery link for that address.', 'error');
      }

      displayStatus('If an account exists for that address, a recovery link has been sent.', 'success');
    }

    async function onResetSubmit(event) {
      event.preventDefault();

      const passwordInput = document.querySelector('#reset-password');
      const confirmInput = document.querySelector('#reset-confirm');

      const password = passwordInput ? passwordInput.value : '';
      const confirm = confirmInput ? confirmInput.value : '';

      if (!isValidPassword(password)) {
        return displayStatus('Use at least 8 characters, including one letter and one number.', 'error');
      }
      if (password !== confirm) {
        return displayStatus('The passwords do not match.', 'error');
      }
      if (!assertConfigured()) return;

      displayStatus('Updating your password…', 'loading');

      const result = await executeAuthAction(() => auth.updatePassword(password));
      if (!result) return;

      if (result.error) {
        return displayStatus('The password could not be updated. Request a new recovery link and try again.', 'error');
      }

      switchMode('login');
      displayStatus('Your password has been updated. You can now sign in.', 'success');
    }

    async function onGoogleSignIn() {
      if (!assertConfigured()) return;

      displayStatus('Opening Google sign-in…', 'loading');

      const result = await executeAuthAction(() => auth.signInWithGoogle());
      if (!result) return;

      if (result.error) {
        displayStatus('Google sign-in is not available until its Supabase and Google Cloud settings are configured.', 'error');
      }
    }

    async function onLogout() {
      const result = await executeAuthAction(() => auth.signOut());
      if (!result || result.error) return;

      displayStatus('You have been signed out.', 'success');
      switchMode('login');
    }

    // -------------------------------------------------------------------------
    // Event Wiring
    // -------------------------------------------------------------------------

    document.querySelectorAll('[data-auth-mode]').forEach(button => {
      button.addEventListener('click', () => {
        switchMode(button.dataset.authMode);
      });
    });

    forms.login?.addEventListener('submit', onLoginSubmit);
    forms.register?.addEventListener('submit', onRegisterSubmit);
    forms.recovery?.addEventListener('submit', onRecoverySubmit);
    forms.reset?.addEventListener('submit', onResetSubmit);

    document.querySelector('#google-login')?.addEventListener('click', onGoogleSignIn);
    document.querySelector('#google-register')?.addEventListener('click', onGoogleSignIn);
    document.querySelector('#auth-logout')?.addEventListener('click', onLogout);

    // Subscribe to auth state transitions
    auth.onAuthStateChange((event, session) => {
      syncAccountState(session);
      if (event === 'PASSWORD_RECOVERY') {
        switchMode('reset');
      }
    });

    // Check initial session
    auth.getSession()
      .then(result => {
        syncAccountState(result.session);
        if (result.error && auth.configured) {
          displayStatus('Your session could not be restored. Please sign in again.', 'error');
        }
      })
      .catch(() => {
        displayStatus('Your session could not be restored. Please sign in again.', 'error');
      });

    switchMode(initialMode);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
