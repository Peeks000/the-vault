# THE VAULT — Technical Glossary & Code Reference Guide

> **Prepared for:** B.Tech Computer Science First-Year Viva Examination  
> **Student:** Yash  
> **Topic:** 55 Core Technical Terms with Project Code References

---

## 1. Programming & Software Architecture

### 1. IIFE (Immediately Invoked Function Expression)
- **Definition:** A JavaScript function that runs as soon as it is defined. It creates an isolated scope, preventing variable leakage into the global environment.
- **Project Reference:** `app.js` (Line 2), `cursor-loader.js` (Line 2).

### 2. Closure
- **Definition:** A feature in JavaScript where an inner function retains access to its outer enclosing function's variables even after the outer function has finished executing.
- **Project Reference:** `app.js` (`createBidDesk()` retains access to private `currentPrice` and `bidCount`).

### 3. Factory Function
- **Definition:** Any function that is not a class or constructor that returns a new object instance without using the `new` keyword.
- **Project Reference:** `app.js` (`createBidDesk()`).

### 4. Single-Page Application (SPA)
- **Definition:** A web application that interacts with the user by dynamically rewriting the current web page rather than loading entire new pages from a server.
- **Project Reference:** `auth.html` & `auth.js` (smooth switching between Sign In, Sign Up, and Password Reset modes).

### 5. Separation of Concerns (SoC)
- **Definition:** A design principle for separating a computer program into distinct sections, such that each section addresses a separate concern (e.g., HTML for structure, CSS for styling, JS for logic).
- **Project Reference:** `Formatters` object in `app.js` handles data presentation separately from data retrieval in `CatalogueService`.

### 6. Pub/Sub (Publish-Subscribe Pattern)
- **Definition:** A messaging pattern where senders of messages (publishers) do not send messages directly to specific receivers (subscribers), but instead broadcast events.
- **Project Reference:** `app.js` (`document.dispatchEvent(new CustomEvent('vault:saved-change'))`).

### 7. Immutability
- **Definition:** An object or data structure whose state cannot be modified after it is created.
- **Project Reference:** `app.js` (`window.VaultApp = Object.freeze({...})`), `supabase-config.js` (`Object.freeze(VAULT_SUPABASE_CONFIG)`).

### 8. Strict Mode (`'use strict'`)
- **Definition:** A JavaScript directive that opts into a restricted variant of JavaScript, eliminating silent errors and preventing undeclared variables.
- **Project Reference:** Top of `app.js`, `auth.js`, `admin.js`, and `vault-3d-showcase.js`.

---

## 2. JavaScript Language Features

