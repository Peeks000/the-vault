// THE VAULT — Client Application Controller (app.js)
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Static Demonstration Archive (Offline Fallback)
  // ---------------------------------------------------------------------------
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
      estimate: '₹35,000 – ₹60,000',
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
      id: 'jewellery-material',
      category: 'Jewellery',
      title: 'Jewellery: Beyond the Precious Material',
      subtitle: 'Why the meaning of a piece is found in proportion, gesture and the life it gathers around itself.',
      image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1400&q=88',
      readingTime: '4 min read',
      caption: 'Material is only the beginning of a piece’s presence.',
      related: ['mechanical-watchmaking', 'collector-eye'],
      body: [
        {
          heading: 'More than rarity',
          paragraphs: [
            'The value of jewellery is easy to reduce to a list of materials. Yet a piece becomes memorable through more than what it contains. Its scale, balance and relationship to the body determine how it is worn and how it is remembered.',
            'A small shift in proportion can change the character of a necklace or ring completely. The best pieces allow material to support the gesture rather than overwhelm it.'
          ]
        },
        {
          heading: 'The language of wear',
          paragraphs: [
            'Jewellery lives close to the person who wears it. It catches light, gathers small traces of use and moves through ordinary moments. That proximity gives it a particular emotional register: less object on display, more object in conversation with a life.',
            'This is why restraint can be so powerful. A considered surface or an unexpected line may say more than abundance, because it leaves room for the wearer to become part of the composition.'
          ]
        },
        {
          heading: 'An object with a future',
          paragraphs: [
            'To look beyond the precious material is to notice the decisions that make a piece feel lasting. Craft, proportion and adaptability give jewellery a future beyond its first impression.'
          ]
        }
      ]
    },
    {
      id: 'collector-eye',
      category: 'Collecting',
      title: "The Collector's Eye: What Makes an Object Timeless?",
      subtitle: 'Timelessness is less about age than the ability to keep rewarding attention.',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1400&q=88',
      readingTime: '5 min read',
      caption: 'A useful object can become a lasting one through attention.',
      related: ['fine-art-language', 'jewellery-material'],
      body: [
        {
          heading: 'The first encounter',
          paragraphs: [
            'Some objects are understood immediately. Others become interesting only after a second look. The difference is often not rarity, but density: the number of decisions, details and possibilities held within a form.',
            'A collector’s eye learns to notice that density. It looks for the quality of a surface, the logic of a handle, the way a line continues around an edge.'
          ]
        },
        {
          heading: 'Time as a collaborator',
          paragraphs: [
            'Timelessness is not the absence of a particular period. It is the ability of an object to carry its period without being trapped by it. Materials age, tastes shift and contexts change; a strong object keeps its internal clarity.',
            'That clarity allows it to enter a new room without losing its original voice. It does not need to be neutral. It needs to be specific enough to remain itself.'
          ]
        },
        {
          heading: 'Keeping with intention',
          paragraphs: [
            'Collecting is a form of editing. The objects that stay are usually the ones that continue to offer a question, a sensation or a useful reminder. Their place is earned slowly, through repeated attention.'
          ]
        }
      ]
    },
    {
      id: 'classic-automobiles',
      category: 'Automobiles',
      title: 'The Design Legacy of Classic Automobiles',
      subtitle: 'When proportion, movement and purpose combine, a car becomes more than a machine.',
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=88',
      readingTime: '6 min read',
      caption: 'A lasting silhouette carries its era without being confined by it.',
      related: ['collector-eye', 'fine-art-language'],
      body: [
        {
          heading: 'A silhouette in motion',
          paragraphs: [
            'The first impression of a classic automobile is often its stance. Before the engine turns or the door opens, proportion has already suggested speed, comfort or intent. The relationship between cabin, bonnet and wheels becomes a kind of visual grammar.',
            'That grammar is why some cars remain recognisable from a distance. Their forms are not decoration added to a machine; they are the expression of what the machine was made to do.'
          ]
        },
        {
          heading: 'Purpose made visible',
          paragraphs: [
            'Good automotive design makes function visible without becoming literal. An intake, curve or crease can be necessary and beautiful at once. The result feels resolved because the practical and the expressive belong to the same decision.',
            'Classic examples are especially revealing because their technologies are no longer invisible to us. We can see how designers balanced limitation and ambition, material and movement.'
          ]
        },
        {
          heading: 'The road ahead',
          paragraphs: [
            'A lasting automobile does not ask to be preserved in stillness. Its design carries the memory of motion. That is part of its appeal as a collectible: it brings an entire idea of travel, craft and possibility into the room.'
          ]
        }
      ]
    }
  ];

  // ---------------------------------------------------------------------------
  // 2. DOM & Formatting Helpers
  // ---------------------------------------------------------------------------
  const q = sel => document.querySelector(sel);
  const setText = (sel, val) => { const el = q(sel); if (el) el.textContent = val; };

  const Formatters = {
    currency: val => '₹' + Number(val).toLocaleString('en-IN'),
    clock(sec) {
      const s = Math.max(0, Math.floor(sec));
      return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(u => String(u).padStart(2, '0')).join(':');
    },
    status(lotOrSec) {
      const s = (typeof lotOrSec === 'object' && lotOrSec) ? lotOrSec.ends : Number(lotOrSec);
      return s < 4 * 3600 ? 'CLOSING SOON' : s < 86400 ? 'LIVE TODAY' : 'UPCOMING';
    },
    closing(lotOrSec) {
      const s = (typeof lotOrSec === 'object' && lotOrSec) ? lotOrSec.ends : Number(lotOrSec);
      return s < 86400 ? 'Closes today' : `Closes in ${Math.ceil(s / 86400)} days`;
    }
  };
  const money = Formatters.currency;

  // ---------------------------------------------------------------------------
  // 3. Watchlist Manager (localStorage)
  // ---------------------------------------------------------------------------
  const SAVED_KEY = 'vault-saved-lots';

  const Watchlist = {
    getAll() {
      try {
        const parsed = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    },
    save(items) {
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(items)); } catch {}
      this.updateBadges();
      document.dispatchEvent(new CustomEvent('vault:saved-change', { detail: { saved: items } }));
    },
    has: key => Watchlist.getAll().includes(key),
    toggle(key) {
      const cur = this.getAll();
      const next = cur.includes(key) ? cur.filter(id => id !== key) : [...cur, key];
      this.save(next);
      return next.includes(key);
    },
    updateBadges() {
      const count = this.getAll().length;
      document.querySelectorAll('.saved-count').forEach(el => { el.textContent = count; });
      document.querySelectorAll('#saved-filter-count').forEach(el => { el.textContent = String(count).padStart(2, '0'); });
    },
    bindButtons() {
      const saved = this.getAll();
      document.querySelectorAll('[data-save]').forEach(btn => {
        const key = btn.dataset.save, active = saved.includes(key);
        btn.classList.toggle('saved', active);
        btn.textContent = active ? '♥' : '♡';
        if (btn.dataset.saveBound === 'true') return;
        btn.dataset.saveBound = 'true';
        btn.addEventListener('click', e => {
          e.preventDefault(); e.stopPropagation();
          const nowSaved = this.toggle(key);
          btn.classList.toggle('saved', nowSaved);
          btn.textContent = nowSaved ? '♥' : '♡';
        });
      });
      this.updateBadges();
    }
  };

  // ---------------------------------------------------------------------------
  // 4. Simulated Bidding Desk (sessionStorage)
  // ---------------------------------------------------------------------------
  const BIDS_KEY = 'vault-demo-bids';
  const getSessionBids = () => { try { return JSON.parse(sessionStorage.getItem(BIDS_KEY) || '{}'); } catch { return {}; } };
  const setSessionBid = (lotId, price, bidCount) => {
    try {
      const map = getSessionBids();
      map[lotId] = { price, bidCount, timestamp: Date.now() };
      sessionStorage.setItem(BIDS_KEY, JSON.stringify(map));
    } catch {}
  };

  function createBidDesk({ lotId, initialPrice, initialBids, increment = 5000, onBidAccepted }) {
    const stored = lotId ? getSessionBids()[lotId] : null;
    let currentPrice = stored ? stored.price : initialPrice;
    let bidCount = stored ? stored.bidCount : initialBids;

    const getMinimumBid = () => currentPrice + increment;
    const getValidationError = amt => {
      if (!Number.isFinite(amt) || amt <= 0) return `Enter a bid of at least ${money(getMinimumBid())}.`;
      if (amt < getMinimumBid() || (amt - currentPrice) % increment !== 0) {
        return `Enter a bid of at least ${money(getMinimumBid())} in increments of ${money(increment)}.`;
      }
      return '';
    };

    return {
      getCurrentPrice: () => currentPrice,
      getBidCount: () => bidCount,
      getMinimumBid,
      getIncrement: () => increment,
      getValidationError,
      isValid: amt => getValidationError(amt) === '',
      recordBid(amt) {
        if (getValidationError(amt)) return false;
        currentPrice = amt;
        bidCount += 1;
        if (lotId) setSessionBid(lotId, currentPrice, bidCount);
        onBidAccepted?.(currentPrice, bidCount);
        return true;
      },
      getSimulatedHistory: () => [currentPrice, currentPrice - increment, currentPrice - increment * 2].filter(v => v > 0)
    };
  }

  // Shared UI binder used by both Lot Detail and Arena views
  function attachBidDeskUI({ lot, inputEl, buttonEl, feedbackEl, historyEl, feedbackBaseClass, onUpdate, formatHistoryRow, userRowHtml }) {
    const desk = createBidDesk({
      lotId: lot.id, initialPrice: lot.price, initialBids: lot.bids, increment: 5000,
      onBidAccepted: (price, count) => {
        onUpdate(price, count, desk);
        if (inputEl) { inputEl.min = desk.getMinimumBid(); inputEl.value = desk.getMinimumBid(); }
      }
    });

    onUpdate(desk.getCurrentPrice(), desk.getBidCount(), desk);
    if (inputEl) {
      inputEl.min = desk.getMinimumBid();
      inputEl.step = desk.getIncrement();
      inputEl.value = desk.getMinimumBid();
    }

    if (historyEl) {
      historyEl.innerHTML = desk.getSimulatedHistory().map((val, idx) =>
        formatHistoryRow(val, String(lot.bids - idx).padStart(2, '0'), idx === 0 ? 'Just now' : `${(idx + 1) * 12} min ago`)
      ).join('');
    }

    buttonEl?.addEventListener('click', () => {
      const amount = Number(inputEl?.value);
      const err = desk.getValidationError(amount);
      if (err) {
        if (feedbackEl) { feedbackEl.textContent = err; feedbackEl.className = `${feedbackBaseClass} error`; }
        return;
      }
      desk.recordBid(amount);
      if (historyEl) historyEl.insertAdjacentHTML('afterbegin', userRowHtml(amount));
      if (feedbackEl) {
        feedbackEl.textContent = 'Demo bid accepted in this browser. No real bid or payment has been submitted.';
        feedbackEl.className = `${feedbackBaseClass} success`;
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 5. Catalogue Service (Supabase Fetch + Offline Fallback)
  // ---------------------------------------------------------------------------
  const SAMPLE_AUCTION_LOTS = AUCTION_LOTS;

  function mapDatabaseLotToLot(row) {
    const imgs = (Array.isArray(row.lot_images) ? [...row.lot_images] : [])
      .sort((a, b) => (b.is_primary - a.is_primary) || ((a.sort_order || 0) - (b.sort_order || 0)));
    const primary = imgs[0]?.image_url || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=85';
    const ends = row.ends_at ? Math.max(0, Math.floor((new Date(row.ends_at) - Date.now()) / 1000)) : 86400;
    const id = row.legacy_id || row.id;
    const est = row.estimate_low && row.estimate_high ? `${money(row.estimate_low)} – ${money(row.estimate_high)}`
      : row.estimate_low ? `From ${money(row.estimate_low)}` : 'Estimate upon request';

    const stored = getSessionBids()[id];
    return {
      id, dbId: row.id, key: `lot-${id}`,
      number: (row.lot_number || '').replace(/^LOT\s*/i, '').trim() || '001',
      category: row.category || 'Objects', period: row.period || 'Contemporary',
      title: row.title, subtitle: row.subtitle || '',
      price: stored ? stored.price : (Number(row.current_bid) || 0),
      bids: stored ? stored.bidCount : (Number(row.bid_count) || 0),
      estimate: est, ends, image: primary,
      gallery: imgs.length ? imgs.map(i => i.image_url) : [primary],
      story: row.description || '', status: row.status, isDatabase: true
    };
  }

  const CatalogueService = {
    cachedLots: null,
    fetchPromise: null,
    async getLots() {
      if (this.cachedLots) return this.cachedLots;
      if (this.fetchPromise) return this.fetchPromise;

      this.fetchPromise = (async () => {
        const client = window.vaultAuth?.client;
        if (!client) return (this.cachedLots = SAMPLE_AUCTION_LOTS);
        try {
          const { data, error } = await client
            .from('auction_lots')
            .select('id, legacy_id, lot_number, category, period, title, subtitle, description, estimate_low, estimate_high, current_bid, bid_count, ends_at, status, published_at, lot_images(image_url, alt_text, is_primary, sort_order)')
            .in('status', ['scheduled', 'live', 'closed'])
            .not('published_at', 'is', null)
            .order('created_at', { ascending: false });

          this.cachedLots = (!error && data?.length) ? data.map(mapDatabaseLotToLot) : SAMPLE_AUCTION_LOTS;
          return this.cachedLots;
        } catch {
          return (this.cachedLots = SAMPLE_AUCTION_LOTS);
        } finally {
          this.fetchPromise = null;
        }
      })();
      return this.fetchPromise;
    },
    async getLotById(reqId) {
      const all = await this.getLots();
      const findMatch = list => list.find(i => i.id === reqId || (reqId && (reqId.startsWith(i.id) || i.id.startsWith(reqId))));
      return findMatch(all) || findMatch(SAMPLE_AUCTION_LOTS) || (!reqId ? all[0] || SAMPLE_AUCTION_LOTS[0] : null);
    }
  };

  // ---------------------------------------------------------------------------
  // 6. Explore Catalog View (explore.html)
  // ---------------------------------------------------------------------------
  async function renderExplore() {
    const grid = q('#auction-grid');
    if (!grid) return;

    const params = new URLSearchParams(window.location.search);
    let activeCategory = params.get('category') || 'All';
    let savedOnly = params.get('saved') === 'true';
    let searchQuery = '', sortMode = 'curated';
    let activeCatalogue = SAMPLE_AUCTION_LOTS;

    const filterBtns = Array.from(document.querySelectorAll('[data-filter]'));
    const searchInput = q('#lot-search'), sortSelect = q('#lot-sort'), savedFilter = q('#saved-filter');
    if (savedOnly && savedFilter) savedFilter.scrollIntoView({ block: 'center' });

    function renderList() {
      const savedKeys = Watchlist.getAll();
      let visible = activeCatalogue.filter(lot =>
        (activeCategory === 'All' || lot.category.toLowerCase() === activeCategory.toLowerCase()) &&
        (!savedOnly || savedKeys.includes(lot.key)) &&
        `${lot.title} ${lot.category} ${lot.period} ${lot.number}`.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (sortMode === 'ending') visible.sort((a, b) => a.ends - b.ends);
      else if (sortMode === 'bid-low') visible.sort((a, b) => a.price - b.price);
      else if (sortMode === 'bid-high') visible.sort((a, b) => b.price - a.price);

      grid.innerHTML = visible.map((lot, idx) => {
        const statusText = Formatters.status(lot.ends), isSaved = savedKeys.includes(lot.key);
        const url = `lot.html?lot=${encodeURIComponent(lot.id)}`;
        return `
          <article class="lot-card editorial-lot editorial-lot-${idx + 1}">
            <a class="lot-image" href="${url}">
              <img src="${lot.image}" alt="${lot.title}" loading="lazy">
              <span class="lot-number">LOT ${lot.number}</span>
              <span class="lot-status ${statusText === 'CLOSING SOON' ? 'urgent' : ''}">${statusText}</span>
              <button class="lot-save ${isSaved ? 'saved' : ''}" data-save="${lot.key}" aria-label="${isSaved ? 'Remove' : 'Save'} ${lot.title}">${isSaved ? '♥' : '♡'}</button>
            </a>
            <div class="lot-copy">
              <div class="lot-info">
                <div><p class="lot-category">${lot.category.toUpperCase()} / ${lot.period.toUpperCase()}</p><h3><a href="${url}">${lot.title}</a></h3></div>
                <div class="lot-price"><span>Current bid</span><strong>${money(lot.price)}</strong></div>
              </div>
              <div class="lot-meta"><span>${lot.bids} bids</span><span>${Formatters.closing(lot.ends)}</span><span>Est. ${lot.estimate}</span></div>
              <div class="lot-card-foot"><span>LOT ${lot.number}</span><a href="${url}">View lot ↗</a></div>
            </div>
          </article>`;
      }).join('');

      setText('#results-count', `SHOWING ${String(visible.length).padStart(2, '0')} ${savedOnly ? 'SAVED ' : 'SELECTED '}${visible.length === 1 ? 'LOT' : 'LOTS'}`);
      setText('#explore-edit-count', String(activeCatalogue.length).padStart(2, '0'));
      setText('#saved-filter-count', String(savedKeys.length).padStart(2, '0'));
      if (q('#empty-state')) q('#empty-state').hidden = visible.length > 0;
      const emptyP = q('#empty-state p');
      if (emptyP) emptyP.textContent = savedOnly ? 'Save a lot from the collection to begin building your edit.' : 'Try another category or search term.';
      savedFilter?.classList.toggle('active', savedOnly);
      Watchlist.bindButtons();
    }

    document.addEventListener('vault:saved-change', () => { if (savedOnly) renderList(); });
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === activeCategory);
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.filter; savedOnly = false;
        filterBtns.forEach(b => b.classList.toggle('active', b === btn));
        renderList();
      });
    });

    searchInput?.addEventListener('input', e => { searchQuery = e.target.value; renderList(); });
    sortSelect?.addEventListener('change', e => { sortMode = e.target.value; renderList(); });
    savedFilter?.addEventListener('click', () => {
      savedOnly = !savedOnly; activeCategory = 'All';
      filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'All'));
      renderList();
    });
    q('#clear-filters')?.addEventListener('click', () => {
      activeCategory = 'All'; savedOnly = false; searchQuery = ''; sortMode = 'curated';
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'curated';
      filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'All'));
      renderList();
    });

    renderList();
    CatalogueService.getLots().then(lots => { if (lots?.length) { activeCatalogue = lots; renderList(); } });
  }

  // ---------------------------------------------------------------------------
  // 7. Lot Detail View (lot.html)
  // ---------------------------------------------------------------------------
  async function renderLot() {
    const titleEl = q('#lot-title');
    if (!titleEl) return;

    const lot = await CatalogueService.getLotById(new URLSearchParams(window.location.search).get('lot'));
    if (!lot) {
      document.title = 'Lot not found — THE VAULT';
      ['.lot-detail-grid', '.lot-details-section', '.similar-lots-section'].forEach(s => { if (q(s)) q(s).hidden = true; });
      if (q('#lot-not-found')) q('#lot-not-found').hidden = false;
      return;
    }

    const gallery = lot.gallery?.length ? lot.gallery : (lot.id === 'watch'
      ? [lot.image, 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1400&q=90', 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1400&q=90']
      : [lot.image]);

    document.title = `${lot.title} — THE VAULT`;
    titleEl.innerHTML = `${lot.title.replace(' ', '<br>')}<em>.</em>`;
    setText('#lot-breadcrumb', `LOT ${lot.number}`);
    setText('#lot-category', `${lot.category.toUpperCase()} / LOT ${lot.number}`);
    setText('#lot-subtitle', lot.subtitle);
    setText('#lot-estimate', lot.estimate);
    setText('#lot-number', `LOT ${lot.number}`);
    setText('#lot-period', lot.period);
    setText('#detail-period', lot.period);
    setText('#lot-story-copy', lot.story);
    setText('#detail-description', lot.story);
    setText('#lot-status-label', Formatters.status(lot.ends));
    setText('.gallery-stamp', `THE VAULT / LOT ${lot.number}`);
    if (q('#lot-story-heading')) q('#lot-story-heading').innerHTML = `${lot.category}, <em>considered.</em>`;

    const mainImg = q('#lot-image');
    if (mainImg) { mainImg.src = gallery[0]; mainImg.alt = lot.title; }

    const thumbs = q('#gallery-thumbs');
    if (thumbs) {
      thumbs.innerHTML = gallery.map((src, i) =>
        `<button class="thumb${i === 0 ? ' active' : ''}" data-image="${src}" aria-label="View image ${i + 1}"><img src="${src.replace('w=1400', 'w=250')}" alt="${lot.title}, view ${i + 1}"></button>`
      ).join('') + '<span>SELECT AN IMAGE TO VIEW</span>';
      thumbs.querySelectorAll('.thumb').forEach(btn => btn.addEventListener('click', () => {
        thumbs.querySelectorAll('.thumb').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (mainImg) mainImg.src = btn.dataset.image;
      }));
    }

    // Lightbox modal
    const lb = q('#image-lightbox'), lbImg = q('#lightbox-image');
    if (lb && lbImg && q('#image-expand')) {
      const closeLb = () => { lb.hidden = true; document.body.classList.remove('lightbox-open'); };
      q('#image-expand').addEventListener('click', () => {
        lbImg.src = mainImg ? mainImg.src : gallery[0]; lbImg.alt = lot.title;
        lb.hidden = false; document.body.classList.add('lightbox-open');
      });
      q('#lightbox-close')?.addEventListener('click', closeLb);
      lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    }

    // Bid desk
    attachBidDeskUI({
      lot, inputEl: q('#bid-amount'), buttonEl: q('#place-bid'),
      feedbackEl: q('#bid-feedback'), historyEl: q('#bid-history-list'), feedbackBaseClass: 'bid-feedback',
      onUpdate: (price, count, desk) => {
        setText('#current-bid', money(price));
        setText('#bid-count', String(count).padStart(2, '0'));
        setText('#bid-increment', money(desk.getIncrement()));
      },
      formatHistoryRow: (val, num, ago) => `<div class="history-row"><span><b>Bidder ${num}</b><small>${ago} · simulated</small></span><strong>${money(val)}</strong></div>`,
      userRowHtml: amt => `<div class="history-row"><span><b>You (session bidder)</b><small>Just now · demonstration</small></span><strong>${money(amt)}</strong></div>`
    });

    const saveBtn = q('#save-detail');
    if (saveBtn) {
      const syncSave = () => {
        const saved = Watchlist.has(lot.key);
        saveBtn.classList.toggle('saved', saved);
        saveBtn.innerHTML = saved ? '♥ <span>Saved</span>' : '♡ <span>Save lot</span>';
      };
      saveBtn.addEventListener('click', () => { Watchlist.toggle(lot.key); syncSave(); });
      syncSave();
    }
    Watchlist.updateBadges();

    // Similar lots
    if (q('#similar-lots-grid')) {
      CatalogueService.getLots().then(all => {
        q('#similar-lots-grid').innerHTML = all
          .filter(i => i.id !== lot.id && i.category.toLowerCase() === lot.category.toLowerCase())
          .slice(0, 3)
          .map(i => `<article class="similar-lot"><a href="lot.html?lot=${encodeURIComponent(i.id)}"><img src="${i.image}" alt="${i.title}" loading="lazy"><span>LOT ${i.number} / ${i.category.toUpperCase()}</span></a><h3><a href="lot.html?lot=${encodeURIComponent(i.id)}">${i.title}</a></h3><p>${money(i.price)} / ${i.bids} bids</p></article>`)
          .join('');
      });
    }

    let left = lot.ends;
    const tick = () => { setText('#countdown', Formatters.clock(left)); if (left > 0) left -= 1; };
    tick();
    setInterval(tick, 1000);
  }

  // ---------------------------------------------------------------------------
  // 8. Homepage View (index.html)
  // ---------------------------------------------------------------------------
  function renderHome() {
    const liveGrid = q('#home-live-grid');
    if (!liveGrid) return;

    const featured = AUCTION_LOTS[0], url = `lot.html?lot=${encodeURIComponent(featured.id)}`;
    if (q('#featured-link')) q('#featured-link').href = url;
    if (q('.hero-object')) q('.hero-object').href = url;
    if (q('#featured-action')) q('#featured-action').href = url;
    if (q('#featured-image')) { q('#featured-image').src = featured.image; q('#featured-image').alt = featured.title; }
    if (q('#featured-save')) q('#featured-save').dataset.save = featured.key;

    setText('#featured-status', Formatters.status(featured.ends));
    setText('#featured-lot-number', `LOT ${featured.number}`);
    setText('#featured-category', `${featured.category.toUpperCase()} / ${featured.period}`);
    setText('#featured-title', featured.title);
    setText('#featured-subtitle', featured.subtitle);
    setText('#featured-estimate', featured.estimate);
    setText('#featured-bid', money(featured.price));
    setText('#featured-bids', `${String(featured.bids).padStart(2, '0')} BIDS`);
    setText('#featured-closing', Formatters.closing(featured.ends));

    liveGrid.innerHTML = AUCTION_LOTS.slice(1, 4).map(lot => {
      const status = Formatters.status(lot.ends), lotUrl = `lot.html?lot=${encodeURIComponent(lot.id)}`;
      return `
        <article class="home-live-card">
          <div class="home-live-image">
            <a href="${lotUrl}"><img src="${lot.image}" alt="${lot.title}" loading="lazy"></a>
            <span class="lot-number">LOT ${lot.number}</span>
            <span class="lot-status ${status === 'CLOSING SOON' ? 'urgent' : ''}">${status}</span>
            <button class="lot-save" data-save="${lot.key}" aria-label="Save ${lot.title}">♡</button>
          </div>
          <div class="home-live-info">
            <p class="lot-category">${lot.category.toUpperCase()} / ${lot.period}</p>
            <h3><a href="${lotUrl}">${lot.title}</a></h3>
            <div class="home-live-data"><span>CURRENT BID<strong>${money(lot.price)}</strong></span><span>ESTIMATE<strong>${lot.estimate}</strong></span></div>
            <div class="home-live-foot"><span>${lot.bids} BIDS / ${Formatters.closing(lot.ends)}</span><a href="${lotUrl}">View lot ↗</a></div>
          </div>
        </article>`;
    }).join('');
    Watchlist.bindButtons();
  }

  // ---------------------------------------------------------------------------
  // 9. Arena Live Simulation View (arena.html)
  // ---------------------------------------------------------------------------
  function renderArena() {
    const floor = q('#arena-floor');
    if (!floor) return;

    const liveLots = AUCTION_LOTS.filter(l => l.ends > 0 && l.ends < 86400).sort((a, b) => a.ends - b.ends);
    const activeLots = AUCTION_LOTS.filter(l => l.ends > 0);
    const reqLot = AUCTION_LOTS.find(l => l.id === new URLSearchParams(window.location.search).get('lot'));
    const featured = reqLot || liveLots[0] || activeLots[0];
    const url = `lot.html?lot=${encodeURIComponent(featured.id)}`;

    setText('#arena-active-count', String(liveLots.length).padStart(2, '0'));
    if (q('#arena-featured-link')) q('#arena-featured-link').href = url;
    if (q('#arena-featured-action')) q('#arena-featured-action').href = url;
    if (q('#arena-featured-image')) { q('#arena-featured-image').src = featured.image; q('#arena-featured-image').alt = featured.title; }
    if (q('#arena-featured-save')) q('#arena-featured-save').dataset.save = featured.key;

    setText('#arena-featured-number', `LOT ${featured.number}`);
    setText('#arena-featured-category', featured.category.toUpperCase());
    setText('#arena-featured-status', Formatters.status(featured.ends));
    setText('#arena-featured-title', featured.title);
    setText('#arena-featured-subtitle', featured.subtitle);
    setText('#arena-featured-estimate', featured.estimate);

    attachBidDeskUI({
      lot: featured, inputEl: q('#arena-bid-amount'), buttonEl: q('#arena-place-bid'),
      feedbackEl: q('#arena-feedback'), historyEl: q('#arena-history-list'), feedbackBaseClass: 'arena-feedback',
      onUpdate: (price, count, desk) => {
        setText('#arena-featured-bid', money(price));
        setText('#arena-current-bid', money(price));
        setText('#arena-featured-bids', String(count).padStart(2, '0'));
        setText('#arena-min-bid', money(desk.getMinimumBid()));
        setText('#arena-increment', money(desk.getIncrement()));
      },
      formatHistoryRow: (val, num, ago) => `<div><span>Bidder ${num}<small>${ago} · simulated</small></span><strong>${money(val)}</strong></div>`,
      userRowHtml: amt => `<div><span>You / demo bidder<small>Just now · session active</small></span><strong>${money(amt)}</strong></div>`
    });

    const roomLots = activeLots.filter(l => l.id !== featured.id);
    floor.innerHTML = roomLots.map((lot, idx) => {
      const status = Formatters.status(lot.ends), enc = encodeURIComponent(lot.id);
      return `
        <article class="arena-floor-lot arena-floor-lot-${idx + 1}">
          <div class="arena-floor-image">
            <a href="lot.html?lot=${enc}"><img src="${lot.image}" alt="${lot.title}" loading="lazy"></a>
            <span>LOT ${lot.number}</span><b class="${status === 'CLOSING SOON' ? 'urgent' : ''}">${status}</b>
            <button class="arena-save" data-save="${lot.key}" aria-label="Save ${lot.title}">♡</button>
          </div>
          <div class="arena-floor-copy">
            <p>${lot.category.toUpperCase()} / ${lot.period}</p>
            <h3><a href="lot.html?lot=${enc}">${lot.title}</a></h3>
            <div><strong>${money(lot.price)}</strong><span>${String(lot.bids).padStart(2, '0')} BIDS / ${lot.ends < 86400 ? Formatters.clock(lot.ends) : 'UPCOMING'}</span></div>
            <a class="arena-select-link" href="arena.html?lot=${enc}">Make featured ↗</a>
          </div>
        </article>`;
    }).join('');
    if (q('#arena-empty')) q('#arena-empty').hidden = roomLots.length > 0;

    if (q('#arena-activity')) {
      q('#arena-activity').innerHTML = activeLots.slice(0, 3).map((l, i) => `
        <article><span>0${i + 1}</span><p>${i === 0 ? `A bid was recorded on <strong>${l.title}</strong>.` : `The room is watching <strong>${l.title}</strong>.`}</p>
        <small>${i === 0 ? `SIMULATED BID / ${money(l.price)}` : `${Formatters.status(l.ends)} / DEMONSTRATION`}</small></article>`).join('');
    }
    if (q('#arena-closing')) {
      q('#arena-closing').innerHTML = AUCTION_LOTS.filter(l => l.ends < 86400).slice(0, 3).map(l =>
        `<a href="lot.html?lot=${encodeURIComponent(l.id)}"><span>LOT ${l.number} / ${Formatters.status(l.ends)}</span><strong>${l.title}</strong><small>${Formatters.clock(l.ends)} remaining ↗</small></a>`).join('');
    }

    let left = featured.ends;
    const tick = () => {
      setText('#arena-featured-closing', left > 0 ? `CLOSING IN ${Formatters.clock(left)}` : 'CLOSED / DEMONSTRATION');
      if (left > 0) left -= 1;
    };
    tick();
    setInterval(tick, 1000);
    Watchlist.bindButtons();
  }

  // ---------------------------------------------------------------------------
  // 10. Editorial Journal Views (journal.html & article.html)
  // ---------------------------------------------------------------------------
  const renderArticleCard = (a, featured) => {
    const url = `article.html?story=${encodeURIComponent(a.id)}`;
    return `
      <article class="journal-story${featured ? ' journal-story-featured' : ''}">
        <a class="journal-story-image" href="${url}"><img src="${a.image}" alt="${a.title}" loading="lazy"><span>${a.category.toUpperCase()}</span></a>
        <div class="journal-story-copy">
          <div class="journal-story-meta"><span>${a.category.toUpperCase()}</span><span>${a.readingTime.toUpperCase()}</span></div>
          <h2><a href="${url}">${a.title}</a></h2><p>${a.subtitle}</p>
          <a class="underlined-link" href="${url}">Read the story ↗</a>
        </div>
      </article>`;
  };

  function renderJournal() {
    const grid = q('#journal-story-grid');
    if (!grid) return;
    const btns = Array.from(document.querySelectorAll('[data-journal-filter]'));

    function show(category = 'All Stories') {
      const items = category === 'All Stories' ? JOURNAL_ARTICLES : JOURNAL_ARTICLES.filter(a => a.category === category);
      grid.innerHTML = items.map((a, i) => renderArticleCard(a, i === 0 && category === 'All Stories')).join('');
      if (q('#journal-empty')) q('#journal-empty').hidden = items.length > 0;
      setText('#journal-results', `${String(items.length).padStart(2, '0')} ${items.length === 1 ? 'STORY' : 'STORIES'}`);
      btns.forEach(b => b.classList.toggle('active', b.dataset.journalFilter === category));
    }
    btns.forEach(b => b.addEventListener('click', () => show(b.dataset.journalFilter)));
    show('All Stories');
  }

  function renderArticle() {
    const root = q('#article-root');
    if (!root) return;
    const req = new URLSearchParams(window.location.search).get('story');
    const article = JOURNAL_ARTICLES.find(a => a.id === req || (req && req.startsWith(a.id)));

    if (!article) {
      document.title = 'Story not found — THE VAULT';
      root.innerHTML = `<section class="article-not-found"><p class="eyebrow">THE JOURNAL / STORY NOT FOUND</p><h1>This page is<br><em>still unwritten.</em></h1><p>That story is not part of the current editorial edit. Return to The Journal to continue looking.</p><a class="button button-dark" href="journal.html">Return to The Journal <span>↗</span></a></section>`;
      return;
    }

    document.title = `${article.title} — THE VAULT`;
    const bodyHtml = article.body.map(s => `<section><h2>${s.heading}</h2>${s.paragraphs.map(p => `<p>${p}</p>`).join('')}</section>`).join('');
    const relatedHtml = article.related.map(id => JOURNAL_ARTICLES.find(a => a.id === id)).filter(Boolean).map(a => renderArticleCard(a, false)).join('');

    root.innerHTML = `
      <div class="article-breadcrumb"><a href="index.html">HOME</a><span>/</span><a href="journal.html">THE JOURNAL</a><span>/</span><span>${article.category.toUpperCase()}</span></div>
      <article class="journal-article">
        <header class="article-header"><div class="article-header-meta"><span>${article.category.toUpperCase()}</span><span>${article.readingTime.toUpperCase()}</span></div><h1>${article.title}</h1><p class="article-subtitle">${article.subtitle}</p></header>
        <figure class="article-hero"><img src="${article.image}" alt="${article.title}"><figcaption>${article.caption} / THE VAULT EDITORIAL DEMONSTRATION</figcaption></figure>
        <div class="article-body">${bodyHtml}</div>
      </article>
      <section class="article-related">
        <div class="journal-section-heading"><p class="eyebrow">THE JOURNAL / CONTINUE READING</p><a class="underlined-link" href="journal.html">View all stories ↗</a></div>
        <div class="article-related-grid">${relatedHtml}</div>
      </section>`;
  }

  // ---------------------------------------------------------------------------
  // 11. Correspondence Form View (contact.html)
  // ---------------------------------------------------------------------------
  function renderContact() {
    const form = q('#contact-form');
    if (!form) return;

    const fields = { name: form.querySelector('#contact-name'), email: form.querySelector('#contact-email'), type: form.querySelector('#contact-type'), subject: form.querySelector('#contact-subject'), message: form.querySelector('#contact-message') };
    const errors = { name: form.querySelector('#name-error'), email: form.querySelector('#email-error'), type: form.querySelector('#type-error'), subject: form.querySelector('#subject-error'), message: form.querySelector('#message-error') };
    const confirmBox = q('#contact-confirmation'), emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const setErr = (k, msg) => {
      if (errors[k]) { errors[k].textContent = msg; errors[k].hidden = !msg; }
      if (fields[k]) { fields[k].setAttribute('aria-invalid', String(Boolean(msg))); fields[k].classList.toggle('has-error', Boolean(msg)); }
    };

    const validate = () => {
      const errs = {};
      if (!fields.name.value.trim()) errs.name = 'Please enter your full name.';
      if (!emailRe.test(fields.email.value.trim())) errs.email = 'Enter a valid email address.';
      if (!fields.type.value) errs.type = 'Choose an enquiry type.';
      if (!fields.subject.value.trim()) errs.subject = 'Add a subject for your enquiry.';
      if (!fields.message.value.trim()) errs.message = 'Tell us a little more about your enquiry.';
      Object.keys(fields).forEach(k => setErr(k, errs[k] || ''));
      return errs;
    };

    document.querySelectorAll('[data-contact-type]').forEach(btn => btn.addEventListener('click', () => {
      fields.type.value = btn.dataset.contactType;
      Array.from(fields.type.options).forEach(o => {
        o.selected = o.value === btn.dataset.contactType;
        if (o.selected) o.setAttribute('selected', 'selected');
        else o.removeAttribute('selected');
      });
      fields.type.dispatchEvent(new Event('change', { bubbles: true }));
      fields.type.dispatchEvent(new Event('input', { bubbles: true }));
      setErr('type', '');
      fields.type.focus();
    }));

    Object.keys(fields).forEach(k => fields[k]?.addEventListener('input', () => { if (fields[k].getAttribute('aria-invalid') === 'true') validate(); }));

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (confirmBox) confirmBox.hidden = true;
      const errs = validate(), keys = Object.keys(errs);
      if (keys.length) return fields[keys[0]]?.focus();
      if (confirmBox) { confirmBox.hidden = false; confirmBox.classList.add('visible'); }
    });

    form.addEventListener('reset', () => setTimeout(() => {
      Object.keys(fields).forEach(k => setErr(k, ''));
      if (confirmBox) { confirmBox.hidden = true; confirmBox.classList.remove('visible'); }
    }, 0));
  }

  // ---------------------------------------------------------------------------
  // 12. Global Navigation & Bootstrap
  // ---------------------------------------------------------------------------
  async function bootstrap() {
    const toggle = q('.mobile-menu-toggle'), nav = q('.main-nav');
    toggle?.addEventListener('click', () => {
      const open = nav?.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '×' : '☰';
    });

    document.querySelectorAll('a.back-top').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));

    await renderExplore();
    await renderLot();
    renderHome();
    renderArena();
    renderJournal();
    renderArticle();
    renderContact();
    Watchlist.bindButtons();

    if (!window.vaultAuth) {
      document.querySelectorAll('[data-demo-account]').forEach(l => l.addEventListener('click', e => {
        e.preventDefault();
        alert('Account registration and login will be implemented in the next development phase.');
      }));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap);
  else bootstrap();

  window.VaultApp = Object.freeze({ lots: AUCTION_LOTS, sampleLots: SAMPLE_AUCTION_LOTS, catalogue: CatalogueService, articles: JOURNAL_ARTICLES, formatters: Formatters, watchlist: Watchlist, createBidDesk, init: bootstrap });
  window.auctionLots = AUCTION_LOTS;
  window.journalArticles = JOURNAL_ARTICLES;
  window.money = money;
})();
