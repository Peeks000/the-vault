/**
 * =============================================================================
 * THE VAULT — Supabase Client Wrapper (Authentication & Security Bridge)
 * =============================================================================
 * WHAT THIS FILE DOES:
 * Acts as the centralized authentication adapter and backend communication layer.
 * It wraps the Supabase JavaScript SDK, manages session tokens, coordinates
 * user sign-in/sign-up/recovery, and performs server-side super-admin verification.
 *
 * VIVA ARCHITECTURE KEY CONCEPTS:
 * 1. IIFE Pattern (Immediately Invoked Function Expression):
 *    (function () { ... })();
 *    Wraps the code in a private scope so internal variables (like 'client' and 'config')
 *    cannot be tampered with from the browser's developer console.
 * 2. Asynchronous Programming (async/await & Promises):
 *    Network requests to Supabase take time. Instead of freezing the browser UI,
 *    JavaScript uses 'async' functions that return Promises. 'await' pauses execution
 *    inside the function until the backend responds, keeping the UI smooth.
 * 3. Security Principle — Never Trust the Client:
 *    The browser cannot simply declare "I am an admin". Instead, isSuperAdmin() calls
 *    a PostgreSQL Remote Procedure Call (RPC) on the server, which cryptographically
 *    validates the user's JWT token against the user_roles database table.
 * =============================================================================
 */

