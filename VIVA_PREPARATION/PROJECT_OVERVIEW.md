# THE VAULT — Project Overview & Architecture Guide

> **Prepared for:** B.Tech Computer Science First-Year Viva Examination  
> **Student:** Yash  
> **Project:** THE VAULT — Luxury Digital Auction House  
> **Repository:** [https://github.com/Peeks000/the-vault](https://github.com/Peeks000/the-vault)  
> **Live Deployment:** [https://the-vault-orpin-one.vercel.app/](https://the-vault-orpin-one.vercel.app/)

---

## 1. Executive Summary

**THE VAULT** is an independent digital auction platform designed for discovering, exploring, and interacting with curated rare objects—specifically mechanical timepieces, contemporary fine art, classic automotive icons, and heirloom jewellery.

While mainstream e-commerce platforms focus on rapid, high-volume transactions, luxury auction houses (such as Sotheby's, Christie's, and Phillips) prioritize **provenance, storytelling, curatorial restraint, and visual elegance**. THE VAULT translates this prestigious real-world auction atmosphere into a high-performance web experience, combining:
1. Editorial typographic hierarchy (`Instrument Serif`, `DM Sans`, `DM Mono`).
2. Real-time simulated auction bidding with input validation and session persistence.
3. Interactive 3D WebGL artifact inspection powered by Three.js.
4. Active Theory-inspired sensory layers: custom liquid cursor trail, bioluminescent firefly colony, and an interactive floating sound jar with ambient audio.
5. Cloud database integration with Supabase (PostgreSQL) featuring Row Level Security (RLS) policies and Role-Based Access Control (RBAC).

---

## 2. Technology Stack & Architectural Rationale

A common question asked by examiners is:  
> *"Why did you use Vanilla JavaScript instead of React, Next.js, or Vue?"*

### Stack Breakdown

| Layer | Technology | Rationale / Viva Defense |
| :--- | :--- | :--- |
| **Markup** | Semantic HTML5 | Clean document outline using `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, and `<footer>` for search engine indexing (SEO) and screen-reader accessibility (WCAG). |
| **Styling** | Modern Vanilla CSS3 | Utilizes CSS Custom Properties (`:root`), CSS Grid, Flexbox, and fluid typography (`clamp()`). Zero build-step overhead, zero CSS bundle bloat, and instantaneous rendering. |
| **Logic** | Vanilla ES6+ JavaScript | Demonstrates a deep understanding of core programming concepts: Immediately Invoked Function Expressions (IIFE), DOM manipulation, asynchronous Promises, `async/await`, Event Delegation, and browser storage (`localStorage` & `sessionStorage`). |
| **3D Graphics**| Three.js (WebGL) | Enables real-time hardware-accelerated 3D rendering of the Vault Artifact model directly in the browser with custom PBR lighting, sine-wave levitation, and mouse parallax. |
| **Backend / DB**| Supabase & PostgreSQL | Serverless PostgreSQL database with automated PostgREST API endpoints, JWT authentication, and database-level security policies (RLS). |
| **Deployment** | Vercel & GitHub Actions | Continuous deployment with automated preview environments and zero-configuration SSL. |

### The "Why Vanilla?" Viva Answer:
> *"As a first-year Computer Science student, relying on high-level frameworks like React can obscure how the browser actually works under the hood. Building THE VAULT in pure HTML5, CSS3, and ES6+ JavaScript demonstrates my fundamental mastery over the Document Object Model (DOM), browser rendering cycles, event propagation, memory management, and asynchronous network protocols before adopting abstraction layers."*

---

## 3. High-Level System Architecture

```
+-------------------------------------------------------------------------------+
|                                BROWSER CLIENT                                 |
|                                                                               |
|   +-----------------------------------------------------------------------+   |
|   |                       Presentation & Sensory Layer                    |   |
|   |   - HTML5 Semantic Structure                                          |   |
|   |   - CSS3 Luxury Editorial Layout (styles.css)                         |   |
|   |   - Canvas 2D Liquid Trail & Firefly Particles (cursor-loader.js)     |   |
|   |   - Three.js WebGL 3D Artifact Showcase (vault-3d-showcase.js)       |   |
|   +-----------------------------------------------------------------------+   |
|                                       │                                       |
|                                       ▼                                       |
|   +-----------------------------------------------------------------------+   |
|   |                     Application Controller (app.js)                   |   |
|   |   - Watchlist Manager (localStorage: 'vault-saved-lots')              |   |
|   |   - Simulated Bid Desk (sessionStorage: 'vault-demo-bids')            |   |
|   |   - Catalogue Service (Dynamic Fetch + Static Fallback)               |   |
|   |   - View Routers: renderExplore(), renderLot(), renderArena(), etc.   |   |
|   +-----------------------------------------------------------------------+   |
|                          │                                 │                  |
|     +────────────────────┘                                 └────────────+     |
|     ▼                                                                   ▼     |
|  [ Auth Module (auth.js) ]                             [ Admin Module (admin.js) ]
|     │                                                                   │     |
+─────┼───────────────────────────────────────────────────────────────────┼─────+
      │                                                                   │
      ▼                                                                   ▼
+───────────────────────────────────────────────────────────────────────────────+
|                           SUPABASE CLOUD SERVICES                             |
|                                                                               |
|   +---------------------------+       +-----------------------------------+   |
|   |   Supabase Auth (GoTrue)  |       |      PostgREST RESTful Engine     |   |
|   |   - JWT Token Generation  |       |      - Filtered SELECT queries    |   |
|   |   - Password Hashing      |       |      - Relational JOINs           |   |
|   |   - OAuth Callback        |       |      - INSERT / UPDATE / DELETE   |   |
|   +---------------------------+       +-----------------------------------+   |
|                 │                                       │                     |
|                 └───────────────────┬───────────────────┘                     |
|                                     ▼                                         |
|   +-----------------------------------------------------------------------+   |
|   |                     PostgreSQL 15 Relational Database                 |   |
|   |   - Tables: auction_lots, lot_images, user_profiles, audit_log        |   |
|   |   - Security: Row Level Security (RLS) & security_definer functions   |   |
|   |   - Triggers: Automatic timestamp updates & profile creation          |   |
|   +-----------------------------------------------------------------------+   |
+-------------------------------------------------------------------------------+
```

---

## 4. Key Functional Modules

### 1. Catalog Exploration (`explore.html` & `app.js`)
- **Multi-Facet Filtering:** Filter by category (Timepieces, Fine Art, Automotive, Jewellery) and status without page reloading.
- **Client-Side Real-Time Search:** Instant filtering across title, period, category, and lot numbers as the user types.
- **Sorting Modes:** Curated order, ending soonest, and price ascending/descending.
- **Watchlist Toggle:** Users can click the heart icon (`♥`) to bookmark lots. State is preserved in `localStorage` across browser restarts.

### 2. Lot Dossier & Simulated Bidding Desk (`lot.html` & `app.js`)
- **Dynamic Routing:** Reads URL search parameters (e.g., `lot.html?lot=watch`).
- **Interactive Image Gallery:** Thumbnail switcher and full-screen modal lightbox.
- **Bidding Desk Engine (`createBidDesk`):** Validates that bids exceed current price by standard increments (₹5,000) and displays immediate feedback with session-persisted activity logs.
- **Dynamic Urgency Badge & Countdown:** Computes remaining hours, minutes, and seconds, updating every 1,000ms.

### 3. Live Auction Arena Simulation (`arena.html` & `app.js`)
- Simulates the excitement of a live auction room floor.
- Displays a spotlight lot with real-time bidding controls, an active room activity ticker ("The room is watching LOT 042"), and an urgent closing countdown.

### 4. Editorial Journal & Story Reader (`journal.html`, `article.html` & `app.js`)
- Curated luxury magazine layout exploring the art of collecting, mechanical horology, and coachbuilding.
- Dynamic reader view parses the story ID from query strings and formats multi-paragraph editorial essays with calculated reading times.

### 5. 3D WebGL Artifact Stage (`vault-3d-showcase.js` & `vendor/three.min.js`)
- Renders an interactive 3D model (`3d_model_the_vault.glb`) at the bottom of the homepage.
- Features cinematic 3-point studio lighting, subtle floating sine levitation, continuous turntable rotation, mouse parallax, and OrbitControls.

### 6. Authentication System (`auth.html`, `auth.js`, `supabase-client.js`)
- Single-Page Application (SPA) auth portal supporting Sign In, Sign Up, and Password Recovery.
- Built on Supabase GoTrue with secure JSON Web Tokens (JWT) stored in browser storage.
- Auto-syncs header navigation across the website (switching "Enter ↗" to user email and sign-out controls).

### 7. Super-Admin Control Room (`admin.html`, `admin.js`)
- Protected by a server-side cryptographic RPC check (`is_super_admin`).
- Real-time telemetry dashboard calculating active lots, total bid counts, and system values via `Promise.all`.
- Full CRUD operations: Create new auction lots, upload image URLs, edit pricing, and safely withdraw lots with foreign key protection (PostgreSQL Error `23503`).

---

## 5. Demonstration Features vs. Production Boundaries

To score maximum marks in a viva, you must demonstrate **architectural awareness** by explaining what is simulated versus what is production-ready:

| Feature | Current Implementation | Production Evolution |
| :--- | :--- | :--- |
| **Catalog Data** | Live Supabase fetch with static fallback archive (`AUCTION_LOTS`) | Pure database streaming with Redis edge caching |
| **Bidding Engine** | Simulated via `sessionStorage` and client validation | Backend transactions with Stripe/Razorpay pre-authorization holds |
| **Live Bidding Room** | Client-side interval countdowns and simulated activity rows | Real-time WebSockets (e.g. Supabase Realtime Channels or Socket.io) |
| **Admin Access** | Cryptographic Supabase RPC `is_super_admin()` check | Enterprise SAML / Two-Factor Authentication (2FA) |
| **Contact Form** | Client-side regex validation and DOM confirmation notice | Serverless transactional email API (SendGrid, Resend, or AWS SES) |

---

## 6. Project Directory Structure

```
the-vault/
├── index.html                  # Homepage with Hero, Featured Lot, and 3D Showcase
├── explore.html                # Catalog grid with real-time search, filters, and sort
├── lot.html                    # Single lot detail view, photo gallery, and bidding desk
├── arena.html                  # Live auction simulation floor
├── journal.html                # Editorial magazine index
├── article.html                # Dynamic long-form editorial story reader
├── about.html                  # The House philosophy and curatorial standards
├── contact.html                # Correspondence form with client-side validation
├── auth.html                   # Authentication portal (Sign In / Sign Up / Reset)
├── admin.html                  # Super-admin telemetry dashboard and lot manager
├── app.js                      # Core frontend application controller (SPA)
├── auth.js                     # Authentication controller
├── admin.js                    # Admin telemetry and lot CRUD controller
├── supabase-config.js          # Public Supabase credentials and freeze configuration
├── supabase-client.js          # Supabase SDK wrapper and authentication bus
├── vault-3d-showcase.js        # Three.js 3D WebGL showcase controller
├── cursor-loader.js            # Active Theory preloader, liquid cursor, fireflies & sound jar
├── cursor-loader.css           # Styling for cursor, canvases, preloader, and sound jar
├── styles.css                  # Global design system, tokens, grid layouts, and typography
├── vendor/                     # Third-party local libraries (three.min.js, GLTFLoader, OrbitControls)
├── supabase/
│   └── migrations/             # PostgreSQL database schemas, RLS policies, and triggers
└── VIVA_PREPARATION/           # Comprehensive university exam guides
```
