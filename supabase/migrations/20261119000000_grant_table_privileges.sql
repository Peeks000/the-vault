-- =============================================================================
-- THE VAULT — Grant Table Privileges & Ensure RLS Compatibility
-- =============================================================================
-- WHAT THIS MIGRATION DOES:
-- Grants appropriate SQL-level table privileges (SELECT, INSERT, UPDATE, DELETE)
-- to Supabase's built-in database roles:
-- 1. 'anon': Unauthenticated visitors (not signed in).
-- 2. 'authenticated': Users signed in via email/password or Google OAuth.
-- 3. 'service_role': Trusted administrative backend key with bypass permissions.
--
-- VIVA CONCEPT: Two-Tier Database Security
-- Tier 1: Table-Level Grants (GRANT SELECT, INSERT...) — determines if a role
--         can touch the table at all. If missing, PostgreSQL returns SQLSTATE 42501.
-- Tier 2: Row Level Security (RLS) Policies — determines WHICH individual rows
--         the user is allowed to read or modify within that table.
-- Both tiers must agree before data is returned!
-- =============================================================================

-- 1. Ensure Schema Usage:
-- Allows roles to look up tables and types defined within the 'public' schema.
grant usage on schema public to anon, authenticated, service_role;

-- 2. Public Read Access (Filtered by Row Level Security):
-- Allows anonymous and authenticated users to run SELECT queries.
-- Note: RLS policies ("Published lots are public", etc.) still filter out draft rows!
grant select on public.auction_lots to anon, authenticated;
grant select on public.lot_images to anon, authenticated;
grant select on public.journal_articles to anon, authenticated;
grant select on public.site_settings to anon, authenticated;

-- 3. Authenticated User Table Permissions:
-- Allows logged-in users to interact with features (saved lots, profile updates).
-- RLS policies ensure regular users only edit their own rows, while super_admins
-- can manage auction lots and review contact inquiries.
grant all on public.auction_lots to authenticated;
grant all on public.lot_images to authenticated;
grant all on public.saved_lots to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.bids to authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant select on public.admin_audit_logs to authenticated;
grant select on public.user_roles to authenticated;

-- 4. Service Role Privileges for Backend Automation:
-- Grants complete access to the internal service_role for migration runners,
-- serverless functions, and database seeding scripts.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;
