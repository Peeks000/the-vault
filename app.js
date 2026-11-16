/**
 * THE VAULT — Client Application
 *
 * Core interactive controller for catalog exploration, detail views,
 * live auction simulation, editorial journal, and correspondence.
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Data Store
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
  // 2. Formatters & Core Helpers
  // ---------------------------------------------------------------------------

  const Formatters = {
    /**
     * Formats numerical amounts into Indian Rupee currency representations.
     */
    currency(value) {
      return '₹' + Number(value).toLocaleString('en-IN');
    },

    /**
     * Converts seconds into a zero-padded HH:MM:SS digital clock string.
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
     * Computes the high-level urgency badge status for an auction lot.
     * Accepts either remaining seconds or a lot object containing `.ends`.
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
     * Generates human-friendly closing schedules.
     * Accepts either remaining seconds or a lot object containing `.ends`.
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
  // 3. Watchlist / Saved Lots Manager
  // ---------------------------------------------------------------------------

  const SAVED_STORAGE_KEY = 'vault-saved-lots';

  const Watchlist = {
    getAll() {
      try {
        const raw = localStorage.getItem(SAVED_STORAGE_KEY);
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch (err) {
        console.warn('Unable to read saved lots from local storage:', err);
        return [];
      }
    },

    save(items) {
      try {
        localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(items));
      } catch (err) {
        console.warn('Unable to persist saved lots to local storage:', err);
      }
      this.updateBadges();
      document.dispatchEvent(new CustomEvent('vault:saved-change', { detail: { saved: items } }));
    },

    has(lotKey) {
      return this.getAll().includes(lotKey);
    },

    toggle(lotKey) {
      const current = this.getAll();
      const next = current.includes(lotKey)
        ? current.filter(id => id !== lotKey)
        : [...current, lotKey];

      this.save(next);
      return next.includes(lotKey);
    },

    updateBadges() {
      const count = this.getAll().length;
      document.querySelectorAll('.saved-count').forEach(el => {
        el.textContent = count;
      });
      document.querySelectorAll('#saved-filter-count').forEach(el => {
        el.textContent = String(count).padStart(2, '0');
      });
    },

    bindButtons() {
      const savedItems = this.getAll();

      document.querySelectorAll('[data-save]').forEach(button => {
        const key = button.dataset.save;
        const isSaved = savedItems.includes(key);

        button.classList.toggle('saved', isSaved);
        button.textContent = isSaved ? '♥' : '♡';

        if (button.dataset.saveBound === 'true') return;
        button.dataset.saveBound = 'true';

        button.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();

          const active = this.toggle(key);
          button.classList.toggle('saved', active);
          button.textContent = active ? '♥' : '♡';
        });
      });

      this.updateBadges();
    }
  };

  // Backwards-compatible aliases for any dependent code
  function getSaved() { return Watchlist.getAll(); }
  function setSaved(items) { Watchlist.save(items); }
  function updateSavedCount() { Watchlist.updateBadges(); }
  function toggleSaved(id) { return Watchlist.toggle(id); }
  function setupSaveButtons() { Watchlist.bindButtons(); }

  // ---------------------------------------------------------------------------
  // 4. Shared Simulated Bidding Utility
  // ---------------------------------------------------------------------------

  function createBidDesk({
    initialPrice,
    initialBids,
    increment = 5000,
    onBidAccepted
  }) {
    let currentPrice = initialPrice;
    let bidCount = initialBids;

    function getMinimumBid() {
      return currentPrice + increment;
    }

    function isValid(amount) {
      if (!Number.isFinite(amount)) return false;
      if (amount < getMinimumBid()) return false;
      return (amount - currentPrice) % increment === 0;
    }

    function recordBid(amount) {
      if (!isValid(amount)) return false;

      currentPrice = amount;
      bidCount += 1;

      if (typeof onBidAccepted === 'function') {
        onBidAccepted(currentPrice, bidCount);
      }
      return true;
    }

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
      recordBid,
      getSimulatedHistory
    };
  }

  // ---------------------------------------------------------------------------
  // 5. Explore Catalog View
  // ---------------------------------------------------------------------------

  function renderExplore() {
    const grid = document.querySelector('#auction-grid');
    if (!grid) return;

    const params = new URLSearchParams(window.location.search);
    let activeCategory = params.get('category') || 'All';
    let savedOnly = params.get('saved') === 'true';
    let searchQuery = '';
    let sortMode = 'curated';

    const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
    const searchInput = document.querySelector('#lot-search');
    const sortSelect = document.querySelector('#lot-sort');
    const clearButton = document.querySelector('#clear-filters');
    const savedFilter = document.querySelector('#saved-filter');
    const savedCount = document.querySelector('#saved-filter-count');
    const resultsCount = document.querySelector('#results-count');
    const emptyState = document.querySelector('#empty-state');
    const emptyNotice = emptyState?.querySelector('p');

    if (savedOnly && savedFilter) {
      savedFilter.scrollIntoView({ block: 'center' });
    }

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

    function renderList() {
      const savedKeys = Watchlist.getAll();

      let visibleLots = AUCTION_LOTS.filter(lot => {
        const matchesCategory = activeCategory === 'All' || lot.category === activeCategory;
        const matchesSaved = !savedOnly || savedKeys.includes(lot.key);
        const searchable = `${lot.title} ${lot.category} ${lot.period} ${lot.number}`.toLowerCase();
        const matchesSearch = searchable.includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSaved && matchesSearch;
      });

      if (sortMode === 'ending') {
        visibleLots.sort((a, b) => a.ends - b.ends);
      } else if (sortMode === 'bid-low') {
        visibleLots.sort((a, b) => a.price - b.price);
      } else if (sortMode === 'bid-high') {
        visibleLots.sort((a, b) => b.price - a.price);
      }

      grid.innerHTML = visibleLots.map((lot, idx) => {
        return createLotCardMarkup(lot, idx, savedKeys.includes(lot.key));
      }).join('');

      if (resultsCount) {
        const countText = String(visibleLots.length).padStart(2, '0');
        const scopeText = savedOnly ? 'SAVED ' : 'SELECTED ';
        const nounText = visibleLots.length === 1 ? 'LOT' : 'LOTS';
        resultsCount.textContent = `SHOWING ${countText} ${scopeText}${nounText}`;
      }

      if (emptyState) {
        emptyState.hidden = visibleLots.length > 0;
      }
      if (emptyNotice) {
        emptyNotice.textContent = savedOnly
          ? 'Save a lot to begin building your edit.'
          : 'Try another category or search term.';
      }
      if (savedCount) {
        savedCount.textContent = String(savedKeys.length).padStart(2, '0');
      }
      if (savedFilter) {
        savedFilter.classList.toggle('active', savedOnly);
      }

      Watchlist.bindButtons();
    }

    document.addEventListener('vault:saved-change', () => {
      if (savedOnly) renderList();
    });

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        activeCategory = button.dataset.filter;
        savedOnly = false;
        filterButtons.forEach(b => b.classList.toggle('active', b === button));
        renderList();
      });
    });

    searchInput?.addEventListener('input', event => {
      searchQuery = event.target.value;
      renderList();
    });

    sortSelect?.addEventListener('change', event => {
      sortMode = event.target.value;
      renderList();
    });

    savedFilter?.addEventListener('click', () => {
      savedOnly = !savedOnly;
      activeCategory = 'All';
      filterButtons.forEach(b => b.classList.toggle('active', b.dataset.filter === 'All'));
      renderList();
    });

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

    // Initial category button active state
    filterButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.filter === activeCategory);
    });

    renderList();
  }

  // ---------------------------------------------------------------------------
  // 6. Lot Detail View
  // ---------------------------------------------------------------------------

  function renderLot() {
    const titleElement = document.querySelector('#lot-title');
    if (!titleElement) return;

    const params = new URLSearchParams(window.location.search);
    const requestedId = params.get('lot');
    const lot = AUCTION_LOTS.find(item => item.id === requestedId) || (!requestedId ? AUCTION_LOTS[0] : null);

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

    const gallery = lot.id === 'watch'
      ? [
          lot.image,
          'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1400&q=90',
          'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1400&q=90'
        ]
      : [lot.image];

    const statusLabel = Formatters.status(lot.ends);

    // Meta & Title
    document.title = `${lot.title} — THE VAULT`;

    // Static text fields
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

    // Main Image
    const mainImage = document.querySelector('#lot-image');
    if (mainImage) {
      mainImage.src = gallery[0];
      mainImage.alt = lot.title;
    }

    // Gallery Thumbnails
    const thumbsContainer = document.querySelector('#gallery-thumbs');
    if (thumbsContainer) {
      const thumbButtons = gallery.map((imageSrc, index) => {
        const thumbSrc = imageSrc.replace('w=1400', 'w=250');
        const activeClass = index === 0 ? ' active' : '';
        return `<button class="thumb${activeClass}" data-image="${imageSrc}" aria-label="View image ${index + 1}"><img src="${thumbSrc}" alt="${lot.title}, view ${index + 1}"></button>`;
      }).join('');

      thumbsContainer.innerHTML = thumbButtons + '<span>SELECT AN IMAGE TO VIEW</span>';

      thumbsContainer.querySelectorAll('.thumb').forEach(button => {
        button.addEventListener('click', () => {
          thumbsContainer.querySelectorAll('.thumb').forEach(b => b.classList.remove('active'));
          button.classList.add('active');
          if (mainImage) mainImage.src = button.dataset.image;
        });
      });
    }

    // Lightbox Functionality
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

    // Simulated Bidding Desk
    const currentBidEl = document.querySelector('#current-bid');
    const bidCountEl = document.querySelector('#bid-count');
    const bidInput = document.querySelector('#bid-amount');
    const bidIncrementEl = document.querySelector('#bid-increment');
    const bidFeedback = document.querySelector('#bid-feedback');
    const bidButton = document.querySelector('#place-bid');
    const historyList = document.querySelector('#bid-history-list');

    const desk = createBidDesk({
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

    // Populate initial simulated bid activity
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

    bidButton?.addEventListener('click', () => {
      const enteredAmount = Number(bidInput?.value);

      if (!desk.isValid(enteredAmount)) {
        if (bidFeedback) {
          bidFeedback.textContent = `Enter a bid of at least ${Formatters.currency(desk.getMinimumBid())} in increments of ${Formatters.currency(desk.getIncrement())}.`;
          bidFeedback.className = 'bid-feedback error';
        }
        return;
      }

      desk.recordBid(enteredAmount);

      if (historyList) {
        const userRow = document.createElement('div');
        userRow.className = 'history-row';
        userRow.innerHTML = `
          <span>
            <b>You (demo bidder)</b>
            <small>Just now · simulated</small>
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

    // Detail Watchlist Button
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

    // Similar Lots Section
    const similarGrid = document.querySelector('#similar-lots-grid');
    if (similarGrid) {
      const similarLots = AUCTION_LOTS
        .filter(item => item.id !== lot.id && item.category === lot.category)
        .slice(0, 3);

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
    }

    // Countdown Timer (illustrative prototype)
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
  // 7. Homepage View
  // ---------------------------------------------------------------------------

  function renderHome() {
    const liveGrid = document.querySelector('#home-live-grid');
    if (!liveGrid) return;

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

    // Live Grid lots (indices 1 to 3)
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
  // 8. Arena Live Simulation View
  // ---------------------------------------------------------------------------

  function renderArena() {
    const floor = document.querySelector('#arena-floor');
    if (!floor) return;

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

      if (!desk.isValid(enteredAmount)) {
        if (bidFeedback) {
          bidFeedback.textContent = `Enter a bid of at least ${Formatters.currency(desk.getMinimumBid())} in increments of ${Formatters.currency(desk.getIncrement())}.`;
          bidFeedback.className = 'arena-feedback error';
        }
        return;
      }

      desk.recordBid(enteredAmount);

      if (bidHistory) {
        const row = document.createElement('div');
        row.innerHTML = `
          <span>You / demo bidder<small>Just now · simulated</small></span>
          <strong>${Formatters.currency(enteredAmount)}</strong>
        `.trim();
        bidHistory.prepend(row);
      }

      if (bidFeedback) {
        bidFeedback.textContent = 'Demo bid accepted in this browser. No real bid or payment has been submitted.';
        bidFeedback.className = 'arena-feedback success';
      }
    });

    // Floor Lots
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

    // Room Signals (Activity)
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

    // Closing Soon Lots
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

    // Featured Timer
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
  // 9. Editorial Journal Views
  // ---------------------------------------------------------------------------

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
    if (!grid) return;

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
    if (!articleRoot) return;

    const requestedStory = new URLSearchParams(window.location.search).get('story');
    const article = JOURNAL_ARTICLES.find(item => item.id === requestedStory);

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

    const bodySectionsHtml = article.body.map(section => `
      <section>
        <h2>${section.heading}</h2>
        ${section.paragraphs.map(p => `<p>${p}</p>`).join('')}
      </section>
    `.trim()).join('');

    const relatedArticles = article.related
      .map(relId => JOURNAL_ARTICLES.find(item => item.id === relId))
      .filter(Boolean);

    const relatedGridHtml = relatedArticles
      .map(item => renderArticleCard(item, false))
      .join('');

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
  // 10. Correspondence Form View
  // ---------------------------------------------------------------------------

  function renderContact() {
    const form = document.querySelector('#contact-form');
    if (!form) return;

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

    // Direction shortcut buttons
    document.querySelectorAll('[data-contact-type]').forEach(button => {
      button.addEventListener('click', () => {
        fields.type.value = button.dataset.contactType;
        setFieldError('type', '');
        fields.type.focus();
      });
    });

    // Revalidate on input once a field was marked invalid
    Object.keys(fields).forEach(key => {
      fields[key]?.addEventListener('input', () => {
        if (fields[key].getAttribute('aria-invalid') === 'true') {
          validateForm();
        }
      });
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (confirmation) confirmation.hidden = true;

      const validationErrors = validateForm();
      const errorKeys = Object.keys(validationErrors);

      if (errorKeys.length > 0) {
        fields[errorKeys[0]]?.focus();
        return;
      }

      if (confirmation) {
        confirmation.hidden = false;
        confirmation.classList.add('visible');
      }
    });

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
  // 11. Navigation & Global Interactions
  // ---------------------------------------------------------------------------

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
  // 12. Application Bootstrap
  // ---------------------------------------------------------------------------

  function bootstrap() {
    setupMobileNavigation();
    setupSmoothScroll();
    renderExplore();
    renderLot();
    renderHome();
    renderArena();
    renderJournal();
    renderArticle();
    renderContact();
    Watchlist.bindButtons();
    setupDemoAccountFallback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // Export safe, immutable application namespace for testing and extension
  window.VaultApp = Object.freeze({
    lots: AUCTION_LOTS,
    articles: JOURNAL_ARTICLES,
    formatters: Formatters,
    watchlist: Watchlist,
    createBidDesk,
    init: bootstrap
  });

  // Export historical identifiers for script-level compatibility
  window.auctionLots = AUCTION_LOTS;
  window.journalArticles = JOURNAL_ARTICLES;
  window.money = money;
})();
