# THE VAULT — 65 Essential Viva Questions & Spoken Answers

> **Prepared for:** B.Tech Computer Science First-Year Viva Examination  
> **Student:** Yash  
> **Topic:** Realistic Examination Questions and Answers

---

## Category 1: General Project & Architecture (Q1 – Q10)

### Q1: What is "THE VAULT" and what problem does it solve?
**Spoken Answer:**  
*"THE VAULT is an independent digital auction platform for rare, high-value collectible objects like mechanical watches, fine art, vintage cars, and bespoke jewellery. Unlike standard e-commerce stores that push fast transactional buying, THE VAULT focuses on curation, provenance, storytelling, and real-time competition, recreating the prestigious atmosphere of physical auction houses like Christie's or Sotheby's directly inside the browser."*

### Q2: What technology stack did you use, and why did you avoid React or Vue?
**Spoken Answer:**  
*"I built THE VAULT using semantic HTML5, modern vanilla CSS3, and ES6+ JavaScript, with Three.js for 3D WebGL rendering and Supabase PostgreSQL for cloud database storage. I chose pure vanilla web technologies because, as a first-year Computer Science student, I wanted to master the foundational web platform—learning how the DOM tree, browser rendering engine, event loop, and asynchronous network calls work under the hood without relying on framework abstractions."*

### Q3: What is the overall architecture of this project?
**Spoken Answer:**  
*"The project follows a modular client-side architecture organized into Single-Page Application (SPA) view controllers inside an Immediately Invoked Function Expression (IIFE). The frontend communicates with a Supabase PostgreSQL backend via RESTful PostgREST APIs. In the event of a network outage or unconfigured database, the frontend automatically falls back to an internal demonstration catalog (`AUCTION_LOTS`) to ensure 100% uptime and resilience."*

### Q4: What design pattern did you use in `app.js`?
**Spoken Answer:**  
*"I used the Module Pattern combined with Factory Functions. The code is encapsulated within an IIFE to keep variables private. For reusable stateful components—like the bidding desk—I wrote a factory function `createBidDesk()` that uses JavaScript closures to encapsulate the lot's current price, minimum increments, and validation logic."*

### Q5: How do the different pages in your multi-page website share state?
**Spoken Answer:**  
*"State is shared across three mechanisms: first, URL search parameters (like `lot.html?lot=watch` or `explore.html?saved=true`); second, persistent browser `localStorage` for the user's saved watchlist; and third, `sessionStorage` for active simulated bid records during that browser session."*

### Q6: What is the difference between `localStorage` and `sessionStorage`?
**Spoken Answer:**  
*"`localStorage` persists data indefinitely on the user's hard drive until explicitly cleared, even if the user restarts their computer. `sessionStorage` only lasts as long as the browser tab remains open; once the tab is closed, its data is automatically wiped. In our project, saved lots use `localStorage` so the user's watchlist is never lost, while demo bids use `sessionStorage` so each visit starts fresh."*

### Q7: What external libraries does this project use?
**Spoken Answer:**  
*"The project is extremely lightweight. We use only two external libraries: Three.js (r128) with its companion GLTFLoader and OrbitControls scripts for our 3D artifact showcase, and the official Supabase JavaScript SDK for database queries and user authentication."*

### Q8: What is the role of `Object.freeze()` at the bottom of `app.js`?
**Spoken Answer:**  
*"At the end of `app.js`, we expose `window.VaultApp = Object.freeze({...})`. `Object.freeze()` is a built-in JavaScript method that makes an object completely immutable. It prevents any outside script, browser extension, or malicious console code from adding, modifying, or deleting properties on our core application controller."*

### Q9: How is mobile responsiveness handled?
**Spoken Answer:**  
*"Responsiveness is handled using CSS fluid scaling via `clamp()`, flexible CSS Grid and Flexbox layouts, and `@media` queries. For instance, the main grid shifts from a 2-column or 3-column editorial grid on desktop down to a single column on mobile, and the custom mouse cursor is automatically deactivated on touchscreen devices using `@media (hover: none)`."*

### Q10: Where is this project deployed and how does continuous deployment work?
**Spoken Answer:**  
*"The project is hosted on Vercel and connected directly to our GitHub repository. Whenever code is pushed to the `main` branch, Vercel's automated continuous deployment pipeline automatically detects the commit, runs asset optimization, and redeploys the live production site in seconds with automated HTTPS encryption."*