(function () {
  'use strict'; // Enforces strict JavaScript execution mode, preventing accidental global variables.

  // 1. Retrieve the configuration object exported by supabase-config.js.
  // The fallback '|| {}' prevents a TypeError if the config file failed to load.
  const config = window.VAULT_SUPABASE_CONFIG || {};

  /**
   * Validation check: Determines whether valid Supabase credentials have been supplied.
   * Checks:
   * - window.supabase: Confirms the official Supabase CDN script loaded.
   * - config.url & config.publishableKey: Confirms strings exist.
   * - !includes(...): Ensures dummy placeholder text was replaced with real project credentials.
   */
  const isConfigured = Boolean(
    window.supabase &&
    config.url &&
    config.publishableKey &&
    !config.url.includes('YOUR_PROJECT_REF') &&
    !config.publishableKey.includes('YOUR_SUPABASE_')
  );

  /**
   * Initialize the Supabase Client:
   * If credentials are valid, window.supabase.createClient creates a client instance
   * that manages automatic JWT token refresh, LocalStorage persistence, and HTTP headers.
   * Otherwise, null is stored to enable graceful offline fallback.
   */
  const client = isConfigured
    ? window.supabase.createClient(config.url, config.publishableKey)
    : null;

  /**
   * Helper: Standard error response object when backend credentials are missing.
   * Returns consistent { data, error } tuple shape matching standard Supabase responses.
   */
  function unconfiguredError() {
    return { data: null, error: new Error('Supabase authentication is not configured.') };
  }

  /**
   * Helper: Constructs the absolute redirect URL for OAuth and email verification links.
   * Uses the native browser URL API to resolve 'auth.html' relative to current location.
   */
  function getRedirectUrl() {
    return new URL('auth.html', window.location.href).href;
  }

  /**
   * Function: getSession()
   * Purpose: Retrieves the active user authentication session.
   * Returns: Promise<{ session: Object|null, error: Error|null }>
   *
   * How it works:
   * 1. Checks if the Supabase client is initialized.
   * 2. Calls client.auth.getSession(), which inspects browser LocalStorage for stored JWT tokens.
   * 3. If a token is found and still valid (or auto-refreshed), returns the active session.
   * 4. Wrapped in try/catch to gracefully handle network dropouts or parsing errors.
   */
  async function getSession() {
    if (!client) {
      return { session: null, error: new Error('Supabase authentication is not configured.') };
    }

    try {
      const { data, error } = await client.auth.getSession();
      return { session: data?.session || null, error };
    } catch (err) {
      return { session: null, error: err };
    }
  }

  /**
   * Function: isSuperAdmin()
   * Purpose: Cryptographically validates whether the active user is the super-admin.
   * Returns: Promise<{ authorized: boolean, error: Error|null }>
   *
   * Why this is a classic Viva question:
   * "How does your frontend know if a user is an admin without being hacked?"
   * Answer:
   * "We do not check admin status using a client-side boolean or localStorage variable.
   * Instead, this function executes a PostgreSQL Remote Procedure Call (RPC) named
   * 'is_super_admin' on Supabase. The database inspects the cryptographic JWT token,
   * extracts auth.uid(), checks the private user_roles table, and returns true or false.
   * The client only receives the database's verdict."
   */
  async function isSuperAdmin() {
    // Step 1: Confirm user is logged in before contacting the database.
    const sessionResult = await getSession();
    if (sessionResult.error || !sessionResult.session) {
      return { authorized: false, error: sessionResult.error };
    }

    // Step 2: Invoke the server-side PostgreSQL function via RPC.
    try {
      const { data, error } = await client.rpc('is_super_admin');
      return {
        authorized: error ? false : data === true,
        error
      };
    } catch (err) {
      return { authorized: false, error: err };
    }
  }

  /**
   * Function: signUp(email, password)
   * Purpose: Registers a new collector account with email and password.
   * Parameters:
   *  - email (string): User's email address.
   *  - password (string): Minimum 8 characters.
   * Returns: Supabase auth response object.
   */
  async function signUp(email, password) {
    if (!client) return unconfiguredError();

    return client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: getRedirectUrl() }
    });
  }

  /**
   * Function: signIn(email, password)
   * Purpose: Authenticates an existing user and stores their JWT token in LocalStorage.
   */
  async function signIn(email, password) {
    if (!client) return unconfiguredError();

    return client.auth.signInWithPassword({ email, password });
  }

  /**
   * Function: signInWithGoogle()
   * Purpose: Initiates the OAuth 2.0 single sign-on flow using Google.
   * How it works:
   * Redirects the browser to Google's authentication server. After user approval,
   * Google redirects back to Supabase, which verifies the handshake and sends the user
   * back to auth.html with an authenticated session hash.
   */
  async function signInWithGoogle() {
    if (!client) return unconfiguredError();

    return client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getRedirectUrl() }
    });
  }

  /**
   * Function: requestPasswordReset(email)
   * Purpose: Sends a secure password recovery magic link to the user's email address.
   */
  async function requestPasswordReset(email) {
    if (!client) return unconfiguredError();

    return client.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl()
    });
  }

  /**
   * Function: updatePassword(password)
   * Purpose: Sets a new password for the currently authenticated session
   * (used after clicking a password recovery email link).
   */
  async function updatePassword(password) {
    if (!client) return unconfiguredError();

    return client.auth.updateUser({ password });
  }

  /**
   * Function: signOut()
   * Purpose: Terminates the session, invalidates the refresh token on the server,
   * and clears stored credentials from browser LocalStorage.
   */
  async function signOut() {
    if (!client) return { error: null };
    return client.auth.signOut();
  }

  /**
   * Function: onAuthStateChange(callback)
   * Purpose: Subscribes to real-time authentication events across all open browser tabs.
   * Events include: 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'PASSWORD_RECOVERY'.
   * Returns an object with an unsubscribe() method for cleanup.
   */
  function onAuthStateChange(callback) {
    if (!client) {
      return { unsubscribe() {} };
    }

    const { data } = client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });

    return data.subscription;
  }

  /**
   * Function: updateNavigation(session)
   * Purpose: Dynamically updates the header navigation link based on login status.
   * - If logged in: Shows "Account ↗" leading to account overview / logout.
   * - If logged out: Shows "Enter ↗" leading to the sign-in screen.
   */
  function updateNavigation(session) {
    const accountLinks = document.querySelectorAll('.account-link');
    accountLinks.forEach(link => {
      link.innerHTML = session ? 'Account <span>↗</span>' : 'Enter <span>↗</span>';
      link.href = 'auth.html';
      link.setAttribute('aria-label', session ? 'Open account' : 'Sign in');
    });
  }

  /**
   * Function: setupNavigation()
   * Purpose: Initializes navigation links on page load and hooks into auth state events.
   */
  function setupNavigation() {
    const demoLinks = document.querySelectorAll('[data-demo-account]');
    if (!demoLinks.length) return;

    demoLinks.forEach(link => {
      link.href = 'auth.html';
      link.removeAttribute('data-demo-account');
    });

    // Check initial session state as soon as script runs
    getSession().then(result => {
      updateNavigation(result.session);
    });

    // Reactively update header links if the user signs in or out in any tab
    onAuthStateChange((event, session) => {
      updateNavigation(session);
    });
  }

  /**
   * Public API Export:
   * Freezes and attaches the public interface to window.vaultAuth.
   * Other scripts (app.js, auth.js, admin.js) access authentication through this object.
   */
  window.vaultAuth = Object.freeze({
    configured: isConfigured,
    client: client,
    getSession: getSession,
    isSuperAdmin: isSuperAdmin,
    signUp: signUp,
    signIn: signIn,
    signInWithGoogle: signInWithGoogle,
    requestPasswordReset: requestPasswordReset,
    updatePassword: updatePassword,
    signOut: signOut,
    onAuthStateChange: onAuthStateChange,
    redirectUrl: getRedirectUrl
  });

  // Ensure DOM is ready before manipulating navigation links
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNavigation);
  } else {
    setupNavigation();
  }
})();
