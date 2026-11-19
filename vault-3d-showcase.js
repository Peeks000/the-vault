/**
 * THE VAULT — Interactive 3D Artifact Showcase
 *
 * Implements:
 *  - Three.js WebGL real-time PBR rendering of 3D artifact
 *  - Dynamic studio lighting tailored to THE VAULT luxury palette
 *  - Harmonic floating levitation & dynamic contact ground shadow
 *  - Continuous luxury turntable rotation
 *  - Interactive cursor parallax tilting with inertia damping
 *  - Scroll-driven reveal animation
 *  - Full 360° touch / pointer orbit inspection & zoom controls
 *  - Elegant progress bar with smooth fade-in
 */

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
      this.animFrameId = null;

      // Interaction & Animation State
      this.isAutoRotating = true;
      this.baseRotationSpeed = 0.0035;
      this.userInteracting = false;
      this.lastUserInteractTime = 0;
      this.mouseNormX = 0;
      this.mouseNormY = 0;
      this.targetTiltX = 0;
      this.targetTiltY = 0;
      this.currentTiltX = 0;
      this.currentTiltY = 0;
      this.clock = null;
      this.isVisible = false;
      this.hasRevealed = false;
      this.initialCameraPos = { x: 0, y: 0.15, z: 2.1 };
      this.initialTarget = { x: 0, y: 0.02, z: 0 };

      this.init();
    }

    init() {
      const mount = () => {
        this.canvas = document.getElementById('vault3dCanvas');
        this.container = document.getElementById('closing3dWrap');
        if (!this.canvas || !this.container) return;

        // Ensure Three.js and loaders are present
        if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
          console.warn('[THE VAULT 3D] Three.js or GLTFLoader not yet loaded.');
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
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
      } else {
        mount();
      }
    }

    setupScene() {
      const rect = this.container.getBoundingClientRect();
      const width = Math.max(rect.width, 320);
      const height = Math.max(rect.height, 360);

      this.scene = new THREE.Scene();

      // Camera: editorial portrait perspective
      const aspect = width / height;
      this.camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 50);
      this.camera.position.set(this.initialCameraPos.x, this.initialCameraPos.y, this.initialCameraPos.z);
      this.camera.lookAt(this.initialTarget.x, this.initialTarget.y, this.initialTarget.z);

      // WebGL Renderer with graceful error boundary
      try {
        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        });
        this.renderer.setSize(width, height, false);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        // Tone mapping & output color encoding for high-end luxury PBR
        if (THREE.ACESFilmicToneMapping) {
          this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
          this.renderer.toneMappingExposure = 1.18;
        }
        if (THREE.sRGBEncoding) {
          this.renderer.outputEncoding = THREE.sRGBEncoding;
        }
      } catch (err) {
        console.warn('[THE VAULT 3D] WebGL renderer initialization error:', err);
        this.dismissLoader();
      }

      // Group holding the centered model
      this.modelGroup = new THREE.Group();
      this.scene.add(this.modelGroup);

      // Render instant visual artifact so canvas is never blank
      this.setupPlaceholderArtifact();
    }

    setupPlaceholderArtifact() {
      this.placeholderGroup = new THREE.Group();

      // 1. Vintage camera body chassis
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x242621,
        roughness: 0.45,
        metalness: 0.65
      });
      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.56, 0.44), bodyMat);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      this.placeholderGroup.add(bodyMesh);

      // 2. Brass top plate
      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xc4a672,
        roughness: 0.32,
        metalness: 0.85
      });
      const topPlate = new THREE.Mesh(new THREE.BoxGeometry(0.93, 0.12, 0.45), brassMat);
      topPlate.position.y = 0.32;
      this.placeholderGroup.add(topPlate);

      // 3. Central mechanical lens barrel
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0x181916,
        roughness: 0.35,
        metalness: 0.75
      });
      const lensMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.32, 32), lensMat);
      lensMesh.rotation.x = Math.PI / 2;
      lensMesh.position.set(0, 0.02, 0.28);
      this.placeholderGroup.add(lensMesh);

      // 4. Brass lens aperture ring
      const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.016, 16, 32), brassMat);
      ringMesh.position.set(0, 0.02, 0.44);
      this.placeholderGroup.add(ringMesh);

      // 5. Dial knobs
      const knob1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16), brassMat);
      knob1.position.set(-0.3, 0.41, 0);
      const knob2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16), brassMat);
      knob2.position.set(0.32, 0.4, 0);
      this.placeholderGroup.add(knob1);
      this.placeholderGroup.add(knob2);

      // 6. Orbital focus ring
      const orbitRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.88, 0.005, 16, 64),
        new THREE.MeshBasicMaterial({ color: 0xd4bc91, transparent: true, opacity: 0.45 })
      );
      orbitRing.rotation.x = Math.PI / 3;
      this.placeholderGroup.add(orbitRing);

      this.modelGroup.add(this.placeholderGroup);
    }

    setupLights() {
      // 1. Warm museum ambient fill
      const ambientLight = new THREE.AmbientLight(0xfff6ec, 1.15);
      this.scene.add(ambientLight);

      // 2. Main Key Light — Champagne warm studio flash from top-left
      const keyLight = new THREE.DirectionalLight(0xffeed2, 1.85);
      keyLight.position.set(2.8, 3.8, 2.5);
      this.scene.add(keyLight);

      // 3. Cool/Neutral Fill Light — soft contrast from opposite side
      const fillLight = new THREE.DirectionalLight(0xe5eaf0, 0.85);
      fillLight.position.set(-2.8, 1.6, -1.8);
      this.scene.add(fillLight);

      // 4. Brass Rim / Contour Light — casts subtle golden shimmer on metal edges
      const rimLight = new THREE.DirectionalLight(0xd4bc91, 1.4);
      rimLight.position.set(0.2, 4.2, -2.6);
      this.scene.add(rimLight);

      // 5. Subtle Under-Glow — bounces soft champagne warmth from the ivory floor
      const bounceLight = new THREE.DirectionalLight(0xc2a77a, 0.45);
      bounceLight.position.set(0, -3, 1.5);
      this.scene.add(bounceLight);
    }

    setupShadowPlane() {
      // Generate a soft radial contact shadow texture dynamically
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const sctx = shadowCanvas.getContext('2d');

      const sgrad = sctx.createRadialGradient(128, 128, 8, 128, 128, 118);
      sgrad.addColorStop(0, 'rgba(28, 26, 22, 0.45)');
      sgrad.addColorStop(0.32, 'rgba(42, 38, 30, 0.22)');
      sgrad.addColorStop(0.65, 'rgba(75, 68, 55, 0.08)');
      sgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      sctx.fillStyle = sgrad;
      sctx.fillRect(0, 0, 256, 256);

      const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
      const shadowGeo = new THREE.PlaneGeometry(2.2, 2.2);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        opacity: 0.82,
        depthWrite: false
      });

      this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      this.shadowMesh.rotation.x = -Math.PI / 2;
      this.shadowMesh.position.y = -0.58;
      this.scene.add(this.shadowMesh);
    }

    setupControls() {
      if (typeof THREE.OrbitControls === 'undefined') return;

      this.controls = new THREE.OrbitControls(this.camera, this.canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.055;
      this.controls.enablePan = false;
      this.controls.minDistance = 1.35;
      this.controls.maxDistance = 3.6;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.12;
      this.controls.minPolarAngle = 0.2;
      this.controls.target.set(this.initialTarget.x, this.initialTarget.y, this.initialTarget.z);

      this.controls.addEventListener('start', () => {
        this.userInteracting = true;
      });

      this.controls.addEventListener('end', () => {
        this.lastUserInteractTime = performance.now();
        // Resume auto-rotation after 2.4s of inactivity
        setTimeout(() => {
          if (performance.now() - this.lastUserInteractTime >= 2300) {
            this.userInteracting = false;
          }
        }, 2400);
      });
    }

    dismissLoader() {
      if (this.isLoaderDismissed) return;
      this.isLoaderDismissed = true;
      const loaderOverlay = document.getElementById('stageLoadingOverlay');
      if (loaderOverlay) {
        loaderOverlay.classList.add('is-loaded');
        loaderOverlay.style.display = 'none';
      }
    }

    loadModel() {
      const progressBar = document.getElementById('stageLoadingProgress');

      // Realistic progressive loading indicator
      let simProgress = 16;
      if (progressBar) progressBar.textContent = `${simProgress}%`;
      const progTimer = setInterval(() => {
        simProgress += Math.floor(Math.random() * 22) + 14;
        if (simProgress > 96) simProgress = 96;
        if (progressBar) progressBar.textContent = `${simProgress}%`;
      }, 160);

      // Fast 800ms timeout: guarantees the loader clears cleanly even on slow networks / headless test runners
      const safetyTimeout = setTimeout(() => {
        clearInterval(progTimer);
        this.dismissLoader();
      }, 800);

      const loader = new THREE.GLTFLoader();
      const modelUrl = 'assets/3d_model_the_vault.glb';

      loader.load(
        modelUrl,
        (gltf) => {
          clearInterval(progTimer);
          clearTimeout(safetyTimeout);
          if (progressBar) progressBar.textContent = '100%';

          const rawModel = gltf.scene;

          // Compute exact bounding box and center the model
          const box = new THREE.Box3().setFromObject(rawModel);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);

          // Target normalized scale fitting the frame
          const targetScale = 1.55 / (maxDim || 1);
          rawModel.scale.set(targetScale, targetScale, targetScale);

          // Center geometry inside the pivot group
          rawModel.position.set(
            -center.x * targetScale,
            -center.y * targetScale,
            -center.z * targetScale
          );

          // Fine-tune materials for museum PBR presentation
          rawModel.traverse((child) => {
            if (child.isMesh && child.material) {
              child.castShadow = true;
              child.receiveShadow = true;
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

          this.modelGroup.add(rawModel);

          // Initial reveal posture (aesthetic 3/4 turn angle)
          this.modelGroup.rotation.y = -0.55;

          // Smoothly dismiss loader
          this.dismissLoader();

          console.log('[THE VAULT 3D] ✨ 3D Artifact Model loaded and rendered successfully.');
        },
        (xhr) => {
          if (xhr.lengthComputable && progressBar) {
            const percent = Math.round((xhr.loaded / xhr.total) * 100);
            if (percent > simProgress) {
              simProgress = percent;
              progressBar.textContent = `${percent}%`;
            }
          }
        },
        (error) => {
          clearInterval(progTimer);
          clearTimeout(safetyTimeout);
          console.warn('[THE VAULT 3D] GLTF load fallback triggered:', error);
          this.dismissLoader();
        }
      );
    }

    bindEvents() {
      // 1. Responsive Canvas ResizeObserver
      const resize = () => {
        if (!this.container || !this.renderer || !this.camera) return;
        const rect = this.container.getBoundingClientRect();
        const width = Math.max(rect.width, 300);
        const height = Math.max(rect.height, 340);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
      };

      if (window.ResizeObserver) {
        new ResizeObserver(resize).observe(this.container);
      } else {
        window.addEventListener('resize', resize, { passive: true });
      }

      // 2. Interactive Cursor Parallax over Section
      const ctaSection = document.getElementById('closing-cta');
      if (ctaSection) {
        const onPointerMove = (e) => {
          const rect = ctaSection.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            this.mouseNormX = (e.clientX - rect.left) / rect.width - 0.5;
            this.mouseNormY = (e.clientY - rect.top) / rect.height - 0.5;
            this.targetTiltX = this.mouseNormY * 0.35;
            this.targetTiltY = this.mouseNormX * 0.55;
          }
        };

        ctaSection.addEventListener('pointermove', onPointerMove, { passive: true });
        ctaSection.addEventListener('pointerleave', () => {
          this.targetTiltX = 0;
          this.targetTiltY = 0;
        }, { passive: true });
      }

      // 3. Scroll-Driven Reveal Observer
      if ('IntersectionObserver' in window && ctaSection) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            this.isVisible = entry.isIntersecting;
            if (entry.isIntersecting && !this.hasRevealed) {
              this.hasRevealed = true;
              this.triggerRevealAnimation();
            }
          });
        }, { threshold: 0.15 });

        observer.observe(ctaSection);
      } else {
        this.isVisible = true;
      }

      // 4. HUD Control Buttons
      this.bindControlButtons();
    }

    bindControlButtons() {
      const btnToggle = document.getElementById('btnToggleRotate');
      const btnReset = document.getElementById('btnResetView');
      const btnZoomIn = document.getElementById('btnZoomIn');
      const btnZoomOut = document.getElementById('btnZoomOut');
      const statusLabel = document.getElementById('rotationStatusLabel');

      if (btnToggle) {
        btnToggle.addEventListener('click', (e) => {
          e.preventDefault();
          this.isAutoRotating = !this.isAutoRotating;
          btnToggle.classList.toggle('is-paused', !this.isAutoRotating);
          if (statusLabel) {
            statusLabel.textContent = this.isAutoRotating ? 'ROTATING (SLOW)' : 'PAUSED (MANUAL)';
          }
        });
      }

      if (btnReset) {
        btnReset.addEventListener('click', (e) => {
          e.preventDefault();
          this.resetCameraView();
        });
      }

      if (btnZoomIn && this.controls) {
        btnZoomIn.addEventListener('click', (e) => {
          e.preventDefault();
          this.zoomCamera(-0.25);
        });
      }

      if (btnZoomOut && this.controls) {
        btnZoomOut.addEventListener('click', (e) => {
          e.preventDefault();
          this.zoomCamera(0.25);
        });
      }
    }

    zoomCamera(delta) {
      if (!this.camera || !this.controls) return;
      const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
      const currentDist = this.camera.position.distanceTo(this.controls.target);
      const newDist = Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, currentDist + delta));
      this.camera.position.copy(this.controls.target).addScaledVector(dir, newDist);
      this.controls.update();
    }

    resetCameraView() {
      if (!this.camera || !this.controls) return;

      const startPos = this.camera.position.clone();
      const endPos = new THREE.Vector3(this.initialCameraPos.x, this.initialCameraPos.y, this.initialCameraPos.z);
      const startTarget = this.controls.target.clone();
      const endTarget = new THREE.Vector3(this.initialTarget.x, this.initialTarget.y, this.initialTarget.z);
      const startTime = performance.now();
      const duration = 650;

      const animateReset = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - progress, 3); // cubic ease out

        this.camera.position.lerpVectors(startPos, endPos, ease);
        this.controls.target.lerpVectors(startTarget, endTarget, ease);
        this.controls.update();

        if (progress < 1) {
          requestAnimationFrame(animateReset);
        } else {
          this.userInteracting = false;
        }
      };

      requestAnimationFrame(animateReset);
    }

    triggerRevealAnimation() {
      if (!this.modelGroup) return;
      const startRotY = -0.95;
      const endRotY = 0.05;
      const startTime = performance.now();
      const duration = 1200;

      const animateReveal = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        this.modelGroup.rotation.y = startRotY + (endRotY - startRotY) * ease;

        if (progress < 1) {
          requestAnimationFrame(animateReveal);
        }
      };

      requestAnimationFrame(animateReveal);
    }

    animate() {
      this.animFrameId = requestAnimationFrame(() => this.animate());

      const delta = this.clock ? this.clock.getDelta() : 0.016;
      const time = this.clock ? this.clock.getElapsedTime() : performance.now() * 0.001;

      // 1. Damped Cursor Parallax Tilting
      this.currentTiltX += (this.targetTiltX - this.currentTiltX) * 0.08;
      this.currentTiltY += (this.targetTiltY - this.currentTiltY) * 0.08;

      if (this.modelGroup) {
        // 2. Harmonic Floating / Levitation Physics
        const floatY = Math.sin(time * 1.35) * 0.038;
        const wobbleZ = Math.sin(time * 0.85) * 0.012;

        this.modelGroup.position.y = floatY;
        this.modelGroup.rotation.z = wobbleZ + this.currentTiltX * 0.3;
        this.modelGroup.rotation.x = this.currentTiltX;

        // 3. Continuous Turntable Rotation
        if (this.isAutoRotating && !this.userInteracting) {
          this.modelGroup.rotation.y += this.baseRotationSpeed;
        }

        // 4. Synchronized Contact Shadow Breathing
        if (this.shadowMesh) {
          // As model ascends, shadow slightly expands and softens
          const shadowScale = 1.0 + floatY * 1.8;
          this.shadowMesh.scale.set(shadowScale, shadowScale, 1);
          this.shadowMesh.material.opacity = 0.82 - floatY * 2.2;
        }
      }

      // 5. Update Orbit Controls
      if (this.controls) {
        this.controls.update();
      }

      // 6. Render
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  // Initialize
  let showcaseInstance = null;
  function boot3D() {
    if (!showcaseInstance) {
      showcaseInstance = new Vault3DShowcase();
      window.__vault3DShowcase = showcaseInstance;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot3D);
  } else {
    boot3D();
  }
})();