---

## Category 2: JavaScript & DOM Manipulation (Q11 – Q20)

### Q11: What is an IIFE and why did you wrap `app.js` in one?
**Spoken Answer:**  
*"An IIFE stands for Immediately Invoked Function Expression. It is written as `(function() { 'use strict'; ... })();`. It executes as soon as the file loads and creates a private lexical scope. This prevents variables like `AUCTION_LOTS` or `Formatters` from polluting the global `window` object or conflicting with variables in other scripts like `auth.js`."*

### Q12: What does `'use strict'` do?
**Spoken Answer:**  
*"Strict mode enforces stricter parsing and error handling in JavaScript. It prevents accidental global variables (like writing `x = 10` without `let` or `const`), throws errors for assignments that would otherwise fail silently, and prevents using reserved keywords."*

### Q13: What is the difference between `const`, `let`, and `var`?
**Spoken Answer:**  
*"`var` is function-scoped and subject to variable hoisting, which often causes bugs. `let` and `const` are block-scoped (confined to `{}` blocks like loops or conditionals). We use `const` by default for variables whose reference never changes (like DOM elements and data arrays), and `let` only when values must be reassigned (like active filter states or countdown seconds)."*

### Q14: How does `document.querySelector` differ from `document.getElementById`?
**Spoken Answer:**  
*"`getElementById` only takes an ID string and returns that single element. `querySelector` accepts any valid CSS selector string—such as `#my-id`, `.my-class`, or `[data-save]`—making it much more versatile for modern web development."*

### Q15: What is Event Delegation and where did you use it?
**Spoken Answer:**  
*"Event delegation is attaching a single event listener to a common parent element rather than attaching individual listeners to dozens of child elements, utilizing event bubbling. We use this principle in `Watchlist.bindButtons()` and modal dialogs to efficiently capture interactions without incurring memory leaks."*

### Q16: What do `event.preventDefault()` and `event.stopPropagation()` do?
**Spoken Answer:**  
*"`event.preventDefault()` stops the browser's default action, such as preventing a `<form>` submission from reloading the whole page or preventing an `<a>` tag from navigating immediately. `event.stopPropagation()` stops the event from bubbling up the DOM tree to parent elements, which we use on heart buttons so clicking the heart doesn't open the lot details page."*

### Q17: What are Template Literals and why are they useful?
**Spoken Answer:**  
*"Template literals are strings enclosed by backticks (`` ` ``) rather than quotes. They allow multi-line strings and string interpolation using `${expression}` syntax. We use them extensively in `createLotCardMarkup()` to generate clean, dynamic HTML cards without clunky string concatenation."*

### Q18: How does `Array.filter()` work in your explore page?
**Spoken Answer:**  
*"`Array.filter()` iterates through an array and returns a brand-new array containing only the elements that satisfy a boolean condition. In `renderExplore()`, it filters the lot catalog based on three criteria: matching the chosen category, matching the search query substring, and checking if the item is saved in the user's watchlist."*

### Q19: How does `Array.sort()` work in your price and urgency sorting?
**Spoken Answer:**  
*"`Array.sort()` takes a comparison function `(a, b)`. If the function returns a negative number, `a` is placed before `b`. For price ascending, we return `a.price - b.price`. For price descending, we return `b.price - a.price`. For closing soonest, we return `a.ends - b.ends`."*

### Q20: What are Custom Events and why did you use `vault:saved-change`?
**Spoken Answer:**  
*"A Custom Event allows us to create our own application-specific events using `new CustomEvent('vault:saved-change')` and dispatch them with `document.dispatchEvent()`. This implements a Publish-Subscribe (Pub/Sub) pattern: whenever a user saves or removes a lot, this event is published, and listening views update their UI automatically without tight coupling."*

---

## Category 3: Asynchronous JavaScript & APIs (Q21 – Q30)

### Q21: What is Asynchronous JavaScript?
**Spoken Answer:**  
*"JavaScript is single-threaded, meaning it can only execute one command at a time. Asynchronous programming allows operations that take time—such as fetching database records or loading 3D models—to run in the background without freezing the browser's main thread and UI."*

