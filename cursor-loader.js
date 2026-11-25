// THE VAULT — Active Theory Loader, Dual Liquid Cursor, Firefly Colony & Sound Jar
(function () {
  'use strict';

  const onBodyReady = (fn) => {
    if (document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn);
  };

  // Shared HiDPI full-viewport Canvas 2D helper
  function createCanvasLayer(id, className) {
    let canvas = document.getElementById(id);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = id;
      canvas.className = className;
      canvas.setAttribute('aria-hidden', 'true');
    }
    const ctx = canvas.getContext('2d', { alpha: true });

    const resize = () => {
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth, h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    onBodyReady(() => {
      if (!canvas.parentNode) document.body.appendChild(canvas);
      resize();
    });
    return { canvas, ctx, resize };
  }

  // 1. Editorial Loading Screen
  class VaultLoader {
    constructor() {
      this.startTime = performance.now();
      let visited = false;
      try { visited = sessionStorage.getItem('vault_visited') === 'true'; } catch (e) {}
      this.targetDuration = visited ? 160 : 800;

      let el = document.getElementById('vaultLoader');
      if (!el) {
        el = document.createElement('div');
        el.id = 'vaultLoader';
        el.className = 'vault-loader';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-label', 'Loading The Vault');
        el.innerHTML = `
          <div class="vault-loader-frame">
            <div class="vault-loader-frame-row"><span>THE VAULT / DIGITAL HOUSE</span><span>EST. 2026</span></div>
            <div class="vault-loader-frame-row"><span>CURATED AUCTIONS</span><span>EDITION NO. 01</span></div>
          </div>
          <div class="vault-loader-center">
            <h1 class="vault-loader-brand">THE VAULT<span>.</span></h1>
            <div class="vault-loader-divider"></div>
            <div class="vault-loader-status"><span>PREPARING THE COLLECTION</span><span class="vault-loader-caret"></span></div>
            <div class="vault-loader-dots"><div class="vault-loader-dot"></div><div class="vault-loader-dot"></div><div class="vault-loader-dot"></div></div>
          </div>`;
        onBodyReady(() => document.body.prepend(el));
      }
      this.el = el;

      const trigger = () => setTimeout(() => this.dismiss(), Math.max(0, this.targetDuration - (performance.now() - this.startTime)));
      if (document.readyState === 'complete') trigger();
      else window.addEventListener('load', trigger, { once: true });
      setTimeout(() => this.dismiss(), 2000);
    }

    dismiss() {
      if (!this.el || this.el.classList.contains('is-hidden')) return;
      this.el.classList.add('is-hidden');
      try { sessionStorage.setItem('vault_visited', 'true'); } catch (e) {}
      setTimeout(() => { if (this.el) this.el.style.display = 'none'; }, 750);
    }
  }

  // 2. Custom Dual Cursor & Tapered Champagne Liquid Trail
  class VaultCursorAndTrail {
    constructor() {
      this.mouse = { x: -100, y: -100 };
      this.dot = { x: -100, y: -100 };
      this.ring = { x: -100, y: -100 };
      this.points = [];
      this.hasMoved = false;
      this.isInside = false;
      this.lastMoveTime = 0;
      this.rafId = null;

      this.createDOM();
      const layer = createCanvasLayer('vaultTrailCanvas', 'vault-trail-canvas');
      this.canvas = layer.canvas;
      this.ctx = layer.ctx;
      this.resizeCanvas = layer.resize;
      this.bindEvents();
    }

    createDOM() {
      this.dotEl = document.getElementById('vaultCursorDot');
      this.ringEl = document.getElementById('vaultCursorRing');
      if (this.dotEl && this.ringEl) return;

      this.dotEl = document.createElement('div');
      this.dotEl.id = 'vaultCursorDot';
      this.dotEl.className = 'vault-cursor-dot is-hidden';
      this.dotEl.setAttribute('aria-hidden', 'true');

      this.ringEl = document.createElement('div');
      this.ringEl.id = 'vaultCursorRing';
      this.ringEl.className = 'vault-cursor-ring is-hidden';
      this.ringEl.setAttribute('aria-hidden', 'true');
      this.ringEl.innerHTML = '<span class="vault-cursor-label">VIEW</span>';

      onBodyReady(() => { document.body.append(this.dotEl, this.ringEl); });
    }

    bindEvents() {
      const onMove = e => this.onPointerMove(e);
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('resize', () => this.resizeCanvas(), { passive: true });
      document.addEventListener('mouseleave', () => { this.isInside = false; this.setHidden(true); }, { passive: true });
      document.addEventListener('mouseenter', e => {
        this.isInside = true;
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.setHidden(false);
        this.startLoop();
      }, { passive: true });

      // Contextual hover state delegation
      document.addEventListener('pointerover', e => {
        const t = e.target;
        if (!t?.closest || !this.ringEl || !this.dotEl) return;

        if (t.closest('input, textarea, select, [contenteditable="true"]')) return this.setHidden(true);
        if (this.isInside) this.setHidden(false);

        const isCard = Boolean(t.closest('.lot-card, .editorial-lot, .home-live-card, [data-lot-card]'));
        const isBtn = !isCard && Boolean(t.closest('button, [role="button"], .admin-action-btn, .filter-chip, .thumb'));
        const isLink = !isCard && !isBtn && Boolean(t.closest('a'));

        this.ringEl.classList.toggle('is-card', isCard);
        this.dotEl.classList.toggle('is-card', isCard);
        this.ringEl.classList.toggle('is-button', isBtn);
        this.ringEl.classList.toggle('is-hovering', isLink);
      }, { passive: true });
    }

    setHidden(hide) {
      if (!this.dotEl || !this.ringEl) return;
      const shouldHide = hide || !this.isInside;
      this.dotEl.classList.toggle('is-hidden', shouldHide);
      this.ringEl.classList.toggle('is-hidden', shouldHide);
    }

    onPointerMove(e) {
      if (e.pointerType === 'touch' && window.innerWidth < 680) return;
      const now = performance.now();
      document.body.classList.add('vault-cursor-active');

      if (!this.hasMoved) {
        this.hasMoved = this.isInside = true;
        this.dot.x = this.ring.x = this.mouse.x = e.clientX;
        this.dot.y = this.ring.y = this.mouse.y = e.clientY;
        this.setHidden(false);
      }

      const dx = e.clientX - this.mouse.x, dy = e.clientY - this.mouse.y;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.lastMoveTime = now;

      if (Math.hypot(dx, dy) > 2.0) {
        this.points.unshift({ x: e.clientX, y: e.clientY, vx: dx * 0.16, vy: dy * 0.16, birth: now, lifespan: 320 });
        if (this.points.length > 20) this.points.length = 20;
      }
      this.startLoop();
    }

    startLoop() {
      if (this.rafId) return;
      const loop = now => {
        // LERP physics for dot (snappy) and ring (weighted inertia)
        this.dot.x += (this.mouse.x - this.dot.x) * 0.65;
        this.dot.y += (this.mouse.y - this.dot.y) * 0.65;
        this.ring.x += (this.mouse.x - this.ring.x) * 0.18;
        this.ring.y += (this.mouse.y - this.ring.y) * 0.18;

        for (let i = this.points.length - 1; i >= 0; i--) {
          const p = this.points[i];
          if (now - p.birth >= p.lifespan) { this.points.splice(i, 1); continue; }
          p.vx *= 0.84; p.vy *= 0.84;
          p.x += p.vx; p.y += p.vy;
          if (i > 0) {
            p.x += (this.points[i - 1].x - p.x) * 0.16;
            p.y += (this.points[i - 1].y - p.y) * 0.16;
          }
        }

        if (this.hasMoved && this.isInside) {
          this.dotEl.style.transform = `translate3d(${this.dot.x}px, ${this.dot.y}px, 0) translate(-50%, -50%)`;
          this.ringEl.style.transform = `translate3d(${this.ring.x}px, ${this.ring.y}px, 0) translate(-50%, -50%)`;
        }
        this.renderTrail(now);

        if (now - this.lastMoveTime > 220 && this.points.length === 0) { this.rafId = null; return; }
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }

    // Draw smooth tapered filament using quadratic Bézier midpoint interpolation
    renderTrail(now) {
      if (!this.ctx) return;
      const ctx = this.ctx, pts = this.points;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (pts.length < 2) return;

      ctx.save();
      ctx.lineCap = ctx.lineJoin = 'round';
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i], p2 = pts[i + 1];
        const progress = Math.min(1, Math.max(0, (now - p1.birth) / p1.lifespan));
        const alpha = Math.pow(1 - progress, 1.35);
        if (alpha <= 0.01) continue;

        const width = Math.max(0.4, 0.4 + (1 - progress) * 2.2);
        ctx.beginPath();
        if (i === 0) {
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        } else {
          ctx.moveTo((pts[i - 1].x + p1.x) / 2, (pts[i - 1].y + p1.y) / 2);
          ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        }
        ctx.strokeStyle = `rgba(202, 162, 94, ${alpha * 0.75})`;
        ctx.lineWidth = width;
        ctx.shadowColor = `rgba(186, 142, 66, ${alpha * 0.45})`;
        ctx.shadowBlur = 4;
        ctx.stroke();

        if (i < 4) {
          ctx.strokeStyle = `rgba(255, 252, 245, ${alpha * 0.88})`;
          ctx.lineWidth = Math.max(0.4, width * 0.45);
          ctx.shadowBlur = 0;
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  // 3. Ambient Firefly Colony
  class VaultFireflyParticle {
    constructor(emitter, w, h) {
      this.trail = [];
      this.reset(emitter, w, h, true);
    }

    reset(emitter, w, h, isInitial = false) {
      this.w = w; this.h = h; this.trail = [];
      this.depth = 0.5 + Math.random() * 0.5;
      this.baseRadius = 2.0 + this.depth * 1.6;
      this.targetAlpha = 0.65 + this.depth * 0.35;
      this.alpha = 0;

      if (isInitial) {
        this.x = emitter.x + (Math.random() - 0.5) * (w * 0.75);
        this.y = 35 + Math.random() * (h * 0.65);
        this.born = performance.now() - Math.random() * 9000;
      } else {
        this.x = emitter.x + (Math.random() - 0.5) * 8;
        this.y = emitter.y + Math.random() * 4;
        this.born = performance.now();
      }

      const angle = (0.55 + Math.random() * 0.38) * Math.PI;
      const speed = (0.28 + Math.random() * 0.36) * this.depth;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.abs(Math.sin(angle) * speed);
      this.wanderAngle = Math.random() * Math.PI * 2;
      this.wanderRadius = 0.07 + Math.random() * 0.12;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.0018 + Math.random() * 0.0028;
      this.isHovering = this.isDying = false;
      this.hoverUntil = 0;
      this.nextHover = performance.now() + 4500 + Math.random() * 8000;
      this.lifespan = 22000 + Math.random() * 16000;
    }

    update(now, mouseX, mouseY, emitter) {
      const age = now - this.born;
      if (age < 2200) this.alpha = (age / 2200) * this.targetAlpha;
      else if (!this.isDying) this.alpha = this.targetAlpha;

      if (age >= this.lifespan || this.y > this.h + 30 || this.x < -50 || this.x > this.w + 50) this.isDying = true;
      if (this.isDying) {
        this.alpha -= 0.014;
        if (this.alpha <= 0) return this.reset(emitter, this.w, this.h, false);
      }

      if (now > this.nextHover && !this.isHovering && !this.isDying) {
        this.isHovering = true;
        this.hoverUntil = now + 1200 + Math.random() * 1800;
        this.nextHover = now + 8000 + Math.random() * 12000;
      }

      if (this.isHovering) {
        if (now < this.hoverUntil) {
          this.vx *= 0.91; this.vy *= 0.91;
          this.y += Math.sin(now * 0.004) * 0.18;
        } else {
          this.isHovering = false;
          this.wanderAngle += (Math.random() - 0.5) * 0.9;
          this.vx = Math.cos(this.wanderAngle) * 0.35 * this.depth;
          this.vy = (0.22 + Math.random() * 0.28) * this.depth;
        }
      } else {
        this.wanderAngle += (Math.random() - 0.5) * 0.07;
        this.vx += Math.cos(this.wanderAngle) * this.wanderRadius * 0.06;
        this.vy += Math.sin(this.wanderAngle) * this.wanderRadius * 0.04 + 0.015 * this.depth;

        const speed = Math.hypot(this.vx, this.vy), max = 0.85 * this.depth;
        if (speed > max) { this.vx = (this.vx / speed) * max; this.vy = (this.vy / speed) * max; }
      }

      // Gentle cursor air-displacement
      const dist = Math.hypot(this.x - mouseX, this.y - mouseY);
      if (mouseX > 0 && dist < 110 && dist > 1) {
        const push = (1 - dist / 110) * 0.22;
        this.vx += ((this.x - mouseX) / dist) * push;
        this.vy += ((this.y - mouseY) / dist) * push;
      }

      this.x += this.vx;
      this.y += this.vy;
      if (Math.hypot(this.vx, this.vy) > 0.08) {
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > 6) this.trail.pop();
      }
    }

    draw(ctx, now) {
      if (this.alpha <= 0.01) return;
      const flash = Math.pow(Math.max(0, Math.sin(now * this.pulseSpeed + this.pulsePhase)), 2.6);
      const lum = this.alpha * (0.52 + 0.48 * flash);

      if (this.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y);
        ctx.strokeStyle = `rgba(202, 158, 88, ${lum * 0.22})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      const haloR = this.baseRadius * (4.8 + flash * 2.2);
      const halo = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, haloR);
      halo.addColorStop(0, `rgba(255, 245, 215, ${lum * 0.65})`);
      halo.addColorStop(0.35, `rgba(235, 195, 118, ${lum * 0.42})`);
      halo.addColorStop(0.75, `rgba(182, 138, 64, ${lum * 0.18})`);
      halo.addColorStop(1, 'rgba(164, 122, 54, 0)');
      ctx.beginPath(); ctx.arc(this.x, this.y, haloR, 0, Math.PI * 2);
      ctx.fillStyle = halo; ctx.fill();

      const coreR = this.baseRadius * (0.9 + flash * 0.4);
      const core = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, coreR);
      core.addColorStop(0, `rgba(255, 255, 255, ${lum})`);
      core.addColorStop(0.55, `rgba(255, 246, 212, ${lum * 0.95})`);
      core.addColorStop(0.85, `rgba(228, 186, 102, ${lum * 0.8})`);
      core.addColorStop(1, `rgba(178, 134, 58, ${lum * 0.45})`);
      ctx.beginPath(); ctx.arc(this.x, this.y, coreR, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.shadowColor = `rgba(214, 168, 82, ${lum * 0.85})`;
      ctx.shadowBlur = 8;
      ctx.fill();
    }
  }

  class VaultFireflySystem {
    constructor() {
      const layer = createCanvasLayer('vaultFireflyCanvas', 'vault-firefly-canvas');
      this.canvas = layer.canvas;
      this.ctx = layer.ctx;
      this.mouseX = -100; this.mouseY = -100;
      this.rafId = null; this.isPaused = false;

      const emitter = this.getEmitterCoords();
      const count = window.innerWidth < 680 ? 7 : 12;
      this.particles = Array.from({ length: count }, () => new VaultFireflyParticle(emitter, window.innerWidth, window.innerHeight));

      const onMove = e => { this.mouseX = e.clientX; this.mouseY = e.clientY; };
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('resize', () => {
        layer.resize();
        this.particles.forEach(p => { p.w = window.innerWidth; p.h = window.innerHeight; });
      }, { passive: true });

      document.addEventListener('visibilitychange', () => {
        this.isPaused = document.hidden;
        if (this.isPaused && this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        else if (!this.isPaused) this.startLoop();
      });
      this.startLoop();
    }

    getEmitterCoords() {
      const jar = document.getElementById('vaultSoundJar');
      if (!jar) return { x: window.innerWidth - 65, y: 130 };
      const r = jar.getBoundingClientRect();
      return { x: r.left + 15, y: Math.max(12, r.top + 8) };
    }

    emitBurst(count = 3) {
      const emitter = this.getEmitterCoords();
      for (let i = 0; i < Math.min(count, this.particles.length); i++) {
        const p = this.particles[i];
        p.reset(emitter, window.innerWidth, window.innerHeight, false);
        p.vx = -(0.45 + Math.random() * 0.45) * p.depth;
        p.vy = (0.25 + Math.random() * 0.35) * p.depth;
      }
    }

    startLoop() {
      if (this.rafId || this.isPaused) return;
      const loop = now => {
        this.render(now);
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }

    render(now) {
      if (!this.ctx) return;
      const ctx = this.ctx, emitter = this.getEmitterCoords();
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const jarEl = document.getElementById('vaultSoundJar');
      if (!jarEl?.classList.contains('is-scrolled-hidden')) {
        ctx.save();
        const pulse = (Math.sin(now * 0.0016) + 1) / 2;
        const r = 38 + pulse * 16, a = 0.16 + pulse * 0.09;
        const grad = ctx.createRadialGradient(emitter.x, emitter.y, 0, emitter.x, emitter.y, r);
        grad.addColorStop(0, `rgba(245, 218, 156, ${a * 1.5})`);
        grad.addColorStop(0.4, `rgba(224, 188, 120, ${a})`);
        grad.addColorStop(0.78, `rgba(182, 138, 64, ${a * 0.25})`);
        grad.addColorStop(1, 'rgba(164, 122, 54, 0)');
        ctx.beginPath(); ctx.arc(emitter.x, emitter.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
        ctx.restore();
      }

      ctx.save();
      this.particles.forEach(p => { p.update(now, this.mouseX, this.mouseY, emitter); p.draw(ctx, now); });
      ctx.restore();
    }
  }

  // 4. Interactive Scroll-Reactive Firefly Sound Jar
  class VaultSoundJar {
    constructor() {
      this.isPlaying = false;
      this.fadeInterval = null;
      this.lastScrollY = window.scrollY;
      this.isHiddenByScroll = false;

      let el = document.getElementById('vaultSoundJar');
      if (!el) {
        el = document.createElement('button');
        el.id = 'vaultSoundJar';
        el.className = 'vault-sound-jar';
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', 'Toggle ambient gallery sound');
        el.setAttribute('aria-pressed', 'false');
        el.innerHTML = `
          <div class="vault-jar-bottle"><div class="vault-jar-cork"></div><div class="vault-jar-neck"></div>
            <div class="vault-jar-glass"><div class="vault-jar-ember vault-jar-ember-1"></div><div class="vault-jar-ember vault-jar-ember-2"></div><div class="vault-jar-ember vault-jar-ember-3"></div><div class="vault-jar-reflection"></div></div>
          </div>
          <div class="vault-sound-info">
            <div class="vault-sound-bars"><span class="vault-sound-bar"></span><span class="vault-sound-bar"></span><span class="vault-sound-bar"></span><span class="vault-sound-bar"></span></div>
            <span class="vault-sound-label">SOUND</span>
          </div>`;
        onBodyReady(() => document.body.appendChild(el));
      }
      this.jarEl = el;

      this.audio = new Audio('the-vault-ambient.mp3');
      this.audio.loop = true;
      this.audio.volume = 0;
      this.audio.preload = 'auto';

      try {
        if (sessionStorage.getItem('vault_sound_playing') === 'true') {
          this.audio.play()?.then(() => {
            this.setPlayingState(true);
            this.fadeAudio(0.55, 600);
          }).catch(() => this.setPlayingState(false));
        }
      } catch (e) {}

      this.bindEvents();
    }

    bindEvents() {
      this.jarEl.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        this.isPlaying ? this.pause() : this.play();
      });

      let ticking = false;
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY, delta = y - this.lastScrollY;
          if (y > 50 && delta > 3 && !this.isHiddenByScroll) {
            this.isHiddenByScroll = true;
            this.jarEl.classList.add('is-scrolled-hidden');
          } else if ((delta < -2 || y <= 30) && this.isHiddenByScroll) {
            this.isHiddenByScroll = false;
            this.jarEl.classList.remove('is-scrolled-hidden');
          }
          this.lastScrollY = y;
          ticking = false;
        });
      }, { passive: true });
    }

    play() {
      this.setPlayingState(true);
      this.audio.play()?.then(() => {
        this.fadeAudio(0.55, 600);
        try { sessionStorage.setItem('vault_sound_playing', 'true'); } catch (e) {}
        window.__vaultFireflySystem?.emitBurst(3);
      }).catch(() => this.setPlayingState(false));
    }

    pause() {
      this.setPlayingState(false);
      this.fadeAudio(0, 450, () => this.audio.pause());
      try { sessionStorage.setItem('vault_sound_playing', 'false'); } catch (e) {}
    }

    setPlayingState(playing) {
      this.isPlaying = playing;
      this.jarEl.classList.toggle('is-playing', playing);
      this.jarEl.setAttribute('aria-pressed', String(playing));
      const label = this.jarEl.querySelector('.vault-sound-label');
      if (label) label.textContent = playing ? 'MUTE' : 'SOUND';
    }

    fadeAudio(targetVol, duration, onComplete) {
      clearInterval(this.fadeInterval);
      const startVol = this.audio.volume, startTime = performance.now();
      this.fadeInterval = setInterval(() => {
        const p = Math.min(1, (performance.now() - startTime) / duration);
        this.audio.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * p));
        if (p >= 1) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          onComplete?.();
        }
      }, 25);
    }
  }

  function boot() {
    if (!window.__vaultLoader) window.__vaultLoader = new VaultLoader();
    if (!window.__vaultCursor) window.__vaultCursor = new VaultCursorAndTrail();
    if (!window.__vaultFireflySystem) window.__vaultFireflySystem = new VaultFireflySystem();
    if (!window.__vaultSoundJar) window.__vaultSoundJar = new VaultSoundJar();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
