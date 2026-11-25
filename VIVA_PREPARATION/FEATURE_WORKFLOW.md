# THE VAULT — Feature Workflows & Technical Lifecycles

> **Prepared for:** B.Tech Computer Science First-Year Viva Examination  
> **Student:** Yash  
> **Topic:** Step-by-Step Execution Flows of Core Features

---

## Table of Workflows
1. [Workflow 1: Catalog Exploration & Real-Time Filtering](#workflow-1-catalog-exploration--real-time-filtering)
2. [Workflow 2: Persistent Watchlist Management (localStorage)](#workflow-2-persistent-watchlist-management-localstorage)
3. [Workflow 3: Simulated Auction Bidding & Validation Desk](#workflow-3-simulated-auction-bidding--validation-desk)
4. [Workflow 4: User Authentication (Supabase GoTrue JWT Flow)](#workflow-4-user-authentication-supabase-gotrue-jwt-flow)
5. [Workflow 5: Super-Admin Verification & Relational CRUD Operations](#workflow-5-super-admin-verification--relational-crud-operations)
6. [Workflow 6: 3D WebGL Rendering & Animation Loop (Three.js)](#workflow-6-3d-webgl-rendering--animation-loop-threejs)
7. [Workflow 7: Active Theory Sensory Layer & Scroll-Reactive Sound Jar](#workflow-7-active-theory-sensory-layer--scroll-reactive-sound-jar)

---

## Workflow 1: Catalog Exploration & Real-Time Filtering

```
[ User Action: Types in Search Bar / Clicks Filter Chip ]
                          │
                          ▼
             [ Event Listener Triggered ]
   - input event on #lot-search
   - click event on [data-filter] or #lot-sort
                          │
                          ▼
            [ renderList() Execution in app.js ]
                          │
                          ▼
               [ Step 1: Array.filter() ]
   - Checks Category Match: activeCategory === 'All' || lot.category === activeCategory
   - Checks Watchlist Match: !savedOnly || Watchlist.has(lot.key)
   - Checks Search Substring: lot.title.toLowerCase().includes(query)
                          │
                          ▼
                [ Step 2: Array.sort() ]
   - 'ending'   -> visibleLots.sort((a, b) => a.ends - b.ends)
   - 'bid-low'  -> visibleLots.sort((a, b) => a.price - b.price)
   - 'bid-high' -> visibleLots.sort((a, b) => b.price - a.price)
                          │
                          ▼
           [ Step 3: Array.map() -> Template Literals ]
   - Converts each lot object into an HTML string inside renderList()
                          │
                          ▼
         [ Step 4: DOM Injection & Re-binding ]
   - grid.innerHTML = visibleLots.map(...).join('')
   - Watchlist.bindButtons() attaches heart click listeners
   - Results counter updated: "SHOWING 04 SELECTED LOTS"
```

---

## Workflow 2: Persistent Watchlist Management (`localStorage`)

```
[ User clicks Heart Button (♡) on any Auction Card ]
                          │
                          ▼
          [ event.preventDefault() & event.stopPropagation() ]
  - Prevents navigating to the lot detail page
  - Prevents click event from bubbling up the DOM tree
                          │
                          ▼
              [ Watchlist.toggle(lotKey) ]
                          │
                          ▼
          [ Retrieve Existing Keys from localStorage ]
  - raw = localStorage.getItem('vault-saved-lots')
  - parsed = JSON.parse(raw || '[]')
                          │
                          ▼
         [ Conditional Array Mutation (Immutable) ]
  - If lotKey exists  -> current.filter(id => id !== lotKey)   (Remove)
  - If lotKey missing -> [...current, lotKey]                  (Add)
                          │
                          ▼
             [ Persist to localStorage ]
  - localStorage.setItem('vault-saved-lots', JSON.stringify(next))
                          │
                          ▼
            [ Update UI & Emit Custom Event ]
  - Watchlist.updateBadges() updates all .saved-count elements in the header
  - Button toggles class .saved and text ('♥' / '♡')
  - document.dispatchEvent(new CustomEvent('vault:saved-change'))
    (Notifies any other active views to re-filter immediately)
```

---

## Workflow 3: Simulated Auction Bidding & Validation Desk

```
[ User Enters Bid Amount in #bid-amount & Clicks #place-bid ]
                          │
                          ▼
             [ Read and Sanitize Input ]
  - enteredAmount = Number(bidInput.value)
                          │
                          ▼
         [ Validation Engine: desk.getValidationError() ]
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
   [ FAILS VALIDATION ]              [ PASSES VALIDATION ]
- Is not a finite positive number?   - enteredAmount >= currentPrice + increment
- Less than minimum bid?             - (enteredAmount - currentPrice) % increment === 0
- Not a multiple of ₹5,000?                        │
         │                                         ▼
         ▼                               [ Record the Bid ]
[ Display Error Banner ]              - currentPrice = enteredAmount
- #bid-feedback.textContent = error   - bidCount += 1
- #bid-feedback.className = 'error'   - setSessionBid(lotId, price, bidCount)
                                        (Writes to sessionStorage: 'vault-demo-bids')
                                                   │
                                                   ▼
                                         [ Update Live DOM ]
                                      - currentBidEl.textContent = '₹2,45,000'
                                      - bidCountEl.textContent = '08'
                                      - Prepend new row to #bid-history-list:
                                        "You (session bidder) · Just now"
                                      - Show success notice in #bid-feedback
```

---

## Workflow 4: User Authentication (Supabase GoTrue JWT Flow)

```
[ User enters Email & Password on auth.html and Clicks "Sign In" ]
                                  │
                                  ▼
                     [ Client-Side Validation ]
  - Regex test on email format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  - Password length check: password.length >= 6
                                  │
                                  ▼
                [ Supabase SDK Authentication Call ]
  - const { data, error } = await supabase.auth.signInWithPassword({
      email: enteredEmail,
      password: enteredPassword
    });
                                  │
                                  ▼
                    [ Supabase Cloud GoTrue API ]
  - Verifies user credentials against auth.users table
  - Hashes incoming password and compares with bcrypt hash
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
   [ Auth Error ]                                    [ Auth Success ]
- Invalid credentials                              - Returns Session Object containing:
- Rate limit exceeded                                - Access Token (JWT - 1 hr expiry)
         │                                           - Refresh Token
         ▼                                           - User Metadata (ID, email)
[ Display Red Error Alert ]                                │
- #auth-error.textContent = error.message                  ▼
                                            [ onAuthStateChange Listener in client ]
                                            - Stores tokens in browser storage
                                            - Updates site header (switches "Enter ↗"
                                              to user email and Sign Out button)
                                            - Redirects to index.html or admin.html
```

---

## Workflow 5: Super-Admin Verification & Relational CRUD Operations

```
[ User navigates to admin.html ]
               │
               ▼
   [ Step 1: Security Handshake ]
- AdminApp invokes auth.isSuperAdmin()
- Client executes PostgreSQL RPC function:
  supabase.rpc('is_super_admin')
               │
      ┌────────┴────────┐
      ▼                 ▼
[ RPC returns FALSE ] [ RPC returns TRUE ]
- Hide dashboard      - Reveal #admin-dashboard
- Display "Access     - Proceed to Step 2
  Denied" notice
               │
               ▼
   [ Step 2: Telemetry Gathering via Promise.all ]
- Promise.all([
    client.from('auction_lots').select('*', { count: 'exact', head: true }),
    client.from('auction_lots').select('*').eq('status', 'live'),
    client.from('auction_lots').select('current_bid')
  ])
- Updates live metric tiles on admin dashboard
               │
               ▼
   [ Step 3: Delete Lot with Foreign Key Protection ]
- Admin clicks "Delete" on an auction lot
- Executes: client.from('auction_lots').delete().eq('id', targetId)
               │
      ┌────────┴────────┐
      ▼                 ▼
[ SUCCESS (Code 204) ] [ POSTGRES ERROR 23503 (Foreign Key Constraint) ]
- Lot has no bids      - Active bids exist in the bids table referencing this lot
- Database deletes lot - Caught by try/catch in admin.js
- Table row removed    - Prompts user: "This lot has recorded bids.
                         Would you like to WITHDRAW it instead?"
                       - Updates lot status to 'withdrawn' safely!
```

---

## Workflow 6: 3D WebGL Rendering & Animation Loop (Three.js)

```
[ Page Loads -> initVault3DShowcase() in vault-3d-showcase.js ]
                               │
                               ▼
            [ Three.js Graphics Pipeline Setup ]
  1. Scene: Creates THREE.Scene()
  2. Camera: Creates THREE.PerspectiveCamera(42, aspect, 0.1, 100)
  3. Renderer: Creates THREE.WebGLRenderer with antialias and alpha
  4. Lights: Adds Key Directional Light, Ambient Light, and Studio Rim Light
                               │
                               ▼
             [ Asynchronous Asset Loading via GLTFLoader ]
  - loader.load('3d_model_the_vault.glb', (gltf) => { ... })
  - Computes model dimensions using THREE.Box3().setFromObject(model)
  - Scales model to fit studio stage perfectly
  - Hides loading spinner (.vault-3d-preloader)
                               │
                               ▼
        [ Animation Render Loop (requestAnimationFrame) ]
  - function animate() runs 60 times per second:
    1. Turntable Rotation: model.rotation.y += 0.005
    2. Harmonic Sine Levitation:
       model.position.y = Math.sin(clock.getElapsedTime() * 1.5) * 0.08
    3. Mouse Parallax LERP:
       camera.position.x += (targetX - camera.position.x) * 0.05
    4. renderer.render(scene, camera)
    5. requestAnimationFrame(animate)
```

---

## Workflow 7: Active Theory Sensory Layer & Scroll-Reactive Sound Jar

```
[ Sensory Engine in cursor-loader.js ]
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
[ Custom Dual     [ Ambient Bioluminescent  [ Interactive Floating
  Cursor Layer ]    Firefly Particle Canvas]   Sound Jar Pill ]
     │               │                         │
     │               │                         ├─► [ Scroll Direction Tracking ]
     │               │                         │   - window.scrollY > lastScrollY:
     │               │                         │     Adds .is-scrolled-hidden
     │               │                         │     (Glides upward off-screen)
     │               │                         │   - window.scrollY < lastScrollY:
     │               │                         │     Removes .is-scrolled-hidden
     │               │                         │     (Glides smoothly back down)
     │               │                         │
     │               │                         └─► [ Click Interaction ]
     │               │                             - Toggles audio.play() / pause()
     │               │                             - Animates SVG equalizer bars
     │               │                             - Emits glowing embers inside jar
     │               │
     │               └─► [ Particle Mechanics ]
     │                   - Particles emerge from subtle top gathering point
     │                   - Drift downwards with organic sine-wave horizontal flutter
     │                   - Pulse bioluminescent core using harmonic opacity cycles
     │                   - Re-spawn at upper gathering point for infinite continuity
     │
     └─► [ Dual Pointer Physics ]
         - Dot: Follows mouse position instantaneously (0ms latency)
         - Ring: Follows with Linear Interpolation (LERP factor 0.18)
         - Filament Trail: Quadratic Bézier curves connect pointer history
```
