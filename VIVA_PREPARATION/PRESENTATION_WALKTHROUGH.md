# THE VAULT — Live Viva Presentation Walkthrough & Demonstration Script

> **Prepared for:** B.Tech Computer Science First-Year Viva Examination  
> **Student:** Yash  
> **Topic:** Step-by-Step Live Demonstration Script and Code Review Guide

---

## 1. Pre-Demonstration Checklist (Do this 10 minutes before the viva)

1. **Browser Setup:**
   - Open Google Chrome in a clean window.
   - Have the live production site ready in Tab 1: `https://the-vault-orpin-one.vercel.app/`
   - Have the local version ready in Tab 2: `http://localhost:3000` (or `index.html`).
   - Have the GitHub repository open in Tab 3: `https://github.com/Peeks000/the-vault`
2. **Code Editor Setup:**
   - Open the project in VS Code.
   - Have these 4 key files open in tabs:
     - `app.js` (Core Application Controller)
     - `vault-3d-showcase.js` (Three.js WebGL Stage)
     - `cursor-loader.js` (Canvas 2D Liquid Trail & Sensory Engine)
     - `supabase/migrations/20261114000000_initial_schema.sql` (PostgreSQL Database Schema)
3. **Sound Check:**
   - Ensure your computer speakers are set to a comfortable volume (~25%) to showcase the interactive ambient sound jar.

---

## 2. The 90-Second Opening Pitch

When the examiner says: *"Tell me about your project."*

**Say this confidently:**
> *"Good morning, Professor. My project is **THE VAULT**, an independent digital auction platform for exceptional objects like mechanical timepieces, contemporary fine art, classic automobiles, and heirloom jewellery.*
> 
> *While standard e-commerce focuses on quick transactions, luxury auction houses like Sotheby's or Christie's focus on curation, storytelling, provenance, and competition. I wanted to capture that prestigious atmosphere in a web application.*
> 
> *From a technical standpoint, I deliberately built this project using **pure Vanilla HTML5, modern CSS3, and ES6+ JavaScript** without relying on high-level frameworks like React. This allowed me to master core Computer Science web fundamentals: the Document Object Model, hardware-accelerated Canvas 2D graphics, WebGL 3D rendering with Three.js, and relational database security using PostgreSQL and Supabase.*
> 
> *May I give you a brief 3-minute walkthrough of the live application?"*

---

## 3. The 6-Step Live Demonstration Sequence

### Step 1: The Active Theory Sensory Experience (Homepage)
- **What to do:**
  1. Refresh the homepage (`index.html`).
  2. Move your mouse smoothly across the screen.
  3. Point out the floating pill in the upper-right corner.
  4. Click the sound jar to play ambient music; then scroll down and scroll up.
- **What to say:**
  > *"When the site loads, you notice our custom luxury sensory layer inspired by Active Theory. Instead of standard web pointers, we have a dual-layer cursor: an instantaneous gold precision dot and an outer follower ring that uses mathematical Linear Interpolation (LERP) for physical inertia.*
  > 
  > *Behind the cursor, an HTML5 Canvas 2D renders fluid filament trails using quadratic Bézier curves connecting mouse coordinates.*
  > 
  > *Notice the tiny glowing fireflies emerging from the upper edge—they are autonomous particles with harmonic bioluminescent pulse cycles.*
  > 
  > *In the top right, we have an interactive Sound Jar. When I click it, ambient audio begins and the equalizer bars animate. Notice what happens when I scroll down: the button intelligently glides upward out of view to avoid obstructing content; when I scroll up, it glides smoothly back into place."*

### Step 2: Catalog Exploration & Real-Time Filtering (`explore.html`)
- **What to do:**
  1. Click **"Auctions"** in the navigation bar to enter `explore.html`.
  2. Click the **"Timepieces"** category filter chip.
  3. Type **"Chrono"** into the search bar.
  4. Change the sort dropdown to **"Price: High to Low"**.
  5. Click the heart icon (`♡` -> `♥`) on a lot card.
  6. Click **"Saved Edit"**.
- **What to say:**
  > *"Here on the Explore page, the entire catalog is managed dynamically in JavaScript. Our `renderExplore()` function executes client-side array filtering without reloading the page.*
  > 
  > *When I type in the search bar, it instantly filters across titles, periods, and categories. When I change the sort dropdown, it runs an in-place numerical `sort()` on the dataset.*
  > 
  > *When I click this heart icon, it doesn't trigger a page navigation. It uses `event.stopPropagation()` to toggle the key inside browser `localStorage`. Notice the saved counter in the header immediately increments to 01, perfectly synchronized via custom DOM events."*

### Step 3: Lot Dossier & Simulated Bidding Desk (`lot.html`)
- **What to do:**
  1. Click on **"The Heritage Chronograph"** to navigate to `lot.html?lot=watch`.
  2. Click different gallery thumbnails below the watch.
  3. Click the expand button to open the modal lightbox, then close it.
  4. Point to the live countdown timer.
  5. Enter an invalid bid (e.g. `1000`) and click **"Place demonstration bid"** to trigger validation.
  6. Enter a valid bid (e.g. `245000`) and submit.
