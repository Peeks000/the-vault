// THE VAULT — Page Controllers & SPA View Switcher
// Attaches interactive behavior to each <section id="view-..."> already present in index.html.
(function () {
  'use strict';

  const { q, qa, setText, el, Formatters, money, Watchlist, attachBidDeskUI, CatalogueService, syncShell, navigate, setPageInterval, clearTimers, LEGACY_MAP } = window.VaultCore;
  const DATA = window.VAULT_DATA;

  const PAGE_META = {
    home: { title: 'THE VAULT — Online Auctions for Watches, Art & Classics', theme: '#f1efe8', cls: '' },
    explore: { title: 'THE VAULT — All Auction Lots', theme: '#f1efe8', cls: '' },
    lot: { title: 'THE VAULT — Lot Details', theme: '#f1efe8', cls: '' },
    arena: { title: 'THE VAULT — Live Bidding Room', theme: '#1b1c19', cls: 'arena-page' },
    journal: { title: 'THE VAULT — Collector Guides', theme: '#f1efe8', cls: '' },
    article: { title: 'THE VAULT — Article', theme: '#f1efe8', cls: '' },
    about: { title: 'THE VAULT — About & How It Works', theme: '#f1efe8', cls: '' },
    contact: { title: 'THE VAULT — Contact Us', theme: '#f1efe8', cls: '' },
    auth: { title: 'THE VAULT — Member Account', theme: '#f1efe8', cls: 'auth-page' },
    admin: { title: 'THE VAULT — Admin Dashboard', theme: '#191a18', cls: 'admin-page' }
  };

  // 1. Home Controller: populates featured lot & live preview grid, and ensures 3D viewer resumes.
  function initHome() {
    const featured = DATA.lots[0];
    const lotUrl = `?page=lot&lot=${encodeURIComponent(featured.id)}`;
    ['#featured-link', '.hero-object', '#featured-action'].forEach(sel => { if (q(sel)) q(sel).href = lotUrl; });
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

    q('#home-live-grid').innerHTML = DATA.lots.slice(1, 4).map(lot => {
      const status = Formatters.status(lot.ends);
      const url = `?page=lot&lot=${encodeURIComponent(lot.id)}`;
      return `<article class="home-live-card"><div class="home-live-image"><a href="${url}"><img src="${lot.image}" alt="${lot.title}" loading="lazy"></a><span class="lot-number">LOT ${lot.number}</span><span class="lot-status ${status === 'CLOSING SOON' ? 'urgent' : ''}">${status}</span><button class="lot-save" data-save="${lot.key}" aria-label="Save ${lot.title}">♡</button></div><div class="home-live-info"><p class="lot-category">${lot.category.toUpperCase()} / ${lot.period}</p><h3><a href="${url}">${lot.title}</a></h3><div class="home-live-data"><span>CURRENT BID<strong>${money(lot.price)}</strong></span><span>ESTIMATE<strong>${lot.estimate}</strong></span></div><div class="home-live-foot"><span>${lot.bids} BIDS / ${Formatters.closing(lot.ends)}</span><a href="${url}">View lot ↗</a></div></div></article>`;
    }).join('');
    window.__vault3DShowcase?.remount?.();
  }

  // 2. Explore Controller: category chips, search input, price/time sorting & saved filter.
  let savedListener = null;
  function initExplore() {
    const params = new URLSearchParams(window.location.search);
    let selectedCat = params.get('category') || 'All';
    let savedOnly = params.get('saved') === 'true';
    let searchQuery = '';
    let sortBy = 'curated';
    let lots = DATA.lots;

    const filterBtns = qa('[data-filter]');
    const searchInput = q('#lot-search');
    const sortSelect = q('#lot-sort');
    const savedFilterBtn = q('#saved-filter');
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'curated';
    if (savedOnly) savedFilterBtn?.scrollIntoView({ block: 'center' });

    function renderGrid() {
      const grid = q('#auction-grid');
      if (!grid) return;
      const savedKeys = Watchlist.getAll();
      const filtered = lots.filter(lot => {
        const matchesCat = selectedCat === 'All' || lot.category.toLowerCase() === selectedCat.toLowerCase();
        const matchesSaved = !savedOnly || savedKeys.includes(lot.key);
        const searchable = `${lot.title} ${lot.category} ${lot.period} ${lot.number}`.toLowerCase();
        return matchesCat && matchesSaved && searchable.includes(searchQuery.toLowerCase());
      });
      if (sortBy === 'ending') filtered.sort((a, b) => a.ends - b.ends);
      else if (sortBy === 'bid-low') filtered.sort((a, b) => a.price - b.price);
      else if (sortBy === 'bid-high') filtered.sort((a, b) => b.price - a.price);

      grid.innerHTML = filtered.map((lot, idx) => {
        const status = Formatters.status(lot.ends);
        const isSaved = savedKeys.includes(lot.key);
        const lotUrl = `?page=lot&lot=${encodeURIComponent(lot.id)}`;
        return `<article class="lot-card editorial-lot editorial-lot-${idx + 1}"><a class="lot-image" href="${lotUrl}"><img src="${lot.image}" alt="${lot.title}" loading="lazy"><span class="lot-number">LOT ${lot.number}</span><span class="lot-status ${status === 'CLOSING SOON' ? 'urgent' : ''}">${status}</span><button class="lot-save ${isSaved ? 'saved' : ''}" data-save="${lot.key}" aria-label="${isSaved ? 'Remove' : 'Save'} ${lot.title}">${isSaved ? '♥' : '♡'}</button></a><div class="lot-copy"><div class="lot-info"><div><p class="lot-category">${lot.category.toUpperCase()} / ${lot.period.toUpperCase()}</p><h3><a href="${lotUrl}">${lot.title}</a></h3></div><div class="lot-price"><span>Current bid</span><strong>${money(lot.price)}</strong></div></div><div class="lot-meta"><span>${lot.bids} bids</span><span>${Formatters.closing(lot.ends)}</span><span>Est. ${lot.estimate}</span></div><div class="lot-card-foot"><span>LOT ${lot.number}</span><a href="${lotUrl}">View lot ↗</a></div></div></article>`;
      }).join('');

      setText('#results-count', `SHOWING ${String(filtered.length).padStart(2, '0')} ${savedOnly ? 'SAVED ' : 'SELECTED '}${filtered.length === 1 ? 'LOT' : 'LOTS'}`);
      setText('#explore-edit-count', String(lots.length).padStart(2, '0'));
      setText('#saved-filter-count', String(savedKeys.length).padStart(2, '0'));
      q('#empty-state').hidden = filtered.length > 0;
      savedFilterBtn?.classList.toggle('active', savedOnly);
      Watchlist.bindButtons();
    }

    if (savedListener) document.removeEventListener('vault:saved-change', savedListener);
    savedListener = () => { if (savedOnly && !q('#view-explore')?.hidden) renderGrid(); };
    document.addEventListener('vault:saved-change', savedListener);

    filterBtns.forEach(btn => {
      btn.classList.toggle('active', !savedOnly && btn.dataset.filter === selectedCat);
      btn.onclick = () => {
        selectedCat = btn.dataset.filter;
        savedOnly = false;
        filterBtns.forEach(b => b.classList.toggle('active', b === btn));
        renderGrid();
      };
    });
    if (searchInput) searchInput.oninput = e => { searchQuery = e.target.value; renderGrid(); };
    if (sortSelect) sortSelect.onchange = e => { sortBy = e.target.value; renderGrid(); };
    if (savedFilterBtn) savedFilterBtn.onclick = () => { savedOnly = !savedOnly; selectedCat = 'All'; filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'All')); renderGrid(); };
    if (q('#clear-filters')) q('#clear-filters').onclick = () => {
      selectedCat = 'All'; savedOnly = false; searchQuery = ''; sortBy = 'curated';
      if (searchInput) searchInput.value = '';
      if (sortSelect) sortSelect.value = 'curated';
      filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'All'));
      renderGrid();
    };

    renderGrid();
    CatalogueService.getLots().then(dbLots => { if (dbLots?.length && !q('#view-explore')?.hidden) { lots = dbLots; renderGrid(); } });
  }

  // 3. Lot Detail Controller: image thumbnails, zoom lightbox, simulated bidding & countdown timer.
  async function initLot() {
    const lot = await CatalogueService.getLotById(new URLSearchParams(window.location.search).get('lot'));
    if (q('#view-lot')?.hidden) return;
    ['.lot-detail-grid', '.lot-details-section', '.similar-lots-section'].forEach(sel => { if (q(sel)) q(sel).hidden = !lot; });
    q('#lot-not-found').hidden = Boolean(lot);
    if (!lot) { document.title = 'Lot not found — THE VAULT'; return; }

    const gallery = lot.gallery?.length ? lot.gallery : (lot.id === 'watch'
      ? [lot.image, 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1400&q=90', 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1400&q=90']
      : [lot.image]);

    document.title = `${lot.title} — THE VAULT`;
    q('#lot-title').innerHTML = `${lot.title.replace(' ', '<br>')}<em>.</em>`;
    q('#lot-story-heading').textContent = `About this ${lot.category}`;
    setText('#lot-breadcrumb', `LOT ${lot.number}`);
    setText('#lot-category', `${lot.category.toUpperCase()} / LOT ${lot.number}`);
    setText('#lot-subtitle', lot.subtitle);
    setText('#lot-estimate', lot.estimate);
    setText('#lot-number', `LOT ${lot.number}`);
    setText('#lot-period', lot.period);
    setText('#detail-period', lot.period);
    setText('#detail-category', lot.category);
    setText('#lot-story-copy', lot.story);
    setText('#detail-description', lot.story);
    setText('#lot-status-label', Formatters.status(lot.ends));
    setText('.gallery-stamp', `THE VAULT / LOT ${lot.number}`);

    const mainImg = q('#lot-image');
    mainImg.src = gallery[0];
    mainImg.alt = lot.title;
    const thumbsWrap = q('#gallery-thumbs');
    thumbsWrap.innerHTML = gallery.map((src, i) => `<button class="thumb${i === 0 ? ' active' : ''}" data-image="${src}" aria-label="View image ${i + 1}"><img src="${src.replace('w=1400', 'w=250')}" alt="${lot.title}, view ${i + 1}"></button>`).join('') + '<span>SELECT AN IMAGE TO VIEW</span>';
    thumbsWrap.querySelectorAll('.thumb').forEach(btn => {
      btn.onclick = () => {
        thumbsWrap.querySelectorAll('.thumb').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        mainImg.src = btn.dataset.image;
      };
    });

    const lightbox = q('#image-lightbox'), lightboxImg = q('#lightbox-image');
    const closeLightbox = () => { lightbox.hidden = true; document.body.classList.remove('lightbox-open'); };
    if (q('#image-expand')) q('#image-expand').onclick = () => { lightboxImg.src = mainImg.src; lightboxImg.alt = lot.title; lightbox.hidden = false; document.body.classList.add('lightbox-open'); };
    if (q('#lightbox-close')) q('#lightbox-close').onclick = closeLightbox;
    if (lightbox) lightbox.onclick = e => { if (e.target === lightbox) closeLightbox(); };

    attachBidDeskUI({
      lot, inputEl: q('#bid-amount'), buttonEl: q('#place-bid'), feedbackEl: q('#bid-feedback'), historyEl: q('#bid-history-list'),
      feedbackBaseClass: 'bid-feedback',
      onUpdate: (price, bids, desk) => { setText('#current-bid', money(price)); setText('#bid-count', String(bids).padStart(2, '0')); setText('#bid-increment', money(desk.getIncrement())); },
      formatHistoryRow: (val, num, ago) => `<div class="history-row"><span><b>Bidder ${num}</b><small>${ago} · simulated</small></span><strong>${money(val)}</strong></div>`,
      userRowHtml: val => `<div class="history-row"><span><b>You (session bidder)</b><small>Just now · demo</small></span><strong>${money(val)}</strong></div>`
    });

    const saveBtn = q('#save-detail');
    const syncSaveBtn = () => {
      const saved = Watchlist.has(lot.key);
      saveBtn.classList.toggle('saved', saved);
      saveBtn.innerHTML = saved ? '♥ <span>Saved</span>' : '♡ <span>Save lot</span>';
    };
    if (saveBtn) saveBtn.onclick = () => { Watchlist.toggle(lot.key); syncSaveBtn(); };
    syncSaveBtn();

    CatalogueService.getLots().then(all => {
      if (q('#view-lot')?.hidden) return;
      q('#similar-lots-grid').innerHTML = all.filter(item => item.id !== lot.id && item.category.toLowerCase() === lot.category.toLowerCase()).slice(0, 3)
        .map(item => `<article class="similar-lot"><a href="?page=lot&lot=${encodeURIComponent(item.id)}"><img src="${item.image}" alt="${item.title}" loading="lazy"><span>LOT ${item.number} / ${item.category.toUpperCase()}</span></a><h3><a href="?page=lot&lot=${encodeURIComponent(item.id)}">${item.title}</a></h3><p>${money(item.price)} / ${item.bids} bids</p></article>`).join('');
    });

    let remaining = lot.ends;
    const tick = () => { setText('#countdown', Formatters.clock(remaining)); if (remaining > 0) remaining -= 1; };
    tick();
    setPageInterval(tick, 1000);
  }

  // 4. Arena Controller: spotlight lot bid desk, floor cards with "Make featured", & live ticker.
  function initArena() {
    const liveLots = DATA.lots.filter(l => l.ends > 0 && l.ends < 86400).sort((a, b) => a.ends - b.ends);
    const activeLots = DATA.lots.filter(l => l.ends > 0);
    const selectedId = new URLSearchParams(window.location.search).get('lot');
    const featured = DATA.lots.find(l => l.id === selectedId) || liveLots[0] || activeLots[0];

    setText('#arena-active-count', String(liveLots.length).padStart(2, '0'));
    q('#arena-featured-link').href = q('#arena-featured-action').href = `?page=lot&lot=${encodeURIComponent(featured.id)}`;
    q('#arena-featured-image').src = featured.image;
    q('#arena-featured-image').alt = featured.title;
    q('#arena-featured-save').dataset.save = featured.key;
    setText('#arena-featured-number', `LOT ${featured.number}`);
    setText('#arena-featured-category', featured.category.toUpperCase());
    setText('#arena-featured-status', Formatters.status(featured.ends));
    setText('#arena-featured-title', featured.title);
    setText('#arena-featured-subtitle', featured.subtitle);
    setText('#arena-featured-estimate', featured.estimate);

    attachBidDeskUI({
      lot: featured, inputEl: q('#arena-bid-amount'), buttonEl: q('#arena-place-bid'), feedbackEl: q('#arena-feedback'), historyEl: q('#arena-history-list'),
      feedbackBaseClass: 'arena-feedback',
      onUpdate: (price, bids, desk) => { setText('#arena-featured-bid', money(price)); setText('#arena-current-bid', money(price)); setText('#arena-featured-bids', String(bids).padStart(2, '0')); setText('#arena-min-bid', money(desk.getMinimumBid())); setText('#arena-increment', money(desk.getIncrement())); },
      formatHistoryRow: (val, num, ago) => `<div><span>Bidder ${num}<small>${ago} · simulated</small></span><strong>${money(val)}</strong></div>`,
      userRowHtml: val => `<div><span>You / demo bidder<small>Just now · session</small></span><strong>${money(val)}</strong></div>`
    });

    const floorLots = activeLots.filter(l => l.id !== featured.id);
    q('#arena-floor').innerHTML = floorLots.map((lot, idx) => {
      const status = Formatters.status(lot.ends), enc = encodeURIComponent(lot.id);
      return `<article class="arena-floor-lot arena-floor-lot-${idx + 1}"><div class="arena-floor-image"><a href="?page=lot&lot=${enc}"><img src="${lot.image}" alt="${lot.title}" loading="lazy"></a><span>LOT ${lot.number}</span><b class="${status === 'CLOSING SOON' ? 'urgent' : ''}">${status}</b><button class="arena-save" data-save="${lot.key}" aria-label="Save ${lot.title}">♡</button></div><div class="arena-floor-copy"><p>${lot.category.toUpperCase()} / ${lot.period}</p><h3><a href="?page=lot&lot=${enc}">${lot.title}</a></h3><div><strong>${money(lot.price)}</strong><span>${String(lot.bids).padStart(2, '0')} BIDS / ${lot.ends < 86400 ? Formatters.clock(lot.ends) : 'UPCOMING'}</span></div><a class="arena-select-link" href="?page=arena&lot=${enc}">Make featured ↗</a></div></article>`;
    }).join('');
    q('#arena-empty').hidden = floorLots.length > 0;
    q('#arena-activity').innerHTML = activeLots.slice(0, 3).map((lot, idx) => `<article><span>0${idx + 1}</span><p>${idx === 0 ? `New bid placed on <strong>${lot.title}</strong>.` : `Collectors watching <strong>${lot.title}</strong>.`}</p><small>${idx === 0 ? `DEMO BID / ${money(lot.price)}` : `${Formatters.status(lot.ends)} / LIVE FLOOR`}</small></article>`).join('');
    q('#arena-closing').innerHTML = DATA.lots.filter(l => l.ends < 86400).slice(0, 3).map(lot => `<a href="?page=lot&lot=${encodeURIComponent(lot.id)}"><span>LOT ${lot.number} / ${Formatters.status(lot.ends)}</span><strong>${lot.title}</strong><small>${Formatters.clock(lot.ends)} left ↗</small></a>`).join('');

    let remaining = featured.ends;
    const tick = () => { setText('#arena-featured-closing', remaining > 0 ? `CLOSING IN ${Formatters.clock(remaining)}` : 'CLOSED / DEMO'); if (remaining > 0) remaining -= 1; };
    tick();
    setPageInterval(tick, 1000);
  }

  // 5. Journal & 6. Article Controllers
  const buildStoryCard = (article, isFeatured) => {
    const url = `?page=article&story=${encodeURIComponent(article.id)}`;
    return `<article class="journal-story${isFeatured ? ' journal-story-featured' : ''}"><a class="journal-story-image" href="${url}"><img src="${article.image}" alt="${article.title}" loading="lazy"><span>${article.category.toUpperCase()}</span></a><div class="journal-story-copy"><div class="journal-story-meta"><span>${article.category.toUpperCase()}</span><span>${article.readingTime.toUpperCase()}</span></div><h2><a href="${url}">${article.title}</a></h2><p>${article.subtitle}</p><a class="underlined-link" href="${url}">Read article ↗</a></div></article>`;
  };

  function initJournal() {
    const tabs = qa('[data-journal-filter]');
    const showCategory = (cat = 'All Stories') => {
      const items = cat === 'All Stories' ? DATA.articles : DATA.articles.filter(a => a.category === cat);
      q('#journal-story-grid').innerHTML = items.map((a, idx) => buildStoryCard(a, idx === 0 && cat === 'All Stories')).join('');
      q('#journal-empty').hidden = items.length > 0;
      setText('#journal-results', `${String(items.length).padStart(2, '0')} ${items.length === 1 ? 'STORY' : 'STORIES'}`);
      tabs.forEach(t => t.classList.toggle('active', t.dataset.journalFilter === cat));
    };
    tabs.forEach(tab => { tab.onclick = () => showCategory(tab.dataset.journalFilter); });
    showCategory('All Stories');
  }

  function initArticle() {
    const root = q('#article-root');
    const storyId = new URLSearchParams(window.location.search).get('story');
    const article = DATA.articles.find(x => x.id === storyId || (storyId && storyId.startsWith(x.id)));
    if (!article) {
      document.title = 'Article not found — THE VAULT';
      root.innerHTML = `<section class="article-not-found"><p class="eyebrow">THE JOURNAL / NOT FOUND</p><h1>Article<br><em>not found.</em></h1><p>This guide could not be found in the current edition.</p><a class="button button-dark" href="?page=journal">Back to The Journal <span>↗</span></a></section>`;
      return;
    }
    document.title = `${article.title} — THE VAULT`;
    root.innerHTML = `<div class="article-breadcrumb"><a href="?page=home">HOME</a><span>/</span><a href="?page=journal">THE JOURNAL</a><span>/</span><span>${article.category.toUpperCase()}</span></div><article class="journal-article"><header class="article-header"><div class="article-header-meta"><span>${article.category.toUpperCase()}</span><span>${article.readingTime.toUpperCase()}</span></div><h1>${article.title}</h1><p class="article-subtitle">${article.subtitle}</p></header><figure class="article-hero"><img src="${article.image}" alt="${article.title}"><figcaption>${article.caption} · THE VAULT</figcaption></figure><div class="article-body">${article.body.map(sec => `<section><h2>${sec.heading}</h2>${sec.paragraphs.map(p => `<p>${p}</p>`).join('')}</section>`).join('')}</div></article><section class="article-related"><div class="journal-section-heading"><p class="eyebrow">CONTINUE READING</p><a class="underlined-link" href="?page=journal">All guides ↗</a></div><div class="article-related-grid">${article.related.map(id => DATA.articles.find(x => x.id === id)).filter(Boolean).map(x => buildStoryCard(x, false)).join('')}</div></section>`;
  }

  // 7. Contact Controller: topic shortcuts + accessible client-side form validation.
  function initContact() {
    const form = q('#contact-form'), confirmation = q('#contact-confirmation');
    const fields = { name: q('#contact-name'), email: q('#contact-email'), type: q('#contact-type'), subject: q('#contact-subject'), message: q('#contact-message') };
    const errs = { name: q('#name-error'), email: q('#email-error'), type: q('#type-error'), subject: q('#subject-error'), message: q('#message-error') };

    const setFieldError = (key, message) => {
      if (errs[key]) { errs[key].textContent = message; errs[key].hidden = !message; }
      if (fields[key]) { fields[key].setAttribute('aria-invalid', String(Boolean(message))); fields[key].classList.toggle('has-error', Boolean(message)); }
    };
    const validate = () => {
      const issues = {};
      if (!fields.name.value.trim()) issues.name = 'Please enter your full name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim())) issues.email = 'Enter a valid email address.';
      if (!fields.type.value) issues.type = 'Choose an enquiry topic.';
      if (!fields.subject.value.trim()) issues.subject = 'Enter a subject for your enquiry.';
      if (!fields.message.value.trim()) issues.message = 'Write a short message.';
      Object.keys(fields).forEach(k => setFieldError(k, issues[k] || ''));
      return issues;
    };
    qa('[data-contact-type]').forEach(btn => {
      btn.onclick = () => {
        fields.type.value = btn.dataset.contactType;
        setFieldError('type', '');
        fields.type.focus();
      };
    });
    Object.keys(fields).forEach(k => { if (fields[k]) fields[k].oninput = () => { if (fields[k].getAttribute('aria-invalid') === 'true') validate(); }; });
    if (form) {
      form.onsubmit = event => {
        event.preventDefault();
        confirmation.hidden = true;
        const issues = validate(), keys = Object.keys(issues);
        if (keys.length) return fields[keys[0]]?.focus();
        confirmation.hidden = false;
      };
      form.onreset = () => setTimeout(() => { Object.keys(fields).forEach(k => setFieldError(k, '')); confirmation.hidden = true; }, 0);
    }
  }

  // 8. Auth Controller: Sign In, Create Account, Password Recovery, Reset & Admin Redirect
  function initAuth() {
    const auth = window.vaultAuth;
    if (!auth) return;
    const forms = { login: q('#auth-login-form'), register: q('#auth-register-form'), recovery: q('#auth-recovery-form'), reset: q('#auth-reset-form') };
    const params = new URLSearchParams(window.location.search), statusEl = q('#auth-status');
    let mode = (window.location.hash.includes('type=recovery') || params.get('mode') === 'reset') ? 'reset' : 'login';

    const showStatus = (text, kind = '') => { statusEl.textContent = text; statusEl.className = `auth-status ${kind}`.trim(); statusEl.hidden = !text; };
    const validEmail = val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    const validPass = val => val.length >= 8 && /[A-Za-z]/.test(val) && /\d/.test(val);
    const switchMode = nextMode => {
      mode = nextMode;
      Object.entries(forms).forEach(([k, form]) => { if (form) form.hidden = k !== nextMode; });
      qa('[data-auth-mode]').forEach(btn => btn.classList.toggle('active', btn.dataset.authMode === nextMode));
      setText('#auth-mode-label', nextMode === 'register' ? 'CREATE ACCOUNT' : nextMode.toUpperCase());
      q('#auth-panel-title').innerHTML = nextMode === 'register' ? 'Create <em>account.</em>' : nextMode === 'reset' ? 'Reset <em>password.</em>' : 'Welcome <em>back.</em>';
      showStatus('');
    };
    const syncAccountUI = session => {
      if (!q('#auth-account')) return;
      q('#auth-account').hidden = !session;
      q('.auth-modes').hidden = Boolean(session);
      if (session) { Object.values(forms).forEach(f => { f.hidden = true; }); setText('#auth-mode-label', 'SIGNED IN'); q('#auth-panel-title').innerHTML = 'Signed <em>in.</em>'; }
      else switchMode(mode);
    };

    forms.login.onsubmit = async e => {
      e.preventDefault();
      const email = q('#login-email').value, password = q('#login-password').value;
      if (!validEmail(email)) return showStatus('Enter a valid email address.', 'error');
      if (!password) return showStatus('Enter your password.', 'error');
      showStatus('Signing in…', 'loading');
      const res = await auth.signIn(email.trim(), password);
      if (res?.error) return showStatus('Invalid email or password.', 'error');
      showStatus('You are signed in.', 'success');
      if (params.get('next') === 'admin') navigate('?page=admin');
    };
    forms.register.onsubmit = async e => {
      e.preventDefault();
      const email = q('#register-email').value, password = q('#register-password').value, confirm = q('#register-confirm').value;
      if (!validEmail(email)) return showStatus('Enter a valid email address.', 'error');
      if (!validPass(password)) return showStatus('Use at least 8 characters with 1 letter and 1 number.', 'error');
      if (password !== confirm) return showStatus('Passwords do not match.', 'error');
      showStatus('Creating account…', 'loading');
      const res = await auth.signUp(email.trim(), password);
      if (res?.error) return showStatus('Could not create account. Email may already be registered.', 'error');
      showStatus(res?.data?.session ? 'Account created and signed in.' : 'Check your email to verify your account.', 'success');
    };
    forms.recovery.onsubmit = async e => {
      e.preventDefault();
      const email = q('#recovery-email').value;
      if (!validEmail(email)) return showStatus('Enter a valid email address.', 'error');
      showStatus('Sending recovery email…', 'loading');
      const res = await auth.requestPasswordReset(email.trim());
      showStatus(res?.error ? 'Unable to send recovery email.' : 'If an account exists, a recovery link was sent.', res?.error ? 'error' : 'success');
    };
    forms.reset.onsubmit = async e => {
      e.preventDefault();
      const pw = q('#reset-password').value, cf = q('#reset-confirm').value;
      if (!validPass(pw)) return showStatus('Use at least 8 characters with 1 letter and 1 number.', 'error');
      if (pw !== cf) return showStatus('Passwords do not match.', 'error');
      const res = await auth.updatePassword(pw);
      if (res?.error) return showStatus('Could not update password.', 'error');
      switchMode('login');
      showStatus('Password updated. Please sign in.', 'success');
    };
    qa('[data-auth-mode]').forEach(btn => { btn.onclick = () => switchMode(btn.dataset.authMode); });
    const googleSignIn = async () => { const res = await auth.signInWithGoogle(); if (res?.error) showStatus('Google login requires Supabase OAuth configuration.', 'error'); };
    if (q('#google-login')) q('#google-login').onclick = googleSignIn;
    if (q('#google-register')) q('#google-register').onclick = googleSignIn;
    if (q('#auth-logout')) q('#auth-logout').onclick = async () => { await auth.signOut(); showStatus('Signed out.', 'success'); switchMode('login'); };

    auth.onAuthStateChange((ev, session) => { syncAccountUI(session); if (ev === 'PASSWORD_RECOVERY') switchMode('reset'); });
    auth.getSession().then(res => syncAccountUI(res.session));
    switchMode(mode);
  }

  // 9. Admin Controller: RPC super-admin check, database metrics & Lots CRUD modals.
  async function initAdmin() {
    const auth = window.vaultAuth, accessBox = q('#admin-access-state'), dashboard = q('#admin-dashboard');
    const showAccessError = msg => accessBox.replaceChildren(
      el('p', 'admin-kicker', 'ADMIN ACCESS ISSUE'),
      el('h1', '', 'Access denied.'),
      el('span', '', msg),
      Object.assign(el('a', 'admin-return-overview', 'Return home ↗'), { href: '?page=home' })
    );
    if (!auth?.configured || !auth.client) return showAccessError('Supabase is not configured.');
    try {
      const ses = await auth.getSession();
      if (ses.error) return showAccessError('Session could not be verified.');
      if (!ses.session) return navigate('?page=auth&next=admin', true);
      const roleCheck = await auth.isSuperAdmin();
      if (roleCheck.error || !roleCheck.authorized) return showAccessError('This account does not have super-admin permissions.');

      const userId = ses.session.user.id;
      let adminLots = [], pendingDelete = null;
      setText('#admin-account-email', ses.session.user.email || 'Super-admin');
      setText('#admin-sidebar-email', ses.session.user.email || 'Super-admin');
      accessBox.hidden = true;
      dashboard.hidden = false;

      const formatDate = v => !v ? 'N/A' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(v));
      const countRows = async (table, filterFn) => {
        let query = auth.client.from(table).select('*', { count: 'exact', head: true });
        if (filterFn) query = filterFn(query);
        const { count, error } = await query;
        return { table, value: error ? null : (count || 0), error };
      };

      async function loadOverview() {
        const errors = [];
        const metrics = await Promise.all([
          countRows('auction_lots'),
          countRows('auction_lots', r => r.not('published_at', 'is', null)),
          countRows('auction_lots', r => r.eq('status', 'live')),
          countRows('auction_lots', r => r.eq('status', 'closed')),
          countRows('bids'),
          countRows('profiles')
        ]);
        ['stat-total-lots', 'stat-published-lots', 'stat-live-auctions', 'stat-closed-auctions', 'stat-total-bids', 'stat-members'].forEach((id, i) => {
          setText(`#${id}`, metrics[i].value === null ? 'Unavailable' : Number(metrics[i].value).toLocaleString('en-IN'));
          if (metrics[i].error) errors.push(metrics[i]);
        });
        const [lotsRes, bidsRes, msgRes] = await Promise.all([
          auth.client.from('auction_lots').select('id,lot_number,title,status,created_at').order('created_at', { ascending: false }).limit(5),
          auth.client.from('bids').select('id,lot_id,amount,created_at').order('created_at', { ascending: false }).limit(5),
          auth.client.from('contact_messages').select('id,enquiry_type,subject,status,created_at').order('created_at', { ascending: false }).limit(5)
        ]);
        [
          [lotsRes, 'recent-lots', r => [r.status.toUpperCase(), r.title, `LOT ${r.lot_number} · ${formatDate(r.created_at)}`]],
          [bidsRes, 'recent-bids', r => ['BID', money(r.amount), `LOT ${String(r.lot_id).slice(0, 8)} · ${formatDate(r.created_at)}`]],
          [msgRes, 'recent-enquiries', r => [r.status.toUpperCase(), r.subject, `${r.enquiry_type} · ${formatDate(r.created_at)}`]]
        ].forEach(([res, boxId, mapRow]) => {
          const box = q(`#${boxId}`); box.replaceChildren();
          if (res.error) box.append(el('p', 'admin-list-status is-error', 'Unavailable from database.'));
          else if (!res.data?.length) box.append(el('p', 'admin-list-status', 'No records yet.'));
          else res.data.forEach(item => {
            const [kicker, title, detail] = mapRow(item);
            box.append(el('div', 'admin-activity-row', '', el('span', 'admin-row-kicker', kicker), el('strong', '', title), el('small', '', detail)));
          });
        });
        const connBadge = q('#admin-connection');
        connBadge.className = `admin-connection ${errors.length ? 'is-limited' : 'is-connected'}`;
        connBadge.replaceChildren(el('i'), document.createTextNode(errors.length ? 'Connected (partial)' : 'Supabase connected'));
      }

      async function loadAdminLots() {
        const statusEl = q('#admin-lots-status'), tbody = q('#admin-lots-tbody');
        statusEl.hidden = false; statusEl.textContent = 'Loading lots…'; tbody.replaceChildren();
        const { data, error } = await auth.client.from('auction_lots').select('id,legacy_id,lot_number,category,period,title,subtitle,description,estimate_low,estimate_high,current_bid,status,published_at,lot_images(id,image_url,is_primary,sort_order)').order('created_at', { ascending: false });
        if (error) { statusEl.textContent = `Error: ${error.message}`; return; }
        adminLots = data || [];
        renderAdminTable();
      }

      function renderAdminTable() {
        const tbody = q('#admin-lots-tbody'), statusEl = q('#admin-lots-status');
        const query = (q('#admin-lots-search')?.value || '').trim().toLowerCase();
        const stFilter = q('#admin-status-filter')?.value || 'all', catFilter = q('#admin-category-filter')?.value || 'all';
        const visible = adminLots.filter(l => (stFilter === 'all' || l.status === stFilter) && (catFilter === 'all' || l.category === catFilter) && (!query || `${l.lot_number} ${l.title} ${l.category}`.toLowerCase().includes(query)));
        tbody.replaceChildren();
        if (!visible.length) { statusEl.hidden = false; statusEl.textContent = adminLots.length ? 'No matching lots.' : 'No lots in database yet.'; return; }
        statusEl.hidden = true;
        visible.forEach(lot => {
          const imgs = lot.lot_images || [];
          const thumb = (imgs.find(i => i.is_primary) || imgs[0])?.image_url || DATA.lots[0].image;
          const statusSel = el('select', 'admin-action-btn');
          ['draft', 'scheduled', 'live', 'closed', 'withdrawn'].forEach(st => statusSel.append(Object.assign(el('option', '', st), { value: st, selected: lot.status === st })));
          statusSel.onchange = () => updateStatus(lot.id, statusSel.value);
          const editBtn = Object.assign(el('button', 'admin-action-btn', 'Edit'), { type: 'button', onclick: () => openLotModal(lot) });
          const delBtn = Object.assign(el('button', 'admin-action-btn', 'Delete'), { type: 'button', onclick: () => { pendingDelete = lot; setText('#delete-modal-copy', `Delete LOT ${lot.lot_number} ("${lot.title}")?`); q('#delete-modal-feedback').hidden = true; q('#withdraw-instead-btn').hidden = true; q('#confirm-delete-btn').disabled = false; q('#admin-delete-modal').hidden = false; } });
          tbody.append(el('tr', '', '', el('td', '', `LOT ${lot.lot_number}`), el('td', '', '', el('div', 'admin-lot-cell', '', Object.assign(el('img', 'admin-lot-thumb'), { src: thumb, alt: lot.title }), el('strong', '', lot.title))), el('td', '', lot.category), el('td', '', money(lot.current_bid || 0)), el('td', '', lot.estimate_low ? `${money(lot.estimate_low)} – ${money(lot.estimate_high || lot.estimate_low)}` : 'Upon request'), el('td', '', '', statusSel), el('td', '', '', el('div', 'admin-row-actions', '', editBtn, delBtn))));
        });
      }

      const updateStatus = async (id, status) => {
        const payload = { status, updated_at: new Date().toISOString() };
        if (status === 'live' || status === 'scheduled') payload.published_at = payload.updated_at;
        await auth.client.from('auction_lots').update(payload).eq('id', id);
        loadAdminLots(); loadOverview();
      };

      const openLotModal = lot => {
        q('#admin-lot-form').reset(); q('#modal-lot-feedback').hidden = true;
        q('#lot-form-mode').value = lot ? 'edit' : 'add'; q('#lot-form-id').value = lot?.id || '';
        setText('#modal-lot-title', lot ? `Edit LOT ${lot.lot_number}` : 'Add auction listing');
        if (lot) {
          const pri = (lot.lot_images || []).find(i => i.is_primary) || lot.lot_images?.[0];
          q('#lot-form-title').value = lot.title || ''; q('#lot-form-number').value = lot.lot_number || '';
          q('#lot-form-category').value = lot.category || 'Timepieces'; q('#lot-form-status').value = lot.status || 'live';
          q('#lot-form-subtitle').value = lot.subtitle || ''; q('#lot-form-description').value = lot.description || '';
          q('#lot-form-period').value = lot.period || ''; q('#lot-form-price').value = lot.current_bid ?? 0;
          q('#lot-form-est-low').value = lot.estimate_low ?? ''; q('#lot-form-est-high').value = lot.estimate_high ?? '';
          q('#lot-form-image').value = pri?.image_url || ''; q('#lot-form-published').checked = Boolean(lot.published_at);
        }
        q('#admin-lot-modal').hidden = false;
      };

      q('#admin-lot-form').onsubmit = async e => {
        e.preventDefault();
        const title = q('#lot-form-title').value.trim(), num = q('#lot-form-number').value.trim(), price = Number(q('#lot-form-price').value) || 0;
        if (!title || !num) { q('#modal-lot-feedback').hidden = false; q('#modal-lot-feedback').textContent = 'Title and lot number are required.'; return; }
        const now = new Date().toISOString(), payload = {
          lot_number: num, category: q('#lot-form-category').value, period: q('#lot-form-period').value.trim() || null,
          title, subtitle: q('#lot-form-subtitle').value.trim() || null, description: q('#lot-form-description').value.trim() || null,
          estimate_low: q('#lot-form-est-low').value ? Number(q('#lot-form-est-low').value) : null,
          estimate_high: q('#lot-form-est-high').value ? Number(q('#lot-form-est-high').value) : null,
          current_bid: price, status: q('#lot-form-status').value, published_at: q('#lot-form-published').checked ? now : null, updated_at: now
        };
        const imgUrl = q('#lot-form-image').value.trim();
        if (q('#lot-form-mode').value === 'add') {
          payload.legacy_id = `lot-${Date.now().toString(36)}`; payload.created_by = userId;
          const { data } = await auth.client.from('auction_lots').insert(payload).select().single();
          if (imgUrl && data) await auth.client.from('lot_images').insert({ lot_id: data.id, image_url: imgUrl, alt_text: title, is_primary: true, sort_order: 0 });
        } else {
          const id = q('#lot-form-id').value;
          await auth.client.from('auction_lots').update(payload).eq('id', id);
        }
        q('#admin-lot-modal').hidden = true; loadAdminLots(); loadOverview();
      };

      q('#confirm-delete-btn').onclick = async () => {
        if (!pendingDelete) return;
        const { error } = await auth.client.from('auction_lots').delete().eq('id', pendingDelete.id);
        if (error) {
          q('#delete-modal-feedback').hidden = false;
          q('#delete-modal-feedback').textContent = error.code === '23503' ? 'Bids exist on this lot. Mark it as withdrawn instead.' : error.message;
          if (error.code === '23503') q('#withdraw-instead-btn').hidden = false;
          return;
        }
        q('#admin-delete-modal').hidden = true; loadAdminLots(); loadOverview();
      };
      q('#withdraw-instead-btn').onclick = async () => { if (pendingDelete) await updateStatus(pendingDelete.id, 'withdrawn'); q('#admin-delete-modal').hidden = true; };
      q('#admin-seed-lots-btn').onclick = async () => {
        if (!confirm('Insert the 8 sample lots into Supabase?')) return;
        for (const item of DATA.lots) {
          const { data: row } = await auth.client.from('auction_lots').upsert({ legacy_id: item.id, lot_number: item.number, category: item.category, period: item.period, title: item.title, subtitle: item.subtitle, description: item.story, current_bid: item.price, status: 'live', published_at: new Date().toISOString(), created_by: userId }, { onConflict: 'legacy_id' }).select().single();
          if (row) await auth.client.from('lot_images').upsert({ lot_id: row.id, image_url: item.image, alt_text: item.title, is_primary: true, sort_order: 0 }, { onConflict: 'lot_id,sort_order' });
        }
        loadAdminLots(); loadOverview();
      };

      const switchSection = (key, label) => {
        setText('#admin-section-title', label);
        qa('[data-admin-section]').forEach(a => a.classList.toggle('active', a.dataset.adminSection === key));
        q('#admin-overview').hidden = key !== 'overview';
        q('#admin-lots').hidden = key !== 'lots';
        q('#admin-placeholder').hidden = key === 'overview' || key === 'lots';
        if (key === 'lots') loadAdminLots();
        else if (key !== 'overview') { setText('#admin-placeholder-title', label); setText('#admin-placeholder-copy', `${label} module is planned for a future update.`); }
        q('#admin-sidebar').classList.remove('is-open');
      };
      qa('[data-admin-section]').forEach(a => { a.onclick = e => { e.preventDefault(); switchSection(a.dataset.adminSection, a.dataset.sectionLabel); }; });
      q('#admin-menu-toggle').onclick = () => q('#admin-sidebar').classList.toggle('is-open');
      qa('#admin-top-logout, #admin-sidebar-logout').forEach(b => { b.onclick = async () => { await auth.signOut(); navigate('?page=auth', true); }; });
      q('#admin-add-lot-btn').onclick = () => openLotModal(null);
      q('#admin-refresh-lots-btn').onclick = loadAdminLots;
      ['#admin-lots-search', '#admin-status-filter', '#admin-category-filter'].forEach(sel => { if (q(sel)) q(sel)[sel.includes('search') ? 'oninput' : 'onchange'] = renderAdminTable; });
      ['#admin-lot-modal-close', '#lot-form-cancel'].forEach(sel => { if (q(sel)) q(sel).onclick = () => { q('#admin-lot-modal').hidden = true; }; });
      ['#admin-delete-modal-close', '#cancel-delete-btn'].forEach(sel => { if (q(sel)) q(sel).onclick = () => { q('#admin-delete-modal').hidden = true; }; });
      switchSection('overview', 'Overview');
      await loadOverview();
    } catch {
      showAccessError('Admin dashboard could not be loaded.');
    }
  }

  // Controller Lookup & Master Page Switcher
  const CONTROLLERS = { home: initHome, explore: initExplore, lot: initLot, arena: initArena, journal: initJournal, article: initArticle, contact: initContact, auth: initAuth, admin: initAdmin };

  function resolvePage() {
    const qp = new URLSearchParams(window.location.search).get('page');
    if (qp && PAGE_META[qp]) return qp;
    const file = window.location.pathname.split('/').pop().toLowerCase();
    return LEGACY_MAP[file] || 'home';
  }

  function showPage() {
    clearTimers();
    const page = resolvePage(), meta = PAGE_META[page] || PAGE_META.home;
    qa('.page-view').forEach(section => { section.hidden = section.id !== `view-${page}`; });
    document.body.dataset.page = page;
    document.body.classList.remove('arena-page', 'auth-page', 'admin-page', 'lightbox-open');
    if (meta.cls) document.body.classList.add(meta.cls);
    document.title = meta.title;
    const themeMeta = q('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = meta.theme;
    syncShell(page);
    CONTROLLERS[page]?.();
    Watchlist.bindButtons();
  }

  window.VaultApp = Object.freeze({ lots: DATA.lots, sampleLots: DATA.lots, catalogue: CatalogueService, articles: DATA.articles, formatters: Formatters, watchlist: Watchlist, init: showPage });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showPage);
  else showPage();
})();
