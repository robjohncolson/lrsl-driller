/**
 * ghost-maze-renderer.js
 * Three.js scene rendering for the 3D Maze visualization
 *
 * Creates a Tron-esque 3D environment where:
 * - Levels are glowing hexagonal platforms
 * - Progression paths are curved bridges
 * - Ghosts are luminous spheres at their current position
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import {
  parseManifest,
  positionNodes,
  calculateProgress,
  getNodeById,
  findPathToNode,
  getMazeStats
} from './ghost-maze-generator.js';

// Tron color palette
const TRON_COLORS = {
  background: 0x0a0a12,      // Deep blue-black
  grid: 0x112244,            // Subtle grid lines
  gridSecondary: 0x0a1133,   // Fainter grid
  nodeLocked: 0x333344,      // Dark gray
  nodeUnlocked: 0x4488ff,    // Electric blue
  nodeCompleted: 0x00ff88,   // Neon green
  nodeCurrent: 0x00ffff,     // Cyan
  edgeDefault: 0x00ffff,     // Cyan
  edgeGold: 0xffdd00,        // Gold
  ghostWhite: 0xffffff,
  ghostYellow: 0xffff44,
  ghostOrange: 0xff8844,
  ghostRed: 0xff4444,
  ghostIndigo: 0x8844ff
};

// Quality presets
const QUALITY_PRESETS = {
  low: {
    antialias: false,
    nodeSegments: 4,
    edgeSegments: 8,
    particleCount: 100,
    shadowMap: false
  },
  medium: {
    antialias: true,
    nodeSegments: 6,
    edgeSegments: 16,
    particleCount: 300,
    shadowMap: false
  },
  high: {
    antialias: true,
    nodeSegments: 8,
    edgeSegments: 32,
    particleCount: 500,
    shadowMap: true
  }
};

// Ghost animation constants
const GHOST_HEIGHT_OFFSET = 2;           // Height above node platform
const GHOST_BOB_SPEED = 0.003;           // Pulsation speed
const GHOST_BOB_AMPLITUDE = 0.001;       // Minimal vertical movement (nearly static)
const GHOST_PULSE_SCALE = 0.15;          // Scale pulsation amount (0.85 - 1.15)
const GHOST_MOVEMENT_DURATION = 2000;    // Movement animation duration (ms)
const GHOST_CELEBRATION_DURATION = 1500; // Celebration effect duration (ms)
const GHOST_PARTICLE_COUNT = 24;         // Celebration particle count
const GHOST_EDGE_SAG = 1.5;              // Edge curve sag amount

// Phase 5: Multi-ghost landscape constants
const CLUSTER_RADIUS = 1.2;              // Radius for ghost circular arrangement
const VERTICAL_SPACING = 0.4;            // Additional height per row in cluster
const GHOSTS_PER_RING = 6;               // Max ghosts per ring before stacking
const CLASS_VIEW_GHOST_SCALE = 0.625;    // Ghost size in class view (0.5/0.8)
const CLASS_VIEW_OPACITY_FACTOR = 0.8;   // Opacity reduction in class view
const MAX_DISPLAYED_GHOSTS = 50;         // Performance cap for class view

/**
 * MazeRenderer class - orchestrates the 3D maze visualization
 */
export class MazeRenderer {
  /**
   * @param {HTMLElement} container - DOM element to render into
   * @param {Object} manifest - Cartridge manifest
   * @param {Object} playerProgress - Player progress data
   */
  constructor(container, manifest, playerProgress) {
    this.container = container;
    this.manifest = manifest;
    this.playerProgress = playerProgress;

    // Three.js objects (created in init)
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Scene groups
    this.nodeGroup = null;
    this.edgeGroup = null;
    this.ghostGroup = null;

    // Parsed data
    this.nodes = null;
    this.edges = null;
    this.tiers = null;
    this.progressMap = null;

    // State
    this.quality = 'medium';
    this.animationId = null;
    this.isDisposed = false;
    this.ghostMesh = null;
    this.ghostProfile = null;
    this.ghostCurrentNodeId = null;

    // Ghost animation state
    this.ghostAnimation = {
      isAnimating: false,
      startTime: 0,
      duration: GHOST_MOVEMENT_DURATION,
      curve: null,
      fromNodeId: null,
      toNodeId: null,
      baseY: 0  // Base Y position for bobbing during animation
    };

    // Ghost celebration state
    this.ghostCelebration = {
      isActive: false,
      startTime: 0,
      type: null,
      particles: []
    };

    // Phase 5: Class view state
    this.classViewMode = false;
    this.classGhosts = [];           // Array of {profile, mesh, label}
    this.ghostsByNode = new Map();   // Map<nodeId, profile[]>
    this.selectedGhost = null;       // Currently focused ghost username
    this.ghostTooltip = null;        // DOM element for tooltip

    // Event handlers (bound for removal)
    this._onResize = this._handleResize.bind(this);
    this._onClick = this._handleClick.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
  }

  /**
   * Initialize the Three.js scene
   * @returns {Promise<void>}
   */
  async init() {
    // Check for WebGL support
    if (!this._detectWebGL()) {
      console.warn('[MazeRenderer] WebGL not supported, using fallback');
      this._dispatchError(new Error('WebGL not supported'));
      return;
    }

    // Parse manifest into graph
    const result = parseManifest(this.manifest);
    this.nodes = result.nodes;
    this.edges = result.edges;
    this.tiers = result.tiers;

    // Position nodes in 3D space
    positionNodes(this.nodes, this.tiers);

    // Flatten to 2D tower layout (all nodes at z=0, centered on x)
    this._flattenToTower();

    // Calculate progress state
    this.progressMap = calculateProgress(this.nodes, this.playerProgress);

    // Initialize Three.js
    this._initScene();
    this._initCamera();
    this._initRenderer();
    this._initControls();
    this._initLighting();

    // Build scene objects
    this._buildGrid();
    this._buildNodes();
    this._buildEdges();
    this._frameScene();

    // Event listeners
    window.addEventListener('resize', this._onResize);
    this.renderer.domElement.addEventListener('click', this._onClick);
    this.renderer.domElement.addEventListener('mousemove', this._onMouseMove);

    // Start animation loop
    this._animate();

    // Dispatch ready event
    this.container.dispatchEvent(new CustomEvent('maze-ready', { detail: {} }));

    console.log('[MazeRenderer] Initialized', getMazeStats(this.nodes, this.edges, this.tiers));
  }

  /**
   * Detect WebGL support
   * @returns {boolean}
   */
  _detectWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  /**
   * Initialize the Three.js scene
   */
  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(TRON_COLORS.background);
    this.scene.fog = new THREE.FogExp2(TRON_COLORS.background, 0.015);

    // Create groups for organization
    this.nodeGroup = new THREE.Group();
    this.nodeGroup.name = 'nodes';
    this.scene.add(this.nodeGroup);