- **What to say:**
  > *"On the lot details page, the controller reads the `?lot=watch` query parameter using `URLSearchParams` to look up the item.*
  > 
  > *We have an interactive thumbnail switcher and a full-screen zoom lightbox.*
  > 
  > *Notice the digital countdown timer: it calculates remaining hours, minutes, and seconds using modulo arithmetic and updates every 1,000 milliseconds via `setInterval`.*
  > 
  > *Here is our interactive Bidding Desk, constructed via a JavaScript factory function with closure-scoped state. If I enter an amount lower than the minimum bid, our validation engine catches it and shows a helpful error banner. When I enter a valid bid in increments of ₹5,000, it accepts the bid, updates the current price, increments the bid counter, records the entry in `sessionStorage`, and prepends a new activity row to the history log."*

### Step 4: The Live Auction Arena (`arena.html`)
- **What to do:**
  1. Click **"Arena"** in the header.
  2. Point out the spotlight active lot, room signals feed, and floor cards.
- **What to say:**
  > *"The Arena page simulates a physical live auction floor. It features the current spotlight lot on the block, a room activity ticker simulating incoming collector interest, and floor lots where users can click 'Make featured ↗' to bring any active item to center stage."*

### Step 5: The 3D WebGL Artifact Stage (Homepage Bottom)
- **What to do:**
  1. Navigate back to Home and scroll to the bottom.
  2. Use your mouse to click and drag the 3D model, rotating it 360 degrees.
  3. Zoom in with the mouse wheel.
- **What to say:**
  > *"At the bottom of our homepage, we have integrated a real-time hardware-accelerated 3D WebGL stage powered by Three.js.*
  > 
  > *We load a high-definition binary glTF model (`.glb`) asynchronously using `GLTFLoader`. In our 60fps render loop, the model rotates along a turntable axis, gently levitates using a mathematical sine wave, and responds to mouse parallax. Users can also interact directly using OrbitControls to inspect the craftsmanship from any angle."*

### Step 6: Database & Admin Control Room (`admin.html`)
- **What to do:**
  1. Navigate to `admin.html`.
  2. Point out the authentication guard, the telemetry tiles, the data table, and the "Seed Lots" button.
- **What to say:**
  > *"For system administration, we built an Admin Control Room protected by PostgreSQL Row Level Security and a server-side cryptographic RPC function (`is_super_admin`).*
  > 
  > *The telemetry metrics at the top are queried in parallel using `Promise.all`. Administrators can create new auction lots, update valuations, and safely manage records with foreign-key constraint protection."*

---

## 4. Code Walkthrough: What Files to Open When Asked

When the examiner says: *"Show me the code for X."*

| Feature Question | Exact File to Open | Key Functions / Lines to Highlight |
| :--- | :--- | :--- |
| **"Show me the bidding logic"** | `app.js` | Scroll to Section 4: `createBidDesk()` & `getValidationError()` |
| **"Show me how you fetch lots"** | `app.js` | Scroll to Section 5: `CatalogueService.getLots()` & fallback |
| **"Show me the 3D WebGL setup"** | `vault-3d-showcase.js`| Highlight `THREE.WebGLRenderer`, `GLTFLoader`, and `animate()` |
| **"Show me the liquid trail canvas"** | `cursor-loader.js` | Highlight `ctx.quadraticCurveTo()` in `renderTrail()` |
| **"Show me the database schema"** | `supabase/migrations/20261114000000_initial_schema.sql` | Highlight ENUMs, `ON DELETE CASCADE`, and RLS policies |
| **"Show me how admin security works"** | `supabase-client.js` & `admin.js` | Highlight `client.rpc('is_super_admin')` |

---

## 5. Defense Strategies for Difficult Questions

### Examiner: *"Did you use any templates or drag-and-drop website builders?"*
> **Answer:**  
> *"No, Professor. Every HTML structure, CSS property, JavaScript function, and SQL migration was written from scratch in VS Code. All code is tracked with detailed commit histories on GitHub, and every file is fully documented with educational comments."*

### Examiner: *"Why didn't you write a Node.js Express backend server?"*
> **Answer:**  
> *"Instead of a traditional monolithic Node.js server, we adopted a modern Serverless BaaS architecture using Supabase PostgreSQL. By utilizing PostgreSQL Row Level Security (RLS) policies and security-definer functions directly inside the database engine, the database itself verifies client JWTs on every query. This eliminates backend API boilerplate while providing enterprise-grade security."*

### Examiner: *"How does your site perform on low-end devices?"*
> **Answer:**  
> *"Performance was a core priority. We use CSS hardware acceleration (`will-change: transform`, `translate3d`), native lazy-loading on images (`loading="lazy"`), efficient Canvas 2D clearing, and `requestAnimationFrame` which pauses rendering when the browser tab is hidden. On mobile touchscreens, custom cursors are completely disabled using `@media (hover: none)`."*
