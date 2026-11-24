/**
 * =============================================================================
 * THE VAULT — Authentication Controller (auth.js)
 * =============================================================================
 * WHAT THIS FILE DOES:
 * Controls the complete user authentication interface on auth.html.
 * It manages:
 * 1. User Sign-In (email & password).
 * 2. User Registration (account creation with confirmation).
 * 3. Password Recovery (requesting a reset link via email).
 * 4. Password Reset (entering a new password after clicking a recovery link).
 * 5. Google OAuth 2.0 Single Sign-On.
 * 6. User Logout.
 * 7. Real-time form validation and error messaging.
 *
 * VIVA CONCEPTS TO EXPLAIN:
 * - Single Page Architecture for Auth: Instead of separate HTML pages for
 *   login, signup, and reset, a single page (auth.html) switches visibility of forms
 *   using JavaScript (DOM manipulation and hidden attributes).
 * - event.preventDefault(): Prevents the browser's default behavior of reloading
 *   the page upon form submission, enabling asynchronous API requests via fetch/Supabase.
 * - Regular Expressions (RegEx): Used for client-side pattern matching to validate
 *   email structure and enforce password complexity before contacting the server.
 * =============================================================================
 */

(function () {
  'use strict'; // Prevents unsafe actions like assigning values to undeclared variables.

  /**
   * Main initialization function for the Authentication controller.
   * Runs when the DOM content is fully loaded.
   */
  function initAuth() {
    // Access the public interface exposed by supabase-client.js.
    const auth = window.vaultAuth;
    if (!auth) {
      console.warn('VaultAuth client interface is not available.');
      return;
    }

    // -------------------------------------------------------------------------
    // DOM Element References
    // -------------------------------------------------------------------------
    // Cache references to the four form elements using querySelector.
    // Storing them in an object makes it easy to loop over them during mode switching.
    const forms = {
      login: document.querySelector('#auth-login-form'),
      register: document.querySelector('#auth-register-form'),
      recovery: document.querySelector('#auth-recovery-form'),
      reset: document.querySelector('#auth-reset-form')
    };

    // UI feedback and panel elements
    const accountPanel = document.querySelector('#auth-account');
    const statusBox = document.querySelector('#auth-status');
    const modeLabel = document.querySelector('#auth-mode-label');
    const panelTitle = document.querySelector('#auth-panel-title');
    const authModesContainer = document.querySelector('.auth-modes');

    // -------------------------------------------------------------------------
    // URL Parameter & Hash Inspection
    // -------------------------------------------------------------------------
    // Read URL query parameters (e.g. auth.html?mode=reset or ?next=admin).
    const searchParams = new URLSearchParams(window.location.search);
    // Read URL fragment hash (e.g. auth.html#type=recovery sent by Supabase email links).
    const hash = window.location.hash;

    // Determine initial view: If URL indicates password recovery, default to 'reset' mode;
    // otherwise default to standard 'login'.
    const initialMode = hash.includes('type=recovery') || searchParams.get('mode') === 'reset'
      ? 'reset'
      : 'login';

    // Tracks the currently active mode ('login', 'register', 'recovery', 'reset').
    let currentMode = initialMode;

    // -------------------------------------------------------------------------
    // Validation & Status Feedback Helpers
    // -------------------------------------------------------------------------

    /**
     * Function: displayStatus(message, statusType)
     * Purpose: Displays user feedback messages (loading, success, error) on the screen.
     * Parameters:
     *  - message (string): The text to display. If empty, the banner is hidden.
     *  - statusType (string): CSS modifier class ('error', 'success', 'loading').
     */
    function displayStatus(message, statusType = '') {
      if (!statusBox) return;
      statusBox.textContent = message;
      // Dynamically assign classes (e.g. "auth-status error") for styling.
      statusBox.className = `auth-status ${statusType}`.trim();
      // 'hidden' attribute controls visibility without needing manual CSS display toggles.
      statusBox.hidden = !message;
    }

    /**
     * Function: isValidEmail(value)
     * Purpose: Validates email format using a standard regular expression.
     * Checks: [characters] @ [characters] . [characters]
     */
    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    }

    /**
     * Function: isValidPassword(value)
     * Purpose: Enforces security requirements:
     * 1. Minimum 8 characters in length.
     * 2. Contains at least one letter (/[A-Za-z]/).
     * 3. Contains at least one numeric digit (/\d/).
     */
    function isValidPassword(value) {
      return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
    }

    /**
     * Function: assertConfigured()
     * Purpose: Verifies Supabase credentials before attempting network operations.
     * Displays a friendly message if the project is running in unconfigured demo mode.
     */
    function assertConfigured() {
      if (auth.configured) return true;
      displayStatus(
        'Authentication is not configured yet. Add the Supabase project URL and publishable key before using this form.',
        'error'
      );
      return false;
    }

    /**
     * Function: executeAuthAction(actionFn)
     * Purpose: Higher-Order Function that wraps asynchronous auth actions in try/catch.
     * Catches network exceptions (e.g. offline, DNS failure) and provides error feedback.
     */
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
    // Mode Switching Logic
    // -------------------------------------------------------------------------

    /**
     * Function: switchMode(newMode)
     * Purpose: Toggles between login, registration, recovery, and password reset views.
     * How it works:
     * 1. Updates currentMode.
     * 2. Loops over all form elements: sets hidden = false on target form, hidden = true on others.
     * 3. Updates active tab button highlight.
     * 4. Updates luxury editorial typography titles to match the active mode.
     */
    function switchMode(newMode) {
      currentMode = newMode;

      // Show the selected form, hide others
      Object.keys(forms).forEach(key => {
        if (forms[key]) forms[key].hidden = key !== newMode;
      });

      // Update mode switcher buttons active state
      document.querySelectorAll('[data-auth-mode]').forEach(button => {
        button.classList.toggle('active', button.dataset.authMode === newMode);
      });

      // Update header labels and editorial titles
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

      // Clear any leftover status messages when switching tabs
      displayStatus('', '');
    }

    /**
     * Function: redirectPostAuth()
     * Purpose: Handles smart redirection after successful login.
     * If the user was trying to access admin.html (?next=admin), sends them there immediately.
     */
    function redirectPostAuth() {
      const nextTarget = searchParams.get('next');
      if (nextTarget === 'admin') {
        window.location.href = 'admin.html';
      }
    }

    /**
     * Function: syncAccountState(session)
     * Purpose: Updates UI when a user is already signed in.
     * Hides the login/register forms and displays the authenticated account card
     * with email and sign-out button.
     */
    function syncAccountState(session) {
      const hasActiveSession = Boolean(session);

      if (accountPanel) accountPanel.hidden = !hasActiveSession;

      if (hasActiveSession) {
        // User is logged in: hide all authentication forms
        Object.keys(forms).forEach(key => {
          if (forms[key]) forms[key].hidden = true;
        });

        if (authModesContainer) authModesContainer.hidden = true;
        if (modeLabel) modeLabel.textContent = 'SIGNED IN';
        if (panelTitle) panelTitle.innerHTML = 'You are <em>inside.</em>';
      } else {
        // User is logged out: restore normal authentication mode
        if (authModesContainer) authModesContainer.hidden = false;
        switchMode(currentMode);
      }
    }

    // -------------------------------------------------------------------------
    // Form Submission Handlers
    // -------------------------------------------------------------------------

    /**
     * Handler: onLoginSubmit(event)
     * Purpose: Validates credentials and logs the user in.
     */
    async function onLoginSubmit(event) {
      event.preventDefault(); // Stop page reload

      const emailInput = document.querySelector('#login-email');
      const passwordInput = document.querySelector('#login-password');
      const email = emailInput ? emailInput.value : '';
      const password = passwordInput ? passwordInput.value : '';

      // Client-side preflight validation
      if (!isValidEmail(email)) {
        return displayStatus('Enter a valid email address.', 'error');
      }
      if (!password) {
        return displayStatus('Enter your password.', 'error');
      }
      if (!assertConfigured()) return;

      displayStatus('Entering the room…', 'loading');

      // Call Supabase signIn API
      const result = await executeAuthAction(() => auth.signIn(email.trim(), password));
      if (!result) return;

      if (result.error) {
        return displayStatus('We could not sign you in with those details.', 'error');
      }

      displayStatus('You are signed in.', 'success');
      redirectPostAuth();
    }

    /**
     * Handler: onRegisterSubmit(event)
     * Purpose: Registers a new collector account with password confirmation.
     */
    async function onRegisterSubmit(event) {
      event.preventDefault();

      const emailInput = document.querySelector('#register-email');
      const passwordInput = document.querySelector('#register-password');
      const confirmInput = document.querySelector('#register-confirm');

      const email = emailInput ? emailInput.value : '';
      const password = passwordInput ? passwordInput.value : '';
      const confirm = confirmInput ? confirmInput.value : '';

      // Strict validation checks
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

      // Call Supabase signUp API
      const result = await executeAuthAction(() => auth.signUp(email.trim(), password));
      if (!result) return;

      if (result.error) {
        return displayStatus('We could not create that account. The email may already be registered.', 'error');
      }

      // Check if email confirmation is required by Supabase project settings
      const successNotice = result.data?.session
        ? 'Your account is ready.'
        : 'Check your email to verify your account before signing in.';

      displayStatus(successNotice, 'success');
    }

    /**
     * Handler: onRecoverySubmit(event)
     * Purpose: Sends a password recovery email link.
     */
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

    /**
     * Handler: onResetSubmit(event)
     * Purpose: Sets the new password after arriving from an email reset link.
     */
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

    /**
     * Handler: onGoogleSignIn()
     * Purpose: Launches Google OAuth pop-up/redirect flow.
     */
    async function onGoogleSignIn() {
      if (!assertConfigured()) return;

      displayStatus('Opening Google sign-in…', 'loading');

      const result = await executeAuthAction(() => auth.signInWithGoogle());
      if (!result) return;

      if (result.error) {
        displayStatus('Google sign-in is not available until its Supabase and Google Cloud settings are configured.', 'error');
      }
    }

    /**
     * Handler: onLogout()
     * Purpose: Logs the user out, clears session, and switches back to the sign-in form.
     */
    async function onLogout() {
      const result = await executeAuthAction(() => auth.signOut());
      if (!result || result.error) return;

      displayStatus('You have been signed out.', 'success');
      switchMode('login');
    }

    // -------------------------------------------------------------------------
    // Event Wiring (Connecting HTML to JavaScript)
    // -------------------------------------------------------------------------

    // Attach click listeners to mode switcher buttons (Login / Register / Recovery)
    document.querySelectorAll('[data-auth-mode]').forEach(button => {
      button.addEventListener('click', () => {
        switchMode(button.dataset.authMode);
      });
    });

    // Form submit listeners
    forms.login?.addEventListener('submit', onLoginSubmit);
    forms.register?.addEventListener('submit', onRegisterSubmit);
    forms.recovery?.addEventListener('submit', onRecoverySubmit);
    forms.reset?.addEventListener('submit', onResetSubmit);

    // OAuth and logout button listeners
    document.querySelector('#google-login')?.addEventListener('click', onGoogleSignIn);
    document.querySelector('#google-register')?.addEventListener('click', onGoogleSignIn);
    document.querySelector('#auth-logout')?.addEventListener('click', onLogout);

    // Subscribe to reactive auth state events
    auth.onAuthStateChange((event, session) => {
      syncAccountState(session);
      if (event === 'PASSWORD_RECOVERY') {
        switchMode('reset');
      }
    });

    // Check existing session on page load
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

    // Apply the initial mode on boot
    switchMode(initialMode);
  }

  // Ensure DOM is ready before executing initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})();
