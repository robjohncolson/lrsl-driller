/**
 * Ghost Orbits - Trails Mode
 *
 * Snake-style survival mode where ghosts leave color trails behind them.
 * Collect neutral spheres to grow trail length. Touching ANY trail = DEATH.
 * Launch from orbit to shoot one trail segment as a projectile.
 *
 * Win conditions:
 * - Elimination: Last ghost standing (opponent loses all lives)
 * - Score limit: First to reach kill count
 * - Timeout: Higher kill count when timer expires
 *
 * @module trails-mode
 * @version 1.0.0
 */

import { OrbitsMode } from '../core/orbits-mode-interface.js';
import { TrailsAI } from './trails-ai.js';

/**
 * Trails mode configuration constants
 */
export const TRAILS_CONFIG = {
  // Spheres
  SPHERE_COUNT: 20,
  SPHERE_RESPAWN_MS: 3000,
  SPHERE_RADIUS: 12,
  SPHERE_COLLECT_RADIUS: 25, // Slightly larger for easier collection

  // Trails
  SEGMENTS_PER_SPHERE: 5,
  TRAIL_RECORD_INTERVAL: 50,    // ms between segment drops
  TRAIL_LIFETIME_MS: 8000,      // segments fade after this
  TRAIL_SEGMENT_RADIUS: 4,

  // Projectiles
  PROJECTILE_SPEED_MULT: 1.5,   // 1.5x ghost velocity
  PROJECTILE_LIFETIME_MS: 5000,
  PROJECTILE_RADIUS: 6,

  // Lives
  STARTING_LIVES: 3,
  INVULNERABILITY_MS: 1500,

  // Anti-camping
  MAX_SAFE_ORBIT_MS: 3000,      // trails become unsafe after 3s orbiting
  ORBIT_DECAY_WARNING_MS: 2000, // visual warning starts at 2s

  // Match
  ROUND_DURATION_MS: 180000,    // 3 minutes
  SCORE_LIMIT: 5                // kills to win (optional mode)
};

/**
 * Generate a unique ID
 * @returns {string}
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Calculate distance between two points
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number}
 */
function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Trails Mode - Snake-style survival with trail hazards
 * @extends OrbitsMode
 */
export class TrailsMode extends OrbitsMode {
  /**
   * Create Trails mode instance
   * @param {Object} config - Mode configuration
   * @param {number} config.arenaSize - Arena size in pixels
   * @param {Object} config.ghostProperties - Player's NN-derived properties
   * @param {string} config.cartridgeId - Cartridge ID for localStorage
   * @param {string} config.username - Player's username
   * @param {Object} [config.physicsEngine] - Physics engine reference
   */
  constructor(config) {
    super(config);

    // Arena configuration
    this.arenaSize = config.arenaSize || 800;
    this.ghostProperties = config.ghostProperties || {};
    this.cartridgeId = config.cartridgeId || 'default';
    this.username = config.username || 'player';
    this.physicsEngine = config.physicsEngine || null;

    // Entity collections
    this.spheres = [];           // CollectSphere[]
    this.trailBuffers = new Map(); // ghostId -> TrailSegment[]
    this.projectiles = [];       // Projectile[]

    // Trail length per ghost (how many segments they can have)
    this.trailLengths = new Map(); // ghostId -> number

    // Last trail drop time per ghost
    this.lastTrailTime = new Map(); // ghostId -> timestamp

    // Lives system
    this.playerLives = TRAILS_CONFIG.STARTING_LIVES;
    this.shadowLives = TRAILS_CONFIG.STARTING_LIVES;
    this.playerInvulnerableUntil = 0;
    this.shadowInvulnerableUntil = 0;
    this.invulnerabilityDuration = config.ghostProperties?.respawnSpeed
      ? config.ghostProperties.respawnSpeed * 1000
      : TRAILS_CONFIG.INVULNERABILITY_MS;

    // Orbit tracking for anti-camping
    this.orbitStartTime = new Map(); // ghostId -> timestamp when started orbiting

    // Kill counts
    this.playerKills = 0;
    this.shadowKills = 0;

    // Match timing
    this.matchStartTime = null;
    this.matchTimeRemaining = TRAILS_CONFIG.ROUND_DURATION_MS;

    // Match result
    this.matchResult = null;
    this.winCondition = null;

    // Shadow AI
    this.shadowAI = null;
    this.shadowGhostId = 'shadow_self';
    this.shadowMovementState = 'FREE_FLIGHT';

    // Colors
    this.playerColor = config.ghostProperties?.color || '#4488ff';
    this.shadowColor = this._getComplementaryColor(this.playerColor);
  }

