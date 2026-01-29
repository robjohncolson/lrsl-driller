/**
 * ghost-orbits-nn-mapper.js
 * Maps neural network outputs to Ghost Orbits arena properties
 *
 * v3 (Dot Territory) - Converts ghost NN predictions into gameplay-affecting properties:
 * - flipWindow: Timing window to flip enemy dots (from accuracy)
 * - claimRadius: Dot claim distance multiplier (from speed)
 * - respawnSpeed: Invulnerability duration after hit (from independence)
 * - orbitalSpeed: Movement speed on records (from solve time)
 * - dotMagnetism: Subtle pull toward unclaimed dots (from proficiency)
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

// Property range constants for v3 dot territory gameplay
const PROPERTY_RANGES = {
  flipWindow: { min: 250, max: 350 },       // ms - timing window to flip enemy dots
  claimRadius: { min: 1.0, max: 1.3 },      // multiplier - dot claim distance
  respawnSpeed: { min: 1.2, max: 2.0 },     // seconds - invulnerability duration
  orbitalSpeed: { min: 1.0, max: 1.2 },     // multiplier - record orbital movement
  dotMagnetism: { min: 0, max: 0.3 }        // strength - pull toward unclaimed dots
};

// Fractal generation constants
const FRACTAL_SIZE = 64;
const PERLIN_SCALE = 0.1;

// Terrain generation constants
const TERRAIN_DEFAULT_SIZE = 128;
const TERRAIN_BASE_OCTAVES = 4;
const TERRAIN_MAX_OCTAVES = 8;

/**
 * Calculate ghost arena properties from neural network output
 * v3 dot territory properties - small edges, not game-breaking
 *
 * @param {Object} nnOutput - Output from GhostNetwork.predict()
 * @param {number} nnOutput.correctProb - Probability of correct answer (0-1)
 * @param {number} nnOutput.quickProb - Probability of quick answer (0-1)
 * @param {number} nnOutput.hintProb - Probability of using hint (0-1)
 * @param {number} nnOutput.time - Predicted solve time in seconds (0-60+)
 * @returns {Object} Ghost arena properties for dot territory gameplay
 */
