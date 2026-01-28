/**
 * Ghost Orbits AI Controller
 *
 * AI ghost controller for solo/low-player games in Ghost Orbits.
 * Uses student's trained neural network to drive AI ghost behavior.
 *
 * @version 1.0.0
 */

import * as GhostNetwork from './ghost-network.js';
import {
  MAX_ARENA_SIZE,
  MAX_ENERGY,
  normalize
} from './ghost-orbits-renderer.js';

// ============================================================================
// CONSTANTS
// ============================================================================

// Default arena size for normalization (used when actual size not provided)
const ARENA_SIZE = MAX_ARENA_SIZE;

// Decision rate - how often AI makes decisions (ms)
const AI_DECISION_INTERVAL = 100;

// Behavior thresholds
const AGGRESSION_CHASE_THRESHOLD = 0.6;  // Above this, chase smaller ghosts
const CAUTION_FLEE_THRESHOLD = 0.6;      // Above this, flee from larger ghosts
const SPEED_THRUST_THRESHOLD = 0.3;      // Above this, more frequent thrusting
const EFFICIENCY_ENERGY_THRESHOLD = 0.3; // Below this energy %, conserve

// Distance thresholds (normalized to arena size)
const CLOSE_DISTANCE = 0.15;    // Consider enemy "close" within 15% of arena
const WALL_DANGER_DISTANCE = 0.1; // Start avoiding walls at 10% of arena

// ============================================================================
// VECTOR2 HELPER CLASS
// ============================================================================