    this.edgeGroup = new THREE.Group();
    this.edgeGroup.name = 'edges';
    this.scene.add(this.edgeGroup);

    this.ghostGroup = new THREE.Group();
    this.ghostGroup.name = 'ghosts';
    this.scene.add(this.ghostGroup);

  }

  /**
   * Initialize the camera (orthographic for 2D-like view)
   */
  _initCamera() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    // Calculate view size based on number of levels
    const stats = getMazeStats(this.nodes, this.edges, this.tiers);
    const viewHeight = Math.max(40, (stats.maxTier + 1) * 10);
    const viewWidth = viewHeight * aspect;

    // Orthographic camera for 2D-like side view
    this.camera = new THREE.OrthographicCamera(
      -viewWidth / 2,   // left
      viewWidth / 2,    // right
      viewHeight / 2,   // top
      -viewHeight / 2,  // bottom
      0.1,              // near
      500               // far
    );

    // Position camera to look at the tower from the side
    const centerY = (stats.maxTier * 8) / 2;
    this.camera.position.set(50, centerY, 0);
    this.camera.lookAt(0, centerY, 0);

    // Reduce fog for clearer 2D view
    if (this.scene && this.scene.fog) {
      this.scene.fog.density = 0.005;
    }
  }

  /**
   * Initialize the WebGL renderer
   */
  _initRenderer() {
    const preset = QUALITY_PRESETS[this.quality];

    this.renderer = new THREE.WebGLRenderer({
      antialias: preset.antialias,
      alpha: true
    });

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Clear any existing canvas
    const existingCanvas = this.container.querySelector('canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    this.container.appendChild(this.renderer.domElement);

  }

  /**
   * Initialize OrbitControls (locked for 2D-like view)
   */
  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lock rotation for 2D-like view
    this.controls.enableRotate = false;

    // Allow zoom and vertical pan only
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;

    // Zoom limits for orthographic
    this.controls.minZoom = 0.5;
    this.controls.maxZoom = 3;
  }

  /**
   * Flatten node positions to a 2D tower layout
   * All nodes at z=0, stacked vertically by tier
   */
  _flattenToTower() {
    if (!this.nodes) return;

    for (const node of this.nodes.values()) {
      if (node.position) {
        // Keep Y (vertical tier position), flatten X and Z
        node.position.x = 0;
        node.position.z = 0;
      }
    }

    console.log('[MazeRenderer] Flattened to 2D tower layout');
  }

  /**
   * Initialize scene lighting
   */
  _initLighting() {
    // Ambient light (dim)
    const ambient = new THREE.AmbientLight(0x222244, 0.9);
    this.scene.add(ambient);

    // Overhead spot for depth
    const spotLight = new THREE.SpotLight(0x66aaff, 0.8);
    spotLight.position.set(0, 100, 0);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    this.scene.add(spotLight);

    // Hemisphere light for color variation
    const hemi = new THREE.HemisphereLight(0x66aaff, 0x112244, 0.6);
    this.scene.add(hemi);

  }

  /**
   * Build background elements for 2D tower view
   */
  _buildGrid() {
    // Skip grid for cleaner 2D tower look
    // The node platforms and edges provide enough visual structure
  }

  /**
   * Build node meshes (platforms)
   */
  _buildNodes() {
    const preset = QUALITY_PRESETS[this.quality];
    let firstNodePosition = null;

    for (const node of this.nodes.values()) {
      const progress = this.progressMap.get(node.id) || {
        unlocked: false,
        completed: false,
        current: false
      };

      const nodeMesh = this._createNodeMesh(node, progress, preset);
      this.nodeGroup.add(nodeMesh);

      if (!firstNodePosition && node.position) {
        firstNodePosition = { x: node.position.x, y: node.position.y, z: node.position.z };
      }
    }

    let cameraToFirstNode = null;
    if (firstNodePosition && this.camera && this.scene?.fog?.density != null) {
      const dx = this.camera.position.x - firstNodePosition.x;
      const dy = this.camera.position.y - firstNodePosition.y;
      const dz = this.camera.position.z - firstNodePosition.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const density = this.scene.fog.density;
      const fogVisibility = Math.exp(-(density * density) * (distance * distance));
      cameraToFirstNode = { distance, density, fogVisibility };
    }

    let nodeBounds = null;
    let frustumIntersects = null;
    if (this.nodeGroup && this.camera) {
      const bounds = new THREE.Box3().setFromObject(this.nodeGroup);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bounds.getSize(size);
      bounds.getCenter(center);
      this.camera.updateMatrixWorld();
      this.camera.updateProjectionMatrix();
      const frustum = new THREE.Frustum();
      const projView = new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projView);
      frustumIntersects = frustum.intersectsBox(bounds);
      nodeBounds = {
        min: { x: bounds.min.x, y: bounds.min.y, z: bounds.min.z },
        max: { x: bounds.max.x, y: bounds.max.y, z: bounds.max.z },
        size: { x: size.x, y: size.y, z: size.z },
        center: { x: center.x, y: center.y, z: center.z }
      };
    }

  }

  /**
   * Create a single node mesh
   * @param {Object} node - Node data
   * @param {Object} progress - Progress state
   * @param {Object} preset - Quality preset
   * @returns {THREE.Group}
   */
  _createNodeMesh(node, progress, preset) {
    const group = new THREE.Group();

    // Determine visual state
    let color, emissive, emissiveIntensity;

    if (progress.current) {
      color = TRON_COLORS.nodeCurrent;
      emissive = TRON_COLORS.nodeCurrent;
      emissiveIntensity = 0.6;
    } else if (progress.completed) {
      color = TRON_COLORS.nodeCompleted;
      emissive = TRON_COLORS.nodeCompleted;
      emissiveIntensity = 0.4;
    } else if (progress.unlocked) {
      color = TRON_COLORS.nodeUnlocked;
      emissive = TRON_COLORS.nodeUnlocked;
      emissiveIntensity = 0.3;
    } else {
      color = TRON_COLORS.nodeLocked;
      emissive = TRON_COLORS.nodeLocked;
      emissiveIntensity = 0.1;
    }

    // Hexagonal platform
    const geometry = new THREE.CylinderGeometry(3, 3, 0.7, preset.nodeSegments);
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity,
      metalness: 0.8,
      roughness: 0.2
    });

    const platform = new THREE.Mesh(geometry, material);
    group.add(platform);

    // Edge glow ring
    const ringGeometry = new THREE.TorusGeometry(3.2, 0.12, 6, preset.nodeSegments);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: emissive,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.25;
    group.add(ring);

    // Text label
    const label = this._createTextSprite(this._truncateName(node.name, 20));
    label.position.y = 1.5;
    group.add(label);

    // Position the group
    if (node.position) {
      group.position.set(node.position.x, node.position.y, node.position.z);
    }

    // Store metadata for picking
    group.userData = {
      type: 'node',
      nodeId: node.id,
      nodeName: node.name
    };

    return group;
  }

  /**
   * Create a text sprite for labels
   * @param {string} text - Label text
   * @returns {THREE.Sprite}
   */
  _createTextSprite(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 256;
    canvas.height = 64;

    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.font = 'Bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#ffffff';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(4, 1, 1);

    return sprite;
  }

  /**
   * Truncate node name for display
   * @param {string} name - Full name
   * @param {number} maxLength - Maximum length
   * @returns {string}
   */
  _truncateName(name, maxLength) {
    if (!name) return '';
    // Extract just the level identifier if too long
    const colonIndex = name.indexOf(':');
    if (colonIndex > 0 && name.length > maxLength) {
      return name.substring(0, colonIndex);
    }
    return name.length > maxLength ? name.substring(0, maxLength - 3) + '...' : name;
  }

  /**
   * Build edge meshes (bridges)
   */
  _buildEdges() {
    const preset = QUALITY_PRESETS[this.quality];
    let skippedEdges = 0;

    for (const edge of this.edges) {
      const fromNode = this.nodes.get(edge.from);
      const toNode = this.nodes.get(edge.to);

      if (!fromNode || !toNode || !fromNode.position || !toNode.position) {
        skippedEdges += 1;
        continue;
      }

      const edgeMesh = this._createEdgeMesh(fromNode, toNode, edge, preset);
      this.edgeGroup.add(edgeMesh);
    }

  }

  /**
   * Frame the scene to ensure geometry is visible.
   */
  _frameScene() {
    if (!this.nodeGroup || !this.camera) return;

    const bounds = new THREE.Box3().setFromObject(this.nodeGroup);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    // For orthographic camera - fit content with generous padding
    const padding = 15;
    const viewHeight = Math.max(size.y + padding * 2, 50);
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const viewWidth = viewHeight * aspect;

    this.camera.left = -viewWidth / 2;
    this.camera.right = viewWidth / 2;
    this.camera.top = viewHeight / 2;
    this.camera.bottom = -viewHeight / 2;

    // Offset the view so bottom of tower is near bottom of screen
    const verticalOffset = -padding / 2;
    this.camera.top += verticalOffset;
    this.camera.bottom += verticalOffset;

    this.camera.updateProjectionMatrix();

    // Position camera to look at center from the side (positive X looking toward origin)
    this.camera.position.set(80, center.y, 0);
    this.camera.lookAt(0, center.y, 0);

    // Update controls target
    if (this.controls) {
      this.controls.target.set(0, center.y, 0);
    }

    // Disable fog for clearer 2D view
    if (this.scene && this.scene.fog) {
      this.scene.fog.density = 0;
    }

    console.log('[MazeRenderer] Framed scene - center:', center.y.toFixed(1), 'height:', viewHeight.toFixed(1));
  }

  /**
   * Create a single edge mesh
   * @param {Object} fromNode - Source node
   * @param {Object} toNode - Target node
   * @param {Object} edge - Edge data
   * @param {Object} preset - Quality preset
   * @returns {THREE.Mesh}
   */
  _createEdgeMesh(fromNode, toNode, edge, preset) {
    const fromPos = new THREE.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z);
    const toPos = new THREE.Vector3(toNode.position.x, toNode.position.y, toNode.position.z);

    // Midpoint with sag for catenary effect
    const mid = fromPos.clone().lerp(toPos, 0.5);
    mid.y -= 1.5;

    // Create curve
    const curve = new THREE.QuadraticBezierCurve3(fromPos, mid, toPos);

    // Tube geometry along curve
    const tubeGeometry = new THREE.TubeGeometry(curve, preset.edgeSegments, 0.14, 6, false);

    // Material with glow
    const color = edge.goldRequired ? TRON_COLORS.edgeGold : TRON_COLORS.edgeDefault;
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6
    });

    const tube = new THREE.Mesh(tubeGeometry, material);
    tube.userData = {
      type: 'edge',
      from: edge.from,
      to: edge.to
    };

    return tube;
  }

  /**
   * Animation loop
   */
  _animate() {
    if (this.isDisposed) return;

    this.animationId = requestAnimationFrame(() => this._animate());

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Animate edges (pulse effect)
    this._animateEdges();

    // Animate ghost (bob effect)
    this._animateGhost();

    // Render
    this.renderer.render(this.scene, this.camera);

  }

  /**
   * Animate edge pulse
   */
  _animateEdges() {
    if (!this.edgeGroup) return;

    const time = performance.now() * 0.001;

    this.edgeGroup.children.forEach((edge, index) => {
      const offset = time + index * 0.2;
      edge.material.opacity = 0.4 + Math.sin(offset * 2) * 0.2;
    });
  }

  /**
   * Animate ghost (pulsation, movement, celebration)
   */
  _animateGhost() {
    if (!this.ghostMesh) return;

    const now = performance.now();

    // Handle movement animation
    if (this.ghostAnimation.isAnimating) {
      this._updateGhostMovement(now);
    } else {
      // Apply idle pulsation when not moving
      const time = now * GHOST_BOB_SPEED;

      // Minimal vertical movement
      const baseY = this.ghostAnimation.baseY || this.ghostMesh.position.y;
      this.ghostMesh.position.y = baseY + Math.sin(time) * GHOST_BOB_AMPLITUDE * 100;

      // Scale pulsation (breathing effect)
      const scale = 1 + Math.sin(time * 1.5) * GHOST_PULSE_SCALE;
      this.ghostMesh.scale.setScalar(scale);
    }

    // Handle celebration animation
    if (this.ghostCelebration.isActive) {
      this._updateGhostCelebration(now);
    }
  }

  /**
   * Update ghost movement along bezier curve
   * @param {number} now - Current timestamp
   */
  _updateGhostMovement(now) {
    const { startTime, duration, curve } = this.ghostAnimation;
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-in-out cubic easing
    const eased = this._easeInOutCubic(progress);

    // Get position along curve
    if (curve) {
      const point = curve.getPoint(eased);
      this.ghostMesh.position.set(point.x, point.y + GHOST_HEIGHT_OFFSET, point.z);
      this.ghostAnimation.baseY = point.y + GHOST_HEIGHT_OFFSET;
    }

    // Check if animation complete
    if (progress >= 1) {
      this.ghostAnimation.isAnimating = false;
      this.ghostCurrentNodeId = this.ghostAnimation.toNodeId;

      // Snap to final position
      const toNode = this.nodes.get(this.ghostAnimation.toNodeId);
      if (toNode && toNode.position) {
        this.ghostMesh.position.set(
          toNode.position.x,
          toNode.position.y + GHOST_HEIGHT_OFFSET,
          toNode.position.z
        );
        this.ghostAnimation.baseY = toNode.position.y + GHOST_HEIGHT_OFFSET;
      }

      console.log(`[MazeRenderer] Ghost arrived at node: ${this.ghostAnimation.toNodeId}`);
    }
  }

  /**
   * Update ghost celebration effects
   * @param {number} now - Current timestamp
   */
  _updateGhostCelebration(now) {
    const { startTime, particles } = this.ghostCelebration;
    const elapsed = now - startTime;
    const progress = elapsed / GHOST_CELEBRATION_DURATION;

    if (progress >= 1) {
      // Clean up celebration
      this._cleanupCelebrationParticles();
      this.ghostCelebration.isActive = false;
      return;
    }

    // Update glow pulse on ghost core
    if (this.ghostMesh && this.ghostMesh.children[0]) {
      const core = this.ghostMesh.children[0];
      const pulseIntensity = 0.5 + Math.sin(elapsed * 0.02) * 0.3;
      if (core.material) {
        core.material.opacity = Math.min(1, (this.ghostProfile?.opacity || 0.5) + pulseIntensity * 0.3);
      }
    }

    // Update particle positions (expand outward and fade)
    particles.forEach((particle, index) => {
      if (particle && particle.userData) {
        const velocity = particle.userData.velocity;
        const fadeProgress = progress;

        // Move outward
        particle.position.x += velocity.x * 0.016; // ~60fps
        particle.position.y += velocity.y * 0.016;
        particle.position.z += velocity.z * 0.016;

        // Fade out
        if (particle.material) {
          particle.material.opacity = (1 - fadeProgress) * 0.8;
        }
      }
    });
  }

  /**
   * Clean up celebration particles from scene
   */
  _cleanupCelebrationParticles() {
    const { particles } = this.ghostCelebration;
    particles.forEach(particle => {
      if (particle) {
        this.ghostGroup.remove(particle);
        this._disposeMesh(particle);
      }
    });
    this.ghostCelebration.particles = [];

    // Reset ghost opacity
    if (this.ghostMesh && this.ghostMesh.children[0] && this.ghostProfile) {
      this.ghostMesh.children[0].material.opacity = this.ghostProfile.opacity || 0.5;
    }
  }

  /**
   * Ease-in-out cubic function
   * @param {number} t - Progress 0-1
   * @returns {number}
   */
  _easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Handle window resize
   */
  _handleResize() {
    if (!this.camera || !this.renderer || !this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    // Update orthographic camera bounds
    const viewHeight = this.camera.top - this.camera.bottom;
    const viewWidth = viewHeight * aspect;
    this.camera.left = -viewWidth / 2;
    this.camera.right = viewWidth / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * Handle click events for node selection
   * @param {MouseEvent} event
   */
  _handleClick(event) {
    if (!this.camera || !this.nodeGroup) return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const rect = this.renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, this.camera);

    // Check node intersections
    const intersects = raycaster.intersectObjects(this.nodeGroup.children, true);

    if (intersects.length > 0) {
      // Find the parent group with nodeId
      let object = intersects[0].object;
      while (object && !object.userData.nodeId) {
        object = object.parent;
      }

      if (object && object.userData.nodeId) {
        this.container.dispatchEvent(new CustomEvent('maze-node-selected', {
          detail: { nodeId: object.userData.nodeId }
        }));

        this.focusOnNode(object.userData.nodeId);
      }
    }
  }

  /**
   * Render the scene (force single frame)
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Focus camera on a specific node
   * @param {string} nodeId - Node to focus on
   * @param {number} duration - Animation duration in ms
   */
  focusOnNode(nodeId, duration = 1000) {
    const node = this.nodes.get(nodeId);
    if (!node || !node.position) return;

    const targetPosition = new THREE.Vector3(node.position.x, node.position.y, node.position.z);
    const cameraOffset = new THREE.Vector3(10, 8, 10);
    const targetCameraPos = targetPosition.clone().add(cameraOffset);

    if (!this.controls) {
      // No controls, just set position
      this.camera.position.copy(targetCameraPos);
      this.camera.lookAt(targetPosition);
      return;
    }

    // Animate camera
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();

    const animateCamera = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this._easeOutCubic(progress);

      this.camera.position.lerpVectors(startPos, targetCameraPos, eased);
      this.controls.target.lerpVectors(startTarget, targetPosition, eased);

      if (progress < 1 && !this.isDisposed) {
        requestAnimationFrame(animateCamera);
      }
    };

    animateCamera();
  }

  /**
   * Cubic ease-out function
   * @param {number} t - Progress 0-1
   * @returns {number}
   */
  _easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Update ghost visualization
   * @param {Object} ghostProfile - Ghost profile data
   */
  updateGhost(ghostProfile) {
    if (!ghostProfile || !this.ghostGroup) return;

    // Store profile for reference
    this.ghostProfile = ghostProfile;

    // Remove existing ghost
    if (this.ghostMesh) {
      this.ghostGroup.remove(this.ghostMesh);
      this._disposeMesh(this.ghostMesh);
    }

    // Create new ghost mesh
    this.ghostMesh = this._createGhostMesh(ghostProfile);
    this.ghostGroup.add(this.ghostMesh);

    // Position at current level
    const currentNodeId = ghostProfile.currentLevel;
    this.ghostCurrentNodeId = currentNodeId;
    const currentNode = this.nodes.get(currentNodeId);

    if (currentNode && currentNode.position) {
      this.ghostMesh.position.set(
        currentNode.position.x,
        currentNode.position.y + GHOST_HEIGHT_OFFSET,
        currentNode.position.z
      );
      this.ghostAnimation.baseY = currentNode.position.y + GHOST_HEIGHT_OFFSET;
    }

    console.log(`[MazeRenderer] Ghost updated: ${ghostProfile.color} (${(ghostProfile.opacity * 100).toFixed(0)}% opacity) at ${currentNodeId || 'unknown'}`);
  }

  /**
   * Animate ghost movement to a new node
   * @param {string} toNodeId - Target node ID
   * @param {string} fromNodeId - Source node ID (optional, uses current if omitted)
   * @param {number} duration - Animation duration in ms (default: 2000)
   * @returns {Promise<void>} Resolves when animation completes
   */
  animateGhostTo(toNodeId, fromNodeId = null, duration = GHOST_MOVEMENT_DURATION) {
    return new Promise((resolve) => {
      if (!this.ghostMesh || !this.nodes) {
        console.warn('[MazeRenderer] Cannot animate ghost - not initialized');
        resolve();
        return;
      }

      // Use current position if no fromNodeId specified
      const actualFromId = fromNodeId || this.ghostCurrentNodeId;
      const fromNode = actualFromId ? this.nodes.get(actualFromId) : null;
      const toNode = this.nodes.get(toNodeId);

      if (!toNode || !toNode.position) {
        console.warn(`[MazeRenderer] Target node not found: ${toNodeId}`);
        resolve();
        return;
      }

      // If no valid from position, just teleport
      if (!fromNode || !fromNode.position) {
        this.ghostMesh.position.set(
          toNode.position.x,
          toNode.position.y + GHOST_HEIGHT_OFFSET,
          toNode.position.z
        );
        this.ghostCurrentNodeId = toNodeId;
        this.ghostAnimation.baseY = toNode.position.y + GHOST_HEIGHT_OFFSET;
        console.log(`[MazeRenderer] Ghost teleported to: ${toNodeId}`);
        resolve();
        return;
      }

      // Create bezier curve for movement path (matches edge geometry)
      const fromPos = new THREE.Vector3(
        fromNode.position.x,
        fromNode.position.y,
        fromNode.position.z
      );
      const toPos = new THREE.Vector3(
        toNode.position.x,
        toNode.position.y,
        toNode.position.z
      );

      // Calculate midpoint with sag (catenary effect matching bridges)
      const mid = fromPos.clone().lerp(toPos, 0.5);
      mid.y -= GHOST_EDGE_SAG;

      // Create quadratic bezier curve
      const curve = new THREE.QuadraticBezierCurve3(fromPos, mid, toPos);

      // Set up animation state
      this.ghostAnimation = {
        isAnimating: true,
        startTime: performance.now(),
        duration,
        curve,
        fromNodeId: actualFromId,
        toNodeId,
        baseY: fromNode.position.y + GHOST_HEIGHT_OFFSET
      };

      console.log(`[MazeRenderer] Ghost moving: ${actualFromId} -> ${toNodeId}`);

      // Resolve when animation completes
      const checkComplete = () => {
        if (!this.ghostAnimation.isAnimating) {
          resolve();
        } else if (!this.isDisposed) {
          requestAnimationFrame(checkComplete);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(checkComplete);
    });
  }

  /**
   * Trigger celebration animation on ghost
   * @param {string} type - 'gold' | 'silver' | 'bronze' | 'tin'
   */
  celebrateGhost(type = 'gold') {
    if (!this.ghostMesh || !this.ghostGroup) {
      console.warn('[MazeRenderer] Cannot celebrate - ghost not initialized');
      return;
    }

    // Clean up any existing celebration
    if (this.ghostCelebration.isActive) {
      this._cleanupCelebrationParticles();
    }

    // Get ghost color for particles
    const colorKey = `ghost${this._capitalize(this.ghostProfile?.color || 'white')}`;
    const particleColor = TRON_COLORS[colorKey] || TRON_COLORS.ghostWhite;

    // Create celebration particles
    const particles = [];
    const ghostPos = this.ghostMesh.position.clone();

    for (let i = 0; i < GHOST_PARTICLE_COUNT; i++) {
      // Create small sphere particle
      const geometry = new THREE.SphereGeometry(0.15, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: type === 'gold' ? 0xffdd00 : particleColor,
        transparent: true,
        opacity: 0.8
      });
      const particle = new THREE.Mesh(geometry, material);

      // Position at ghost center
      particle.position.copy(ghostPos);

      // Calculate radial velocity
      const angle = (i / GHOST_PARTICLE_COUNT) * Math.PI * 2;
      const elevationAngle = (Math.random() - 0.5) * Math.PI * 0.5;
      const speed = 2 + Math.random() * 2;

      particle.userData = {
        velocity: {
          x: Math.cos(angle) * Math.cos(elevationAngle) * speed,
          y: Math.sin(elevationAngle) * speed + 1, // Slight upward bias
          z: Math.sin(angle) * Math.cos(elevationAngle) * speed
        }
      };

      particles.push(particle);
      this.ghostGroup.add(particle);
    }

    // Set celebration state
    this.ghostCelebration = {
      isActive: true,
      startTime: performance.now(),
      type,
      particles
    };

    console.log(`[MazeRenderer] Ghost celebrating: ${type} star!`);
  }

  /**
   * Get current ghost position
   * @returns {{x: number, y: number, z: number} | null}
   */
  getGhostPosition() {
    if (!this.ghostMesh) return null;

    return {
      x: this.ghostMesh.position.x,
      y: this.ghostMesh.position.y,
      z: this.ghostMesh.position.z
    };
  }

  /**
   * Get the current node ID where the ghost is located
   * @returns {string | null}
   */
  getGhostNodeId() {
    return this.ghostCurrentNodeId;
  }

  /**
   * Check if ghost is currently animating
   * @returns {boolean}
   */
  isGhostAnimating() {
    return this.ghostAnimation.isAnimating;
  }

  /**
   * Create ghost mesh
   * @param {Object} profile - Ghost profile
   * @returns {THREE.Group}
   */
  _createGhostMesh(profile) {
    const group = new THREE.Group();

    // Get color from profile
    const colorKey = `ghost${this._capitalize(profile.color || 'white')}`;
    const color = TRON_COLORS[colorKey] || TRON_COLORS.ghostWhite;
    const opacity = profile.opacity || 0.5;

    // Core sphere
    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity
    });
    const core = new THREE.Mesh(geometry, material);
    group.add(core);

    // Outer glow
    const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: opacity * 0.3,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    group.userData = {
      type: 'ghost',
      username: profile.username
    };

    return group;
  }

  /**
   * Capitalize first letter
   * @param {string} str
   * @returns {string}
   */
  _capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Show all ghosts for leaderboard/class view (Phase 5 enhanced)
   * @param {Array} ghostProfiles - Array of ghost profiles
   * @param {Object} options - Display options
   * @param {boolean} options.showLabels - Show username labels (default: true)
   * @param {boolean} options.heatmap - Show node heat map glow (default: true)
   */
  showAllGhosts(ghostProfiles, options = {}) {
    if (!ghostProfiles || !this.ghostGroup) return;

    const { showLabels = true, heatmap = true } = options;

    // Clear existing ghosts
    this._clearClassGhosts();

    // Limit ghost count for performance
    const displayedProfiles = ghostProfiles.slice(0, MAX_DISPLAYED_GHOSTS);

    // Group ghosts by their current level/node
    this.ghostsByNode = new Map();
    for (const profile of displayedProfiles) {
      const nodeId = profile.currentLevel || this._getFirstNodeId();
      if (!this.ghostsByNode.has(nodeId)) {
        this.ghostsByNode.set(nodeId, []);
      }
      this.ghostsByNode.get(nodeId).push(profile);
    }

    // Create ghost meshes with clustering
    for (const [nodeId, profiles] of this.ghostsByNode) {
      const node = this.nodes.get(nodeId);
      if (!node || !node.position) continue;

      // Calculate clustered positions
      const positions = calculateClusterPositions(profiles, node.position);

      profiles.forEach((profile, index) => {
        const ghost = this._createClassViewGhostMesh(profile);
        ghost.position.set(positions[index].x, positions[index].y, positions[index].z);
        this.ghostGroup.add(ghost);

        // Create label if enabled
        let label = null;
        if (showLabels) {
          label = this._createGhostLabel(profile.username);
          label.position.set(positions[index].x, positions[index].y + 1.2, positions[index].z);
          this.ghostGroup.add(label);
        }

        this.classGhosts.push({ profile, mesh: ghost, label });
      });
    }

    // Update node glow for heat map effect
    if (heatmap) {
      this.updateNodeGlow(this.ghostsByNode);
    }

    this.ghostMesh = null; // No single ghost tracked
    this.classViewMode = true;

    console.log(`[MazeRenderer] Class view: showing ${displayedProfiles.length} ghosts`);
  }

  /**
   * Clear all class view ghosts and labels
   * @private
   */
  _clearClassGhosts() {
    // Clear existing ghosts from group
    while (this.ghostGroup.children.length > 0) {
      const child = this.ghostGroup.children[0];
      this.ghostGroup.remove(child);
      this._disposeMesh(child);
    }

    // Clear tracking arrays
    this.classGhosts = [];
    this.ghostsByNode.clear();
  }

  /**
   * Create a ghost mesh scaled for class view
   * @param {Object} profile - Ghost profile
   * @returns {THREE.Group}
   * @private
   */
  _createClassViewGhostMesh(profile) {
    const group = new THREE.Group();

    // Get color from profile
    const colorKey = `ghost${this._capitalize(profile.color || 'white')}`;
    const color = TRON_COLORS[colorKey] || TRON_COLORS.ghostWhite;
    const opacity = (profile.opacity || 0.5) * CLASS_VIEW_OPACITY_FACTOR;

    // Core sphere (scaled down)
    const coreRadius = 0.8 * CLASS_VIEW_GHOST_SCALE;
    const geometry = new THREE.SphereGeometry(coreRadius, 24, 24);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity
    });
    const core = new THREE.Mesh(geometry, material);
    group.add(core);

    // Outer glow (scaled down)
    const glowRadius = 1.2 * CLASS_VIEW_GHOST_SCALE;
    const glowGeometry = new THREE.SphereGeometry(glowRadius, 24, 24);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: opacity * 0.3,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    group.userData = {
      type: 'ghost',
      username: profile.username,
      profile: profile
    };

    return group;
  }

  /**
   * Create a text label for ghost username
   * @param {string} username - Username to display
   * @returns {THREE.Sprite}
   * @private
   */
  _createGhostLabel(username) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = 128;
    canvas.height = 32;

    // Semi-transparent background
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.roundRect(0, 0, canvas.width, canvas.height, 4);
    context.fill();

    // Text
    context.font = 'Bold 14px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#ffffff';
    context.fillText(this._truncateName(username, 12), canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(2, 0.5, 1);
    sprite.userData = { type: 'label', username };

    return sprite;
  }

  /**
   * Update node glow intensity based on ghost clustering
   * @param {Map} ghostsByNode - Map of nodeId to ghost array
   */
  updateNodeGlow(ghostsByNode) {
    if (!this.nodeGroup) return;

    this.nodeGroup.children.forEach(nodeGroup => {
      const nodeId = nodeGroup.userData?.nodeId;
      if (!nodeId) return;

      const ghostCount = ghostsByNode.get(nodeId)?.length || 0;
      const intensity = calculateNodeGlowIntensity(ghostCount);

      // Update ring material intensity
      nodeGroup.traverse(child => {
        if (child.material && child.userData?.type !== 'label') {
          if (child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = (child.material._baseEmissiveIntensity || 0.3) * intensity;
          }
          if (child.material.opacity !== undefined && child.geometry?.type === 'TorusGeometry') {
            child.material.opacity = Math.min(0.8 * intensity, 1.0);
          }
        }
      });
    });
  }

  /**
   * Focus camera on a specific ghost
   * @param {string} username - Username of ghost to focus on
   * @param {number} duration - Animation duration in ms (default: 1000)
   * @returns {Object|null} Ghost profile if found
   */
  focusOnGhost(username, duration = 1000) {
    const ghostEntry = this.classGhosts.find(g => g.profile.username === username);
    if (!ghostEntry) {
      console.warn(`[MazeRenderer] Ghost not found: ${username}`);
      return null;
    }

    this.selectedGhost = username;
    const position = ghostEntry.mesh.position;

    const targetPosition = new THREE.Vector3(position.x, position.y, position.z);
    const cameraOffset = new THREE.Vector3(6, 4, 6);
    const targetCameraPos = targetPosition.clone().add(cameraOffset);

    if (!this.controls) {
      this.camera.position.copy(targetCameraPos);
      this.camera.lookAt(targetPosition);
      return ghostEntry.profile;
    }

    // Animate camera
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();

    const animateCamera = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this._easeOutCubic(progress);

      this.camera.position.lerpVectors(startPos, targetCameraPos, eased);
      this.controls.target.lerpVectors(startTarget, targetPosition, eased);

      if (progress < 1 && !this.isDisposed) {
        requestAnimationFrame(animateCamera);
      }
    };

    animateCamera();

    // Pulse effect on selected ghost
    this._pulseGhost(ghostEntry.mesh);

    console.log(`[MazeRenderer] Focused on ghost: ${username}`);
    return ghostEntry.profile;
  }

  /**
   * Apply pulse effect to ghost mesh
   * @param {THREE.Group} ghostMesh - Ghost mesh to pulse
   * @private
   */
  _pulseGhost(ghostMesh) {
    if (!ghostMesh || !ghostMesh.children[0]) return;

    const core = ghostMesh.children[0];
    const originalOpacity = core.material.opacity;
    const startTime = performance.now();
    const pulseDuration = 500;

    const doPulse = () => {
      const elapsed = performance.now() - startTime;
      const progress = elapsed / pulseDuration;

      if (progress < 1) {
        const pulse = Math.sin(progress * Math.PI * 2) * 0.3;
        core.material.opacity = Math.min(originalOpacity + pulse, 1.0);
        requestAnimationFrame(doPulse);
      } else {
        core.material.opacity = originalOpacity;
      }
    };

    doPulse();
  }

  /**
   * Get ghost at screen position (for click/hover handling)
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object|null} Ghost profile or null
   */
  getGhostAtPosition(screenX, screenY) {
    if (!this.camera || !this.ghostGroup || !this.classViewMode) return null;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const rect = this.renderer.domElement.getBoundingClientRect();
    mouse.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((screenY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, this.camera);

    const intersects = raycaster.intersectObjects(this.ghostGroup.children, true);

    for (const intersect of intersects) {
      let object = intersect.object;
      // Walk up to find ghost group
      while (object && object.userData?.type !== 'ghost') {
        object = object.parent;
      }
      if (object && object.userData?.profile) {
        return object.userData.profile;
      }
    }

    return null;
  }

  /**
   * Toggle class view mode
   * @param {boolean} enabled - Enable class view mode
   */
  setClassViewMode(enabled) {
    this.classViewMode = enabled;

    if (enabled) {
      // Set overview camera position
      this._setOverviewCamera();
    } else {
      // Clear class view and restore single ghost mode
      this._clearClassGhosts();
      if (this.ghostProfile) {
        this.updateGhost(this.ghostProfile);
      }
    }

    console.log(`[MazeRenderer] Class view mode: ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set camera to overview position to see entire maze
   * @private
   */
  _setOverviewCamera() {
    const camera = calculateOverviewCamera(this.nodes);

    const targetPosition = new THREE.Vector3(camera.target.x, camera.target.y, camera.target.z);
    const targetCameraPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);

    if (!this.controls) {
      this.camera.position.copy(targetCameraPos);
      this.camera.lookAt(targetPosition);
      return;
    }

    // Animate to overview position
    const startPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();
    const duration = 1500;

    const animateCamera = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this._easeOutCubic(progress);

      this.camera.position.lerpVectors(startPos, targetCameraPos, eased);
      this.controls.target.lerpVectors(startTarget, targetPosition, eased);

      if (progress < 1 && !this.isDisposed) {
        requestAnimationFrame(animateCamera);
      }
    };

    animateCamera();
  }

  /**
   * Get first node ID (fallback for ghosts without currentLevel)
   * @returns {string|null}
   * @private
   */
  _getFirstNodeId() {
    if (!this.nodes || this.nodes.size === 0) return null;
    return this.nodes.keys().next().value;
  }

  /**
   * Handle mouse move for tooltip (Phase 5)
   * @param {MouseEvent} event
   * @private
   */
  _handleMouseMove(event) {
    if (!this.classViewMode) return;

    const ghost = this.getGhostAtPosition(event.clientX, event.clientY);

    if (ghost) {
      this._showGhostTooltip(ghost, event.clientX, event.clientY);
    } else {
      this._hideGhostTooltip();
    }
  }

  /**
   * Show tooltip for ghost
   * @param {Object} profile - Ghost profile
   * @param {number} x - Screen X
   * @param {number} y - Screen Y
   * @private
   */
  _showGhostTooltip(profile, x, y) {
    if (!this.ghostTooltip) {
      this.ghostTooltip = document.createElement('div');
      this.ghostTooltip.className = 'ghost-tooltip';
      this.ghostTooltip.style.cssText = `
        position: fixed;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        z-index: 10000;
        border: 1px solid rgba(68, 136, 255, 0.5);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      `;
      document.body.appendChild(this.ghostTooltip);
    }

    const proficiencyPercent = ((profile.proficiency_score || 0) * 100).toFixed(0);
    const lastActive = profile.updated_at ? this._formatTimeAgo(profile.updated_at) : 'Unknown';

    this.ghostTooltip.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">@${profile.username}</div>
      <div>Proficiency: ${proficiencyPercent}%</div>
      <div>Interactions: ${profile.total_interactions || 0}</div>
      <div>Level: ${profile.currentLevel || 'N/A'}</div>
      <div style="color: #888; font-size: 11px;">Last active: ${lastActive}</div>
    `;

    this.ghostTooltip.style.left = `${x + 15}px`;
    this.ghostTooltip.style.top = `${y + 15}px`;
    this.ghostTooltip.style.display = 'block';
  }

  /**
   * Hide ghost tooltip
   * @private
   */
  _hideGhostTooltip() {
    if (this.ghostTooltip) {
      this.ghostTooltip.style.display = 'none';
    }
  }

  /**
   * Format timestamp as time ago
   * @param {string} timestamp - ISO timestamp
   * @returns {string}
   * @private
   */
  _formatTimeAgo(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  /**
   * Set rendering quality
   * @param {'low'|'medium'|'high'} level
   */
  setQuality(level) {
    if (!QUALITY_PRESETS[level]) {
      console.warn('[MazeRenderer] Invalid quality level:', level);
      return;
    }

    this.quality = level;

    // Rebuild scene with new quality (if already initialized)
    if (this.scene) {
      // Clear and rebuild nodes/edges
      this.nodeGroup.clear();
      this.edgeGroup.clear();

      this._buildNodes();
      this._buildEdges();
    }
  }

  /**
   * Update player progress and refresh node states
   * @param {Object} playerProgress - New progress data
   */
  updateProgress(playerProgress) {
    this.playerProgress = playerProgress;
    this.progressMap = calculateProgress(this.nodes, playerProgress);

    // Rebuild nodes with new progress
    if (this.nodeGroup) {
      this.nodeGroup.clear();
      this._buildNodes();
    }
  }

  /**
   * Dispose mesh and its resources
   * @param {THREE.Object3D} object
   */
  _disposeMesh(object) {
    if (!object) return;

    object.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  /**
   * Dispatch error event
   * @param {Error} error
   */
  _dispatchError(error) {
    this.container.dispatchEvent(new CustomEvent('maze-error', {
      detail: { error }
    }));
  }

  /**
   * Clean up all resources
   */
  dispose() {
    this.isDisposed = true;

    // Stop animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Remove event listeners
    window.removeEventListener('resize', this._onResize);
    if (this.renderer) {
      this.renderer.domElement.removeEventListener('click', this._onClick);
      this.renderer.domElement.removeEventListener('mousemove', this._onMouseMove);
    }

    // Remove tooltip
    if (this.ghostTooltip && this.ghostTooltip.parentElement) {
      this.ghostTooltip.remove();
      this.ghostTooltip = null;
    }

    // Clear class view state
    this.classGhosts = [];
    this.ghostsByNode.clear();

    // Dispose scene objects
    if (this.scene) {
      this.scene.traverse(object => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentElement) {
        this.renderer.domElement.remove();
      }
    }

    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
    }

    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.nodeGroup = null;
    this.edgeGroup = null;
    this.ghostGroup = null;
    this.ghostMesh = null;

    console.log('[MazeRenderer] Disposed');
  }
}

// ============== Exported Helper Functions ==============

/**
 * Get the hex color code for a ghost based on proficiency color name
 * @param {string} colorName - Color name (white, yellow, orange, red, indigo)
 * @returns {number} Hex color code
 */
export function getGhostColorHex(colorName) {
  const colorKey = `ghost${colorName.charAt(0).toUpperCase() + colorName.slice(1)}`;
  return TRON_COLORS[colorKey] || TRON_COLORS.ghostWhite;
}

/**
 * Calculate ghost color from proficiency score
 * Mirrors GhostEngine.calculateColor() logic for visualization
 * @param {number} proficiency - Proficiency score 0-1
 * @returns {string} Color name
 */
export function calculateGhostColor(proficiency) {
  if (proficiency < 0.2) return 'white';
  if (proficiency < 0.4) return 'yellow';
  if (proficiency < 0.6) return 'orange';
  if (proficiency < 0.8) return 'red';
  return 'indigo';
}

/**
 * Calculate ghost opacity from interaction count
 * Mirrors GhostEngine.calculateOpacity() logic for visualization
 * @param {number} interactions - Total interaction count
 * @returns {number} Opacity 0.1-1.0
 */
export function calculateGhostOpacity(interactions) {
  const OPACITY_THRESHOLD = 100;
  return Math.min(0.1 + (interactions / OPACITY_THRESHOLD) * 0.9, 1.0);
}

/**
 * Interpolate position along a movement path
 * Used for calculating ghost position during movement animation
 * @param {Object} fromPos - Starting position {x, y, z}
 * @param {Object} toPos - Ending position {x, y, z}
 * @param {number} t - Progress 0-1
 * @param {number} sag - Curve sag amount (default 1.5)
 * @returns {{x: number, y: number, z: number}} Interpolated position
 */
export function interpolateMovementPath(fromPos, toPos, t, sag = GHOST_EDGE_SAG) {
  // Calculate midpoint with sag
  const midX = (fromPos.x + toPos.x) / 2;
  const midY = (fromPos.y + toPos.y) / 2 - sag;
  const midZ = (fromPos.z + toPos.z) / 2;

  // Quadratic bezier interpolation
  const oneMinusT = 1 - t;
  const tSquared = t * t;
  const oneMinusTSquared = oneMinusT * oneMinusT;
  const twoTOneMinusT = 2 * t * oneMinusT;

  return {
    x: oneMinusTSquared * fromPos.x + twoTOneMinusT * midX + tSquared * toPos.x,
    y: oneMinusTSquared * fromPos.y + twoTOneMinusT * midY + tSquared * toPos.y,
    z: oneMinusTSquared * fromPos.z + twoTOneMinusT * midZ + tSquared * toPos.z
  };
}

/**
 * Ease-in-out cubic easing function
 * @param {number} t - Progress 0-1
 * @returns {number} Eased progress 0-1
 */
export function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Export TRON_COLORS for testing
export { TRON_COLORS };

// ============== Phase 5: Multi-Ghost Landscape Helper Functions ==============

/**
 * Calculate clustered positions for ghosts at same node
 * @param {Array} ghosts - Ghosts at this node
 * @param {Object} nodePosition - Base node position {x, y, z}
 * @returns {Array} Array of adjusted positions
 */
export function calculateClusterPositions(ghosts, nodePosition) {
  const count = ghosts.length;
  const positions = [];

  for (let i = 0; i < count; i++) {
    const ring = Math.floor(i / GHOSTS_PER_RING);
    const indexInRing = i % GHOSTS_PER_RING;
    const ringCount = Math.min(count - ring * GHOSTS_PER_RING, GHOSTS_PER_RING);

    // Single ghost is centered
    if (count === 1) {
      positions.push({
        x: nodePosition.x,
        y: nodePosition.y + GHOST_HEIGHT_OFFSET,
        z: nodePosition.z
      });
      continue;
    }

    const angle = (indexInRing / ringCount) * Math.PI * 2;
    const radius = CLUSTER_RADIUS * (1 + ring * 0.5);

    positions.push({
      x: nodePosition.x + Math.cos(angle) * radius,
      y: nodePosition.y + GHOST_HEIGHT_OFFSET + ring * VERTICAL_SPACING,
      z: nodePosition.z + Math.sin(angle) * radius
    });
  }

  return positions;
}

/**
 * Calculate node glow intensity based on ghost count
 * @param {number} ghostCount - Number of ghosts at this node
 * @returns {number} Intensity multiplier (1.0 - 2.0)
 */
export function calculateNodeGlowIntensity(ghostCount) {
  if (ghostCount === 0) return 1.0;
  if (ghostCount <= 2) return 1.2;
  if (ghostCount <= 5) return 1.5;
  if (ghostCount <= 10) return 1.8;
  return 2.0;
}

/**
 * Calculate overview camera position to see entire maze
 * @param {Map} nodes - All nodes in maze
 * @returns {Object} Camera position and target {position: {x,y,z}, target: {x,y,z}}
 */
export function calculateOverviewCamera(nodes) {
  if (!nodes || nodes.size === 0) {
    return {
      position: { x: 30, y: 25, z: 30 },
      target: { x: 0, y: 8, z: 0 }
    };
  }

  // Find bounding box of all nodes
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const node of nodes.values()) {
    if (!node.position) continue;
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y);
    minZ = Math.min(minZ, node.position.z);
    maxZ = Math.max(maxZ, node.position.z);
  }

  // Handle edge case where no nodes have positions
  if (minX === Infinity) {
    return {
      position: { x: 30, y: 25, z: 30 },
      target: { x: 0, y: 8, z: 0 }
    };
  }

  // Calculate center
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // Calculate max span for camera distance
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const spanZ = maxZ - minZ;
  const maxSpan = Math.max(spanX, spanY, spanZ, 20); // Minimum 20 units

  // Position camera at 45-degree angle, far enough to see everything
  const distance = maxSpan * 1.5;

  return {
    position: {
      x: centerX + distance * 0.7,
      y: centerY + distance * 0.5,
      z: centerZ + distance * 0.7
    },
    target: { x: centerX, y: centerY, z: centerZ }
  };
}

