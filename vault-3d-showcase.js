// THE VAULT — Interactive 3D Artifact Showcase (Three.js WebGL Stage)
(function () {
  'use strict';

  class Vault3DShowcase {
    constructor() {
      this.canvas = null;
      this.container = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.controls = null;
      this.modelGroup = null;
      this.shadowMesh = null;
      this.placeholderGroup = null;
      this.clock = null;

      this.isAutoRotating = true;
      this.baseRotationSpeed = 0.0035;
      this.userInteracting = false;
      this.lastUserInteractTime = 0;
      this.targetTiltX = 0;
      this.targetTiltY = 0;
      this.currentTiltX = 0;
      this.hasRevealed = false;
      this.isLoaderDismissed = false;

      this.initialCameraPos = { x: 0, y: 0.15, z: 2.1 };
      this.initialTarget = { x: 0, y: 0.02, z: 0 };
      this.init();
    }

    init() {
      let retries = 0;
      const mount = () => {
        this.canvas = document.getElementById('vault3dCanvas');
        this.container = document.getElementById('closing3dWrap');
        if (!this.canvas || !this.container || typeof THREE === 'undefined' || !THREE.GLTFLoader) {
          if (retries++ < 40) setTimeout(mount, 60);
          return;
        }
        this.clock = new THREE.Clock();
        this.setupScene();
        this.setupLights();
        this.setupShadowPlane();
        this.setupControls();
        this.bindEvents();
        this.loadModel();
        this.animate();
        if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
        window.addEventListener('load', mount);
      } else {
        mount();
      }
    }

    setupScene() {
      const rect = this.container.getBoundingClientRect();
      const width = Math.max(rect.width, 320);
      const height = Math.max(rect.height, 360);

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
      this.camera.position.set(this.initialCameraPos.x, this.initialCameraPos.y, this.initialCameraPos.z);
      this.camera.lookAt(this.initialTarget.x, this.initialTarget.y, this.initialTarget.z);

      try {
        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true, // Keeps buffer intact for screenshots
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false
        });
        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        if (THREE.ACESFilmicToneMapping) {
          this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
          this.renderer.toneMappingExposure = 1.18;
        }
        if (THREE.sRGBEncoding) this.renderer.outputEncoding = THREE.sRGBEncoding;
      } catch (err) {
        console.warn('[THE VAULT 3D] WebGL init error:', err);
        this.renderer = null;
        this.dismissLoader();
      }

      this.modelGroup = new THREE.Group();
      this.scene.add(this.modelGroup);
      this.setupPlaceholderArtifact();
    }

    // Instant geometric camera model displayed while the .glb file downloads
    setupPlaceholderArtifact() {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x242621, roughness: 0.45, metalness: 0.65, emissive: 0x161814 });
      const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.28, metalness: 0.85, emissive: 0x3a2c14 });
      const lensMat = new THREE.MeshStandardMaterial({ color: 0x1a1c18, roughness: 0.32, metalness: 0.75, emissive: 0x121410 });

      const add = (geo, mat, pos = [0, 0, 0], rot = [0, 0, 0]) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(...pos);
        m.rotation.set(...rot);
        m.castShadow = m.receiveShadow = true;
        g.add(m);
      };

      add(new THREE.BoxGeometry(0.92, 0.56, 0.44), bodyMat);
      add(new THREE.BoxGeometry(0.93, 0.12, 0.45), brassMat, [0, 0.32, 0]);
      add(new THREE.CylinderGeometry(0.25, 0.27, 0.32, 32), lensMat, [0, 0.02, 0.28], [Math.PI / 2, 0, 0]);
      add(new THREE.TorusGeometry(0.26, 0.016, 16, 32), brassMat, [0, 0.02, 0.44]);
      add(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16), brassMat, [-0.3, 0.41, 0]);
      add(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16), brassMat, [0.32, 0.4, 0]);
      add(new THREE.TorusGeometry(0.88, 0.005, 16, 64), new THREE.MeshBasicMaterial({ color: 0xd4bc91, transparent: true, opacity: 0.55 }), [0, 0, 0], [Math.PI / 3, 0, 0]);

      this.placeholderGroup = g;
      this.modelGroup.add(g);
    }

    // Studio 3-point + bounce lighting
    setupLights() {
      this.scene.add(new THREE.AmbientLight(0xfff6ec, 1.15));
      [
        [0xffeed2, 1.85, [2.8, 3.8, 2.5]],   // Warm key light
        [0xe5eaf0, 0.85, [-2.8, 1.6, -1.8]], // Cool fill light
        [0xd4bc91, 1.4, [0.2, 4.2, -2.6]],   // Golden rim light
        [0xc2a77a, 0.45, [0, -3, 1.5]]       // Soft bounce light
      ].forEach(([color, intensity, pos]) => {
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(...pos);
        this.scene.add(light);
      });
    }

    // Soft radial contact shadow beneath the levitating artifact
    setupShadowPlane() {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 118);
      grad.addColorStop(0, 'rgba(28, 26, 22, 0.45)');
      grad.addColorStop(0.32, 'rgba(42, 38, 30, 0.22)');
      grad.addColorStop(0.65, 'rgba(75, 68, 55, 0.08)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      this.shadowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.2, 2.2),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.82, depthWrite: false })
      );
      this.shadowMesh.rotation.x = -Math.PI / 2;
      this.shadowMesh.position.y = -0.58;
      this.scene.add(this.shadowMesh);
    }

    setupControls() {
      if (!THREE.OrbitControls) return;
      const ctrl = new THREE.OrbitControls(this.camera, this.canvas);
      Object.assign(ctrl, {
        enableDamping: true,
        dampingFactor: 0.055,
        enablePan: false,
        minDistance: 1.35,
        maxDistance: 3.6,
        minPolarAngle: 0.2,
        maxPolarAngle: Math.PI / 2 + 0.12
      });
      ctrl.target.set(this.initialTarget.x, this.initialTarget.y, this.initialTarget.z);

      ctrl.addEventListener('start', () => { this.userInteracting = true; });
      ctrl.addEventListener('end', () => {
        this.lastUserInteractTime = performance.now();
        setTimeout(() => {
          if (performance.now() - this.lastUserInteractTime >= 2300) this.userInteracting = false;
        }, 2400);
      });
      this.controls = ctrl;
    }

    dismissLoader() {
      if (this.isLoaderDismissed) return;
      this.isLoaderDismissed = true;
      const el = document.getElementById('stageLoadingOverlay');
      if (el) { el.classList.add('is-loaded'); el.style.display = 'none'; }
    }

    // Asynchronously load the 3D .glb model, normalize its scale, and center it
    loadModel() {
      const progressBar = document.getElementById('stageLoadingProgress');
      let sim = 16;
      if (progressBar) progressBar.textContent = `${sim}%`;

      const progTimer = setInterval(() => {
        sim = Math.min(96, sim + Math.floor(Math.random() * 22) + 14);
        if (progressBar) progressBar.textContent = `${sim}%`;
      }, 160);

      const safetyTimeout = setTimeout(() => { clearInterval(progTimer); this.dismissLoader(); }, 800);

      new THREE.GLTFLoader().load(
        'assets/3d_model_the_vault.glb',
        (gltf) => {
          clearInterval(progTimer);
          clearTimeout(safetyTimeout);
          if (progressBar) progressBar.textContent = '100%';

          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const scale = 1.55 / (Math.max(size.x, size.y, size.z) || 1);

          model.scale.setScalar(scale);
          model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
          model.traverse(child => {
            if (child.isMesh && child.material) {
              child.castShadow = child.receiveShadow = true;
              if (child.material.isMeshStandardMaterial) {
                child.material.roughness = Math.min(child.material.roughness || 0.6, 0.72);
                child.material.metalness = Math.max(child.material.metalness || 0.2, 0.32);
              }
            }
          });

          if (this.placeholderGroup) {
            this.modelGroup.remove(this.placeholderGroup);
            this.placeholderGroup = null;
          }
          this.modelGroup.add(model);
          this.modelGroup.rotation.y = -0.55;
          this.dismissLoader();
        },
        (xhr) => {
          if (xhr.lengthComputable && progressBar) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            if (pct > sim) { sim = pct; progressBar.textContent = `${pct}%`; }
          }
        },
        (err) => {
          clearInterval(progTimer);
          clearTimeout(safetyTimeout);
          console.warn('[THE VAULT 3D] GLTF fallback:', err);
          this.dismissLoader();
        }
      );
    }

    bindEvents() {
      const resize = () => {
        if (!this.container || !this.renderer || !this.camera) return;
        const rect = this.container.getBoundingClientRect();
        const w = Math.max(rect.width, 300), h = Math.max(rect.height, 340);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h, false);
      };

      if (window.ResizeObserver) new ResizeObserver(resize).observe(this.container);
      else window.addEventListener('resize', resize, { passive: true });
      resize();
      setTimeout(resize, 100);
      setTimeout(resize, 500);

      const cta = document.getElementById('closing-cta');
      if (cta) {
        cta.addEventListener('pointermove', e => {
          const r = cta.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            this.targetTiltX = ((e.clientY - r.top) / r.height - 0.5) * 0.35;
            this.targetTiltY = ((e.clientX - r.left) / r.width - 0.5) * 0.55;
          }
        }, { passive: true });
        cta.addEventListener('pointerleave', () => { this.targetTiltX = this.targetTiltY = 0; }, { passive: true });

        if ('IntersectionObserver' in window) {
          new IntersectionObserver(entries => {
            if (entries.some(e => e.isIntersecting) && !this.hasRevealed) {
              this.hasRevealed = true;
              this.tweenModelRotation(-0.95, 0.05, 1200);
            }
          }, { threshold: 0.15 }).observe(cta);
        }
      }

      // HUD buttons
      const btnToggle = document.getElementById('btnToggleRotate');
      const statusLabel = document.getElementById('rotationStatusLabel');
      btnToggle?.addEventListener('click', e => {
        e.preventDefault();
        this.isAutoRotating = !this.isAutoRotating;
        btnToggle.classList.toggle('is-paused', !this.isAutoRotating);
        if (statusLabel) statusLabel.textContent = this.isAutoRotating ? 'ROTATING (SLOW)' : 'PAUSED (MANUAL)';
      });
      document.getElementById('btnResetView')?.addEventListener('click', e => { e.preventDefault(); this.resetCameraView(); });
      document.getElementById('btnZoomIn')?.addEventListener('click', e => { e.preventDefault(); this.zoomCamera(-0.25); });
      document.getElementById('btnZoomOut')?.addEventListener('click', e => { e.preventDefault(); this.zoomCamera(0.25); });
    }

    zoomCamera(delta) {
      if (!this.camera || !this.controls) return;
      const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
      const dist = this.camera.position.distanceTo(this.controls.target);
      const next = Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, dist + delta));
      this.camera.position.copy(this.controls.target).addScaledVector(dir, next);
      this.controls.update();
    }

    resetCameraView() {
      if (!this.camera || !this.controls) return;
      const sPos = this.camera.position.clone(), sTgt = this.controls.target.clone();
      const ePos = new THREE.Vector3(this.initialCameraPos.x, this.initialCameraPos.y, this.initialCameraPos.z);
      const eTgt = new THREE.Vector3(this.initialTarget.x, this.initialTarget.y, this.initialTarget.z);
      const t0 = performance.now();

      const step = (now) => {
        const p = Math.min(1, (now - t0) / 650);
        const ease = 1 - Math.pow(1 - p, 3);
        this.camera.position.lerpVectors(sPos, ePos, ease);
        this.controls.target.lerpVectors(sTgt, eTgt, ease);
        this.controls.update();
        if (p < 1) requestAnimationFrame(step);
        else this.userInteracting = false;
      };
      requestAnimationFrame(step);
    }

    tweenModelRotation(fromY, toY, duration) {
      if (!this.modelGroup) return;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        this.modelGroup.rotation.y = fromY + (toY - fromY) * (1 - Math.pow(1 - p, 3));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    // 60 FPS render loop: parallax LERP, sine-wave levitation, turntable spin, shadow breathing
    animate() {
      requestAnimationFrame(() => this.animate());
      const t = this.clock ? this.clock.getElapsedTime() : performance.now() * 0.001;
      this.currentTiltX += (this.targetTiltX - this.currentTiltX) * 0.08;

      if (this.modelGroup) {
        const floatY = Math.sin(t * 1.35) * 0.038;
        this.modelGroup.position.y = floatY;
        this.modelGroup.rotation.z = Math.sin(t * 0.85) * 0.012 + this.currentTiltX * 0.3;
        this.modelGroup.rotation.x = this.currentTiltX;
        if (this.isAutoRotating && !this.userInteracting) this.modelGroup.rotation.y += this.baseRotationSpeed;

        if (this.shadowMesh) {
          const s = 1.0 + floatY * 1.8;
          this.shadowMesh.scale.set(s, s, 1);
          this.shadowMesh.material.opacity = 0.82 - floatY * 2.2;
        }
      }

      this.controls?.update();
      if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
    }
  }

  const boot3D = () => {
    if (!window.__vault3DShowcase) window.__vault3DShowcase = new Vault3DShowcase();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot3D);
  else boot3D();
})();
