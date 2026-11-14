# THE VAULT — Visual Prototype (Milestone 01)

An editorial-style luxury online auction prototype built with plain HTML, CSS and JavaScript.

## Included screens
- `index.html` — Homepage and brand introduction
- `explore.html` — Auction catalogue with category filters, search and sorting
- `lot.html` — Auction lot details, image selection, watchlist and simulated bidding
- `arena.html` — Simulated live auction room
- `about.html` — About the House editorial page
- `journal.html` — Journal homepage with category filtering
- `article.html` — URL-driven Journal article template
- `contact.html` — Demonstration correspondence form

## Run locally

1. Extract this folder.
2. Open it in Visual Studio Code.
3. Install the **Live Server** extension (or use any local static web server).
4. Right-click `index.html` and choose **Open with Live Server**.

You can also open `index.html` directly in a browser, although a local server is recommended.

## Current functionality
- Responsive desktop and mobile layouts
- Category filtering, search and sorting
- Watchlist saved in browser local storage
- Auction detail page changes based on the selected lot
- Image thumbnail switching
- Client-side demo bid validation and activity updates
- Illustrative countdown timer
- Journal article selection and related stories
- Demonstration contact form with client-side validation

## Important prototype limitations
This is a frontend visual prototype. It does **not** yet include real accounts, a backend database, secure bid processing, cross-user live updates, actual auction closing, payment processing or administrator access. Demo bids only update the current browser session. Product information and bid figures are illustrative and must not be represented as verified real auctions.

## Design direction
- 70% THE VAULT: editorial luxury, warm paper, restrained typography
- 20% THE ARENA: darker live-auction experience
- 10% BID//NOW: compact auction data and activity

Typography uses Instrument Serif, DM Sans and DM Mono from Google Fonts. Product imagery is loaded from Unsplash and therefore requires an internet connection.

## Suggested next milestone
Review the visual prototype first. Then implement authentication, database schema and server-side bid validation before adding realtime auction updates.

## Phase 9 backend foundation

The planned backend uses Supabase PostgreSQL and Supabase Auth while keeping the
existing vanilla HTML, CSS and JavaScript frontend. The initial schema migration
is at `supabase/migrations/20261114000000_initial_schema.sql`.

### Database tables

- `profiles` — public account profile fields linked to `auth.users`.
- `user_roles` — the manually provisioned role record for the single
  `super_admin`.
- `auction_lots` — published and administrative lot metadata. `legacy_id`
  preserves the current frontend identifiers such as `watch`, `art` and `car`.
- `lot_images` — ordered images belonging to a lot.
- `bids` — permanent bid records. Bids are never overwritten; a trusted trigger
  updates the cached lot bid total and count.
- `saved_lots` — the authenticated user's watchlist, keyed by user and lot.
- `journal_articles` — structured Journal content and publication state.
- `contact_messages` — enquiries retained for administrative review.
- `admin_audit_logs` — server-created records of administrative actions.
- `site_settings` — JSON settings with an explicit public/private flag.

Relationships use UUID foreign keys. Public content is exposed only when its
published state permits it. User-owned profiles, bids and saved lots are scoped
to the authenticated user's UUID.

### Supabase setup

1. Create a Supabase project and keep its project URL and publishable key
   available for a later frontend integration.
2. Apply the migration through the Supabase SQL Editor, or with the Supabase
   CLI after linking the project:

   ```text
   supabase db push
   ```

3. Confirm that all listed tables have Row Level Security enabled.
4. Create the owner's account manually in Supabase Auth. Do not put an email
   address or password in this repository.
5. Copy that Auth user's UUID and manually provision the only admin role:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('<AUTH_USER_UUID>', 'super_admin');
   ```

   The unique role constraint permits only one super-admin record. No public
   registration flow can create or change roles.

### Configuration and secrets

No Supabase credentials are committed. A future client integration may use:

```text
SUPABASE_URL=<project-url>
SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

Server-side code may additionally use:

```text
SUPABASE_SERVICE_ROLE_KEY=<server-only-secret>
```

