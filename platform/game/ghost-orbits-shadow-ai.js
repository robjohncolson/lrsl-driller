/**
 * Ghost Orbits - Shadow Self AI System
 *
 * The Shadow AI is a mirror opponent that learns from the player's behavior.
 * It records movement patterns and uses them to create an increasingly
 * challenging adversary that reflects the player's own playstyle.
 *
 * Generation scaling makes each successive Shadow smarter and faster.
 *
 * @module ghost-orbits-shadow-ai
 */

import { Vector2, PHYSICS } from '../core/ghost-orbits-physics.js';

/**
 * Pattern segment - captures a moment of player behavior
 */
class PatternSegment {
  constructor(data) {
    this.timestamp = data.timestamp;
    this.position = new Vector2(data.x, data.y);
    this.velocity = new Vector2(data.vx || 0, data.vy || 0);
    this.inputDirection = data.inputDirection || null; // {x, y}
    this.state = data.state || 'free'; // 'free' or 'orbiting'
    this.orbitWellId = data.orbitWellId || null;
    this.energy = data.energy || 1.0;

    // Context data for pattern matching
    this.context = {
      nearestWellDistance: data.nearestWellDistance || Infinity,
      territoryPercent: data.territoryPercent || 0,
      enemyDistance: data.enemyDistance || Infinity,
      enemyMassRatio: data.enemyMassRatio || 1.0, // enemy mass / my mass
      voidDistance: data.voidDistance || Infinity
    };
  }

  /**
   * Calculate similarity to another segment (0 = different, 1 = identical)
   */
  similarityTo(other) {
    const weights = {
      state: 0.3,
      position: 0.2,
      velocity: 0.15,
      nearestWell: 0.15,
      territory: 0.1,
      enemy: 0.1
    };

    let score = 0;

    // State similarity
    if (this.state === other.state) {
      score += weights.state;
    }

    // Position similarity (normalized by arena size, assume 600)
    const positionDiff = this.position.distanceTo(other.position) / 600;
    score += weights.position * Math.max(0, 1 - positionDiff);

    // Velocity similarity
    const velocityDiff = this.velocity.subtract(other.velocity).magnitude() / PHYSICS.MAX_VELOCITY;
    score += weights.velocity * Math.max(0, 1 - velocityDiff);

    // Well distance similarity
    const wellDiff = Math.abs(this.context.nearestWellDistance - other.context.nearestWellDistance) / 300;
    score += weights.nearestWell * Math.max(0, 1 - wellDiff);

    // Territory similarity
    const territoryDiff = Math.abs(this.context.territoryPercent - other.context.territoryPercent);
    score += weights.territory * Math.max(0, 1 - territoryDiff);

    // Enemy similarity
    const enemyDiff = Math.abs(this.context.enemyDistance - other.context.enemyDistance) / 600;
    score += weights.enemy * Math.max(0, 1 - enemyDiff);

    return score;
  }
}

/**
 * Pattern chunk - a sequence of segments (e.g., 5 seconds of behavior)
 */
class PatternChunk {
  constructor(segments, metadata = {}) {
    this.segments = segments;
    this.startTime = segments.length > 0 ? segments[0].timestamp : 0;
    this.endTime = segments.length > 0 ? segments[segments.length - 1].timestamp : 0;
    this.duration = this.endTime - this.startTime;
    this.metadata = metadata;
  }

  /**
   * Get average context for this chunk
   */
  getAverageContext() {
    if (this.segments.length === 0) return null;

    const avg = {
      nearestWellDistance: 0,
      territoryPercent: 0,
      enemyDistance: 0,
      enemyMassRatio: 0,
      voidDistance: 0
    };

    for (const seg of this.segments) {
      avg.nearestWellDistance += seg.context.nearestWellDistance;
      avg.territoryPercent += seg.context.territoryPercent;
      avg.enemyDistance += seg.context.enemyDistance;
      avg.enemyMassRatio += seg.context.enemyMassRatio;
      avg.voidDistance += seg.context.voidDistance;
    }

    const count = this.segments.length;
    for (const key in avg) {
      avg[key] /= count;
    }

    return avg;
  }
}

/**
 * PatternRecorder - Records player input patterns over time
 */
