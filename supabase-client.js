(function () {
  'use strict';

  const config = window.VAULT_SUPABASE_CONFIG || {};
  const hasConfig = Boolean(
    window.supabase &&
    config.url &&
    config.publishableKey &&
    !config.url.includes('YOUR_PROJECT_REF') &&
    !config.publishableKey.includes('YOUR_SUPABASE_')
  );
  const client = hasConfig ? window.supabase.createClient(config.url, config.publishableKey) : null;
  const authListeners = new Set();

  async function getSession() {
    if (!client) return { session: null, error: new Error('Supabase authentication is not configured.') };
    const result = await client.auth.getSession();
    return { session: result.data.session, error: result.error };
  }

  async function isSuperAdmin() {
    const sessionResult = await getSession();
    if (sessionResult.error || !sessionResult.session) {
      return { authorized: false, error: sessionResult.error };
    }

    const result = await client.rpc('is_super_admin');
    return { authorized: result.error ? false : result.data === true, error: result.error };
  }

  function redirectUrl() {
    return new URL('auth.html', window.location.href).href;
  }

  async function signUp(email, password) {
    if (!client) return { data: null, error: new Error('Supabase authentication is not configured.') };
    return client.auth.signUp({email, password, options: {emailRedirectTo: redirectUrl()}});
  }

  async function signIn(email, password) {
    if (!client) return { data: null, error: new Error('Supabase authentication is not configured.') };
    return client.auth.signInWithPassword({email, password});
  }

  async function signInWithGoogle() {
    if (!client) return { data: null, error: new Error('Supabase authentication is not configured.') };
    return client.auth.signInWithOAuth({provider: 'google', options: {redirectTo: redirectUrl()}});
  }

  async function requestPasswordReset(email) {
    if (!client) return { data: null, error: new Error('Supabase authentication is not configured.') };
    return client.auth.resetPasswordForEmail(email, {redirectTo: redirectUrl()});
  }

  async function updatePassword(password) {
    if (!client) return { data: null, error: new Error('Supabase authentication is not configured.') };
    return client.auth.updateUser({password});
  }

  async function signOut() {
    if (!client) return { error: null };
    return client.auth.signOut();
  }

  function onAuthStateChange(callback) {
    if (!client) return {unsubscribe: function () {}};
    const subscription = client.auth.onAuthStateChange(function (event, session) {
      authListeners.forEach(function (listener) { listener(event, session); });
      callback(event, session);
    });
    return subscription.data.subscription;
  }

  function setupNavigation() {
    const links = document.querySelectorAll('[data-demo-account]');
    if (!links.length) return;

    links.forEach(function (link) {
      link.href = 'auth.html';
      link.removeAttribute('data-demo-account');
    });

    getSession().then(function (result) {
      updateNavigation(result.session);
    });

    onAuthStateChange(function (event, session) {
      updateNavigation(session);
    });
  }

  function updateNavigation(session) {
    document.querySelectorAll('.account-link').forEach(function (link) {
      link.innerHTML = session ? 'Account <span>↗</span>' : 'Enter <span>↗</span>';
      link.href = 'auth.html';
      link.setAttribute('aria-label', session ? 'Open account' : 'Sign in');
    });
  }

  window.vaultAuth = Object.freeze({
    configured: hasConfig,
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
    redirectUrl: redirectUrl
  });

  document.addEventListener('DOMContentLoaded', setupNavigation);
})();