### Q22: What is a Promise in JavaScript?
**Spoken Answer:**  
*"A Promise is an object representing the eventual completion or failure of an asynchronous operation. It exists in one of three states: Pending, Fulfilled (resolved with a value), or Rejected (failed with an error)."*

### Q23: How do `async` and `await` work?
**Spoken Answer:**  
*"`async` and `await` are syntactic sugar built on top of Promises. Placing `async` before a function means it will always return a Promise. Inside an `async` function, the `await` keyword pauses execution until the Promise resolves, allowing us to write clean, linear asynchronous code that looks and behaves like synchronous code."*

### Q24: How does error handling work in asynchronous code?
**Spoken Answer:**  
*"We wrap asynchronous calls in `try...catch` blocks. If the `await`ed Promise rejects (for instance, due to a network failure or SQL syntax error), execution jumps directly to the `catch (error)` block, where we log a warning and fall back safely to our local demonstration archive."*

### Q25: What is `Promise.all` and where did you use it?
**Spoken Answer:**  
*"`Promise.all` takes an array of Promises and executes them concurrently in parallel, resolving only when all of them succeed. In `admin.js`, we use `Promise.all` to query total lots, active lots, and total bids simultaneously, cutting page load time by more than 60% compared to sequential queries."*

### Q26: What is the Fetch API?
**Spoken Answer:**  
*"The Fetch API is the modern browser-native interface for making HTTP network requests. The Supabase SDK uses Fetch under the hood to send HTTPS REST requests to PostgreSQL endpoints and parse JSON responses."*

### Q27: How does `setInterval()` work in your countdown timers?
**Spoken Answer:**  
*"`setInterval(callback, interval)` repeatedly executes a function every given number of milliseconds. In `renderLot()`, we run `setInterval(updateCountdown, 1000)` to decrement remaining seconds once every second and reformat the clock display to `HH:MM:SS`."*

### Q28: What is the difference between `setInterval` and `requestAnimationFrame`?
**Spoken Answer:**  
*"`setInterval` runs on a fixed timer regardless of screen refresh rates or whether the tab is focused, which can cause frame stutter. `requestAnimationFrame` syncs directly with the computer monitor's refresh rate (usually 60Hz or 120Hz) and automatically pauses when the user switches tabs, making it much more performant for smooth 3D animations and particle simulations."*

### Q29: What is `JSON.stringify()` and `JSON.parse()`?
**Spoken Answer:**  
*"`JSON.stringify()` serializes a JavaScript object or array into a standard JSON string so it can be saved in `localStorage` or transmitted over HTTP. `JSON.parse()` does the reverse: taking a JSON string and converting it back into a usable JavaScript object."*

### Q30: How does `URLSearchParams` work in your detail pages?
**Spoken Answer:**  
*"`URLSearchParams` is a built-in browser API that parses query string parameters from `window.location.search`. In `lot.html?lot=watch`, calling `new URLSearchParams(window.location.search).get('lot')` extracts the string `'watch'` so `CatalogueService` knows which item to look up."*

---

## Category 4: HTML5, CSS3 & Responsive Design (Q31 – Q40)

### Q31: What makes HTML5 "semantic"?
**Spoken Answer:**  
*"Semantic HTML means using elements that clearly describe their meaning to both browser and developer. Instead of generic `<div>` tags everywhere, we use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<figure>`, and `<footer>`. This improves SEO, makes code readable, and allows screen readers to navigate the page hierarchically."*

### Q32: What is the purpose of the `box-sizing: border-box` CSS rule?
**Spoken Answer:**  
*"By default in CSS (`content-box`), adding padding or borders expands an element's total width beyond what you set. With `box-sizing: border-box`, padding and borders are absorbed inside the specified width and height, preventing layout breakage and unwanted horizontal scrollbars."*

### Q33: What are CSS Custom Properties and how do you declare them?
**Spoken Answer:**  
*"CSS Custom Properties, commonly called CSS Variables, are declared inside the `:root` pseudo-class with a double-dash prefix, like `--paper: #f1efe8;`. They can be referenced anywhere using `var(--paper)`. This creates a centralized design token system where changing a primary brand color in one place updates the entire website immediately."*

