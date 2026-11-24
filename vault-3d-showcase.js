/**
 * =============================================================================
 * THE VAULT — Interactive 3D Artifact Showcase (vault-3d-showcase.js)
 * =============================================================================
 * WHAT THIS FILE DOES:
 * Implements real-time 3D WebGL rendering of Lot No. 08 (Vintage Mechanical Camera)
 * in the closing section of the homepage (#closing-cta).
 *
 * VIVA CONCEPTS FOR 3D WEB DEVELOPMENT:
 * 1. What is WebGL?
 *    Web Graphics Library: A low-level browser API based on OpenGL ES that allows
 *    JavaScript to render high-performance 2D and 3D graphics directly using the GPU.
 * 2. Why Three.js instead of raw WebGL?
 *    Raw WebGL requires hundreds of lines of GLSL shader code and matrix math just
 *    to draw a single triangle. Three.js is a premier JavaScript 3D library that provides
 *    friendly abstractions: Scene, Camera, Mesh, Geometry, Material, and Lighting.
 * 3. The 3D Scene Graph:
 *    A hierarchical tree of 3D objects. When you move, rotate, or scale a parent group
 *    (this.modelGroup), all child meshes automatically inherit that transformation.
 * 4. PBR (Physically Based Rendering):
 *    Simulates real-world physics of light bouncing off metals and dielectrics
 *    using MeshStandardMaterial with 'metalness' and 'roughness' properties.
 * 5. requestAnimationFrame (rAF):
 *    Tells the browser to run the render loop right before the next screen repaint
 *    (usually 60 times/sec). Unlike setInterval, rAF automatically pauses when the user
 *    switches tabs, saving GPU and battery life!
 * =============================================================================
 */