The service-role key bypasses Row Level Security and must never be placed in
HTML, `app.js`, browser JavaScript, Git, or client-visible environment
variables. Contact creation, bid recording, administrative writes and audit
logging should go through trusted server-side code that checks the authenticated
user and database role.

### Authentication planning

Supabase Auth will provide email/password and Google OAuth in a later phase.
For Google sign-in, create an OAuth client in Google Cloud Console, add the
Supabase callback URL shown in the Supabase Auth provider settings, configure
the client ID and secret in Supabase, and add the production and local site
URLs to the allowed redirect URLs. OAuth is not operational until those values
are configured manually.

### Security model

RLS is enabled on every application table in the migration. Anonymous visitors
can read only published lots, lot images, published Journal articles and
explicitly public site settings. Authenticated users can manage only their own
saved lots and profile fields. Bid inserts, contact inserts, role changes,
audit-log writes and administrative content writes are not exposed through
public client policies.

The database role is read from `user_roles` through a `SECURITY DEFINER`
function. Frontend-supplied role values are never trusted. The single
super-admin must be provisioned manually in Supabase; there is no public
admin-registration endpoint.

### Current backend limitations

The public website still uses its frontend demonstration data, localStorage
watchlist, simulated bids and illustrative countdowns. There is no server-side
bid validation, payment processing, realtime subscription or deployment
configuration.

## Phase 10A authentication

Authentication is implemented as a vanilla browser integration without a build
step:

- `supabase-config.js` contains only the browser-safe Supabase project URL and
  publishable/anon key for the connected project.
- `supabase-client.js` wraps the pinned Supabase JS `2.49.4` browser client.
- `auth.html` and `auth.js` provide email/password registration, login, email
  verification messaging, Google OAuth preparation, password recovery, reset
  handling and logout.
- `admin.html` and `admin.js` provide a protected verification-only entry point.
  No administrative database operations are exposed in Phase 10A.
- Existing page account links now open the authentication page while browsing
  remains available without an account.

For another environment, populate only `supabase-config.js` with that
environment's project URL and publishable/anon key. Never add a service-role
key, database password or OAuth client secret to that file or any
browser-loaded file.

### Google OAuth configuration

Google sign-in remains unavailable until it is configured manually:

1. Create a Google OAuth Web application in Google Cloud Console.
2. Add the Supabase Auth callback URL shown by the Supabase Google provider
   settings.
3. Enable the Google provider in Supabase and enter the Google client ID and
   secret there.
4. Add the local and production application URLs to Supabase's allowed redirect
   URLs.

The browser code uses `auth.html` as the redirect target and does not contain
Google credentials.

### Authentication security notes

The browser never decides whether a user is an administrator. The protected
entry point first requires a Supabase session, then calls the database
`is_super_admin()` RPC. A failed RPC, missing session or ordinary user produces
an access-denied state. Roles are never read from localStorage, URL parameters
or frontend configuration.

The separate migration
`supabase/migrations/20261114010000_harden_security_definer_functions.sql`
sets an empty search path on the security-definer functions. Apply it after the
Phase 9 migration if it has not already been applied.

### Phase 10A limitations

Authentication still depends on the Supabase Auth provider and redirect
settings being configured for each environment. Phase 10A did not include lot
management, server-side bidding, payments, realtime updates or database-backed
saved lots.

## Phase 10B administration foundation

The protected `admin.html` route now contains the first read-only private room
for the verified super-admin:

- The page checks for a Supabase session, then calls `is_super_admin()` through
  `supabase-client.js`.
- Unauthenticated visitors are sent to `auth.html?next=admin`.
- Authenticated non-admin users are denied without loading dashboard data.
- The Overview section reads lot, bid, profile and contact-message data through
  the existing RLS policies.
- Other navigation sections and quick actions are labelled as later-phase
  placeholders. No browser-side administrative writes are implemented.

The Overview displays total lots, published lots, live auctions, closed
auctions, recorded bids, registered profiles and recent lots, bids and
enquiries. The current schema has no reliable unread-enquiry column, so that
metric is intentionally displayed as unavailable rather than inferred.

Phase 10B does not include lot editing, image uploads, bid moderation, member
management, journal publishing, enquiry management, realtime controls,
payments or deployment.