export class PatternRecorder {
  constructor(options = {}) {
    this.chunkDuration = options.chunkDuration || 5000; // 5 seconds per chunk
    this.maxChunks = options.maxChunks || 20; // Store last 20 chunks
    this.recordingInterval = options.recordingInterval || 100; // Record every 100ms

    this.currentSegments = [];
    this.completedChunks = [];
    this.lastRecordTime = 0;
    this.chunkStartTime = 0;
    this.isRecording = false;
  }

  /**
   * Start recording
   */
  start() {
    this.isRecording = true;
    this.chunkStartTime = Date.now();
    this.lastRecordTime = 0;
    this.currentSegments = [];
  }

  /**
   * Stop recording
   */
  stop() {
    this.isRecording = false;
    this._finalizeCurrentChunk();
  }

  /**
   * Record a data point
   * @param {Object} data - Current game state
   */
  record(data) {
    if (!this.isRecording) return;

    const now = Date.now();

    // Check recording interval
    if (now - this.lastRecordTime < this.recordingInterval) {
      return;
    }

    this.lastRecordTime = now;

    // Create segment
    const segment = new PatternSegment({
      timestamp: now,
      x: data.x,
      y: data.y,
      vx: data.vx,
      vy: data.vy,
      inputDirection: data.inputDirection,
      state: data.state,
      orbitWellId: data.orbitWellId,
      energy: data.energy,
      nearestWellDistance: data.nearestWellDistance,
      territoryPercent: data.territoryPercent,
      enemyDistance: data.enemyDistance,
      enemyMassRatio: data.enemyMassRatio,
      voidDistance: data.voidDistance
    });

    this.currentSegments.push(segment);

    // Check if chunk is complete
    if (now - this.chunkStartTime >= this.chunkDuration) {
      this._finalizeCurrentChunk();
    }
  }

  /**
   * Finalize current chunk and start new one
   */
  _finalizeCurrentChunk() {
    if (this.currentSegments.length > 0) {
      const chunk = new PatternChunk(this.currentSegments);
      this.completedChunks.push(chunk);

      // Limit chunk count
      if (this.completedChunks.length > this.maxChunks) {
        this.completedChunks.shift();
      }

      console.log(`[PatternRecorder] Finalized chunk with ${this.currentSegments.length} segments`);
    }

    this.currentSegments = [];
    this.chunkStartTime = Date.now();
  }

  /**
   * Get all recorded patterns
   */
  getPatterns() {
    return {
      chunks: this.completedChunks,
      currentSegments: this.currentSegments,
      totalChunks: this.completedChunks.length,
      totalSegments: this.completedChunks.reduce((sum, chunk) => sum + chunk.segments.length, 0)
    };
  }

  /**
   * Clear all recorded data
   */
  clear() {
    this.currentSegments = [];
    this.completedChunks = [];
    this.chunkStartTime = Date.now();
  }
}

/**
 * PatternPlayer - Replays recorded patterns with context matching
 */
export class PatternPlayer {
  constructor(patterns) {
    this.chunks = patterns?.chunks || [];
    this.currentChunk = null;
    this.currentSegmentIndex = 0;
    this.playbackStartTime = 0;
    this.isPlaying = false;
  }

  /**
   * Find best matching pattern for current context
   * @param {Object} currentContext - Current game state context
   * @returns {PatternChunk|null}
   */
  findBestMatch(currentContext) {
    if (this.chunks.length === 0) return null;

    // Create a pseudo-segment for the current context
    const currentSegment = new PatternSegment({
      timestamp: Date.now(),
      x: currentContext.x || 0,
      y: currentContext.y || 0,
      vx: currentContext.vx || 0,
      vy: currentContext.vy || 0,
      state: currentContext.state || 'free',
      nearestWellDistance: currentContext.nearestWellDistance || Infinity,
      territoryPercent: currentContext.territoryPercent || 0,
      enemyDistance: currentContext.enemyDistance || Infinity,
      enemyMassRatio: currentContext.enemyMassRatio || 1.0,
      voidDistance: currentContext.voidDistance || Infinity
    });

    let bestChunk = null;
    let bestScore = -1;

    // Compare to first segment of each chunk
    for (const chunk of this.chunks) {
      if (chunk.segments.length === 0) continue;

      const firstSegment = chunk.segments[0];
      const score = currentSegment.similarityTo(firstSegment);

      if (score > bestScore) {
        bestScore = score;
        bestChunk = chunk;
      }
    }

    console.log(`[PatternPlayer] Best match score: ${bestScore.toFixed(3)}`);
    return bestChunk;
  }