### Q34: What does `clamp()` do in CSS?
**Spoken Answer:**  
*"`clamp(min, preferred, max)` sets a fluid value that scales dynamically with viewport size between defined minimum and maximum boundaries. For example, `font-size: clamp(38px, 6vw, 68px)` ensures our headlines never shrink below 38px on phones or exceed 68px on 4K desktop screens."*

### Q35: When do you choose CSS Grid versus Flexbox?
**Spoken Answer:**  
*"Flexbox is one-dimensional: it aligns items along a single axis (either row or column), making it ideal for navigation bars, buttons, and form controls. CSS Grid is two-dimensional: it handles rows and columns simultaneously, making it the perfect tool for catalog product grids and editorial split layouts."*

### Q36: What is Hardware Acceleration in CSS?
**Spoken Answer:**  
*"Hardware acceleration offloads visual rendering from the CPU to the Graphics Processing Unit (GPU). By using 3D transforms like `transform: translate3d(-50%, -50%, 0)` and `will-change: transform`, the browser places that element onto its own compositing layer, enabling buttery smooth 60fps animations without triggering expensive layout reflows."*

### Q37: What is `pointer-events: none` and why is it essential in your project?
**Spoken Answer:**  
*"`pointer-events: none` prevents an element from reacting to pointer events like clicks, hovers, or drags. It is essential for our Canvas 2D liquid mouse trail and firefly particle overlays: because the canvas sits fixed over the entire screen, setting `pointer-events: none` allows user clicks to pass right through to underlying HTML buttons and links."*

### Q38: What does `z-index` do and what is a Stacking Context?
**Spoken Answer:**  
*"`z-index` controls the stacking order of overlapping elements along the 3D Z-axis. A Stacking Context is a 3-dimensional conceptualization of HTML elements. We established a rigorous hierarchy: standard content sits below `100`, the sound jar sits at `10000`, the firefly canvas at `99990`, the liquid trail at `99998`, the cursor at `100001`, and the loading screen at `9999999`."*

### Q39: What are ARIA attributes and give two examples from your code?
**Spoken Answer:**  
*"ARIA stands for Accessible Rich Internet Applications. It provides semantic metadata to assistive technologies like screen readers. In our project:  
1. `aria-expanded="false"` on the mobile hamburger button indicates whether the dropdown drawer is open or closed.  
2. `aria-invalid="true"` on contact form inputs alerts visually impaired users that an entered field has a validation error."*

### Q40: What does the `defer` attribute do on `<script>` tags?
**Spoken Answer:**  
*"Without `defer`, the browser stops parsing HTML as soon as it hits a `<script>` tag until the script is downloaded and executed. The `defer` attribute instructs the browser to download scripts asynchronously in the background and execute them in exact sequential order only after HTML parsing is complete, preventing white-screen lag."*

---

## Category 5: Three.js & WebGL 3D Graphics (Q41 – Q48)

### Q41: What is WebGL and what is Three.js?
**Spoken Answer:**  
*"WebGL is a low-level JavaScript API for rendering high-performance interactive 2D and 3D computer graphics inside any compatible web browser without plugins. Three.js is a high-level JavaScript library that wraps the complex, mathematical WebGL shaders and buffers into intuitive objects like Scenes, Cameras, Lights, and Meshes."*

### Q42: What are the three core components required in any Three.js project?
**Spoken Answer:**  
*"Every Three.js project requires:  
1. A **Scene:** The 3D coordinate container where all 3D objects, geometries, and lights live.  
2. A **Camera:** The viewpoint through which the scene is observed (we use a `PerspectiveCamera` to mimic human eyesight).  
3. A **Renderer:** The WebGL engine (`THREE.WebGLRenderer`) that calculates the math and draws the final 2D pixels onto an HTML5 `<canvas>` element."*

### Q43: What is a GLTF/GLB file?
**Spoken Answer:**  
*"GLTF (Graphics Language Transmission Format) is the 'JPEG of 3D'. A `.glb` file is the binary version of glTF that bundles the 3D mesh geometry, textures, materials, and animations into a single compressed file optimized for fast web streaming."*

