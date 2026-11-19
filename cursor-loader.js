/**
 * THE VAULT — Signature Liquid Cursor, Ambient Firefly Colony & Cinematic Loading Experience
 *
 * Implements:
 *  1. Active Theory inspired minimalist loading overlay with sequential dot pulse
 *  2. Dual-element champagne-brass custom cursor with physical inertia & contextual hover states
 *  3. Sleek, professional champagne silk filament trail on Canvas 2D
 *  4. Ambient glowing firefly colony emerging from the Firefly Sound Jar
 *  5. Interactive Firefly Sound Jar (Active Theory scroll reaction & cinematic ambient audio)
 *
 * Strict constraint: Pure vanilla JavaScript, CSS3, Canvas 2D. Zero external libraries.
 */

(function () {
  'use strict';

  // ===========================================================================
  // 1. ACTIVE THEORY INSPIRED CINEMATIC LOADING SCREEN
  // ===========================================================================
  class VaultLoader {
    constructor() {
      this.loaderEl = null;
      this.startTime = performance.now();
      this.isSubsequentVisit = false;
      this.minDisplayDuration = 800; // ms for initial luxury editorial sequence
      this.subsequentDuration = 160; // ms for snappy internal navigation
      this.init();
    }

    init() {
      try {
        if (sessionStorage.getItem('vault_visited') === 'true') {
          this.isSubsequentVisit = true;
        }
      } catch (e) {
        this.isSubsequentVisit = false;
      }

      this.createLoaderDOM();
      this.setupDismissal();
    }

    createLoaderDOM() {
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
            <div class="vault-loader-frame-row">
              <span>THE VAULT / DIGITAL HOUSE</span>
              <span>EST. 2026</span>
            </div>
            <div class="vault-loader-frame-row">
              <span>CURATED AUCTIONS</span>
              <span>EDITION NO. 01</span>
            </div>
          </div>
          <div class="vault-loader-center">
            <h1 class="vault-loader-brand">THE VAULT<span>.</span></h1>
            <div class="vault-loader-divider"></div>
            <div class="vault-loader-status">
              <span>PREPARING THE COLLECTION</span>
              <span class="vault-loader-caret"></span>
            </div>
            <div class="vault-loader-dots">
              <div class="vault-loader-dot"></div>
              <div class="vault-loader-dot"></div>
              <div class="vault-loader-dot"></div>
            </div>
          </div>
        `;

        if (document.body) {
          document.body.prepend(el);
        } else {
          document.addEventListener('DOMContentLoaded', () => {
            document.body.prepend(el);
          });
        }
      }
      this.loaderEl = el;
    }

    setupDismissal() {
      const targetDuration = this.isSubsequentVisit
        ? this.subsequentDuration
        : this.minDisplayDuration;

      const triggerDismiss = () => {
        const elapsed = performance.now() - this.startTime;
        const remaining = Math.max(0, targetDuration - elapsed);

        setTimeout(() => {
          this.dismiss();
        }, remaining);
      };

      if (document.readyState === 'complete') {
        triggerDismiss();
      } else {
        window.addEventListener('load', triggerDismiss, { once: true });
      }

      // Hard safety timeout: guarantee loader never locks interaction
      setTimeout(() => {
        this.dismiss();
      }, 2000);
    }

    dismiss() {
      if (!this.loaderEl || this.loaderEl.classList.contains('is-hidden')) return;

      this.loaderEl.classList.add('is-hidden');

      try {
        sessionStorage.setItem('vault_visited', 'true');
      } catch (e) {}

      setTimeout(() => {
        if (this.loaderEl && this.loaderEl.parentNode) {
          this.loaderEl.style.display = 'none';
        }
      }, 750);
    }
  }

  // ===========================================================================
  // 2. SIGNATURE LUXURY CURSOR & SLEEK FILAMENT TRAIL
  // ===========================================================================
  class VaultCursorAndTrail {
    constructor() {
      this.mouse = { x: -100, y: -100, vx: 0, vy: 0, speed: 0 };
      this.dot = { x: -100, y: -100 };
      this.ring = { x: -100, y: -100 };

      this.hasPointerMoved = false;
      this.isPointerInside = false;
      this.lastMoveTime = 0;
      this.rafId = null;

      // Professional Luxury Filament Trail History & Dynamics
      this.points = [];
      this.maxTrailPoints = 20;
      this.trailLifespan = 320; // ms for sleek, silky luxury filament that dissolves crisply

      this.canvas = null;
      this.ctx = null;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.dotEl = null;
      this.ringEl = null;
      this.labelEl = null;

      this.init();
    }

    init() {
      this.createCursorElements();
      this.createCanvas();
      this.bindEvents();
    }

    createCursorElements() {
      if (document.getElementById('vaultCursorDot')) {
        this.dotEl = document.getElementById('vaultCursorDot');
        this.ringEl = document.getElementById('vaultCursorRing');
        return;
      }

      // Precision Center Dot
      this.dotEl = document.createElement('div');
      this.dotEl.id = 'vaultCursorDot';
      this.dotEl.className = 'vault-cursor-dot is-hidden';
      this.dotEl.setAttribute('aria-hidden', 'true');

      // Follower Ring
      this.ringEl = document.createElement('div');
      this.ringEl.id = 'vaultCursorRing';
      this.ringEl.className = 'vault-cursor-ring is-hidden';
      this.ringEl.setAttribute('aria-hidden', 'true');

      // Contextual Label ("VIEW")
      this.labelEl = document.createElement('span');
      this.labelEl.className = 'vault-cursor-label';
      this.labelEl.textContent = 'VIEW';
      this.ringEl.appendChild(this.labelEl);

      const mount = () => {
        document.body.appendChild(this.dotEl);
        document.body.appendChild(this.ringEl);
      };

      if (document.body) {
        mount();
      } else {
        document.addEventListener('DOMContentLoaded', mount);
      }
    }

    createCanvas() {
      if (document.getElementById('vaultTrailCanvas')) {
        this.canvas = document.getElementById('vaultTrailCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.resizeCanvas();
        return;
      }

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'vaultTrailCanvas';
      this.canvas.className = 'vault-trail-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d', { alpha: true });

      const mount = () => {
        document.body.appendChild(this.canvas);
        this.resizeCanvas();
      };

      if (document.body) {
        mount();
      } else {
        document.addEventListener('DOMContentLoaded', mount);
      }
    }

    resizeCanvas() {
      if (!this.canvas || !this.ctx) return;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.canvas.width = Math.floor(width * this.dpr);
      this.canvas.height = Math.floor(height * this.dpr);
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';

      if (this.ctx.resetTransform) {
        this.ctx.resetTransform();
      } else {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      this.ctx.scale(this.dpr, this.dpr);
    }

    bindEvents() {
      const onMove = (e) => this.onPointerMove(e);
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('mousemove', onMove, { passive: true });

      document.addEventListener('mouseleave', () => this.onMouseLeave(), { passive: true });
      document.addEventListener('mouseenter', (e) => this.onMouseEnter(e), { passive: true });

      window.addEventListener('resize', () => this.resizeCanvas(), { passive: true });

      this.setupContextualHover();
    }

    setupContextualHover() {
      document.addEventListener('pointerover', (e) => {
        const target = e.target;
        if (!target || !target.closest || !this.ringEl || !this.dotEl) return;

        // 1. Text Inputs / Textarea / Select -> Restore native cursor
        const isEditable = target.closest('input, textarea, select, [contenteditable="true"]');
        if (isEditable) {
          this.setHidden(true);
          return;
        } else if (this.isPointerInside) {
          this.setHidden(false);
        }

        // 2. Product / Lot Cards -> "VIEW" Pill State
        const isCard = target.closest('.lot-card, .editorial-lot, .home-live-card, [data-lot-card]');
        if (isCard) {
          this.ringEl.classList.add('is-card');
          this.dotEl.classList.add('is-card');
          this.ringEl.classList.remove('is-hovering', 'is-button');
          return;
        } else {
          this.ringEl.classList.remove('is-card');
          this.dotEl.classList.remove('is-card');
        }

        // 3. Action Buttons & Bidding Triggers -> Button State
        const isButton = target.closest('button, [role="button"], .admin-action-btn, .filter-chip, .thumb');
        if (isButton) {
          this.ringEl.classList.add('is-button');
          this.ringEl.classList.remove('is-hovering');
          return;
        } else {
          this.ringEl.classList.remove('is-button');
        }

        // 4. Standard Links
        const isLink = target.closest('a');
        if (isLink) {
          this.ringEl.classList.add('is-hovering');
          return;
        } else {
          this.ringEl.classList.remove('is-hovering');
        }
      }, { passive: true });
    }

    setHidden(hidden) {
      if (!this.dotEl || !this.ringEl) return;
      if (hidden) {
        this.dotEl.classList.add('is-hidden');
        this.ringEl.classList.add('is-hidden');
      } else if (this.isPointerInside) {
        this.dotEl.classList.remove('is-hidden');
        this.ringEl.classList.remove('is-hidden');
      }
    }

    onPointerMove(e) {
      if (e.pointerType === 'touch' && window.innerWidth < 680) {
        return;
      }

      const clientX = e.clientX;
      const clientY = e.clientY;
      const now = performance.now();

      if (!document.body.classList.contains('vault-cursor-active')) {
        document.body.classList.add('vault-cursor-active');
      }

      if (!this.hasPointerMoved) {
        this.hasPointerMoved = true;
        this.isPointerInside = true;
        this.dot.x = clientX;
        this.dot.y = clientY;
        this.ring.x = clientX;
        this.ring.y = clientY;
        this.mouse.x = clientX;
        this.mouse.y = clientY;
        this.setHidden(false);
      }

      const dx = clientX - this.mouse.x;
      const dy = clientY - this.mouse.y;
      const dist = Math.hypot(dx, dy);

      this.mouse.vx = dx;
      this.mouse.vy = dy;
      this.mouse.speed = dist;
      this.mouse.x = clientX;
      this.mouse.y = clientY;
      this.lastMoveTime = now;

      // Add fluid trail point if moved at least 2.0px
      if (dist > 2.0) {
        this.addTrailPoint(clientX, clientY, dx, dy, dist, now);
      }

      if (!this.rafId) {
        this.startLoop();
      }
    }

    addTrailPoint(x, y, vx, vy, speed, now) {
      this.points.unshift({
        x: x,
        y: y,
        vx: vx * 0.16,
        vy: vy * 0.16,
        birth: now,
        lifespan: this.trailLifespan
      });

      if (this.points.length > this.maxTrailPoints) {
        this.points.length = this.maxTrailPoints;
      }
    }

    onMouseLeave() {
      this.isPointerInside = false;
      this.setHidden(true);
    }

    onMouseEnter(e) {
      this.isPointerInside = true;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.setHidden(false);
      if (!this.rafId) {
        this.startLoop();
      }
    }

    startLoop() {
      if (this.rafId) return;

      const loop = (now) => {
        this.updatePhysics(now);
        this.renderCursor();
        this.renderTrail(now);

        const idleDuration = now - this.lastMoveTime;
        if (idleDuration > 220 && this.points.length === 0) {
          this.rafId = null;
          return;
        }

        this.rafId = requestAnimationFrame(loop);
      };

      this.rafId = requestAnimationFrame(loop);
    }

    updatePhysics(now) {
      this.dot.x += (this.mouse.x - this.dot.x) * 0.65;
      this.dot.y += (this.mouse.y - this.dot.y) * 0.65;

      this.ring.x += (this.mouse.x - this.ring.x) * 0.18;
      this.ring.y += (this.mouse.y - this.ring.y) * 0.18;

      const pts = this.points;
      for (let i = pts.length - 1; i >= 0; i--) {
        const pt = pts[i];
        const age = now - pt.birth;

        if (age >= pt.lifespan) {
          pts.splice(i, 1);
          continue;
        }

        pt.vx *= 0.84;
        pt.vy *= 0.84;
        pt.x += pt.vx;
        pt.y += pt.vy;

        if (i > 0) {
          const newer = pts[i - 1];
          pt.x += (newer.x - pt.x) * 0.16;
          pt.y += (newer.y - pt.y) * 0.16;
        }
      }
    }

    renderCursor() {
      if (!this.hasPointerMoved || !this.isPointerInside || !this.dotEl || !this.ringEl) return;

      this.dotEl.style.transform = `translate3d(${this.dot.x}px, ${this.dot.y}px, 0) translate(-50%, -50%)`;
      this.ringEl.style.transform = `translate3d(${this.ring.x}px, ${this.ring.y}px, 0) translate(-50%, -50%)`;
    }

    renderTrail(now) {
      if (!this.ctx || !this.canvas) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const ctx = this.ctx;

      ctx.clearRect(0, 0, width, height);

      const pts = this.points;
      if (pts.length < 2) return;

      ctx.save();

      // Draw silky, continuous champagne filament with graceful tapering
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];

        const age = now - p1.birth;
        const progress = Math.min(1, Math.max(0, age / p1.lifespan));
        const alpha = Math.pow(1 - progress, 1.35);

        if (alpha <= 0.01) continue;

        // Elegant tapered line width: 2.6px at head down to 0.4px at tail
        const strokeWidth = Math.max(0.4, 0.4 + (1 - progress) * 2.2);

        ctx.beginPath();
        if (i === 0) {
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        } else {
          const prevMidX = (pts[i - 1].x + p1.x) / 2;
          const prevMidY = (pts[i - 1].y + p1.y) / 2;
          const nextMidX = (p1.x + p2.x) / 2;
          const nextMidY = (p1.y + p2.y) / 2;
          ctx.moveTo(prevMidX, prevMidY);
          ctx.quadraticCurveTo(p1.x, p1.y, nextMidX, nextMidY);
        }

        ctx.strokeStyle = `rgba(202, 162, 94, ${alpha * 0.75})`;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = `rgba(186, 142, 66, ${alpha * 0.45})`;
        ctx.shadowBlur = 4;
        ctx.stroke();

        // Delicate luminous core on the leading segments
        if (i < 4) {
          ctx.strokeStyle = `rgba(255, 252, 245, ${alpha * 0.88})`;
          ctx.lineWidth = Math.max(0.4, strokeWidth * 0.45);
          ctx.shadowBlur = 0;
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }

  // ===========================================================================
  // 3. AMBIENT FIREFLY COLONY (EMERGING FROM THE FIREFLY SOUND JAR)
  // ===========================================================================
  class VaultFireflyParticle {
    constructor(emitter, canvasWidth, canvasHeight, isInitial) {
      this.trail = [];
      this.maxTrail = 6;
      this.reset(emitter, canvasWidth, canvasHeight, isInitial);
    }

    reset(emitter, canvasWidth, canvasHeight, isInitial = false) {
      this.w = canvasWidth;
      this.h = canvasHeight;
      this.trail = [];

      // Optical depth layers: 0.5 (distant) to 1.0 (near/radiant)
      this.depth = 0.5 + Math.random() * 0.5;
      this.baseRadius = 2.0 + this.depth * 1.6; // 2.8px to 3.6px core radius

      // Spawn location:
      // If isInitial, distribute across the visible viewport so room is immediately alive on load
      // If re-emerging during normal life-cycle, originate from the mouth of the Firefly Sound Jar!
      if (isInitial) {
        this.x = emitter.x + (Math.random() - 0.5) * (canvasWidth * 0.75);
        this.y = 35 + Math.random() * (canvasHeight * 0.65);
        this.alpha = 0;
        this.targetAlpha = 0.65 + this.depth * 0.35;
        this.born = performance.now() - Math.random() * 9000;
      } else {
        // Emerge directly from the mouth of the Firefly Sound Jar at top right
        this.x = emitter.x + (Math.random() - 0.5) * 8;
        this.y = emitter.y + Math.random() * 4;
        this.alpha = 0;
        this.targetAlpha = 0.65 + this.depth * 0.35;
        this.born = performance.now();
      }

      // Weightless drift velocities: gently floating away from the jar diagonally down-left
      const angle = (0.55 + Math.random() * 0.38) * Math.PI;
      const speed = (0.28 + Math.random() * 0.36) * this.depth;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.abs(Math.sin(angle) * speed);

      // Wander forces: gentle harmonic sways
      this.wanderAngle = Math.random() * Math.PI * 2;
      this.wanderSpeed = 0.007 + Math.random() * 0.01;
      this.wanderRadius = 0.07 + Math.random() * 0.12;

      // Bioluminescence: periodic flash pulse
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.0018 + Math.random() * 0.0028;

      // Natural hovering states: pauses occasionally to inspect the gallery
      this.isHovering = false;
      this.hoverUntil = 0;
      this.nextHover = performance.now() + 4500 + Math.random() * 8000;

      // Lifespan: 22s to 38s of atmospheric wandering before quiet re-emergence
      this.lifespan = 22000 + Math.random() * 16000;
      this.isDying = false;
    }

    update(now, mouseX, mouseY, emitter) {
      const age = now - this.born;

      // Fade-in during emergence
      if (age < 2200) {
        this.alpha = (age / 2200) * this.targetAlpha;
      } else if (!this.isDying) {
        this.alpha = this.targetAlpha;
      }

      // Check life completion or viewport exit
      if (age >= this.lifespan || this.y > this.h + 30 || this.x < -50 || this.x > this.w + 50) {
        this.isDying = true;
      }

      // Fade out before rebirth
      if (this.isDying) {
        this.alpha -= 0.014;
        if (this.alpha <= 0) {
          this.reset(emitter, this.w, this.h, false);
          return;
        }
      }

      // Hover behavior: momentarily pausing with subtle wing-lift bobbing
      if (now > this.nextHover && !this.isHovering && !this.isDying) {
        this.isHovering = true;
        this.hoverUntil = now + 1200 + Math.random() * 1800;
        this.nextHover = now + 8000 + Math.random() * 12000;
      }

      if (this.isHovering) {
        if (now < this.hoverUntil) {
          this.vx *= 0.91;
          this.vy *= 0.91;
          this.y += Math.sin(now * 0.004) * 0.18;
        } else {
          this.isHovering = false;
          this.wanderAngle += (Math.random() - 0.5) * 0.9;
          this.vx = Math.cos(this.wanderAngle) * 0.35 * this.depth;
          this.vy = (0.22 + Math.random() * 0.28) * this.depth;
        }
      } else {
        // Organic wander forces: slow, flowing changes in direction
        this.wanderAngle += (Math.random() - 0.5) * 0.07;
        const ax = Math.cos(this.wanderAngle) * this.wanderRadius * 0.06;
        const ay = (Math.sin(this.wanderAngle) * this.wanderRadius * 0.04) + 0.015 * this.depth;

        this.vx += ax;
        this.vy += ay;

        // Terminal drift speed limit (never falls like rain)
        const currentSpeed = Math.hypot(this.vx, this.vy);
        const maxSpeed = 0.85 * this.depth;
        if (currentSpeed > maxSpeed) {
          this.vx = (this.vx / currentSpeed) * maxSpeed;
          this.vy = (this.vy / currentSpeed) * maxSpeed;
        }
      }

      // Ambient cursor reactivity: gentle air displacement if mouse approaches
      if (mouseX > 0 && mouseY > 0) {
        const dmx = this.x - mouseX;
        const dmy = this.y - mouseY;
        const dist = Math.hypot(dmx, dmy);
        if (dist < 110 && dist > 1) {
          const push = (1 - dist / 110) * 0.22;
          this.vx += (dmx / dist) * push;
          this.vy += (dmy / dist) * push;
        }
      }

      // Move particle
      this.x += this.vx;
      this.y += this.vy;

      // Update trailing positions history
      if (Math.hypot(this.vx, this.vy) > 0.08) {
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrail) {
          this.trail.pop();
        }
      }
    }

    draw(ctx, now) {
      if (this.alpha <= 0.01) return;

      // Bioluminescent pulse curve (sharp organic flash, rich warm resting ember)
      const rawPulse = Math.sin(now * this.pulseSpeed + this.pulsePhase);
      const flash = Math.pow(Math.max(0, rawPulse), 2.6);
      const lum = this.alpha * (0.52 + 0.48 * flash);

      // 1. Phosphorescent Vapor Trail
      if (this.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = `rgba(202, 158, 88, ${lum * 0.22})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // 2. High-Contrast Diffused Warm Halo (Visible on ivory & dark backgrounds)
      const haloRadius = this.baseRadius * (4.8 + flash * 2.2);
      const halo = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, haloRadius);
      halo.addColorStop(0, `rgba(255, 245, 215, ${lum * 0.65})`);
      halo.addColorStop(0.35, `rgba(235, 195, 118, ${lum * 0.42})`);
      halo.addColorStop(0.75, `rgba(182, 138, 64, ${lum * 0.18})`);
      halo.addColorStop(1, 'rgba(164, 122, 54, 0)');

      ctx.beginPath();
      ctx.arc(this.x, this.y, haloRadius, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // 3. Sharp, Luminous White-Gold Core
      const coreRadius = this.baseRadius * (0.9 + flash * 0.4);
      const core = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, coreRadius);
      core.addColorStop(0, `rgba(255, 255, 255, ${lum})`);
      core.addColorStop(0.55, `rgba(255, 246, 212, ${lum * 0.95})`);
      core.addColorStop(0.85, `rgba(228, 186, 102, ${lum * 0.8})`);
      core.addColorStop(1, `rgba(178, 134, 58, ${lum * 0.45})`);

      ctx.beginPath();
      ctx.arc(this.x, this.y, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.shadowColor = `rgba(214, 168, 82, ${lum * 0.85})`;
      ctx.shadowBlur = 8;
      ctx.fill();
    }
  }

  class VaultFireflySystem {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.particles = [];
      this.mouseX = -100;
      this.mouseY = -100;
      this.rafId = null;
      this.isPaused = false;

      this.init();
    }

    init() {
      this.createCanvas();
      this.initParticles();
      this.bindEvents();
      this.startLoop();
    }

    createCanvas() {
      if (document.getElementById('vaultFireflyCanvas')) {
        this.canvas = document.getElementById('vaultFireflyCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.resizeCanvas();
        return;
      }

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'vaultFireflyCanvas';
      this.canvas.className = 'vault-firefly-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d', { alpha: true });

      const mount = () => {
        document.body.appendChild(this.canvas);
        this.resizeCanvas();
      };

      if (document.body) {
        mount();
      } else {
        document.addEventListener('DOMContentLoaded', mount);
      }
    }

    getEmitterCoords() {
      const jar = document.getElementById('vaultSoundJar');
      if (jar) {
        const rect = jar.getBoundingClientRect();
        return {
          x: rect.left + 15,
          y: Math.max(12, rect.top + 8)
        };
      }
      return {
        x: window.innerWidth - 65,
        y: 35
      };
    }

    emitBurst(count = 3) {
      const emitter = this.getEmitterCoords();
      const num = Math.min(count, this.particles.length);
      for (let i = 0; i < num; i++) {
        this.particles[i].reset(emitter, window.innerWidth, window.innerHeight, false);
        this.particles[i].vx = -(0.45 + Math.random() * 0.45) * this.particles[i].depth;
        this.particles[i].vy = (0.25 + Math.random() * 0.35) * this.particles[i].depth;
      }
    }

    resizeCanvas() {
      if (!this.canvas || !this.ctx) return;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.canvas.width = Math.floor(width * this.dpr);
      this.canvas.height = Math.floor(height * this.dpr);
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';

      if (this.ctx.resetTransform) {
        this.ctx.resetTransform();
      } else {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      this.ctx.scale(this.dpr, this.dpr);

      for (const p of this.particles) {
        p.w = width;
        p.h = height;
      }
    }

    initParticles() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const emitter = this.getEmitterCoords();

      // 12 active fireflies on desktop, 7 on mobile viewports
      const count = width < 680 ? 7 : 12;
      this.particles = [];

      for (let i = 0; i < count; i++) {
        this.particles.push(new VaultFireflyParticle(emitter, width, height, true));
      }
    }

    bindEvents() {
      const onMove = (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('mousemove', onMove, { passive: true });

      window.addEventListener('resize', () => {
        this.resizeCanvas();
      }, { passive: true });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.isPaused = true;
          if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
          }
        } else {
          this.isPaused = false;
          this.startLoop();
        }
      });
    }

    startLoop() {
      if (this.rafId || this.isPaused) return;

      const loop = (now) => {
        this.render(now);
        this.rafId = requestAnimationFrame(loop);
      };

      this.rafId = requestAnimationFrame(loop);
    }

    render(now) {
      if (!this.ctx || !this.canvas) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      const ctx = this.ctx;

      ctx.clearRect(0, 0, width, height);

      const emitter = this.getEmitterCoords();

      // 1. Subtle Bioluminescent Aura around the mouth of the Firefly Sound Jar
      ctx.save();
      const auraPulse = (Math.sin(now * 0.0016) + 1) / 2;
      const auraRadius = 38 + auraPulse * 16;
      const auraAlpha = 0.16 + auraPulse * 0.09;

      const auraGrad = ctx.createRadialGradient(emitter.x, emitter.y, 0, emitter.x, emitter.y, auraRadius);
      auraGrad.addColorStop(0, `rgba(245, 218, 156, ${auraAlpha * 1.5})`);
      auraGrad.addColorStop(0.4, `rgba(224, 188, 120, ${auraAlpha})`);
      auraGrad.addColorStop(0.78, `rgba(182, 138, 64, ${auraAlpha * 0.25})`);
      auraGrad.addColorStop(1, 'rgba(164, 122, 54, 0)');

      ctx.beginPath();
      ctx.arc(emitter.x, emitter.y, auraRadius, 0, Math.PI * 2);
      ctx.fillStyle = auraGrad;
      ctx.fill();
      ctx.restore();

      // 2. Update & Draw Active Fireflies
      ctx.save();
      for (const p of this.particles) {
        p.update(now, this.mouseX, this.mouseY, emitter);
        p.draw(ctx, now);
      }
      ctx.restore();
    }
  }

  // ===========================================================================
  // 4. INTERACTIVE FIREFLY SOUND JAR (ACTIVE THEORY SCROLL REACTION & AMBIENT AUDIO)
  // ===========================================================================
  class VaultSoundJar {
    constructor() {
      this.jarEl = null;
      this.audio = null;
      this.isPlaying = false;
      this.fadeInterval = null;
      this.lastScrollY = window.scrollY;
      this.isHiddenByScroll = false;

      this.init();
    }

    init() {
      this.createJarDOM();
      this.initAudio();
      this.bindEvents();
    }

    createJarDOM() {
      if (document.getElementById('vaultSoundJar')) {
        this.jarEl = document.getElementById('vaultSoundJar');
        return;
      }

      this.jarEl = document.createElement('button');
      this.jarEl.id = 'vaultSoundJar';
      this.jarEl.className = 'vault-sound-jar';
      this.jarEl.setAttribute('role', 'button');
      this.jarEl.setAttribute('aria-label', 'Toggle ambient gallery sound');
      this.jarEl.setAttribute('aria-pressed', 'false');

      this.jarEl.innerHTML = `
        <div class="vault-jar-bottle">
          <div class="vault-jar-cork"></div>
          <div class="vault-jar-neck"></div>
          <div class="vault-jar-glass">
            <div class="vault-jar-ember vault-jar-ember-1"></div>
            <div class="vault-jar-ember vault-jar-ember-2"></div>
            <div class="vault-jar-ember vault-jar-ember-3"></div>
            <div class="vault-jar-reflection"></div>
          </div>
        </div>
        <div class="vault-sound-info">
          <div class="vault-sound-bars">
            <span class="vault-sound-bar"></span>
            <span class="vault-sound-bar"></span>
            <span class="vault-sound-bar"></span>
            <span class="vault-sound-bar"></span>
          </div>
          <span class="vault-sound-label">SOUND</span>
        </div>
      `;

      const mount = () => {
        document.body.appendChild(this.jarEl);
      };

      if (document.body) {
        mount();
      } else {
        document.addEventListener('DOMContentLoaded', mount);
      }
    }

    initAudio() {
      this.audio = new Audio('the-vault-ambient.mp3');
      this.audio.loop = true;
      this.audio.volume = 0;
      this.audio.preload = 'auto';

      try {
        const saved = sessionStorage.getItem('vault_sound_playing');
        if (saved === 'true') {
          const playPromise = this.audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              this.isPlaying = true;
              this.setPlayingState(true);
              this.fadeAudio(0.55, 600);
            }).catch(() => {
              this.isPlaying = false;
              this.setPlayingState(false);
            });
          }
        }
      } catch (e) {}
    }

    bindEvents() {
      this.jarEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSound();
      });

      // Active Theory Scroll Direction Reaction:
      // Scrolling down -> box slides up out of view
      // Scrolling up -> box slides down into view
      window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - this.lastScrollY;

        if (currentScrollY > 70 && delta > 6) {
          if (!this.isHiddenByScroll) {
            this.isHiddenByScroll = true;
            this.jarEl.classList.add('is-scrolled-hidden');
          }
        } else if (delta < -4 || currentScrollY <= 25) {
          if (this.isHiddenByScroll) {
            this.isHiddenByScroll = false;
            this.jarEl.classList.remove('is-scrolled-hidden');
          }
        }

        this.lastScrollY = currentScrollY;
      }, { passive: true });
    }

    toggleSound() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }

    play() {
      if (!this.audio) return;
      this.isPlaying = true;
      this.setPlayingState(true);

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.fadeAudio(0.55, 600);
          try {
            sessionStorage.setItem('vault_sound_playing', 'true');
          } catch (e) {}

          // Emit a burst of fireflies escaping from the jar!
          if (window.__vaultFireflySystem) {
            window.__vaultFireflySystem.emitBurst(3);
          }
        }).catch((err) => {
          console.warn('[THE VAULT] Audio play prevented by browser policy:', err);
          this.isPlaying = false;
          this.setPlayingState(false);
        });
      }
    }

    pause() {
      if (!this.audio) return;
      this.isPlaying = false;
      this.setPlayingState(false);

      this.fadeAudio(0, 450, () => {
        this.audio.pause();
      });

      try {
        sessionStorage.setItem('vault_sound_playing', 'false');
      } catch (e) {}
    }

    setPlayingState(playing) {
      if (playing) {
        this.jarEl.classList.add('is-playing');
        this.jarEl.setAttribute('aria-pressed', 'true');
        const label = this.jarEl.querySelector('.vault-sound-label');
        if (label) label.textContent = 'MUTE';
      } else {
        this.jarEl.classList.remove('is-playing');
        this.jarEl.setAttribute('aria-pressed', 'false');
        const label = this.jarEl.querySelector('.vault-sound-label');
        if (label) label.textContent = 'SOUND';
      }
    }

    fadeAudio(targetVol, duration, onComplete) {
      if (this.fadeInterval) clearInterval(this.fadeInterval);
      if (!this.audio) return;

      const startVol = this.audio.volume;
      const startTime = performance.now();

      this.fadeInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        this.audio.volume = Math.max(0, Math.min(1, startVol + (targetVol - startVol) * progress));

        if (progress >= 1) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          if (onComplete) onComplete();
        }
      }, 25);
    }
  }

  // ===========================================================================
  // DOM BOOTSTRAP
  // ===========================================================================
  let loaderInstance = null;
  let cursorInstance = null;
  let fireflyInstance = null;
  let soundJarInstance = null;

  function boot() {
    if (!loaderInstance) {
      loaderInstance = new VaultLoader();
    }
    if (!cursorInstance) {
      cursorInstance = new VaultCursorAndTrail();
    }
    if (!fireflyInstance) {
      fireflyInstance = new VaultFireflySystem();
      window.__vaultFireflySystem = fireflyInstance;
    }
    if (!soundJarInstance) {
      soundJarInstance = new VaultSoundJar();
    }
    try {
      console.log('[THE VAULT] ✨ Ambient Firefly Jar, Audio & Liquid Cursor Active');
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
