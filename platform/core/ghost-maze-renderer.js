/**
 * ghost-maze-renderer.js
 * Three.js scene rendering for the 3D Maze visualization
 *
 * Creates a Tron-esque 3D environment where:
 * - Levels are glowing hexagonal platforms
 * - Progression paths are curved bridges
 * - Ghosts are luminous spheres at their current position
 */

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

    // Event handlers (bound for removal)
    this._onResize = this._handleResize.bind(this);
    this._onClick = this._handleClick.bind(this);
  }

  /**
   * Initialize the Three.js scene
   * @returns {Promise<void>}
   */
  async init() {
    // Check for Three.js
    if (typeof THREE === 'undefined') {
      console.error('[MazeRenderer] Three.js not loaded');
      this._dispatchError(new Error('Three.js not available'));
      return;
    }

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

    // Event listeners
    window.addEventListener('resize', this._onResize);
    this.renderer.domElement.addEventListener('click', this._onClick);

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
   * Initialize the camera
   */
  _initCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);

    // Position camera to see the maze
    const stats = getMazeStats(this.nodes, this.edges, this.tiers);
    const cameraDistance = Math.max(30, stats.maxTier * 10);
    this.camera.position.set(cameraDistance, cameraDistance * 0.8, cameraDistance);
    this.camera.lookAt(0, stats.maxTier * 4, 0);
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
   * Initialize OrbitControls
   */
  _initControls() {
    // Check for OrbitControls
    if (typeof THREE.OrbitControls === 'undefined') {
      console.warn('[MazeRenderer] OrbitControls not available');
      return;
    }

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 150;
    this.controls.maxPolarAngle = Math.PI * 0.85;
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.5;
  }

  /**
   * Initialize scene lighting
   */
  _initLighting() {
    // Ambient light (dim)
    const ambient = new THREE.AmbientLight(0x111122, 0.4);
    this.scene.add(ambient);

    // Overhead spot for depth
    const spotLight = new THREE.SpotLight(0x4488ff, 0.3);
    spotLight.position.set(0, 100, 0);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    this.scene.add(spotLight);

    // Hemisphere light for color variation
    const hemi = new THREE.HemisphereLight(0x4488ff, 0x002244, 0.2);
    this.scene.add(hemi);
  }

  /**
   * Build the ground grid
   */
  _buildGrid() {
    const stats = getMazeStats(this.nodes, this.edges, this.tiers);
    const gridSize = Math.max(100, stats.maxTier * 20);

    const gridHelper = new THREE.GridHelper(
      gridSize,
      gridSize / 2,
      TRON_COLORS.grid,
      TRON_COLORS.gridSecondary
    );
    gridHelper.position.y = -2;
    this.scene.add(gridHelper);
  }

  /**
   * Build node meshes (platforms)
   */
  _buildNodes() {
    const preset = QUALITY_PRESETS[this.quality];

    for (const node of this.nodes.values()) {
      const progress = this.progressMap.get(node.id) || {
        unlocked: false,
        completed: false,
        current: false
      };

      const nodeMesh = this._createNodeMesh(node, progress, preset);
      this.nodeGroup.add(nodeMesh);
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
    const geometry = new THREE.CylinderGeometry(2, 2, 0.5, preset.nodeSegments);
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
    const ringGeometry = new THREE.TorusGeometry(2.1, 0.08, 4, preset.nodeSegments);
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

    for (const edge of this.edges) {
      const fromNode = this.nodes.get(edge.from);
      const toNode = this.nodes.get(edge.to);

      if (!fromNode || !toNode || !fromNode.position || !toNode.position) {
        continue;
      }

      const edgeMesh = this._createEdgeMesh(fromNode, toNode, edge, preset);
      this.edgeGroup.add(edgeMesh);
    }
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
    const tubeGeometry = new THREE.TubeGeometry(curve, preset.edgeSegments, 0.08, 4, false);

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
   * Animate ghost bobbing
   */
  _animateGhost() {
    if (!this.ghostMesh) return;

    const time = performance.now() * 0.002;
    this.ghostMesh.position.y += Math.sin(time) * 0.005;
  }

  /**
   * Handle window resize
   */
  _handleResize() {
    if (!this.camera || !this.renderer || !this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
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

    // Remove existing ghost
    if (this.ghostMesh) {
      this.ghostGroup.remove(this.ghostMesh);
      this._disposeMesh(this.ghostMesh);
    }

    // Create new ghost mesh
    this.ghostMesh = this._createGhostMesh(ghostProfile);
    this.ghostGroup.add(this.ghostMesh);

    // Position at current level
    const currentNode = this.nodes.get(ghostProfile.currentLevel);
    if (currentNode && currentNode.position) {
      this.ghostMesh.position.set(
        currentNode.position.x,
        currentNode.position.y + 2,
        currentNode.position.z
      );
    }
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
   * Show all ghosts for leaderboard view
   * @param {Array} ghostProfiles - Array of ghost profiles
   */
  showAllGhosts(ghostProfiles) {
    if (!ghostProfiles || !this.ghostGroup) return;

    // Clear existing ghosts
    while (this.ghostGroup.children.length > 0) {
      const child = this.ghostGroup.children[0];
      this.ghostGroup.remove(child);
      this._disposeMesh(child);
    }

    // Add all ghosts
    ghostProfiles.forEach((profile, index) => {
      const ghost = this._createGhostMesh(profile);

      const node = this.nodes.get(profile.currentLevel);
      if (node && node.position) {
        // Offset slightly if multiple ghosts on same node
        ghost.position.set(
          node.position.x + (index % 3 - 1) * 0.5,
          node.position.y + 2 + Math.floor(index / 3) * 0.5,
          node.position.z + (Math.floor(index / 3) % 3 - 1) * 0.5
        );
      }

      this.ghostGroup.add(ghost);
    });

    this.ghostMesh = null; // No single ghost tracked
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
    }

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