  /**
   * Initialize the trails mode
   * @param {Object} [config] - Additional configuration
   * @returns {Promise<void>}
   */
  async init(config = {}) {
    if (config.arenaSize) this.arenaSize = config.arenaSize;
    if (config.physicsEngine) this.physicsEngine = config.physicsEngine;

    // Get records from physics engine for sphere placement avoidance
    const records = this.physicsEngine?.getRecords() || [];

    // Initialize spheres
    this._initializeSpheres(records);

    // Initialize trail buffers for player and shadow
    this.trailBuffers.set('player', []);
    this.trailBuffers.set(this.shadowGhostId, []);
    this.trailLengths.set('player', 0);
    this.trailLengths.set(this.shadowGhostId, 0);
    this.lastTrailTime.set('player', 0);
    this.lastTrailTime.set(this.shadowGhostId, 0);

    // Initialize Trails AI
    this.shadowAI = new TrailsAI({
      arenaSize: this.arenaSize,
      ghostId: this.shadowGhostId
    });

    // Reset match state
    this.matchStartTime = Date.now();
    this.matchTimeRemaining = TRAILS_CONFIG.ROUND_DURATION_MS;
    this.playerLives = TRAILS_CONFIG.STARTING_LIVES;
    this.shadowLives = TRAILS_CONFIG.STARTING_LIVES;
    this.playerKills = 0;
    this.shadowKills = 0;
    this.playerInvulnerableUntil = 0;
    this.shadowInvulnerableUntil = 0;
    this.matchResult = null;
    this.winCondition = null;

    this.initialized = true;
    console.log(`[TrailsMode] Initialized with ${this.spheres.length} spheres`);
  }