export function calculateGhostProperties(nnOutput) {
  // Validate and clamp inputs
  const correctProb = clamp(nnOutput.correctProb ?? 0.5, 0, 1);
  const quickProb = clamp(nnOutput.quickProb ?? 0.5, 0, 1);
  const hintProb = clamp(nnOutput.hintProb ?? 0.5, 0, 1);
  const predictedTime = clamp(nnOutput.time ?? 30, 0, 120);

  return {
    // Flip window: 250ms base + up to 100ms bonus (based on accuracy)
    // Higher accuracy = larger timing window to flip enemy dots
    flipWindow: 250 + correctProb * 100,

    // Claim radius multiplier: 1.0 - 1.3 (based on speed)
    // Quick solvers can claim dots from slightly further away
    claimRadius: 1.0 + quickProb * 0.3,

    // Respawn invulnerability: 2.0s base - up to 0.8s reduction (inverse of hint usage)
    // Independent students (low hint usage) recover faster after damage
    respawnSpeed: 2.0 - (1 - hintProb) * 0.8,

    // Orbital speed multiplier: 1.0 - 1.2 (inverse of solve time)
    // Fast solvers move faster on records
    // Normalize time to 0-1 range (60s = max), then invert
    orbitalSpeed: 1.0 + (1 - Math.min(predictedTime / 60, 1)) * 0.2,

    // Dot magnetism strength: 0 - 0.3 (based on accuracy)
    // Accurate students have dots slightly gravitate toward them
    dotMagnetism: correctProb * 0.3
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

/**
 * Generate a 3D terrain heightmap from neural network weights
 * Used for the Ghost Panel's class view landscape visualization
 *
 * @param {number[][]|number[]} weights - Serialized NN weights (can be aggregated class weights)
 * @param {Object} options - Configuration options
 * @param {number} options.size - Grid size (default: 128)
 * @param {number} options.correctProb - Average correctness probability (0-1) - affects peak height
 * @param {number} options.activityLevel - Normalized activity level (0-1) - affects detail complexity
 * @returns {Object} Terrain data
 * @returns {Float32Array} .heightmap - Height values (0-1 range), size x size
 * @returns {number} .size - Grid dimension
 * @returns {number} .seed - Deterministic seed from weights
 * @returns {number} .complexity - Complexity metric (octave count)
 * @returns {Object} .stats - Height statistics { min, max, avg }
 */
export function generateTerrainHeightmap(weights, options = {}) {
  const size = options.size || TERRAIN_DEFAULT_SIZE;
  const correctProb = clamp(options.correctProb ?? 0.5, 0, 1);
  const activityLevel = clamp(options.activityLevel ?? 0.5, 0, 1);

  // Generate deterministic seed from weights
  const seed = hashWeights(weights);
  const random = createSeededRandom(seed);
  const noise = createPerlinNoise(random, 32); // Larger gradient grid for terrain

  // Calculate complexity from weight count and activity level
  const flat = Array.isArray(weights[0]) ? weights.flat() : weights;
  const weightComplexity = Math.min(flat.length / 500, 1);
  const octaves = TERRAIN_BASE_OCTAVES + Math.floor((weightComplexity + activityLevel) * (TERRAIN_MAX_OCTAVES - TERRAIN_BASE_OCTAVES) / 2);

  // Create heightmap array
  const heightmap = new Float32Array(size * size);

  // Noise parameters - more activity = more detail
  const baseScale = 0.02 + activityLevel * 0.02;
  const persistence = 0.45 + activityLevel * 0.15;
  const lacunarity = 2.0;

  // Height modifiers based on learning patterns
  // Higher correctProb = more prominent peaks
  const peakBias = 0.3 + correctProb * 0.4;
  const valleyDepth = 0.3 - correctProb * 0.2;

  let minHeight = Infinity;
  let maxHeight = -Infinity;
  let totalHeight = 0;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let value = 0;
      let amplitude = 1;
      let frequency = baseScale;
      let maxAmplitude = 0;

      // Sum multiple octaves of noise (fBm)
      for (let o = 0; o < octaves; o++) {
        const noiseVal = noise(x * frequency, y * frequency);
        value += noiseVal * amplitude;
        maxAmplitude += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
      }

      // Normalize to 0-1 range
      value = (value / maxAmplitude + 1) / 2;

      // Apply ridged multifractal transformation for mountain ridges
      // More likely when correctProb is high
      if (correctProb > 0.4) {
        const ridgeStrength = (correctProb - 0.4) / 0.6;
        const ridged = 1 - Math.abs(value * 2 - 1);
        value = value * (1 - ridgeStrength) + ridged * ridgeStrength;
      }

      // Apply radial falloff to create island-like terrain
      const cx = size / 2;
      const cy = size / 2;
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const falloff = 1 - Math.pow(Math.min(dist * 1.2, 1), 2);

      // Apply height bias based on correctness
      value = value * peakBias + (1 - falloff) * valleyDepth;
      value = value * falloff;

      // Clamp final value
      value = clamp(value, 0, 1);

      heightmap[y * size + x] = value;

      // Track stats
      minHeight = Math.min(minHeight, value);
      maxHeight = Math.max(maxHeight, value);
      totalHeight += value;
    }
  }

  return {
    heightmap,
    size,
    seed,
    complexity: octaves,
    stats: {
      min: minHeight,
      max: maxHeight,
      avg: totalHeight / (size * size)
    }
  };
}

/**
 * Aggregate neural network weights from multiple ghost profiles
 * Creates averaged weights representing the "class brain"
 *
 * @param {Array} ghostProfiles - Array of ghost profiles with weights
 * @returns {Object} Aggregated data
 * @returns {number[]} .weights - Averaged weights
 * @returns {number} .profileCount - Number of profiles with weights
 * @returns {number} .avgCorrectProb - Average correctness probability
 * @returns {number} .avgActivity - Normalized activity level (0-1)
 */
