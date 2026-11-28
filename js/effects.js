// THE VAULT — Sensory Effects & Three.js 3D Item Viewer
(function () {
  'use strict';

  const onBodyReady = fn => document.body ? fn() : document.addEventListener('DOMContentLoaded', fn);
  function createOverlayCanvas(id, className) {
    const canvas = document.getElementById(id) || Object.assign(document.createElement('canvas'), { id, className });
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d', { alpha: true });
    const resize = () => {
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr); canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`; canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    onBodyReady(() => { if (!canvas.parentNode) document.body.appendChild(canvas); resize(); });
    return { canvas, ctx, resize };
  }

  // 1. Page Preloader — briefly covers initial paint, then fades out.
  class VaultLoader {
    constructor() {
      const startTime = performance.now(); let visited = false;
      try { visited = sessionStorage.getItem('vault_visited') === 'true'; } catch {}
      const el = Object.assign(document.createElement('div'), {
        id: 'vaultLoader', className: 'vault-loader',
        innerHTML: '<div class="vault-loader-frame"><div class="vault-loader-frame-row"><span>THE VAULT · AUCTIONS</span><span>EST. 2026</span></div><div class="vault-loader-frame-row"><span>ONLINE CATALOGUE</span><span>EDITION 01</span></div></div><div class="vault-loader-center"><h1 class="vault-loader-brand">THE VAULT<span>.</span></h1><div class="vault-loader-divider"></div><div class="vault-loader-status">LOADING CATALOGUE</div><div class="vault-loader-dots"><div class="vault-loader-dot"></div><div class="vault-loader-dot"></div><div class="vault-loader-dot"></div></div></div>'
      });
      el.setAttribute('role', 'status');
      onBodyReady(() => { if (!document.getElementById('vaultLoader')) document.body.prepend(el); });
      this.el = el;
      const finish = () => setTimeout(() => this.dismiss(), Math.max(0, (visited ? 120 : 650) - (performance.now() - startTime)));
      if (document.readyState === 'complete') finish(); else window.addEventListener('load', finish, { once: true });
      setTimeout(() => this.dismiss(), 1800);
    }
    dismiss() {
      if (!this.el || this.el.classList.contains('is-hidden')) return;
      this.el.classList.add('is-hidden');
      try { sessionStorage.setItem('vault_visited', 'true'); } catch {}
      setTimeout(() => { if (this.el) this.el.style.display = 'none'; }, 700);
    }
  }

  // 2. Dual Custom Cursor & LERP Pointer Trail
  class VaultCursor {
    constructor() {
      this.mouse = { x: -100, y: -100 }; this.dot = { x: -100, y: -100 }; this.ring = { x: -100, y: -100 };
      this.points = []; this.active = false; this.lastMove = 0; this.raf = null;
      this.dotEl = Object.assign(document.createElement('div'), { id: 'vaultCursorDot', className: 'vault-cursor-dot is-hidden' });
      this.ringEl = Object.assign(document.createElement('div'), { id: 'vaultCursorRing', className: 'vault-cursor-ring is-hidden', innerHTML: '<span class="vault-cursor-label">VIEW</span>' });
      onBodyReady(() => { if (!document.getElementById('vaultCursorDot')) document.body.append(this.dotEl, this.ringEl); });
      const layer = createOverlayCanvas('vaultTrailCanvas', 'vault-trail-canvas'); this.ctx = layer.ctx;
      const onMove = e => this.onMove(e);
      window.addEventListener('pointermove', onMove, { passive: true }); window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('resize', layer.resize, { passive: true });
      document.addEventListener('mouseleave', () => this.setVisible(false), { passive: true });
      document.addEventListener('pointerover', e => {
        const t = e.target; if (!t?.closest) return;
        if (t.closest('input, textarea, select')) return this.setVisible(false);
        this.setVisible(this.active);
        const onCard = Boolean(t.closest('.lot-card, .editorial-lot, .home-live-card')), onBtn = !onCard && Boolean(t.closest('button, [role="button"], .filter-chip, .thumb'));
        this.ringEl.classList.toggle('is-card', onCard); this.dotEl.classList.toggle('is-card', onCard);
        this.ringEl.classList.toggle('is-button', onBtn); this.ringEl.classList.toggle('is-hovering', !onCard && !onBtn && Boolean(t.closest('a')));
      }, { passive: true });
    }
    setVisible(show) { this.dotEl.classList.toggle('is-hidden', !show); this.ringEl.classList.toggle('is-hidden', !show); }
    onMove(e) {
      if (e.pointerType === 'touch' && window.innerWidth < 680) return;
      document.body.classList.add('vault-cursor-active');
      if (!this.active) { this.active = true; this.dot = { x: e.clientX, y: e.clientY }; this.ring = { ...this.dot }; this.setVisible(true); }
      const dx = e.clientX - this.mouse.x, dy = e.clientY - this.mouse.y;
      this.mouse = { x: e.clientX, y: e.clientY }; this.lastMove = performance.now();
      if (Math.hypot(dx, dy) > 2) { this.points.unshift({ x: e.clientX, y: e.clientY, born: this.lastMove }); if (this.points.length > 16) this.points.length = 16; }
      if (!this.raf) this.loop();
    }
    loop() {
      const renderFrame = now => {
        this.dot.x += (this.mouse.x - this.dot.x) * 0.65; this.dot.y += (this.mouse.y - this.dot.y) * 0.65;
        this.ring.x += (this.mouse.x - this.ring.x) * 0.18; this.ring.y += (this.mouse.y - this.ring.y) * 0.18;
        this.points = this.points.filter(pt => now - pt.born < 280);
        if (this.active) { this.dotEl.style.transform = `translate3d(${this.dot.x}px,${this.dot.y}px,0) translate(-50%,-50%)`; this.ringEl.style.transform = `translate3d(${this.ring.x}px,${this.ring.y}px,0) translate(-50%,-50%)`; }
        if (this.ctx) {
          this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i], p2 = this.points[i + 1];
            this.ctx.beginPath(); this.ctx.moveTo(p1.x, p1.y); this.ctx.lineTo(p2.x, p2.y);
            this.ctx.strokeStyle = `rgba(202, 162, 94, ${Math.max(0, 1 - (now - p1.born) / 280) * 0.6})`;
            this.ctx.lineWidth = Math.max(0.5, 2.2 - i * 0.12); this.ctx.stroke();
          }
        }
        this.raf = (now - this.lastMove > 240 && !this.points.length) ? null : requestAnimationFrame(renderFrame);
      };
      this.raf = requestAnimationFrame(renderFrame);
    }
  }

  // 3. Ambient Firefly Particles drifting near the Sound Jar
  class VaultFireflies {
    constructor() {
      const layer = createOverlayCanvas('vaultFireflyCanvas', 'vault-firefly-canvas'); this.ctx = layer.ctx;
      this.particles = Array.from({ length: window.innerWidth < 680 ? 6 : 10 }, () => this.spawn(true));
      window.addEventListener('resize', layer.resize, { passive: true });
      const tick = now => {
        if (this.ctx && !document.hidden) {
          this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i]; p.x += p.vx + Math.sin(now * 0.001 + p.phase) * 0.15; p.y += p.vy;
            if (p.y > window.innerHeight + 20 || p.x < -30 || p.x > window.innerWidth + 30) this.particles[i] = this.spawn(false);
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(235, 195, 118, ${0.35 + 0.45 * ((Math.sin(now * 0.003 + p.phase) + 1) / 2)})`; this.ctx.fill();
          }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    spawn(randomY = false) {
      const jar = document.getElementById('vaultSoundJar')?.getBoundingClientRect();
      return { x: randomY ? Math.random() * window.innerWidth : (jar ? jar.left + 15 : window.innerWidth - 65) + (Math.random() - 0.5) * 14, y: randomY ? Math.random() * window.innerHeight * 0.7 : (jar ? Math.max(16, jar.top + 8) : 130), vx: (Math.random() - 0.65) * 0.45, vy: 0.18 + Math.random() * 0.3, r: 2 + Math.random() * 1.5, phase: Math.random() * Math.PI * 2 };
    }
    emitBurst() { this.particles.slice(0, 3).forEach((_p, i) => { this.particles[i] = this.spawn(false); }); }
  }

  // 4. Floating Ambient Audio Toggle (Sound Jar)
  class VaultSoundJar {
    constructor() {
      this.playing = false; this.lastScrollY = window.scrollY;
      const btn = Object.assign(document.createElement('button'), { id: 'vaultSoundJar', className: 'vault-sound-jar', innerHTML: '<div class="vault-jar-bottle"><div class="vault-jar-cork"></div><div class="vault-jar-glass"><div class="vault-jar-ember"></div></div></div><div class="vault-sound-bars"><span class="vault-sound-bar"></span><span class="vault-sound-bar"></span><span class="vault-sound-bar"></span></div><span class="vault-sound-label">SOUND</span>' });
      btn.setAttribute('aria-label', 'Toggle background music'); btn.setAttribute('aria-pressed', 'false');
      onBodyReady(() => { if (!document.getElementById('vaultSoundJar')) document.body.appendChild(btn); });
      this.el = btn; this.audio = Object.assign(new Audio('assets/the-vault-ambient.mp3'), { loop: true, volume: 0.45, preload: 'auto' });
      btn.addEventListener('click', () => (this.playing ? this.pause() : this.play()));
      window.addEventListener('scroll', () => { const y = window.scrollY; btn.classList.toggle('is-scrolled-hidden', y > 60 && y > this.lastScrollY + 4); this.lastScrollY = y; }, { passive: true });
    }
    play() { this.audio.play()?.then(() => { this.setPlaying(true); window.__vaultFireflySystem?.emitBurst(); }).catch(() => this.setPlaying(false)); }
    pause() { this.audio.pause(); this.setPlaying(false); }
    setPlaying(on) { this.playing = on; this.el.classList.toggle('is-playing', on); this.el.setAttribute('aria-pressed', String(on)); const l = this.el.querySelector('.vault-sound-label'); if (l) l.textContent = on ? 'MUTE' : 'SOUND'; }
  }

  // 5. Three.js Interactive 3D Item Preview (#vault3dCanvas inside Home View)
  class Vault3DShowcase {
    constructor() { this.rafId = null; this.ready = false; this.autoRotate = true; this.interacting = false; this.initPos = { x: 0, y: 0.15, z: 2.1 }; onBodyReady(() => this.remount()); }
    remount() {
      if (document.getElementById('view-home')?.hidden) { if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; } return; }
      if (this.ready) { this.resize?.(); if (!this.rafId) this.animate(); return; }
      let tries = 0;
      const waitLib = () => {
        const canvas = document.getElementById('vault3dCanvas'), wrap = document.getElementById('closing3dWrap');
        if (!canvas || !wrap) return;
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader) { if (tries++ < 40) setTimeout(waitLib, 60); return; }
        this.ready = true; this.canvas = canvas; this.wrap = wrap; this.clock = new THREE.Clock();
        this.setupScene(); this.loadModel(); this.bindControls(); this.animate();
      };
      waitLib();
    }
    setupScene() {
      const rect = this.wrap.getBoundingClientRect(), w = Math.max(rect.width, 320), h = Math.max(rect.height, 340);
      this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 50);
      this.camera.position.set(this.initPos.x, this.initPos.y, this.initPos.z);
      try { this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true }); this.renderer.setSize(w, h, false); this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); if (THREE.sRGBEncoding) this.renderer.outputEncoding = THREE.sRGBEncoding; } catch { this.renderer = null; }
      this.group = new THREE.Group(); this.scene.add(this.group, new THREE.AmbientLight(0xfff6ec, 1.25));
      const key = new THREE.DirectionalLight(0xffeed2, 1.8), fill = new THREE.DirectionalLight(0xd4bc91, 1.1);
      key.position.set(2.8, 3.8, 2.5); fill.position.set(-2.6, 2.0, -2.0); this.scene.add(key, fill);
      if (THREE.OrbitControls) {
        this.controls = new THREE.OrbitControls(this.camera, this.canvas);
        Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.06, enablePan: false, minDistance: 1.35, maxDistance: 3.6 });
        this.controls.addEventListener('start', () => { this.interacting = true; });
        this.controls.addEventListener('end', () => setTimeout(() => { this.interacting = false; }, 1800));
      }
    }
    loadModel() {
      const overlay = document.getElementById('stageLoadingOverlay'), progress = document.getElementById('stageLoadingProgress');
      const hide = () => { if (overlay) { overlay.classList.add('is-loaded'); overlay.style.display = 'none'; } };
      new THREE.GLTFLoader().load('assets/3d_model_the_vault.glb', gltf => {
        const m = gltf.scene, box = new THREE.Box3().setFromObject(m), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()), s = 1.55 / (Math.max(size.x, size.y, size.z) || 1);
        m.scale.setScalar(s); m.position.set(-center.x * s, -center.y * s, -center.z * s);
        this.group.add(m); this.group.rotation.y = -0.5; if (progress) progress.textContent = '100%'; hide();
      }, xhr => { if (xhr.lengthComputable && progress) progress.textContent = `${Math.round((xhr.loaded / xhr.total) * 100)}%`; }, hide);
      setTimeout(hide, 1200);
    }
    bindControls() {
      this.resize = () => {
        if (!this.wrap || !this.renderer || !this.camera) return;
        const r = this.wrap.getBoundingClientRect(), w = Math.max(r.width, 300), h = Math.max(r.height, 340);
        this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h, false);
      };
      if (window.ResizeObserver) new ResizeObserver(this.resize).observe(this.wrap); else window.addEventListener('resize', this.resize, { passive: true });
      this.resize();
      const toggleBtn = document.getElementById('btnToggleRotate'), label = document.getElementById('rotationStatusLabel');
      toggleBtn?.addEventListener('click', () => { this.autoRotate = !this.autoRotate; toggleBtn.classList.toggle('is-paused', !this.autoRotate); if (label) label.textContent = this.autoRotate ? 'ROTATING (SLOW)' : 'PAUSED (MANUAL)'; });
      document.getElementById('btnResetView')?.addEventListener('click', () => { if (!this.camera || !this.controls) return; this.camera.position.set(this.initPos.x, this.initPos.y, this.initPos.z); this.controls.target.set(0, 0, 0); this.controls.update(); });
      const zoom = d => { if (!this.camera || !this.controls) return; const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize(), dist = this.camera.position.distanceTo(this.controls.target); this.camera.position.copy(this.controls.target).addScaledVector(dir, Math.max(1.35, Math.min(3.6, dist + d))); this.controls.update(); };
      document.getElementById('btnZoomIn')?.addEventListener('click', () => zoom(-0.25));
      document.getElementById('btnZoomOut')?.addEventListener('click', () => zoom(0.25));
    }
    animate() {
      if (document.getElementById('view-home')?.hidden) { this.rafId = null; return; }
      this.rafId = requestAnimationFrame(() => this.animate());
      const elapsed = this.clock ? this.clock.getElapsedTime() : 0;
      if (this.group) { this.group.position.y = Math.sin(elapsed * 1.4) * 0.035; if (this.autoRotate && !this.interacting) this.group.rotation.y += 0.0035; }
      this.controls?.update();
      if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
    }
  }

  const initEffects = () => {
    window.__vaultLoader ||= new VaultLoader(); window.__vaultCursor ||= new VaultCursor();
    window.__vaultFireflySystem ||= new VaultFireflies(); window.__vaultSoundJar ||= new VaultSoundJar();
    window.__vault3DShowcase ||= new Vault3DShowcase();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initEffects); else initEffects();
})();
