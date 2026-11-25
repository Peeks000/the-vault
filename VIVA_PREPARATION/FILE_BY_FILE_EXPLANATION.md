# THE VAULT — Complete File-by-File Technical Guide

> **Prepared for:** B.Tech Computer Science First-Year Viva Examination  
> **Student:** Yash  
> **Topic:** Comprehensive Explanation of Every Source File in THE VAULT

---

## Table of Contents
1. [HTML Pages (10 Files)](#1-html-pages)
2. [JavaScript Application Files (7 Files)](#2-javascript-application-files)
3. [Cascading Style Sheets (2 Files)](#3-cascading-style-sheets)
4. [PostgreSQL Database Migrations (3 Files)](#4-postgresql-database-migrations)
5. [Vendor Assets & 3D Models](#5-vendor-assets--3d-models)

---

## 1. HTML Pages

### 1.1 `index.html` (Homepage)
- **Role:** Flagship entry portal for the entire website.
- **Key Sections:**
  - Announcement bar (`.announcement`): High-contrast gold-and-black top strip.
  - Header (`.site-header`): Wordmark (`THE VAULT.`), mobile hamburger toggle (`.mobile-menu-toggle`), main navigation (`<nav class="main-nav">`), and saved watchlist counter (`.saved-count`).
  - Hero Section (`.vault-hero`): Editorial split layout featuring large typography (`Instrument Serif`), horology photography (`FIG. 001`), and call-to-actions.
  - Featured Auction (`#featured`): Dynamic card populated by `renderHome()` in `app.js` with live bid values, countdown, and watchlist toggle.
  - Live Grid (`#home-live-grid`): Preview cards of active lots closing today.
  - 3D Artifact Showcase (`.vault-showcase-section`): Container hosting `#vault-3d-canvas` where Three.js renders `3d_model_the_vault.glb`.
  - Footer (`.site-footer`): Secondary navigation, student project disclaimer, and smooth scroll button (`.back-top`).
- **Scripts Loaded:** `cursor-loader.js`, `vendor/three.min.js`, `vendor/GLTFLoader.js`, `vendor/OrbitControls.js`, `vault-3d-showcase.js`, Supabase CDN, `supabase-config.js`, `supabase-client.js`, `app.js`.

### 1.2 `explore.html` (Auctions Catalog)
- **Role:** Complete interactive catalog exploration interface.
- **Key Sections:**
  - Filter Bar (`.filter-bar`): Category buttons (`data-filter="Timepieces"`, etc.) and Saved Edit toggle (`#saved-filter`).
  - Search & Sort Bar: Live search input (`#lot-search`) and sorting dropdown (`#lot-sort`).
  - Results Counter (`#results-count`): Displays text such as `SHOWING 08 SELECTED LOTS`.
  - Auction Grid (`#auction-grid`): Dynamic grid where `renderExplore()` injects generated lot card markup.
  - Empty State (`#empty-state`): Displayed when search queries or category filters yield zero results.

### 1.3 `lot.html` (Single Lot Dossier)
- **Role:** Deep-dive dossier for an individual auction item.
- **Key Sections:**
  - URL Parameter Detection: Reads `?lot=xyz` (e.g., `lot.html?lot=watch`).
  - Visual Dossier: High-resolution showcase image (`#lot-image`), thumbnail selector (`#gallery-thumbs`), and zoom trigger (`#image-expand`).
  - Modal Lightbox (`#image-lightbox`): Hidden full-screen overlay for inspection.
  - Bidding Desk (`.lot-bidding-panel`): Displays current bid, bid count, standard increment, numerical input (`#bid-amount`), place bid button (`#place-bid`), and validation error/success container (`#bid-feedback`).
  - Live Countdown (`#countdown`): Digital clock ticking down in `HH:MM:SS`.
  - Similar Lots Grid (`#similar-lots-grid`): Algorithmically selects 3 related lots from the same category.

### 1.4 `arena.html` (Live Auction Floor Simulation)
- **Role:** Recreates the high-stakes atmosphere of a live physical auction room.
- **Key Sections:**
  - Arena Header: Real-time room capacity and active lot counter (`#arena-active-count`).
  - Spotlight Lot (`.arena-featured-lot`): Prominent active item currently on the block with live bid desk and closing countdown.
  - Room Signals Feed (`#arena-activity`): Live activity updates ("A bid was recorded on The Heritage Chronograph").
  - Arena Floor (`#arena-floor`): Cards for other lots currently on the floor with "Make featured ↗" selection buttons.

### 1.5 `journal.html` (Editorial Magazine Index)
- **Role:** Luxury publishing section providing curatorial context to collecting.
- **Key Sections:**
  - Category Filter Tabs (`[data-journal-filter]`): Filter stories by Watches, Art, Collecting, and Automotive.
  - Story Grid (`#journal-story-grid`): Injected with editorial article cards containing imagery, category badges, titles, and reading-time estimations (`renderJournal()` in `app.js`).

### 1.6 `article.html` (Editorial Story Reader)
- **Role:** Long-form article reading layout.
- **Key Sections:**
  - Container (`#article-root`): Dynamically populated by `renderArticle()` in `app.js` based on `?story=xyz`.
  - Multi-Section Body: Formatted headings and paragraphs with generous typography and margin rhythm.
  - Related Stories: Cross-links to other articles sharing thematic tags.

### 1.7 `about.html` (The House & Philosophy)
- **Role:** Communicates the founding philosophy, curatorial standards, and independent auction house model.
- **Structure:** Clean semantic layout utilizing editorial columns, callout quotes, and curatorial standards.

### 1.8 `contact.html` (Correspondence & Inquiries)
- **Role:** Handles client communication, private acquisitions, and consignment inquiries.
- **Key Sections:**
  - Form (`#contact-form`): Full name, email, enquiry type dropdown, subject, and message.
  - Direction Buttons (`[data-contact-type]`): Quick-fill shortcut buttons (e.g., "Consignment", "Private acquisition").
  - Confirmation Notice (`#contact-confirmation`): Accessible success banner revealed when valid.

### 1.9 `auth.html` (Authentication Portal)
- **Role:** Unified Single-Page Application (SPA) authentication center.
- **Key Sections:**
  - Mode Switch Tabs (`[data-auth-mode]`): Switches between "Sign In", "Create Account", and "Reset Password" without page reloads.
  - Form Fields: Email (`#auth-email`), password (`#auth-password`), and password confirmation.
  - Error/Success Banners (`#auth-error`, `#auth-success`): Displays user feedback with `role="alert"`.
  - OAuth Button (`#google-auth-btn`): Triggers Google OAuth sign-in.

### 1.10 `admin.html` (Admin Control Room)
- **Role:** Super-admin management portal for system telemetry and lot operations.
- **Key Sections:**
  - Auth Guard (`#admin-auth-guard`): Loading spinner verifying session permissions.
  - Access Denied Banner (`#admin-access-denied`): Displayed if an authenticated user lacks super-admin status.
  - Dashboard View (`#admin-dashboard`):
    - Telemetry Tiles: Total Lots, Active Lots, Total Bids, and Catalogue Value.
    - Lot Management Table (`#admin-lots-table-body`): Lists lots with image thumbnails, categories, status badges, and action buttons ("Edit", "Delete / Withdraw").
    - CRUD Modal (`#lot-modal`): Form for inserting or updating lot metadata and image URLs.
    - Seeding Button (`#btn-seed-lots`): Pre-populates the database with demonstration lots using SQL UPSERT.

---

## 2. JavaScript Application Files

### 2.1 `app.js` (Master Application Controller)
- **Lines of Code:** ~988 lines (concisely structured around shared helpers like `attachBidDeskUI`).
- **Pattern:** Immediately Invoked Function Expression (`IIFE`) with `'use strict'`.
- **Key Components:**
  1. `AUCTION_LOTS` & `JOURNAL_ARTICLES`: Static arrays acting as the resilient offline data store.
  2. `Formatters`: Utility object with `currency()` (Indian numbering format `₹2,40,000`), `clock()` (`HH:MM:SS`), `status()`, and `closing()`.
  3. `Watchlist`: Object managing persistent saved lot keys in `localStorage`, dispatching `vault:saved-change` custom events.
  4. `createBidDesk()`: Factory function implementing closure-scoped state for simulated auction bidding with increment validation.
  5. `CatalogueService`: Singleton object querying Supabase PostgreSQL for live catalog records with automatic fallback to static lots.
  6. `renderExplore()`, `renderLot()`, `renderHome()`, `renderArena()`, `renderJournal()`, `renderArticle()`, `renderContact()`: Dedicated page controllers.
  7. `window.VaultApp`: Exported immutable namespace sealed with `Object.freeze()`.

### 2.2 `supabase-config.js` (Database Configuration)
- **Role:** Centralized configuration storing the Supabase Project URL and public Anonymous API Key.
- **Security Defense for Viva:**  
  *The Anonymous Key (`anon`) is browser-safe because data security is enforced at the database level by PostgreSQL Row Level Security (RLS) policies. The privileged `service_role` key is NEVER exposed on the client.*

### 2.3 `supabase-client.js` (Supabase Client & Auth Bus)
- **Role:** Initializes the Supabase JavaScript SDK, tracks user session state, and synchronizes header navigation.
- **Key Methods:**
  - `init()`: Connects to the Supabase client using credentials from `supabase-config.js`.
  - `onAuthStateChange()`: Listens for login/logout events, updating navigation elements dynamically.
  - `isSuperAdmin()`: Executes a server-side PostgreSQL Remote Procedure Call (`rpc('is_super_admin')`) to securely verify admin permissions.

### 2.4 `auth.js` (Authentication Controller)
- **Role:** Powers the authentication flow on `auth.html`.
- **Key Methods:**
  - `switchMode(mode)`: Implements SPA tab switching between Sign In, Sign Up, and Password Reset.
  - `handleAuthSubmit()`: Validates password strength (minimum 6 characters), prevents page reload via `event.preventDefault()`, and invokes `auth.client.auth.signInWithPassword()` or `signUp()`.
  - `handlePasswordReset()`: Parses URL access tokens (`#access_token=...`) to allow setting a new password.

### 2.5 `admin.js` (Admin Dashboard Controller)
- **Role:** Powers the administrative portal on `admin.html`.
- **Key Methods:**
  - `checkSuperAdminAccess()`: Gatekeeper verifying `auth.isSuperAdmin()`.
  - `loadMetrics()`: Runs parallel queries using `Promise.all` and `{ count: 'exact', head: true }` for high-speed telemetry.
  - `saveLot()`: Handles modal form submission to insert or update `auction_lots` and related `lot_images`.
  - `deleteLot()`: Attempts SQL `DELETE`. If a foreign key restriction occurs (PostgreSQL Error `23503`), it automatically offers a safe fallback to update the lot status to `withdrawn`.
  - `seedLots()`: Executes bulk UPSERT queries to seed the database with catalog demonstration records.

### 2.6 `vault-3d-showcase.js` (Three.js WebGL 3D Showcase)
- **Role:** Implements the real-time 3D artifact stage at the bottom of the homepage.
- **Key Concepts:**
  - `THREE.WebGLRenderer`: Configured with `antialias: true`, `alpha: true`, and `preserveDrawingBuffer: true`.
  - `THREE.PerspectiveCamera`: 42° Field of View positioned for a luxury studio look.
  - 3-Point Studio Lighting: Warm key directional light, cool fill light, and ambient fill.
  - `GLTFLoader`: Asynchronously loads `3d_model_the_vault.glb`, computes a bounding box (`Box3`), and centers the model.
  - Animation Loop (`requestAnimationFrame`): Continuous turntable rotation, harmonic sine levitation (`Math.sin(elapsed * 1.5) * 0.08`), and cursor parallax interpolation (LERP).

### 2.7 `cursor-loader.js` (Sensory Experience Engine)
- **Role:** Manages the Active Theory preloader, dual cursor, liquid trail, fireflies, and sound jar.
- **Key Concepts:**
  - **Preloader:** Multi-stage loading overlay displaying branded typography and sequential pulsing dots.
  - **Dual Cursor:** Instant zero-lag dot (`.vault-cursor-dot`) plus physical inertia ring (`.vault-cursor-ring`) using LERP.
  - **Liquid Trail Canvas:** 2D Canvas rendering quadratic Bézier curves (`ctx.quadraticCurveTo`) through recent pointer points.
  - **Firefly Colony:** Autonomous particle system where fireflies emerge from the upper edge and drift organically with harmonic sine wobbles.
  - **Interactive Sound Jar:** Floating glass pill with dancing embers that reacts to scroll direction (hides when scrolling down, reveals when scrolling up) and toggles ambient audio.

---

## 3. Cascading Style Sheets

### 3.1 `styles.css` (Master Luxury Editorial Stylesheet)
- **Size:** ~2,414 lines.
- **Design Tokens (`:root`):**
  - Colors: `--paper` (`#f1efe8` warm ivory), `--ink` (`#191a18` rich charcoal), `--brass` (`#a58a60` muted antique gold).
  - Typography: `--serif` (`'Instrument Serif'`), `--sans` (`'DM Sans'`), `--mono` (`'DM Mono'`).
  - Fluid Gutters: `--gutter: clamp(22px, 6.1vw, 96px)`.
- **Core Architecture:**
  - Global Reset: `box-sizing: border-box` and smooth scrolling.
  - Layout Systems: Extensive use of CSS Grid (`grid-template-columns: 1fr 1fr`) and Flexbox.
  - Responsive Typography: Headings scale fluidly using `clamp(38px, 6vw, 68px)`.
  - Admin Styles: Metric cards, responsive data tables, modal dialog overlays, and status badges.

### 3.2 `cursor-loader.css` (Sensory Stylesheet)
- **Role:** Visual presentation and performance optimizations for the sensory layer.
- **Key Concepts:**
  - **Z-Index Stacking Hierarchy:**
    - `z-index: 10000`: Floating Sound Jar pill.
    - `z-index: 99990`: Firefly Canvas.
    - `z-index: 99998`: Liquid Mouse Trail Canvas.
    - `z-index: 100000`: Cursor Follower Ring.
    - `z-index: 100001`: Cursor Center Dot.
    - `z-index: 9999999`: Fullscreen Preloader Overlay.
  - **Hardware Acceleration:** `will-change: transform` and `translate3d(-50%, -50%, 0)`.
  - **Event Pass-Through:** `pointer-events: none !important` ensures canvas clicks pass to underlying HTML.
  - **Mobile Detection:** `@media (max-width: 600px) and (hover: none)` hides the custom cursor on touchscreens.

---

## 4. PostgreSQL Database Migrations

### 4.1 `20261114000000_initial_schema.sql` (Initial Schema)
- **Role:** Defines the complete relational database architecture.
- **Key Features:**
  - Custom PostgreSQL ENUMs: `lot_status` (`draft`, `scheduled`, `live`, `closed`, `passed`, `withdrawn`) and `bid_status`.
  - Tables: `auction_lots`, `lot_images`, `bids`, `user_profiles`, and `audit_log`.
  - Foreign Key Cascades: Deleting a lot automatically deletes its images (`ON DELETE CASCADE`).
  - Foreign Key Restrictions: Lots cannot be deleted if active bids exist (`ON DELETE RESTRICT`).
  - Triggers: `update_auction_lots_updated_at` automatically updates modification timestamps.
  - RLS Policies: Enables public read-only access for published lots, restricting inserts and updates to authenticated super-admins.

### 4.2 `20261114010000_harden_security_definer_functions.sql` (Security Hardening)
- **Role:** Resolves PostgreSQL search path injection vulnerabilities.
- **Viva Concept:**  
  *Functions created with `SECURITY DEFINER` run with the privileges of the database owner. If `search_path` is left unset, an attacker could create a malicious function in a public schema that gets executed inadvertently. Setting `SET search_path = public, pg_temp` explicitly hardens the function against privilege escalation.*

### 4.3 `20261119000000_grant_table_privileges.sql` (Table Privileges Grant)
- **Role:** Explicitly grants SQL privileges (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) to PostgreSQL roles (`anon`, `authenticated`, `service_role`).
- **Viva Concept:**  
  *PostgreSQL requires two independent layers of authorization: (1) Role-Level Table Privileges, and (2) Row Level Security (RLS) policies. Even if an RLS policy permits an action, PostgreSQL throws Error `42501` (Permission Denied) if the role lacks basic table-level grants.*

---

## 5. Vendor Assets & 3D Models

- `vendor/three.min.js`: Three.js core library (Release 128) providing WebGL scene, camera, mesh, and lighting APIs.
- `vendor/GLTFLoader.js`: Standard Khronos Group loader for `.glb` (binary glTF) 3D assets.
- `vendor/OrbitControls.js`: Mouse and touch interaction controller for camera rotation, panning, and zooming.
- `3d_model_the_vault.glb`: High-resolution 3D geometric artifact rendered inside the WebGL stage.
- `uploaded_media_1795103205087.mp3`: Cinematic ambient audio track played by the interactive sound jar.