### Q44: How did you implement 3-point studio lighting in your showcase?
**Spoken Answer:**  
*"In `vault-3d-showcase.js`, I set up classic studio lighting: a warm Key Directional Light positioned diagonally above to cast soft luxury shadows; a cool Fill Light on the opposite side to soften dark crevices; and an Ambient Light to maintain base visibility across all facets of the artifact."*

### Q45: How does the floating sine-wave levitation work mathematically?
**Spoken Answer:**  
*"Inside the 60fps render loop, we calculate `model.position.y = Math.sin(elapsedTime * 1.5) * 0.08`. Because the trigonometric sine function smoothly oscillates between `-1` and `+1`, multiplying it by a small amplitude like `0.08` creates a gentle, weightless floating effect."*

### Q46: What is Linear Interpolation (LERP) and where did you use it?
**Spoken Answer:**  
*"LERP is a mathematical formula that smoothly transitions a value toward a target over time: `current += (target - current) * factor`. We use it in two places: in `vault-3d-showcase.js` to create subtle camera parallax following the mouse cursor, and in `cursor-loader.js` to give the outer cursor follower ring realistic physical inertia."*

### Q47: What does `OrbitControls` do in your 3D stage?
**Spoken Answer:**  
*"`OrbitControls` is an add-on script that listens to mouse drag, touch swipe, and wheel scroll events to smoothly orbit, rotate, and zoom the camera around the 3D target object while enforcing minimum and maximum distance constraints."*

### Q48: How do you handle window resizing in Three.js?
**Spoken Answer:**  
*"We listen to the window `resize` event. In the handler, we update the camera's aspect ratio (`camera.aspect = width / height`), call `camera.updateProjectionMatrix()` to recompute the perspective frustum, and resize the renderer using `renderer.setSize(width, height)`."*

---

## Category 6: Supabase & PostgreSQL Database (Q49 – Q58)

### Q49: What is Supabase?
**Spoken Answer:**  
*"Supabase is an open-source Firebase alternative built on enterprise-grade PostgreSQL. It provides an automated PostgREST API, real-time WebSocket subscriptions, built-in JWT authentication, and file storage on top of a relational database."*

### Q50: What is Row Level Security (RLS) in PostgreSQL?
**Spoken Answer:**  
*"Row Level Security is a database feature where PostgreSQL evaluates security policies on individual table rows for every incoming query. Instead of relying on an application server to filter data, the database itself enforces who can select, insert, update, or delete rows based on the user's authenticated JWT role."*

### Q51: Why is the Supabase `anon` key safe to expose in client-side JavaScript?
**Spoken Answer:**  
*"The `anon` key is a public identifier, not a secret master key. Because we have Row Level Security enabled on all tables, the `anon` key only grants permissions explicitly permitted by our RLS policies (e.g., public read access to published lots). Destructive operations like editing or deleting lots are blocked at the database engine level."*

### Q52: What is the purpose of PostgreSQL ENUM types?
**Spoken Answer:**  
*"An ENUM (Enumerated Type) is a static set of allowed string values. In our schema, `lot_status` is restricted to `'draft'`, `'scheduled'`, `'live'`, `'closed'`, `'passed'`, and `'withdrawn'`. This guarantees data integrity by making it impossible to insert invalid status strings."*

### Q53: What is the difference between `ON DELETE CASCADE` and `ON DELETE RESTRICT`?
**Spoken Answer:**  
*"`ON DELETE CASCADE` automatically deletes dependent child rows when the parent is deleted (e.g., deleting an auction lot deletes all its image URLs in `lot_images`). `ON DELETE RESTRICT` prevents the deletion of a parent row if dependent rows exist (e.g., blocking the deletion of an auction lot if bids have already been placed in the `bids` table)."*

### Q54: What was PostgreSQL Error `23503` and how did you resolve it in `admin.js`?
**Spoken Answer:**  
*"Error `23503` is a Foreign Key Violation. When an admin attempts to delete a lot that has active bids, PostgreSQL's `ON DELETE RESTRICT` constraint rejects the query. In `admin.js`, we catch this specific error and prompt the admin: 'This lot has recorded bids. Would you like to WITHDRAW it instead?' If confirmed, we update the lot status to `'withdrawn'` rather than crashing."*

