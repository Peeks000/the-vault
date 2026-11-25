// THE VAULT — Supabase Client Wrapper (Auth & RPC Bridge)
(function () {
  'use strict';

  const config = window.VAULT_SUPABASE_CONFIG || {};
  const isConfigured = Boolean(
    window.supabase && config.url && config.publishableKey &&
    !config.url.includes('YOUR_PROJECT_REF') && !config.publishableKey.includes('YOUR_SUPABASE_')
  );

  const client = isConfigured ? window.supabase.createClient(config.url, config.publishableKey) : null;
  const unconfiguredError = () => ({ data: null, error: new Error('Supabase authentication is not configured.') });
  const getRedirectUrl = () => new URL('auth.html', window.location.href).href;

  // Retrieve current authenticated JWT session from browser storage
  async function getSession() {
    if (!client) return { session: null, error: unconfiguredError().error };
    try {
      const { data, error } = await client.auth.getSession();
      return { session: data?.session || null, error };
    } catch (err) {
      return { session: null, error: err };
    }
  }

  // Cryptographic server-side check via PostgreSQL RPC function `is_super_admin`
  async function isSuperAdmin() {
    const { session, error } = await getSession();
    if (error || !session) return { authorized: false, error };
    try {
      const res = await client.rpc('is_super_admin');
      return { authorized: !res.error && res.data === true, error: res.error };
    } catch (err) {
      return { authorized: false, error: err };
    }
  }

  const signUp = (email, password) => !client ? unconfiguredError() :
    client.auth.signUp({ email, password, options: { emailRedirectTo: getRedirectUrl() } });

  const signIn = (email, password) => !client ? unconfiguredError() :
    client.auth.signInWithPassword({ email, password });

  const signInWithGoogle = () => !client ? unconfiguredError() :
    client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: getRedirectUrl() } });

  const requestPasswordReset = (email) => !client ? unconfiguredError() :
    client.auth.resetPasswordForEmail(email, { redirectTo: getRedirectUrl() });

  const updatePassword = (password) => !client ? unconfiguredError() :
    client.auth.updateUser({ password });

  const signOut = () => !client ? { error: null } : client.auth.signOut();

  function onAuthStateChange(callback) {
    if (!client) return { unsubscribe() {} };
    return client.auth.onAuthStateChange((event, session) => callback(event, session)).data.subscription;
  }

  // Sync header account links across pages
  function updateNavigation(session) {
    document.querySelectorAll('.account-link').forEach(link => {
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
    getSession().then(res => updateNavigation(res.session));
    onAuthStateChange((_event, session) => updateNavigation(session));
  }

  window.vaultAuth = Object.freeze({
    configured: isConfigured,
    client,
    getSession,
    isSuperAdmin,
    signUp,
    signIn,
    signInWithGoogle,
    requestPasswordReset,
    updatePassword,
    signOut,
    onAuthStateChange,
    redirectUrl: getRedirectUrl
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupNavigation);
  else setupNavigation();
})();
