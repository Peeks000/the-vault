-- THE VAULT — Grant Table Privileges & Ensure RLS Compatibility
-- Apply this migration in the Supabase SQL Editor if table queries return 42501 (permission denied).

-- 1. Ensure Schema Usage
grant usage on schema public to anon, authenticated, service_role;

-- 2. Public Read Access (Filtered by Row Level Security)
grant select on public.auction_lots to anon, authenticated;
grant select on public.lot_images to anon, authenticated;
grant select on public.journal_articles to anon, authenticated;
grant select on public.site_settings to anon, authenticated;

-- 3. Authenticated User Table Permissions (Governed by RLS policies)
grant all on public.auction_lots to authenticated;
grant all on public.lot_images to authenticated;
grant all on public.saved_lots to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.bids to authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant select on public.admin_audit_logs to authenticated;
grant select on public.user_roles to authenticated;

-- 4. Service Role Privileges for Backend Operations
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;
