// THE VAULT — Core Application Utilities, Supabase Auth, Watchlist, BidDesk & SPA Router
(function () {
  'use strict';

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const setText = (sel, val) => { const n = qs(sel); if (n) n.textContent = val; };
  const createEl = (tag, cls = '', text = '', ...kids) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== '' && text != null) n.textContent = text;
    if (kids.length) n.append(...kids);
    return n;
  };
  const timers = new Set();
  const setPageInterval = (fn, ms) => { const id = setInterval(fn, ms); timers.add(id); return id; };
  const clearTimers = () => { timers.forEach(clearInterval); timers.clear(); };

  // 1. Supabase Authentication & Super-Admin RPC Guard
  const cfg = window.VAULT_SUPABASE_CONFIG || {};
  const isConfigured = Boolean(window.supabase && cfg.url && cfg.publishableKey && !cfg.url.includes('YOUR_PROJECT_REF'));
  const client = isConfigured ? window.supabase.createClient(cfg.url, cfg.publishableKey) : null;
  const noConfig = () => ({ data: null, error: new Error('Supabase authentication is not configured.') });
  const redirectUrl = () => new URL('?page=auth', window.location.href).href;

  async function getSession() {
    if (!client) return { session: null, error: noConfig().error };
    try { const { data, error } = await client.auth.getSession(); return { session: data?.session || null, error }; }
    catch (error) { return { session: null, error }; }
  }
  async function isSuperAdmin() {
    const { session, error } = await getSession();
    if (error || !session) return { authorized: false, error };
    try { const res = await client.rpc('is_super_admin'); return { authorized: !res.error && res.data === true, error: res.error }; }
    catch (err) { return { authorized: false, error: err }; }
  }

  window.vaultAuth = Object.freeze({
    configured: isConfigured, client, getSession, isSuperAdmin, redirectUrl,
    signUp: (email, password) => !client ? noConfig() : client.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl() } }),
    signIn: (email, password) => !client ? noConfig() : client.auth.signInWithPassword({ email, password }),
    signInWithGoogle: () => !client ? noConfig() : client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectUrl() } }),
    requestPasswordReset: email => !client ? noConfig() : client.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() }),
    updatePassword: password => !client ? noConfig() : client.auth.updateUser({ password }),
    signOut: () => !client ? { error: null } : client.auth.signOut(),
    onAuthStateChange: fn => !client ? { unsubscribe() {} } : client.auth.onAuthStateChange((ev, s) => fn(ev, s)).data.subscription
  });

  // 2. Display Formatters & Persistent Watchlist (localStorage)
  const Formatters = {
    currency: amount => '₹' + Number(amount).toLocaleString('en-IN'),
    clock: total => {
      const s = Math.max(0, Math.floor(total));
      return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(u => String(u).padStart(2, '0')).join(':');
    },
    status: item => { const s = typeof item === 'object' && item ? item.ends : Number(item); return s < 14400 ? 'CLOSING SOON' : s < 86400 ? 'LIVE TODAY' : 'UPCOMING'; },
    closing: item => { const s = typeof item === 'object' && item ? item.ends : Number(item); return s < 86400 ? 'Closes today' : `Closes in ${Math.ceil(s / 86400)} days`; }
  };
  const money = Formatters.currency;

  const Watchlist = {
    getAll() { try { const p = JSON.parse(localStorage.getItem('vault-saved-lots') || '[]'); return Array.isArray(p) ? p : []; } catch { return []; } },
    save(keys) {
      try { localStorage.setItem('vault-saved-lots', JSON.stringify(keys)); } catch {}
      this.updateBadges();
      document.dispatchEvent(new CustomEvent('vault:saved-change', { detail: { saved: keys } }));
    },
    has: key => Watchlist.getAll().includes(key),
    toggle(key) {
      const cur = this.getAll(), next = cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key];
      this.save(next); return next.includes(key);
    },
    updateBadges() {
      const count = this.getAll().length;
      qsa('.saved-count').forEach(b => { b.textContent = count; });
      qsa('#saved-filter-count').forEach(b => { b.textContent = String(count).padStart(2, '0'); });
    },
    bindButtons() {
      const saved = this.getAll();
      qsa('[data-save]').forEach(btn => {
        const key = btn.dataset.save, active = saved.includes(key);
        btn.classList.toggle('saved', active); btn.textContent = active ? '♥' : '♡';
        btn.onclick = e => {
          e.preventDefault(); e.stopPropagation();
          const on = this.toggle(key);
          btn.classList.toggle('saved', on); btn.textContent = on ? '♥' : '♡';
        };
      });
      this.updateBadges();
    }
  };

  // 3. Simulated Bid Desk & Supabase Catalogue Loader
  const getSessionBids = () => { try { return JSON.parse(sessionStorage.getItem('vault-demo-bids') || '{}'); } catch { return {}; } };
  const saveSessionBid = (lotId, price, bidCount) => { try { const m = getSessionBids(); m[lotId] = { price, bidCount, ts: Date.now() }; sessionStorage.setItem('vault-demo-bids', JSON.stringify(m)); } catch {} };

  function createBidDesk({ lotId, initialPrice, initialBids, increment = 5000, onBidAccepted }) {
    const saved = lotId ? getSessionBids()[lotId] : null;
    let price = saved ? saved.price : initialPrice, count = saved ? saved.bidCount : initialBids;
    const getMinimumBid = () => price + increment;
    const getValidationError = amount => {
      if (!Number.isFinite(amount) || amount <= 0) return `Enter a bid of at least ${money(getMinimumBid())}.`;
      if (amount < getMinimumBid() || (amount - price) % increment !== 0) return `Enter a bid of at least ${money(getMinimumBid())} in increments of ${money(increment)}.`;
      return '';
    };
    return {
      getCurrentPrice: () => price, getBidCount: () => count, getMinimumBid, getIncrement: () => increment,
      getValidationError, isValid: amount => !getValidationError(amount),
      recordBid(amount) {
        if (getValidationError(amount)) return false;
        price = amount; count += 1; if (lotId) saveSessionBid(lotId, price, count);
        onBidAccepted?.(price, count); return true;
      },
      getSimulatedHistory: () => [price, price - increment, price - increment * 2].filter(v => v > 0)
    };
  }

  function attachBidDeskUI({ lot, inputEl, buttonEl, feedbackEl, historyEl, feedbackBaseClass, onUpdate, formatHistoryRow, userRowHtml }) {
    const desk = createBidDesk({ lotId: lot.id, initialPrice: lot.price, initialBids: lot.bids, onBidAccepted: (p, c) => { onUpdate(p, c, desk); if (inputEl) inputEl.min = inputEl.value = desk.getMinimumBid(); } });
    onUpdate(desk.getCurrentPrice(), desk.getBidCount(), desk);
    if (inputEl) { inputEl.min = inputEl.value = desk.getMinimumBid(); inputEl.step = desk.getIncrement(); }
    if (historyEl) historyEl.innerHTML = desk.getSimulatedHistory().map((v, i) => formatHistoryRow(v, String(lot.bids - i).padStart(2, '0'), i === 0 ? 'Just now' : `${(i + 1) * 12} min ago`)).join('');
    if (buttonEl) {
      buttonEl.onclick = () => {
        const amount = Number(inputEl?.value), err = desk.getValidationError(amount);
        if (err) { if (feedbackEl) { feedbackEl.textContent = err; feedbackEl.className = `${feedbackBaseClass} error`; } return; }
        desk.recordBid(amount); historyEl?.insertAdjacentHTML('afterbegin', userRowHtml(amount));
        if (feedbackEl) { feedbackEl.textContent = 'Demo bid accepted in this browser. No real bid or payment has been submitted.'; feedbackEl.className = `${feedbackBaseClass} success`; }
      };
    }
  }

  const CatalogueService = {
    cache: null, pending: null,
    async getLots() {
      if (this.cache) return this.cache;
      if (this.pending) return this.pending;
      const fallback = window.VAULT_DATA.lots;
      this.pending = (async () => {
        if (!client) return (this.cache = fallback);
        try {
          const { data, error } = await client.from('auction_lots')
            .select('id,legacy_id,lot_number,category,period,title,subtitle,description,estimate_low,estimate_high,current_bid,bid_count,ends_at,status,published_at,lot_images(image_url,alt_text,is_primary,sort_order)')
            .in('status', ['scheduled', 'live', 'closed']).not('published_at', 'is', null).order('created_at', { ascending: false });
          if (error || !data?.length) return (this.cache = fallback);
          const sessionBids = getSessionBids();
          return (this.cache = data.map(r => {
            const imgs = (Array.isArray(r.lot_images) ? [...r.lot_images] : []).sort((a, b) => (b.is_primary - a.is_primary) || ((a.sort_order || 0) - (b.sort_order || 0)));
            const pri = imgs[0]?.image_url || fallback[0].image, id = r.legacy_id || r.id, b = sessionBids[id];
            return {
              id, dbId: r.id, key: `lot-${id}`, number: (r.lot_number || '').replace(/^LOT\s*/i, '').trim() || '001',
              category: r.category || 'Collectibles', period: r.period || 'Contemporary', title: r.title, subtitle: r.subtitle || '',
              price: b ? b.price : (Number(r.current_bid) || 0), bids: b ? b.bidCount : (Number(r.bid_count) || 0),
              estimate: r.estimate_low && r.estimate_high ? `${money(r.estimate_low)} – ${money(r.estimate_high)}` : r.estimate_low ? `From ${money(r.estimate_low)}` : 'Estimate on request',
              ends: r.ends_at ? Math.max(0, Math.floor((new Date(r.ends_at) - Date.now()) / 1000)) : 86400,
              image: pri, gallery: imgs.length ? imgs.map(i => i.image_url) : [pri], story: r.description || '', status: r.status
            };
          }));
        } catch { return (this.cache = fallback); } finally { this.pending = null; }
      })();
      return this.pending;
    },
    async getLotById(id) {
      const lots = await this.getLots(), find = list => list.find(i => i.id === id || (id && (id.startsWith(i.id) || i.id.startsWith(id))));
      return find(lots) || find(window.VAULT_DATA.lots) || (!id ? lots[0] || window.VAULT_DATA.lots[0] : null);
    }
  };

  // 4. Shared SPA Router & Header/Footer Sync
  const LEGACY_MAP = { 'index.html': 'home', 'explore.html': 'explore', 'lot.html': 'lot', 'arena.html': 'arena', 'journal.html': 'journal', 'article.html': 'article', 'about.html': 'about', 'contact.html': 'contact', 'auth.html': 'auth', 'admin.html': 'admin' };

  function navigate(rawUrl, replace = false) {
    const parsed = new URL(rawUrl, window.location.href), file = parsed.pathname.split('/').pop().toLowerCase();
    if (LEGACY_MAP[file] && file !== 'index.html') { parsed.pathname = parsed.pathname.replace(/[^/]+$/, 'index.html'); parsed.searchParams.set('page', LEGACY_MAP[file]); }
    history[replace ? 'replaceState' : 'pushState'](null, '', parsed.pathname + parsed.search + parsed.hash);
    window.VaultApp?.init();
    if (parsed.hash && qs(parsed.hash)) qs(parsed.hash).scrollIntoView({ behavior: 'smooth' }); else window.scrollTo({ top: 0, behavior: 'auto' });
  }

  let shellBound = false;
  function bindShellEvents() {
    if (shellBound) return; shellBound = true;
    window.addEventListener('popstate', () => window.VaultApp?.init());
    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest?.('a[href]'); if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const href = link.getAttribute('href'); if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const url = new URL(href, window.location.href); if (url.origin !== window.location.origin) return;
      if (href === '#') { e.preventDefault(); return; }
      if (href.startsWith('#')) { const t = qs(href); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); } return; }
      e.preventDefault(); navigate(url.href);
    });
    const toggle = qs('.mobile-menu-toggle'), nav = qs('.main-nav');
    toggle?.addEventListener('click', () => { const open = nav?.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); toggle.textContent = open ? '×' : '☰'; });
    qs('#footer-back-top')?.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    const syncAcct = s => qsa('.account-link').forEach(l => { l.innerHTML = s ? 'Account <span>↗</span>' : 'Sign in <span>↗</span>'; l.setAttribute('aria-label', s ? 'Open account' : 'Sign in'); });
    getSession().then(r => syncAcct(r.session)); window.vaultAuth.onAuthStateChange((_ev, s) => syncAcct(s));
  }

  function syncShell(page) {
    bindShellEvents();
    const isAdmin = page === 'admin';
    ['#top-bar', '#site-header', '#site-footer'].forEach(sel => { if (qs(sel)) qs(sel).hidden = isAdmin; });
    const nav = qs('.main-nav'), toggle = qs('.mobile-menu-toggle');
    if (nav?.classList.contains('open')) { nav.classList.remove('open'); toggle?.setAttribute('aria-expanded', 'false'); if (toggle) toggle.textContent = '☰'; }
    if (isAdmin) return;
    const tags = { home: 'WATCHES, FINE ART, JEWELRY & CLASSIC CARS', arena: 'LIVE BIDDING SIMULATOR (SESSION DEMO)', journal: 'COLLECTOR GUIDES & ARTICLES', article: 'COLLECTOR GUIDES & ARTICLES', contact: 'ENQUIRY FORM (LOCAL DEMO)', auth: 'MEMBER LOGIN & ADMIN ACCESS' };
    if (qs('#announcement-tag')) qs('#announcement-tag').innerHTML = `${tags[page] || 'CURATED ONLINE AUCTIONS (INR)'} <i>↗</i>`;
    const activeTab = page === 'lot' ? 'explore' : page === 'article' ? 'journal' : page;
    qsa('.main-nav a[data-nav]').forEach(l => l.classList.toggle('active', l.dataset.nav === activeTab));
    if (qs('#nav-collections')) qs('#nav-collections').href = page === 'home' ? '#collections' : '?page=explore&category=Timepieces';
    if (qs('#header-context-link')) {
      qs('#header-context-link').href = page === 'article' ? '?page=journal' : page === 'explore' ? '?page=about' : '?page=explore';
      qs('#header-context-link').innerHTML = `${page === 'article' ? 'All guides' : page === 'explore' ? 'How it works' : 'Browse lots'} <span>↗</span>`;
    }
  }

  window.VaultCore = Object.freeze({ q: qs, qa: qsa, setText, el: createEl, Formatters, money, Watchlist, createBidDesk, attachBidDeskUI, CatalogueService, syncShell, navigate, setPageInterval, clearTimers, LEGACY_MAP });
})();