  /**
   * Start playing a pattern chunk
   * @param {PatternChunk} chunk
   */
  startPlayback(chunk) {
    if (!chunk || chunk.segments.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.currentChunk = chunk;
    this.currentSegmentIndex = 0;
    this.playbackStartTime = Date.now();
    this.isPlaying = true;

    console.log(`[PatternPlayer] Started playback of chunk with ${chunk.segments.length} segments`);
  }

  /**
   * Get current input direction from playback
   * @returns {{x: number, y: number}|null}
   */
  getCurrentInput() {
    if (!this.isPlaying || !this.currentChunk) {
      return null;
    }

    const elapsed = Date.now() - this.playbackStartTime;
    const chunks = this.currentChunk.segments;

    // Find segment corresponding to elapsed time
    const chunkStartTime = chunks[0].timestamp;
    for (let i = this.currentSegmentIndex; i < chunks.length; i++) {
      const segment = chunks[i];
      const segmentTime = segment.timestamp - chunkStartTime;

      if (segmentTime >= elapsed) {
        this.currentSegmentIndex = i;
        return segment.inputDirection;
      }
    }

    // Playback finished
    this.isPlaying = false;
    return null;
  }

  /**
   * Check if playback is active
   */
  isPlaybackActive() {
    return this.isPlaying;
  }

  /**
   * Stop playback
   */
  stopPlayback() {
    this.isPlaying = false;
    this.currentChunk = null;
    this.currentSegmentIndex = 0;
  }
}

/**
 * ShadowAI - Main AI controller for the Shadow Self (v2 - 12 Orbits style)
 * v2: No thrust controls - only decides when to enter/exit orbits
 */
export class ShadowAI {
  constructor(ghostProperties, generation = 1, patterns = null) {
    // Ghost properties (from NN) - kept for compatibility but not used for movement
    this.mass = ghostProperties.mass || 1.0;
    this.trailDuration = ghostProperties.trailDuration || 1.0;

    // AI properties
    this.generation = generation;
    this.patternPlayer = patterns ? new PatternPlayer(patterns) : null;

    // Decision making - v2 only cares about orbit timing
    this.currentBehavior = 'free_flight'; // free_flight or orbiting
    this.targetRecord = null;
    this.lastDecisionTime = 0;
    this.decisionDelay = this._getDecisionDelay();

    // State tracking
    this.position = new Vector2(0, 0);
    this.velocity = new Vector2(0, 0);
    this.isOrbiting = false;
    this.wasOrbiting = false;
    this.orbitStartTime = 0;

    // v2: Orbit decision parameters
    this.orbitCheckCooldown = 200; // ms between orbit entry checks
    this.lastOrbitCheck = 0;
    this.minOrbitDuration = 500; // Min ms to stay in orbit before releasing
    this.maxOrbitDuration = 2500; // Max ms before forced release

    // Pattern vs reactive balance (generation affects this)
    this.patternWeight = this._getPatternWeight();
    this.reactiveWeight = 1.0 - this.patternWeight;
  }

  /**
   * Calculate decision delay based on generation (higher gen = faster)
   */
  _getDecisionDelay() {
    const baseDelay = 500; // 500ms base delay
    const reductionPerGen = 0.05; // 5% faster per generation
    const minDelay = 100; // Minimum 100ms

    const delay = baseDelay * Math.pow(1 - reductionPerGen, this.generation - 1);
    return Math.max(minDelay, delay);
  }

  /**
   * Calculate pattern vs reactive balance based on generation
   * Gen 1: 90% pattern, 10% reactive
   * Gen 2+: Gradually shift towards reactive
   */
  _getPatternWeight() {
    if (this.generation === 1) {
      return 0.9; // Pure mirror
    }

    // Decay pattern weight: 0.9 -> 0.5 over 10 generations
    const decay = 0.05 * (this.generation - 1);
    return Math.max(0.5, 0.9 - decay);
  }

