/**
 * THE VAULT — Signature Liquid Cursor, Fluid Mouse Trail & Cinematic Loading Experience
 *
 * Designed to complement THE VAULT's luxury editorial identity.
 * Features:
 *  1. Custom precision champagne-brass cursor with dual-element inertia
 *  2. Viscous liquid mouse trail on Canvas 2D with elastic deformation & continuous ribbon meshing
 *  3. Active Theory inspired minimalist cinematic loading screen with sequential dot pulse
 *
 * Strict constraint: Pure vanilla JavaScript, CSS3, Canvas 2D. Zero external libraries.
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Feature Support & Accessibility Checks
  // ---------------------------------------------------------------------------
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ===========================================================================
  // 1. ACTIVE THEORY INSPIRED CINEMATIC LOADING SCREEN
  // ===========================================================================
  class VaultLoader {
    constructor() {
      this.loaderEl = null;
      this.startTime = performance.now();
      this.isSubsequentVisit = false;
      this.minDisplayDuration = 850; // ms for initial luxury sequence
      this.subsequentDuration = 180; // ms for snappy internal page transitions
      this.init();
    }

    init() {
      try {
        if (sessionStorage.getItem('vault_visited') === 'true') {
          this.isSubsequentVisit = true;
        }
      } catch (e) {
        // Fallback for sandboxed or private browsing environments
        this.isSubsequentVisit = false;
      }

      this.createLoaderDOM();
      this.setupDismissal();
    }

    createLoaderDOM() {
      // Check if loader element already exists in document
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

      // Hard safety timeout: ensure loader never blocks user interface (max 2200ms)
      setTimeout(() => {
        this.dismiss();
      }, 2200);
    }

    dismiss() {
      if (!this.loaderEl || this.loaderEl.classList.contains('is-hidden')) return;

      this.loaderEl.classList.add('is-hidden');

      try {
        sessionStorage.setItem('vault_visited', 'true');
      } catch (e) {}

      // Fully remove or hide after transition finishes
      setTimeout(() => {
        if (this.loaderEl && this.loaderEl.parentNode) {
          this.loaderEl.style.display = 'none';
        }
      }, 800);
    }
  }

  // ===========================================================================
  // 2. SIGNATURE LUXURY CURSOR & LIQUID MOTION PHYSICS
  // ===========================================================================
  class VaultCursorAndTrail {
    constructor() {
      if (!isFinePointer) return; // Only activate on precision pointer desktop hardware

      this.mouse = { x: -100, y: -100, prevX: -100, prevY: -100, vx: 0, vy: 0, speed: 0 };
      this.dot = { x: -100, y: -100 };
      this.ring = { x: -100, y: -100, scale: 1, angle: 0 };

      this.hasPointerMoved = false;
      this.isPointerInside = false;
      this.isIdle = true;
      this.lastMoveTime = 0;
      this.rafId = null;

      // Trail Points & Viscous Physics History
      this.points = [];
      this.maxTrailPoints = 36;
      this.trailLifespan = 420; // milliseconds

      this.canvas = null;
      this.ctx = null;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.dotEl = null;
      this.ringEl = null;
      this.labelEl = null;

      this.init();
    }

    init() {
      document.body.classList.add('vault-cursor-active');

      this.createCursorElements();
      this.createCanvas();
      this.bindEvents();
      this.startLoop();
    }

    createCursorElements() {
      // Precision Dot
      this.dotEl = document.createElement('div');
      this.dotEl.className = 'vault-cursor-dot is-hidden';
      this.dotEl.setAttribute('aria-hidden', 'true');

      // Follower Ring
      this.ringEl = document.createElement('div');
      this.ringEl.className = 'vault-cursor-ring is-hidden';
      this.ringEl.setAttribute('aria-hidden', 'true');

      // Contextual Label inside ring (e.g. "VIEW")
      this.labelEl = document.createElement('span');
      this.labelEl.className = 'vault-cursor-label';
      this.labelEl.textContent = 'VIEW';
      this.ringEl.appendChild(this.labelEl);

      document.body.appendChild(this.dotEl);
      document.body.appendChild(this.ringEl);
    }

    createCanvas() {
      if (prefersReducedMotion) return;

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'vault-trail-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d', { alpha: true });

      document.body.appendChild(this.canvas);
      this.resizeCanvas();
    }

    resizeCanvas() {
      if (!this.canvas || !this.ctx) return;
      const width = window.innerWidth;
      const height = window.innerHeight;

      this.canvas.width = Math.floor(width * this.dpr);
      this.canvas.height = Math.floor(height * this.dpr);
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';

      this.ctx.scale(this.dpr, this.dpr);
    }

    bindEvents() {
      // Pointer move tracking
      window.addEventListener('pointermove', (e) => this.onPointerMove(e), { passive: true });
      document.addEventListener('mouseleave', () => this.onMouseLeave(), { passive: true });
      document.addEventListener('mouseenter', (e) => this.onMouseEnter(e), { passive: true });

      // Window resize
      window.addEventListener('resize', () => {
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.resizeCanvas();
      }, { passive: true });

      // Contextual Hover States Delegation
      this.setupContextualHover();
    }

    setupContextualHover() {
      document.addEventListener('pointerover', (e) => {
        const target = e.target;
        if (!target || !target.closest) return;

        // 1. Text Inputs / Editable areas -> Native cursor restoration
        const isEditable = target.closest('input, textarea, select, [contenteditable="true"]');
        if (isEditable) {
          this.setHidden(true);
          return;
        } else {
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

        // 4. Standard Links & Interactive anchors
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
      if (hidden) {
        this.dotEl.classList.add('is-hidden');
        this.ringEl.classList.add('is-hidden');
      } else if (this.isPointerInside) {
        this.dotEl.classList.remove('is-hidden');
        this.ringEl.classList.remove('is-hidden');
      }
    }

    onPointerMove(e) {
      const now = performance.now();
      const clientX = e.clientX;
      const clientY = e.clientY;

      if (!this.hasPointerMoved) {
        this.hasPointerMoved = true;
        this.isPointerInside = true;
        this.dot.x = clientX;
        this.dot.y = clientY;
        this.ring.x = clientX;
        this.ring.y = clientY;
        this.mouse.prevX = clientX;
        this.mouse.prevY = clientY;
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
      this.isIdle = false;

      // Add fluid point to trail if moved at least 2 pixels
      if (!prefersReducedMotion && dist > 1.8) {
        this.addTrailPoint(clientX, clientY, dx, dy, dist, now);
      }

      // If loop was stopped for idle power-saving, wake it up immediately
      if (!this.rafId) {
        this.startLoop();
      }
    }

    addTrailPoint(x, y, vx, vy, speed, now) {
      // Dynamic stretching: high velocity narrows ribbon, slow movement pools molten droplet
      const normalizedSpeed = Math.min(speed / 35, 1);
      const initialWidth = 9 + (1 - normalizedSpeed) * 7; // 9px to 16px molten droplet width

      this.points.unshift({
        x: x,
        y: y,
        vx: vx * 0.22, // subtle hydrodynamic inertia
        vy: vy * 0.22,
        birth: now,
        lifespan: this.trailLifespan,
        baseWidth: initialWidth
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
    }

    startLoop() {
      if (this.rafId) return;

      const loop = (now) => {
        this.updatePhysics(now);
        this.renderCursor();
        this.renderTrail(now);

        // Idle power-saving check:
        // If mouse has stopped moving for > 200ms and all trail points have decayed, stop RAF loop.
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
      // Cursor Central Dot Lerp (Snappy, precision response: ~0.65)
      const dotFactor = 0.65;
      this.dot.x += (this.mouse.x - this.dot.x) * dotFactor;
      this.dot.y += (this.mouse.y - this.dot.y) * dotFactor;

      // Follower Ring Lerp (Subtle physical inertia: ~0.16)
      const ringFactor = 0.16;
      this.ring.x += (this.mouse.x - this.ring.x) * ringFactor;
      this.ring.y += (this.mouse.y - this.ring.y) * ringFactor;

      // Update liquid trail points with viscosity, elastic cohesion & fading
      if (this.canvas && this.points.length > 0) {
        for (let i = this.points.length - 1; i >= 0; i--) {
          const pt = this.points[i];
          const age = now - pt.birth;

          if (age >= pt.lifespan) {
            this.points.splice(i, 1);
            continue;
          }

          // Viscous damping
          pt.vx *= 0.86;
          pt.vy *= 0.86;
          pt.x += pt.vx;
          pt.y += pt.vy;

          // Elastic cohesion: gently pull toward neighboring newer point for liquid tension
          if (i > 0) {
            const newer = this.points[i - 1];
            pt.x += (newer.x - pt.x) * 0.08;
            pt.y += (newer.y - pt.y) * 0.08;
          }
        }
      }
    }

    renderCursor() {
      if (!this.hasPointerMoved || !this.isPointerInside) return;

      // Update Dot position with 3D hardware acceleration
      this.dotEl.style.transform = `translate3d(${this.dot.x}px, ${this.dot.y}px, 0) translate(-50%, -50%)`;

      // Update Follower Ring position
      this.ringEl.style.transform = `translate3d(${this.ring.x}px, ${this.ring.y}px, 0) translate(-50%, -50%)`;
    }

    renderTrail(now) {
      if (!this.ctx || !this.canvas) return;

      const width = window.innerWidth;
      const height = window.innerHeight;
      this.ctx.clearRect(0, 0, width, height);

      const pts = this.points;
      if (pts.length < 2) return;

      // Draw continuous viscous molten gold ribbon using Bezier normal extrusion
      const normals = [];
      const leftFlank = [];
      const rightFlank = [];

      // 1. Compute tangents and normal vectors along the spine
      for (let i = 0; i < pts.length; i++) {
        let dx, dy;
        if (i === 0) {
          dx = pts[0].x - pts[1].x;
          dy = pts[0].y - pts[1].y;
        } else if (i === pts.length - 1) {
          dx = pts[i - 1].x - pts[i].x;
          dy = pts[i - 1].y - pts[i].y;
        } else {
          dx = pts[i - 1].x - pts[i + 1].x;
          dy = pts[i - 1].y - pts[i + 1].y;
        }

        const len = Math.hypot(dx, dy) || 1;
        // Perpendicular normal: (-dy, dx)
        const nx = -dy / len;
        const ny = dx / len;
        normals.push({ nx, ny });

        // Calculate dynamic width based on point age and life curve
        const pt = pts[i];
        const age = now - pt.birth;
        const progress = Math.min(Math.max(age / pt.lifespan, 0), 1);
        // Liquid taper curve: wide molten head, smooth organic taper to tail
        const taper = Math.pow(1 - progress, 1.4);
        const halfWidth = (pt.baseWidth * taper) / 2;

        leftFlank.push({
          x: pt.x + nx * halfWidth,
          y: pt.y + ny * halfWidth
        });
        rightFlank.push({
          x: pt.x - nx * halfWidth,
          y: pt.y - ny * halfWidth
        });
      }

      // 2. Build continuous closed organic fluid ribbon path
      const ctx = this.ctx;
      ctx.save();

      ctx.beginPath();
      // Start at head left flank
      ctx.moveTo(leftFlank[0].x, leftFlank[0].y);

      // Trace down left flank using midpoints quadratic curves
      for (let i = 0; i < leftFlank.length - 1; i++) {
        const xc = (leftFlank[i].x + leftFlank[i + 1].x) / 2;
        const yc = (leftFlank[i].y + leftFlank[i + 1].y) / 2;
        ctx.quadraticCurveTo(leftFlank[i].x, leftFlank[i].y, xc, yc);
      }

      // Smooth rounded cap at tail tip
      const lastLeft = leftFlank[leftFlank.length - 1];
      const lastRight = rightFlank[rightFlank.length - 1];
      const tailCenter = pts[pts.length - 1];
      ctx.quadraticCurveTo(lastLeft.x, lastLeft.y, tailCenter.x, tailCenter.y);
      ctx.quadraticCurveTo(tailCenter.x, tailCenter.y, lastRight.x, lastRight.y);

      // Trace back up right flank to head
      for (let i = rightFlank.length - 1; i > 0; i--) {
        const xc = (rightFlank[i].x + rightFlank[i - 1].x) / 2;
        const yc = (rightFlank[i].y + rightFlank[i - 1].y) / 2;
        ctx.quadraticCurveTo(rightFlank[i].x, rightFlank[i].y, xc, yc);
      }

      // Smooth rounded cap at head tip
      const headCenter = pts[0];
      ctx.quadraticCurveTo(rightFlank[0].x, rightFlank[0].y, headCenter.x, headCenter.y);
      ctx.quadraticCurveTo(headCenter.x, headCenter.y, leftFlank[0].x, leftFlank[0].y);
      ctx.closePath();

      // 3. Molten Champagne Gold Gradient Fill
      const grad = ctx.createLinearGradient(
        pts[0].x,
        pts[0].y,
        pts[pts.length - 1].x,
        pts[pts.length - 1].y
      );

      // Luxurious molten palette: Ivory highlight -> Champagne Gold -> Molten Brass -> Translucent Fade
      grad.addColorStop(0, 'rgba(247, 243, 234, 0.88)');
      grad.addColorStop(0.18, 'rgba(224, 203, 163, 0.72)');
      grad.addColorStop(0.55, 'rgba(212, 188, 145, 0.38)');
      grad.addColorStop(0.85, 'rgba(184, 155, 108, 0.14)');
      grad.addColorStop(1, 'rgba(184, 155, 108, 0)');

      ctx.fillStyle = grad;

      // Soft champagne luminous glow
      ctx.shadowColor = 'rgba(212, 188, 145, 0.45)';
      ctx.shadowBlur = 10;
      ctx.fill();

      // 4. Subtle inner luminous core highlight for molten gleam
      if (pts.length > 3) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 0; i < Math.min(pts.length - 1, 8); i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.strokeStyle = 'rgba(255, 250, 240, 0.35)';
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(247, 243, 234, 0.6)';
        ctx.shadowBlur = 6;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // ===========================================================================
  // DOM Bootstrapping
  // ===========================================================================
  let loaderInstance = null;
  let cursorInstance = null;

  function boot() {
    if (!loaderInstance) {
      loaderInstance = new VaultLoader();
    }
    if (!cursorInstance) {
      cursorInstance = new VaultCursorAndTrail();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
