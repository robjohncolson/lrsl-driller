/**
 * ghost-orbits-nn-mapper.js
 * Maps neural network outputs to Ghost Orbits arena properties
 *
 * Converts ghost NN predictions into gameplay-affecting properties:
 * - Mass/Size (from accuracy)
 * - Thrust Efficiency (from speed)
 * - Trail Duration (from independence)
 * - Energy Regen (from solve time)
 * - Trail Width (from accuracy)
 *
 * Also generates unique fractal patterns from NN weights as visual "DNA"
 */

// Ghost tier colors (Tron aesthetic)
const GHOST_TIERS = [
  '#4488ff',  // Tier 0: Electric blue (levels 0-2)
  '#00ff88',  // Tier 1: Neon green (levels 3-5)
  '#ffdd00',  // Tier 2: Gold (levels 6-8)
  '#ff8844',  // Tier 3: Orange (levels 9-11)
  '#ff44ff',  // Tier 4: Magenta (levels 12+)
];

// Property range constants
const PROPERTY_RANGES = {
  mass: { min: 0.5, max: 1.5 },
  thrustEfficiency: { min: 0.7, max: 1.3 },
  trailDuration: { min: 0.5, max: 1.5 },
  energyRegen: { min: 0.7, max: 1.3 },
  trailWidth: { min: 0.8, max: 1.2 }
};

// Fractal generation constants
const FRACTAL_SIZE = 64;
const PERLIN_SCALE = 0.1;

/**
 * Calculate ghost arena properties from neural network output
 * @param {Object} nnOutput - Output from GhostNetwork.predict()
 * @param {number} nnOutput.correctProb - Probability of correct answer (0-1)
 * @param {number} nnOutput.quickProb - Probability of quick answer (0-1)
 * @param {number} nnOutput.hintProb - Probability of using hint (0-1)
 * @param {number} nnOutput.time - Predicted solve time in seconds (0-60+)
 * @returns {Object} Ghost arena properties
 */
export function calculateGhostProperties(nnOutput) {
  // Validate and clamp inputs
  const correctProb = clamp(nnOutput.correctProb ?? 0.5, 0, 1);
  const quickProb = clamp(nnOutput.quickProb ?? 0.5, 0, 1);
  const hintProb = clamp(nnOutput.hintProb ?? 0.5, 0, 1);
  const predictedTime = clamp(nnOutput.time ?? 30, 0, 120);

  return {
    // Mass: 0.5 - 1.5 (based on accuracy)
    // Higher accuracy = larger mass = can absorb smaller ghosts
    mass: 0.5 + correctProb,

    // Thrust efficiency: 0.7 - 1.3 (based on speed)
    // Quick solvers get more speed per energy spent
    thrustEfficiency: 0.7 + quickProb * 0.6,

    // Trail duration: 0.5 - 1.5 (inverse of hint usage)
    // Independent students (low hint usage) leave longer trails
    trailDuration: 0.5 + (1 - hintProb),

    // Energy regen: 0.7 - 1.3 (inverse of solve time)
    // Fast solvers recover energy quicker
    // Normalize time to 0-1 range (60s = max), then invert
    energyRegen: 0.7 + (1 - Math.min(predictedTime / 60, 1)) * 0.6,

    // Trail width: 0.8 - 1.2 (based on accuracy)
    // Accurate students leave wider trails (more territory claim)
    trailWidth: 0.8 + correctProb * 0.4
  };
}

/**
 * Create a deterministic hash from neural network weights
 * Uses a simple but effective hash combining algorithm
 * @param {number[][]|number[]} weights - Serialized NN weights (array of arrays or flat array)
 * @returns {number} Deterministic hash value (32-bit integer)
 */