  /**
   * Main AI update - called every frame (v2 - orbit decisions only)
   * @param {number} deltaTime - Time since last update (seconds)
   * @param {Object} gameState - Current game state
   * @returns {Object} AI decision {wantsOrbit: boolean, wantsRelease: boolean}
   */
  update(deltaTime, gameState) {
    // Update internal state
    this.position.x = gameState.selfX;
    this.position.y = gameState.selfY;
    this.velocity.x = gameState.selfVx || 0;
    this.velocity.y = gameState.selfVy || 0;

    // Track orbit state transitions
    const newIsOrbiting = gameState.selfIsOrbiting || false;
    if (newIsOrbiting && !this.wasOrbiting) {
      // Just entered orbit
      this.orbitStartTime = Date.now();
    }
    this.wasOrbiting = this.isOrbiting;
    this.isOrbiting = newIsOrbiting;

    const now = Date.now();
    const decision = {
      wantsOrbit: false,
      wantsRelease: false
    };

    // v2: AI only decides orbit entry/exit timing
    if (this.isOrbiting) {
      // Check if should release from orbit
      decision.wantsRelease = this._shouldReleaseFromOrbit(gameState, now);
    } else {
      // Check if should enter orbit (if near a record)
      if (now - this.lastOrbitCheck > this.orbitCheckCooldown) {
        this.lastOrbitCheck = now;
        decision.wantsOrbit = this._shouldEnterOrbit(gameState);
      }
    }

    return decision;
  }

  /**
   * Decide if should enter orbit when near a record (v2)
   * @param {Object} gameState
   * @returns {boolean}
   */
  _shouldEnterOrbit(gameState) {
    const records = gameState.wells || [];
    if (records.length === 0) return false;

    // Find nearest record
    let nearestRecord = null;
    let minDist = Infinity;

    for (const record of records) {
      const dist = this.position.distanceTo(record.position);
      if (dist < minDist) {
        minDist = dist;
        nearestRecord = record;
      }
    }

    // Check if within capture range (default ~70px)
    const captureRange = nearestRecord?.captureRadius || 70;
    if (minDist > captureRange) {
      return false;
    }

    // Strategic decision: should we orbit?
    // Higher generations are smarter about when to orbit

    // 1. Always orbit if we need to change direction significantly
    // (heading towards wall or away from good position)
    const heading = Math.atan2(this.velocity.y, this.velocity.x);
    const recordAngle = Math.atan2(
      nearestRecord.position.y - this.position.y,
      nearestRecord.position.x - this.position.x
    );

    // 2. Probability-based decision (higher gen = more strategic)
    const orbitChance = 0.3 + (this.generation * 0.05); // 35% at gen 1, up to 80%
    if (Math.random() > orbitChance) {
      return false;
    }

    console.log(`[ShadowAI] Entering orbit at record (dist: ${minDist.toFixed(0)})`);
    return true;
  }

  /**
   * Decide if should release from orbit (v2)
   * @param {Object} gameState
   * @param {number} now - Current timestamp
   * @returns {boolean}
   */
  _shouldReleaseFromOrbit(gameState, now) {
    const orbitDuration = now - this.orbitStartTime;

    // 1. Too early - stay in orbit
    if (orbitDuration < this.minOrbitDuration) {
      return false;
    }

    // 2. Too long - force release
    if (orbitDuration > this.maxOrbitDuration) {
      console.log('[ShadowAI] Releasing from orbit (max duration)');
      return true;
    }

    // 3. Strategic release based on tangent direction
    // Calculate if current tangent direction is favorable
    const playerPos = new Vector2(gameState.playerX, gameState.playerY);
    const toPlayer = playerPos.subtract(this.position);
    const tangent = this.velocity.normalize();

    // Dot product: positive if tangent points toward player area
    const alignment = tangent.dot(toPlayer.normalize());

    // Higher gen = better at timing release
    const releaseThreshold = 0.2 + (this.generation * 0.1); // 0.3 at gen 1, up to 0.7

    if (alignment > releaseThreshold) {
      console.log(`[ShadowAI] Releasing from orbit (good alignment: ${alignment.toFixed(2)})`);
      return true;
    }

    // 4. Random release chance (higher gen = more patient/strategic)
    const randomReleaseChance = Math.max(0.05, 0.2 - (this.generation * 0.02));
    if (Math.random() < randomReleaseChance) {
      console.log('[ShadowAI] Releasing from orbit (random)');
      return true;
    }

    return false;
  }

