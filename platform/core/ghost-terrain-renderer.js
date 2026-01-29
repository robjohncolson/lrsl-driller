/**
 * ghost-terrain-renderer.js
 * Three.js 3D terrain visualization for the Ghost Panel's class view
 *
 * Renders a procedurally generated landscape where terrain features
 * emerge from aggregated class neural network weights, creating a
 * "living landscape" that visualizes class learning patterns.
 *
 * Visual Mapping:
 * - High accuracy areas -> Mountain peaks (bright)
 * - Struggle areas -> Valleys (darker)
 * - Class activity -> Terrain detail/complexity
 * - Empty class -> Flat misty plane
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  generateTerrainHeightmap,
  aggregateClassWeights,
  getTerrainColor
} from './ghost-orbits-nn-mapper.js';

// Tron-inspired color palette for terrain
const TERRAIN_COLORS = {
  background: 0x0a0a12,
  fog: 0x0a1020,
  ambient: 0x223344,
  directional: 0x88aaff,
  grid: 0x00d4ff,
  water: 0x0044aa
};

// Quality presets for performance scaling
const QUALITY_PRESETS = {
  low: {
    terrainSize: 64,
    segments: 64,
    antialias: false,
    shadows: false,
    fog: true
  },
  medium: {
    terrainSize: 128,
    segments: 128,
    antialias: true,
    shadows: false,
    fog: true
  },
  high: {
    terrainSize: 256,
    segments: 256,
    antialias: true,
    shadows: true,
    fog: true
  }
};

// Animation constants
const ROTATION_SPEED = 0.0002;      // Radians per frame
const WAVE_SPEED = 0.0005;          // Wave animation speed
const WAVE_AMPLITUDE = 0.02;        // Subtle height variation
const CAMERA_DISTANCE = 15;         // Initial camera distance
const TERRAIN_SCALE = 10;           // World units for terrain width
const HEIGHT_SCALE = 3;             // World units for max height

/**
 * TerrainRenderer class - renders 3D fractal terrain from class weights
 */
export class TerrainRenderer {
  /**
   * @param {HTMLElement} container - DOM element to render into
   * @param {Object} options - Configuration options
   * @param {string} options.quality - Quality preset ('low', 'medium', 'high')
   */
  constructor(container, options = {}) {
    this.container = container;
    this.quality = options.quality || 'medium';
    this.preset = QUALITY_PRESETS[this.quality] || QUALITY_PRESETS.medium;

    // Three.js objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // Terrain objects
    this.terrain = null;
    this.terrainGeometry = null;
    this.terrainMaterial = null;
    this.waterPlane = null;
    this.gridHelper = null;

    // Data state
    this.heightmapData = null;
    this.classData = null;
    this.isEmpty = true;

    // Animation state
    this.animationId = null;
    this.isDisposed = false;
    this.autoRotate = true;
    this.time = 0;

    // Event handlers (bound for removal)
    this._onResize = this._handleResize.bind(this);
  }

  /**
   * Initialize the Three.js scene
   * @returns {Promise<void>}
   */
  async init() {
    if (!this._detectWebGL()) {
      console.warn('[TerrainRenderer] WebGL not supported');
      this._dispatchError(new Error('WebGL not supported'));
      return;
    }

    this._initScene();
    this._initCamera();
    this._initRenderer();
    this._initControls();
    this._initLighting();
    this._buildEmptyTerrain();

    // Event listeners
    window.addEventListener('resize', this._onResize);

    // Start animation loop
    this._animate();

    // Dispatch ready event
    this.container.dispatchEvent(new CustomEvent('terrain-ready', { detail: {} }));

    console.log('[TerrainRenderer] Initialized');
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
    this.scene.background = new THREE.Color(TERRAIN_COLORS.background);

    if (this.preset.fog) {
      this.scene.fog = new THREE.FogExp2(TERRAIN_COLORS.fog, 0.035);
    }
  }