  /**
   * Initialize collect spheres
   * @param {Array} records - Records to avoid when placing spheres
   * @private
   */
  _initializeSpheres(records) {
    this.spheres = [];
    const margin = 50;
    const minDistance = TRAILS_CONFIG.SPHERE_RADIUS * 4;

    for (let i = 0; i < TRAILS_CONFIG.SPHERE_COUNT; i++) {
      let x, y, attempts = 0;
      const maxAttempts = 50;

      // Find a valid position
      do {
        x = margin + Math.random() * (this.arenaSize - margin * 2);
        y = margin + Math.random() * (this.arenaSize - margin * 2);
        attempts++;
      } while (attempts < maxAttempts && !this._isValidSpherePosition(x, y, records, minDistance));

      this.spheres.push({
        id: generateId(),
        x,
        y,
        state: 'ACTIVE',
        respawnAt: 0,
        radius: TRAILS_CONFIG.SPHERE_RADIUS,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  /**
   * Check if position is valid for sphere placement
   * @private
   */
  _isValidSpherePosition(x, y, records, minDistance) {
    // Check against other spheres
    for (const sphere of this.spheres) {
      if (distance(x, y, sphere.x, sphere.y) < minDistance) {
        return false;
      }
    }

    // Check against records (safe zones)
    for (const record of records) {
      const rx = record.position?.x || record.x;
      const ry = record.position?.y || record.y;
      const rRadius = record.radius || 50;
      if (distance(x, y, rx, ry) < rRadius + TRAILS_CONFIG.SPHERE_RADIUS) {
        return false;
      }
    }

    return true;
  }

  /**
   * Per-frame update
   * @param {number} dt - Delta time in seconds
   * @param {number} time - Current timestamp in ms
   * @param {Object} localGhost - Player ghost object
   * @param {Object} input - Input state
   */
  step(dt, time, localGhost, input) {
    if (!this.initialized || this.matchResult !== null) return;

    const currentTime = time || Date.now();

    // Update match time
    if (this.matchStartTime) {
      const elapsed = currentTime - this.matchStartTime;
      this.matchTimeRemaining = TRAILS_CONFIG.ROUND_DURATION_MS - elapsed;
    }

    // Update sphere pulse animations
    this._updateSpheres(dt, currentTime);

    // Update trail segments (age and remove old ones)
    this._updateTrails(currentTime);

    // Update projectiles
    this._updateProjectiles(dt, currentTime);

    // Record trail segments for moving ghosts
    this._recordTrailSegment('player', localGhost, currentTime);
    if (input.shadowGhost) {
      this._recordTrailSegment(this.shadowGhostId, input.shadowGhost, currentTime);
    }

    // Track orbit duration for anti-camping
    this._updateOrbitTracking('player', input.ghostMovementState, currentTime);
    if (input.shadowGhost) {
      this._updateOrbitTracking(this.shadowGhostId, input.shadowMovementState, currentTime);
    }

    // Check collisions for player
    const now = Date.now();
    const playerOrbiting = input.ghostMovementState === 'ORBITING';
    const playerOrbitUnsafe = this._isOrbitUnsafe('player', currentTime);

    if ((!playerOrbiting || playerOrbitUnsafe) && now > this.playerInvulnerableUntil) {
      // Check sphere collection
      this._checkSphereCollection('player', localGhost, currentTime);

      // Check trail collision
      const trailHit = this._checkTrailCollision('player', localGhost);
      if (trailHit) {
        const damageResult = this.handleDamage('player', trailHit.ownerId, 'trail_collision');
        input.damageResult = damageResult;
        if (damageResult.eliminated) {
          this.shadowKills++;
        }
      }

      // Check projectile collision
      const projectileHit = this._checkProjectileCollision('player', localGhost);
      if (projectileHit) {
        const damageResult = this.handleDamage('player', projectileHit.ownerId, 'projectile_hit');
        input.damageResult = damageResult;
        if (damageResult.eliminated) {
          this.shadowKills++;
        }
        // Remove the projectile
        this.projectiles = this.projectiles.filter(p => p.id !== projectileHit.id);
      }
    }

    // Check collisions for shadow
    const shadowOrbiting = input.shadowMovementState === 'ORBITING';
    const shadowOrbitUnsafe = this._isOrbitUnsafe(this.shadowGhostId, currentTime);

    if (input.shadowGhost && (!shadowOrbiting || shadowOrbitUnsafe) && now > this.shadowInvulnerableUntil) {
      // Check sphere collection
      this._checkSphereCollection(this.shadowGhostId, input.shadowGhost, currentTime);

      // Check trail collision
      const trailHit = this._checkTrailCollision(this.shadowGhostId, input.shadowGhost);
      if (trailHit) {
        const damageResult = this.handleDamage('shadow', trailHit.ownerId, 'trail_collision');
        input.shadowDamageResult = damageResult;
        if (damageResult.eliminated) {
          this.playerKills++;
        }
      }

      // Check projectile collision
      const projectileHit = this._checkProjectileCollision(this.shadowGhostId, input.shadowGhost);
      if (projectileHit) {
        const damageResult = this.handleDamage('shadow', projectileHit.ownerId, 'projectile_hit');
        input.shadowDamageResult = damageResult;
        if (damageResult.eliminated) {
          this.playerKills++;
        }
        // Remove the projectile
        this.projectiles = this.projectiles.filter(p => p.id !== projectileHit.id);
      }
    }

    // Update Shadow AI
    if (this.shadowAI && input.shadowGhost) {
      const gameState = this._buildAIGameState(localGhost, input.shadowGhost, currentTime);
      const aiDecision = this.shadowAI.update(dt, gameState);
      input.aiDecision = aiDecision;
    }

    // Pass orbit warning states to renderer
    input.playerOrbitWarning = this._isOrbitWarning('player', currentTime);
    input.playerOrbitUnsafe = playerOrbitUnsafe;
    input.shadowOrbitWarning = this._isOrbitWarning(this.shadowGhostId, currentTime);
    input.shadowOrbitUnsafe = shadowOrbitUnsafe;
  }

  /**
   * Update sphere states and animations
   * @private
   */
  _updateSpheres(dt, currentTime) {
    for (const sphere of this.spheres) {
      // Animate pulse
      sphere.pulsePhase += dt * 3;

      // Handle respawning
      if (sphere.state === 'RESPAWNING' && currentTime >= sphere.respawnAt) {
        sphere.state = 'ACTIVE';
      }
    }
  }

  /**
   * Update trail segments - age and remove old ones
   * @private
   */
  _updateTrails(currentTime) {
    for (const [ghostId, segments] of this.trailBuffers) {
      // Filter out expired segments
      const filtered = segments.filter(seg => {
        const age = currentTime - seg.createdAt;
        return age < TRAILS_CONFIG.TRAIL_LIFETIME_MS;
      });
      this.trailBuffers.set(ghostId, filtered);
    }
  }

  /**
   * Update projectiles - move and remove expired
   * @private
   */
  _updateProjectiles(dt, currentTime) {
    this.projectiles = this.projectiles.filter(proj => {
      // Move projectile
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      // Check lifetime
      const age = currentTime - proj.createdAt;
      if (age >= TRAILS_CONFIG.PROJECTILE_LIFETIME_MS) {
        return false;
      }

      // Check wall collision
      if (proj.x < 0 || proj.x > this.arenaSize ||
          proj.y < 0 || proj.y > this.arenaSize) {
        return false;
      }

      // Check record collision (absorbed by safe zones)
      const records = this.physicsEngine?.getRecords() || [];
      for (const record of records) {
        const rx = record.position?.x || record.x;
        const ry = record.position?.y || record.y;
        const rRadius = record.radius || 50;
        if (distance(proj.x, proj.y, rx, ry) < rRadius) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Record a trail segment for a ghost
   * @private
   */
  _recordTrailSegment(ghostId, ghost, currentTime) {
    if (!ghost) return;

    const lastTime = this.lastTrailTime.get(ghostId) || 0;
    const trailLength = this.trailLengths.get(ghostId) || 0;

    // Only record if enough time has passed and ghost has trail capacity
    if (trailLength <= 0) return;
    if (currentTime - lastTime < TRAILS_CONFIG.TRAIL_RECORD_INTERVAL) return;

    // Don't record while orbiting
    if (ghost.isOrbiting) return;

    this.lastTrailTime.set(ghostId, currentTime);

    const segments = this.trailBuffers.get(ghostId) || [];
    const color = ghostId === 'player' ? this.playerColor : this.shadowColor;

    segments.push({
      id: generateId(),
      x: ghost.position.x,
      y: ghost.position.y,
      ownerId: ghostId,
      color,
      createdAt: currentTime,
      radius: TRAILS_CONFIG.TRAIL_SEGMENT_RADIUS
    });

    this.trailBuffers.set(ghostId, segments);

    // Decrement trail length - each segment consumes one unit of capacity
    this.trailLengths.set(ghostId, trailLength - 1);
  }

  /**
   * Update orbit tracking for anti-camping
   * @private
   */
  _updateOrbitTracking(ghostId, movementState, currentTime) {
    const isOrbiting = movementState === 'ORBITING';

    if (isOrbiting) {
      if (!this.orbitStartTime.has(ghostId)) {
        this.orbitStartTime.set(ghostId, currentTime);
      }
    } else {
      this.orbitStartTime.delete(ghostId);
    }
  }

  /**
   * Check if ghost has been orbiting long enough to be unsafe
   * @private
   */
  _isOrbitUnsafe(ghostId, currentTime) {
    const startTime = this.orbitStartTime.get(ghostId);
    if (!startTime) return false;
    return (currentTime - startTime) > TRAILS_CONFIG.MAX_SAFE_ORBIT_MS;
  }

  /**
   * Check if ghost should show orbit warning
   * @private
   */
  _isOrbitWarning(ghostId, currentTime) {
    const startTime = this.orbitStartTime.get(ghostId);
    if (!startTime) return false;
    const duration = currentTime - startTime;
    return duration > TRAILS_CONFIG.ORBIT_DECAY_WARNING_MS &&
           duration <= TRAILS_CONFIG.MAX_SAFE_ORBIT_MS;
  }

  /**
   * Check sphere collection
   * @private
   */
  _checkSphereCollection(ghostId, ghost, currentTime) {
    if (!ghost) return;

    for (const sphere of this.spheres) {
      if (sphere.state !== 'ACTIVE') continue;

      const dist = distance(ghost.position.x, ghost.position.y, sphere.x, sphere.y);
      if (dist < TRAILS_CONFIG.SPHERE_COLLECT_RADIUS) {
        // Collect the sphere
        sphere.state = 'RESPAWNING';
        sphere.respawnAt = currentTime + TRAILS_CONFIG.SPHERE_RESPAWN_MS;

        // Increase trail length
        const currentLength = this.trailLengths.get(ghostId) || 0;
        this.trailLengths.set(ghostId, currentLength + TRAILS_CONFIG.SEGMENTS_PER_SPHERE);

        console.log(`[TrailsMode] ${ghostId} collected sphere, trail length: ${currentLength + TRAILS_CONFIG.SEGMENTS_PER_SPHERE}`);
      }
    }
  }

  /**
   * Check trail collision
   * @returns {Object|null} Trail segment that was hit, or null
   * @private
   */
  _checkTrailCollision(ghostId, ghost) {
    if (!ghost) return null;

    // Check all trail segments (including own trail - hitting own trail = death)
    for (const [ownerId, segments] of this.trailBuffers) {
      for (const seg of segments) {
        // Skip very recent segments from self (grace period)
        if (ownerId === ghostId) {
          const age = Date.now() - seg.createdAt;
          if (age < 500) continue; // 500ms grace period for own trail
        }

        const dist = distance(ghost.position.x, ghost.position.y, seg.x, seg.y);
        const collisionDist = (ghost.radius || 10) + seg.radius;

        if (dist < collisionDist) {
          return seg;
        }
      }
    }

    return null;
  }

  /**
   * Check projectile collision
   * @returns {Object|null} Projectile that was hit, or null
   * @private
   */
  _checkProjectileCollision(ghostId, ghost) {
    if (!ghost) return null;

    for (const proj of this.projectiles) {
      // Can't be hit by own projectile
      if (proj.ownerId === ghostId) continue;

      const dist = distance(ghost.position.x, ghost.position.y, proj.x, proj.y);
      const collisionDist = (ghost.radius || 10) + proj.radius;

      if (dist < collisionDist) {
        return proj;
      }
    }

    return null;
  }

  /**
   * Handle player input
   * @param {string} type - Input type ('spacebar', 'orbit_exit')
   * @param {Object} data - Input data
   * @param {Object} ghost - Ghost that triggered input
   * @returns {Object|null}
   */
  applyInput(type, data, ghost) {
    if (type === 'orbit_exit') {
      // Shoot-on-launch mechanic
      const ghostId = ghost.id === this.shadowGhostId ? this.shadowGhostId : 'player';
      const trailLength = this.trailLengths.get(ghostId) || 0;

      if (trailLength > 0 && data.tangentVelocity) {
        // Pop a trail segment to create projectile
        this.trailLengths.set(ghostId, trailLength - 1);

        const color = ghostId === 'player' ? this.playerColor : this.shadowColor;
        const speed = Math.sqrt(data.tangentVelocity.x ** 2 + data.tangentVelocity.y ** 2);

        this.projectiles.push({
          id: generateId(),
          x: ghost.position.x,
          y: ghost.position.y,
          vx: data.tangentVelocity.x * TRAILS_CONFIG.PROJECTILE_SPEED_MULT,
          vy: data.tangentVelocity.y * TRAILS_CONFIG.PROJECTILE_SPEED_MULT,
          ownerId: ghostId,
          color,
          radius: TRAILS_CONFIG.PROJECTILE_RADIUS,
          createdAt: Date.now()
        });

        console.log(`[TrailsMode] ${ghostId} fired projectile, trail remaining: ${trailLength - 1}`);
        return { fired: true, projectileSpeed: speed * TRAILS_CONFIG.PROJECTILE_SPEED_MULT };
      }

      return { fired: false };
    }

    return null;
  }

  /**
   * Get current scoreboard
   * @returns {Object}
   */
  getScoreboard() {
    const playerTrailLength = this.trailLengths.get('player') || 0;
    const shadowTrailLength = this.trailLengths.get(this.shadowGhostId) || 0;

    return {
      playerScore: this.playerKills,
      opponentScore: this.shadowKills,
      playerLives: this.playerLives,
      opponentLives: this.shadowLives,
      timeRemaining: Math.max(0, this.matchTimeRemaining),
      playerTrailLength,
      opponentTrailLength: shadowTrailLength
    };
  }

  /**
   * Check if match has ended
   * @returns {Object}
   */
  checkEndCondition() {
    if (this.matchResult !== null) {
      return {
        ended: true,
        winner: this.matchResult === 'player_win' ? 'player' : 'opponent',
        reason: this.winCondition
      };
    }

    // Check elimination
    if (this.playerLives <= 0) {
      this.matchResult = 'shadow_win';
      this.winCondition = 'elimination';
      return {
        ended: true,
        winner: 'opponent',
        reason: 'elimination'
      };
    }

    if (this.shadowLives <= 0) {
      this.matchResult = 'player_win';
      this.winCondition = 'elimination';
      return {
        ended: true,
        winner: 'player',
        reason: 'elimination'
      };
    }

    // Check score limit
    if (this.playerKills >= TRAILS_CONFIG.SCORE_LIMIT) {
      this.matchResult = 'player_win';
      this.winCondition = 'score_limit';
      return {
        ended: true,
        winner: 'player',
        reason: 'score_limit'
      };
    }

    if (this.shadowKills >= TRAILS_CONFIG.SCORE_LIMIT) {
      this.matchResult = 'shadow_win';
      this.winCondition = 'score_limit';
      return {
        ended: true,
        winner: 'opponent',
        reason: 'score_limit'
      };
    }

    // Check timeout
    if (this.matchTimeRemaining <= 0) {
      if (this.playerKills > this.shadowKills) {
        this.matchResult = 'player_win';
      } else if (this.shadowKills > this.playerKills) {
        this.matchResult = 'shadow_win';
      } else {
        // Tie - player with more lives wins
        this.matchResult = this.playerLives >= this.shadowLives ? 'player_win' : 'shadow_win';
      }
      this.winCondition = 'timeout';

      return {
        ended: true,
        winner: this.matchResult === 'player_win' ? 'player' : 'opponent',
        reason: 'timeout'
      };
    }

    return { ended: false };
  }

  /**
   * Get render data
   * @returns {Object}
   */
  getRenderData() {
    return {
      trails: this.getAllTrailSegments(),
      spheres: this.spheres.filter(s => s.state === 'ACTIVE'),
      projectiles: this.projectiles,
      ghosts: [],  // Controller manages ghost rendering
      effects: []
    };
  }

  /**
   * Get all trail segments from all ghosts
   * @returns {Array}
   */
  getAllTrailSegments() {
    const allSegments = [];
    const currentTime = Date.now();

    for (const [ghostId, segments] of this.trailBuffers) {
      for (const seg of segments) {
        const age = currentTime - seg.createdAt;
        allSegments.push({
          ...seg,
          age,
          alpha: 1 - (age / TRAILS_CONFIG.TRAIL_LIFETIME_MS)
        });
      }
    }

    return allSegments;
  }

  /**
   * Get entity by type
   * @param {string} type - Entity type
   * @param {string} [id] - Entity ID
   * @returns {Object|Array|null}
   */
  getEntityByType(type, id) {
    switch (type) {
      case 'sphere':
        if (id) {
          return this.spheres.find(s => s.id === id) || null;
        }
        return this.spheres;

      case 'trail':
        return this.getAllTrailSegments();

      case 'projectile':
        if (id) {
          return this.projectiles.find(p => p.id === id) || null;
        }
        return this.projectiles;

      case 'record':
        if (id) {
          return this.physicsEngine?.getRecords().find(r => r.id === id) || null;
        }
        return this.physicsEngine?.getRecords() || [];

      case 'shadow':
        return { id: this.shadowGhostId };

      default:
        return null;
    }
  }

  /**
   * Handle damage to entity
   * @param {string} target - 'player' or 'shadow'
   * @param {string} source - Damage source
   * @param {string} type - Damage type
   * @returns {Object}
   */
  handleDamage(target, source, type) {
    const currentTime = Date.now();

    if (target === 'player') {
      if (currentTime < this.playerInvulnerableUntil) {
        return { blocked: true, livesRemaining: this.playerLives };
      }

      this.playerLives--;
      this.playerInvulnerableUntil = currentTime + this.invulnerabilityDuration;

      console.log(`[TrailsMode] Player damaged by ${type}! Lives: ${this.playerLives}`);

      return {
        livesRemaining: this.playerLives,
        eliminated: this.playerLives <= 0,
        invulnerableUntil: this.playerInvulnerableUntil
      };
    }

    if (target === 'shadow') {
      if (currentTime < this.shadowInvulnerableUntil) {
        return { blocked: true, livesRemaining: this.shadowLives };
      }

      this.shadowLives--;
      this.shadowInvulnerableUntil = currentTime + this.invulnerabilityDuration;

      console.log(`[TrailsMode] Shadow damaged by ${type}! Lives: ${this.shadowLives}`);

      return {
        livesRemaining: this.shadowLives,
        eliminated: this.shadowLives <= 0,
        invulnerableUntil: this.shadowInvulnerableUntil
      };
    }

    return { blocked: true };
  }

  /**
   * Serialize state for sync
   * @returns {Object}
   */
  serializeState() {
    return {
      type: 'TrailsMode',
      playerLives: this.playerLives,
      shadowLives: this.shadowLives,
      playerKills: this.playerKills,
      shadowKills: this.shadowKills,
      matchTimeRemaining: this.matchTimeRemaining,
      spheres: this.spheres.map(s => ({
        id: s.id,
        x: s.x,
        y: s.y,
        state: s.state
      })),
      trails: this.getAllTrailSegments(),
      projectiles: this.projectiles,
      matchResult: this.matchResult,
      winCondition: this.winCondition
    };
  }

  /**
   * Get initial entities
   * @returns {Object}
   */
  getInitialEntities() {
    return {
      spheres: this.spheres,
      trails: [],
      projectiles: [],
      ghosts: [],
      records: this.physicsEngine?.getRecords() || []
    };
  }

  /**
   * Reset for rematch
   */
  reset() {
    console.log('[TrailsMode] Resetting for rematch');

    // Reset lives and kills
    this.playerLives = TRAILS_CONFIG.STARTING_LIVES;
    this.shadowLives = TRAILS_CONFIG.STARTING_LIVES;
    this.playerKills = 0;
    this.shadowKills = 0;
    this.playerInvulnerableUntil = 0;
    this.shadowInvulnerableUntil = 0;

    // Reset timing
    this.matchStartTime = Date.now();
    this.matchTimeRemaining = TRAILS_CONFIG.ROUND_DURATION_MS;
    this.matchResult = null;
    this.winCondition = null;

    // Reset trail buffers
    this.trailBuffers.set('player', []);
    this.trailBuffers.set(this.shadowGhostId, []);
    this.trailLengths.set('player', 0);
    this.trailLengths.set(this.shadowGhostId, 0);
    this.lastTrailTime.set('player', 0);
    this.lastTrailTime.set(this.shadowGhostId, 0);

    // Reset orbit tracking
    this.orbitStartTime.clear();

    // Clear projectiles
    this.projectiles = [];

    // Reset spheres
    const records = this.physicsEngine?.getRecords() || [];
    this._initializeSpheres(records);

    // Reset AI
    if (this.shadowAI) {
      this.shadowAI.reset();
    }

    this.shadowMovementState = 'FREE_FLIGHT';
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.trailBuffers.clear();
    this.trailLengths.clear();
    this.lastTrailTime.clear();
    this.orbitStartTime.clear();
    this.spheres = [];
    this.projectiles = [];
    this.shadowAI = null;
    super.dispose();
  }

  // ============================================
  // ACCESSORS FOR CONTROLLER COMPATIBILITY
  // ============================================

  /**
   * Get Shadow AI instance
   * @returns {TrailsAI|null}
   */
  getShadowAI() {
    return this.shadowAI;
  }

  /**
   * Get match result
   * @returns {string|null}
   */
  getMatchResult() {
    return this.matchResult;
  }

  /**
   * Get win condition
   * @returns {string|null}
   */
  getWinCondition() {
    return this.winCondition;
  }

  /**
   * Set match result
   * @param {string} result
   * @param {string} condition
   */
  setMatchResult(result, condition) {
    this.matchResult = result;
    this.winCondition = condition;
  }

  /**
   * Get round duration config
   * @returns {number}
   */
  getRoundDuration() {
    return TRAILS_CONFIG.ROUND_DURATION_MS;
  }

  /**
   * Get player lives
   * @returns {number}
   */
  getPlayerLives() {
    return this.playerLives;
  }

  /**
   * Get shadow lives
   * @returns {number}
   */
  getShadowLives() {
    return this.shadowLives;
  }

  /**
   * Check if player is invulnerable
   * @returns {boolean}
   */
  isPlayerInvulnerable() {
    return Date.now() < this.playerInvulnerableUntil;
  }

  /**
   * Check if shadow is invulnerable
   * @returns {boolean}
   */
  isShadowInvulnerable() {
    return Date.now() < this.shadowInvulnerableUntil;
  }

  /**
   * Get player trail length
   * @returns {number}
   */
  getPlayerTrailLength() {
    return this.trailLengths.get('player') || 0;
  }

  /**
   * Get shadow trail length
   * @returns {number}
   */
  getShadowTrailLength() {
    return this.trailLengths.get(this.shadowGhostId) || 0;
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Get complementary color
   * @param {string} hexColor - Hex color
   * @returns {string}
   * @private
   */
  _getComplementaryColor(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const l = (max + min) / 2;

    let h, s;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
        case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
        case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
      }
    }

    h = (h + 0.5) % 1;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let rOut, gOut, bOut;
    if (s === 0) {
      rOut = gOut = bOut = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      rOut = hue2rgb(p, q, h + 1/3);
      gOut = hue2rgb(p, q, h);
      bOut = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(rOut)}${toHex(gOut)}${toHex(bOut)}`;
  }

  /**
   * Build game state for AI
   * @private
   */
  _buildAIGameState(localGhost, shadowGhost, currentTime) {
    return {
      selfX: shadowGhost.position.x,
      selfY: shadowGhost.position.y,
      selfVx: shadowGhost.velocity.x,
      selfVy: shadowGhost.velocity.y,
      selfIsOrbiting: this.shadowMovementState === 'ORBITING',
      selfTrailLength: this.trailLengths.get(this.shadowGhostId) || 0,
      playerX: localGhost.position.x,
      playerY: localGhost.position.y,
      playerVx: localGhost.velocity.x,
      playerVy: localGhost.velocity.y,
      trails: this.getAllTrailSegments(),
      spheres: this.spheres.filter(s => s.state === 'ACTIVE'),
      projectiles: this.projectiles,
      records: this.physicsEngine?.getRecords() || [],
      arenaSize: this.arenaSize,
      currentTime
    };
  }
}

export default TrailsMode;
