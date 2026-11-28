// THE VAULT — Page Controllers & SPA View Switcher
// Attaches interactive behavior to each <section id="view-..."> inside index.html.
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

  // 1. Home Controller: populates featured lot & live grid, resumes 3D showcase.
  function initHome() {
    const lot = DATA.lots[0], lotUrl = `?page=lot&lot=${encodeURIComponent(lot.id)}`;
    ['#featured-link', '.hero-object', '#featured-action'].forEach(s => { if (q(s)) q(s).href = lotUrl; });
    if (q('#featured-image')) { q('#featured-image').src = lot.image; q('#featured-image').alt = lot.title; }
    if (q('#featured-save')) q('#featured-save').dataset.save = lot.key;
    setText('#featured-status', Formatters.status(lot.ends)); setText('#featured-lot-number', `LOT ${lot.number}`);
    setText('#featured-category', `${lot.category.toUpperCase()} / ${lot.period}`); setText('#featured-title', lot.title);
    setText('#featured-subtitle', lot.subtitle); setText('#featured-estimate', lot.estimate);
    setText('#featured-bid', money(lot.price)); setText('#featured-bids', `${String(lot.bids).padStart(2, '0')} BIDS`);
    setText('#featured-closing', Formatters.closing(lot.ends));
    q('#home-live-grid').innerHTML = DATA.lots.slice(1, 4).map(item => {
      const st = Formatters.status(item.ends), url = `?page=lot&lot=${encodeURIComponent(item.id)}`;
      return `<article class="home-live-card"><div class="home-live-image"><a href="${url}"><img src="${item.image}" alt="${item.title}" loading="lazy"></a><span class="lot-number">LOT ${item.number}</span><span class="lot-status ${st === 'CLOSING SOON' ? 'urgent' : ''}">${st}</span><button class="lot-save" data-save="${item.key}" aria-label="Save ${item.title}">♡</button></div><div class="home-live-info"><p class="lot-category">${item.category.toUpperCase()} / ${item.period}</p><h3><a href="${url}">${item.title}</a></h3><div class="home-live-data"><span>CURRENT BID<strong>${money(item.price)}</strong></span><span>ESTIMATE<strong>${item.estimate}</strong></span></div><div class="home-live-foot"><span>${item.bids} BIDS / ${Formatters.closing(item.ends)}</span><a href="${url}">View lot ↗</a></div></div></article>`;
    }).join('');
    window.__vault3DShowcase?.remount?.();
  }

  // 2. Explore Controller: category chips, search input, sorting & watchlist filter.
  let savedListener = null;
  function initExplore() {
    const params = new URLSearchParams(window.location.search);
    let selectedCat = params.get('category') || 'All', savedOnly = params.get('saved') === 'true', searchQuery = '', sortBy = 'curated', lots = DATA.lots;
    const filterBtns = qa('[data-filter]'), searchInput = q('#lot-search'), sortSelect = q('#lot-sort'), savedBtn = q('#saved-filter');
    if (searchInput) searchInput.value = ''; if (sortSelect) sortSelect.value = 'curated';
    if (savedOnly) savedBtn?.scrollIntoView({ block: 'center' });

    function renderGrid() {
      const grid = q('#auction-grid'); if (!grid) return;
      const savedKeys = Watchlist.getAll();
      const filtered = lots.filter(l => (selectedCat === 'All' || l.category.toLowerCase() === selectedCat.toLowerCase()) && (!savedOnly || savedKeys.includes(l.key)) && `${l.title} ${l.category} ${l.period} ${l.number}`.toLowerCase().includes(searchQuery.toLowerCase()));
      if (sortBy === 'ending') filtered.sort((a, b) => a.ends - b.ends);
      else if (sortBy === 'bid-low') filtered.sort((a, b) => a.price - b.price);
      else if (sortBy === 'bid-high') filtered.sort((a, b) => b.price - a.price);

      grid.innerHTML = filtered.map((l, idx) => {
        const st = Formatters.status(l.ends), saved = savedKeys.includes(l.key), url = `?page=lot&lot=${encodeURIComponent(l.id)}`;
        return `<article class="lot-card editorial-lot editorial-lot-${idx + 1}"><a class="lot-image" href="${url}"><img src="${l.image}" alt="${l.title}" loading="lazy"><span class="lot-number">LOT ${l.number}</span><span class="lot-status ${st === 'CLOSING SOON' ? 'urgent' : ''}">${st}</span><button class="lot-save ${saved ? 'saved' : ''}" data-save="${l.key}" aria-label="${saved ? 'Remove' : 'Save'} ${l.title}">${saved ? '♥' : '♡'}</button></a><div class="lot-copy"><div class="lot-info"><div><p class="lot-category">${l.category.toUpperCase()} / ${l.period.toUpperCase()}</p><h3><a href="${url}">${l.title}</a></h3></div><div class="lot-price"><span>Current bid</span><strong>${money(l.price)}</strong></div></div><div class="lot-meta"><span>${l.bids} bids</span><span>${Formatters.closing(l.ends)}</span><span>Est. ${l.estimate}</span></div><div class="lot-card-foot"><span>LOT ${l.number}</span><a href="${url}">View lot ↗</a></div></div></article>`;
      }).join('');
      setText('#results-count', `SHOWING ${String(filtered.length).padStart(2, '0')} ${savedOnly ? 'SAVED ' : 'SELECTED '}${filtered.length === 1 ? 'LOT' : 'LOTS'}`);
      setText('#explore-edit-count', String(lots.length).padStart(2, '0'));
      setText('#saved-filter-count', String(savedKeys.length).padStart(2, '0'));
      q('#empty-state').hidden = filtered.length > 0; savedBtn?.classList.toggle('active', savedOnly); Watchlist.bindButtons();
    }

    if (savedListener) document.removeEventListener('vault:saved-change', savedListener);
    savedListener = () => { if (savedOnly && !q('#view-explore')?.hidden) renderGrid(); };
    document.addEventListener('vault:saved-change', savedListener);
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', !savedOnly && btn.dataset.filter === selectedCat);
      btn.onclick = () => { selectedCat = btn.dataset.filter; savedOnly = false; filterBtns.forEach(b => b.classList.toggle('active', b === btn)); renderGrid(); };
    });
    if (searchInput) searchInput.oninput = e => { searchQuery = e.target.value; renderGrid(); };
    if (sortSelect) sortSelect.onchange = e => { sortBy = e.target.value; renderGrid(); };
    if (savedBtn) savedBtn.onclick = () => { savedOnly = !savedOnly; selectedCat = 'All'; filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'All')); renderGrid(); };
    if (q('#clear-filters')) q('#clear-filters').onclick = () => {
      selectedCat = 'All'; savedOnly = false; searchQuery = ''; sortBy = 'curated';
      if (searchInput) searchInput.value = ''; if (sortSelect) sortSelect.value = 'curated';
      filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'All')); renderGrid();
    };
    renderGrid(); CatalogueService.getLots().then(db => { if (db?.length && !q('#view-explore')?.hidden) { lots = db; renderGrid(); } });
  }

  // 3. Lot Detail Controller: thumbnails, lightbox, simulated bidding & timer.
  async function initLot() {
    const lot = await CatalogueService.getLotById(new URLSearchParams(window.location.search).get('lot'));
    if (q('#view-lot')?.hidden) return;
    ['.lot-detail-grid', '.lot-details-section', '.similar-lots-section'].forEach(s => { if (q(s)) q(s).hidden = !lot; });
    q('#lot-not-found').hidden = Boolean(lot);
    if (!lot) { document.title = 'Lot not found — THE VAULT'; return; }

    const gallery = lot.gallery?.length ? lot.gallery : (lot.id === 'watch' ? [lot.image, 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1400&q=90', 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1400&q=90'] : [lot.image]);
    document.title = `${lot.title} — THE VAULT`;
    q('#lot-title').innerHTML = `${lot.title.replace(' ', '<br>')}<em>.</em>`;
    q('#lot-story-heading').textContent = `About this ${lot.category}`;
    setText('#lot-breadcrumb', `LOT ${lot.number}`); setText('#lot-category', `${lot.category.toUpperCase()} / LOT ${lot.number}`);
    setText('#lot-subtitle', lot.subtitle); setText('#lot-estimate', lot.estimate); setText('#lot-number', `LOT ${lot.number}`);
    setText('#lot-period', lot.period); setText('#detail-period', lot.period); setText('#detail-category', lot.category);
    setText('#lot-story-copy', lot.story); setText('#detail-description', lot.story);
    setText('#lot-status-label', Formatters.status(lot.ends)); setText('.gallery-stamp', `THE VAULT / LOT ${lot.number}`);

    const mainImg = q('#lot-image'), thumbs = q('#gallery-thumbs');
    mainImg.src = gallery[0]; mainImg.alt = lot.title;
    thumbs.innerHTML = gallery.map((src, i) => `<button class="thumb${i === 0 ? ' active' : ''}" data-image="${src}" aria-label="View image ${i + 1}"><img src="${src.replace('w=1400', 'w=250')}" alt="${lot.title}, view ${i + 1}"></button>`).join('') + '<span>SELECT AN IMAGE TO VIEW</span>';
    thumbs.querySelectorAll('.thumb').forEach(btn => { btn.onclick = () => { thumbs.querySelectorAll('.thumb').forEach(b => b.classList.remove('active')); btn.classList.add('active'); mainImg.src = btn.dataset.image; }; });

    const lb = q('#image-lightbox'), lbImg = q('#lightbox-image'), closeLb = () => { lb.hidden = true; document.body.classList.remove('lightbox-open'); };
    if (q('#image-expand')) q('#image-expand').onclick = () => { lbImg.src = mainImg.src; lbImg.alt = lot.title; lb.hidden = false; document.body.classList.add('lightbox-open'); };
    if (q('#lightbox-close')) q('#lightbox-close').onclick = closeLb;
    if (lb) lb.onclick = e => { if (e.target === lb) closeLb(); };

    attachBidDeskUI({
      lot, inputEl: q('#bid-amount'), buttonEl: q('#place-bid'), feedbackEl: q('#bid-feedback'), historyEl: q('#bid-history-list'), feedbackBaseClass: 'bid-feedback',
      onUpdate: (p, b, d) => { setText('#current-bid', money(p)); setText('#bid-count', String(b).padStart(2, '0')); setText('#bid-increment', money(d.getIncrement())); },
      formatHistoryRow: (v, n, ago) => `<div class="history-row"><span><b>Bidder ${n}</b><small>${ago} · simulated</small></span><strong>${money(v)}</strong></div>`,
      userRowHtml: v => `<div class="history-row"><span><b>You (session bidder)</b><small>Just now · demo</small></span><strong>${money(v)}</strong></div>`
    });
    const saveBtn = q('#save-detail'), syncSave = () => { const s = Watchlist.has(lot.key); saveBtn.classList.toggle('saved', s); saveBtn.innerHTML = s ? '♥ <span>Saved</span>' : '♡ <span>Save lot</span>'; };
    if (saveBtn) saveBtn.onclick = () => { Watchlist.toggle(lot.key); syncSave(); }; syncSave();
    CatalogueService.getLots().then(all => {
      if (q('#view-lot')?.hidden) return;
      q('#similar-lots-grid').innerHTML = all.filter(i => i.id !== lot.id && i.category.toLowerCase() === lot.category.toLowerCase()).slice(0, 3)
        .map(i => `<article class="similar-lot"><a href="?page=lot&lot=${encodeURIComponent(i.id)}"><img src="${i.image}" alt="${i.title}" loading="lazy"><span>LOT ${i.number} / ${i.category.toUpperCase()}</span></a><h3><a href="?page=lot&lot=${encodeURIComponent(i.id)}">${i.title}</a></h3><p>${money(i.price)} / ${i.bids} bids</p></article>`).join('');
    });
    let rem = lot.ends; const tick = () => { setText('#countdown', Formatters.clock(rem)); if (rem > 0) rem -= 1; }; tick(); setPageInterval(tick, 1000);
  }

  // 4. Arena Controller: spotlight bid desk, floor cards & ticker.
  function initArena() {
    const liveLots = DATA.lots.filter(l => l.ends > 0 && l.ends < 86400).sort((a, b) => a.ends - b.ends);
    const active = DATA.lots.filter(l => l.ends > 0), sel = new URLSearchParams(window.location.search).get('lot');
    const featured = DATA.lots.find(l => l.id === sel) || liveLots[0] || active[0];
    setText('#arena-active-count', String(liveLots.length).padStart(2, '0'));
    q('#arena-featured-link').href = q('#arena-featured-action').href = `?page=lot&lot=${encodeURIComponent(featured.id)}`;
    q('#arena-featured-image').src = featured.image; q('#arena-featured-image').alt = featured.title; q('#arena-featured-save').dataset.save = featured.key;
    setText('#arena-featured-number', `LOT ${featured.number}`); setText('#arena-featured-category', featured.category.toUpperCase());
    setText('#arena-featured-status', Formatters.status(featured.ends)); setText('#arena-featured-title', featured.title);
    setText('#arena-featured-subtitle', featured.subtitle); setText('#arena-featured-estimate', featured.estimate);

    attachBidDeskUI({
      lot: featured, inputEl: q('#arena-bid-amount'), buttonEl: q('#arena-place-bid'), feedbackEl: q('#arena-feedback'), historyEl: q('#arena-history-list'), feedbackBaseClass: 'arena-feedback',
      onUpdate: (p, b, d) => { setText('#arena-featured-bid', money(p)); setText('#arena-current-bid', money(p)); setText('#arena-featured-bids', String(b).padStart(2, '0')); setText('#arena-min-bid', money(d.getMinimumBid())); setText('#arena-increment', money(d.getIncrement())); },
      formatHistoryRow: (v, n, ago) => `<div><span>Bidder ${n}<small>${ago} · simulated</small></span><strong>${money(v)}</strong></div>`,
      userRowHtml: v => `<div><span>You / demo bidder<small>Just now · session</small></span><strong>${money(v)}</strong></div>`
    });
    const floor = active.filter(l => l.id !== featured.id);
    q('#arena-floor').innerHTML = floor.map((l, idx) => {
      const st = Formatters.status(l.ends), enc = encodeURIComponent(l.id);
      return `<article class="arena-floor-lot arena-floor-lot-${idx + 1}"><div class="arena-floor-image"><a href="?page=lot&lot=${enc}"><img src="${l.image}" alt="${l.title}" loading="lazy"></a><span>LOT ${l.number}</span><b class="${st === 'CLOSING SOON' ? 'urgent' : ''}">${st}</b><button class="arena-save" data-save="${l.key}" aria-label="Save ${l.title}">♡</button></div><div class="arena-floor-copy"><p>${l.category.toUpperCase()} / ${l.period}</p><h3><a href="?page=lot&lot=${enc}">${l.title}</a></h3><div><strong>${money(l.price)}</strong><span>${String(l.bids).padStart(2, '0')} BIDS / ${l.ends < 86400 ? Formatters.clock(l.ends) : 'UPCOMING'}</span></div><a class="arena-select-link" href="?page=arena&lot=${enc}">Make featured ↗</a></div></article>`;
    }).join('');
    q('#arena-empty').hidden = floor.length > 0;
    q('#arena-activity').innerHTML = active.slice(0, 3).map((l, i) => `<article><span>0${i + 1}</span><p>${i === 0 ? `New bid placed on <strong>${l.title}</strong>.` : `Collectors watching <strong>${l.title}</strong>.`}</p><small>${i === 0 ? `DEMO BID / ${money(l.price)}` : `${Formatters.status(l.ends)} / LIVE FLOOR`}</small></article>`).join('');
    q('#arena-closing').innerHTML = DATA.lots.filter(l => l.ends < 86400).slice(0, 3).map(l => `<a href="?page=lot&lot=${encodeURIComponent(l.id)}"><span>LOT ${l.number} / ${Formatters.status(l.ends)}</span><strong>${l.title}</strong><small>${Formatters.clock(l.ends)} left ↗</small></a>`).join('');
    let rem = featured.ends; const tick = () => { setText('#arena-featured-closing', rem > 0 ? `CLOSING IN ${Formatters.clock(rem)}` : 'CLOSED / DEMO'); if (rem > 0) rem -= 1; }; tick(); setPageInterval(tick, 1000);
  }

  // 5. Journal & 6. Article Controllers
  const buildStoryCard = (a, isFeat) => `<article class="journal-story${isFeat ? ' journal-story-featured' : ''}"><a class="journal-story-image" href="?page=article&story=${encodeURIComponent(a.id)}"><img src="${a.image}" alt="${a.title}" loading="lazy"><span>${a.category.toUpperCase()}</span></a><div class="journal-story-copy"><div class="journal-story-meta"><span>${a.category.toUpperCase()}</span><span>${a.readingTime.toUpperCase()}</span></div><h2><a href="?page=article&story=${encodeURIComponent(a.id)}">${a.title}</a></h2><p>${a.subtitle}</p><a class="underlined-link" href="?page=article&story=${encodeURIComponent(a.id)}">Read article ↗</a></div></article>`;
  function initJournal() {
    const tabs = qa('[data-journal-filter]');
    const show = (cat = 'All Stories') => {
      const items = cat === 'All Stories' ? DATA.articles : DATA.articles.filter(a => a.category === cat);
      q('#journal-story-grid').innerHTML = items.map((a, i) => buildStoryCard(a, i === 0 && cat === 'All Stories')).join('');
      q('#journal-empty').hidden = items.length > 0;
      setText('#journal-results', `${String(items.length).padStart(2, '0')} ${items.length === 1 ? 'STORY' : 'STORIES'}`);
      tabs.forEach(t => t.classList.toggle('active', t.dataset.journalFilter === cat));
    };
    tabs.forEach(t => { t.onclick = () => show(t.dataset.journalFilter); }); show('All Stories');
  }
  function initArticle() {
    const root = q('#article-root'), sid = new URLSearchParams(window.location.search).get('story'), a = DATA.articles.find(x => x.id === sid || (sid && sid.startsWith(x.id)));
    if (!a) { document.title = 'Article not found — THE VAULT'; root.innerHTML = `<section class="article-not-found"><p class="eyebrow">THE JOURNAL / NOT FOUND</p><h1>Article<br><em>not found.</em></h1><p>This guide could not be found in the current edition.</p><a class="button button-dark" href="?page=journal">Back to The Journal <span>↗</span></a></section>`; return; }
    document.title = `${a.title} — THE VAULT`;
    root.innerHTML = `<div class="article-breadcrumb"><a href="?page=home">HOME</a><span>/</span><a href="?page=journal">THE JOURNAL</a><span>/</span><span>${a.category.toUpperCase()}</span></div><article class="journal-article"><header class="article-header"><div class="article-header-meta"><span>${a.category.toUpperCase()}</span><span>${a.readingTime.toUpperCase()}</span></div><h1>${a.title}</h1><p class="article-subtitle">${a.subtitle}</p></header><figure class="article-hero"><img src="${a.image}" alt="${a.title}"><figcaption>${a.caption} · THE VAULT</figcaption></figure><div class="article-body">${a.body.map(s => `<section><h2>${s.heading}</h2>${s.paragraphs.map(p => `<p>${p}</p>`).join('')}</section>`).join('')}</div></article><section class="article-related"><div class="journal-section-heading"><p class="eyebrow">CONTINUE READING</p><a class="underlined-link" href="?page=journal">All guides ↗</a></div><div class="article-related-grid">${a.related.map(id => DATA.articles.find(x => x.id === id)).filter(Boolean).map(x => buildStoryCard(x, false)).join('')}</div></section>`;
  }

  // 7. Contact Controller: topic shortcuts + form validation.
  function initContact() {
    const form = q('#contact-form'), conf = q('#contact-confirmation');
    const f = { name: q('#contact-name'), email: q('#contact-email'), type: q('#contact-type'), subject: q('#contact-subject'), message: q('#contact-message') };
    const errs = { name: q('#name-error'), email: q('#email-error'), type: q('#type-error'), subject: q('#subject-error'), message: q('#message-error') };
    const setErr = (k, m) => { if (errs[k]) { errs[k].textContent = m; errs[k].hidden = !m; } if (f[k]) { f[k].setAttribute('aria-invalid', String(Boolean(m))); f[k].classList.toggle('has-error', Boolean(m)); } };
    const validate = () => {
      const i = {};
      if (!f.name.value.trim()) i.name = 'Please enter your full name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) i.email = 'Enter a valid email address.';
      if (!f.type.value) i.type = 'Choose an enquiry topic.';
      if (!f.subject.value.trim()) i.subject = 'Enter a subject for your enquiry.';
      if (!f.message.value.trim()) i.message = 'Write a short message.';
      Object.keys(f).forEach(k => setErr(k, i[k] || '')); return i;
    };
    qa('[data-contact-type]').forEach(b => { b.onclick = () => { f.type.value = b.dataset.contactType; setErr('type', ''); f.type.focus(); }; });
    Object.keys(f).forEach(k => { if (f[k]) f[k].oninput = () => { if (f[k].getAttribute('aria-invalid') === 'true') validate(); }; });
    if (form) {
      form.onsubmit = e => { e.preventDefault(); conf.hidden = true; const i = validate(), keys = Object.keys(i); if (keys.length) return f[keys[0]]?.focus(); conf.hidden = false; };
      form.onreset = () => setTimeout(() => { Object.keys(f).forEach(k => setErr(k, '')); conf.hidden = true; }, 0);
    }
  }

  // 8. Auth Controller: Sign In, Create Account, Password Recovery & Admin Redirect
  function initAuth() {
    const auth = window.vaultAuth; if (!auth) return;
    const forms = { login: q('#auth-login-form'), register: q('#auth-register-form'), recovery: q('#auth-recovery-form'), reset: q('#auth-reset-form') };
    const params = new URLSearchParams(window.location.search), statusEl = q('#auth-status');
    let mode = (window.location.hash.includes('type=recovery') || params.get('mode') === 'reset') ? 'reset' : 'login';
    const showStatus = (t, kind = '') => { statusEl.textContent = t; statusEl.className = `auth-status ${kind}`.trim(); statusEl.hidden = !t; };
    const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), validPass = v => v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v);
    const switchMode = next => {
      mode = next; Object.entries(forms).forEach(([k, form]) => { if (form) form.hidden = k !== next; });
      qa('[data-auth-mode]').forEach(b => b.classList.toggle('active', b.dataset.authMode === next));
      setText('#auth-mode-label', next === 'register' ? 'CREATE ACCOUNT' : next.toUpperCase());
      q('#auth-panel-title').innerHTML = next === 'register' ? 'Create <em>account.</em>' : next === 'reset' ? 'Reset <em>password.</em>' : 'Welcome <em>back.</em>';
      showStatus('');
    };
    const syncAcct = s => {
      if (!q('#auth-account')) return;
      q('#auth-account').hidden = !s; q('.auth-modes').hidden = Boolean(s);
      if (s) { Object.values(forms).forEach(f => { f.hidden = true; }); setText('#auth-mode-label', 'SIGNED IN'); q('#auth-panel-title').innerHTML = 'Signed <em>in.</em>'; } else switchMode(mode);
    };
    forms.login.onsubmit = async e => {
      e.preventDefault(); const em = q('#login-email').value, pw = q('#login-password').value;
      if (!validEmail(em)) return showStatus('Enter a valid email address.', 'error');
      if (!pw) return showStatus('Enter your password.', 'error');
      showStatus('Signing in…', 'loading'); const res = await auth.signIn(em.trim(), pw);
      if (res?.error) return showStatus('Invalid email or password.', 'error');
      showStatus('You are signed in.', 'success'); if (params.get('next') === 'admin') navigate('?page=admin');
    };
    forms.register.onsubmit = async e => {
      e.preventDefault(); const em = q('#register-email').value, pw = q('#register-password').value, cf = q('#register-confirm').value;
      if (!validEmail(em)) return showStatus('Enter a valid email address.', 'error');
      if (!validPass(pw)) return showStatus('Use at least 8 characters with 1 letter and 1 number.', 'error');
      if (pw !== cf) return showStatus('Passwords do not match.', 'error');
      showStatus('Creating account…', 'loading'); const res = await auth.signUp(em.trim(), pw);
      if (res?.error) return showStatus('Could not create account. Email may already be registered.', 'error');
      showStatus(res?.data?.session ? 'Account created and signed in.' : 'Check your email to verify your account.', 'success');
    };
    forms.recovery.onsubmit = async e => {
      e.preventDefault(); const em = q('#recovery-email').value;
      if (!validEmail(em)) return showStatus('Enter a valid email address.', 'error');
      showStatus('Sending recovery email…', 'loading'); const res = await auth.requestPasswordReset(em.trim());
      showStatus(res?.error ? 'Unable to send recovery email.' : 'If an account exists, a recovery link was sent.', res?.error ? 'error' : 'success');
    };
    forms.reset.onsubmit = async e => {
      e.preventDefault(); const pw = q('#reset-password').value, cf = q('#reset-confirm').value;
      if (!validPass(pw)) return showStatus('Use at least 8 characters with 1 letter and 1 number.', 'error');
      if (pw !== cf) return showStatus('Passwords do not match.', 'error');
      const res = await auth.updatePassword(pw); if (res?.error) return showStatus('Could not update password.', 'error');
      switchMode('login'); showStatus('Password updated. Please sign in.', 'success');
    };
    qa('[data-auth-mode]').forEach(b => { b.onclick = () => switchMode(b.dataset.authMode); });
    const gLogin = async () => { const r = await auth.signInWithGoogle(); if (r?.error) showStatus('Google login requires Supabase OAuth configuration.', 'error'); };
    if (q('#google-login')) q('#google-login').onclick = gLogin; if (q('#google-register')) q('#google-register').onclick = gLogin;
    if (q('#auth-logout')) q('#auth-logout').onclick = async () => { await auth.signOut(); showStatus('Signed out.', 'success'); switchMode('login'); };
    auth.onAuthStateChange((ev, s) => { syncAcct(s); if (ev === 'PASSWORD_RECOVERY') switchMode('reset'); });
    auth.getSession().then(r => syncAcct(r.session)); switchMode(mode);
  }

  // 9. Admin Controller: RPC role guard, database metrics & Lots CRUD modals.
  async function initAdmin() {
    const auth = window.vaultAuth, accessBox = q('#admin-access-state'), dashboard = q('#admin-dashboard');
    const deny = msg => accessBox.replaceChildren(el('p', 'admin-kicker', 'ADMIN ACCESS ISSUE'), el('h1', '', 'Access denied.'), el('span', '', msg), Object.assign(el('a', 'admin-return-overview', 'Return home ↗'), { href: '?page=home' }));
    if (!auth?.configured || !auth.client) return deny('Supabase is not configured.');
    try {
      const ses = await auth.getSession();
      if (ses.error) return deny('Session could not be verified.');
      if (!ses.session) return navigate('?page=auth&next=admin', true);
      const roleCheck = await auth.isSuperAdmin();
      if (roleCheck.error || !roleCheck.authorized) return deny('This account does not have super-admin permissions.');

      const userId = ses.session.user.id; let adminLots = [], pendingDelete = null;
      setText('#admin-account-email', ses.session.user.email || 'Super-admin'); setText('#admin-sidebar-email', ses.session.user.email || 'Super-admin');
      accessBox.hidden = true; dashboard.hidden = false;
      const fmtDate = v => !v ? 'N/A' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(v));
      const countRows = async (table, fn) => { let qy = auth.client.from(table).select('*', { count: 'exact', head: true }); if (fn) qy = fn(qy); const { count, error } = await qy; return { value: error ? null : (count || 0), error }; };

      async function loadOverview() {
        const errors = [], metrics = await Promise.all([countRows('auction_lots'), countRows('auction_lots', r => r.not('published_at', 'is', null)), countRows('auction_lots', r => r.eq('status', 'live')), countRows('auction_lots', r => r.eq('status', 'closed')), countRows('bids'), countRows('profiles')]);
        ['stat-total-lots', 'stat-published-lots', 'stat-live-auctions', 'stat-closed-auctions', 'stat-total-bids', 'stat-members'].forEach((id, i) => { setText(`#${id}`, metrics[i].value === null ? 'Unavailable' : Number(metrics[i].value).toLocaleString('en-IN')); if (metrics[i].error) errors.push(metrics[i]); });
        const [lotsRes, bidsRes, msgRes] = await Promise.all([
          auth.client.from('auction_lots').select('id,lot_number,title,status,created_at').order('created_at', { ascending: false }).limit(5),
          auth.client.from('bids').select('id,lot_id,amount,created_at').order('created_at', { ascending: false }).limit(5),
          auth.client.from('contact_messages').select('id,enquiry_type,subject,status,created_at').order('created_at', { ascending: false }).limit(5)
        ]);
        [[lotsRes, 'recent-lots', r => [r.status.toUpperCase(), r.title, `LOT ${r.lot_number} · ${fmtDate(r.created_at)}`]], [bidsRes, 'recent-bids', r => ['BID', money(r.amount), `LOT ${String(r.lot_id).slice(0, 8)} · ${fmtDate(r.created_at)}`]], [msgRes, 'recent-enquiries', r => [r.status.toUpperCase(), r.subject, `${r.enquiry_type} · ${fmtDate(r.created_at)}`]]].forEach(([res, id, mapRow]) => {
          const box = q(`#${id}`); box.replaceChildren();
          if (res.error) box.append(el('p', 'admin-list-status is-error', 'Unavailable from database.'));
          else if (!res.data?.length) box.append(el('p', 'admin-list-status', 'No records yet.'));
          else res.data.forEach(item => { const [k, t, d] = mapRow(item); box.append(el('div', 'admin-activity-row', '', el('span', 'admin-row-kicker', k), el('strong', '', t), el('small', '', d))); });
        });
        const badge = q('#admin-connection'); badge.className = `admin-connection ${errors.length ? 'is-limited' : 'is-connected'}`;
        badge.replaceChildren(el('i'), document.createTextNode(errors.length ? 'Connected (partial)' : 'Supabase connected'));
      }
      async function loadAdminLots() {
        const st = q('#admin-lots-status'); st.hidden = false; st.textContent = 'Loading lots…'; q('#admin-lots-tbody').replaceChildren();
        const { data, error } = await auth.client.from('auction_lots').select('id,legacy_id,lot_number,category,period,title,subtitle,description,estimate_low,estimate_high,current_bid,status,published_at,lot_images(id,image_url,is_primary,sort_order)').order('created_at', { ascending: false });
        if (error) { st.textContent = `Error: ${error.message}`; return; } adminLots = data || []; renderAdminTable();
      }
      function renderAdminTable() {
        const tbody = q('#admin-lots-tbody'), st = q('#admin-lots-status'), qry = (q('#admin-lots-search')?.value || '').trim().toLowerCase(), stF = q('#admin-status-filter')?.value || 'all', catF = q('#admin-category-filter')?.value || 'all';
        const visible = adminLots.filter(l => (stF === 'all' || l.status === stF) && (catF === 'all' || l.category === catF) && (!qry || `${l.lot_number} ${l.title} ${l.category}`.toLowerCase().includes(qry)));
        tbody.replaceChildren(); if (!visible.length) { st.hidden = false; st.textContent = adminLots.length ? 'No matching lots.' : 'No lots in database yet.'; return; } st.hidden = true;
        visible.forEach(lot => {
          const imgs = lot.lot_images || [], thumb = (imgs.find(i => i.is_primary) || imgs[0])?.image_url || DATA.lots[0].image, sel = el('select', 'admin-action-btn');
          ['draft', 'scheduled', 'live', 'closed', 'withdrawn'].forEach(v => sel.append(Object.assign(el('option', '', v), { value: v, selected: lot.status === v })));
          sel.onchange = () => updateStatus(lot.id, sel.value);
          const editBtn = Object.assign(el('button', 'admin-action-btn', 'Edit'), { type: 'button', onclick: () => openLotModal(lot) });
          const delBtn = Object.assign(el('button', 'admin-action-btn', 'Delete'), { type: 'button', onclick: () => { pendingDelete = lot; setText('#delete-modal-copy', `Delete LOT ${lot.lot_number} ("${lot.title}")?`); q('#delete-modal-feedback').hidden = true; q('#withdraw-instead-btn').hidden = true; q('#confirm-delete-btn').disabled = false; q('#admin-delete-modal').hidden = false; } });
          tbody.append(el('tr', '', '', el('td', '', `LOT ${lot.lot_number}`), el('td', '', '', el('div', 'admin-lot-cell', '', Object.assign(el('img', 'admin-lot-thumb'), { src: thumb, alt: lot.title }), el('strong', '', lot.title))), el('td', '', lot.category), el('td', '', money(lot.current_bid || 0)), el('td', '', lot.estimate_low ? `${money(lot.estimate_low)} – ${money(lot.estimate_high || lot.estimate_low)}` : 'Upon request'), el('td', '', '', sel), el('td', '', '', el('div', 'admin-row-actions', '', editBtn, delBtn))));
        });
      }
      const updateStatus = async (id, status) => { const p = { status, updated_at: new Date().toISOString() }; if (status === 'live' || status === 'scheduled') p.published_at = p.updated_at; await auth.client.from('auction_lots').update(p).eq('id', id); loadAdminLots(); loadOverview(); };
      const openLotModal = lot => {
        q('#admin-lot-form').reset(); q('#modal-lot-feedback').hidden = true; q('#lot-form-mode').value = lot ? 'edit' : 'add'; q('#lot-form-id').value = lot?.id || ''; setText('#modal-lot-title', lot ? `Edit LOT ${lot.lot_number}` : 'Add auction listing');
        if (lot) {
          const pri = (lot.lot_images || []).find(i => i.is_primary) || lot.lot_images?.[0];
          [['#lot-form-title', lot.title], ['#lot-form-number', lot.lot_number], ['#lot-form-category', lot.category || 'Timepieces'], ['#lot-form-status', lot.status || 'live'], ['#lot-form-subtitle', lot.subtitle], ['#lot-form-description', lot.description], ['#lot-form-period', lot.period], ['#lot-form-price', lot.current_bid ?? 0], ['#lot-form-est-low', lot.estimate_low ?? ''], ['#lot-form-est-high', lot.estimate_high ?? ''], ['#lot-form-image', pri?.image_url]].forEach(([s, v]) => { q(s).value = v ?? ''; });
          q('#lot-form-published').checked = Boolean(lot.published_at);
        }
        q('#admin-lot-modal').hidden = false;
      };
      q('#admin-lot-form').onsubmit = async e => {
        e.preventDefault(); const title = q('#lot-form-title').value.trim(), num = q('#lot-form-number').value.trim(), now = new Date().toISOString();
        if (!title || !num) { q('#modal-lot-feedback').hidden = false; q('#modal-lot-feedback').textContent = 'Title and lot number are required.'; return; }
        const payload = { lot_number: num, category: q('#lot-form-category').value, period: q('#lot-form-period').value.trim() || null, title, subtitle: q('#lot-form-subtitle').value.trim() || null, description: q('#lot-form-description').value.trim() || null, estimate_low: q('#lot-form-est-low').value ? Number(q('#lot-form-est-low').value) : null, estimate_high: q('#lot-form-est-high').value ? Number(q('#lot-form-est-high').value) : null, current_bid: Number(q('#lot-form-price').value) || 0, status: q('#lot-form-status').value, published_at: q('#lot-form-published').checked ? now : null, updated_at: now };
        const imgUrl = q('#lot-form-image').value.trim();
        if (q('#lot-form-mode').value === 'add') { payload.legacy_id = `lot-${Date.now().toString(36)}`; payload.created_by = userId; const { data } = await auth.client.from('auction_lots').insert(payload).select().single(); if (imgUrl && data) await auth.client.from('lot_images').insert({ lot_id: data.id, image_url: imgUrl, alt_text: title, is_primary: true, sort_order: 0 }); }
        else await auth.client.from('auction_lots').update(payload).eq('id', q('#lot-form-id').value);
        q('#admin-lot-modal').hidden = true; loadAdminLots(); loadOverview();
      };
      q('#confirm-delete-btn').onclick = async () => {
        if (!pendingDelete) return; const { error } = await auth.client.from('auction_lots').delete().eq('id', pendingDelete.id);
        if (error) { q('#delete-modal-feedback').hidden = false; q('#delete-modal-feedback').textContent = error.code === '23503' ? 'Bids exist on this lot. Mark it as withdrawn instead.' : error.message; if (error.code === '23503') q('#withdraw-instead-btn').hidden = false; return; }
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
      const switchSection = (k, label) => {
        setText('#admin-section-title', label); qa('[data-admin-section]').forEach(a => a.classList.toggle('active', a.dataset.adminSection === k));
        q('#admin-overview').hidden = k !== 'overview'; q('#admin-lots').hidden = k !== 'lots'; q('#admin-placeholder').hidden = k === 'overview' || k === 'lots';
        if (k === 'lots') loadAdminLots(); else if (k !== 'overview') { setText('#admin-placeholder-title', label); setText('#admin-placeholder-copy', `${label} module is planned for a future update.`); }
        q('#admin-sidebar').classList.remove('is-open');
      };
      qa('[data-admin-section]').forEach(a => { a.onclick = e => { e.preventDefault(); switchSection(a.dataset.adminSection, a.dataset.sectionLabel); }; });
      q('#admin-menu-toggle').onclick = () => q('#admin-sidebar').classList.toggle('is-open');
      qa('#admin-top-logout, #admin-sidebar-logout').forEach(b => { b.onclick = async () => { await auth.signOut(); navigate('?page=auth', true); }; });
      q('#admin-add-lot-btn').onclick = () => openLotModal(null); q('#admin-refresh-lots-btn').onclick = loadAdminLots;
      ['#admin-lots-search', '#admin-status-filter', '#admin-category-filter'].forEach(sel => { if (q(sel)) q(sel)[sel.includes('search') ? 'oninput' : 'onchange'] = renderAdminTable; });
      ['#admin-lot-modal-close', '#lot-form-cancel'].forEach(sel => { if (q(sel)) q(sel).onclick = () => { q('#admin-lot-modal').hidden = true; }; });
      ['#admin-delete-modal-close', '#cancel-delete-btn'].forEach(sel => { if (q(sel)) q(sel).onclick = () => { q('#admin-delete-modal').hidden = true; }; });
      switchSection('overview', 'Overview'); await loadOverview();
    } catch { deny('Admin dashboard could not be loaded.'); }
  }

  // Controller Map & Master View Switcher
  const CONTROLLERS = { home: initHome, explore: initExplore, lot: initLot, arena: initArena, journal: initJournal, article: initArticle, contact: initContact, auth: initAuth, admin: initAdmin };
  function resolvePage() { const qp = new URLSearchParams(window.location.search).get('page'); return (qp && PAGE_META[qp]) ? qp : LEGACY_MAP[window.location.pathname.split('/').pop().toLowerCase()] || 'home'; }
  function showPage() {
    clearTimers(); const page = resolvePage(), meta = PAGE_META[page] || PAGE_META.home;
    qa('.page-view').forEach(s => { s.hidden = s.id !== `view-${page}`; });
    document.body.dataset.page = page; document.body.classList.remove('arena-page', 'auth-page', 'admin-page', 'lightbox-open');
    if (meta.cls) document.body.classList.add(meta.cls); document.title = meta.title;
    if (q('meta[name="theme-color"]')) q('meta[name="theme-color"]').content = meta.theme;
    syncShell(page); CONTROLLERS[page]?.(); Watchlist.bindButtons();
  }

  window.VaultApp = Object.freeze({ lots: DATA.lots, sampleLots: DATA.lots, catalogue: CatalogueService, articles: DATA.articles, formatters: Formatters, watchlist: Watchlist, init: showPage });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showPage); else showPage();
})();
