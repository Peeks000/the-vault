# THE VAULT — Online Auction Platform

**THE VAULT** is a responsive web application for browsing and bidding on curated collectibles including vintage watches, fine art, jewelry, and classic cars. Built with semantic **HTML5**, modern **CSS3**, and modular **JavaScript**, with optional **Supabase** authentication and database support.

---

## Project Structure

```text
the-vault/
├── index.html          # Semantic HTML5 Single-Page Application (all 10 views)
├── css/
│   └── vault.css       # Organized stylesheet (tokens, layout, sections, responsive breakpoints)
├── js/
│   ├── data.js         # Catalogue lots, collector articles, and Supabase client setup
│   ├── core.js         # Formatters, LocalStorage watchlist, bidding validation, SPA router
│   ├── effects.js      # Preloader, 3D Three.js watch showcase, custom cursor, Web Audio chime
│   └── pages.js        # Page controllers for Home, Explore, Lot, Arena, Journal, Auth & Admin
├── assets/             # Local media assets (3D watch preview video & audio)
├── vendor/             # Three.js library for interactive 3D inspection
├── supabase/           # PostgreSQL schema and Row Level Security migrations
└── README.md
```

---

## Key Features

- **Home & Featured Lots:** Introduction to live auctions, category browser, ending-soon items, collector guides, and interactive 360-degree 3D watch viewer.
- **Browse & Search (`?page=explore`):** Category filtering (Watches, Art, Jewellery, Automotive), saved-only toggle, live search, and price/bid sorting.
- **Lot Details (`?page=lot&lot=watch`):** Multi-image gallery with zoom lightbox, reserve estimate, live countdown timer, and bid placement with increment validation.
- **Live Bidding Room (`?page=arena`):** Spotlight item bid desk, active floor switching, live activity log, and closing-soon strip.
- **Collector Guides (`?page=journal` & `?page=article`):** Category-filtered articles with full reading view and related stories.
- **Contact Form (`?page=contact`):** Inquiry form with client-side validation and topic quick-fill buttons.
- **Account & Admin Dashboard (`?page=auth` & `?page=admin`):** Email/password and Google OAuth authentication via Supabase Auth, plus a role-checked admin console verified via `is_super_admin()`.

---

## Running Locally

Because the app uses clean URL query routes (`?page=explore`) and local assets, serve the folder using any local HTTP server:

```bash
python -m http.server 4173
```

Then open `http://localhost:4173/index.html` in your browser (or use the VS Code **Live Server** extension on `index.html`).

---

## Technology Stack

- **HTML5:** Semantic structure (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) with shared header/footer and clean view toggling.
- **CSS3:** Custom CSS variables, Grid and Flexbox layouts, responsive breakpoints (`1000px` tablet, `680px` mobile), and editorial typography (*Instrument Serif*, *DM Sans*, *DM Mono*).
- **JavaScript (ES6+):** Single-page router, localStorage watchlist persistence, simulated bid increment rules, interactive Three.js 3D showcase, Web Audio API ambient sound, and Supabase browser client integration.
- **Backend (Optional / Supabase):** PostgreSQL tables (`auction_lots`, `bids`, `saved_lots`, `journal_articles`, `contact_messages`, `profiles`, `user_roles`) protected by Row Level Security.
