/**
 * THE VAULT — Signature Liquid Cursor, Ambient Firefly Colony & Cinematic Loading Experience
 *
 * Implements:
 *  1. Active Theory inspired minimalist loading overlay with sequential dot pulse
 *  2. Dual-element champagne-brass custom cursor with physical inertia & contextual hover states
 *  3. Viscous molten champagne gold liquid trail on Canvas 2D with elastic deformation & continuous fluid hulls
 *  4. Ambient glowing firefly colony emerging from upper-edge gathering point and dispersing into the gallery
 *
 * Strict constraint: Pure vanilla JavaScript, CSS3, Canvas 2D. Zero external libraries.
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Accessibility & Motion Checks
  // ---------------------------------------------------------------------------
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  // 2. SIGNATURE LUXURY CURSOR & MOLTEN LIQUID TRAIL PHYSICS
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

      // Fluid Trail History & Dynamics
      this.points = [];
      this.maxTrailPoints = 38;
      this.trailLifespan = 680; // ms for rich, visible molten liquid flow

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

      // Add molten fluid trail point if moved at least 1.5px
      if (dist > 1.5) {
        this.addTrailPoint(clientX, clientY, dx, dy, dist, now);
      }

      if (!this.rafId) {
        this.startLoop();
      }
    }

    addTrailPoint(x, y, vx, vy, speed, now) {
      const normalizedSpeed = Math.min(speed / 30, 1);
      const radius = 6.5 + (1 - normalizedSpeed) * 6.5;

      this.points.unshift({
        x: x,
        y: y,
        vx: vx * 0.25,
        vy: vy * 0.25,
        radius: radius,
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
        if (idleDuration > 300 && this.points.length === 0) {
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

        pt.vx *= 0.88;
        pt.vy *= 0.88;
        pt.x += pt.vx;
        pt.y += pt.vy;

        if (i > 0) {
          const newer = pts[i - 1];
          pt.x += (newer.x - pt.x) * 0.11;
          pt.y += (newer.y - pt.y) * 0.11;
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

      // 1. Draw Continuous Molten Liquid Ribbons between consecutive points
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];

        const age1 = now - p1.birth;
        const age2 = now - p2.birth;
        const progress1 = Math.min(1, Math.max(0, age1 / p1.lifespan));
        const progress2 = Math.min(1, Math.max(0, age2 / p2.lifespan));

        const alpha1 = Math.pow(1 - progress1, 1.25);
        const alpha2 = Math.pow(1 - progress2, 1.25);
        const avgAlpha = (alpha1 + alpha2) / 2;

        if (avgAlpha <= 0.01) continue;

        const r1 = Math.max(1.8, p1.radius * (1 - progress1 * 0.82));
        const r2 = Math.max(1.2, p2.radius * (1 - progress2 * 0.82));

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const d = Math.hypot(dx, dy) || 1;

        const nx = -dy / d;
        const ny = dx / d;

        const x1L = p1.x + nx * r1;
        const y1L = p1.y + ny * r1;
        const x1R = p1.x - nx * r1;
        const y1R = p1.y - ny * r1;

        const x2L = p2.x + nx * r2;
        const y2L = p2.y + ny * r2;
        const x2R = p2.x - nx * r2;
        const y2R = p2.y - ny * r2;

        ctx.beginPath();
        ctx.moveTo(x1L, y1L);
        ctx.lineTo(x2L, y2L);
        ctx.lineTo(x2R, y2R);
        ctx.lineTo(x1R, y1R);
        ctx.closePath();

        ctx.fillStyle = `rgba(214, 185, 126, ${avgAlpha * 0.72})`;
        ctx.shadowColor = 'rgba(214, 185, 126, 0.55)';
        ctx.shadowBlur = 8;
        ctx.fill();
      }

      // 2. Draw Molten Liquid Droplets with Radial Gleam at Joints
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        const age = now - pt.birth;
        const progress = Math.min(1, Math.max(0, age / pt.lifespan));
        const alpha = Math.pow(1 - progress, 1.3);

        if (alpha <= 0.01) continue;

        const r = Math.max(1.8, pt.radius * (1 - progress * 0.82));

        const grad = ctx.createRadialGradient(
          pt.x, pt.y, 0,
          pt.x, pt.y, r
        );

        grad.addColorStop(0, `rgba(252, 248, 238, ${alpha * 0.95})`);
        grad.addColorStop(0.45, `rgba(224, 196, 140, ${alpha * 0.85})`);
        grad.addColorStop(0.85, `rgba(186, 153, 98, ${alpha * 0.45})`);
        grad.addColorStop(1, `rgba(186, 153, 98, 0)`);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(214, 185, 126, 0.65)';
        ctx.shadowBlur = 10;
        ctx.fill();
      }

      // 3. Subtle Inner Molten Core Streak
      if (pts.length > 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 0; i < Math.min(pts.length - 1, 14); i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.strokeStyle = 'rgba(255, 250, 240, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(255, 250, 240, 0.8)';
        ctx.shadowBlur = 6;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // ===========================================================================
  // 3. AMBIENT FIREFLY COLONY (UPPER-EDGE EMERGENCE & GALLERY DISPERSION)
  // ===========================================================================
  class VaultFireflyParticle {
    constructor(emitterX, canvasWidth, canvasHeight, isInitial) {
      this.trail = [];
      this.maxTrail = 5;
      this.reset(emitterX, canvasWidth, canvasHeight, isInitial);
    }

    reset(emitterX, canvasWidth, canvasHeight, isInitial = false) {
      this.w = canvasWidth;
      this.h = canvasHeight;
      this.trail = [];

      // Optical depth layers: 0.45 (distant/dimmer) to 1.0 (near/luminous)
      this.depth = 0.45 + Math.random() * 0.55;
      this.baseRadius = 1.3 + this.depth * 1.35; // 1.9px to 2.65px core radius

      // Spawn location:
      // If isInitial, gracefully scatter across upper & mid gallery so room is immediately alive
      // If re-emerging during normal life-cycle, originate from the upper-edge colony cluster
      if (isInitial) {
        this.x = emitterX + (Math.random() - 0.5) * (canvasWidth * 0.65);
        this.y = 40 + Math.random() * (canvasHeight * 0.55);
        this.alpha = 0;
        this.targetAlpha = 0.45 + this.depth * 0.45;
        this.born = performance.now() - Math.random() * 8000;
      } else {
        // Upper edge colony emergence point (subtle golden cluster)
        this.x = emitterX + (Math.random() - 0.5) * 56;
        this.y = Math.random() * 8; // gently beneath top edge
        this.alpha = 0;
        this.targetAlpha = 0.45 + this.depth * 0.45;
        this.born = performance.now();
      }

      // Weightless drift velocities: slow, elegant downward/diagonal floating
      const angle = (0.2 + Math.random() * 0.6) * Math.PI; // biased diagonally downwards
      const speed = (0.22 + Math.random() * 0.32) * this.depth;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.abs(Math.sin(angle) * speed);

      // Wander forces: gentle harmonic sways
      this.wanderAngle = Math.random() * Math.PI * 2;
      this.wanderSpeed = 0.006 + Math.random() * 0.008;
      this.wanderRadius = 0.06 + Math.random() * 0.1;

      // Bioluminescence: periodic flash pulse
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.0016 + Math.random() * 0.0024;

      // Natural hovering states: pauses occasionally to inspect the gallery
      this.isHovering = false;
      this.hoverUntil = 0;
      this.nextHover = performance.now() + 5000 + Math.random() * 9000;

      // Lifespan: 20s to 35s of atmospheric wandering before quiet re-emergence
      this.lifespan = 20000 + Math.random() * 15000;
      this.isDying = false;
    }

    update(now, mouseX, mouseY, emitterX) {
      const age = now - this.born;

      // Fade-in during emergence
      if (age < 2400) {
        this.alpha = (age / 2400) * this.targetAlpha;
      } else if (!this.isDying) {
        this.alpha = this.targetAlpha;
      }

      // Check life completion or viewport exit
      if (age >= this.lifespan || this.y > this.h + 20 || this.x < -40 || this.x > this.w + 40) {
        this.isDying = true;
      }

      // Fade out before rebirth
      if (this.isDying) {
        this.alpha -= 0.012;
        if (this.alpha <= 0) {
          this.reset(emitterX, this.w, this.h, false);
          return;
        }
      }

      // Hover behavior: momentarily pausing with subtle wing-lift bobbing
      if (now > this.nextHover && !this.isHovering && !this.isDying) {
        this.isHovering = true;
        this.hoverUntil = now + 1200 + Math.random() * 1600;
        this.nextHover = now + 8000 + Math.random() * 12000;
      }

      if (this.isHovering) {
        if (now < this.hoverUntil) {
          this.vx *= 0.92;
          this.vy *= 0.92;
          this.y += Math.sin(now * 0.004) * 0.16;
        } else {
          this.isHovering = false;
          // Resume gentle forward wander
          this.wanderAngle += (Math.random() - 0.5) * 0.8;
          this.vx = Math.cos(this.wanderAngle) * 0.3 * this.depth;
          this.vy = (0.2 + Math.random() * 0.25) * this.depth;
        }
      } else {
        // Organic wander forces: slow, flowing changes in direction
        this.wanderAngle += (Math.random() - 0.5) * 0.06;
        const ax = Math.cos(this.wanderAngle) * this.wanderRadius * 0.05;
        const ay = (Math.sin(this.wanderAngle) * this.wanderRadius * 0.035) + 0.012 * this.depth;

        this.vx += ax;
        this.vy += ay;

        // Terminal drift speed limit (never falls like rain)
        const currentSpeed = Math.hypot(this.vx, this.vy);
        const maxSpeed = 0.75 * this.depth;
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
        if (dist < 100 && dist > 1) {
          const push = (1 - dist / 100) * 0.18;
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

      // Bioluminescent pulse curve (sharp organic flash, smooth resting ember)
      const rawPulse = Math.sin(now * this.pulseSpeed + this.pulsePhase);
      const flash = Math.pow(Math.max(0, rawPulse), 2.8);
      const lum = this.alpha * (0.42 + 0.58 * flash);

      // 1. Subtle Phosphorescent Vapor Trail
      if (this.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.strokeStyle = `rgba(224, 196, 140, ${lum * 0.14})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // 2. Delicate Soft Diffused Halo
      const haloRadius = this.baseRadius * (4.2 + flash * 1.8);
      const halo = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, haloRadius);
      halo.addColorStop(0, `rgba(248, 235, 196, ${lum * 0.45})`);
      halo.addColorStop(0.42, `rgba(224, 196, 140, ${lum * 0.22})`);
      halo.addColorStop(1, 'rgba(186, 153, 98, 0)');

      ctx.beginPath();
      ctx.arc(this.x, this.y, haloRadius, 0, Math.PI * 2);
      ctx.fillStyle = halo;
      ctx.fill();

      // 3. Tiny Luminous Champagne-Gold Core
      const coreRadius = this.baseRadius * (0.85 + flash * 0.35);
      const core = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, coreRadius);
      core.addColorStop(0, `rgba(255, 252, 245, ${lum * 0.98})`);
      core.addColorStop(0.55, `rgba(235, 208, 152, ${lum * 0.88})`);
      core.addColorStop(1, `rgba(200, 168, 110, ${lum * 0.38})`);

      ctx.beginPath();
      ctx.arc(this.x, this.y, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.shadowColor = `rgba(224, 196, 140, ${lum * 0.75})`;
      ctx.shadowBlur = 6;
      ctx.fill();
    }
  }

  class VaultFireflySystem {
    constructor() {
      if (prefersReducedMotion) return;

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
        // Prepend canvas so it stays behind website content in body stacking
        document.body.prepend(this.canvas);
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

      // Refresh particle dimensions
      const emitterX = width * 0.48;
      for (const p of this.particles) {
        p.w = width;
        p.h = height;
      }
    }

    initParticles() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const emitterX = width * 0.48;

      // 11 active fireflies on desktop, 6 on mobile viewports
      const count = width < 680 ? 6 : 11;
      this.particles = [];

      for (let i = 0; i < count; i++) {
        this.particles.push(new VaultFireflyParticle(emitterX, width, height, true));
      }
    }

    bindEvents() {
      // Passive mouse coordinate tracking for gentle air displacement
      const onMove = (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      };
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('mousemove', onMove, { passive: true });

      // Window resize
      window.addEventListener('resize', () => {
        this.resizeCanvas();
      }, { passive: true });

      // Tab visibility: pause loop when tab is hidden, resume on active
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

      const emitterX = width * 0.48;

      // 1. Discreet Upper-Edge Gathering Aura (Emergence Colony Cluster)
      ctx.save();
      const auraPulse = (Math.sin(now * 0.0012) + 1) / 2;
      const auraRadius = 78 + auraPulse * 16;
      const auraAlpha = 0.07 + auraPulse * 0.045;

      const auraGrad = ctx.createRadialGradient(emitterX, 0, 0, emitterX, 0, auraRadius);
      auraGrad.addColorStop(0, `rgba(228, 202, 146, ${auraAlpha * 1.5})`);
      auraGrad.addColorStop(0.38, `rgba(214, 185, 126, ${auraAlpha})`);
      auraGrad.addColorStop(0.72, `rgba(186, 153, 98, ${auraAlpha * 0.3})`);
      auraGrad.addColorStop(1, 'rgba(186, 153, 98, 0)');

      ctx.beginPath();
      ctx.arc(emitterX, 0, auraRadius, 0, Math.PI * 2);
      ctx.fillStyle = auraGrad;
      ctx.fill();
      ctx.restore();

      // 2. Update & Draw Active Fireflies
      ctx.save();
      for (const p of this.particles) {
        p.update(now, this.mouseX, this.mouseY, emitterX);
        p.draw(ctx, now);
      }
      ctx.restore();
    }
  }

  // ===========================================================================
  // DOM BOOTSTRAP
  // ===========================================================================
  let loaderInstance = null;
  let cursorInstance = null;
  let fireflyInstance = null;

  function boot() {
    if (!loaderInstance) {
      loaderInstance = new VaultLoader();
    }
    if (!cursorInstance) {
      cursorInstance = new VaultCursorAndTrail();
    }
    if (!fireflyInstance) {
      fireflyInstance = new VaultFireflySystem();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
