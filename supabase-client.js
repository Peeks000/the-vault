/**
 * THE VAULT — Supabase Client Wrapper
 *
 * Provides a secure, browser-safe authentication and client interface.
 * All administrative checks are validated via database RPCs on the backend;
 * no elevated roles or credentials are ever handled on the client.
 */

(function () {
  'use strict';

  const config = window.VAULT_SUPABASE_CONFIG || {};

  const isConfigured = Boolean(
    window.supabase &&
    config.url &&
    config.publishableKey &&
    !config.url.includes('YOUR_PROJECT_REF') &&
    !config.publishableKey.includes('YOUR_SUPABASE_')
  );

  const client = isConfigured
    ? window.supabase.createClient(config.url, config.publishableKey)
    : null;

  function unconfiguredError() {
    return { data: null, error: new Error('Supabase authentication is not configured.') };
  }

  function getRedirectUrl() {
    return new URL('auth.html', window.location.href).href;
  }

  /**
   * Retrieves the current Supabase session.
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
   * Validates whether the active session belongs to the designated super-admin.
   * Authority is verified strictly by the database RPC; client assertions are never trusted.
   */
  async function isSuperAdmin() {
    const sessionResult = await getSession();
    if (sessionResult.error || !sessionResult.session) {
      return { authorized: false, error: sessionResult.error };
    }

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
   * Registers a new user via email and password.
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
   * Signs in an existing user with email and password.
   */
  async function signIn(email, password) {
    if (!client) return unconfiguredError();

    return client.auth.signInWithPassword({ email, password });
  }

  /**
   * Initiates Google OAuth authentication flow.
   */
  async function signInWithGoogle() {
    if (!client) return unconfiguredError();

    return client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getRedirectUrl() }
    });
  }

  /**
   * Requests a password recovery email.
   */
  async function requestPasswordReset(email) {
    if (!client) return unconfiguredError();

    return client.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl()
    });
  }

  /**
   * Updates the password for the active authenticated session.
   */
  async function updatePassword(password) {
    if (!client) return unconfiguredError();

    return client.auth.updateUser({ password });
  }

  /**
   * Terminates the current authenticated session.
   */
  async function signOut() {
    if (!client) return { error: null };
    return client.auth.signOut();
  }

  /**
   * Subscribes to Supabase authentication state transitions.
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
   * Synchronizes navigation account links with the active authentication state.
   */
  function updateNavigation(session) {
    const accountLinks = document.querySelectorAll('.account-link');
    accountLinks.forEach(link => {
      link.innerHTML = session ? 'Account <span>↗</span>' : 'Enter <span>↗</span>';
      link.href = 'auth.html';
      link.setAttribute('aria-label', session ? 'Open account' : 'Sign in');
    });
  }

  function setupNavigation() {
    const demoLinks = document.querySelectorAll('[data-demo-account]');
    if (!demoLinks.length) return;

    demoLinks.forEach(link => {
      link.href = 'auth.html';
      link.removeAttribute('data-demo-account');
    });

    getSession().then(result => {
      updateNavigation(result.session);
    });

    onAuthStateChange((event, session) => {
      updateNavigation(session);
    });
  }

  // Export public interface on window.vaultAuth
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNavigation);
  } else {
    setupNavigation();
  }
})();
