// THE VAULT — Core Engine (DOM Helpers, Supabase Auth, Watchlist, BidDesk, Catalogue & SPA Router)
(function () {
  'use strict';

  // Short DOM helpers: q() finds the first match, qa() returns a real Array, el() builds safe elements (using textContent to avoid XSS).
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const setText = (s, v) => { const e = q(s); if (e) e.textContent = v; };
  const el = (tag, cls = '', text = '', ...kids) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls; if (text !== '' && text != null) n.textContent = text; if (kids.length) n.append(...kids); return n;
  };

  // Track active countdown intervals per SPA view so navigating between pages never leaks background timers.
  const timers = new Set();
  const setPageInterval = (fn, ms) => { const id = setInterval(fn, ms); timers.add(id); return id; };
  const clearTimers = () => { timers.forEach(id => clearInterval(id)); timers.clear(); };

  // 1. Supabase Auth Client — wraps Supabase Auth + PostgreSQL RPC checks.
  const cfg = window.VAULT_SUPABASE_CONFIG || {};
  const isCfg = Boolean(window.supabase && cfg.url && cfg.publishableKey && !cfg.url.includes('YOUR_PROJECT_REF'));
  const client = isCfg ? window.supabase.createClient(cfg.url, cfg.publishableKey) : null;
  const uncfg = () => ({ data: null, error: new Error('Supabase authentication is not configured.') });
  const redir = () => new URL('?page=auth', window.location.href).href;

  async function getSession() {
    if (!client) return { session: null, error: uncfg().error };
    try { const { data, error } = await client.auth.getSession(); return { session: data?.session || null, error }; }
    catch (error) { return { session: null, error }; }
  }
  // Calls PostgreSQL SECURITY DEFINER function is_super_admin() so only verified admin accounts can open Admin.
  async function isSuperAdmin() {
    const { session, error } = await getSession();
    if (error || !session) return { authorized: false, error };
    try { const r = await client.rpc('is_super_admin'); return { authorized: !r.error && r.data === true, error: r.error }; }
    catch (err) { return { authorized: false, error: err }; }
  }

  let authSubs = [];
  const vaultAuth = Object.freeze({
    configured: isCfg, client, getSession, isSuperAdmin, redirectUrl: redir,
    signUp: (email, password) => !client ? uncfg() : client.auth.signUp({ email, password, options: { emailRedirectTo: redir() } }),
    signIn: (email, password) => !client ? uncfg() : client.auth.signInWithPassword({ email, password }),
    signInWithGoogle: () => !client ? uncfg() : client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redir() } }),
    requestPasswordReset: email => !client ? uncfg() : client.auth.resetPasswordForEmail(email, { redirectTo: redir() }),
    updatePassword: password => !client ? uncfg() : client.auth.updateUser({ password }),
    signOut: () => !client ? { error: null } : client.auth.signOut(),
    onAuthStateChange: cb => {
      if (!client) return { unsubscribe() {} };
      const sub = client.auth.onAuthStateChange((ev, s) => cb(ev, s)).data.subscription;
      authSubs.push(sub); return sub;
    }
  });
  window.vaultAuth = vaultAuth;

  // 2. Formatters & Watchlist (LocalStorage) — formats INR currency, HH:MM:SS clocks, and persists saved hearts across sessions.
  const Formatters = {
    currency: v => '₹' + Number(v).toLocaleString('en-IN'),
    clock: sec => { const s = Math.max(0, Math.floor(sec)); return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(u => String(u).padStart(2, '0')).join(':'); },
    status: x => { const s = typeof x === 'object' && x ? x.ends : Number(x); return s < 14400 ? 'CLOSING SOON' : s < 86400 ? 'LIVE TODAY' : 'UPCOMING'; },
    closing: x => { const s = typeof x === 'object' && x ? x.ends : Number(x); return s < 86400 ? 'Closes today' : `Closes in ${Math.ceil(s / 86400)} days`; }
  };
  const money = Formatters.currency;

  const Watchlist = {
    getAll: () => { try { const p = JSON.parse(localStorage.getItem('vault-saved-lots') || '[]'); return Array.isArray(p) ? p : []; } catch { return []; } },
    save(items) { try { localStorage.setItem('vault-saved-lots', JSON.stringify(items)); } catch {} this.updateBadges(); document.dispatchEvent(new CustomEvent('vault:saved-change', { detail: { saved: items } })); },
    has: key => Watchlist.getAll().includes(key),
    toggle(key) { const c = this.getAll(), n = c.includes(key) ? c.filter(i => i !== key) : [...c, key]; this.save(n); return n.includes(key); },
    updateBadges() { const n = this.getAll().length; qa('.saved-count').forEach(e => { e.textContent = n; }); qa('#saved-filter-count').forEach(e => { e.textContent = String(n).padStart(2, '0'); }); },
    bindButtons() {
      const saved = this.getAll();
      qa('[data-save]').forEach(b => {
        const key = b.dataset.save, on = saved.includes(key);
        b.classList.toggle('saved', on); b.textContent = on ? '♥' : '♡';
        if (b.dataset.saveBound) return; b.dataset.saveBound = '1';
        b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); const act = this.toggle(key); b.classList.toggle('saved', act); b.textContent = act ? '♥' : '♡'; });
      });
      this.updateBadges();
    }
  };

  // 3. Simulated Bid Desk (Closure + SessionStorage) & CatalogueService (Supabase DB with Static Fallback)
  const getBids = () => { try { return JSON.parse(sessionStorage.getItem('vault-demo-bids') || '{}'); } catch { return {}; } };
  const setBid = (id, price, bidCount) => { try { const m = getBids(); m[id] = { price, bidCount, ts: Date.now() }; sessionStorage.setItem('vault-demo-bids', JSON.stringify(m)); } catch {} };

  // Closure keeps private bid state (price, count) safe while enforcing ₹5,000 minimum step validation.
  function createBidDesk({ lotId, initialPrice, initialBids, increment = 5000, onBidAccepted }) {
    const st = lotId ? getBids()[lotId] : null; let price = st ? st.price : initialPrice, count = st ? st.bidCount : initialBids;
    const min = () => price + increment;
    const err = amt => (!Number.isFinite(amt) || amt <= 0) ? `Enter a bid of at least ${money(min())}.` : (amt < min() || (amt - price) % increment !== 0) ? `Enter a bid of at least ${money(min())} in increments of ${money(increment)}.` : '';
    return {
      getCurrentPrice: () => price, getBidCount: () => count, getMinimumBid: min, getIncrement: () => increment, getValidationError: err, isValid: a => !err(a),
      recordBid(amt) { if (err(amt)) return false; price = amt; count += 1; if (lotId) setBid(lotId, price, count); onBidAccepted?.(price, count); return true; },
      getSimulatedHistory: () => [price, price - increment, price - increment * 2].filter(v => v > 0)
    };
  }

  function attachBidDeskUI({ lot, inputEl, buttonEl, feedbackEl, historyEl, feedbackBaseClass, onUpdate, formatHistoryRow, userRowHtml }) {
    const desk = createBidDesk({ lotId: lot.id, initialPrice: lot.price, initialBids: lot.bids, onBidAccepted: (p, c) => { onUpdate(p, c, desk); if (inputEl) inputEl.min = inputEl.value = desk.getMinimumBid(); } });
    onUpdate(desk.getCurrentPrice(), desk.getBidCount(), desk);
    if (inputEl) { inputEl.min = inputEl.value = desk.getMinimumBid(); inputEl.step = desk.getIncrement(); }
    if (historyEl) historyEl.innerHTML = desk.getSimulatedHistory().map((v, i) => formatHistoryRow(v, String(lot.bids - i).padStart(2, '0'), i === 0 ? 'Just now' : `${(i + 1) * 12} min ago`)).join('');
    buttonEl?.addEventListener('click', () => {
      const amt = Number(inputEl?.value), e = desk.getValidationError(amt);
      if (e) { if (feedbackEl) { feedbackEl.textContent = e; feedbackEl.className = `${feedbackBaseClass} error`; } return; }
      desk.recordBid(amt); historyEl?.insertAdjacentHTML('afterbegin', userRowHtml(amt));
      if (feedbackEl) { feedbackEl.textContent = 'Demo bid accepted in this browser. No real bid or payment has been submitted.'; feedbackEl.className = `${feedbackBaseClass} success`; }
    });
  }

  // Fetches published lots + joined lot_images from Supabase; silently falls back to VAULT_DATA.lots if offline or empty.
  const CatalogueService = {
    cache: null, pending: null,
    async getLots() {
      if (this.cache) return this.cache; if (this.pending) return this.pending;
      const sample = window.VAULT_DATA.lots;
      this.pending = (async () => {
        if (!client) return (this.cache = sample);
        try {
          const { data, error } = await client.from('auction_lots').select('id,legacy_id,lot_number,category,period,title,subtitle,description,estimate_low,estimate_high,current_bid,bid_count,ends_at,status,published_at,lot_images(image_url,alt_text,is_primary,sort_order)').in('status', ['scheduled', 'live', 'closed']).not('published_at', 'is', null).order('created_at', { ascending: false });
          if (error || !data?.length) return (this.cache = sample);
          const bids = getBids();
          return (this.cache = data.map(r => {
            const imgs = (Array.isArray(r.lot_images) ? [...r.lot_images] : []).sort((a, b) => (b.is_primary - a.is_primary) || ((a.sort_order || 0) - (b.sort_order || 0)));
            const pri = imgs[0]?.image_url || 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=1000&q=85', id = r.legacy_id || r.id, st = bids[id];
            return { id, dbId: r.id, key: `lot-${id}`, number: (r.lot_number || '').replace(/^LOT\s*/i, '').trim() || '001', category: r.category || 'Objects', period: r.period || 'Contemporary', title: r.title, subtitle: r.subtitle || '', price: st ? st.price : (Number(r.current_bid) || 0), bids: st ? st.bidCount : (Number(r.bid_count) || 0), estimate: r.estimate_low && r.estimate_high ? `${money(r.estimate_low)} – ${money(r.estimate_high)}` : r.estimate_low ? `From ${money(r.estimate_low)}` : 'Estimate upon request', ends: r.ends_at ? Math.max(0, Math.floor((new Date(r.ends_at) - Date.now()) / 1000)) : 86400, image: pri, gallery: imgs.length ? imgs.map(i => i.image_url) : [pri], story: r.description || '', status: r.status, isDatabase: true };
          }));
        } catch { return (this.cache = sample); } finally { this.pending = null; }
      })();
      return this.pending;
    },
    async getLotById(id) {
      const all = await this.getLots(), find = list => list.find(i => i.id === id || (id && (id.startsWith(i.id) || i.id.startsWith(id))));
      return find(all) || find(window.VAULT_DATA.lots) || (!id ? all[0] || window.VAULT_DATA.lots[0] : null);
    }
  };

  // 4. Shared SPA Router & Page Shell — updates #vault-root without full browser reloads.
  const LEGACY_MAP = { 'index.html': 'home', 'explore.html': 'explore', 'lot.html': 'lot', 'arena.html': 'arena', 'journal.html': 'journal', 'article.html': 'article', 'about.html': 'about', 'contact.html': 'contact', 'auth.html': 'auth', 'admin.html': 'admin' };
  const normalizeSpaUrl = raw => {
    const u = new URL(raw, window.location.href), file = u.pathname.split('/').pop().toLowerCase();
    if (LEGACY_MAP[file] && file !== 'index.html') { u.pathname = u.pathname.replace(/[^/]+$/, 'index.html'); u.searchParams.set('page', LEGACY_MAP[file]); }
    return u.pathname + u.search + u.hash;
  };
  // Navigates smoothly via History API and triggers VaultApp.init() to render the target screen.
  function navigate(rawUrl, replace = false) {
    const next = normalizeSpaUrl(rawUrl), u = new URL(next, window.location.href);
    history[replace ? 'replaceState' : 'pushState'](null, '', next);
    window.VaultApp?.init();
    if (u.hash && q(u.hash)) q(u.hash).scrollIntoView({ behavior: 'smooth' }); else window.scrollTo({ top: 0, behavior: 'auto' });
  }

  // Intercept internal <a> clicks once at document level for zero-reload SPA transitions & Back/Forward support.
  let spaBound = false;
  function bindSpaLinks() {
    if (spaBound) return; spaBound = true;
    window.addEventListener('popstate', () => { window.VaultApp?.init(); });
    document.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href'); if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (href === '#') { e.preventDefault(); return; }
      if (href.startsWith('#')) {
        const target = q(href); if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
        return;
      }
      e.preventDefault(); navigate(url.href);
    });
  }

  // Builds the shared announcement bar, header navigation, <main> view content, and footer inside #vault-root.
  function mountShell(page, mainHtml) {
    bindSpaLinks();
    // Unsubscribe previous route's auth listeners so switching pages does not accumulate duplicate callbacks.
    authSubs.forEach(s => s?.unsubscribe?.()); authSubs = [];
    let root = q('#vault-root');
    if (!root) { root = el('div'); root.id = 'vault-root'; document.body.appendChild(root); }
    if (page === 'admin') { root.innerHTML = mainHtml; return; }
    const rightTag = { home: 'WHERE RARITY MEETS COMPETITION', arena: 'THE ARENA / SIMULATED SESSION', journal: 'THE JOURNAL / EDITORIAL DEMONSTRATION', article: 'THE JOURNAL / EDITORIAL DEMONSTRATION', contact: 'PRIVATE CORRESPONDENCE / DEMONSTRATION', auth: 'PRIVATE ACCESS / DEMONSTRATION' }[page] || 'COLLECT WITH INTENTION';
    const navLinks = [['home', '?page=home', 'Home'], ['explore', '?page=explore', 'Auctions'], ['arena', '?page=arena', 'Arena'], ['collections', page === 'home' ? '#collections' : '?page=explore&category=Timepieces', 'Collections'], ['journal', '?page=journal', 'Journal'], ['about', '?page=about', 'About']];
    const activeTab = page === 'lot' ? 'explore' : page === 'article' ? 'journal' : page;
    const header = page === 'auth'
      ? `<header class="site-header auth-header"><a class="wordmark" href="?page=home" aria-label="The Vault home">THE VAULT<span>.</span></a><a class="underlined-link" href="?page=home">Return to the house ↗</a></header>`
      : `<header class="site-header"><a class="wordmark" href="?page=home" aria-label="The Vault home">THE VAULT<span>.</span></a><button class="mobile-menu-toggle" aria-label="Open navigation" aria-expanded="false">☰</button><nav class="main-nav" aria-label="Main navigation">${navLinks.map(([k, href, lbl]) => `<a class="${activeTab === k ? 'active' : ''}" href="${href}">${lbl}</a>`).join('')}</nav><div class="header-actions"><a class="text-link" href="${page === 'article' ? '?page=journal' : page === 'explore' ? '?page=about' : '?page=explore'}">${page === 'article' ? 'All stories' : page === 'explore' ? 'The house' : 'Discover lots'} <span>↗</span></a><a class="icon-link watchlist-link" href="?page=explore&saved=true" aria-label="Saved lots">♡ <span class="saved-count">0</span></a><a class="account-link" href="?page=auth">Enter <span>↗</span></a></div></header>`;
    const footerBot = page === 'auth' ? `<span>© 2026 THE VAULT — STUDENT PROJECT / DEMO</span><span>PRIVATE ACCESS / DEMONSTRATION ONLY</span><span>NO SOCIAL ACCOUNTS</span>`
      : (page === 'home' || page === 'about') ? `<span>© 2026 THE VAULT — STUDENT PROJECT / DEMO</span><span>MADE WITH INTENTION, NOT IN A HURRY.</span><span>NO SOCIAL ACCOUNTS / DEMONSTRATION ONLY</span>`
      : `<span>© 2026 THE VAULT — STUDENT PROJECT / DEMO</span><span>${page === 'arena' ? 'THE ARENA / SIMULATED ONLY' : 'MADE WITH INTENTION, NOT IN A HURRY.'}</span><span><a href="?page=about">THE HOUSE</a> &nbsp; / &nbsp; <a href="?page=contact">CONTACT</a> &nbsp; / &nbsp; <a href="?page=home">HOME</a></span>`;
    const footerLinks = ['home', 'about', 'journal', 'article', 'contact'].includes(page) ? `<div class="footer-links"><a href="?page=explore">AUCTIONS</a><a href="?page=about">THE HOUSE</a><a href="${page === 'home' ? '#collections' : '?page=explore&category=Timepieces'}">COLLECTIONS</a><a href="?page=journal">JOURNAL</a><a href="?page=contact">CONTACT</a><a href="#">LEGAL</a></div>` : '';

    root.innerHTML = `<div class="announcement"><span>THE VAULT — AN INDEPENDENT AUCTION HOUSE</span><span>${rightTag} <i>↗</i></span></div>${header}${mainHtml}<footer class="site-footer page-gutter"><div class="footer-top"><a class="wordmark footer-wordmark" href="?page=home">THE VAULT<span>.</span></a><p>An independent digital auction house<br>for objects with a story to tell.</p><a class="back-top" href="${page === 'auth' ? '?page=home' : '#top'}">${page === 'auth' ? 'Back to the house ↗' : 'Back to top ↑'}</a></div>${footerLinks}<div class="footer-bottom">${footerBot}</div></footer>`;

    const toggle = q('.mobile-menu-toggle'), nav = q('.main-nav');
    toggle?.addEventListener('click', () => { const open = nav?.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); toggle.textContent = open ? '×' : '☰'; });
    if (page !== 'auth') qa('a.back-top').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
    const syncNav = s => qa('.account-link').forEach(a => { a.innerHTML = s ? 'Account <span>↗</span>' : 'Enter <span>↗</span>'; a.setAttribute('aria-label', s ? 'Open account' : 'Sign in'); });
    getSession().then(r => syncNav(r.session));
    vaultAuth.onAuthStateChange((_ev, s) => syncNav(s));
  }

  window.VaultCore = Object.freeze({ q, qa, setText, el, Formatters, money, Watchlist, createBidDesk, attachBidDeskUI, CatalogueService, mountShell, navigate, setPageInterval, clearTimers, LEGACY_MAP });
})();
