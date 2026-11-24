/**
 * =============================================================================
 * THE VAULT — Client Application Controller (app.js)
 * =============================================================================
 * 
 * WHAT THIS FILE DOES:
 * --------------------
 * This is the central JavaScript engine of "THE VAULT" website. It acts as the
 * controller for the entire front-end user experience, managing:
 *   1. Mock Data Store (Static fallback archive of auction lots and journal articles)
 *   2. Utility Formatters (Indian Rupee currency, HH:MM:SS countdown clock, status labels)
 *   3. Watchlist Manager (Persistent saved items using browser localStorage)
 *   4. Simulated Bidding Engine (Session-persisted bidding desk using sessionStorage)
 *   5. Catalogue Service (Asynchronous data-fetching from Supabase with graceful fallback)
 *   6. Explore Page Controller (Dynamic multi-facet filtering, searching, and sorting)
 *   7. Lot Details Page Controller (Image gallery, modal lightbox, dynamic bid placement)
 *   8. Homepage View Controller (Featured lot showcase and live auction grid)
 *   9. Arena View Controller (Real-time auction room floor simulation and signals)
 *  10. Journal & Article Controllers (Editorial stories, category filters, reading times)
 *  11. Contact Form Controller (Client-side validation, regex email check, accessibility)
 *  12. Global Interactions & Bootstrap (Mobile responsive drawer, smooth scrolling)
 * 
 * VIVA CONCEPT HIGHLIGHTS:
 * ------------------------
 * - Architecture: Single-Page Application (SPA) style controllers organized inside an IIFE.
 * - Storage: Demonstrates difference between localStorage (permanent) and sessionStorage (temporary).
 * - DOM Manipulation: Extensive use of querySelector, createElement, template literals, and event delegation.
 * - Asynchronous JavaScript: Async/await, Promises, and error boundaries for resilient API fetching.
 * - Design Pattern: Module Pattern & Factory Functions (e.g., createBidDesk).
 */