### Q55: What was PostgreSQL Error `42501` and how did you resolve it?
**Spoken Answer:**  
*"Error `42501` is 'Permission Denied'. In PostgreSQL, a client needs two separate permission layers: table-level grants and RLS policies. Even if RLS allowed the query, the `authenticated` role lacked base table privileges. We resolved this in migration `20261119000000` by executing `GRANT SELECT, INSERT, UPDATE, DELETE ON auction_lots TO authenticated;`."*

### Q56: What is a `SECURITY DEFINER` function and why did it need hardening?
**Spoken Answer:**  
*"A `SECURITY DEFINER` function runs with the privileges of the user who created it (the database administrator) rather than the user calling it. If the function does not explicitly set its `search_path`, a malicious user could exploit search path injection to hijack the function. We hardened it by adding `SET search_path = public, pg_temp;`."*

### Q57: How does your application know if a logged-in user is an administrator?
**Spoken Answer:**  
*"We do not rely on client-side checks like `user.email === 'admin@vault.com'`. Instead, the frontend calls a server-side PostgreSQL function via `supabase.rpc('is_super_admin')`. This function securely checks the authenticated caller's UUID against the `user_profiles` table inside the database."*

### Q58: What is the Resilient Fallback mechanism in `CatalogueService`?
**Spoken Answer:**  
*"If the user runs the website offline or before connecting Supabase, `CatalogueService.getLots()` catches the network exception in a `try...catch` block and automatically populates the website using our local `SAMPLE_AUCTION_LOTS` array. This ensures zero downtime during grading or demonstrations."*

---

## Category 7: Scenarios, Edge Cases & Debugging (Q59 – Q65)

### Q59: What happens if a user disables JavaScript in their browser?
**Spoken Answer:**  
*"The HTML document structure, typography, and styling will still render cleanly thanks to our semantic HTML5 and CSS. However, dynamic interactive features like real-time filtering, the custom liquid cursor, 3D model rendering, and simulated bidding will not function."*

### Q60: How does your bidding engine handle decimal floating-point rounding errors?
**Spoken Answer:**  
*"In JavaScript, we store bid values as whole integers representing Rupees (e.g. `240000`). In the database, we use PostgreSQL's `NUMERIC(14,2)` type rather than `FLOAT`. This completely avoids IEEE 754 binary floating-point representation bugs."*

### Q61: What happens if two browser tabs are open with the watchlist?
**Spoken Answer:**  
*"Because `Watchlist` writes to `localStorage`, the browser automatically dispatches a native `storage` event across other open tabs of the same origin. Furthermore, inside the active tab, we dispatch our custom `vault:saved-change` event to keep all navigation badges and heart icons perfectly synchronized."*

### Q62: Why did you use `loading="lazy"` on image tags?
**Spoken Answer:**  
*"`loading="lazy"` is a native browser optimization that delays loading images outside the viewport until the user scrolls near them. This dramatically speeds up initial page load time, conserves bandwidth, and improves Google Lighthouse performance scores."*

### Q63: How does your code prevent memory leaks in the 3D showcase?
**Spoken Answer:**  
*"In `vault-3d-showcase.js`, we retain references to geometries, materials, and textures. When the showcase is destroyed or navigated away from, we call `geometry.dispose()`, `material.dispose()`, and `renderer.dispose()`, releasing the GPU VRAM back to the operating system."*

### Q64: What is the most challenging bug you encountered and how did you fix it?
**Spoken Answer:**  
*"The most challenging issue was PostgreSQL Foreign Key Restrict Error `23503` when deleting auction lots in the admin dashboard. Initially, deleting a lot failed silently when bids existed. By inspecting the PostgreSQL error code, I implemented an intelligent fallback dialog in `admin.js` that catches error `23503` and offers the administrator the safe option to 'Withdraw' the lot instead of deleting it, maintaining financial database integrity."*

### Q65: If you had another month to work on this project, what would you add?
**Spoken Answer:**  
*"I would implement three major enhancements:  
1. Replace simulated bidding with live WebSockets using Supabase Realtime Channels so multiple real users across the world see bids update instantaneously without page reloads.  
2. Integrate a production payment gateway like Stripe or Razorpay to handle real pre-authorization escrow holds.  
3. Add augmented reality (AR) model viewing using `<model-viewer>` so collectors can place auction lots in their living room using their mobile camera."*