export function hashWeights(weights) {
  // Flatten if nested arrays
  const flat = Array.isArray(weights[0])
    ? weights.flat()
    : weights;

  // FNV-1a hash algorithm (good distribution, simple)
  let hash = 2166136261; // FNV offset basis

  for (let i = 0; i < flat.length; i++) {
    // Convert float to integer representation
    const value = Math.floor(flat[i] * 1000000);
    hash ^= value & 0xff;
    hash = Math.imul(hash, 16777619); // FNV prime
    hash ^= (value >> 8) & 0xff;
    hash = Math.imul(hash, 16777619);
    hash ^= (value >> 16) & 0xff;
    hash = Math.imul(hash, 16777619);
    hash ^= (value >> 24) & 0xff;
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0; // Convert to unsigned 32-bit
}

/**
 * Seeded pseudo-random number generator
 * Uses mulberry32 algorithm for good distribution
 * @param {number} seed - Initial seed value
 * @returns {Function} Function that returns next random number (0-1)
 */
function createSeededRandom(seed) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Generate 2D Perlin-like noise using seeded randomness
 * Simplified implementation suitable for fractal patterns
 * @param {Function} random - Seeded random function
 * @param {number} size - Grid size for gradients
 * @returns {Function} Noise function (x, y) => value (-1 to 1)
 */
function createPerlinNoise(random, size = 16) {
  // Generate gradient vectors at grid points
  const gradients = [];
  for (let i = 0; i < size * size; i++) {
    const angle = random() * Math.PI * 2;
    gradients.push({ x: Math.cos(angle), y: Math.sin(angle) });
  }

  // Smoothstep interpolation
  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  // Dot product of gradient and distance vector
  function dotGridGradient(ix, iy, x, y) {
    const idx = ((iy % size) * size + (ix % size)) % gradients.length;
    const gradient = gradients[idx];
    const dx = x - ix;
    const dy = y - iy;
    return dx * gradient.x + dy * gradient.y;
  }

  return function(x, y) {
    // Grid cell coordinates
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    // Interpolation weights
    const sx = smoothstep(x - x0);
    const sy = smoothstep(y - y0);

    // Interpolate between grid point gradients
    const n0 = dotGridGradient(x0, y0, x, y);
    const n1 = dotGridGradient(x1, y0, x, y);
    const ix0 = n0 + sx * (n1 - n0);

    const n2 = dotGridGradient(x0, y1, x, y);
    const n3 = dotGridGradient(x1, y1, x, y);
    const ix1 = n2 + sx * (n3 - n2);

    return ix0 + sy * (ix1 - ix0);
  };
}

/**
 * Generate a fractal pattern texture from neural network weights
 * This is the ghost's visual "DNA" - persists across cartridges
 * @param {number[][]|number[]} weights - Serialized NN weights
 * @returns {Object} Fractal pattern data
 * @returns {Uint8ClampedArray} .data - RGBA pixel data (64x64x4)
 * @returns {number} .width - Pattern width (64)
 * @returns {number} .height - Pattern height (64)
 * @returns {number} .seed - Hash seed used
 * @returns {number} .complexity - Complexity metric from weight count
 */
export function generateFractalPattern(weights) {
  const seed = hashWeights(weights);
  const random = createSeededRandom(seed);
  const noise = createPerlinNoise(random);

  // Calculate complexity from weight count (more training = more complex)
  const flat = Array.isArray(weights[0]) ? weights.flat() : weights;
  const complexity = Math.min(flat.length / 1000, 1); // Normalize to 0-1

  // Create pixel data array (RGBA)
  const data = new Uint8ClampedArray(FRACTAL_SIZE * FRACTAL_SIZE * 4);

  // Generate fractal using multiple octaves of noise
  const octaves = 3 + Math.floor(complexity * 3); // 3-6 octaves based on complexity
  const persistence = 0.5 + complexity * 0.2;

  for (let y = 0; y < FRACTAL_SIZE; y++) {
    for (let x = 0; x < FRACTAL_SIZE; x++) {
      let value = 0;
      let amplitude = 1;
      let frequency = PERLIN_SCALE;
      let maxValue = 0;

      // Sum multiple octaves
      for (let o = 0; o < octaves; o++) {
        value += noise(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= 2;
      }

      // Normalize to 0-1 range
      value = (value / maxValue + 1) / 2;

      // Apply some non-linear transformation for more interesting patterns
      // Use seed to vary the transformation
      const transform = (seed % 4);
      switch (transform) {
        case 0: // Ridged
          value = 1 - Math.abs(value * 2 - 1);
          break;
        case 1: // Turbulent
          value = Math.abs(value * 2 - 1);
          break;
        case 2: // Stepped
          value = Math.floor(value * 5) / 5;
          break;
        case 3: // Smooth (no transform)
        default:
          break;
      }

      // Apply radial vignette for organic blob look
      const cx = FRACTAL_SIZE / 2;
      const cy = FRACTAL_SIZE / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / (FRACTAL_SIZE / 2);
      const vignette = 1 - Math.min(dist, 1);
      value *= vignette;

      // Convert to grayscale with alpha (white with varying opacity)
      const idx = (y * FRACTAL_SIZE + x) * 4;
      data[idx] = 255;     // R
      data[idx + 1] = 255; // G
      data[idx + 2] = 255; // B
      data[idx + 3] = Math.floor(value * 200); // A (0-200 range)
    }
  }

  return {
    data,
    width: FRACTAL_SIZE,
    height: FRACTAL_SIZE,
    seed,
    complexity
  };
}

/**
 * Create an ImageData object from fractal pattern (for canvas use)
 * @param {Object} pattern - Pattern from generateFractalPattern
 * @returns {ImageData} Canvas-compatible ImageData
 */
export function createFractalImageData(pattern) {
  if (typeof ImageData === 'undefined') {
    // Node.js environment - return raw data
    return pattern;
  }
  return new ImageData(pattern.data, pattern.width, pattern.height);
}

/**
 * Create a canvas texture from fractal pattern
 * @param {Object} pattern - Pattern from generateFractalPattern
 * @param {string} [tintColor] - Optional color to tint the pattern
 * @returns {HTMLCanvasElement|null} Canvas element with pattern, or null if not in browser
 */
export function createFractalCanvas(pattern, tintColor = null) {
  if (typeof document === 'undefined') {
    return null; // Not in browser
  }

  const canvas = document.createElement('canvas');
  canvas.width = pattern.width;
  canvas.height = pattern.height;
  const ctx = canvas.getContext('2d');

  // Draw base pattern
  const imageData = createFractalImageData(pattern);
  ctx.putImageData(imageData, 0, 0);

  // Apply color tint if specified
  if (tintColor) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = tintColor;
    ctx.fillRect(0, 0, pattern.width, pattern.height);
    ctx.globalCompositeOperation = 'source-over';
  }

  return canvas;
}

/**
 * Get ghost tier color based on level
 * Levels are grouped into tiers of 3 (0-2, 3-5, 6-8, etc.)
 * @param {number} level - Ghost level (0+)
 * @returns {string} Hex color string
 */
export function getGhostColor(level) {
  const tierIndex = Math.min(
    Math.floor(level / 3),
    GHOST_TIERS.length - 1
  );
  return GHOST_TIERS[tierIndex];
}

/**
 * Get all ghost tier colors
 * @returns {string[]} Array of tier colors
 */
export function getGhostTiers() {
  return [...GHOST_TIERS];
}

/**
 * Get tier index for a given level
 * @param {number} level - Ghost level
 * @returns {number} Tier index (0-4)
 */
export function getTierIndex(level) {
  return Math.min(Math.floor(level / 3), GHOST_TIERS.length - 1);
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get the valid ranges for ghost properties
 * Useful for UI display and normalization
 * @returns {Object} Property ranges
 */
export function getPropertyRanges() {
  return { ...PROPERTY_RANGES };
}

/**
 * Normalize a ghost property to 0-1 range
 * @param {string} property - Property name (mass, thrustEfficiency, etc.)
 * @param {number} value - Property value
 * @returns {number} Normalized value (0-1)
 */
export function normalizeProperty(property, value) {
  const range = PROPERTY_RANGES[property];
  if (!range) return value;
  return (value - range.min) / (range.max - range.min);
}

/**
 * GhostPropertiesMapper class for stateful usage
 * Caches computed properties and patterns for a ghost
 */
export class GhostPropertiesMapper {
  /**
   * Create a new mapper instance
   * @param {Object} [options] - Configuration options
   * @param {number} [options.level=0] - Ghost level for color tier
   */
  constructor(options = {}) {
    this.level = options.level ?? 0;
    this._cachedProperties = null;
    this._cachedPattern = null;
    this._cachedWeightsHash = null;
    this._cachedNNOutput = null;
  }

  /**
   * Update ghost level
   * @param {number} level - New level
   */
  setLevel(level) {
    this.level = level;
  }

  /**
   * Get ghost properties from NN output (cached)
   * @param {Object} nnOutput - Output from GhostNetwork.predict()
   * @returns {Object} Ghost arena properties
   */
  getProperties(nnOutput) {
    // Check if we need to recalculate
    if (this._cachedNNOutput !== nnOutput) {
      this._cachedProperties = calculateGhostProperties(nnOutput);
      this._cachedNNOutput = nnOutput;
    }
    return this._cachedProperties;
  }

  /**
   * Get fractal pattern from weights (cached)
   * @param {number[][]|number[]} weights - Serialized NN weights
   * @returns {Object} Fractal pattern data
   */
  getPattern(weights) {
    const hash = hashWeights(weights);
    if (this._cachedWeightsHash !== hash) {
      this._cachedPattern = generateFractalPattern(weights);
      this._cachedWeightsHash = hash;
    }
    return this._cachedPattern;
  }

  /**
   * Get ghost color for current level
   * @returns {string} Hex color string
   */
  getColor() {
    return getGhostColor(this.level);
  }

  /**
   * Get current tier index
   * @returns {number} Tier index (0-4)
   */
  getTier() {
    return getTierIndex(this.level);
  }

  /**
   * Map a ghost profile directly to arena properties
   * This derives NN-like outputs from the profile's proficiency score
   * @param {Object} profile - Ghost profile from ghost-engine
   * @param {number} profile.proficiency_score - 0-100 proficiency
   * @param {number} profile.total_interactions - Total interactions
   * @param {number[][]} [profile.weights] - NN weights for pattern
   * @returns {Object} Complete ghost properties for arena
   */
  mapProfile(profile) {
    // Derive NN-like outputs from proficiency score
    const proficiency = (profile.proficiency_score || 0) / 100; // Normalize to 0-1

    // Map proficiency to various NN outputs
    // Higher proficiency → better correctProb, quickProb; lower hintProb
    const nnOutput = {
      correctProb: 0.3 + proficiency * 0.5,    // 0.3-0.8 based on proficiency
      quickProb: 0.2 + proficiency * 0.5,       // 0.2-0.7 based on proficiency
      hintProb: 0.4 - proficiency * 0.3,        // 0.4-0.1 (inverted - less hints when better)
      time: 60 - proficiency * 40               // 60s-20s (faster when better)
    };

    // Calculate level from interactions (every 20 interactions = 1 level, max 20)
    const level = Math.min(Math.floor((profile.total_interactions || 0) / 20), 20);
    this.setLevel(level);

    // Get properties and pattern
    const properties = this.getProperties(nnOutput);
    const pattern = profile.weights ? this.getPattern(profile.weights) : null;

    return {
      ...properties,
      pattern,
      color: this.getColor(),
      tier: this.getTier(),
      level: this.level,
      proficiency: profile.proficiency_score || 0,
      interactions: profile.total_interactions || 0
    };
  }

  /**
   * Get a complete ghost appearance configuration
   * @param {Object} nnOutput - Output from GhostNetwork.predict()
   * @param {number[][]|number[]} weights - Serialized NN weights
   * @returns {Object} Complete appearance config
   */
  getAppearance(nnOutput, weights) {
    return {
      properties: this.getProperties(nnOutput),
      pattern: this.getPattern(weights),
      color: this.getColor(),
      tier: this.getTier(),
      level: this.level
    };
  }

  /**
   * Clear cached data
   */
  clearCache() {
    this._cachedProperties = null;
    this._cachedPattern = null;
    this._cachedWeightsHash = null;
    this._cachedNNOutput = null;
  }
}

// Default export for convenience
export default {
  calculateGhostProperties,
  generateFractalPattern,
  getGhostColor,
  hashWeights,
  GhostPropertiesMapper,
  getGhostTiers,
  getTierIndex,
  getPropertyRanges,
  normalizeProperty,
  createFractalImageData,
  createFractalCanvas
};