(function () {
  'use strict';
  /**
   * WHAT IS AN IIFE?
   * -----------------
   * Immediately Invoked Function Expression: (function () { ... })();
   * 1. The function is defined and executed immediately when the script loads.
   * 2. Variable Scope: Any variable declared with `const` or `let` inside this function
   *    is private to this file. It prevents polluting the global `window` object or
   *    causing naming conflicts with other scripts (like auth.js or Three.js).
   * 
   * WHAT DOES 'use strict' DO?
   * --------------------------
   * Strict Mode prevents common JavaScript bugs:
   * 1. Disallows undeclared variables (prevents accidentally creating global variables like `x = 5`).
   * 2. Throws errors for silent failures (e.g., writing to read-only properties).
   * 3. Prevents using reserved keywords as variable names.
   */

  // ---------------------------------------------------------------------------
  // 1. Data Store (Static Demonstration Fallback Archive)
  // ---------------------------------------------------------------------------
  /**
   * WHY WE NEED THIS STATIC ARRAY:
   * ------------------------------
   * In a production environment, data comes from a cloud database (like Supabase PostgreSQL).
   * However, if the user is running the project offline, during a network drop, or before
   * running the database migration scripts, this static array ensures the website NEVER
   * crashes or displays an ugly blank screen.
   * 
   * Each object represents an auction lot with properties matching the database schema:
   * - id: Unique string slug used in URL query parameters (e.g., lot.html?lot=watch).
   * - key: Unique identifier used for the user's saved items watchlist in localStorage.
   * - number: Traditional auction catalog lot number (e.g., '024').
   * - category & period: Classification fields used for filtering.
   * - price: Numerical integer representing the current highest bid in Indian Rupees (₹).
   * - bids: Count of bids placed so far.
   * - estimate: Human-readable estimated price range.
   * - ends: Seconds remaining until the lot closes (used by countdown timers).
   * - image & story: High-resolution Unsplash asset URL and curatorial editorial description.
   */
  const AUCTION_LOTS = [
    {
      id: 'watch',
      key: 'lot-watch',
      number: '024',
      category: 'Timepieces',
      period: '1960s–70s',
      title: 'The Heritage Chronograph',
      subtitle: 'A considered study in mechanical craft and enduring design.',
      price: 240000,
      bids: 7,
      estimate: '₹2,00,000 – ₹3,00,000',
      ends: 9340,
      image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=85',
      story: 'There is a particular pleasure in a well-made mechanical object. The measured sweep of its hands, the tactility of its details and the quiet engineering beneath the dial make this a piece to be appreciated slowly.'
    },
    {
      id: 'art',
      key: 'lot-art',
      number: '031',
      category: 'Fine Art',
      period: 'Contemporary',
      title: 'A Study in Stillness',
      subtitle: 'A quiet composition that rewards a longer look.',
      price: 85000,
      bids: 4,
      estimate: '₹65,000 – ₹1,10,000',
      ends: 65520,
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=85',
      story: 'An artwork changes with the room around it and the attention it receives. This demonstration lot is presented as a study in colour, composition and the personal connection between an object and its collector.'
    },
    {
      id: 'car',
      key: 'lot-car',
      number: '042',
      category: 'Automotive',
      period: 'Classic',
      title: 'The Open-Road Icon',
      subtitle: 'A sculptural expression of performance and proportion.',
      price: 1850000,
      bids: 12,
      estimate: '₹16,00,000 – ₹22,00,000',
      ends: 86400,
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85',
      story: 'The appeal of a classic automobile lives in its stance, its surfaces and the feeling of a different era of design. This sample listing shows how an auction lot could present a vehicle to an informed audience.'
    },
    {
      id: 'jewel',
      key: 'lot-jewel',
      number: '056',
      category: 'Jewellery',
      period: 'Modern heirloom',
      title: 'The Quiet Brilliance',
      subtitle: 'A study in proportion, detail and considered making.',
      price: 125000,
      bids: 5,
      estimate: '₹1,00,000 – ₹1,60,000',
      ends: 129600,
      image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1000&q=85',
      story: 'Fine jewellery is often appreciated in the details: the finish, the balance and the way it catches light. This fictional lot demonstrates the editorial format for describing a piece without making unsupported claims.'
    },
    {
      id: 'camera',
      key: 'lot-camera',
      number: '063',
      category: 'Timepieces',
      period: 'Mid-century',
      title: 'The Photographer’s Companion',
      subtitle: 'An enduring instrument for seeing the world differently.',
      price: 42000,
      bids: 3,
      estimate: '₹35,00,000 – ₹60,000',
      ends: 172800,
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85',
      story: 'Mechanical cameras are a reminder that the process of making an image can be as satisfying as the image itself. This demonstration entry would be accompanied by verified technical details in a production auction.'
    },
    {
      id: 'sculpture',
      key: 'lot-sculpture',
      number: '071',
      category: 'Fine Art',
      period: 'Contemporary',
      title: 'Form in Conversation',
      subtitle: 'An expressive object for a thoughtful space.',
      price: 67000,
      bids: 6,
      estimate: '₹50,000 – ₹90,000',
      ends: 216000,
      image: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1000&q=85',
      story: 'Sculpture asks us to move around an object and notice how its form changes with perspective. This sample description demonstrates the kind of context that could accompany a verified artwork.'
    },
    {
      id: 'car-detail',
      key: 'lot-car-detail',
      number: '084',
      category: 'Automotive',
      period: 'Modern classic',
      title: 'The Grand Touring Line',
      subtitle: 'Long-distance elegance with a distinctly purposeful shape.',
      price: 920000,
      bids: 9,
      estimate: '₹8,00,000 – ₹12,00,000',
      ends: 259200,
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=85',
      story: 'The grand touring tradition is built around comfort, performance and design that ages with grace. This illustrative entry would require a full inspection and documentation before a real auction.'
    },
    {
      id: 'jewel-detail',
      key: 'lot-jewel-detail',
      number: '092',
      category: 'Jewellery',
      period: 'Artisan collection',
      title: 'A Line of Light',
      subtitle: 'A restrained piece with an unmistakable presence.',
      price: 98000,
      bids: 2,
      estimate: '₹80,000 – ₹1,25,000',
      ends: 302400,
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85',
      story: 'A well-considered piece of jewellery balances material, proportion and wearability. This fictional listing shows how a product story can be useful without implying a verified maker or gemstone specification.'
    }
  ];

  /**
   * JOURNAL ARTICLES DATA STORE:
   * ----------------------------
   * Static editorial stories for the Journal view (journal.html) and detailed
   * reading view (article.html). Each article contains a nested `body` array
   * of section headings and paragraphs, plus an array of `related` article IDs.
   */
  const JOURNAL_ARTICLES = [
    {
      id: 'mechanical-watchmaking',
      category: 'Watches',
      title: 'The Art of Mechanical Watchmaking',
      subtitle: 'Why the measured movement of a mechanical watch continues to fascinate collectors.',
      image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1400&q=88',
      readingTime: '6 min read',
      caption: 'A mechanical object, considered in close detail.',
      related: ['collector-eye', 'jewellery-material'],
      body: [
        {
          heading: 'A slower measure',
          paragraphs: [
            'A mechanical watch is a small argument for patience. Beneath the dial, a sequence of springs, wheels and levers turns the passing of time into something visible and tactile. Its appeal is not simply precision; it is the feeling that precision has been made by hand and made legible.',
            'For collectors, that intimacy matters. The object asks to be wound, adjusted and looked at. It does not disappear into a phone or a notification. It remains present on the wrist, carrying a little of its making with it.'
          ]
        },
        {
          heading: 'The pleasure of the mechanism',
          paragraphs: [
            'The most compelling details are often the least immediate: the resistance of a crown, the balance of a case, the way a dial holds its typography. These are qualities discovered gradually, rather than announced at first glance.',
            'That gradual discovery is what gives a watch a life beyond its function. The object becomes a record of choices about proportion, material and movement, each one contributing to a character that can be appreciated long after the hour has passed.'
          ]
        },
        {
          heading: 'What endures',
          paragraphs: [
            'Mechanical watchmaking continues to fascinate because it joins engineering with ritual. It is an instrument, but also an object of attention — a reminder that usefulness and beauty can occupy the same small space.'
          ]
        }
      ]
    },
    {
      id: 'fine-art-language',
      category: 'Art',
      title: 'Understanding the Language of Fine Art',
      subtitle: 'A closer look at how colour, scale, surface and silence shape the way a work speaks.',
      image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1400&q=88',
      readingTime: '5 min read',
      caption: 'A work begins to speak through the attention brought to it.',
      related: ['collector-eye', 'classic-automobiles'],
      body: [
        {
          heading: 'Before the subject',
          paragraphs: [
            'A painting can begin before its subject becomes clear. Colour establishes a temperature, a mark sets a rhythm and the edge of the canvas decides how much of the world is allowed in. Looking carefully means noticing these decisions before asking what the work is about.',
            'This is one reason the same artwork can change from room to room. Light, distance and the pace of the viewer all become part of the encounter.'
          ]
        },
        {
          heading: 'The vocabulary of looking',
          paragraphs: [
            'Scale can make a work intimate or architectural. Surface can draw us close or hold us at a distance. A restrained palette might create quiet, while a single interruption can make the whole composition feel newly alert.',
            'None of these elements exists alone. They form a language through relationships — between a dark passage and a pale one, a dense mark and an open field, a deliberate silence and a moment of emphasis.'
          ]
        },
        {
          heading: 'Making space for a response',
          paragraphs: [
            'There is no requirement to solve a work immediately. The most rewarding looking often leaves room for uncertainty. Fine art gives attention somewhere to settle, then changes what that attention can see.'
          ]
        }
      ]
    },
    {
      id: 'collector-eye',
      category: 'Collecting',
      title: 'Developing a Collector’s Eye',
      subtitle: 'How patience, restraint and curiosity help a collection find its shape over time.',
      image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1400&q=88',
      readingTime: '7 min read',
      caption: 'A collection begins with looking, but grows through restraint.',
      related: ['mechanical-watchmaking', 'fine-art-language'],
      body: [
        {
          heading: 'The first impulse',
          paragraphs: [
            'Most collections begin with attraction rather than plan. An object catches the eye, demands curiosity and finds a place in the house. In the early stages, that responsiveness is essential — it teaches a collector what they notice and what leaves them cold.',
            'Over time, however, the questions become more demanding: what belongs together, what creates contrast and what simply adds noise.'
          ]
        },
        {
          heading: 'Learning what to leave behind',
          paragraphs: [
            'The discipline of collecting is as much about saying no as it is about acquiring. A strong collection is defined by its boundaries: the decisions that exclude an object even when it is attractive, because it does not speak to the rest of the room.',
            'That discipline takes time to develop. It requires living with things, looking at them repeatedly and noticing which objects retain their interest once novelty fades.'
          ]
        },
        {
          heading: 'The dialogue between objects',
          paragraphs: [
            'A collection becomes more than the sum of its parts when the objects begin to comment on one another. A mid-century chair alongside a classical torso, a contemporary painting opposite a vintage timepiece — these juxtapositions create conversations that single objects cannot produce on their own.'
          ]
        }
      ]
    },
    {
      id: 'classic-automobiles',
      category: 'Automotive',
      title: 'Proportion and Presence: The Classic Automobile',
      subtitle: 'Why the silhouettes of mid-century motoring retain their hold on our imagination.',
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=88',
      readingTime: '6 min read',
      caption: 'The sculptural qualities of vintage automotive design.',
      related: ['mechanical-watchmaking', 'collector-eye'],
      body: [
        {
          heading: 'Sculpture before speed',
          paragraphs: [
            'Before wind tunnels and regulatory constraints shaped the automotive landscape, car design was fundamentally an exercise in sculpture. Coachbuilders worked by eye, bending aluminium and steel over wooden bucks to produce forms that were expressive before they were functional.',
            'The cars that emerged from that period have a character that modern manufacturing rarely replicates. Their lines carry the signature of human decisions made in three dimensions.'
          ]
        },
        {
          heading: 'The interior as room',
          paragraphs: [
            'To sit in a classic grand tourer is to enter a different relationship with the road. The instruments are analogue dials behind glass, the switches are toggle and rotary, and the materials are leather, wool and wood. It feels less like an interface and more like a furnished room moving through space.'
          ]
        },
        {
          heading: 'Preservation as stewardship',
          paragraphs: [
            'Owning a classic automobile is an exercise in stewardship. These machines require mechanical empathy — an understanding of cold starts, oil pressure and the subtle sounds that signal a need for attention. The reward is a visceral connection to a bygone era of design.'
          ]
        }
      ]
    },
    {
      id: 'jewellery-material',
      category: 'Jewellery',
      title: 'Material and Making: The Narrative of Fine Jewellery',
      subtitle: 'From geological origins to bench craft, how jewellery carries stories across generations.',
      image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=88',
      readingTime: '5 min read',
      caption: 'Light, material and the quiet art of the bench jeweller.',
      related: ['collector-eye', 'fine-art-language'],
      body: [
        {
          heading: 'Deep time on the finger',
          paragraphs: [
            'A gemstone is a fragment of geological history made wearable. Formed millions of years ago under extreme heat and pressure, its arrival at the jeweller’s bench is the culmination of an immense and improbable journey.',
            'When an artisan sets that stone into precious metal, they are bridging the timescale of the earth with the human timescale of memory, celebration and inheritance.'
          ]
        },
        {
          heading: 'The touch of the maker',
          paragraphs: [
            'In fine jewellery, the finest craft is often that which leaves the least trace. A setting that holds a stone securely while allowing light to enter from every angle requires extraordinary precision. The weight of the metal, the smooth articulation of links, the balance of a clasp — these tactile qualities reveal the hand of a master.'
          ]
        },
        {
          heading: 'Heirloom value',
          paragraphs: [
            'Jewellery is among the most durable of human artefacts. Long after textiles have frayed and paintings have dimmed, gold and gems endure. A piece acquired today has the potential to carry its story into centuries yet to come.'
          ]
        }
      ]
    }
  ];

  // ---------------------------------------------------------------------------
  // 2. Formatters & Core Helpers
  // ---------------------------------------------------------------------------
  /**
   * WHAT THE FORMATTERS OBJECT DOES:
   * --------------------------------
   * This object centralizes all data presentation logic (converting raw numbers
   * into clean, readable strings formatted for Indian audiences).
   * 
   * VIVA CONCEPT: Separation of Concerns (Presentation vs Business Logic).
   * We store pure numbers in variables (e.g. 240000), but we format them only
   * when rendering into the HTML DOM.
   */
  const Formatters = {
    /**
     * currency(value)
     * ----------------
     * Formats numerical amounts into Indian Rupee currency representations (e.g. ₹2,40,000).
     * 
     * HOW IT WORKS:
     * - `Number(value)`: Casts the input to a JavaScript number.
     * - `.toLocaleString('en-IN')`: Built-in browser Internationalization API (Intl).
     *   In the Indian numbering system, commas follow the 3, 2, 2 pattern
     *   (Hundreds, Thousands, Lakhs, Crores) rather than international 3, 3, 3.
     */
    currency(value) {
      return '₹' + Number(value).toLocaleString('en-IN');
    },

    /**
     * clock(totalSeconds)
     * --------------------
     * Converts seconds into a zero-padded HH:MM:SS digital countdown string (e.g. 02:35:40).
     * 
     * HOW THE MATH WORKS:
     * 1. `clamped`: Prevents negative seconds if a countdown expires.
     * 2. `hours`: Total seconds divided by 3600 (number of seconds in an hour), rounded down.
     * 3. `minutes`: Remainder of hours (`clamped % 3600`), divided by 60.
     * 4. `seconds`: Remainder after dividing by 60 (`clamped % 60`).
     * 5. `.padStart(2, '0')`: Ensures single digits have a leading zero (e.g., 5 becomes "05").
     * 6. `.join(':')`: Combines hours, minutes, and seconds with colons.
     */
    clock(totalSeconds) {
      const clamped = Math.max(0, Math.floor(totalSeconds));
      const hours = Math.floor(clamped / 3600);
      const minutes = Math.floor((clamped % 3600) / 60);
      const seconds = clamped % 60;

      return [hours, minutes, seconds]
        .map(unit => String(unit).padStart(2, '0'))
        .join(':');
    },

    /**
     * status(lotOrSeconds)
     * --------------------
     * Computes the high-level urgency badge status for an auction lot.
     * Accepts either a raw number of seconds OR a lot object containing `.ends`.
     * 
     * THRESHOLDS:
     * - Less than 4 hours (14,400s) -> 'CLOSING SOON' (shown in high-contrast styling)
     * - Less than 24 hours (86,400s) -> 'LIVE TODAY'
     * - Greater than 24 hours        -> 'UPCOMING'
     */
    status(lotOrSeconds) {
      const endsInSeconds = typeof lotOrSeconds === 'object' && lotOrSeconds !== null
        ? lotOrSeconds.ends
        : Number(lotOrSeconds);

      if (endsInSeconds < 4 * 3600) return 'CLOSING SOON';
      if (endsInSeconds < 86400) return 'LIVE TODAY';
      return 'UPCOMING';
    },

    /**
     * closing(lotOrSeconds)
     * ---------------------
     * Generates human-friendly closing schedules for auction cards.
     * If within 24 hours, returns "Closes today". Otherwise calculates remaining days.
     */
    closing(lotOrSeconds) {
      const endsInSeconds = typeof lotOrSeconds === 'object' && lotOrSeconds !== null
        ? lotOrSeconds.ends
        : Number(lotOrSeconds);

      if (endsInSeconds < 86400) return 'Closes today';
      const days = Math.ceil(endsInSeconds / 86400);
      return `Closes in ${days} days`;
    }
  };

  // Backwards-compatible shortcut used in inline templates
  const money = Formatters.currency;

  // ---------------------------------------------------------------------------
  // 3. Watchlist / Saved Lots Manager (Client-side localStorage)
  // ---------------------------------------------------------------------------
  /**
   * WHAT THE WATCHLIST OBJECT DOES:
   * -------------------------------
   * Allows users to bookmark/favorite lots by clicking heart buttons (♥ / ♡).
   * It persists the saved lot keys in the browser's `localStorage`.
   * 
   * VIVA CONCEPT: localStorage vs sessionStorage vs Cookies:
   * - localStorage: Persists even after browser/tab is closed; holds up to ~5MB of strings.
   * - sessionStorage: Erased when the browser tab is closed.
   * - Cookies: Sent to server with every HTTP request; limited to 4KB.
   * 
   * Custom Event Bus (`vault:saved-change`):
   * When a lot is saved or removed, this module emits a `CustomEvent`.
   * This decouples the components: any view (e.g. Explore page, Navigation bar)
   * can listen to this event and update its UI automatically without direct coupling.
   */
  const SAVED_STORAGE_KEY = 'vault-saved-lots';

  const Watchlist = {
    /**
     * getAll()
     * --------
     * Retrieves the array of saved lot keys from localStorage.
     * Uses try/catch to gracefully handle disabled cookies or private browsing restrictions.
     */
    getAll() {
      try {
        const raw = localStorage.getItem(SAVED_STORAGE_KEY);
        // JSON.parse converts the serialized string (e.g. '["lot-watch"]') back into a real JS Array
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn('Unable to read saved lots from local storage:', err);
        return [];
      }
    },

    /**
     * save(items)
     * -----------
     * Serializes an array of keys to JSON and writes it to localStorage,
     * updates all badge counters on the page, and dispatches a CustomEvent.
     */
    save(items) {
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(items));
      } catch (err) {
        console.warn('Unable to persist saved lots to local storage:', err);
      }
      this.updateBadges();
      // Publish event so any listening view can re-render immediately
      document.dispatchEvent(new CustomEvent('vault:saved-change', { detail: { saved: items } }));
    },

    /**
     * has(lotKey)
     * -----------
     * Returns true if the lotKey is currently bookmarked in the watchlist.
     */
    has(lotKey) {
      return this.getAll().includes(lotKey);
    },

    /**
     * toggle(lotKey)
     * --------------
     * Adds the lotKey if missing; removes it if already present.
     * Uses the array `.filter()` method to remove items immutably.
     */
    toggle(lotKey) {
      const current = this.getAll();
      const next = current.includes(lotKey)
        ? current.filter(id => id !== lotKey)
        : [...current, lotKey];

      this.save(next);
      return next.includes(lotKey);
    },

    /**
     * updateBadges()
     * --------------
     * Queries all counter elements across the header navigation and filters,
     * updating their displayed count to match the watchlist length.
     */
    updateBadges() {
      const count = this.getAll().length;
      document.querySelectorAll('.saved-count').forEach(el => {
        el.textContent = count;
      });
      document.querySelectorAll('#saved-filter-count').forEach(el => {
        el.textContent = String(count).padStart(2, '0');
      });
    },

    /**
     * bindButtons()
     * -------------
     * Finds all heart buttons (`[data-save]`) in the current DOM, synchronizes
     * their visual state (filled heart vs outline), and attaches click listeners.
     * Prevents duplicate event listeners using `button.dataset.saveBound = 'true'`.
     */
    bindButtons() {
      const savedItems = this.getAll();

      document.querySelectorAll('[data-save]').forEach(button => {
        const key = button.dataset.save;
        const isSaved = savedItems.includes(key);

        button.classList.toggle('saved', isSaved);
        button.textContent = isSaved ? '♥' : '♡';

        // Guard against duplicate listener binding
        if (button.dataset.saveBound === 'true') return;
        button.dataset.saveBound = 'true';

        button.addEventListener('click', event => {
          // Prevent navigating to the lot detail link when clicking the heart button
          event.preventDefault();
          // Prevent event from bubbling up to parent cards
          event.stopPropagation();

          const active = this.toggle(key);
          button.classList.toggle('saved', active);
          button.textContent = active ? '♥' : '♡';
        });
      });

      this.updateBadges();
    }
  };

  // Backwards-compatible aliases for legacy function calls
  function getSaved() { return Watchlist.getAll(); }
  function setSaved(items) { Watchlist.save(items); }
  function updateSavedCount() { Watchlist.updateBadges(); }
  function toggleSaved(id) { return Watchlist.toggle(id); }
  function setupSaveButtons() { Watchlist.bindButtons(); }

  // ---------------------------------------------------------------------------
  // 4. Shared Simulated Bidding Utility & Session Persistence
  // ---------------------------------------------------------------------------
  /**
   * WHAT THIS SECTION DOES:
   * -----------------------
   * Simulates an interactive auction bidding desk directly in the client's browser.
   * 
   * VIVA ARCHITECTURE NOTE:
   * In a complete production system, bids are written to PostgreSQL via a backend API.
   * In this educational demonstration, bids are stored in `sessionStorage` so students
   * can demonstrate placing bids, price increases, validation errors, and simulated
   * bid activity logs live in the browser without requiring live payment transactions!
   */
  const SESSION_BIDS_STORAGE_KEY = 'vault-demo-bids';

  function getSessionBids() {
    try {
      const data = sessionStorage.getItem(SESSION_BIDS_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (_) {
      return {};
    }
  }

  function setSessionBid(lotId, price, bidCount) {
    try {
      const map = getSessionBids();
      map[lotId] = { price, bidCount, timestamp: Date.now() };
      sessionStorage.setItem(SESSION_BIDS_STORAGE_KEY, JSON.stringify(map));
    } catch (_) {}
  }

  /**
   * createBidDesk(config)
   * ---------------------
   * Factory function that creates a stateful bidding desk instance for an auction lot.
   * 
   * VIVA DESIGN PATTERN: Factory Function & Closure Pattern
   * The returned object exposes methods (`recordBid`, `isValid`, `getMinimumBid`)
   * that maintain access to private variables (`currentPrice`, `bidCount`, `increment`)
   * enclosed within the function scope.
   */
  function createBidDesk({
    lotId,
    initialPrice,
    initialBids,
    increment = 5000,
    onBidAccepted
  }) {
    // Check if user previously placed a bid on this lot during this browser session
    const sessionBids = getSessionBids();
    const stored = lotId && sessionBids[lotId] ? sessionBids[lotId] : null;

    let currentPrice = stored ? stored.price : initialPrice;
    let bidCount = stored ? stored.bidCount : initialBids;

    // Minimum allowable bid is current price + standard auction increment
    function getMinimumBid() {
      return currentPrice + increment;
    }

    /**
     * getValidationError(amount)
     * --------------------------
     * Strict bid validation rules:
     * 1. Must be a finite positive number.
     * 2. Must be greater than or equal to current price + increment.
     * 3. Must be an exact multiple of the increment: (amount - currentPrice) % increment === 0.
     */
    function getValidationError(amount) {
      if (!Number.isFinite(amount) || amount <= 0) {
        return `Enter a bid of at least ${Formatters.currency(getMinimumBid())}.`;
      }
      if (amount < getMinimumBid()) {
        return `Enter a bid of at least ${Formatters.currency(getMinimumBid())} in increments of ${Formatters.currency(increment)}.`;
      }
      if ((amount - currentPrice) % increment !== 0) {
        return `Enter a bid of at least ${Formatters.currency(getMinimumBid())} in increments of ${Formatters.currency(increment)}.`;
      }
      return '';
    }

    function isValid(amount) {
      return getValidationError(amount) === '';
    }

    /**
     * recordBid(amount)
     * -----------------
     * If valid, updates price and bid count, writes to sessionStorage, and
     * invokes the `onBidAccepted` UI callback to refresh the screen.
     */
    function recordBid(amount) {
      if (!isValid(amount)) return false;

      currentPrice = amount;
      bidCount += 1;

      if (lotId) {
        setSessionBid(lotId, currentPrice, bidCount);
      }

      if (typeof onBidAccepted === 'function') {
        onBidAccepted(currentPrice, bidCount);
      }
      return true;
    }

    /**
     * getSimulatedHistory()
     * ---------------------
     * Returns an array of prior bid amounts to populate the bid activity log.
     */
    function getSimulatedHistory() {
      return [
        currentPrice,
        currentPrice - increment,
        currentPrice - (increment * 2)
      ].filter(value => value > 0);
    }

    return {
      getCurrentPrice: () => currentPrice,
      getBidCount: () => bidCount,
      getMinimumBid,
      getIncrement: () => increment,
      isValid,
      getValidationError,
      recordBid,
      getSimulatedHistory
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Catalogue Service (Supabase Integration with Resilient Fallback)
  // ---------------------------------------------------------------------------
  /**
   * WHAT THE CATALOGUE SERVICE DOES:
   * --------------------------------
   * Fetches real auction lots from Supabase PostgreSQL database if available,
   * while seamlessly falling back to local static data if offline.
   * 
   * VIVA ARCHITECTURE: Graceful Degradation / Resilience:
   * The frontend doesn't break if the backend is down or unconfigured.
   * It attempts to query the database; if an error or empty result occurs,
   * it returns the sample static archive smoothly.
   */
  const SAMPLE_AUCTION_LOTS = AUCTION_LOTS;

  /**
   * mapDatabaseLotToLot(row)
   * ------------------------
   * Data Transformation Function (Adapter Pattern):
   * Maps PostgreSQL snake_case database columns into the camelCase object structure
   * expected by the frontend UI cards and templates.
   */
  function mapDatabaseLotToLot(row) {
    // Sort associated images so the primary banner image is first
    const images = Array.isArray(row.lot_images) ? [...row.lot_images] : [];
    images.sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    const primaryImage = images[0]?.image_url || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=85';
    const gallery = images.length > 0 ? images.map(img => img.image_url) : [primaryImage];

    // Calculate countdown remaining seconds from ISO database timestamp (ends_at)
    let endsInSeconds = 86400;
    if (row.ends_at) {
      const diff = Math.floor((new Date(row.ends_at).getTime() - Date.now()) / 1000);
      endsInSeconds = diff > 0 ? diff : 0;
    }

    const lotId = row.legacy_id || row.id;
    const numOnly = (row.lot_number || '').replace(/^LOT\s*/i, '').trim();

    // Format estimate string
    let estimateStr = 'Estimate upon request';
    if (row.estimate_low && row.estimate_high) {
      estimateStr = `${Formatters.currency(row.estimate_low)} – ${Formatters.currency(row.estimate_high)}`;
    } else if (row.estimate_low) {
      estimateStr = `From ${Formatters.currency(row.estimate_low)}`;
    }

    // Check if session bid overrides the database bid
    const sessionBids = getSessionBids();
    const stored = sessionBids[lotId];
    const livePrice = stored ? stored.price : (Number(row.current_bid) || 0);
    const liveCount = stored ? stored.bidCount : (Number(row.bid_count) || 0);

    return {
      id: lotId,
      dbId: row.id,
      key: `lot-${lotId}`,
      number: numOnly || '001',
      category: row.category || 'Objects',
      period: row.period || 'Contemporary',
      title: row.title,
      subtitle: row.subtitle || '',
      price: livePrice,
      bids: liveCount,
      estimate: estimateStr,
      ends: endsInSeconds,
      image: primaryImage,
      gallery: gallery,
      story: row.description || '',
      status: row.status,
      isDatabase: true
    };
  }

  const CatalogueService = {
    cachedLots: null,
    fetchPromise: null,

    /**
     * getLots()
     * ---------
     * Asynchronously queries Supabase for published auction lots, including nested
     * foreign-key relations to `lot_images`. Caches results in memory to avoid
     * duplicate network requests.
     */
    async getLots() {
      // 1. Cache hit check
      if (this.cachedLots) return this.cachedLots;
      // 2. In-flight request check (prevents duplicate parallel requests)
      if (this.fetchPromise) return this.fetchPromise;

      this.fetchPromise = (async () => {
        const auth = window.vaultAuth;
        // If Supabase client is not loaded or unconfigured, fall back immediately
        if (!auth || !auth.client) {
          this.cachedLots = SAMPLE_AUCTION_LOTS;
          return this.cachedLots;
        }

        try {
          // Perform SQL SELECT with nested JOIN to lot_images table
          const { data, error } = await auth.client
            .from('auction_lots')
            .select(`
              id,
              legacy_id,
              lot_number,
              category,
              period,
              title,
              subtitle,
              description,
              estimate_low,
              estimate_high,
              current_bid,
              bid_count,
              ends_at,
              status,
              published_at,
              lot_images (
                image_url,
                alt_text,
                is_primary,
                sort_order
              )
            `)
            .in('status', ['scheduled', 'live', 'closed'])
            .not('published_at', 'is', null)
            .order('created_at', { ascending: false });

          if (error) {
            console.warn('Supabase catalogue query error, preserving demonstration archive:', error);
            this.cachedLots = SAMPLE_AUCTION_LOTS;
            return this.cachedLots;
          }

          if (!data || data.length === 0) {
            this.cachedLots = SAMPLE_AUCTION_LOTS;
            return this.cachedLots;
          }

          // Map raw SQL rows to clean JS objects
          this.cachedLots = data.map(mapDatabaseLotToLot);
          return this.cachedLots;
        } catch (err) {
          console.warn('Network error loading catalogue, falling back to demonstration archive:', err);
          this.cachedLots = SAMPLE_AUCTION_LOTS;
          return this.cachedLots;
        } finally {
          this.fetchPromise = null;
        }
      })();

      return this.fetchPromise;
    },

    /**
     * getLotById(requestedId)
     * -----------------------
     * Finds a single lot matching the requested ID string.
     */
    async getLotById(requestedId) {
      const all = await this.getLots();
      let match = all.find(item => item.id === requestedId || (requestedId && (requestedId.startsWith(item.id) || item.id.startsWith(requestedId))));
      if (match) return match;

      match = SAMPLE_AUCTION_LOTS.find(item => item.id === requestedId || (requestedId && requestedId.startsWith(item.id)));
      if (match) return match;

      return !requestedId ? all[0] || SAMPLE_AUCTION_LOTS[0] : null;
    }
  };

  // ---------------------------------------------------------------------------
  // 6. Explore Catalog View (explore.html)
  // ---------------------------------------------------------------------------
  /**
   * WHAT RENDEREXPLORE() DOES:
   * --------------------------
   * Controls the Explore Auctions catalog page:
   * 1. Reads initial filter state from URL query parameters (e.g., ?category=Timepieces&saved=true).
   * 2. Renders dynamic auction lot cards with lazy-loading images, badges, and heart buttons.
   * 3. Implements real-time search filtering across titles, categories, and periods.
   * 4. Implements sorting by Curated, Closing Soonest, Price Low-High, and Price High-Low.
   * 5. Displays an empty state notice if no lots match the selected filters.
   */
  async function renderExplore() {
    const grid = document.querySelector('#auction-grid');
    if (!grid) return; // Exit if not on explore.html page

    // Read URL search parameters (e.g. explore.html?category=Art&saved=true)
    const params = new URLSearchParams(window.location.search);
    let activeCategory = params.get('category') || 'All';
    let savedOnly = params.get('saved') === 'true';
    let searchQuery = '';
    let sortMode = 'curated';

    // Query interactive controls in the DOM
    const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
    const searchInput = document.querySelector('#lot-search');
    const sortSelect = document.querySelector('#lot-sort');
    const clearButton = document.querySelector('#clear-filters');
    const savedFilter = document.querySelector('#saved-filter');
    const savedCount = document.querySelector('#saved-filter-count');
    const resultsCount = document.querySelector('#results-count');
    const emptyState = document.querySelector('#empty-state');
    const emptyNotice = emptyState?.querySelector('p');
    const editCountEl = document.querySelector('#explore-edit-count');

    if (savedOnly && savedFilter) {
      savedFilter.scrollIntoView({ block: 'center' });
    }

    /**
     * createLotCardMarkup(lot, index, isSaved)
     * ----------------------------------------
     * Returns an HTML template literal representing a luxury auction lot card.
     */
    function createLotCardMarkup(lot, index, isSaved) {
      const statusText = Formatters.status(lot.ends);
      const isUrgent = statusText === 'CLOSING SOON';
      const closingText = Formatters.closing(lot.ends);
      const encodedId = encodeURIComponent(lot.id);

      return `
        <article class="lot-card editorial-lot editorial-lot-${index + 1}">
          <a class="lot-image" href="lot.html?lot=${encodedId}">
            <img src="${lot.image}" alt="${lot.title}" loading="lazy">
            <span class="lot-number">LOT ${lot.number}</span>
            <span class="lot-status ${isUrgent ? 'urgent' : ''}">${statusText}</span>
            <button class="lot-save ${isSaved ? 'saved' : ''}" data-save="${lot.key}" aria-label="${isSaved ? 'Remove' : 'Save'} ${lot.title}">
              ${isSaved ? '♥' : '♡'}
            </button>
          </a>
          <div class="lot-copy">
            <div class="lot-info">
              <div>
                <p class="lot-category">${lot.category.toUpperCase()} / ${lot.period.toUpperCase()}</p>
                <h3><a href="lot.html?lot=${encodedId}">${lot.title}</a></h3>
              </div>
              <div class="lot-price">
                <span>Current bid</span>
                <strong>${Formatters.currency(lot.price)}</strong>
              </div>
            </div>
            <div class="lot-meta">
              <span>${lot.bids} bids</span>
              <span>${closingText}</span>
              <span>Est. ${lot.estimate}</span>
            </div>
            <div class="lot-card-foot">
              <span>LOT ${lot.number}</span>
              <a href="lot.html?lot=${encodedId}">View lot ↗</a>
            </div>
          </div>
        </article>
      `.trim();
    }

    let activeCatalogue = SAMPLE_AUCTION_LOTS;

    /**
     * renderList()
     * ------------
     * Filters, sorts, and injects the lot cards into the DOM based on active user selections.
     * 
     * VIVA CONCEPTS:
     * - Array.filter(): Creates a new array with items passing all conditions.
     * - Array.sort(): Orders items in-place using numeric comparators.
     * - Array.map(): Transforms lot data objects into HTML markup strings.
     * - innerHTML: Injects generated markup into the grid container.
     */
    function renderList() {
      const savedKeys = Watchlist.getAll();

      // 1. FILTERING
      let visibleLots = activeCatalogue.filter(lot => {
        const matchesCategory = activeCategory === 'All' || lot.category.toLowerCase() === activeCategory.toLowerCase();
        const matchesSaved = !savedOnly || savedKeys.includes(lot.key);
        const searchable = `${lot.title} ${lot.category} ${lot.period} ${lot.number}`.toLowerCase();
        const matchesSearch = searchable.includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSaved && matchesSearch;
      });

      // 2. SORTING
      if (sortMode === 'ending') {
        visibleLots.sort((a, b) => a.ends - b.ends); // Ending soonest first
      } else if (sortMode === 'bid-low') {
        visibleLots.sort((a, b) => a.price - b.price); // Price low to high
      } else if (sortMode === 'bid-high') {
        visibleLots.sort((a, b) => b.price - a.price); // Price high to low
      }

      // 3. DOM INJECTION
      grid.innerHTML = visibleLots.map((lot, idx) => {
        return createLotCardMarkup(lot, idx, savedKeys.includes(lot.key));
      }).join('');

      // 4. COUNTERS & EMPTY STATE
      if (resultsCount) {
        const countText = String(visibleLots.length).padStart(2, '0');
        const scopeText = savedOnly ? 'SAVED ' : 'SELECTED ';
        const nounText = visibleLots.length === 1 ? 'LOT' : 'LOTS';
        resultsCount.textContent = `SHOWING ${countText} ${scopeText}${nounText}`;
      }

      if (editCountEl) {
        editCountEl.textContent = String(activeCatalogue.length).padStart(2, '0');
      }

      if (emptyState) {
        emptyState.hidden = visibleLots.length > 0;
      }
      if (emptyNotice) {
        emptyNotice.textContent = savedOnly
          ? 'Save a lot from the collection to begin building your edit.'
          : 'Try another category or search term.';
      }
      if (savedCount) {
        savedCount.textContent = String(savedKeys.length).padStart(2, '0');
      }
      if (savedFilter) {
        savedFilter.classList.toggle('active', savedOnly);
      }

      // Re-bind click handlers to heart icons
      Watchlist.bindButtons();
    }

    // Reactively re-render if a lot is saved or unsaved while on the "Saved" view
    document.addEventListener('vault:saved-change', () => {
      if (savedOnly) renderList();
    });

    // Category button click handlers
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        activeCategory = button.dataset.filter;
        savedOnly = false;
        filterButtons.forEach(b => b.classList.toggle('active', b === button));
        renderList();
      });
    });

    // Real-time search input listener
    searchInput?.addEventListener('input', event => {
      searchQuery = event.target.value;
      renderList();
    });

    // Sort dropdown change listener
    sortSelect?.addEventListener('change', event => {
      sortMode = event.target.value;
      renderList();
    });

    // Toggle Saved Filter
    savedFilter?.addEventListener('click', () => {
      savedOnly = !savedOnly;
      activeCategory = 'All';
      filterButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === 'All'));
      renderList();
    });

    // Reset / Clear all filters
    clearButton?.addEventListener('click', () => {
      activeCategory = 'All';
      savedOnly = false;
      searchQuery = '';
      sortMode = 'curated';

      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'curated';

      filterButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === 'All'));
      renderList();
    });

    filterButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.filter === activeCategory);
    });

    // 1. Initial fast render using local static fallback archive
    renderList();

    // 2. Asynchronous update from Supabase if online
    CatalogueService.getLots().then(lots => {
      if (lots && lots.length > 0) {
        activeCatalogue = lots;
        renderList();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 7. Lot Detail View (lot.html)
  // ---------------------------------------------------------------------------
  /**
   * WHAT RENDERLOT() DOES:
   * ----------------------
   * Controls the individual Lot Details page (lot.html):
   * 1. Reads the `?lot=xyz` URL parameter.
   * 2. Fetches the lot details via CatalogueService.
   * 3. Sets up an interactive image gallery thumbnail switcher and modal lightbox.
   * 4. Instantiates a `createBidDesk` for simulated live bidding and input validation.
   * 5. Displays the dynamic countdown timer.
   * 6. Recommends "Similar Lots" in the same category.
   */
  async function renderLot() {
    const titleElement = document.querySelector('#lot-title');
    if (!titleElement) return; // Exit if not on lot.html

    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('lot');
    const lot = await CatalogueService.getLotById(requestedId);

    // 404 Lot Not Found handling
    if (!lot) {
      document.title = 'Lot not found — THE VAULT';
      const detailGrid = document.querySelector('.lot-detail-grid');
      const notFoundSection = document.querySelector('#lot-not-found');
      const detailsSection = document.querySelector('.lot-details-section');
      const similarSection = document.querySelector('.similar-lots-section');

      if (detailGrid) detailGrid.hidden = true;
      if (notFoundSection) notFoundSection.hidden = false;
      if (detailsSection) detailsSection.hidden = true;
      if (similarSection) similarSection.hidden = true;
      return;
    }

    // Determine gallery images (primary + secondary angles)
    const gallery = lot.gallery && lot.gallery.length > 0 ? lot.gallery : (lot.id === 'watch'
      ? [
          lot.image,
          'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1400&q=90',
          'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1400&q=90'
        ]
      : [lot.image]);

    const statusLabel = Formatters.status(lot.ends);

    // Dynamic browser tab title
    document.title = `${lot.title} — THE VAULT`;

    // Helper to safely set text content of DOM elements
    const setText = (selector, val) => {
      const el = document.querySelector(selector);
      if (el) el.textContent = val;
    };

    setText('#lot-breadcrumb', `LOT ${lot.number}`);
    setText('#lot-category', `${lot.category.toUpperCase()} / LOT ${lot.number}`);
    titleElement.innerHTML = `${lot.title.replace(' ', '<br>')}<em>.</em>`;
    setText('#lot-subtitle', lot.subtitle);
    setText('#lot-estimate', lot.estimate);
    setText('#lot-number', `LOT ${lot.number}`);
    setText('#lot-period', lot.period);
    setText('#detail-period', lot.period);
    setText('#lot-story-copy', lot.story);
    setText('#detail-description', lot.story);
    setText('#lot-status-label', statusLabel);
    setText('.gallery-stamp', `THE VAULT / LOT ${lot.number}`);

    const storyHeading = document.querySelector('#lot-story-heading');
    if (storyHeading) {
      storyHeading.innerHTML = `${lot.category}, <em>considered.</em>`;
    }

    // Main Showcase Image
    const mainImage = document.querySelector('#lot-image');
    if (mainImage) {
      mainImage.src = gallery[0];
      mainImage.alt = lot.title;
    }

    // Gallery Thumbnails Switcher
    const thumbsContainer = document.querySelector('#gallery-thumbs');
    if (thumbsContainer) {
      const thumbButtons = gallery.map((imageSrc, index) => {
        const thumbSrc = imageSrc.replace('w=1400', 'w=250');
        const activeClass = index === 0 ? ' active' : '';
        return `<button class="thumb${activeClass}" data-image="${imageSrc}" aria-label="View image ${index + 1}"><img src="${thumbSrc}" alt="${lot.title}, view ${index + 1}"></button>`;
      }).join('');

      thumbsContainer.innerHTML = thumbButtons + '<span>SELECT AN IMAGE TO VIEW</span>';

      // Thumbnail click interaction
      thumbsContainer.querySelectorAll('.thumb').forEach(button => {
        button.addEventListener('click', () => {
          thumbsContainer.querySelectorAll('.thumb').forEach(b => b.classList.remove('active'));
          button.classList.add('active');
          if (mainImage) mainImage.src = button.dataset.image;
        });
      });
    }

    // Lightbox Modal Feature (Full-screen image zoom)
    const lightbox = document.querySelector('#image-lightbox');
    const lightboxImage = document.querySelector('#lightbox-image');
    const expandButton = document.querySelector('#image-expand');
    const closeButton = document.querySelector('#lightbox-close');

    if (lightbox && lightboxImage && expandButton) {
      expandButton.addEventListener('click', () => {
        lightboxImage.src = mainImage ? mainImage.src : gallery[0];
        lightboxImage.alt = lot.title;
        lightbox.hidden = false;
        document.body.classList.add('lightbox-open');
      });

      const closeLightbox = () => {
        lightbox.hidden = true;
        document.body.classList.remove('lightbox-open');
      };

      closeButton?.addEventListener('click', closeLightbox);
      lightbox.addEventListener('click', event => {
        if (event.target === lightbox) closeLightbox();
      });
    }

    // Simulated Bidding Desk Integration
    const currentBidEl = document.querySelector('#current-bid');
    const bidCountEl = document.querySelector('#bid-count');
    const bidInput = document.querySelector('#bid-amount');
    const bidIncrementEl = document.querySelector('#bid-increment');
    const bidFeedback = document.querySelector('#bid-feedback');
    const bidButton = document.querySelector('#place-bid');
    const historyList = document.querySelector('#bid-history-list');

    const desk = createBidDesk({
      lotId: lot.id,
      initialPrice: lot.price,
      initialBids: lot.bids,
      increment: 5000,
      onBidAccepted(newPrice, newCount) {
        if (currentBidEl) currentBidEl.textContent = Formatters.currency(newPrice);
        if (bidCountEl) bidCountEl.textContent = String(newCount).padStart(2, '0');
        if (bidInput) {
          bidInput.min = desk.getMinimumBid();
          bidInput.value = desk.getMinimumBid();
        }
      }
    });

    if (currentBidEl) currentBidEl.textContent = Formatters.currency(desk.getCurrentPrice());
    if (bidCountEl) bidCountEl.textContent = String(desk.getBidCount()).padStart(2, '0');
    if (bidIncrementEl) bidIncrementEl.textContent = Formatters.currency(desk.getIncrement());

    if (bidInput) {
      bidInput.min = desk.getMinimumBid();
      bidInput.step = desk.getIncrement();
      bidInput.value = desk.getMinimumBid();
    }

    // Populate initial simulated bid activity feed
    if (historyList) {
      const initialHistory = desk.getSimulatedHistory();
      historyList.innerHTML = initialHistory.map((val, idx) => {
        const bidderNum = String(lot.bids - idx).padStart(2, '0');
        const timeAgo = idx === 0 ? 'Just now' : `${(idx + 1) * 12} min ago`;
        return `
          <div class="history-row">
            <span>
              <b>Bidder ${bidderNum}</b>
              <small>${timeAgo} · simulated</small>
            </span>
            <strong>${Formatters.currency(val)}</strong>
          </div>
        `.trim();
      }).join('');
    }

    // Place Bid button click handler
    bidButton?.addEventListener('click', () => {
      const enteredAmount = Number(bidInput?.value);
      const validationError = desk.getValidationError(enteredAmount);

      if (validationError) {
        if (bidFeedback) {
          bidFeedback.textContent = validationError;
          bidFeedback.className = 'bid-feedback error';
        }
        return;
      }

      // Record valid bid
      desk.recordBid(enteredAmount);

      // Prepend user bid row to the visual activity list
      if (historyList) {
        const userRow = document.createElement('div');
        userRow.className = 'history-row';
        userRow.innerHTML = `
          <span>
            <b>You (session bidder)</b>
            <small>Just now · demonstration</small>
          </span>
          <strong>${Formatters.currency(enteredAmount)}</strong>
        `.trim();
        historyList.prepend(userRow);
      }

      if (bidFeedback) {
        bidFeedback.textContent = 'Demo bid accepted in this browser. No real bid or payment has been submitted.';
        bidFeedback.className = 'bid-feedback success';
      }
    });

    // Detail Watchlist Heart Button
    const saveDetailButton = document.querySelector('#save-detail');
    if (saveDetailButton) {
      const syncSaveDetail = () => {
        const isSaved = Watchlist.has(lot.key);
        saveDetailButton.classList.toggle('saved', isSaved);
        saveDetailButton.innerHTML = isSaved
          ? '♥ <span>Saved</span>'
          : '♡ <span>Save lot</span>';
      };

      saveDetailButton.addEventListener('click', () => {
        Watchlist.toggle(lot.key);
        syncSaveDetail();
      });

      syncSaveDetail();
    }

    Watchlist.updateBadges();

    // Similar Lots Recommendation Engine
    const similarGrid = document.querySelector('#similar-lots-grid');
    if (similarGrid) {
      CatalogueService.getLots().then(allLots => {
        const similarLots = allLots
          .filter(item => item.id !== lot.id && item.category.toLowerCase() === lot.category.toLowerCase())
          .slice(0, 3); // Take top 3 recommendations

        similarGrid.innerHTML = similarLots.map(item => `
          <article class="similar-lot">
            <a href="lot.html?lot=${encodeURIComponent(item.id)}">
              <img src="${item.image}" alt="${item.title}" loading="lazy">
              <span>LOT ${item.number} / ${item.category.toUpperCase()}</span>
            </a>
            <h3><a href="lot.html?lot=${encodeURIComponent(item.id)}">${item.title}</a></h3>
            <p>${Formatters.currency(item.price)} / ${item.bids} bids</p>
          </article>
        `.trim()).join('');
      });
    }

    // Live Countdown Timer (Ticks every 1,000 milliseconds)
    let remainingSeconds = lot.ends;
    const timerElement = document.querySelector('#countdown');

    function updateCountdown() {
      if (!timerElement) return;
      timerElement.textContent = Formatters.clock(remainingSeconds);
      if (remainingSeconds > 0) remainingSeconds -= 1;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // ---------------------------------------------------------------------------
  // 8. Homepage View (index.html)
  // ---------------------------------------------------------------------------
  /**
   * WHAT RENDERHOME() DOES:
   * -----------------------
   * Controls the Homepage (index.html):
   * 1. Injects the hero "Featured Lot" (The Heritage Chronograph).
   * 2. Renders the top live auction lots in the preview grid.
   * 3. Synchronizes interactive heart save buttons across the hero and grid.
   */
  function renderHome() {
    const liveGrid = document.querySelector('#home-live-grid');
    if (!liveGrid) return; // Exit if not on index.html

    const featured = AUCTION_LOTS[0];
    const featuredLink = document.querySelector('#featured-link');
    const featuredImage = document.querySelector('#featured-image');
    const featuredSave = document.querySelector('#featured-save');
    const featuredStatus = document.querySelector('#featured-status');
    const heroObject = document.querySelector('.hero-object');

    const lotUrl = `lot.html?lot=${encodeURIComponent(featured.id)}`;

    if (featuredLink) featuredLink.href = lotUrl;
    if (featuredImage) {
      featuredImage.src = featured.image;
      featuredImage.alt = featured.title;
    }
    if (featuredSave) featuredSave.dataset.save = featured.key;
    if (featuredStatus) featuredStatus.textContent = Formatters.status(featured.ends);
    if (heroObject) heroObject.href = lotUrl;

    const setText = (id, val) => {
      const el = document.querySelector(id);
      if (el) el.textContent = val;
    };

    setText('#featured-lot-number', `LOT ${featured.number}`);
    setText('#featured-category', `${featured.category.toUpperCase()} / ${featured.period}`);
    setText('#featured-title', featured.title);
    setText('#featured-subtitle', featured.subtitle);
    setText('#featured-estimate', featured.estimate);
    setText('#featured-bid', Formatters.currency(featured.price));
    setText('#featured-bids', `${String(featured.bids).padStart(2, '0')} BIDS`);
    setText('#featured-closing', Formatters.closing(featured.ends));

    const featuredAction = document.querySelector('#featured-action');
    if (featuredAction) featuredAction.href = lotUrl;

    // Live Grid lots (display items 1 to 3 from static catalog)
    liveGrid.innerHTML = AUCTION_LOTS.slice(1, 4).map(lot => {
      const statusText = Formatters.status(lot.ends);
      const isUrgent = statusText === 'CLOSING SOON';
      const encodedId = encodeURIComponent(lot.id);

      return `
        <article class="home-live-card">
          <div class="home-live-image">
            <a href="lot.html?lot=${encodedId}">
              <img src="${lot.image}" alt="${lot.title}" loading="lazy">
            </a>
            <span class="lot-number">LOT ${lot.number}</span>
            <span class="lot-status ${isUrgent ? 'urgent' : ''}">${statusText}</span>
            <button class="lot-save" data-save="${lot.key}" aria-label="Save ${lot.title}">♡</button>
          </div>
          <div class="home-live-info">
            <p class="lot-category">${lot.category.toUpperCase()} / ${lot.period}</p>
            <h3><a href="lot.html?lot=${encodedId}">${lot.title}</a></h3>
            <div class="home-live-data">
              <span>CURRENT BID<strong>${Formatters.currency(lot.price)}</strong></span>
              <span>ESTIMATE<strong>${lot.estimate}</strong></span>
            </div>
            <div class="home-live-foot">
              <span>${lot.bids} BIDS / ${Formatters.closing(lot.ends)}</span>
              <a href="lot.html?lot=${encodedId}">View lot ↗</a>
            </div>
          </div>
        </article>
      `.trim();
    }).join('');

    Watchlist.bindButtons();
  }

  // ---------------------------------------------------------------------------
  // 9. Arena Live Simulation View (arena.html)
  // ---------------------------------------------------------------------------
  /**
   * WHAT RENDERARENA() DOES:
   * ------------------------
   * Controls the Live Auction Arena (arena.html):
   * 1. Simulates a live bidding floor where collectors place real-time bids.
   * 2. Displays the prominent spotlight lot with bid history and live countdown.
   * 3. Renders the live floor room lots with live status tickers.
   * 4. Simulates incoming room signals and bidding notifications.
   */
  function renderArena() {
    const floor = document.querySelector('#arena-floor');
    if (!floor) return; // Exit if not on arena.html

    const liveLots = AUCTION_LOTS
      .filter(lot => lot.ends > 0 && lot.ends < 86400)
      .sort((a, b) => a.ends - b.ends);

    const activeLots = AUCTION_LOTS.filter(lot => lot.ends > 0);

    const params = new URLSearchParams(window.location.search);
    const requestedLot = AUCTION_LOTS.find(lot => lot.id === params.get('lot'));
    const featured = requestedLot || liveLots[0] || activeLots[0];

    const activeCountEl = document.querySelector('#arena-active-count');
    if (activeCountEl) {
      activeCountEl.textContent = String(liveLots.length).padStart(2, '0');
    }

    const featuredLink = document.querySelector('#arena-featured-link');
    const featuredImage = document.querySelector('#arena-featured-image');
    const featuredSave = document.querySelector('#arena-featured-save');
    const featuredAction = document.querySelector('#arena-featured-action');

    const lotUrl = `lot.html?lot=${encodeURIComponent(featured.id)}`;

    if (featuredLink) featuredLink.href = lotUrl;
    if (featuredImage) {
      featuredImage.src = featured.image;
      featuredImage.alt = featured.title;
    }
    if (featuredSave) featuredSave.dataset.save = featured.key;
    if (featuredAction) featuredAction.href = lotUrl;

    const setText = (id, val) => {
      const el = document.querySelector(id);
      if (el) el.textContent = val;
    };

    setText('#arena-featured-number', `LOT ${featured.number}`);
    setText('#arena-featured-category', featured.category.toUpperCase());
    setText('#arena-featured-status', Formatters.status(featured.ends));
    setText('#arena-featured-title', featured.title);
    setText('#arena-featured-subtitle', featured.subtitle);
    setText('#arena-featured-estimate', featured.estimate);

    // Arena Bid Desk
    const bidAmountInput = document.querySelector('#arena-bid-amount');
    const bidFeedback = document.querySelector('#arena-feedback');
    const bidHistory = document.querySelector('#arena-history-list');
    const bidButton = document.querySelector('#arena-place-bid');

    const desk = createBidDesk({
      lotId: featured.id,
      initialPrice: featured.price,
      initialBids: featured.bids,
      increment: 5000,
      onBidAccepted(newPrice, newCount) {
        updateDeskDisplays(newPrice, newCount);
      }
    });

    function updateDeskDisplays(price, count) {
      setText('#arena-featured-bid', Formatters.currency(price));
      setText('#arena-current-bid', Formatters.currency(price));
      setText('#arena-featured-bids', String(count).padStart(2, '0'));
      setText('#arena-min-bid', Formatters.currency(desk.getMinimumBid()));
      setText('#arena-increment', Formatters.currency(desk.getIncrement()));

      if (bidAmountInput) {
        bidAmountInput.min = desk.getMinimumBid();
        bidAmountInput.step = desk.getIncrement();
        bidAmountInput.value = desk.getMinimumBid();
      }
    }

    updateDeskDisplays(desk.getCurrentPrice(), desk.getBidCount());

    if (bidHistory) {
      const initialHistory = desk.getSimulatedHistory();
      bidHistory.innerHTML = initialHistory.map((val, idx) => {
        const bidderNum = String(featured.bids - idx).padStart(2, '0');
        const timeAgo = idx === 0 ? 'Just now' : `${(idx + 1) * 12} min ago`;
        return `
          <div>
            <span>Bidder ${bidderNum}<small>${timeAgo} · simulated</small></span>
            <strong>${Formatters.currency(val)}</strong>
          </div>
        `.trim();
      }).join('');
    }

    bidButton?.addEventListener('click', () => {
      const enteredAmount = Number(bidAmountInput?.value);
      const validationError = desk.getValidationError(enteredAmount);

      if (validationError) {
        if (bidFeedback) {
          bidFeedback.textContent = validationError;
          bidFeedback.className = 'arena-feedback error';
        }
        return;
      }

      desk.recordBid(enteredAmount);

      if (bidHistory) {
        const row = document.createElement('div');
        row.innerHTML = `
          <span>You / demo bidder<small>Just now · session active</small></span>
          <strong>${Formatters.currency(enteredAmount)}</strong>
        `.trim();
        bidHistory.prepend(row);
      }

      if (bidFeedback) {
        bidFeedback.textContent = 'Demo bid accepted in this browser. No real bid or payment has been submitted.';
        bidFeedback.className = 'arena-feedback success';
      }
    });

    // Floor Lots list
    const roomLots = activeLots.filter(lot => lot.id !== featured.id);
    floor.innerHTML = roomLots.map((lot, index) => {
      const statusText = Formatters.status(lot.ends);
      const isUrgent = statusText === 'CLOSING SOON';
      const endsText = lot.ends < 86400 ? Formatters.clock(lot.ends) : 'UPCOMING';
      const encodedId = encodeURIComponent(lot.id);

      return `
        <article class="arena-floor-lot arena-floor-lot-${index + 1}">
          <div class="arena-floor-image">
            <a href="lot.html?lot=${encodedId}">
              <img src="${lot.image}" alt="${lot.title}" loading="lazy">
            </a>
            <span>LOT ${lot.number}</span>
            <b class="${isUrgent ? 'urgent' : ''}">${statusText}</b>
            <button class="arena-save" data-save="${lot.key}" aria-label="Save ${lot.title}">♡</button>
          </div>
          <div class="arena-floor-copy">
            <p>${lot.category.toUpperCase()} / ${lot.period}</p>
            <h3><a href="lot.html?lot=${encodedId}">${lot.title}</a></h3>
            <div>
              <strong>${Formatters.currency(lot.price)}</strong>
              <span>${String(lot.bids).padStart(2, '0')} BIDS / ${endsText}</span>
            </div>
            <a class="arena-select-link" href="arena.html?lot=${encodedId}">Make featured ↗</a>
          </div>
        </article>
      `.trim();
    }).join('');

    const arenaEmpty = document.querySelector('#arena-empty');
    if (arenaEmpty) arenaEmpty.hidden = roomLots.length > 0;

    // Room Signals Activity Feed
    const activityLots = activeLots.slice(0, 3);
    const arenaActivity = document.querySelector('#arena-activity');
    if (arenaActivity) {
      arenaActivity.innerHTML = activityLots.map((lot, idx) => {
        const headline = idx === 0
          ? `A bid was recorded on <strong>${lot.title}</strong>.`
          : `The room is watching <strong>${lot.title}</strong>.`;
        const note = idx === 0
          ? `SIMULATED BID / ${Formatters.currency(lot.price)}`
          : `${Formatters.status(lot.ends)} / DEMONSTRATION`;

        return `
          <article>
            <span>0${idx + 1}</span>
            <p>${headline}</p>
            <small>${note}</small>
          </article>
        `.trim();
      }).join('');
    }

    // Closing Soon preview rail
    const closingLots = AUCTION_LOTS.filter(lot => lot.ends < 86400).slice(0, 3);
    const arenaClosing = document.querySelector('#arena-closing');
    if (arenaClosing) {
      arenaClosing.innerHTML = closingLots.map(lot => `
        <a href="lot.html?lot=${encodeURIComponent(lot.id)}">
          <span>LOT ${lot.number} / ${Formatters.status(lot.ends)}</span>
          <strong>${lot.title}</strong>
          <small>${Formatters.clock(lot.ends)} remaining ↗</small>
        </a>
      `.trim()).join('');
    }

    // Spotlight Closing Countdown
    let secondsLeft = featured.ends;
    const closingLabel = document.querySelector('#arena-featured-closing');

    function tickClosing() {
      if (!closingLabel) return;
      closingLabel.textContent = secondsLeft > 0
        ? `CLOSING IN ${Formatters.clock(secondsLeft)}`
        : 'CLOSED / DEMONSTRATION';

      if (secondsLeft > 0) secondsLeft -= 1;
    }

    tickClosing();
    setInterval(tickClosing, 1000);

    Watchlist.bindButtons();
  }

  // ---------------------------------------------------------------------------
  // 10. Editorial Journal Views (journal.html & article.html)
  // ---------------------------------------------------------------------------
  /**
   * WHAT THIS SECTION DOES:
   * -----------------------
   * Renders the luxury editorial publishing section:
   * - `renderArticleCard`: Generates HTML for an individual story card.
   * - `renderJournal`: Manages category tabs (Watches, Art, Automotive, Collecting).
   * - `renderArticle`: Renders the full multi-section story with hero photography,
   *   reading time, and related article links based on URL query `?story=xyz`.
   */
  function renderArticleCard(article, isFeatured) {
    const encodedId = encodeURIComponent(article.id);
    const featuredClass = isFeatured ? ' journal-story-featured' : '';

    return `
      <article class="journal-story${featuredClass}">
        <a class="journal-story-image" href="article.html?story=${encodedId}">
          <img src="${article.image}" alt="${article.title}" loading="lazy">
          <span>${article.category.toUpperCase()}</span>
        </a>
        <div class="journal-story-copy">
          <div class="journal-story-meta">
            <span>${article.category.toUpperCase()}</span>
            <span>${article.readingTime.toUpperCase()}</span>
          </div>
          <h2><a href="article.html?story=${encodedId}">${article.title}</a></h2>
          <p>${article.subtitle}</p>
          <a class="underlined-link" href="article.html?story=${encodedId}">Read the story ↗</a>
        </div>
      </article>
    `.trim();
  }

  function renderJournal() {
    const grid = document.querySelector('#journal-story-grid');
    if (!grid) return; // Exit if not on journal.html

    const filterButtons = Array.from(document.querySelectorAll('[data-journal-filter]'));
    const emptyNotice = document.querySelector('#journal-empty');
    const resultsCount = document.querySelector('#journal-results');

    function renderStories(selectedCategory = 'All Stories') {
      const visibleArticles = selectedCategory === 'All Stories'
        ? JOURNAL_ARTICLES
        : JOURNAL_ARTICLES.filter(item => item.category === selectedCategory);

      grid.innerHTML = visibleArticles.map((article, idx) => {
        const isFeatured = idx === 0 && selectedCategory === 'All Stories';
        return renderArticleCard(article, isFeatured);
      }).join('');

      if (emptyNotice) {
        emptyNotice.hidden = visibleArticles.length > 0;
      }
      if (resultsCount) {
        const countText = String(visibleArticles.length).padStart(2, '0');
        const nounText = visibleArticles.length === 1 ? 'STORY' : 'STORIES';
        resultsCount.textContent = `${countText} ${nounText}`;
      }

      filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.journalFilter === selectedCategory);
      });
    }

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        renderStories(btn.dataset.journalFilter);
      });
    });

    renderStories('All Stories');
  }

  function renderArticle() {
    const articleRoot = document.querySelector('#article-root');
    if (!articleRoot) return; // Exit if not on article.html

    const requestedStory = new URLSearchParams(window.location.search).get('story');
    const article = JOURNAL_ARTICLES.find(item => item.id === requestedStory || (requestedStory && requestedStory.startsWith(item.id)));

    // Story 404 Fallback
    if (!article) {
      document.title = 'Story not found — THE VAULT';
      articleRoot.innerHTML = `
        <section class="article-not-found">
          <p class="eyebrow">THE JOURNAL / STORY NOT FOUND</p>
          <h1>This page is<br><em>still unwritten.</em></h1>
          <p>That story is not part of the current editorial edit. Return to The Journal to continue looking.</p>
          <a class="button button-dark" href="journal.html">Return to The Journal <span>↗</span></a>
        </section>
      `.trim();
      return;
    }

    document.title = `${article.title} — THE VAULT`;

    // Map body sections and paragraphs to semantic HTML
    const bodySectionsHtml = article.body.map(section => `
      <section>
        <h2>${section.heading}</h2>
        ${section.paragraphs.map(p => `<p>${p}</p>`).join('')}
      </section>
    `.trim()).join('');

    // Fetch related articles
    const relatedArticles = article.related
      .map(relId => JOURNAL_ARTICLES.find(item => item.id === relId))
      .filter(Boolean);

    const relatedGridHtml = relatedArticles
      .map(item => renderArticleCard(item, false))
      .join('');

    // Inject editorial reading template
    articleRoot.innerHTML = `
      <div class="article-breadcrumb">
        <a href="index.html">HOME</a>
        <span>/</span>
        <a href="journal.html">THE JOURNAL</a>
        <span>/</span>
        <span>${article.category.toUpperCase()}</span>
      </div>
      <article class="journal-article">
        <header class="article-header">
          <div class="article-header-meta">
            <span>${article.category.toUpperCase()}</span>
            <span>${article.readingTime.toUpperCase()}</span>
          </div>
          <h1>${article.title}</h1>
          <p class="article-subtitle">${article.subtitle}</p>
        </header>
        <figure class="article-hero">
          <img src="${article.image}" alt="${article.title}">
          <figcaption>${article.caption} / THE VAULT EDITORIAL DEMONSTRATION</figcaption>
        </figure>
        <div class="article-body">
          ${bodySectionsHtml}
        </div>
      </article>
      <section class="article-related">
        <div class="journal-section-heading">
          <p class="eyebrow">THE JOURNAL / CONTINUE READING</p>
          <a class="underlined-link" href="journal.html">View all stories ↗</a>
        </div>
        <div class="article-related-grid">
          ${relatedGridHtml}
        </div>
      </section>
    `.trim();
  }

  // ---------------------------------------------------------------------------
  // 11. Correspondence Form View (contact.html)
  // ---------------------------------------------------------------------------
  /**
   * WHAT RENDERCONTACT() DOES:
   * --------------------------
   * Controls the Contact & Enquiries page (contact.html):
   * 1. Validates user input before submission using client-side JavaScript.
   * 2. Tests email validity with a Regular Expression (RegEx).
   * 3. Sets accessibility attributes (`aria-invalid="true"`) for screen readers.
   * 4. Shows clear error messages beneath each invalid field.
   * 5. Displays a confirmation notice when valid.
   */
  function renderContact() {
    const form = document.querySelector('#contact-form');
    if (!form) return; // Exit if not on contact.html

    const fields = {
      name: form.querySelector('#contact-name'),
      email: form.querySelector('#contact-email'),
      type: form.querySelector('#contact-type'),
      subject: form.querySelector('#contact-subject'),
      message: form.querySelector('#contact-message')
    };

    const errors = {
      name: form.querySelector('#name-error'),
      email: form.querySelector('#email-error'),
      type: form.querySelector('#type-error'),
      subject: form.querySelector('#subject-error'),
      message: form.querySelector('#message-error')
    };

    const confirmation = document.querySelector('#contact-confirmation');
    // Standard email validation regular expression: [chars]@[domain].[extension]
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setFieldError(fieldKey, message) {
      const field = fields[fieldKey];
      const errorEl = errors[fieldKey];
      const hasError = Boolean(message);

      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = !hasError;
      }

      if (field) {
        field.setAttribute('aria-invalid', String(hasError));
        field.classList.toggle('has-error', hasError);
      }
    }

    function clearAllErrors() {
      Object.keys(fields).forEach(key => setFieldError(key, ''));
    }

    function validateForm() {
      const errorMap = {};

      if (!fields.name.value.trim()) {
        errorMap.name = 'Please enter your full name.';
      }
      if (!emailPattern.test(fields.email.value.trim())) {
        errorMap.email = 'Enter a valid email address.';
      }
      if (!fields.type.value) {
        errorMap.type = 'Choose an enquiry type.';
      }
      if (!fields.subject.value.trim()) {
        errorMap.subject = 'Add a subject for your enquiry.';
      }
      if (!fields.message.value.trim()) {
        errorMap.message = 'Tell us a little more about your enquiry.';
      }

      Object.keys(fields).forEach(key => {
        setFieldError(key, errorMap[key] || '');
      });

      return errorMap;
    }

    // Direction shortcut buttons (e.g. "Consignment", "Private acquisition")
    document.querySelectorAll('[data-contact-type]').forEach(button => {
      button.addEventListener('click', () => {
        fields.type.value = button.dataset.contactType;
        Array.from(fields.type.options).forEach(opt => {
          if (opt.value === button.dataset.contactType) {
            opt.selected = true;
            opt.setAttribute('selected', 'selected');
          } else {
            opt.selected = false;
            opt.removeAttribute('selected');
          }
        });
        fields.type.dispatchEvent(new Event('change', { bubbles: true }));
        fields.type.dispatchEvent(new Event('input', { bubbles: true }));
        setFieldError('type', '');
        fields.type.focus();
      });
    });

    // Real-time revalidation on user typing
    Object.keys(fields).forEach(key => {
      fields[key]?.addEventListener('input', () => {
        if (fields[key].getAttribute('aria-invalid') === 'true') {
          validateForm();
        }
      });
    });

    // Form submit listener
    form.addEventListener('submit', event => {
      // Prevent browser default full-page reload
      event.preventDefault();
      if (confirmation) confirmation.hidden = true;

      const validationErrors = validateForm();
      const errorKeys = Object.keys(validationErrors);

      // If errors exist, focus the first invalid field
      if (errorKeys.length > 0) {
        fields[errorKeys[0]]?.focus();
        return;
      }

      // Display success message
      if (confirmation) {
        confirmation.hidden = false;
        confirmation.classList.add('visible');
      }
    });

    // Reset button handling
    form.addEventListener('reset', () => {
      window.setTimeout(() => {
        clearAllErrors();
        if (confirmation) {
          confirmation.hidden = true;
          confirmation.classList.remove('visible');
        }
      }, 0);
    });
  }

  // ---------------------------------------------------------------------------
  // 12. Navigation & Global Interactions
  // ---------------------------------------------------------------------------
  /**
   * WHAT THIS SECTION DOES:
   * -----------------------
   * 1. Mobile Hamburger Menu Toggle: Handles aria-expanded state and open class.
   * 2. Smooth Scroll to Top: Intercepts clicks on .back-top links.
   * 3. Demo Account Fallback: Informs user if auth is not initialized.
   */
  function setupMobileNavigation() {
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (!toggleButton || !mainNav) return;

    toggleButton.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('open');
      toggleButton.setAttribute('aria-expanded', String(isOpen));
      toggleButton.textContent = isOpen ? '×' : '☰';
    });
  }

  function setupSmoothScroll() {
    document.querySelectorAll('a.back-top').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  function setupDemoAccountFallback() {
    // If Supabase client is loaded, it manages account navigation dynamically.
    if (window.vaultAuth) return;

    document.querySelectorAll('[data-demo-account]').forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        alert('Account registration and login will be implemented in the next development phase.');
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 13. Application Bootstrap
  // ---------------------------------------------------------------------------
  /**
   * WHAT BOOTSTRAP DOES:
   * --------------------
   * Master initialization function called when the DOM is ready.
   * It initializes global navigation and invokes each page renderer.
   * Each renderer checks for its own DOM anchor elements (e.g., #auction-grid for explore,
   * #lot-title for lot details, #contact-form for contact), ensuring that only
   * the appropriate controller runs on each page.
   */
  async function bootstrap() {
    setupMobileNavigation();
    setupSmoothScroll();
    await renderExplore();
    await renderLot();
    renderHome();
    renderArena();
    renderJournal();
    renderArticle();
    renderContact();
    Watchlist.bindButtons();
    setupDemoAccountFallback();
  }

  // Check document loading state to guarantee the DOM is parsed before running
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  /**
   * GLOBAL EXPORTS & OBJECT FREEZING:
   * ---------------------------------
   * We attach our controller to `window.VaultApp` so other scripts or unit tests
   * can inspect it.
   * 
   * VIVA CONCEPT: Object.freeze()
   * Prevents any external code from modifying, adding, or deleting properties
   * on the exported VaultApp object, ensuring runtime immutability and security.
   */
  window.VaultApp = Object.freeze({
    lots: AUCTION_LOTS,
    sampleLots: SAMPLE_AUCTION_LOTS,
    catalogue: CatalogueService,
    articles: JOURNAL_ARTICLES,
    formatters: Formatters,
    watchlist: Watchlist,
    createBidDesk,
    init: bootstrap
  });

  // Export historical identifiers for script-level backwards compatibility
  window.auctionLots = AUCTION_LOTS;
  window.journalArticles = JOURNAL_ARTICLES;
  window.money = money;
})();
