-- THE VAULT backend foundation
-- Apply this migration in a Supabase project before adding client or server integrations.

create extension if not exists pgcrypto;

create type public.auction_lot_status as enum (
  'draft',
  'scheduled',
  'live',
  'closed',
  'withdrawn'
);

create type public.user_role as enum ('super_admin');

create type public.contact_message_status as enum (
  'new',
  'in_progress',
  'resolved',
  'spam'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now()
);

create unique index user_roles_one_super_admin_idx
  on public.user_roles (role);

create table public.auction_lots (
  id uuid primary key default gen_random_uuid(),
  legacy_id text not null unique,
  lot_number text not null unique,
  category text not null,
  period text,
  title text not null,
  subtitle text,
  description text,
  estimate_low numeric(14, 2),
  estimate_high numeric(14, 2),
  current_bid numeric(14, 2) not null default 0,
  bid_count integer not null default 0 check (bid_count >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  status public.auction_lot_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint auction_lots_estimate_range_check
    check (
      estimate_low is null
      or estimate_high is null
      or estimate_high >= estimate_low
    ),
  constraint auction_lots_current_bid_check check (current_bid >= 0),
  constraint auction_lots_schedule_check
    check (starts_at is null or ends_at is null or ends_at > starts_at)
);

create table public.lot_images (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.auction_lots(id) on delete cascade,
  image_url text not null,
  alt_text text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index lot_images_one_primary_idx
  on public.lot_images (lot_id)
  where is_primary;

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.auction_lots(id) on delete restrict,
  bidder_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(14, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table public.saved_lots (
  user_id uuid not null references auth.users(id) on delete cascade,
  lot_id uuid not null references public.auction_lots(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, lot_id)
);

create table public.journal_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  title text not null,
  subtitle text not null,
  image_url text,
  caption text,
  reading_minutes smallint not null check (reading_minutes > 0),
  body jsonb not null default '[]'::jsonb,
  related_slugs text[] not null default '{}',
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_articles_body_array_check
    check (jsonb_typeof(body) = 'array')
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  enquiry_type text not null,
  subject text not null,
  message text not null,
  status public.contact_message_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  setting_key text primary key,
  setting_value jsonb not null,
  is_public boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index auction_lots_public_listing_idx
  on public.auction_lots (status, published_at, ends_at);

create index lot_images_lot_order_idx
  on public.lot_images (lot_id, sort_order);

create index bids_lot_created_idx
  on public.bids (lot_id, created_at desc);

create index bids_bidder_created_idx
  on public.bids (bidder_id, created_at desc);

create index saved_lots_lot_idx
  on public.saved_lots (lot_id);

create index journal_articles_public_category_idx
  on public.journal_articles (is_published, category, published_at desc);

create index contact_messages_status_created_idx
  on public.contact_messages (status, created_at desc);

create index admin_audit_logs_actor_created_idx
  on public.admin_audit_logs (actor_user_id, created_at desc);

create index admin_audit_logs_entity_idx
  on public.admin_audit_logs (entity_type, entity_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger auction_lots_set_updated_at
before update on public.auction_lots
for each row execute function public.set_updated_at();

create trigger journal_articles_set_updated_at
before update on public.journal_articles
for each row execute function public.set_updated_at();

create trigger contact_messages_set_updated_at
before update on public.contact_messages
for each row execute function public.set_updated_at();

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'super_admin'
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to anon, authenticated;

create or replace function public.update_bid_summary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.auction_lots
  set current_bid = greatest(current_bid, new.amount),
      bid_count = bid_count + 1,
      updated_at = now()
  where id = new.lot_id;
  return new;
end;
$$;

revoke all on function public.update_bid_summary() from public;

create trigger bids_update_lot_summary
after insert on public.bids
for each row execute function public.update_bid_summary();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.auction_lots enable row level security;
alter table public.lot_images enable row level security;
alter table public.bids enable row level security;
alter table public.saved_lots enable row level security;
alter table public.journal_articles enable row level security;
alter table public.contact_messages enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.site_settings enable row level security;

create policy "Profiles are visible to their owner or super admin"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id or public.is_super_admin());

create policy "Users may update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Super admin can view roles"
on public.user_roles for select
to authenticated
using (public.is_super_admin());

create policy "Published lots are public"
on public.auction_lots for select
to anon, authenticated
using (
  (
    published_at is not null
    and status in ('scheduled', 'live', 'closed')
  )
  or public.is_super_admin()
);

create policy "Images belong to public lots"
on public.lot_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.auction_lots
    where auction_lots.id = lot_images.lot_id
      and (
        (
          auction_lots.published_at is not null
          and auction_lots.status in ('scheduled', 'live', 'closed')
        )
        or public.is_super_admin()
      )
  )
);

create policy "Users may view their own bids"
on public.bids for select
to authenticated
using ((select auth.uid()) = bidder_id or public.is_super_admin());

create policy "Users may manage their own saved lots"
on public.saved_lots for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Published journal articles are public"
on public.journal_articles for select
to anon, authenticated
using (is_published or public.is_super_admin());

create policy "Super admin can view contact messages"
on public.contact_messages for select
to authenticated
using (public.is_super_admin());

create policy "Super admin can view audit logs"
on public.admin_audit_logs for select
to authenticated
using (public.is_super_admin());

create policy "Public site settings are readable"
on public.site_settings for select
to anon, authenticated
using (is_public or public.is_super_admin());

create policy "Super admin manages auction lots"
on public.auction_lots for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "Super admin manages lot images"
on public.lot_images for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "Super admin manages journal articles"
on public.journal_articles for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "Super admin manages contact messages"
on public.contact_messages for update
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "Super admin may remove contact messages"
on public.contact_messages for delete
to authenticated
using (public.is_super_admin());

create policy "Super admin manages site settings"
on public.site_settings for all
to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- There are intentionally no client-facing insert, update, or delete policies for:
-- user_roles, bids, admin_audit_logs, or contact_messages inserts. Trusted
-- server-side code using the service role must perform bid and contact inserts
-- after validating authorization and business rules.
