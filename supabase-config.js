/**
 * =============================================================================
 * THE VAULT — Browser-Safe Supabase Configuration
 * =============================================================================
 * WHAT THIS FILE DOES:
 * Exposes the Supabase project URL and public API key to the browser window.
 *
 * VIVA EXPLANATION KEY POINTS:
 * 1. Why is this key safe to expose in client-side JavaScript?
 *    This is a "publishable" (anon) key. In Supabase, the public key does NOT grant
 *    unrestricted database access. Access is strictly controlled on the server
 *    by PostgreSQL Row Level Security (RLS) policies.
 * 2. What must NEVER be put in this file?
 *    The "service_role" secret key must NEVER be included in frontend code,
 *    because the service role bypasses all RLS policies.
 * 3. What is Object.freeze()?
 *    A standard JavaScript method that makes an object completely immutable.
 *    No script or external browser extension can add, delete, or modify its properties.
 * =============================================================================
 */

window.VAULT_SUPABASE_CONFIG = Object.freeze({
  // The unique REST API endpoint URL for THE VAULT's Supabase project.
  url: "https://mscwxwvpqlwffzlxmrxv.supabase.co",

  // The public client key used by the Supabase JavaScript library to authenticate API calls.
  publishableKey: "sb_publishable_4mlmczRNadcRnkcWsfooZQ_tFd85lsK"
});