export function aggregateClassWeights(ghostProfiles) {
  if (!ghostProfiles || ghostProfiles.length === 0) {
    return {
      weights: [0],
      profileCount: 0,
      avgCorrectProb: 0.5,
      avgActivity: 0
    };
  }

  // Filter profiles that have weights
  const profilesWithWeights = ghostProfiles.filter(p => p.weights && p.weights.length > 0);

  if (profilesWithWeights.length === 0) {
    // Generate synthetic weights from proficiency scores
    const avgProficiency = ghostProfiles.reduce((sum, p) =>
      sum + (p.proficiency_score || 0), 0) / ghostProfiles.length;

    const avgInteractions = ghostProfiles.reduce((sum, p) =>
      sum + (p.total_interactions || 0), 0) / ghostProfiles.length;

    // Create synthetic weights from aggregated stats
    const syntheticWeights = [];
    let seed = Math.floor(avgProficiency * 1000000);

    for (let i = 0; i < 100; i++) {
      seed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      seed = seed + Math.imul(seed ^ (seed >>> 7), 61 | seed) ^ seed;
      const rand = ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
      // Bias weights toward proficiency level
      syntheticWeights.push((rand * 2 - 1) * (0.5 + avgProficiency * 0.5));
    }

    return {
      weights: syntheticWeights,
      profileCount: ghostProfiles.length,
      avgCorrectProb: avgProficiency,
      avgActivity: Math.min(avgInteractions / 100, 1)
    };
  }

  // Find the maximum weight array length
  const maxLength = profilesWithWeights.reduce((max, p) => {
    const flat = Array.isArray(p.weights[0]) ? p.weights.flat() : p.weights;
    return Math.max(max, flat.length);
  }, 0);

  // Initialize aggregated weights
  const aggregatedWeights = new Array(maxLength).fill(0);
  const weightCounts = new Array(maxLength).fill(0);

  // Sum all weights
  for (const profile of profilesWithWeights) {
    const flat = Array.isArray(profile.weights[0]) ? profile.weights.flat() : profile.weights;
    for (let i = 0; i < flat.length; i++) {
      aggregatedWeights[i] += flat[i];
      weightCounts[i]++;
    }
  }

  // Average the weights
  for (let i = 0; i < maxLength; i++) {
    if (weightCounts[i] > 0) {
      aggregatedWeights[i] /= weightCounts[i];
    }
  }

  // Calculate average proficiency and activity
  const avgCorrectProb = ghostProfiles.reduce((sum, p) =>
    sum + (p.proficiency_score || 0), 0) / ghostProfiles.length;

  const totalInteractions = ghostProfiles.reduce((sum, p) =>
    sum + (p.total_interactions || 0), 0);
  const maxExpectedInteractions = ghostProfiles.length * 100;
  const avgActivity = Math.min(totalInteractions / maxExpectedInteractions, 1);

  return {
    weights: aggregatedWeights,
    profileCount: profilesWithWeights.length,
    avgCorrectProb,
    avgActivity
  };
}

/**
 * Get terrain color for a given height value
 * Maps height to a gradient from deep valleys to bright peaks
 *
 * @param {number} height - Height value 0-1
 * @param {number} proficiency - Class proficiency 0-1 (affects color warmth)
 * @returns {Object} RGB color { r, g, b } (0-255)
 */
export function getTerrainColor(height, proficiency = 0.5) {
  // Color gradient based on height and proficiency
  // Low proficiency = cooler blues, high proficiency = warmer greens/golds

  const warmth = proficiency;

  if (height < 0.15) {
    // Deep valleys - dark blue/purple
    return {
      r: Math.floor(20 + warmth * 20),
      g: Math.floor(25 + warmth * 15),
      b: Math.floor(60 - warmth * 20)
    };
  } else if (height < 0.3) {
    // Low areas - blue/teal
    const t = (height - 0.15) / 0.15;
    return {
      r: Math.floor(20 + t * 20 + warmth * 30),
      g: Math.floor(40 + t * 60 + warmth * 30),
      b: Math.floor(80 + t * 40 - warmth * 20)
    };
  } else if (height < 0.5) {
    // Mid-level - cyan/green
    const t = (height - 0.3) / 0.2;
    return {
      r: Math.floor(40 + t * 20 + warmth * 40),
      g: Math.floor(120 + t * 60 + warmth * 20),
      b: Math.floor(120 - t * 40 - warmth * 30)
    };
  } else if (height < 0.7) {
    // Upper areas - green/yellow
    const t = (height - 0.5) / 0.2;
    return {
      r: Math.floor(80 + t * 100 + warmth * 60),
      g: Math.floor(180 + t * 40),
      b: Math.floor(80 - t * 30 - warmth * 20)
    };
  } else if (height < 0.85) {
    // High peaks - gold/orange
    const t = (height - 0.7) / 0.15;
    return {
      r: Math.floor(180 + t * 50 + warmth * 25),
      g: Math.floor(180 - t * 40),
      b: Math.floor(50 + t * 30)
    };
  } else {
    // Summit - bright white/gold
    const t = (height - 0.85) / 0.15;
    return {
      r: Math.floor(230 + t * 25),
      g: Math.floor(200 + t * 40),
      b: Math.floor(150 + t * 80)
    };
  }
}

// Default export for convenience
export default {
  calculateGhostProperties,
  generateFractalPattern,
  generateTerrainHeightmap,
  aggregateClassWeights,
  getTerrainColor,
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
