# THE VAULT

An online auction web app for rare watches, fine art, jewelry, and classic cars. Built using HTML5, CSS3, JavaScript, Three.js, and Supabase for our college web development project.

## What the site does

Visitors can browse active auction lots, filter by category or keyword, save favorites in a watchlist, view close-up item photos, rotate a 3D model preview, and test placing bids in Indian Rupees (INR). Most features work directly in the browser using demo data, while member login and lot management connect to Supabase when configured.

## Features

- Home page with featured lot spotlight, auction categories, ending-soon preview, and a 360-degree Three.js 3D viewer (`assets/3d_model_the_vault.glb`)
- Auctions page (`?page=explore`) with category chips, search bar, price/time sorting, and saved watchlist filter (`localStorage`)
- Lot detail view (`?page=lot&lot=watch`) with image switcher, zoom lightbox, countdown timer, and bid validation in ₹5,000 steps
- Live bidding room (`?page=arena`) where any floor item can be switched onto the main stage
- Collector guides (`?page=journal` & `?page=article`) with topic filtering and full reading pages
- Contact page (`?page=contact`) with client-side field validation
- Account login (`?page=auth`) and Admin lot management panel (`?page=admin`) backed by Supabase Auth and PostgreSQL Row Level Security

## Files & folders

```
the-vault/
├── index.html        All 10 views inside one HTML5 page + shared header and footer
├── css/
│   └── vault.css     Layout styles, typography, effects, and mobile/tablet media queries
├── js/
│   ├── data.js       Sample lots, guide articles, and Supabase public config
│   ├── core.js       Price/time formatters, watchlist storage, bid checks, and URL router
│   ├── effects.js    Page loader, custom cursor trail, background audio toggle, and 3D viewer
│   └── pages.js      Controller functions for each view
├── assets/           3D camera model (.glb) and ambient audio track (.mp3)
├── vendor/           Three.js library files (three.min.js, GLTFLoader.js, OrbitControls.js)
└── supabase/         SQL table schema and RLS security migrations
```

## How to run it

1. Open the project folder in a terminal (or VS Code).
2. Start a local static server so the 3D model and URL query routes load cleanly:
   ```bash
   python -m http.server 4173
   ```
   (Or right-click `index.html` in VS Code and choose **Open with Live Server**.)
3. Open `http://localhost:4173/index.html` in a browser.

## Notes on demo mode

- Watchlist items persist using `localStorage`, and test bids stay inside `sessionStorage` so no real payment or transaction occurs.
- Product photos load from Unsplash, and fonts load from Google Fonts (*Instrument Serif*, *DM Sans*, *DM Mono*), so an internet connection is needed for images and fonts.