/**
 * Parse ghost leaderboard data and add currentLevel based on proficiency
 * @param {Array} ghosts - Raw ghost data from API
 * @param {Map} nodes - Maze nodes to map progress to
 * @returns {Array} Enhanced ghost profiles with currentLevel
 */
export function parseLeaderboardData(ghosts, nodes) {
  if (!ghosts || !Array.isArray(ghosts)) return [];
  if (!nodes || nodes.size === 0) return ghosts;

  // Get sorted node IDs by tier (progression order)
  const nodeArray = Array.from(nodes.values())
    .filter(n => n.position)
    .sort((a, b) => a.tier - b.tier);

  return ghosts.map(ghost => {
    // If ghost already has currentLevel, use it
    if (ghost.currentLevel && nodes.has(ghost.currentLevel)) {
      return ghost;
    }

    // Estimate current level based on proficiency score
    const proficiency = ghost.proficiency_score || 0;
    const estimatedIndex = Math.floor(proficiency * (nodeArray.length - 1));
    const clampedIndex = Math.max(0, Math.min(estimatedIndex, nodeArray.length - 1));

    return {
      ...ghost,
      currentLevel: nodeArray[clampedIndex]?.id || nodeArray[0]?.id
    };
  });
}

// Export constants for testing
export {
  CLUSTER_RADIUS,
  VERTICAL_SPACING,
  GHOSTS_PER_RING,
  CLASS_VIEW_GHOST_SCALE,
  CLASS_VIEW_OPACITY_FACTOR,
  MAX_DISPLAYED_GHOSTS,
  GHOST_HEIGHT_OFFSET
};