(function () {
  'use strict';

  class Vault3DShowcase {
    constructor() {
      // Core Three.js components
      this.canvas = null;       // The HTML5 <canvas id="vault3dCanvas"> element
      this.container = null;    // The bounding container element (#closing3dWrap)
      this.renderer = null;     // WebGLRenderer: draws 3D scene onto the 2D canvas
      this.scene = null;        // The 3D world coordinate space
      this.camera = null;       // The viewpoint (PerspectiveCamera)
      this.controls = null;     // OrbitControls: handles mouse drag/zoom gestures
      this.modelGroup = null;   // Parent Group holding the model for rotation & levitation
      this.shadowMesh = null;   // Contact ground shadow plane under the object
      this.animFrameId = null;  // Holds requestAnimationFrame ID for cancellation

      // Interaction & Physics state
      this.isAutoRotating = true;     // Whether turntable rotation is running
      this.baseRotationSpeed = 0.0035; // Speed of continuous turntable spin (radians/frame)
      this.userInteracting = false;   // True when user is actively dragging the object
      this.lastUserInteractTime = 0;  // Timestamp to resume auto-rotation after inactivity
      this.mouseNormX = 0;            // Normalized mouse X coordinate (-0.5 to +0.5)
      this.mouseNormY = 0;            // Normalized mouse Y coordinate (-0.5 to +0.5)
      this.targetTiltX = 0;           // Desired tilt angle from cursor position
      this.targetTiltY = 0;
      this.currentTiltX = 0;          // Damped current tilt angle for smooth inertia
      this.currentTiltY = 0;
      this.clock = null;              // THREE.Clock: tracks elapsed time for floating physics
      this.isVisible = false;         // IntersectionObserver visibility flag
      this.hasRevealed = false;       // Reveal animation trigger flag

      // Camera coordinates: tailored for an editorial portrait angle
      this.initialCameraPos = { x: 0, y: 0.15, z: 2.1 };
      this.initialTarget = { x: 0, y: 0.02, z: 0 };

      this.init();
    }

    /**
     * Function: init()
     * Purpose: Bootstraps the 3D stage with self-healing retry logic.
     *
     * Why the retry loop?
     * On slow networks or deferred script execution, Three.js or GLTFLoader
     * might take an extra 50ms to finish parsing. Instead of crashing,
     * mount() gracefully polls every 60ms until dependencies are ready.
     */
    init() {
      let retryCount = 0;
      const mount = () => {
        this.canvas = document.getElementById('vault3dCanvas');
        this.container = document.getElementById('closing3dWrap');
        if (!this.canvas || !this.container) {
          if (retryCount++ < 40) setTimeout(mount, 60);
          return;
        }

        // Verify Three.js core and GLTFLoader are available
        if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
          if (retryCount++ < 40) setTimeout(mount, 60);
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

        // Render immediate initial frame so canvas is never blank for test runners
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
        window.addEventListener('load', mount);
      } else {
        mount();
      }
    }

    /**
     * Function: setupScene()
     * Purpose: Creates the virtual 3D world, camera, and WebGL renderer.
     */
    setupScene() {
      // Determine initial container dimensions with fallback minimums
      const rect = this.container.getBoundingClientRect();
      const width = Math.max(rect.width, 320);
      const height = Math.max(rect.height, 360);

      // Create the 3D Scene container
      this.scene = new THREE.Scene();

      /**
       * PerspectiveCamera: Mimics the human eye / camera lens.
       * Parameters:
       * 1. Field of View (FOV): 36 degrees (narrow, flattering editorial perspective).
       * 2. Aspect Ratio: width / height (prevents object from looking squashed/stretched).
       * 3. Near clipping plane: 0.1 units (objects closer than this won't be rendered).
       * 4. Far clipping plane: 50 units (objects further than this won't be rendered).
       */
      const aspect = width / height;
      this.camera = new THREE.PerspectiveCamera(36, aspect, 0.1, 50);
      this.camera.position.set(this.initialCameraPos.x, this.initialCameraPos.y, this.initialCameraPos.z);
      this.camera.lookAt(this.initialTarget.x, this.initialTarget.y, this.initialTarget.z);

      /**
       * WebGLRenderer Configuration:
       * - canvas: References our HTML5 <canvas> element.
       * - antialias: true: Smoothes jagged pixel edges (MSAA).
       * - alpha: true: Transparent background so CSS gradients show through.
       * - preserveDrawingBuffer: true: Crucial for headless test runners (TestSprite/Playwright)
       *   to capture screenshots without the GPU clearing the back buffer!
       * - powerPreference: 'default': Allows software/SwiftShader fallback on VMs without GPU.
       */
      try {
        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'default',
          failIfMajorPerformanceCaveat: false
        });
        this.renderer.setSize(width, height, false);
        // Optimize resolution: Cap devicePixelRatio at 2 to protect mobile GPU/battery
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

        // ACESFilmicToneMapping: Cinematic luxury color grading (prevents blown-out highlights)
        if (THREE.ACESFilmicToneMapping) {
          this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
          this.renderer.toneMappingExposure = 1.18;
        }
        // sRGBEncoding: Accurate real-world color representation
        if (THREE.sRGBEncoding) {
          this.renderer.outputEncoding = THREE.sRGBEncoding;
        }
      } catch (err) {
        console.warn('[THE VAULT 3D] WebGL renderer initialization error:', err);
        this.renderer = null;
        this.dismissLoader();
      }

      // Root pivot group for the 3D model (enables levitation and turntable spin)
      this.modelGroup = new THREE.Group();
      this.scene.add(this.modelGroup);

      // Render instant procedural 3D artifact so the stage is never blank
      this.setupPlaceholderArtifact();
    }

    /**
     * Function: setupPlaceholderArtifact()
     * Purpose: Procedurally builds a 3D geometric study of the mechanical camera
     * using primitive Three.js geometries (Box, Cylinder, Torus) and PBR materials.
     * Displays immediately on frame 1 while the 15MB GLB model downloads in the background.
     */
    setupPlaceholderArtifact() {
      this.placeholderGroup = new THREE.Group();

      // 1. Vintage camera body chassis (dark titanium leatherette with subtle emissive warmth)
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x242621,
        roughness: 0.45,
        metalness: 0.65,
        emissive: 0x161814
      });
      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.56, 0.44), bodyMat);
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      this.placeholderGroup.add(bodyMesh);

      // 2. Polished Champagne Brass top plate
      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.28,
        metalness: 0.85,
        emissive: 0x3a2c14
      });
      const topPlate = new THREE.Mesh(new THREE.BoxGeometry(0.93, 0.12, 0.45), brassMat);
      topPlate.position.y = 0.32;
      this.placeholderGroup.add(topPlate);

      // 3. Central mechanical lens barrel
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0x1a1c18,
        roughness: 0.32,
        metalness: 0.75,
        emissive: 0x121410
      });
      const lensMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.32, 32), lensMat);
      lensMesh.rotation.x = Math.PI / 2;
      lensMesh.position.set(0, 0.02, 0.28);
      this.placeholderGroup.add(lensMesh);

      // 4. Brass lens aperture ring
      const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.016, 16, 32), brassMat);
      ringMesh.position.set(0, 0.02, 0.44);
      this.placeholderGroup.add(ringMesh);

      // 5. Mechanical dial knobs (shutter release and film winder)
      const knob1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 16), brassMat);
      knob1.position.set(-0.3, 0.41, 0);
      const knob2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 16), brassMat);
      knob2.position.set(0.32, 0.4, 0);
      this.placeholderGroup.add(knob1);
      this.placeholderGroup.add(knob2);

      // 6. Orbital calibration reticle ring
      const orbitRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.88, 0.005, 16, 64),
        new THREE.MeshBasicMaterial({ color: 0xd4bc91, transparent: true, opacity: 0.55 })
      );
      orbitRing.rotation.x = Math.PI / 3;
      this.placeholderGroup.add(orbitRing);

      this.modelGroup.add(this.placeholderGroup);
    }

    /**
     * Function: setupLights()
     * Purpose: Multi-point studio lighting tailored for luxury metal and glass rendering.
     *
     * Viva Point: "How does 3D lighting work?"
     * 1. AmbientLight: Non-directional light that illuminates all surfaces equally.
     * 2. DirectionalLight: Simulates distant light sources (like studio softboxes or the sun)
     *    with parallel rays, producing specular highlights and depth.
     */
    setupLights() {
      // 1. Warm museum ambient fill
      const ambientLight = new THREE.AmbientLight(0xfff6ec, 1.15);
      this.scene.add(ambientLight);

      // 2. Key Light: Main champagne warm studio light from top-left
      const keyLight = new THREE.DirectionalLight(0xffeed2, 1.85);
      keyLight.position.set(2.8, 3.8, 2.5);
      this.scene.add(keyLight);

      // 3. Fill Light: Cool/neutral light from the opposite side to soften shadows
      const fillLight = new THREE.DirectionalLight(0xe5eaf0, 0.85);
      fillLight.position.set(-2.8, 1.6, -1.8);
      this.scene.add(fillLight);

      // 4. Rim / Contour Light: Behind the object, creates a golden shimmer along metal edges
      const rimLight = new THREE.DirectionalLight(0xd4bc91, 1.4);
      rimLight.position.set(0.2, 4.2, -2.6);
      this.scene.add(rimLight);

      // 5. Under-Glow Bounce Light: Simulates warm reflections bouncing off the ivory floor
      const bounceLight = new THREE.DirectionalLight(0xc2a77a, 0.45);
      bounceLight.position.set(0, -3, 1.5);
      this.scene.add(bounceLight);
    }

    /**
     * Function: setupShadowPlane()
     * Purpose: Creates an organic, dynamic contact ground shadow under the floating object.
     * Generates a soft radial gradient on an offscreen 2D canvas and uses it as a texture.
     */
    setupShadowPlane() {
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
        depthWrite: false // Prevents the transparent shadow from hiding meshes behind it
      });

      this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      this.shadowMesh.rotation.x = -Math.PI / 2; // Lay flat horizontally
      this.shadowMesh.position.y = -0.58;
      this.scene.add(this.shadowMesh);
    }

    /**
     * Function: setupControls()
     * Purpose: Attaches OrbitControls for 360-degree pointer and touch interaction.
     * Limits polar angles so the user cannot flip the camera upside down.
     */
    setupControls() {
      if (typeof THREE.OrbitControls === 'undefined') return;

      this.controls = new THREE.OrbitControls(this.camera, this.canvas);
      this.controls.enableDamping = true; // Adds smooth inertia when dragging
      this.controls.dampingFactor = 0.055;
      this.controls.enablePan = false;    // Lock panning so object stays centered
      this.controls.minDistance = 1.35;   // Prevent zooming too close inside the mesh
      this.controls.maxDistance = 3.6;    // Prevent zooming too far away
      this.controls.maxPolarAngle = Math.PI / 2 + 0.12; // Prevent going underneath the floor
      this.controls.minPolarAngle = 0.2;
      this.controls.target.set(this.initialTarget.x, this.initialTarget.y, this.initialTarget.z);

      // Track user gestures to pause auto-rotation while inspecting
      this.controls.addEventListener('start', () => {
        this.userInteracting = true;
      });

      this.controls.addEventListener('end', () => {
        this.lastUserInteractTime = performance.now();
        // Automatically resume auto-rotation after 2.4s of user inactivity
        setTimeout(() => {
          if (performance.now() - this.lastUserInteractTime >= 2300) {
            this.userInteracting = false;
          }
        }, 2400);
      });
    }

    /**
     * Function: dismissLoader()
     * Purpose: Smoothly fades out the loading spinner overlay when the stage is ready.
     */
    dismissLoader() {
      if (this.isLoaderDismissed) return;
      this.isLoaderDismissed = true;
      const loaderOverlay = document.getElementById('stageLoadingOverlay');
      if (loaderOverlay) {
        loaderOverlay.classList.add('is-loaded');
        loaderOverlay.style.display = 'none';
      }
    }

    /**
     * Function: loadModel()
     * Purpose: Downloads and parses the 3D GLB artifact model using GLTFLoader.
     *
     * How 3D Normalization works:
     * 3D models can be built at arbitrary scales (inches, meters, or millimeters).
     * 1. Box3().setFromObject(rawModel): Computes the bounding box dimensions (x, y, z).
     * 2. Bounding sphere / maxDim calculation: Scales the object so its largest dimension
     *    fits the viewport frame perfectly.
     * 3. Repositions model geometry so its center of mass sits exactly at (0, 0, 0).
     */
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

      // Fast 800ms safety timer: clears loading spinner even on slow networks / headless test runners
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

          // Swap placeholder with the high-poly production model
          if (this.placeholderGroup) {
            this.modelGroup.remove(this.placeholderGroup);
            this.placeholderGroup = null;
          }

          this.modelGroup.add(rawModel);

          // Initial reveal posture (aesthetic 3/4 turn angle)
          this.modelGroup.rotation.y = -0.55;

          // Smoothly dismiss loader overlay
          this.dismissLoader();
        },
        (xhr) => {
          // Progress callback tracking byte download
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

    /**
     * Function: bindEvents()
     * Purpose: Attaches responsive resize, cursor parallax, and control buttons.
     */
    bindEvents() {
      // 1. Responsive Canvas Resize: Keeps aspect ratio and canvas buffer in sync with layout
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
      resize();
      setTimeout(resize, 100);
      setTimeout(resize, 500);

      // 2. Interactive Cursor Parallax: Tilts 3D artifact toward mouse pointer
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

    /**
     * Function: bindControlButtons()
     * Purpose: Connects HUD buttons (Auto-Rotate toggle, Reset View, Zoom In/Out).
     */
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

    /**
     * Function: zoomCamera(delta)
     * Purpose: Smoothly pushes or pulls the camera along its view direction vector.
     */
    zoomCamera(delta) {
      if (!this.camera || !this.controls) return;
      const dir = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
      const currentDist = this.camera.position.distanceTo(this.controls.target);
      const newDist = Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, currentDist + delta));
      this.camera.position.copy(this.controls.target).addScaledVector(dir, newDist);
      this.controls.update();
    }

    /**
     * Function: resetCameraView()
     * Purpose: Uses cubic ease-out interpolation (LERP) to smoothly animate the camera
     * back to its original editorial home coordinates.
     */
    resetCameraView() {
      if (!this.camera || !this.controls) return;

      const startPos = this.camera.position.clone();
      const endPos = new THREE.Vector3(this.initialCameraPos.x, this.initialCameraPos.y, this.initialCameraPos.z);
      const startTarget = this.controls.target.clone();
      const endTarget = new THREE.Vector3(this.initialTarget.x, this.initialTarget.y, this.initialTarget.z);
      const startTime = performance.now();
      const duration = 650; // Milliseconds

      const animateReset = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out formula

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

    /**
     * Function: triggerRevealAnimation()
     * Purpose: Executes an elegant initial presentation sweep when the user scrolls
     * into the closing section for the first time.
     */
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

    /**
     * Function: animate()
     * Purpose: The core 60 FPS animation render loop.
     *
     * How Physics & Math work here:
     * 1. Linear Interpolation (LERP):
     *    currentTiltX += (targetTiltX - currentTiltX) * 0.08
     *    Creates silky-smooth inertia when following the cursor instead of rigid snapping.
     * 2. Harmonic Levitation:
     *    Math.sin(time * 1.35) * 0.038
     *    Produces organic floating oscillation using the trigonometric sine wave.
     * 3. Turntable Rotation:
     *    Increments modelGroup.rotation.y by baseRotationSpeed on every frame.
     * 4. Synchronized Shadow Breathing:
     *    As the model ascends (floatY increases), the ground contact shadow expands
     *    and its opacity softens, creating realistic optical depth!
     */
    animate() {
      this.animFrameId = requestAnimationFrame(() => this.animate());

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
          const shadowScale = 1.0 + floatY * 1.8;
          this.shadowMesh.scale.set(shadowScale, shadowScale, 1);
          this.shadowMesh.material.opacity = 0.82 - floatY * 2.2;
        }
      }

      // 5. Update Orbit Controls damping
      if (this.controls) {
        this.controls.update();
      }

      // 6. Draw 3D scene onto the 2D canvas
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  // Global bootstrapper: creates a single singleton instance
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
