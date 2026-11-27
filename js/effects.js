// THE VAULT — Sensory Effects Engine (Preloader, Dual Cursor + Trail, Fireflies, Sound Jar & Three.js 3D Stage)
// Uses an IIFE (Immediately Invoked Function Expression) so internal helper variables stay private.
(function () {
  'use strict';

  // Wait until document.body exists before attaching overlay elements or canvases.
  const onBody = fn => document.body ? fn() : document.addEventListener('DOMContentLoaded', fn);

  // Shared helper: creates a full-viewport fixed 2D <canvas> scaled by devicePixelRatio (for crisp Retina rendering).
  function makeCanvas(id, cls) {
    let c = document.getElementById(id);
    if (!c) { c = Object.assign(document.createElement('canvas'), { id, className: cls }); c.setAttribute('aria-hidden', 'true'); }
    const ctx = c.getContext('2d', { alpha: true });
    const resize = () => {
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2), w = window.innerWidth, h = window.innerHeight;
      c.width = Math.floor(w * dpr); c.height = Math.floor(h * dpr); c.style.width = w + 'px'; c.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    onBody(() => { if (!c.parentNode) document.body.appendChild(c); resize(); });
    return { canvas: c, ctx, resize };
  }

  // 1. Preloader Curtain — covers the screen on first visit, then slides away using CSS transitions.
  class VaultLoader {
    constructor() {
      const start = performance.now(); let visited = false;
      // sessionStorage remembers within the current tab whether the long intro already played.
      try { visited = sessionStorage.getItem('vault_visited') === 'true'; } catch {}
      const el = Object.assign(document.createElement('div'), {
        id: 'vaultLoader', className: 'vault-loader',
        innerHTML: `<div class="vault-loader-frame"><div class="vault-loader-frame-row"><span>THE VAULT / DIGITAL HOUSE</span><span>EST. 2026</span></div><div class="vault-loader-frame-row"><span>CURATED AUCTIONS</span><span>EDITION NO. 01</span></div></div><div class="vault-loader-center"><h1 class="vault-loader-brand">THE VAULT<span>.</span></h1><div class="vault-loader-divider"></div><div class="vault-loader-status"><span>PREPARING THE COLLECTION</span><span class="vault-loader-caret"></span></div><div class="vault-loader-dots"><div class="vault-loader-dot"></div><div class="vault-loader-dot"></div><div class="vault-loader-dot"></div></div></div>`
      });
      el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); el.setAttribute('aria-label', 'Loading The Vault');
      onBody(() => { if (!document.getElementById('vaultLoader')) document.body.prepend(el); });
      this.el = el;
      const done = () => setTimeout(() => this.dismiss(), Math.max(0, (visited ? 160 : 800) - (performance.now() - start)));
      if (document.readyState === 'complete') done(); else window.addEventListener('load', done, { once: true });
      setTimeout(() => this.dismiss(), 2000); // Safety fallback so the curtain never stays stuck.
    }
    dismiss() {
      if (!this.el || this.el.classList.contains('is-hidden')) return;
      this.el.classList.add('is-hidden');
      try { sessionStorage.setItem('vault_visited', 'true'); } catch {}
      setTimeout(() => { if (this.el) this.el.style.display = 'none'; }, 750);
    }
  }

  // 2. Dual Custom Cursor & Quadratic Bezier Gold Trail — uses LERP (linear interpolation) for smooth lag.
  class VaultCursor {
    constructor() {
      this.m = { x: -100, y: -100 }; this.dot = { x: -100, y: -100 }; this.ring = { x: -100, y: -100 };
      this.pts = []; this.moved = this.inside = false; this.last = 0; this.raf = null;
      this.dotEl = Object.assign(document.createElement('div'), { id: 'vaultCursorDot', className: 'vault-cursor-dot is-hidden' });
      this.ringEl = Object.assign(document.createElement('div'), { id: 'vaultCursorRing', className: 'vault-cursor-ring is-hidden', innerHTML: '<span class="vault-cursor-label">VIEW</span>' });
      this.dotEl.setAttribute('aria-hidden', 'true'); this.ringEl.setAttribute('aria-hidden', 'true');
      onBody(() => { if (!document.getElementById('vaultCursorDot')) document.body.append(this.dotEl, this.ringEl); });

      const layer = makeCanvas('vaultTrailCanvas', 'vault-trail-canvas'); this.ctx = layer.ctx;
      const mv = e => this.onMove(e);
      window.addEventListener('pointermove', mv, { passive: true }); window.addEventListener('mousemove', mv, { passive: true });
      window.addEventListener('resize', layer.resize, { passive: true });
      document.addEventListener('mouseleave', () => { this.inside = false; this.hide(true); }, { passive: true });
      document.addEventListener('mouseenter', e => { this.inside = true; this.m.x = e.clientX; this.m.y = e.clientY; this.hide(false); this.loop(); }, { passive: true });
      // Event delegation: inspect whatever element sits under the cursor and style the ring ("VIEW" on lot cards).
      document.addEventListener('pointerover', e => {
        const t = e.target; if (!t?.closest) return;
        if (t.closest('input, textarea, select, [contenteditable="true"]')) return this.hide(true);
        if (this.inside) this.hide(false);
        const card = Boolean(t.closest('.lot-card, .editorial-lot, .home-live-card, [data-lot-card]'));
        const btn = !card && Boolean(t.closest('button, [role="button"], .admin-action-btn, .filter-chip, .thumb'));
        this.ringEl.classList.toggle('is-card', card); this.dotEl.classList.toggle('is-card', card);
        this.ringEl.classList.toggle('is-button', btn); this.ringEl.classList.toggle('is-hovering', !card && !btn && Boolean(t.closest('a')));
      }, { passive: true });
    }
    hide(h) { const v = h || !this.inside; this.dotEl.classList.toggle('is-hidden', v); this.ringEl.classList.toggle('is-hidden', v); }
    onMove(e) {
      if (e.pointerType === 'touch' && window.innerWidth < 680) return;
      const now = performance.now(); document.body.classList.add('vault-cursor-active');
      if (!this.moved) { this.moved = this.inside = true; this.dot.x = this.ring.x = this.m.x = e.clientX; this.dot.y = this.ring.y = this.m.y = e.clientY; this.hide(false); }
      const dx = e.clientX - this.m.x, dy = e.clientY - this.m.y; this.m.x = e.clientX; this.m.y = e.clientY; this.last = now;
      if (Math.hypot(dx, dy) > 2) { this.pts.unshift({ x: e.clientX, y: e.clientY, vx: dx * 0.16, vy: dy * 0.16, b: now }); if (this.pts.length > 20) this.pts.length = 20; }
      this.loop();
    }
    loop() {
      if (this.raf) return;
      const step = now => {
        // Inner dot catches up quickly (65% per frame); outer ring trails softly (18% per frame).
        this.dot.x += (this.m.x - this.dot.x) * 0.65; this.dot.y += (this.m.y - this.dot.y) * 0.65;
        this.ring.x += (this.m.x - this.ring.x) * 0.18; this.ring.y += (this.m.y - this.ring.y) * 0.18;
        for (let i = this.pts.length - 1; i >= 0; i--) {
          const p = this.pts[i]; if (now - p.b >= 320) { this.pts.splice(i, 1); continue; }
          p.vx *= 0.84; p.vy *= 0.84; p.x += p.vx; p.y += p.vy;
          if (i > 0) { p.x += (this.pts[i - 1].x - p.x) * 0.16; p.y += (this.pts[i - 1].y - p.y) * 0.16; }
        }
        if (this.moved && this.inside) {
          this.dotEl.style.transform = `translate3d(${this.dot.x}px,${this.dot.y}px,0) translate(-50%,-50%)`;
          this.ringEl.style.transform = `translate3d(${this.ring.x}px,${this.ring.y}px,0) translate(-50%,-50%)`;
        }
        const ctx = this.ctx, pts = this.pts;
        if (ctx) {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          if (pts.length > 1) {
            ctx.save(); ctx.lineCap = ctx.lineJoin = 'round';
            for (let i = 0; i < pts.length - 1; i++) {
              const p1 = pts[i], p2 = pts[i + 1], prog = Math.min(1, (now - p1.b) / 320), a = Math.pow(1 - prog, 1.35);
              if (a <= 0.01) continue;
              const w = Math.max(0.4, 0.4 + (1 - prog) * 2.2); ctx.beginPath();
              if (i === 0) { ctx.moveTo(p1.x, p1.y); ctx.lineTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2); }
              else { ctx.moveTo((pts[i - 1].x + p1.x) / 2, (pts[i - 1].y + p1.y) / 2); ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2); }
              ctx.strokeStyle = `rgba(202,162,94,${a * 0.75})`; ctx.lineWidth = w; ctx.shadowColor = `rgba(186,142,66,${a * 0.45})`; ctx.shadowBlur = 4; ctx.stroke();
              if (i < 4) { ctx.strokeStyle = `rgba(255,252,245,${a * 0.88})`; ctx.lineWidth = Math.max(0.4, w * 0.45); ctx.shadowBlur = 0; ctx.stroke(); }
            }
            ctx.restore();
          }
        }
        // Pause rAF loop automatically when idle to save battery/CPU.
        if (now - this.last > 220 && !this.pts.length) { this.raf = null; return; }
        this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    }
  }

  // 3. Ambient Firefly Colony — drifting glowing particles emitted from the Sound Jar that dodge the mouse.
  class VaultFireflies {
    constructor() {
      const layer = makeCanvas('vaultFireflyCanvas', 'vault-firefly-canvas');
      this.ctx = layer.ctx; this.mx = -100; this.my = -100; this.raf = null; this.paused = false;
      const em = this.emitter(); this.particles = Array.from({ length: window.innerWidth < 680 ? 7 : 12 }, () => this.resetParticle({}, em, true));
      const mv = e => { this.mx = e.clientX; this.my = e.clientY; };
      window.addEventListener('pointermove', mv, { passive: true }); window.addEventListener('mousemove', mv, { passive: true });
      window.addEventListener('resize', layer.resize, { passive: true });
      document.addEventListener('visibilitychange', () => { this.paused = document.hidden; if (this.paused && this.raf) { cancelAnimationFrame(this.raf); this.raf = null; } else if (!this.paused) this.loop(); });
      this.loop();
    }
    emitter() { const r = document.getElementById('vaultSoundJar')?.getBoundingClientRect(); return r ? { x: r.left + 15, y: Math.max(12, r.top + 8) } : { x: window.innerWidth - 65, y: 130 }; }
    resetParticle(p, em, init) {
      const w = window.innerWidth, h = window.innerHeight, d = 0.5 + Math.random() * 0.5, ang = (0.55 + Math.random() * 0.38) * Math.PI, sp = (0.28 + Math.random() * 0.36) * d;
      return Object.assign(p, {
        d, r: 2 + d * 1.6, ta: 0.65 + d * 0.35, a: 0, trail: [], dying: false, hover: false, hoverUntil: 0,
        x: init ? em.x + (Math.random() - 0.5) * w * 0.75 : em.x + (Math.random() - 0.5) * 8,
        y: init ? 35 + Math.random() * h * 0.65 : em.y + Math.random() * 4,
        born: performance.now() - (init ? Math.random() * 9000 : 0), vx: Math.cos(ang) * sp, vy: Math.abs(Math.sin(ang) * sp),
        wa: Math.random() * Math.PI * 2, wr: 0.07 + Math.random() * 0.12, pp: Math.random() * Math.PI * 2, ps: 0.0018 + Math.random() * 0.0028,
        nextHover: performance.now() + 4500 + Math.random() * 8000, life: 22000 + Math.random() * 16000
      });
    }
    emitBurst(n = 3) { const em = this.emitter(); for (let i = 0; i < Math.min(n, this.particles.length); i++) { const p = this.resetParticle(this.particles[i], em, false); p.vx = -(0.45 + Math.random() * 0.45) * p.d; p.vy = (0.25 + Math.random() * 0.35) * p.d; } }
    loop() { if (!this.raf && !this.paused) { const t = now => { this.render(now); this.raf = requestAnimationFrame(t); }; this.raf = requestAnimationFrame(t); } }
    render(now) {
      const ctx = this.ctx; if (!ctx) return;
      const w = window.innerWidth, h = window.innerHeight, em = this.emitter(); ctx.clearRect(0, 0, w, h);
      if (!document.getElementById('vaultSoundJar')?.classList.contains('is-scrolled-hidden')) {
        const pulse = (Math.sin(now * 0.0016) + 1) / 2, rad = 38 + pulse * 16, al = 0.16 + pulse * 0.09, g = ctx.createRadialGradient(em.x, em.y, 0, em.x, em.y, rad);
        g.addColorStop(0, `rgba(245,218,156,${al * 1.5})`); g.addColorStop(0.4, `rgba(224,188,120,${al})`); g.addColorStop(0.78, `rgba(182,138,64,${al * 0.25})`); g.addColorStop(1, 'rgba(164,122,54,0)');
        ctx.beginPath(); ctx.arc(em.x, em.y, rad, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      }
      ctx.save();
      for (const p of this.particles) {
        const age = now - p.born; p.a = age < 2200 ? (age / 2200) * p.ta : p.dying ? p.a - 0.014 : p.ta;
        if (age >= p.life || p.y > h + 30 || p.x < -50 || p.x > w + 50) p.dying = true;
        if (p.dying && p.a <= 0) { this.resetParticle(p, em, false); continue; }
        if (now > p.nextHover && !p.hover && !p.dying) { p.hover = true; p.hoverUntil = now + 1200 + Math.random() * 1800; p.nextHover = now + 8000 + Math.random() * 12000; }
        if (p.hover) {
          if (now < p.hoverUntil) { p.vx *= 0.91; p.vy *= 0.91; p.y += Math.sin(now * 0.004) * 0.18; }
          else { p.hover = false; p.wa += (Math.random() - 0.5) * 0.9; p.vx = Math.cos(p.wa) * 0.35 * p.d; p.vy = (0.22 + Math.random() * 0.28) * p.d; }
        } else {
          p.wa += (Math.random() - 0.5) * 0.07; p.vx += Math.cos(p.wa) * p.wr * 0.06; p.vy += Math.sin(p.wa) * p.wr * 0.04 + 0.015 * p.d;
          const sp = Math.hypot(p.vx, p.vy), max = 0.85 * p.d; if (sp > max) { p.vx = (p.vx / sp) * max; p.vy = (p.vy / sp) * max; }
        }
        // Gently repel fireflies within 110px of the cursor.
        const dist = Math.hypot(p.x - this.mx, p.y - this.my);
        if (this.mx > 0 && dist < 110 && dist > 1) { const k = (1 - dist / 110) * 0.22; p.vx += ((p.x - this.mx) / dist) * k; p.vy += ((p.y - this.my) / dist) * k; }
        p.x += p.vx; p.y += p.vy;
        if (Math.hypot(p.vx, p.vy) > 0.08) { p.trail.unshift({ x: p.x, y: p.y }); if (p.trail.length > 6) p.trail.pop(); }
        if (p.a <= 0.01) continue;

        const flash = Math.pow(Math.max(0, Math.sin(now * p.ps + p.pp)), 2.6), lum = p.a * (0.52 + 0.48 * flash);
        if (p.trail.length > 1) { ctx.beginPath(); ctx.moveTo(p.trail[0].x, p.trail[0].y); for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i].x, p.trail[i].y); ctx.strokeStyle = `rgba(202,158,88,${lum * 0.22})`; ctx.lineWidth = 1.2; ctx.stroke(); }
        const hr = p.r * (4.8 + flash * 2.2), hg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, hr);
        hg.addColorStop(0, `rgba(255,245,215,${lum * 0.65})`); hg.addColorStop(0.35, `rgba(235,195,118,${lum * 0.42})`); hg.addColorStop(0.75, `rgba(182,138,64,${lum * 0.18})`); hg.addColorStop(1, 'rgba(164,122,54,0)');
        ctx.beginPath(); ctx.arc(p.x, p.y, hr, 0, Math.PI * 2); ctx.fillStyle = hg; ctx.fill();
        const cr = p.r * (0.9 + flash * 0.4), cg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, cr);
        cg.addColorStop(0, `rgba(255,255,255,${lum})`); cg.addColorStop(0.55, `rgba(255,246,212,${lum * 0.95})`); cg.addColorStop(0.85, `rgba(228,186,102,${lum * 0.8})`); cg.addColorStop(1, `rgba(178,134,58,${lum * 0.45})`);
        ctx.beginPath(); ctx.arc(p.x, p.y, cr, 0, Math.PI * 2); ctx.fillStyle = cg; ctx.shadowColor = `rgba(214,168,82,${lum * 0.85})`; ctx.shadowBlur = 8; ctx.fill();
      }
      ctx.restore();
    }
  }

  // 4. Interactive Sound Jar — floating audio button with volume fade in/out and hide-on-scroll-down.
  class VaultSoundJar {
    constructor() {
      this.playing = false; this.fadeTimer = null; this.lastY = window.scrollY; this.hiddenScroll = false;
      const el = Object.assign(document.createElement('button'), {
        id: 'vaultSoundJar', className: 'vault-sound-jar',
        innerHTML: `<div class="vault-jar-bottle"><div class="vault-jar-cork"></div><div class="vault-jar-neck"></div><div class="vault-jar-glass"><div class="vault-jar-ember vault-jar-ember-1"></div><div class="vault-jar-ember vault-jar-ember-2"></div><div class="vault-jar-ember vault-jar-ember-3"></div><div class="vault-jar-reflection"></div></div></div><div class="vault-sound-info"><div class="vault-sound-bars"><span class="vault-sound-bar"></span><span class="vault-sound-bar"></span><span class="vault-sound-bar"></span><span class="vault-sound-bar"></span></div><span class="vault-sound-label">SOUND</span></div>`
      });
      el.setAttribute('role', 'button'); el.setAttribute('aria-label', 'Toggle ambient gallery sound'); el.setAttribute('aria-pressed', 'false');
      onBody(() => { if (!document.getElementById('vaultSoundJar')) document.body.appendChild(el); });
      this.el = el; this.audio = Object.assign(new Audio('assets/the-vault-ambient.mp3'), { loop: true, volume: 0, preload: 'auto' });
      try { if (sessionStorage.getItem('vault_sound_playing') === 'true') this.audio.play()?.then(() => { this.setState(true); this.fade(0.55, 600); }).catch(() => {}); } catch {}
      el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); this.playing ? this.pause() : this.play(); });
      let tick = false;
      window.addEventListener('scroll', () => {
        if (tick) return; tick = true;
        requestAnimationFrame(() => {
          const y = window.scrollY, d = y - this.lastY;
          if (y > 50 && d > 3 && !this.hiddenScroll) { this.hiddenScroll = true; el.classList.add('is-scrolled-hidden'); }
          else if ((d < -2 || y <= 30) && this.hiddenScroll) { this.hiddenScroll = false; el.classList.remove('is-scrolled-hidden'); }
          this.lastY = y; tick = false;
        });
      }, { passive: true });
    }
    play() { this.setState(true); this.audio.play()?.then(() => { this.fade(0.55, 600); try { sessionStorage.setItem('vault_sound_playing', 'true'); } catch {} window.__vaultFireflySystem?.emitBurst(3); }).catch(() => this.setState(false)); }
    pause() { this.setState(false); this.fade(0, 450, () => this.audio.pause()); try { sessionStorage.setItem('vault_sound_playing', 'false'); } catch {} }
    setState(on) { this.playing = on; this.el.classList.toggle('is-playing', on); this.el.setAttribute('aria-pressed', String(on)); const l = this.el.querySelector('.vault-sound-label'); if (l) l.textContent = on ? 'MUTE' : 'SOUND'; }
    fade(target, ms, done) {
      clearInterval(this.fadeTimer); const v0 = this.audio.volume, t0 = performance.now();
      this.fadeTimer = setInterval(() => {
        const p = Math.min(1, (performance.now() - t0) / ms); this.audio.volume = Math.max(0, Math.min(1, v0 + (target - v0) * p));
        if (p >= 1) { clearInterval(this.fadeTimer); this.fadeTimer = null; done?.(); }
      }, 25);
    }
  }

  // 5. Three.js 3D Artifact Showcase — renders GLB model in WebGL with OrbitControls & SPA remount support.
  class Vault3DShowcase {
    constructor() {
      this.rafId = null; this.canvas = null; this.wrap = null; this.resizeObs = null;
      this.initPos = { x: 0, y: 0.15, z: 2.1 }; this.initTgt = { x: 0, y: 0.02, z: 0 };
      onBody(() => this.remount());
    }
    // Called on boot AND whenever SPA navigates back to Home so a fresh <canvas> gets its WebGL stage.
    remount() {
      const canvas = document.getElementById('vault3dCanvas'), wrap = document.getElementById('closing3dWrap');
      if (!canvas || !wrap) { if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; } return; }
      if (this.canvas === canvas && canvas.isConnected) return;
      if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
      this.controls?.dispose?.(); this.resizeObs?.disconnect?.();
      this.auto = true; this.interacting = false; this.tiltX = this.curTiltX = 0; this.revealed = this.dismissed = false;
      let tries = 0;
      const tryMount = () => {
        const c = document.getElementById('vault3dCanvas'), w = document.getElementById('closing3dWrap');
        if (!c || !w) return;
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader) { if (tries++ < 40) setTimeout(tryMount, 60); return; }
        this.canvas = c; this.wrap = w; this.clock = new THREE.Clock();
        this.setup(); this.load(); this.bind(); this.animate();
        if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
      };
      tryMount();
    }
    dismiss() { if (!this.dismissed) { this.dismissed = true; const o = document.getElementById('stageLoadingOverlay'); if (o) { o.classList.add('is-loaded'); o.style.display = 'none'; } } }
    setup() {
      // Scene holds all 3D meshes/lights; PerspectiveCamera simulates a 36° human-eye lens.
      const r = this.wrap.getBoundingClientRect(), w = Math.max(r.width, 320), h = Math.max(r.height, 360);
      this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 50);
      this.camera.position.set(this.initPos.x, this.initPos.y, this.initPos.z); this.camera.lookAt(this.initTgt.x, this.initTgt.y, this.initTgt.z);
      try {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'default', failIfMajorPerformanceCaveat: false });
        this.renderer.setSize(w, h, false); this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        if (THREE.ACESFilmicToneMapping) { this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.18; }
        if (THREE.sRGBEncoding) this.renderer.outputEncoding = THREE.sRGBEncoding;
      } catch { this.renderer = null; this.dismiss(); }

      // Temporary procedural camera placeholder shown immediately while the external .glb file downloads.
      this.group = new THREE.Group(); this.scene.add(this.group); const ph = new THREE.Group();
      const mBody = new THREE.MeshStandardMaterial({ color: 0x242621, roughness: 0.45, metalness: 0.65, emissive: 0x161814 });
      const mBrass = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.28, metalness: 0.85, emissive: 0x3a2c14 });
      const mLens = new THREE.MeshStandardMaterial({ color: 0x1a1c18, roughness: 0.32, metalness: 0.75, emissive: 0x121410 });
      const part = (g, mat, p = [0, 0, 0], rot = [0, 0, 0]) => { const m = new THREE.Mesh(g, mat); m.position.set(...p); m.rotation.set(...rot); m.castShadow = m.receiveShadow = true; ph.add(m); };
      part(new THREE.BoxGeometry(0.92, 0.56, 0.44), mBody); part(new THREE.BoxGeometry(0.93, 0.12, 0.45), mBrass, [0, 0.32, 0]);
      part(new THREE.CylinderGeometry(0.25, 0.27, 0.32, 32), mLens, [0, 0.02, 0.28], [Math.PI / 2, 0, 0]); part(new THREE.TorusGeometry(0.26, 0.016, 16, 32), mBrass, [0, 0.02, 0.44]);
      part(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16), mBrass, [-0.3, 0.41, 0]); part(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16), mBrass, [0.32, 0.4, 0]);
      part(new THREE.TorusGeometry(0.88, 0.005, 16, 64), new THREE.MeshBasicMaterial({ color: 0xd4bc91, transparent: true, opacity: 0.55 }), [0, 0, 0], [Math.PI / 3, 0, 0]);
      this.placeholder = ph; this.group.add(ph);

      // Studio lighting setup (Ambient fill + warm key/rim/back DirectionalLights) + soft floor contact shadow.
      this.scene.add(new THREE.AmbientLight(0xfff6ec, 1.15));
      [[0xffeed2, 1.85, [2.8, 3.8, 2.5]], [0xe5eaf0, 0.85, [-2.8, 1.6, -1.8]], [0xd4bc91, 1.4, [0.2, 4.2, -2.6]], [0xc2a77a, 0.45, [0, -3, 1.5]]]
        .forEach(([c, i, pos]) => { const l = new THREE.DirectionalLight(c, i); l.position.set(...pos); this.scene.add(l); });

      const sc = Object.assign(document.createElement('canvas'), { width: 256, height: 256 }), sx = sc.getContext('2d'), sg = sx.createRadialGradient(128, 128, 8, 128, 128, 118);
      sg.addColorStop(0, 'rgba(28,26,22,0.45)'); sg.addColorStop(0.32, 'rgba(42,38,30,0.22)'); sg.addColorStop(0.65, 'rgba(75,68,55,0.08)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      sx.fillStyle = sg; sx.fillRect(0, 0, 256, 256);
      this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, opacity: 0.82, depthWrite: false }));
      this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = -0.58; this.scene.add(this.shadow);

      if (THREE.OrbitControls) {
        const c = new THREE.OrbitControls(this.camera, this.canvas);
        Object.assign(c, { enableDamping: true, dampingFactor: 0.055, enablePan: false, minDistance: 1.35, maxDistance: 3.6, minPolarAngle: 0.2, maxPolarAngle: Math.PI / 2 + 0.12 });
        c.target.set(this.initTgt.x, this.initTgt.y, this.initTgt.z);
        c.addEventListener('start', () => { this.interacting = true; });
        c.addEventListener('end', () => { this.lastInt = performance.now(); setTimeout(() => { if (performance.now() - this.lastInt >= 2300) this.interacting = false; }, 2400); });
        this.controls = c;
      }
    }
    load() {
      const bar = document.getElementById('stageLoadingProgress'); let sim = 16; if (bar) bar.textContent = '16%';
      const pt = setInterval(() => { sim = Math.min(96, sim + Math.floor(Math.random() * 22) + 14); if (bar) bar.textContent = `${sim}%`; }, 160);
      const st = setTimeout(() => { clearInterval(pt); this.dismiss(); }, 800);
      new THREE.GLTFLoader().load('assets/3d_model_the_vault.glb', gltf => {
        clearInterval(pt); clearTimeout(st); if (bar) bar.textContent = '100%';
        // Normalize loaded model size & center it at origin (0,0,0) using Box3 bounding box math.
        const m = gltf.scene, box = new THREE.Box3().setFromObject(m), ctr = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()), s = 1.55 / (Math.max(sz.x, sz.y, sz.z) || 1);
        m.scale.setScalar(s); m.position.set(-ctr.x * s, -ctr.y * s, -ctr.z * s);
        m.traverse(ch => { if (ch.isMesh && ch.material) { ch.castShadow = ch.receiveShadow = true; if (ch.material.isMeshStandardMaterial) { ch.material.roughness = Math.min(ch.material.roughness || 0.6, 0.72); ch.material.metalness = Math.max(ch.material.metalness || 0.2, 0.32); } } });
        if (this.placeholder) { this.group.remove(this.placeholder); this.placeholder = null; }
        this.group.add(m); this.group.rotation.y = -0.55; this.dismiss();
      }, xhr => { if (xhr.lengthComputable && bar) { const p = Math.round((xhr.loaded / xhr.total) * 100); if (p > sim) { sim = p; bar.textContent = `${p}%`; } } },
      () => { clearInterval(pt); clearTimeout(st); this.dismiss(); });
    }
    bind() {
      const resize = () => {
        if (!this.wrap || !this.renderer || !this.camera) return;
        const r = this.wrap.getBoundingClientRect(), w = Math.max(r.width, 300), h = Math.max(r.height, 340);
        this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h, false);
      };
      if (window.ResizeObserver) { this.resizeObs = new ResizeObserver(resize); this.resizeObs.observe(this.wrap); }
      else window.addEventListener('resize', resize, { passive: true });
      resize(); setTimeout(resize, 100); setTimeout(resize, 500);
      const cta = document.getElementById('closing-cta');
      cta?.addEventListener('pointermove', e => { const r = cta.getBoundingClientRect(); if (r.width && r.height) this.tiltX = ((e.clientY - r.top) / r.height - 0.5) * 0.35; }, { passive: true });
      cta?.addEventListener('pointerleave', () => { this.tiltX = 0; }, { passive: true });
      if ('IntersectionObserver' in window && cta) new IntersectionObserver(es => {
        if (es.some(e => e.isIntersecting) && !this.revealed) {
          this.revealed = true; const t0 = performance.now();
          const sw = now => { const p = Math.min(1, (now - t0) / 1200); this.group.rotation.y = -0.95 + (1 - Math.pow(1 - p, 3)); if (p < 1) requestAnimationFrame(sw); };
          requestAnimationFrame(sw);
        }
      }, { threshold: 0.15 }).observe(cta);
      const btnT = document.getElementById('btnToggleRotate'), lbl = document.getElementById('rotationStatusLabel');
      btnT?.addEventListener('click', e => { e.preventDefault(); this.auto = !this.auto; btnT.classList.toggle('is-paused', !this.auto); if (lbl) lbl.textContent = this.auto ? 'ROTATING (SLOW)' : 'PAUSED (MANUAL)'; });
      document.getElementById('btnResetView')?.addEventListener('click', e => {
        e.preventDefault(); if (!this.camera || !this.controls) return;
        const sp = this.camera.position.clone(), st = this.controls.target.clone(), ep = new THREE.Vector3(this.initPos.x, this.initPos.y, this.initPos.z), et = new THREE.Vector3(this.initTgt.x, this.initTgt.y, this.initTgt.z), t0 = performance.now();
        const step = now => { const p = Math.min(1, (now - t0) / 650), ez = 1 - Math.pow(1 - p, 3); this.camera.position.lerpVectors(sp, ep, ez); this.controls.target.lerpVectors(st, et, ez); this.controls.update(); if (p < 1) requestAnimationFrame(step); else this.interacting = false; };
        requestAnimationFrame(step);
      });
      const zoom = d => { if (!this.camera || !this.controls) return; const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize(), dist = this.camera.position.distanceTo(this.controls.target); this.camera.position.copy(this.controls.target).addScaledVector(dir, Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, dist + d))); this.controls.update(); };
      document.getElementById('btnZoomIn')?.addEventListener('click', e => { e.preventDefault(); zoom(-0.25); });
      document.getElementById('btnZoomOut')?.addEventListener('click', e => { e.preventDefault(); zoom(0.25); });
    }
    // Per-frame animation loop (~60fps); automatically stops if the canvas leaves the DOM during SPA routing.
    animate() {
      if (!this.canvas?.isConnected) { this.rafId = null; return; }
      this.rafId = requestAnimationFrame(() => this.animate());
      const t = this.clock ? this.clock.getElapsedTime() : performance.now() * 0.001;
      this.curTiltX += (this.tiltX - this.curTiltX) * 0.08;
      if (this.group) {
        const fy = Math.sin(t * 1.35) * 0.038; this.group.position.y = fy;
        this.group.rotation.z = Math.sin(t * 0.85) * 0.012 + this.curTiltX * 0.3; this.group.rotation.x = this.curTiltX;
        if (this.auto && !this.interacting) this.group.rotation.y += 0.0035;
        if (this.shadow) { const s = 1 + fy * 1.8; this.shadow.scale.set(s, s, 1); this.shadow.material.opacity = 0.82 - fy * 2.2; }
      }
      this.controls?.update(); if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
    }
  }

  // Initialize all five sensory systems once the DOM is ready.
  const boot = () => {
    window.__vaultLoader ||= new VaultLoader(); window.__vaultCursor ||= new VaultCursor();
    window.__vaultFireflySystem ||= new VaultFireflies(); window.__vaultSoundJar ||= new VaultSoundJar();
    window.__vault3DShowcase ||= new Vault3DShowcase();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