/**
 * Simple 2D vector class for AI calculations
 */
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Calculate length of vector
   * @returns {number} Vector magnitude
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Normalize the vector (mutates in place)
   * @returns {Vector2} This vector (for chaining)
   */
  normalize() {
    const len = this.length();
    if (len > 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  /**
   * Add another vector (mutates in place)
   * @param {Vector2} v - Vector to add
   * @returns {Vector2} This vector (for chaining)
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /**
   * Scale the vector (mutates in place)
   * @param {number} scalar - Scale factor
   * @returns {Vector2} This vector (for chaining)
   */
  scale(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * Create a copy of this vector
   * @returns {Vector2} New vector with same values
   */
  clone() {
    return new Vector2(this.x, this.y);
  }

  /**
   * Set values from an object with x, y properties
   * @param {Object} obj - Object with x, y
   * @returns {Vector2} This vector (for chaining)
   */
  setFrom(obj) {
    this.x = obj.x || 0;
    this.y = obj.y || 0;
    return this;
  }

  /**
   * Create from angle (radians)
   * @param {number} angle - Angle in radians
   * @returns {Vector2} Unit vector in that direction
   */
  static fromAngle(angle) {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }
}

// ============================================================================
// AI BEHAVIOR PROFILE
// ============================================================================

/**
 * Behavior profile derived from neural network outputs
 * @typedef {Object} AIBehaviorProfile
 * @property {number} aggression - 0-1: how likely to chase smaller ghosts
 * @property {number} caution - 0-1: how likely to flee from larger ghosts
 * @property {number} speed - 0-1: thrust frequency preference
 * @property {number} efficiency - 0-1: energy conservation tendency
 */

/**
 * Calculate behavior profile from neural network prediction outputs
 * @param {Object} nnOutput - Output from ghost network prediction
 * @param {number} nnOutput.correctProb - Probability of correct answer (0-1)
 * @param {number} nnOutput.hintProb - Probability of using hints (0-1)
 * @param {number} nnOutput.quickProb - Probability of quick answer (0-1)
 * @param {number} nnOutput.time - Predicted time in seconds
 * @returns {AIBehaviorProfile} Behavior profile
 */
function calculateBehaviorProfile(nnOutput) {
  return {
    // High correct_prob -> aggressive, chase smaller ghosts
    aggression: nnOutput.correctProb,

    // High hint_prob -> defensive, avoid conflict
    caution: nnOutput.hintProb,

    // High quick_prob -> erratic, high-speed movement
    speed: nnOutput.quickProb,

    // Low predicted_time -> efficient energy usage
    // Normalize time: 5-60 seconds range, invert so faster = higher efficiency
    efficiency: 1 - Math.min(nnOutput.time / 60, 1)
  };
}

// ============================================================================
// AI GHOST CONTROLLER CLASS
// ============================================================================

/**
 * AI controller that drives ghost behavior using student's neural network
 */
class AIGhostController {
  /**
   * Create a new AIGhostController
   * @param {Object} ghostProfile - Ghost profile from server/storage
   * @param {string} ghostProfile.username - Student username
   * @param {number[][]} ghostProfile.weights - Serialized neural network weights
   * @param {Object} [ghostProfile.properties] - Pre-calculated ghost properties
   */
  constructor(ghostProfile) {
    this.username = ghostProfile.username;
    this.weights = ghostProfile.weights;
    this.properties = ghostProfile.properties || {};

    // Model reference (created on demand)
    this.model = null;
    this.modelReady = false;

    // Behavior profile (calculated from NN or fallback)
    this.behaviorProfile = null;

    // Decision timing
    this.lastDecisionTime = 0;

    // Current target (for consistent behavior between decisions)
    this.currentTarget = null;
    this.targetType = null; // 'chase', 'flee', 'wander', 'territory'

    // Wander state for erratic movement
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderChangeTime = 0;
  }

  /**
   * Initialize the neural network model
   * Call this before using decide() if TensorFlow is available
   * @param {Object} tfInstance - TensorFlow.js instance
   * @returns {Promise<boolean>} Whether initialization succeeded
   */
  async initModel(tfInstance) {
    try {
      if (!tfInstance || !this.weights || this.weights.length === 0) {
        console.log(`[AIGhost] ${this.username}: No TensorFlow or weights, using fallback behavior`);
        this.initFallbackBehavior();
        return false;
      }

      GhostNetwork.initTensorFlow(tfInstance);
      this.model = GhostNetwork.createGhostNetwork();
      GhostNetwork.deserializeWeights(this.model, this.weights);
      this.modelReady = true;

      // Calculate initial behavior profile from NN
      await this.updateBehaviorProfile();

      console.log(`[AIGhost] ${this.username}: Model initialized`);
      return true;
    } catch (err) {
      console.warn(`[AIGhost] ${this.username}: Model init failed:`, err.message);
      this.initFallbackBehavior();
      return false;
    }
  }

  /**
   * Initialize fallback behavior when TensorFlow not available
   * Uses weights to create deterministic behavior patterns
   */
  initFallbackBehavior() {
    this.modelReady = false;

    if (this.weights && this.weights.length > 0) {
      // Use weights to derive deterministic behavior
      // Hash the first layer weights to get pseudo-random but consistent values
      const firstLayerWeights = this.weights[0] || [];
      const sum = firstLayerWeights.reduce((acc, w) => acc + Math.abs(w), 0);
      const avg = sum / Math.max(firstLayerWeights.length, 1);

      // Derive profile from weight statistics
      // These create deterministic but varied behaviors based on training
      const variance = firstLayerWeights.reduce((acc, w) =>
        acc + Math.pow(w - avg, 2), 0) / Math.max(firstLayerWeights.length, 1);

      this.behaviorProfile = {
        aggression: Math.min(1, avg * 2),           // Higher avg = more aggressive
        caution: Math.min(1, Math.sqrt(variance)),  // Higher variance = more cautious
        speed: Math.min(1, Math.abs(firstLayerWeights[0] || 0.5)),
        efficiency: Math.min(1, 1 - avg)            // Lower avg = more efficient
      };
    } else {
      // No weights at all, use random but consistent fallback
      this.behaviorProfile = {
        aggression: 0.5,
        caution: 0.5,
        speed: 0.5,
        efficiency: 0.5
      };
    }

    console.log(`[AIGhost] ${this.username}: Using fallback behavior`, this.behaviorProfile);
  }

  /**
   * Update behavior profile by running NN prediction on synthetic inputs
   * @returns {Promise<void>}
   */
  async updateBehaviorProfile() {
    if (!this.modelReady || !this.model) {
      return;
    }

    try {
      // Create synthetic inputs representing "average" game state
      const syntheticInputs = [
        0.5,  // level_progress (middle)
        0.5,  // time_in_session
        0.3,  // current_streak
        0.6,  // recent_accuracy
        0.7,  // hints_remaining
        0.3,  // problems_this_session
        0.1,  // retry_count
        0.6,  // session_accuracy
        0.5,  // time_of_day
        0.5   // level_tier
      ];

      const prediction = GhostNetwork.predict(this.model, syntheticInputs);
      this.behaviorProfile = calculateBehaviorProfile(prediction);
    } catch (err) {
      console.warn(`[AIGhost] ${this.username}: Profile update failed:`, err.message);
      this.initFallbackBehavior();
    }
  }

  /**
   * Make a decision based on current game state
   * @param {Object} gameState - Current game state
   * @param {Object} gameState.ownGhost - This AI's ghost
   * @param {Array} gameState.enemies - Array of enemy ghost objects
   * @param {number} gameState.arenaSize - Size of the arena
   * @param {Map} [gameState.territoryPercents] - Map of ghost ID to territory %
   * @returns {Promise<Object>} Decision: { thrustDirection: Vector2, shouldThrust: boolean }
   */
  async decide(gameState) {
    const now = Date.now();

    // Rate limit decisions
    if (now - this.lastDecisionTime < AI_DECISION_INTERVAL) {
      return this.lastDecision || { thrustDirection: new Vector2(), shouldThrust: false };
    }
    this.lastDecisionTime = now;

    // Ensure we have a behavior profile
    if (!this.behaviorProfile) {
      this.initFallbackBehavior();
    }

    // Build features from game state
    const features = this.buildFeatures(gameState);

    // If model is ready, use it to adjust behavior dynamically
    if (this.modelReady && this.model) {
      try {
        const prediction = GhostNetwork.predict(this.model, this.buildNNInputs(features));
        this.behaviorProfile = calculateBehaviorProfile(prediction);
      } catch (err) {
        // Continue with existing profile
      }
    }

    // Make decision based on behavior profile and features
    const decision = this.makeDecision(features, gameState);

    this.lastDecision = decision;
    return decision;
  }

  /**
   * Build features from game state
   * @param {Object} gameState - Current game state
   * @returns {Object} Extracted features
   */
  buildFeatures(gameState) {
    const { ownGhost, enemies, arenaSize, territoryPercents } = gameState;
    const size = arenaSize || ARENA_SIZE;

    // Own position
    const ownPos = new Vector2().setFrom(ownGhost.position);
    const ownMass = ownGhost.mass || 1.0;

    // Find nearest enemy
    let nearestEnemy = null;
    let nearestEnemyDistance = Infinity;
    let nearestEnemySize = 1.0;

    for (const enemy of enemies) {
      const enemyPos = new Vector2().setFrom(enemy.position);
      const dist = Math.sqrt(
        Math.pow(enemyPos.x - ownPos.x, 2) +
        Math.pow(enemyPos.y - ownPos.y, 2)
      );

      if (dist < nearestEnemyDistance) {
        nearestEnemyDistance = dist;
        nearestEnemy = enemy;
        nearestEnemySize = enemy.mass || 1.0;
      }
    }

    // Distance to nearest wall
    const distToLeft = ownPos.x;
    const distToRight = size - ownPos.x;
    const distToTop = ownPos.y;
    const distToBottom = size - ownPos.y;
    const distanceToWall = Math.min(distToLeft, distToRight, distToTop, distToBottom);

    // Territory percentage
    let territoryPercent = 0;
    if (territoryPercents && ownGhost.id) {
      territoryPercent = territoryPercents.get(ownGhost.id) || 0;
    }

    return {
      ownPos,
      ownMass,
      ownEnergy: ownGhost.energy || MAX_ENERGY,
      ownVelocity: new Vector2().setFrom(ownGhost.velocity || { x: 0, y: 0 }),
      nearestEnemy,
      nearestEnemyDistance,
      nearestEnemySize,
      distanceToWall,
      territoryPercent,
      arenaSize: size
    };
  }

  /**
   * Build normalized NN inputs from features
   * @param {Object} features - Extracted features
   * @returns {number[]} 10-element input array
   */
  buildNNInputs(features) {
    const {
      territoryPercent,
      nearestEnemyDistance,
      nearestEnemySize,
      ownEnergy,
      ownMass,
      distanceToWall,
      arenaSize
    } = features;

    return [
      territoryPercent / 100,                          // territory (0-1)
      Math.min(nearestEnemyDistance / arenaSize, 1),   // enemy distance normalized
      nearestEnemySize / Math.max(ownMass, 0.1),       // relative enemy size
      ownEnergy / MAX_ENERGY,                          // energy level
      distanceToWall / arenaSize,                      // wall distance normalized
      0.5,  // Placeholder for additional context
      0.5,
      0.5,
      0.5,
      0.5
    ];
  }

  /**
   * Make decision based on behavior profile and features
   * @param {Object} features - Extracted features
   * @param {Object} gameState - Original game state
   * @returns {Object} Decision
   */
  makeDecision(features, gameState) {
    const {
      ownPos,
      ownMass,
      ownEnergy,
      ownVelocity,
      nearestEnemy,
      nearestEnemyDistance,
      nearestEnemySize,
      distanceToWall,
      arenaSize
    } = features;

    const {
      aggression,
      caution,
      speed,
      efficiency
    } = this.behaviorProfile;

    const thrustDirection = new Vector2();
    let shouldThrust = false;

    // Normalized distances for comparison
    const normalizedEnemyDist = nearestEnemyDistance / arenaSize;
    const normalizedWallDist = distanceToWall / arenaSize;
    const energyPercent = ownEnergy / MAX_ENERGY;

    // Priority 1: Avoid walls if too close
    if (normalizedWallDist < WALL_DANGER_DISTANCE) {
      const wallAvoidDir = this.getWallAvoidanceDirection(ownPos, arenaSize);
      thrustDirection.add(wallAvoidDir.scale(2.0)); // Strong wall avoidance
      shouldThrust = true;
    }

    // Priority 2: React to nearby enemies
    if (nearestEnemy && normalizedEnemyDist < CLOSE_DISTANCE) {
      const enemyPos = new Vector2().setFrom(nearestEnemy.position);
      const toEnemy = new Vector2(enemyPos.x - ownPos.x, enemyPos.y - ownPos.y);

      // Can we absorb them? (need 20% larger mass)
      const canAbsorb = ownMass > nearestEnemySize * 1.2;
      // Can they absorb us?
      const canBeAbsorbed = nearestEnemySize > ownMass * 1.2;

      if (canAbsorb && aggression > AGGRESSION_CHASE_THRESHOLD) {
        // Chase smaller ghost
        toEnemy.normalize();
        thrustDirection.add(toEnemy.scale(aggression));
        shouldThrust = true;
        this.targetType = 'chase';
      } else if (canBeAbsorbed && caution > CAUTION_FLEE_THRESHOLD) {
        // Flee from larger ghost
        toEnemy.normalize().scale(-1);
        thrustDirection.add(toEnemy.scale(caution));
        shouldThrust = true;
        this.targetType = 'flee';
      } else {
        // Similar size - territorial behavior or wander
        this.targetType = 'territory';
      }
    }

    // Priority 3: Wander behavior for territory claiming
    if (!shouldThrust || this.targetType === 'territory') {
      const wanderDir = this.getWanderDirection(Date.now());
      thrustDirection.add(wanderDir.scale(0.5));

      // High speed preference = more likely to thrust while wandering
      if (speed > SPEED_THRUST_THRESHOLD && Math.random() < speed) {
        shouldThrust = true;
      }
    }

    // Energy conservation check
    if (efficiency > EFFICIENCY_ENERGY_THRESHOLD && energyPercent < 0.3) {
      // Conserve energy - don't thrust unless necessary
      if (this.targetType !== 'flee' && normalizedWallDist > WALL_DANGER_DISTANCE) {
        shouldThrust = false;
      }
    }

    // High speed ghosts thrust more often
    if (speed > 0.7 && Math.random() < speed * 0.3) {
      shouldThrust = true;
    }

    // Normalize final direction
    if (thrustDirection.length() > 0) {
      thrustDirection.normalize();
    }

    return {
      thrustDirection,
      shouldThrust
    };
  }

  /**
   * Get wall avoidance direction
   * @param {Vector2} pos - Current position
   * @param {number} arenaSize - Arena size
   * @returns {Vector2} Direction away from nearest wall
   */
  getWallAvoidanceDirection(pos, arenaSize) {
    const dir = new Vector2();
    const margin = arenaSize * WALL_DANGER_DISTANCE;

    if (pos.x < margin) dir.x = 1;
    else if (pos.x > arenaSize - margin) dir.x = -1;

    if (pos.y < margin) dir.y = 1;
    else if (pos.y > arenaSize - margin) dir.y = -1;

    return dir.normalize();
  }

  /**
   * Get wander direction (changes periodically)
   * @param {number} currentTime - Current timestamp
   * @returns {Vector2} Wander direction
   */
  getWanderDirection(currentTime) {
    // Change wander direction periodically based on speed trait
    const changeInterval = 2000 - (this.behaviorProfile.speed * 1500); // 500-2000ms

    if (currentTime - this.wanderChangeTime > changeInterval) {
      // Add some randomness, but also some consistency (erratic ghosts change more)
      const angleChange = (Math.random() - 0.5) * Math.PI * this.behaviorProfile.speed;
      this.wanderAngle += angleChange;
      this.wanderChangeTime = currentTime;
    }

    return Vector2.fromAngle(this.wanderAngle);
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.model) {
      try {
        this.model.dispose();
      } catch (err) {
        // Ignore disposal errors
      }
      this.model = null;
    }
    this.modelReady = false;
  }
}

// ============================================================================
// AI GHOST SELECTION HELPER
// ============================================================================

/**
 * Select AI ghosts to fill arena when there aren't enough human players
 * @param {string[]} onlineUsernames - Usernames of currently online human players
 * @param {Object[]} allProfiles - Array of all ghost profiles in class/cartridge
 * @param {number} [targetCount=8] - Target total players in arena
 * @returns {Object[]} Array of ghost profiles for AI controllers
 */
function selectAIGhosts(onlineUsernames, allProfiles, targetCount = 8) {
  // Exclude currently online human players
  const aiCandidates = allProfiles.filter(
    profile => !onlineUsernames.includes(profile.username)
  );

  // Calculate how many AI ghosts we need
  const aiNeeded = Math.max(0, targetCount - onlineUsernames.length);

  if (aiNeeded === 0 || aiCandidates.length === 0) {
    return [];
  }

  // Shuffle and take the needed amount
  return shuffleAndTake(aiCandidates, aiNeeded);
}

/**
 * Shuffle array and take first n elements
 * @param {Array} array - Source array
 * @param {number} n - Number of elements to take
 * @returns {Array} Shuffled subset
 */
function shuffleAndTake(array, n) {
  // Fisher-Yates shuffle
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * Calculate ghost properties from neural network outputs
 * (Matches the spec in ghost-orbits-spec.md Section 4.2)
 * @param {Object} nnOutput - Output from ghost network prediction
 * @returns {Object} Ghost properties for arena
 */
function calculateGhostProperties(nnOutput) {
  return {
    // Mass: 0.5 - 1.5 (based on accuracy)
    mass: 0.5 + nnOutput.correctProb,

    // Thrust efficiency: 0.7 - 1.3 (based on speed)
    thrustEfficiency: 0.7 + nnOutput.quickProb * 0.6,

    // Trail duration: 0.5 - 1.5 (inverse of hint usage)
    trailDuration: 0.5 + (1 - nnOutput.hintProb),

    // Energy regen: 0.7 - 1.3 (inverse of solve time)
    energyRegen: 0.7 + (1 - Math.min(nnOutput.time / 60, 1)) * 0.6,

    // Trail width: 0.8 - 1.2 (based on accuracy)
    trailWidth: 0.8 + nnOutput.correctProb * 0.4
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  AIGhostController,
  selectAIGhosts,
  calculateGhostProperties,
  calculateBehaviorProfile,
  Vector2,
  // Constants
  AI_DECISION_INTERVAL,
  AGGRESSION_CHASE_THRESHOLD,
  CAUTION_FLEE_THRESHOLD,
  SPEED_THRUST_THRESHOLD,
  EFFICIENCY_ENERGY_THRESHOLD,
  CLOSE_DISTANCE,
  WALL_DANGER_DISTANCE
};
