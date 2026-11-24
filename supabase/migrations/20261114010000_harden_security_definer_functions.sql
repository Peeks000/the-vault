-- =============================================================================
-- THE VAULT — Security Hardening: Search Path Lockdown
-- =============================================================================
-- WHAT THIS MIGRATION DOES:
-- Sets search_path = '' (empty) on all SECURITY DEFINER functions.
--
-- WHY THIS IS CRUCIAL FOR VIVA EXAMINATIONS:
-- In PostgreSQL, when a function is marked 'SECURITY DEFINER', it executes with
-- the permissions of the database owner (superuser/admin), rather than the caller.
--
-- THE SECURITY RISK (Search Path Hijacking):
-- If search_path is left default, PostgreSQL searches schemas in order. An attacker
-- could create a malicious table or function named 'profiles' in a temporary or
-- user-controlled schema. If the admin function calls 'insert into profiles',
-- it might execute against the attacker's fake table, leading to privilege escalation!
--
-- THE FIX:
-- By explicitly setting search_path = '', PostgreSQL refuses to resolve any
-- unqualified object names. The function must explicitly write 'public.profiles',
-- completely eliminating search-path injection vulnerabilities.
-- =============================================================================

-- 1. Harden handle_new_user() trigger function
alter function public.handle_new_user()
  set search_path = '';

-- 2. Harden is_super_admin() security check function
alter function public.is_super_admin()
  set search_path = '';

-- 3. Harden update_bid_summary() atomic trigger function
alter function public.update_bid_summary()
  set search_path = '';