  /**
   * Initialize the perspective camera
   */
  _initCamera() {
    const width = this.container.clientWidth || 400;
    const height = this.container.clientHeight || 300;
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(CAMERA_DISTANCE, CAMERA_DISTANCE * 0.6, CAMERA_DISTANCE);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Initialize the WebGL renderer
   */
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.preset.antialias,
      alpha: true
    });

    this.renderer.setSize(this.container.clientWidth || 400, this.container.clientHeight || 300);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    if (this.preset.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Clear any existing canvas
    const existingCanvas = this.container.querySelector('canvas');
    if (existingCanvas) {
      existingCanvas.remove();
    }

    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Initialize OrbitControls for camera interaction
   */
  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI / 2.1; // Prevent going below horizon
    this.controls.autoRotate = false; // We handle rotation manually
    this.controls.enablePan = true;
  }

  /**
   * Initialize scene lighting
   */
  _initLighting() {
    // Ambient light for base illumination
    const ambient = new THREE.AmbientLight(TERRAIN_COLORS.ambient, 0.4);
    this.scene.add(ambient);

    // Main directional light (sun)
    const directional = new THREE.DirectionalLight(TERRAIN_COLORS.directional, 0.8);
    directional.position.set(10, 15, 10);

    if (this.preset.shadows) {
      directional.castShadow = true;
      directional.shadow.mapSize.width = 1024;
      directional.shadow.mapSize.height = 1024;
      directional.shadow.camera.near = 0.5;
      directional.shadow.camera.far = 50;
    }

    this.scene.add(directional);

    // Hemisphere light for sky/ground color variation
    const hemi = new THREE.HemisphereLight(0x88aaff, 0x223344, 0.4);
    this.scene.add(hemi);

    // Rim light for edge highlighting
    const rim = new THREE.DirectionalLight(0x00d4ff, 0.3);
    rim.position.set(-10, 5, -10);
    this.scene.add(rim);
  }

  /**
   * Build an empty/flat terrain (shown when no class data)
   */
  _buildEmptyTerrain() {
    const segments = this.preset.segments;

    // Create flat plane geometry
    this.terrainGeometry = new THREE.PlaneGeometry(
      TERRAIN_SCALE,
      TERRAIN_SCALE,
      segments - 1,
      segments - 1
    );
    this.terrainGeometry.rotateX(-Math.PI / 2);

    // Create material with vertex colors
    this.terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.1,
      roughness: 0.8,
      flatShading: true
    });

    // Set uniform gray color for empty state
    const colors = [];
    const positions = this.terrainGeometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      colors.push(0.15, 0.18, 0.25); // Dark blue-gray
    }

    this.terrainGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );

    this.terrain = new THREE.Mesh(this.terrainGeometry, this.terrainMaterial);

    if (this.preset.shadows) {
      this.terrain.castShadow = true;
      this.terrain.receiveShadow = true;
    }

    this.scene.add(this.terrain);

    // Add water plane at low level
    this._buildWaterPlane();

    // Add grid for reference
    this._buildGrid();

    this.isEmpty = true;
  }

  /**
   * Build the water plane (visible in valleys)
   */
  _buildWaterPlane() {
    const waterGeometry = new THREE.PlaneGeometry(TERRAIN_SCALE * 1.5, TERRAIN_SCALE * 1.5);
    waterGeometry.rotateX(-Math.PI / 2);

    const waterMaterial = new THREE.MeshStandardMaterial({
      color: TERRAIN_COLORS.water,
      transparent: true,
      opacity: 0.6,
      metalness: 0.9,
      roughness: 0.1
    });

    this.waterPlane = new THREE.Mesh(waterGeometry, waterMaterial);
    this.waterPlane.position.y = 0.15; // Slightly above ground

    this.scene.add(this.waterPlane);
  }

  /**
   * Build reference grid
   */
  _buildGrid() {
    this.gridHelper = new THREE.GridHelper(TERRAIN_SCALE, 20, TERRAIN_COLORS.grid, 0x112233);
    this.gridHelper.position.y = 0.01;
    this.gridHelper.material.opacity = 0.2;
    this.gridHelper.material.transparent = true;
    this.scene.add(this.gridHelper);
  }

  /**
   * Update terrain from class ghost profiles
   * @param {Array} ghostProfiles - Array of ghost profiles
   */
  updateFromClassData(ghostProfiles) {
    if (!ghostProfiles || ghostProfiles.length === 0) {
      this._resetToEmpty();
      return;
    }

    this.classData = ghostProfiles;

    // Aggregate weights from all profiles
    const aggregated = aggregateClassWeights(ghostProfiles);

    // Generate heightmap
    this.heightmapData = generateTerrainHeightmap(aggregated.weights, {
      size: this.preset.terrainSize,
      correctProb: aggregated.avgCorrectProb,
      activityLevel: aggregated.avgActivity
    });

    // Apply heightmap to terrain
    this._applyHeightmap(aggregated.avgCorrectProb);

    this.isEmpty = false;

    console.log(`[TerrainRenderer] Updated terrain from ${ghostProfiles.length} profiles`);
    console.log(`[TerrainRenderer] Heightmap stats:`, this.heightmapData.stats);
  }

  /**
   * Apply heightmap data to terrain geometry
   * @param {number} proficiency - Class average proficiency for coloring
   */
  _applyHeightmap(proficiency = 0.5) {
    if (!this.heightmapData || !this.terrainGeometry) return;

    const { heightmap, size } = this.heightmapData;
    const positions = this.terrainGeometry.attributes.position;
    const colors = [];

    const segments = this.preset.segments;
    const step = size / segments;

    for (let i = 0; i < positions.count; i++) {
      // Calculate grid coordinates
      const ix = i % segments;
      const iy = Math.floor(i / segments);

      // Sample heightmap (with bilinear interpolation)
      const height = this._sampleHeightmap(heightmap, size, ix * step, iy * step);

      // Set vertex height
      positions.setY(i, height * HEIGHT_SCALE);

      // Get color based on height and proficiency
      const color = getTerrainColor(height, proficiency);
      colors.push(color.r / 255, color.g / 255, color.b / 255);
    }

    // Update geometry
    positions.needsUpdate = true;
    this.terrainGeometry.computeVertexNormals();

    // Update colors
    this.terrainGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );

    // Adjust water level based on average height
    const avgHeight = this.heightmapData.stats.avg;
    this.waterPlane.position.y = avgHeight * HEIGHT_SCALE * 0.3;
  }

  /**
   * Sample heightmap with bilinear interpolation
   * @param {Float32Array} heightmap - Heightmap data
   * @param {number} size - Heightmap size
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} Interpolated height
   */
  _sampleHeightmap(heightmap, size, x, y) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, size - 1);
    const y1 = Math.min(y0 + 1, size - 1);

    const fx = x - x0;
    const fy = y - y0;

    const h00 = heightmap[y0 * size + x0] || 0;
    const h10 = heightmap[y0 * size + x1] || 0;
    const h01 = heightmap[y1 * size + x0] || 0;
    const h11 = heightmap[y1 * size + x1] || 0;

    // Bilinear interpolation
    const h0 = h00 * (1 - fx) + h10 * fx;
    const h1 = h01 * (1 - fx) + h11 * fx;

    return h0 * (1 - fy) + h1 * fy;
  }

  /**
   * Reset terrain to empty state
   */
  _resetToEmpty() {
    if (!this.terrainGeometry) return;

    const positions = this.terrainGeometry.attributes.position;
    const colors = [];

    for (let i = 0; i < positions.count; i++) {
      positions.setY(i, 0);
      colors.push(0.15, 0.18, 0.25);
    }

    positions.needsUpdate = true;
    this.terrainGeometry.computeVertexNormals();

    this.terrainGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );

    this.waterPlane.position.y = 0.15;

    this.heightmapData = null;
    this.classData = null;
    this.isEmpty = true;

    console.log('[TerrainRenderer] Reset to empty state');
  }

  /**
   * Animation loop
   */
  _animate() {
    if (this.isDisposed) return;

    this.animationId = requestAnimationFrame(() => this._animate());

    this.time += 1;

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Auto-rotate when enabled and no user interaction
    if (this.autoRotate && this.terrain) {
      this.terrain.rotation.y += ROTATION_SPEED;
      if (this.waterPlane) {
        this.waterPlane.rotation.y += ROTATION_SPEED;
      }
      if (this.gridHelper) {
        this.gridHelper.rotation.y += ROTATION_SPEED;
      }
    }

    // Subtle wave animation on terrain
    if (!this.isEmpty && this.terrainGeometry) {
      this._animateWaves();
    }

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Animate subtle wave motion on terrain
   */
  _animateWaves() {
    if (!this.heightmapData) return;

    const positions = this.terrainGeometry.attributes.position;
    const { heightmap, size } = this.heightmapData;
    const segments = this.preset.segments;
    const step = size / segments;

    for (let i = 0; i < positions.count; i++) {
      const ix = i % segments;
      const iy = Math.floor(i / segments);

      const baseHeight = this._sampleHeightmap(heightmap, size, ix * step, iy * step);

      // Add wave effect
      const wave = Math.sin(this.time * WAVE_SPEED + ix * 0.1 + iy * 0.1) * WAVE_AMPLITUDE;
      positions.setY(i, (baseHeight + wave) * HEIGHT_SCALE);
    }

    positions.needsUpdate = true;
  }

  /**
   * Handle window resize
   */
  _handleResize() {
    if (!this.camera || !this.renderer || !this.container) return;

    const width = this.container.clientWidth || 400;
    const height = this.container.clientHeight || 300;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * Toggle auto-rotation
   * @param {boolean} enabled
   */
  setAutoRotate(enabled) {
    this.autoRotate = enabled;
  }

  /**
   * Reset camera to default position
   */
  resetCamera() {
    if (!this.camera || !this.controls) return;

    this.camera.position.set(CAMERA_DISTANCE, CAMERA_DISTANCE * 0.6, CAMERA_DISTANCE);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  /**
   * Set rendering quality
   * @param {'low'|'medium'|'high'} level
   */
  setQuality(level) {
    if (!QUALITY_PRESETS[level]) {
      console.warn('[TerrainRenderer] Invalid quality level:', level);
      return;
    }

    const previousQuality = this.quality;
    this.quality = level;
    this.preset = QUALITY_PRESETS[level];

    // Rebuild terrain if quality changed significantly
    if (previousQuality !== level && this.terrain) {
      // Remove old terrain
      this.scene.remove(this.terrain);
      if (this.terrainGeometry) {
        this.terrainGeometry.dispose();
      }

      // Rebuild with new quality
      this._buildEmptyTerrain();

      // Reapply data if present
      if (this.classData) {
        this.updateFromClassData(this.classData);
      }
    }

    console.log(`[TerrainRenderer] Quality set to: ${level}`);
  }

  /**
   * Force a single render frame
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Dispatch error event
   * @param {Error} error
   */
  _dispatchError(error) {
    this.container.dispatchEvent(new CustomEvent('terrain-error', {
      detail: { error }
    }));
  }

  /**
   * Get terrain statistics
   * @returns {Object|null}
   */
  getStats() {
    if (!this.heightmapData) return null;

    return {
      ...this.heightmapData.stats,
      profileCount: this.classData?.length || 0,
      isEmpty: this.isEmpty
    };
  }

  /**
   * Check if terrain has data
   * @returns {boolean}
   */
  hasData() {
    return !this.isEmpty;
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
    this.terrain = null;
    this.terrainGeometry = null;
    this.terrainMaterial = null;
    this.waterPlane = null;
    this.gridHelper = null;

    console.log('[TerrainRenderer] Disposed');
  }
}

// Export helper functions for external use
export {
  TERRAIN_COLORS,
  QUALITY_PRESETS,
  HEIGHT_SCALE,
  TERRAIN_SCALE
};
