// THE VAULT — Core Application Utilities, Supabase Auth, Watchlist, BidDesk & SPA Router
(function () {
  'use strict';

  // DOM utility helpers for clean selectors and safe element creation.
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const setText = (selector, value) => {
    const node = qs(selector);
    if (node) node.textContent = value;
  };
  const createEl = (tag, className = '', text = '', ...children) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== '' && text != null) node.textContent = text;
    if (children.length) node.append(...children);
    return node;
  };

  // Track countdown timers so switching views clears old background intervals cleanly.
  const activeTimers = new Set();
  const setPageInterval = (callback, ms) => {
    const id = setInterval(callback, ms);
    activeTimers.add(id);
    return id;
  };
  const clearTimers = () => {
    activeTimers.forEach(id => clearInterval(id));
    activeTimers.clear();
  };

  // 1. Supabase Authentication Client & Admin Role Check
  const config = window.VAULT_SUPABASE_CONFIG || {};
  const isConfigured = Boolean(window.supabase && config.url && config.publishableKey && !config.url.includes('YOUR_PROJECT_REF'));
  const client = isConfigured ? window.supabase.createClient(config.url, config.publishableKey) : null;
  const unconfiguredError = () => ({ data: null, error: new Error('Supabase authentication is not configured.') });
  const authRedirectUrl = () => new URL('?page=auth', window.location.href).href;

  async function getSession() {
    if (!client) return { session: null, error: unconfiguredError().error };
    try {
      const { data, error } = await client.auth.getSession();
      return { session: data?.session || null, error };
    } catch (error) {
      return { session: null, error };
    }
  }

  async function isSuperAdmin() {
    const { session, error } = await getSession();
    if (error || !session) return { authorized: false, error };
    try {
      const res = await client.rpc('is_super_admin');
      return { authorized: !res.error && res.data === true, error: res.error };
    } catch (err) {
      return { authorized: false, error: err };
    }
  }

  window.vaultAuth = Object.freeze({
    configured: isConfigured,
    client,
    getSession,
    isSuperAdmin,
    redirectUrl: authRedirectUrl,
    signUp: (email, password) => !client ? unconfiguredError() : client.auth.signUp({ email, password, options: { emailRedirectTo: authRedirectUrl() } }),
    signIn: (email, password) => !client ? unconfiguredError() : client.auth.signInWithPassword({ email, password }),
    signInWithGoogle: () => !client ? unconfiguredError() : client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: authRedirectUrl() } }),
    requestPasswordReset: email => !client ? unconfiguredError() : client.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl() }),
    updatePassword: password => !client ? unconfiguredError() : client.auth.updateUser({ password }),
    signOut: () => !client ? { error: null } : client.auth.signOut(),
    onAuthStateChange: callback => !client ? { unsubscribe() { } } : client.auth.onAuthStateChange((ev, session) => callback(ev, session)).data.subscription
  });

  // 2. Display Formatters & Persistent Watchlist (localStorage)
  const Formatters = {
    currency: amount => '₹' + Number(amount).toLocaleString('en-IN'),
    clock: totalSeconds => {
      const sec = Math.max(0, Math.floor(totalSeconds));
      const parts = [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60];
      return parts.map(unit => String(unit).padStart(2, '0')).join(':');
    },
    status: item => {
      const seconds = typeof item === 'object' && item ? item.ends : Number(item);
      if (seconds < 14400) return 'CLOSING SOON';
      if (seconds < 86400) return 'LIVE TODAY';
      return 'UPCOMING';
    },
    closing: item => {
      const seconds = typeof item === 'object' && item ? item.ends : Number(item);
      return seconds < 86400 ? 'Closes today' : `Closes in ${Math.ceil(seconds / 86400)} days`;
    }
  };
  const money = Formatters.currency;

  const Watchlist = {
    getAll() {
      try {
        const parsed = JSON.parse(localStorage.getItem('vault-saved-lots') || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    },
    save(keys) {
      try { localStorage.setItem('vault-saved-lots', JSON.stringify(keys)); } catch { }
      this.updateBadges();
      document.dispatchEvent(new CustomEvent('vault:saved-change', { detail: { saved: keys } }));
    },
    has: key => Watchlist.getAll().includes(key),
    toggle(key) {
      const current = this.getAll();
      const updated = current.includes(key) ? current.filter(item => item !== key) : [...current, key];
      this.save(updated);
      return updated.includes(key);
    },
    updateBadges() {
      const count = this.getAll().length;
      qsa('.saved-count').forEach(badge => { badge.textContent = count; });
      qsa('#saved-filter-count').forEach(badge => { badge.textContent = String(count).padStart(2, '0'); });
    },
    bindButtons() {
      const savedKeys = this.getAll();
      qsa('[data-save]').forEach(btn => {
        const key = btn.dataset.save;
        const isSaved = savedKeys.includes(key);
        btn.classList.toggle('saved', isSaved);
        btn.textContent = isSaved ? '♥' : '♡';
        btn.onclick = event => {
          event.preventDefault();
          event.stopPropagation();
          const active = this.toggle(key);
          btn.classList.toggle('saved', active);
          btn.textContent = active ? '♥' : '♡';
        };
      });
      this.updateBadges();
    }
  };

  // 3. Simulated Bid Desk (Closure + sessionStorage) & Supabase Catalogue Service
  const getSessionBids = () => {
    try { return JSON.parse(sessionStorage.getItem('vault-demo-bids') || '{}'); }
    catch { return {}; }
  };
  const saveSessionBid = (lotId, price, bidCount) => {
    try {
      const map = getSessionBids();
      map[lotId] = { price, bidCount, ts: Date.now() };
      sessionStorage.setItem('vault-demo-bids', JSON.stringify(map));
    } catch { }
  };

  function createBidDesk({ lotId, initialPrice, initialBids, increment = 5000, onBidAccepted }) {
    const savedState = lotId ? getSessionBids()[lotId] : null;
    let price = savedState ? savedState.price : initialPrice;
    let count = savedState ? savedState.bidCount : initialBids;

    const getMinimumBid = () => price + increment;
    const getValidationError = amount => {
      if (!Number.isFinite(amount) || amount <= 0) return `Enter a bid of at least ${money(getMinimumBid())}.`;
      if (amount < getMinimumBid() || (amount - price) % increment !== 0) {
        return `Enter a bid of at least ${money(getMinimumBid())} in increments of ${money(increment)}.`;
      }
      return '';
    };

    return {
      getCurrentPrice: () => price,
      getBidCount: () => count,
      getMinimumBid,
      getIncrement: () => increment,
      getValidationError,
      isValid: amount => !getValidationError(amount),
      recordBid(amount) {
        if (getValidationError(amount)) return false;
        price = amount;
        count += 1;
        if (lotId) saveSessionBid(lotId, price, count);
        onBidAccepted?.(price, count);
        return true;
      },
      getSimulatedHistory: () => [price, price - increment, price - increment * 2].filter(val => val > 0)
    };
  }

  function attachBidDeskUI({ lot, inputEl, buttonEl, feedbackEl, historyEl, feedbackBaseClass, onUpdate, formatHistoryRow, userRowHtml }) {
    const desk = createBidDesk({
      lotId: lot.id,
      initialPrice: lot.price,
      initialBids: lot.bids,
      onBidAccepted: (newPrice, newCount) => {
        onUpdate(newPrice, newCount, desk);
        if (inputEl) inputEl.min = inputEl.value = desk.getMinimumBid();
      }
    });
    onUpdate(desk.getCurrentPrice(), desk.getBidCount(), desk);
    if (inputEl) {
      inputEl.min = inputEl.value = desk.getMinimumBid();
      inputEl.step = desk.getIncrement();
    }
    if (historyEl) {
      historyEl.innerHTML = desk.getSimulatedHistory()
        .map((val, idx) => formatHistoryRow(val, String(lot.bids - idx).padStart(2, '0'), idx === 0 ? 'Just now' : `${(idx + 1) * 12} min ago`))
        .join('');
    }
    if (buttonEl) {
      buttonEl.onclick = () => {
        const amount = Number(inputEl?.value);
        const errorMsg = desk.getValidationError(amount);
        if (errorMsg) {
          if (feedbackEl) { feedbackEl.textContent = errorMsg; feedbackEl.className = `${feedbackBaseClass} error`; }
          return;
        }
        desk.recordBid(amount);
        historyEl?.insertAdjacentHTML('afterbegin', userRowHtml(amount));
        if (feedbackEl) {
          feedbackEl.textContent = 'Demo bid accepted in this browser. No real bid or payment has been submitted.';
          feedbackEl.className = `${feedbackBaseClass} success`;
        }
      };
    }
  }

  const CatalogueService = {
    cache: null,
    pending: null,
    async getLots() {
      if (this.cache) return this.cache;
      if (this.pending) return this.pending;
      const fallback = window.VAULT_DATA.lots;
      this.pending = (async () => {
        if (!client) return (this.cache = fallback);
        try {
          const { data, error } = await client
            .from('auction_lots')
            .select('id,legacy_id,lot_number,category,period,title,subtitle,description,estimate_low,estimate_high,current_bid,bid_count,ends_at,status,published_at,lot_images(image_url,alt_text,is_primary,sort_order)')
            .in('status', ['scheduled', 'live', 'closed'])
            .not('published_at', 'is', null)
            .order('created_at', { ascending: false });
          if (error || !data?.length) return (this.cache = fallback);
          const sessionBids = getSessionBids();
          return (this.cache = data.map(row => {
            const imgs = (Array.isArray(row.lot_images) ? [...row.lot_images] : []).sort((a, b) => (b.is_primary - a.is_primary) || ((a.sort_order || 0) - (b.sort_order || 0)));
            const primaryImg = imgs[0]?.image_url || fallback[0].image;
            const id = row.legacy_id || row.id;
            const bidState = sessionBids[id];
            return {
              id, dbId: row.id, key: `lot-${id}`,
              number: (row.lot_number || '').replace(/^LOT\s*/i, '').trim() || '001',
              category: row.category || 'Collectibles',
              period: row.period || 'Contemporary',
              title: row.title,
              subtitle: row.subtitle || '',
              price: bidState ? bidState.price : (Number(row.current_bid) || 0),
              bids: bidState ? bidState.bidCount : (Number(row.bid_count) || 0),
              estimate: row.estimate_low && row.estimate_high ? `${money(row.estimate_low)} – ${money(row.estimate_high)}` : row.estimate_low ? `From ${money(row.estimate_low)}` : 'Estimate on request',
              ends: row.ends_at ? Math.max(0, Math.floor((new Date(row.ends_at) - Date.now()) / 1000)) : 86400,
              image: primaryImg,
              gallery: imgs.length ? imgs.map(img => img.image_url) : [primaryImg],
              story: row.description || '',
              status: row.status
            };
          }));
        } catch {
          return (this.cache = fallback);
        } finally {
          this.pending = null;
        }
      })();
      return this.pending;
    },
    async getLotById(id) {
      const lots = await this.getLots();
      const findMatch = list => list.find(item => item.id === id || (id && (id.startsWith(item.id) || item.id.startsWith(id))));
      return findMatch(lots) || findMatch(window.VAULT_DATA.lots) || (!id ? lots[0] || window.VAULT_DATA.lots[0] : null);
    }
  };

  // 4. Shared SPA Router & Header/Footer Sync
  const LEGACY_MAP = {
    'index.html': 'home', 'explore.html': 'explore', 'lot.html': 'lot', 'arena.html': 'arena',
    'journal.html': 'journal', 'article.html': 'article', 'about.html': 'about',
    'contact.html': 'contact', 'auth.html': 'auth', 'admin.html': 'admin'
  };

  function normalizeSpaUrl(rawUrl) {
    const parsed = new URL(rawUrl, window.location.href);
    const filename = parsed.pathname.split('/').pop().toLowerCase();
    if (LEGACY_MAP[filename] && filename !== 'index.html') {
      parsed.pathname = parsed.pathname.replace(/[^/]+$/, 'index.html');
      parsed.searchParams.set('page', LEGACY_MAP[filename]);
    }
    return parsed.pathname + parsed.search + parsed.hash;
  }

  function navigate(rawUrl, replace = false) {
    const nextUrl = normalizeSpaUrl(rawUrl);
    const parsed = new URL(nextUrl, window.location.href);
    history[replace ? 'replaceState' : 'pushState'](null, '', nextUrl);
    window.VaultApp?.init();
    if (parsed.hash && qs(parsed.hash)) qs(parsed.hash).scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'auto' });
  }

  let shellBound = false;
  function bindShellEvents() {
    if (shellBound) return;
    shellBound = true;
    window.addEventListener('popstate', () => window.VaultApp?.init());
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest?.('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (href === '#') { event.preventDefault(); return; }
      if (href.startsWith('#')) {
        const target = qs(href);
        if (target) { event.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
        return;
      }
      event.preventDefault();
      navigate(url.href);
    });
    const toggle = qs('.mobile-menu-toggle');
    const nav = qs('.main-nav');
    toggle?.addEventListener('click', () => {
      const open = nav?.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '×' : '☰';
    });
    qs('#footer-back-top')?.addEventListener('click', event => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    const syncAccountLink = session => qsa('.account-link').forEach(link => {
      link.innerHTML = session ? 'Account <span>↗</span>' : 'Sign in <span>↗</span>';
      link.setAttribute('aria-label', session ? 'Open account' : 'Sign in');
    });
    getSession().then(res => syncAccountLink(res.session));
    window.vaultAuth.onAuthStateChange((_ev, session) => syncAccountLink(session));
  }

  function syncShell(page) {
    bindShellEvents();
    const isAdmin = page === 'admin';
    ['#top-bar', '#site-header', '#site-footer'].forEach(selector => {
      const el = qs(selector);
      if (el) el.hidden = isAdmin;
    });
    const nav = qs('.main-nav'), toggle = qs('.mobile-menu-toggle');
    if (nav?.classList.contains('open')) {
      nav.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
      if (toggle) toggle.textContent = '☰';
    }
    if (isAdmin) return;

    const tags = {
      home: 'WATCHES, FINE ART, JEWELRY & CLASSIC CARS',
      arena: 'LIVE BIDDING SIMULATOR (SESSION DEMO)',
      journal: 'COLLECTOR GUIDES & ARTICLES',
      article: 'COLLECTOR GUIDES & ARTICLES',
      contact: 'ENQUIRY FORM (LOCAL DEMO)',
      auth: 'MEMBER LOGIN & ADMIN ACCESS'
    };
    const tagEl = qs('#announcement-tag');
    if (tagEl) tagEl.innerHTML = `${tags[page] || 'CURATED ONLINE AUCTIONS (INR)'} <i>↗</i>`;

    const activeTab = page === 'lot' ? 'explore' : page === 'article' ? 'journal' : page;
    qsa('.main-nav a[data-nav]').forEach(link => link.classList.toggle('active', link.dataset.nav === activeTab));

    const collectionsLink = qs('#nav-collections');
    if (collectionsLink) collectionsLink.href = page === 'home' ? '#collections' : '?page=explore&category=Timepieces';

    const contextLink = qs('#header-context-link');
    if (contextLink) {
      contextLink.href = page === 'article' ? '?page=journal' : page === 'explore' ? '?page=about' : '?page=explore';
      contextLink.innerHTML = `${page === 'article' ? 'All guides' : page === 'explore' ? 'How it works' : 'Browse lots'} <span>↗</span>`;
    }
  }

  window.VaultCore = Object.freeze({
    q: qs, qa: qsa, setText, el: createEl, Formatters, money,
    Watchlist, createBidDesk, attachBidDeskUI, CatalogueService,
    syncShell, navigate, setPageInterval, clearTimers, LEGACY_MAP
  });
})();