### 9. Template Literals
- **Definition:** String literals allowing embedded expressions and multi-line formatting enclosed by backticks (`` ` ``) and `${}` interpolation.
- **Project Reference:** `renderList()` in `app.js` (Line 530).

### 10. Destructuring Assignment
- **Definition:** A syntax that unpacks values from arrays or properties from objects into distinct variables in a single expression.
- **Project Reference:** `const { data, error } = await auth.client...` in `CatalogueService.getLots()`.

### 11. Spread Operator (`...`)
- **Definition:** Expands an iterable (like an array or object) into individual elements.
- **Project Reference:** `Watchlist.toggle()` in `app.js` (`[...current, lotKey]`).

### 12. Optional Chaining (`?.`)
- **Definition:** Accesses an object's property or calls a function safely without causing an error if the reference is `null` or `undefined`.
- **Project Reference:** `app.js` (`images[0]?.image_url`, `searchInput?.addEventListener(...)`).

### 13. `Array.prototype.filter()`
- **Definition:** Creates a shallow copy of an array filtered down to just the elements that pass the test implemented by the provided callback function.
- **Project Reference:** `renderList()` in `app.js` (filtering lots by category, search text, and watchlist).

### 14. `Array.prototype.map()`
- **Definition:** Creates a new array populated with the results of calling a provided function on every element in the calling array.
- **Project Reference:** `renderList()` in `app.js` (mapping lot objects to HTML strings).

### 15. `Array.prototype.sort()`
- **Definition:** Sorts the elements of an array in place and returns the sorted array using a comparator function `(a, b)`.
- **Project Reference:** `renderList()` in `app.js` (sorting by price or closing timestamp).

### 16. `Array.prototype.slice()`
- **Definition:** Returns a shallow copy of a portion of an array selected from `start` to `end` without modifying the original array.
- **Project Reference:** `renderHome()` in `app.js` (`AUCTION_LOTS.slice(1, 4)` to get the top 3 preview lots).

### 17. Promises
- **Definition:** Objects representing the eventual completion (or failure) of an asynchronous operation and its resulting value.
- **Project Reference:** `CatalogueService.getLots()` in `app.js`.

### 18. `async` / `await`
- **Definition:** Syntactic features allowing asynchronous, Promise-based behavior to be written in a cleaner, non-blocking synchronous style.
- **Project Reference:** `bootstrap()` in `app.js`, `saveLot()` in `admin.js`.

### 19. `try...catch` Block
- **Definition:** Statements that mark a block of code to try, and specify a response should an exception or runtime error be thrown.
- **Project Reference:** `Watchlist.getAll()` in `app.js`, `checkSuperAdminAccess()` in `admin.js`.

### 20. `Promise.all()`
- **Definition:** Method that takes an iterable of promises and returns a single Promise that resolves when all input promises have resolved.
- **Project Reference:** `loadMetrics()` in `admin.js`.

---

## 3. DOM & Browser APIs

### 21. DOM (Document Object Model)
- **Definition:** The programmatic tree-like representation of an HTML document created by the browser that JavaScript can manipulate.
- **Project Reference:** Throughout `app.js`, `auth.js`, `admin.js`.

### 22. `document.querySelector()`
- **Definition:** Returns the first `Element` within the document that matches the specified CSS selector string.
- **Project Reference:** `document.querySelector('#auction-grid')` in `app.js`.

### 23. `document.querySelectorAll()`
- **Definition:** Returns a static `NodeList` representing all elements matching the specified CSS selector string.
- **Project Reference:** `document.querySelectorAll('[data-save]')` in `app.js`.

### 24. `addEventListener()`
- **Definition:** Sets up an event handler function to be called whenever a specified event (like `click`, `input`, or `scroll`) is delivered to the target element.
- **Project Reference:** `searchInput.addEventListener('input', ...)` in `app.js`.

### 25. `event.preventDefault()`
- **Definition:** Cancels the default action that belongs to the event (e.g., stopping form submit reload or link navigation).
- **Project Reference:** `form.addEventListener('submit', event => event.preventDefault())` in `contact.html`.

### 26. `event.stopPropagation()`
- **Definition:** Prevents the further propagation (bubbling) of the current event in the capturing and bubbling phases.
- **Project Reference:** Heart save buttons in `app.js` (Line 355).

### 27. `localStorage`
- **Definition:** Web storage API allowing key-value pairs to be saved persistently across browser restarts with no expiration date.
- **Project Reference:** `SAVED_STORAGE_KEY = 'vault-saved-lots'` in `app.js`.

### 28. `sessionStorage`
- **Definition:** Web storage API that maintains a separate storage area for each given origin that's available for the duration of the page session (as long as the tab is open).
- **Project Reference:** `SESSION_BIDS_STORAGE_KEY = 'vault-demo-bids'` in `app.js`.

### 29. `URLSearchParams`
- **Definition:** Utility interface providing helper methods to work with the query string of a URL.
- **Project Reference:** `renderLot()` in `app.js` (`new URLSearchParams(window.location.search).get('lot')`).

### 30. `requestAnimationFrame`
- **Definition:** Tells the browser that you wish to perform an animation and requests that the browser call a specified function to update an animation right before the next repaint.
- **Project Reference:** `animate()` in `vault-3d-showcase.js` and `cursor-loader.js`.

### 31. `setInterval()`
- **Definition:** Calls a function repeatedly, with a fixed time delay between each call.
- **Project Reference:** `updateCountdown()` in `renderLot()` in `app.js` (ticking every 1,000ms).

### 32. `dataset` (Data Attributes)
- **Definition:** Provides read/write access to custom data attributes (`data-*`) on elements in HTML.
- **Project Reference:** `button.dataset.save` and `button.dataset.filter` in `app.js`.

### 33. `defer` Attribute
- **Definition:** A boolean attribute on `<script>` tags telling the browser to run the script only after the HTML document has been fully parsed.
- **Project Reference:** `<script defer src="app.js"></script>` in all HTML files.

---

## 4. Modern CSS & Layout Systems

### 34. CSS Custom Properties (`:root`)
- **Definition:** Entities defined by CSS authors that contain specific values to be reused throughout a document using the `var()` functional notation.
- **Project Reference:** `styles.css` (Line 3: `--paper`, `--ink`, `--brass`).

### 35. `box-sizing: border-box`
- **Definition:** Tells the browser to account for any border and padding in the values you specify for an element's width and height.
- **Project Reference:** `styles.css` (Line 17).

### 36. `clamp()`
- **Definition:** Clamps a value between an upper and lower bound, scaling fluidly across viewport widths.
- **Project Reference:** `styles.css` (`--gutter: clamp(22px, 6.1vw, 96px)`).

### 37. CSS Grid
- **Definition:** A two-dimensional layout system for the web that handles rows and columns simultaneously.
- **Project Reference:** `styles.css` (`.vault-hero-grid`, `.lot-detail-grid`, `.admin-metrics-grid`).

### 38. Flexbox
- **Definition:** A one-dimensional layout model providing space distribution and powerful alignment capabilities along an axis.
- **Project Reference:** `styles.css` (`.site-header`, `.main-nav`, `.announcement`).

### 39. `z-index` & Stacking Context
- **Definition:** Specifies the stack order of an element along the Z-axis.
- **Project Reference:** `cursor-loader.css` (`z-index: 100001` for cursor dot, `z-index: 9999999` for preloader).

### 40. Hardware Acceleration (`will-change`, `translate3d`)
- **Definition:** Delegating rendering tasks from the CPU to the graphics processing unit (GPU) for high-performance animation.
- **Project Reference:** `cursor-loader.css` (`transform: translate3d(-50%, -50%, 0); will-change: transform;`).

### 41. `pointer-events: none`
- **Definition:** Specifies that an element cannot be the target of pointer events, allowing clicks to pass through to elements underneath.
- **Project Reference:** `cursor-loader.css` (`.vault-firefly-canvas`, `.vault-trail-canvas`).

### 42. `cubic-bezier()`
- **Definition:** Defines a cubic Bézier transition timing curve for non-linear acceleration and deceleration.
- **Project Reference:** `cursor-loader.css` (`cubic-bezier(0.16, 1, 0.3, 1)`).

### 43. ARIA (Accessible Rich Internet Applications)
- **Definition:** A set of attributes that define ways to make web content and applications more accessible to people with disabilities.
- **Project Reference:** `aria-expanded` in `index.html`, `aria-invalid` in `contact.html`.

---

## 5. 3D Graphics & WebGL (Three.js)

### 44. WebGL (Web Graphics Library)
- **Definition:** A JavaScript API for rendering interactive 3D and 2D graphics within any compatible web browser without using plug-ins.
- **Project Reference:** Canvas rendering in `vault-3d-showcase.js`.

### 45. Three.js
- **Definition:** An open-source, cross-browser JavaScript library and API used to create and display animated 3D computer graphics in a web browser using WebGL.
- **Project Reference:** `vault-3d-showcase.js` and `vendor/three.min.js`.

### 46. PerspectiveCamera
- **Definition:** A camera projection mode designed to mimic the way the human eye sees, where objects farther away appear smaller.
- **Project Reference:** `new THREE.PerspectiveCamera(42, aspect, 0.1, 100)` in `vault-3d-showcase.js`.

### 47. GLTF / GLB
- **Definition:** GL Transmission Format; an open interoperable 3D asset file format. `.glb` is the binary version containing textures, mesh, and materials.
- **Project Reference:** `3d_model_the_vault.glb`.

### 48. LERP (Linear Interpolation)
- **Definition:** A mathematical formula that calculates intermediate values between two points, creating smooth transitions.
- **Project Reference:** Camera mouse parallax in `vault-3d-showcase.js`, cursor ring trailing in `cursor-loader.js`.

### 49. OrbitControls
- **Definition:** A Three.js controller allowing the camera to orbit around a 3D target using mouse drag or touch swipe.
- **Project Reference:** `vendor/OrbitControls.js`.

---

## 6. Database & Backend Security

### 50. Relational Database (RDBMS)
- **Definition:** A database that stores data in structured tables related to each other based on mathematical relations.
- **Project Reference:** PostgreSQL 15 via Supabase.

### 51. UUID (Universally Unique Identifier)
- **Definition:** A 128-bit label used for information in computer systems that provides mathematical uniqueness across databases without coordination.
- **Project Reference:** `auction_lots.id`, `lot_images.id`.

### 52. Row Level Security (RLS)
- **Definition:** A security feature in PostgreSQL where database access policies evaluate conditions row-by-row on incoming queries.
- **Project Reference:** `supabase/migrations/20261114000000_initial_schema.sql`.

### 53. Foreign Key Constraints (`CASCADE` vs `RESTRICT`)
- **Definition:** Rules enforcing referential integrity between tables. `CASCADE` deletes child rows automatically; `RESTRICT` prevents parent deletion if children exist.
- **Project Reference:** `lot_images` (`CASCADE`), `bids` (`RESTRICT`).

### 54. RPC (Remote Procedure Call)
- **Definition:** An execution protocol where a client can execute a stored procedure or function running on a remote server.
- **Project Reference:** `client.rpc('is_super_admin')` in `supabase-client.js`.

### 55. Search Path Injection Hardening
- **Definition:** Restricting PostgreSQL function execution paths (`SET search_path = public, pg_temp`) to prevent malicious users from hijacking elevated privileges.
- **Project Reference:** `supabase/migrations/20261114010000_harden_security_definer_functions.sql`.