  /**
   * Decide which behavior mode to use (legacy - kept for compatibility)
   */
  _decideBehaviorMode(gameState) {
    const {
      playerX, playerY, playerMass,
      wells, territoryPercent,
      voidX, voidY
    } = gameState;

    // Calculate distances
    const playerDist = this.position.distanceTo(new Vector2(playerX, playerY));
    const massRatio = this.mass / (playerMass || 1.0);

    // Behavior priority hierarchy

    // 1. Flee if player is much larger and close
    if (massRatio < 0.8 && playerDist < 150) {
      this.currentBehavior = 'flee';
      return;
    }

    // 2. Chase if we're larger and player is close
    if (massRatio > 1.2 && playerDist < 200) {
      this.currentBehavior = 'chase';
      return;
    }

    // 3. If already orbiting, stay in orbit mode (release logic handles exit)
    // But only briefly - orbit behavior just means "wait to slingshot"
    if (this.isOrbiting) {
      this.currentBehavior = 'orbit';
      return;
    }

    // 4. Primary goal: claim territory by moving around
    // This is what Shadow should mostly do - leave trails to claim ground
    if (territoryPercent < 0.6) {
      this.currentBehavior = 'claim_territory';
      return;
    }

    // 5. If we have good territory, seek wells for strategic advantage
    if (wells && wells.length > 0) {
      const nearbyWell = this._findNearestFriendlyWell(wells);
      if (nearbyWell && this.position.distanceTo(nearbyWell.position) > 100) {
        this.currentBehavior = 'seek_well';
        this.targetWell = nearbyWell;
        return;
      }
    }

    // 6. Default: keep claiming territory
    this.currentBehavior = 'claim_territory';
  }

  /**
   * Get current decision (input direction and release command)
   */
  _getCurrentDecision(gameState) {
    // Blend pattern playback with reactive AI
    let patternInput = null;
    let reactiveInput = null;

    // Try pattern playback
    if (this.patternPlayer) {
      if (!this.patternPlayer.isPlaybackActive()) {
        // Start new pattern playback based on current context
        const bestChunk = this.patternPlayer.findBestMatch({
          x: this.position.x,
          y: this.position.y,
          vx: this.velocity.x,
          vy: this.velocity.y,
          state: this.isOrbiting ? 'orbiting' : 'free',
          nearestWellDistance: this._getNearestWellDistance(gameState.wells),
          territoryPercent: gameState.territoryPercent || 0,
          enemyDistance: this.position.distanceTo(new Vector2(gameState.playerX, gameState.playerY)),
          enemyMassRatio: (gameState.playerMass || 1.0) / this.mass,
          voidDistance: this.position.distanceTo(new Vector2(gameState.voidX, gameState.voidY))
        });

        if (bestChunk) {
          this.patternPlayer.startPlayback(bestChunk);
        }
      }

      patternInput = this.patternPlayer.getCurrentInput();
    }

    // Get reactive input based on behavior
    reactiveInput = this._getReactiveInput(gameState);

    // Blend inputs based on generation
    let finalInput = null;
    if (patternInput && reactiveInput) {
      // Weighted blend
      finalInput = {
        x: patternInput.x * this.patternWeight + reactiveInput.x * this.reactiveWeight,
        y: patternInput.y * this.patternWeight + reactiveInput.y * this.reactiveWeight
      };
    } else {
      finalInput = patternInput || reactiveInput;
    }

    // Normalize if needed
    if (finalInput) {
      const mag = Math.sqrt(finalInput.x ** 2 + finalInput.y ** 2);
      if (mag > 1.0) {
        finalInput.x /= mag;
        finalInput.y /= mag;
      }
    }

    // Check if should release from orbit
    const releaseDirection = this.shouldRelease(gameState);

    return {
      inputDirection: finalInput,
      releaseDirection: releaseDirection
    };
  }

  /**
   * Get reactive AI input based on current behavior
   */
  _getReactiveInput(gameState) {
    switch (this.currentBehavior) {
      case 'seek_well':
        return this._getSeekWellInput(gameState);

      case 'orbit':
        return { x: 0, y: 0 }; // No input while orbiting

      case 'chase':
        return this._getChaseInput(gameState);

      case 'flee':
        return this._getFleeInput(gameState);

      case 'claim_territory':
        return this._getClaimTerritoryInput(gameState);

      default:
        return { x: 0, y: 0 };
    }
  }

