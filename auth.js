(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const auth = window.vaultAuth;
    const forms = {
      login: document.querySelector('#auth-login-form'),
      register: document.querySelector('#auth-register-form'),
      recovery: document.querySelector('#auth-recovery-form'),
      reset: document.querySelector('#auth-reset-form')
    };
    const account = document.querySelector('#auth-account');
    const status = document.querySelector('#auth-status');
    const modeLabel = document.querySelector('#auth-mode-label');
    const panelTitle = document.querySelector('#auth-panel-title');
    const params = new URLSearchParams(window.location.search);
    let activeMode = window.location.hash.includes('type=recovery') || params.get('mode') === 'reset' ? 'reset' : 'login';

    function showStatus(message, type) {
      status.textContent = message;
      status.className = `auth-status ${type || ''}`;
      status.hidden = !message;
    }

    function validEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    function validPassword(value) {
      return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
    }

    function setMode(mode) {
      activeMode = mode;
      Object.keys(forms).forEach(function (key) {
        forms[key].hidden = key !== mode;
      });
      document.querySelectorAll('[data-auth-mode]').forEach(function (button) {
        button.classList.toggle('active', button.dataset.authMode === mode);
      });
      modeLabel.textContent = mode === 'register' ? 'CREATE ACCOUNT' : mode.toUpperCase();
      panelTitle.innerHTML = mode === 'register' ? 'Make an <em>entrance.</em>' : mode === 'reset' ? 'A fresh <em>start.</em>' : 'Welcome <em>back.</em>';
      showStatus('', '');
    }

    function requireConfigured() {
      if (auth.configured) return true;
      showStatus('Authentication is not configured yet. Add the Supabase project URL and publishable key before using this form.', 'error');
      return false;
    }

    async function runAuthOperation(operation) {
      try {
        return await operation();
      } catch (error) {
        showStatus('The authentication service could not be reached. Please try again.', 'error');
        return null;
      }
    }

    async function handleLogin(event) {
      event.preventDefault();
      const email = document.querySelector('#login-email').value;
      const password = document.querySelector('#login-password').value;
      if (!validEmail(email)) return showStatus('Enter a valid email address.', 'error');
      if (!password) return showStatus('Enter your password.', 'error');
      if (!requireConfigured()) return;
      showStatus('Entering the room…', 'loading');
      const result = await runAuthOperation(function () { return auth.signIn(email.trim(), password); });
      if (!result) return;
      if (result.error) return showStatus('We could not sign you in with those details.', 'error');
      showStatus('You are signed in.', 'success');
      redirectAfterAuth();
    }

    async function handleRegister(event) {
      event.preventDefault();
      const email = document.querySelector('#register-email').value;
      const password = document.querySelector('#register-password').value;
      const confirm = document.querySelector('#register-confirm').value;
      if (!validEmail(email)) return showStatus('Enter a valid email address.', 'error');
      if (!validPassword(password)) return showStatus('Use at least 8 characters, including one letter and one number.', 'error');
      if (password !== confirm) return showStatus('The passwords do not match.', 'error');
      if (!requireConfigured()) return;
      showStatus('Preparing your account…', 'loading');
      const result = await runAuthOperation(function () { return auth.signUp(email.trim(), password); });
      if (!result) return;
      if (result.error) return showStatus('We could not create that account. The email may already be registered.', 'error');
      showStatus(result.data.session ? 'Your account is ready.' : 'Check your email to verify your account before signing in.', 'success');
    }

    async function handleRecovery(event) {
      event.preventDefault();
      const email = document.querySelector('#recovery-email').value;
      if (!validEmail(email)) return showStatus('Enter a valid email address.', 'error');
      if (!requireConfigured()) return;
      showStatus('Sending a recovery link…', 'loading');
      const result = await runAuthOperation(function () { return auth.requestPasswordReset(email.trim()); });
      if (!result) return;
      if (result.error) return showStatus('We could not send a recovery link for that address.', 'error');
      showStatus('If an account exists for that address, a recovery link has been sent.', 'success');
    }

    async function handleReset(event) {
      event.preventDefault();
      const password = document.querySelector('#reset-password').value;
      const confirm = document.querySelector('#reset-confirm').value;
      if (!validPassword(password)) return showStatus('Use at least 8 characters, including one letter and one number.', 'error');
      if (password !== confirm) return showStatus('The passwords do not match.', 'error');
      if (!requireConfigured()) return;
      showStatus('Updating your password…', 'loading');
      const result = await runAuthOperation(function () { return auth.updatePassword(password); });
      if (!result) return;
      if (result.error) return showStatus('The password could not be updated. Request a new recovery link and try again.', 'error');
      setMode('login');
      showStatus('Your password has been updated. You can now sign in.', 'success');
    }

    async function handleGoogle() {
      if (!requireConfigured()) return;
      showStatus('Opening Google sign-in…', 'loading');
      const result = await runAuthOperation(function () { return auth.signInWithGoogle(); });
      if (!result) return;
      if (result.error) showStatus('Google sign-in is not available until its Supabase and Google Cloud settings are configured.', 'error');
    }

    async function updateAccountState(session) {
      const hasSession = Boolean(session);
      account.hidden = !hasSession;
      if (hasSession) {
        Object.keys(forms).forEach(function (key) { forms[key].hidden = true; });
        document.querySelector('.auth-modes').hidden = true;
        modeLabel.textContent = 'SIGNED IN';
        panelTitle.innerHTML = 'You are <em>inside.</em>';
      } else {
        document.querySelector('.auth-modes').hidden = false;
        setMode(activeMode);
      }
    }

    function redirectAfterAuth() {
      const next = params.get('next');
      if (next === 'admin') window.location.href = 'admin.html';
    }

    document.querySelectorAll('[data-auth-mode]').forEach(function (button) {
      button.addEventListener('click', function () { setMode(button.dataset.authMode); });
    });
    forms.login.addEventListener('submit', handleLogin);
    forms.register.addEventListener('submit', handleRegister);
    forms.recovery.addEventListener('submit', handleRecovery);
    forms.reset.addEventListener('submit', handleReset);
    document.querySelector('#google-login').addEventListener('click', handleGoogle);
    document.querySelector('#google-register').addEventListener('click', handleGoogle);
    document.querySelector('#auth-logout').addEventListener('click', async function () {
      const result = await runAuthOperation(function () { return auth.signOut(); });
      if (!result || result.error) return;
      showStatus('You have been signed out.', 'success');
      setMode('login');
    });

    auth.onAuthStateChange(function (event, session) {
      updateAccountState(session);
      if (event === 'PASSWORD_RECOVERY') setMode('reset');
    });
    auth.getSession().then(function (result) {
      updateAccountState(result.session);
      if (result.error && auth.configured) showStatus('Your session could not be restored. Please sign in again.', 'error');
    }).catch(function () {
      showStatus('Your session could not be restored. Please sign in again.', 'error');
    });
    setMode(activeMode);
  });
})();