  /**
   * Get input direction for seeking nearest well
   */
  _getSeekWellInput(gameState) {
    if (!this.targetWell) {
      this.targetWell = this._findNearestFriendlyWell(gameState.wells);
    }

    if (!this.targetWell) {
      // No well found, move away from void
      const voidPos = new Vector2(gameState.voidX, gameState.voidY);
      const awayFromVoid = this.position.subtract(voidPos).normalize();
      return { x: awayFromVoid.x, y: awayFromVoid.y };
    }

    const toWell = this.targetWell.position.subtract(this.position).normalize();
    return { x: toWell.x, y: toWell.y };
  }

  /**
   * Get input direction for chasing player
   */
  _getChaseInput(gameState) {
    const playerPos = new Vector2(gameState.playerX, gameState.playerY);

    // Predict player position based on velocity (higher gen = better prediction)
    const predictionTime = 0.2 * Math.min(this.generation / 5, 1.5);
    const predictedPos = playerPos.add(
      new Vector2(gameState.playerVx || 0, gameState.playerVy || 0).multiply(predictionTime * 60)
    );

    const toPredictedPos = predictedPos.subtract(this.position).normalize();
    return { x: toPredictedPos.x, y: toPredictedPos.y };
  }

  /**
   * Get input direction for fleeing from player
   */
  _getFleeInput(gameState) {
    const playerPos = new Vector2(gameState.playerX, gameState.playerY);
    const awayFromPlayer = this.position.subtract(playerPos).normalize();

    // Also avoid void while fleeing
    const voidPos = new Vector2(gameState.voidX, gameState.voidY);
    const voidDist = this.position.distanceTo(voidPos);

    if (voidDist < 100) {
      const awayFromVoid = this.position.subtract(voidPos).normalize();
      // Blend away from both
      return {
        x: (awayFromPlayer.x + awayFromVoid.x) / 2,
        y: (awayFromPlayer.y + awayFromVoid.y) / 2
      };
    }

    return { x: awayFromPlayer.x, y: awayFromPlayer.y };
  }

  /**
   * Get input direction for claiming territory (circle around)
   */
  _getClaimTerritoryInput(gameState) {
    // Move in circular patterns to claim territory
    // Use current velocity to determine tangent direction
    const speed = this.velocity.magnitude();

    if (speed > 0.5) {
      // Continue tangent to current motion
      const tangent = this.velocity.perpendicular().normalize();
      return { x: tangent.x, y: tangent.y };
    } else {
      // Start moving in a random direction away from void
      const voidPos = new Vector2(gameState.voidX, gameState.voidY);
      const awayFromVoid = this.position.subtract(voidPos).normalize();
      const perpendicular = awayFromVoid.perpendicular();
      return { x: perpendicular.x, y: perpendicular.y };
    }
  }

  /**
   * Get input direction (for external use)
   * @returns {{x: number, y: number}|null}
   */
  getInputDirection() {
    // This is called externally, but we need game state to make decisions
    // Return null here - the update() method should be used instead
    return null;
  }

  /**
   * Determine if should release from orbit
   * @param {Object} gameState
   * @returns {string|null} Direction string ('up', 'down', 'left', 'right') or null
   */
  shouldRelease(gameState) {
    if (!this.isOrbiting) return null;

    const {
      playerX, playerY, territoryPercent,
      wells, voidX, voidY
    } = gameState;

    const playerPos = new Vector2(playerX, playerY);
    const playerDist = this.position.distanceTo(playerPos);
    const massRatio = this.mass / (gameState.playerMass || 1.0);
    const voidPos = new Vector2(voidX, voidY);
    const orbitTime = Date.now() - this.orbitStartTime;

    // Release conditions - more aggressive to avoid camping

    // 1. Release to chase if player is nearby and we're larger
    if (massRatio > 1.2 && playerDist < 200) {
      console.log('[ShadowAI] Releasing to chase player');
      return this._getSlingshotDirection(playerPos);
    }

    // 2. Release if player is within absorption range and we need to flee
    if (massRatio < 0.8 && playerDist < 150) {
      console.log('[ShadowAI] Releasing to flee from larger player');
      const awayFromPlayer = this.position.subtract(playerPos).normalize();
      const fleeTarget = this.position.add(awayFromPlayer.multiply(200));
      return this._getSlingshotDirection(fleeTarget);
    }

    // 3. Always release after short orbit (1-2 seconds) to claim territory
    // Higher generations orbit shorter before releasing
    const minOrbitTime = Math.max(800, 2000 - (this.generation * 100));
    if (orbitTime > minOrbitTime) {
      // Low territory: aggressive release to claim
      if (territoryPercent < 0.3) {
        console.log(`[ShadowAI] Releasing to claim territory (${(territoryPercent * 100).toFixed(1)}%)`);
        const awayFromVoid = this.position.subtract(voidPos).normalize();
        const awayFromPlayer = this.position.subtract(playerPos).normalize();
        const targetDir = awayFromVoid.add(awayFromPlayer).normalize();
        const targetPos = this.position.add(targetDir.multiply(150));
        return this._getSlingshotDirection(targetPos);
      }

      // Moderate territory: release towards player's area to contest
      if (territoryPercent < 0.6 && orbitTime > minOrbitTime + 500) {
        console.log('[ShadowAI] Releasing to contest territory');
        // Move tangent to current orbit direction, biased away from void
        const awayFromVoid = this.position.subtract(voidPos).normalize();
        const tangent = awayFromVoid.perpendicular();
        const targetPos = this.position.add(tangent.multiply(150));
        return this._getSlingshotDirection(targetPos);
      }

      // High territory: still release occasionally to maintain presence
      if (orbitTime > 3000) {
        console.log('[ShadowAI] Releasing to patrol (long orbit timeout)');
        const awayFromVoid = this.position.subtract(voidPos).normalize();
        const targetPos = this.position.add(awayFromVoid.multiply(100));
        return this._getSlingshotDirection(targetPos);
      }
    }

    // 4. Release if low energy (orbit doesn't cost energy but we may need to move)
    if (this.energy < 0.3 && orbitTime > 500) {
      const nearestWell = this._findNearestFriendlyWell(wells);
      if (nearestWell && this.position.distanceTo(nearestWell.position) > 50) {
        console.log('[ShadowAI] Releasing to seek well (low energy)');
        return this._getSlingshotDirection(nearestWell.position);
      }
    }

    return null;
  }

  /**
   * Calculate best slingshot direction towards a target
   * Higher generations have better angle calculation
   */
  _getSlingshotDirection(targetPos) {
    const toTarget = targetPos.subtract(this.position).normalize();

    // Higher generations can calculate optimal slingshot angles
    const skillLevel = Math.min(this.generation / 10, 1.0);

    if (skillLevel < 0.3) {
      // Low skill: just release in general direction
      return this._vectorToDirection(toTarget);
    } else {
      // Higher skill: calculate optimal release angle considering current velocity
      // Optimal release is perpendicular to velocity when it aligns with target
      const velocityAngle = Math.atan2(this.velocity.y, this.velocity.x);
      const targetAngle = Math.atan2(toTarget.y, toTarget.x);

      // Find which cardinal direction best matches target
      return this._angleToDirection(targetAngle);
    }
  }

  /**
   * Convert vector to direction string
   */
  _vectorToDirection(vec) {
    // Choose dominant axis
    if (Math.abs(vec.x) > Math.abs(vec.y)) {
      return vec.x > 0 ? 'right' : 'left';
    } else {
      return vec.y > 0 ? 'down' : 'up';
    }
  }

  /**
   * Convert angle to direction string
   */
  _angleToDirection(angle) {
    // Normalize angle to [0, 2π]
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;

    // Divide into 4 quadrants
    const octant = Math.floor((angle + Math.PI / 4) / (Math.PI / 2));
    const directions = ['right', 'down', 'left', 'up'];
    return directions[octant % 4];
  }

  /**
   * Find nearest friendly or neutral well
   */
  _findNearestFriendlyWell(wells) {
    if (!wells || wells.length === 0) return null;

    let nearest = null;
    let minDist = Infinity;

    for (const well of wells) {
      // Accept friendly or neutral wells
      if (well.ownerId !== null && well.ownerId !== 'shadow') {
        continue; // Skip enemy wells
      }

      const dist = this.position.distanceTo(well.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = well;
      }
    }

    return nearest;
  }

  /**
   * Get distance to nearest well
   */
  _getNearestWellDistance(wells) {
    const nearest = this._findNearestFriendlyWell(wells);
    return nearest ? this.position.distanceTo(nearest.position) : Infinity;
  }

  /**
   * Set orbit start time (called when orbit is entered)
   */
  enterOrbit() {
    this.orbitStartTime = Date.now();
  }
}

export default ShadowAI;
