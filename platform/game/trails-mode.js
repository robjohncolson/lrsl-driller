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

  // Trails - 12-orbits style: rope/tether physics (NOT spring physics)
  // Dots are massless, no momentum - they just get pulled when too far
  STARTING_TRAIL_LENGTH: 0,     // Start with no tail (12-orbits style)
  SEGMENTS_PER_SPHERE: 1,       // Grow one ball per sphere collected (12-orbits style)
  TRAIL_SEGMENT_RADIUS: 12,     // Same size as collectible spheres
  TRAIL_TETHER_DISTANCE: 28,    // Tighter spacing between dots (about 2.3 radii)
  TRAIL_LIFETIME_MS: 999999,    // Effectively infinite - segments don't fade in 12-orbits style

  // Projectiles (legacy - kept for collision detection compatibility)
  PROJECTILE_SPEED_MULT: 1.5,
  PROJECTILE_LIFETIME_MS: 5000,
  PROJECTILE_RADIUS: 12,

  // Flung balls (12-orbits style) - spacebar when flying = fling a ball
  // Constant velocity, no decay - straight line until hitting wall or player
  FLUNG_BALL_SPEED_BOOST: 200,  // Ball travels this much FASTER than ghost (clearly overtakes)
  FLUNG_BALL_RADIUS: 12,        // Same size as other balls
  FLUNG_BALL_LIFETIME_MS: 8000, // Despawn after 8 seconds if no collision
  FLING_SURGE_SPEED: 0,         // No surge - ghost maintains speed, ball shoots ahead
  FLUNG_BALL_WALL_BOUNCE: 0.35, // Velocity retained after wall bounce (cushioned edges)
  FLUNG_BALL_MIN_SPEED: 25,     // Min speed before ball stops and becomes collectible

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
 * Check if two line segments intersect (12-orbits sever mechanic)
 * Uses cross product orientation test
 * @param {number} ax - Segment A start x
 * @param {number} ay - Segment A start y
 * @param {number} bx - Segment A end x
 * @param {number} by - Segment A end y
 * @param {number} cx - Segment B start x
 * @param {number} cy - Segment B start y
 * @param {number} dx - Segment B end x
 * @param {number} dy - Segment B end y
 * @returns {boolean} True if segments intersect
 */
function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  // Cross product to determine orientation
  const cross = (px, py, qx, qy, rx, ry) => {
    return (qx - px) * (ry - py) - (qy - py) * (rx - px);
  };

  const d1 = cross(cx, cy, dx, dy, ax, ay);
  const d2 = cross(cx, cy, dx, dy, bx, by);
  const d3 = cross(ax, ay, bx, by, cx, cy);
  const d4 = cross(ax, ay, bx, by, dx, dy);

  // Check if segments straddle each other
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  return false;
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
    this.projectiles = [];       // Projectile[] (legacy)
    this.flungBalls = [];        // FlungBall[] (12-orbits style)

    // Trail length per ghost (how many segments they can have)
    this.trailLengths = new Map(); // ghostId -> number

    // Previous ghost positions for line segment collision (sever mechanic)
    this.prevPositions = new Map(); // ghostId -> {x, y}

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
    // Snake style: everyone starts with a base trail length
    this.trailBuffers.set('player', []);
    this.trailBuffers.set(this.shadowGhostId, []);
    this.trailLengths.set('player', TRAILS_CONFIG.STARTING_TRAIL_LENGTH);
    this.trailLengths.set(this.shadowGhostId, TRAILS_CONFIG.STARTING_TRAIL_LENGTH);
    this.lastTrailTime.set('player', 0);
    this.lastTrailTime.set(this.shadowGhostId, 0);

    // Initialize Trails AI
    this.shadowAI = new TrailsAI({
      arenaSize: this.arenaSize,
      ghostId: this.shadowGhostId
    });

    // Reset match state
    // Use performance.now() for consistency with animation frame timestamps
    this.matchStartTime = performance.now();
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

    // Update projectiles (legacy)
    this._updateProjectiles(dt, currentTime);

    // Update flung balls (12-orbits style)
    const hitBalls = this._updateFlungBalls(dt, currentTime, localGhost, input.shadowGhost);
    for (const ball of hitBalls) {
      if (ball.hitTarget === 'player') {
        const damageResult = this.handleDamage('player', ball.ownerId, 'flung_ball_hit');
        input.damageResult = damageResult;
        if (damageResult.eliminated) {
          this.shadowKills++;
        }
      } else if (ball.hitTarget === 'shadow') {
        const damageResult = this.handleDamage('shadow', ball.ownerId, 'flung_ball_hit');
        input.shadowDamageResult = damageResult;
        if (damageResult.eliminated) {
          this.playerKills++;
        }
      }
    }

    // Get previous positions for line segment collision (sever mechanic)
    const playerPrev = this.prevPositions.get('player') || { x: localGhost.position.x, y: localGhost.position.y };
    const shadowPrev = input.shadowGhost
      ? (this.prevPositions.get(this.shadowGhostId) || { x: input.shadowGhost.position.x, y: input.shadowGhost.position.y })
      : null;

    // NOTE: Trail chain physics moved to updateTrailChainsAfterPhysics()
    // Must run AFTER physics engine updates orbit positions to get chord behavior
    // (dots chase ghost's CURRENT position, not stale pre-physics position)

    // Track orbit duration for anti-camping
    this._updateOrbitTracking('player', input.ghostMovementState, currentTime);
    if (input.shadowGhost) {
      this._updateOrbitTracking(this.shadowGhostId, input.shadowMovementState, currentTime);
    }

    // Check collisions for player
    const now = Date.now(); // Use Date.now() for invulnerability (consistent with handleDamage)
    const playerOrbiting = input.ghostMovementState === 'ORBITING';
    const playerOrbitUnsafe = this._isOrbitUnsafe('player', currentTime);

    // Sphere collection: ONLY when NOT orbiting (ghost body must touch, not trail)
    // This prevents trail segments from appearing to collect spheres while ghost orbits
    if (!playerOrbiting) {
      this._checkSphereCollection('player', localGhost, currentTime);
    }

    if ((!playerOrbiting || playerOrbitUnsafe) && now > this.playerInvulnerableUntil) {

      // Check trail collision (12-orbits sever mechanic: line segment intersection)
      const trailHit = this._checkTrailCollision('player', localGhost, playerPrev);
      if (trailHit) {
        const damageResult = this.handleDamage('player', trailHit.ownerId, 'trail_collision');
        input.damageResult = damageResult;
        if (damageResult.eliminated) {
          this.shadowKills++;
        }
      }

      // Check projectile collision (legacy)
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

      // Check flung ball collision (12-orbits style)
      const flungBallHit = this._checkFlungBallCollision('player', localGhost);
      if (flungBallHit) {
        const damageResult = this.handleDamage('player', flungBallHit.ownerId, 'flung_ball_hit');
        input.damageResult = damageResult;
        if (damageResult.eliminated) {
          this.shadowKills++;
        }
        // Remove the flung ball
        this.flungBalls = this.flungBalls.filter(b => b.id !== flungBallHit.id);
      }
    }

    // Check collisions for shadow
    const shadowOrbiting = input.shadowMovementState === 'ORBITING';
    const shadowOrbitUnsafe = this._isOrbitUnsafe(this.shadowGhostId, currentTime);

    // Sphere collection: ONLY when NOT orbiting (ghost body must touch, not trail)
    if (input.shadowGhost && !shadowOrbiting) {
      this._checkSphereCollection(this.shadowGhostId, input.shadowGhost, currentTime);
    }

    if (input.shadowGhost && (!shadowOrbiting || shadowOrbitUnsafe) && now > this.shadowInvulnerableUntil) {
      // Check trail collision (12-orbits sever mechanic: line segment intersection)
      const trailHit = this._checkTrailCollision(this.shadowGhostId, input.shadowGhost, shadowPrev);
      if (trailHit) {
        const damageResult = this.handleDamage('shadow', trailHit.ownerId, 'trail_collision');
        input.shadowDamageResult = damageResult;
        if (damageResult.eliminated) {
          this.playerKills++;
        }
      }

      // Check projectile collision (legacy)
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

      // Check flung ball collision (12-orbits style)
      const flungBallHit = this._checkFlungBallCollision(this.shadowGhostId, input.shadowGhost);
      if (flungBallHit) {
        const damageResult = this.handleDamage('shadow', flungBallHit.ownerId, 'flung_ball_hit');
        input.shadowDamageResult = damageResult;
        if (damageResult.eliminated) {
          this.playerKills++;
        }
        // Remove the flung ball
        this.flungBalls = this.flungBalls.filter(b => b.id !== flungBallHit.id);
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

    // Update previous positions for next frame's line segment collision
    this.prevPositions.set('player', { x: localGhost.position.x, y: localGhost.position.y });
    if (input.shadowGhost) {
      this.prevPositions.set(this.shadowGhostId, { x: input.shadowGhost.position.x, y: input.shadowGhost.position.y });
    }
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
   * Fling a ball from the ghost's tail (12-orbits style)
   * Ball travels in ghost's movement direction at guaranteed minimum speed
   * @param {string} ghostId - Ghost ID
   * @param {Object} ghost - Ghost object with position and velocity
   * @returns {Object|null} The flung ball, or null if no tail
   */
  flingBall(ghostId, ghost) {
    if (!ghost) return null;

    const trailLength = this.trailLengths.get(ghostId) || 0;
    if (trailLength <= 0) return null;

    // Get velocity direction
    const speed = Math.sqrt(ghost.velocity.x ** 2 + ghost.velocity.y ** 2);
    if (speed < 0.1) return null; // Need some velocity to determine direction

    // Reduce trail length
    this.trailLengths.set(ghostId, trailLength - 1);

    const color = ghostId === 'player' ? this.playerColor : this.shadowColor;

    // Normalize direction
    const nx = ghost.velocity.x / speed;
    const ny = ghost.velocity.y / speed;

    // Ghost physics uses: position += velocity * dt * 60
    // Ball physics uses: position += velocity * dt
    // So actual ghost visual speed = velocity * 60
    // Ball needs to be FASTER than ghost, so: ballSpeed = (ghostVel * 60) + boost
    const actualGhostSpeed = speed * 60;
    const ballSpeed = actualGhostSpeed + TRAILS_CONFIG.FLUNG_BALL_SPEED_BOOST;

    // Start ball slightly ahead of ghost (in movement direction)
    const startOffset = 20;

    const flungBall = {
      id: generateId(),
      x: ghost.position.x + nx * startOffset,
      y: ghost.position.y + ny * startOffset,
      vx: nx * ballSpeed,
      vy: ny * ballSpeed,
      ownerId: ghostId,
      color,
      radius: TRAILS_CONFIG.FLUNG_BALL_RADIUS,
      createdAt: performance.now(),
      state: 'FLYING'  // FLYING -> NEUTRAL (when stopped)
    };

    this.flungBalls.push(flungBall);
    console.log(`[TrailsMode] ${ghostId} flung ball, trail remaining: ${trailLength - 1}`);

    return flungBall;
  }

  /**
   * Update flung balls - constant velocity, no decay (12-orbits style)
   * Balls travel in straight line until hitting wall or player body
   * Pass through tails (no tail collision)
   * @param {number} dt - Delta time in seconds
   * @param {number} currentTime - Current timestamp
   * @param {Object} localGhost - Player ghost
   * @param {Object} shadowGhost - Shadow ghost
   * @private
   */
  _updateFlungBalls(dt, currentTime, localGhost, shadowGhost) {
    const toConvertToSphere = [];

    for (const ball of this.flungBalls) {
      if (ball.state !== 'FLYING') continue;

      // Move the ball - CONSTANT velocity, no decay
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Check wall collision - bounce with dampening (like billiards)
      const bounce = TRAILS_CONFIG.FLUNG_BALL_WALL_BOUNCE;
      const minSpeed = TRAILS_CONFIG.FLUNG_BALL_MIN_SPEED;

      // Horizontal walls
      if (ball.x < ball.radius) {
        ball.x = ball.radius;
        ball.vx = -ball.vx * bounce;  // Reflect and dampen
      } else if (ball.x > this.arenaSize - ball.radius) {
        ball.x = this.arenaSize - ball.radius;
        ball.vx = -ball.vx * bounce;
      }

      // Vertical walls
      if (ball.y < ball.radius) {
        ball.y = ball.radius;
        ball.vy = -ball.vy * bounce;
      } else if (ball.y > this.arenaSize - ball.radius) {
        ball.y = this.arenaSize - ball.radius;
        ball.vy = -ball.vy * bounce;
      }

      // Check if ball has slowed enough to stop
      const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      if (speed < minSpeed) {
        toConvertToSphere.push(ball);
        ball.state = 'STOPPED';
        continue;
      }

      // Check body collision with opponent (NOT trails - flung balls pass through trails)
      const targetGhost = ball.ownerId === 'player' ? shadowGhost : localGhost;
      if (targetGhost) {
        const dist = distance(ball.x, ball.y, targetGhost.position.x, targetGhost.position.y);
        const collisionDist = ball.radius + (targetGhost.radius || 10);
        if (dist < collisionDist) {
          // Body hit = kill
          ball.hitTarget = ball.ownerId === 'player' ? 'shadow' : 'player';
          ball.state = 'HIT';
          continue;
        }
      }

      // Check lifetime expiry
      const age = currentTime - ball.createdAt;
      if (age > TRAILS_CONFIG.FLUNG_BALL_LIFETIME_MS) {
        toConvertToSphere.push(ball);
        ball.state = 'STOPPED';
      }
    }

    // Remove hit balls and convert stopped balls to spheres
    this.flungBalls = this.flungBalls.filter(b => b.state === 'FLYING');

    // Convert stopped balls to neutral spheres
    for (const ball of toConvertToSphere) {
      this.spheres.push({
        id: generateId(),
        x: ball.x,
        y: ball.y,
        state: 'ACTIVE',
        respawnAt: 0,
        radius: TRAILS_CONFIG.SPHERE_RADIUS,
        pulsePhase: Math.random() * Math.PI * 2,
        wasFlungBall: true  // Mark as converted from flung ball
      });
      console.log(`[TrailsMode] Flung ball stopped, converted to neutral sphere at (${ball.x.toFixed(0)}, ${ball.y.toFixed(0)})`);
    }

    return this.flungBalls.filter(b => b.state === 'HIT');
  }

  /**
   * Check flung ball collisions with ghosts
   * @param {string} ghostId - Ghost to check
   * @param {Object} ghost - Ghost object
   * @returns {Object|null} Flung ball that hit, or null
   * @private
   */
  _checkFlungBallCollision(ghostId, ghost) {
    if (!ghost) return null;

    for (const ball of this.flungBalls) {
      // Can't be hit by own flung ball
      if (ball.ownerId === ghostId) continue;
      if (ball.state !== 'FLYING') continue;

      const dist = distance(ghost.position.x, ghost.position.y, ball.x, ball.y);
      const collisionDist = (ghost.radius || 10) + ball.radius;

      if (dist < collisionDist) {
        return ball;
      }
    }

    return null;
  }

  /**
   * Update trail segments with 12-orbits chase physics
   * Dots ACTIVELY CHASE their parent in a straight line each frame
   * This creates the "cut corners" spiral effect when ghost orbits
   * Hard distance constraint: rope can't stretch beyond D_max
   * @private
   */
  _updateTrailChain(ghostId, ghost, dt) {
    if (!ghost) return;

    const segments = this.trailBuffers.get(ghostId) || [];
    const targetLength = this.trailLengths.get(ghostId) || 0;
    const color = ghostId === 'player' ? this.playerColor : this.shadowColor;

    // Add new segments if we need more
    while (segments.length < targetLength) {
      // New segment starts at ghost position
      segments.push({
        id: generateId(),
        x: ghost.position.x,
        y: ghost.position.y,
        ownerId: ghostId,
        color,
        radius: TRAILS_CONFIG.TRAIL_SEGMENT_RADIUS,
        createdAt: performance.now()
      });
    }

    // Remove excess segments if we have too many (from front = oldest)
    while (segments.length > targetLength) {
      segments.shift();
    }

    // 12-orbits VERLET CONSTRAINT physics
    // Key insight: dots have NO PATH MEMORY - they only know parent's CURRENT position
    // Multiple constraint iterations let the chain settle properly
    // This automatically creates corner-cutting and spiral effects
    const maxDist = TRAILS_CONFIG.TRAIL_TETHER_DISTANCE;

    // Multiple iterations for constraint propagation (like Verlet physics)
    const iterations = 3;
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];

        // Target = parent's CURRENT position (ghost or previous dot)
        const target = i === 0
          ? { x: ghost.position.x, y: ghost.position.y }
          : { x: segments[i - 1].x, y: segments[i - 1].y };

        // Calculate vector from dot to target
        const dx = target.x - seg.x;
        const dy = target.y - seg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // CONSTRAINT: If rope is stretched, pull dot toward parent
        // This is the key - dot moves in a STRAIGHT LINE toward parent's current position
        // No path memory, no history - just "where is my parent NOW?"
        if (dist > maxDist && dist > 0.1) {
          // How much to move: the excess distance beyond maxDist
          const excess = dist - maxDist;
          const nx = dx / dist;
          const ny = dy / dist;

          // Move dot directly toward parent by the excess amount
          seg.x += nx * excess;
          seg.y += ny * excess;
        }
      }
    }

    // Apply arena bounds after all constraint iterations
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const r = seg.radius;
      if (seg.x < r) seg.x = r;
      if (seg.x > this.arenaSize - r) seg.x = this.arenaSize - r;
      if (seg.y < r) seg.y = r;
      if (seg.y > this.arenaSize - r) seg.y = this.arenaSize - r;
    }

    this.trailBuffers.set(ghostId, segments);
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
   * Update trail chains after physics engine has updated ghost positions
   * Call this AFTER physics engine update when ghosts are orbiting
   * This ensures trail dots follow the ghost's actual current position
   * @param {Object} localGhost - Player ghost with updated position
   * @param {Object} shadowGhost - Shadow ghost with updated position (optional)
   * @param {number} dt - Delta time in seconds
   */
  updateTrailChainsAfterPhysics(localGhost, shadowGhost, dt) {
    if (!this.initialized) return;

    // Re-run trail chain physics with updated positions
    this._updateTrailChain('player', localGhost, dt);
    if (shadowGhost) {
      this._updateTrailChain(this.shadowGhostId, shadowGhost, dt);
    }
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
   * Check trail collision using line segment intersection (12-orbits sever mechanic)
   * The ghost's movement path must CROSS the line between two connected dots
   * Only opponent trails can be severed - no self-collision
   * @param {string} ghostId - Ghost checking for collision
   * @param {Object} ghost - Ghost object with current position
   * @param {Object} prevPos - Ghost's previous position {x, y}
   * @returns {Object|null} Trail segment info if severed, or null
   * @private
   */
  _checkTrailCollision(ghostId, ghost, prevPos) {
    if (!ghost || !prevPos) return null;

    const gx1 = prevPos.x;
    const gy1 = prevPos.y;
    const gx2 = ghost.position.x;
    const gy2 = ghost.position.y;

    // Skip if ghost hasn't moved (no line segment to check)
    if (Math.abs(gx2 - gx1) < 0.1 && Math.abs(gy2 - gy1) < 0.1) return null;

    // Check opponent trails only
    for (const [trailOwnerId, segments] of this.trailBuffers) {
      // Skip own trail - no self-collision
      if (trailOwnerId === ghostId) continue;
      if (segments.length === 0) continue;

      // Check each link in the chain (between consecutive dots)
      for (let i = 0; i < segments.length - 1; i++) {
        const seg1 = segments[i];
        const seg2 = segments[i + 1];

        // Check if ghost's movement path crosses this chain link
        if (segmentsIntersect(gx1, gy1, gx2, gy2, seg1.x, seg1.y, seg2.x, seg2.y)) {
          // Return the segment info for damage handling
          return {
            ownerId: trailOwnerId,
            severIndex: i + 1, // Index where chain was severed
            segment: seg2
          };
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
   * @param {string} type - Input type ('spacebar', 'orbit_exit', 'fling')
   * @param {Object} data - Input data
   * @param {Object} ghost - Ghost that triggered input
   * @returns {Object|null}
   */
  applyInput(type, data, ghost) {
    // 12-orbits style: orbit_exit does NOT fire balls
    // Balls are only flung via explicit spacebar press during FREE_FLIGHT
    if (type === 'orbit_exit') {
      return { fired: false };
    }

    // 12-orbits style: fling a ball when spacebar pressed during FREE_FLIGHT
    if (type === 'fling') {
      const ghostId = ghost.id === this.shadowGhostId ? this.shadowGhostId : 'player';
      const flungBall = this.flingBall(ghostId, ghost);

      if (flungBall) {
        const speed = Math.sqrt(flungBall.vx ** 2 + flungBall.vy ** 2);

        // Calculate surge direction (same as movement direction)
        const ghostSpeed = Math.sqrt(ghost.velocity.x ** 2 + ghost.velocity.y ** 2);
        let surgeVx = 0, surgeVy = 0;
        if (ghostSpeed > 0.1) {
          // Surge forward in movement direction
          surgeVx = (ghost.velocity.x / ghostSpeed) * TRAILS_CONFIG.FLING_SURGE_SPEED;
          surgeVy = (ghost.velocity.y / ghostSpeed) * TRAILS_CONFIG.FLING_SURGE_SPEED;
        }

        return {
          flung: true,
          ballSpeed: speed,
          surge: { vx: surgeVx, vy: surgeVy }
        };
      }

      return { flung: false };
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
      console.log(`[TrailsMode] checkEndCondition: matchResult already set: ${this.matchResult}, reason: ${this.winCondition}`);
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
      flungBalls: this.flungBalls.filter(b => b.state === 'FLYING'),
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
    // Use performance.now() for consistency with segment createdAt timestamps
    const currentTime = performance.now();

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
   * 12-orbits style: When dying from trail collision, transfer balls to killer
   * @param {string} target - 'player' or 'shadow'
   * @param {string} source - Damage source (ghostId that caused damage)
   * @param {string} type - Damage type ('trail_collision', 'projectile_hit', 'flung_ball_hit')
   * @returns {Object}
   */
  handleDamage(target, source, type) {
    const currentTime = Date.now();

    if (target === 'player') {
      if (currentTime < this.playerInvulnerableUntil) {
        return { blocked: true, livesRemaining: this.playerLives };
      }

      // 12-orbits style: Transfer balls to killer on trail collision
      let ballsTransferred = 0;
      if (type === 'trail_collision' && source !== 'player') {
        ballsTransferred = this._transferBallsOnDeath('player', source);
      }

      this.playerLives--;
      this.playerInvulnerableUntil = currentTime + this.invulnerabilityDuration;

      console.log(`[TrailsMode] Player damaged by ${type}! Lives: ${this.playerLives}, balls transferred: ${ballsTransferred}`);

      return {
        livesRemaining: this.playerLives,
        eliminated: this.playerLives <= 0,
        invulnerableUntil: this.playerInvulnerableUntil,
        ballsTransferred
      };
    }

    if (target === 'shadow') {
      if (currentTime < this.shadowInvulnerableUntil) {
        return { blocked: true, livesRemaining: this.shadowLives };
      }

      // 12-orbits style: Transfer balls to killer on trail collision
      let ballsTransferred = 0;
      if (type === 'trail_collision' && source !== this.shadowGhostId) {
        ballsTransferred = this._transferBallsOnDeath(this.shadowGhostId, source);
      }

      this.shadowLives--;
      this.shadowInvulnerableUntil = currentTime + this.invulnerabilityDuration;

      console.log(`[TrailsMode] Shadow damaged by ${type}! Lives: ${this.shadowLives}, balls transferred: ${ballsTransferred}`);

      return {
        livesRemaining: this.shadowLives,
        eliminated: this.shadowLives <= 0,
        invulnerableUntil: this.shadowInvulnerableUntil,
        ballsTransferred
      };
    }

    return { blocked: true };
  }

  /**
   * Transfer balls from dead ghost to killer (12-orbits style)
   * @param {string} deadGhostId - Ghost that died
   * @param {string} killerGhostId - Ghost that killed (trail owner)
   * @returns {number} Number of balls transferred
   * @private
   */
  _transferBallsOnDeath(deadGhostId, killerGhostId) {
    const deadTrailLength = this.trailLengths.get(deadGhostId) || 0;

    if (deadTrailLength === 0) return 0;

    // Get the killer's ghost ID (source is the trail owner)
    const killerId = killerGhostId === 'player' ? 'player' : this.shadowGhostId;

    // Transfer all balls to killer
    const killerTrailLength = this.trailLengths.get(killerId) || 0;
    this.trailLengths.set(killerId, killerTrailLength + deadTrailLength);

    // Reset dead player's tail to 0
    this.trailLengths.set(deadGhostId, 0);

    // Clear dead player's trail buffer (visual trail segments)
    this.trailBuffers.set(deadGhostId, []);

    console.log(`[TrailsMode] Transferred ${deadTrailLength} balls from ${deadGhostId} to ${killerId}. Killer now has ${killerTrailLength + deadTrailLength} balls`);

    return deadTrailLength;
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
    this.matchStartTime = performance.now();
    this.matchTimeRemaining = TRAILS_CONFIG.ROUND_DURATION_MS;
    this.matchResult = null;
    this.winCondition = null;

    // Reset trail buffers - Snake style: start with base trail length
    this.trailBuffers.set('player', []);
    this.trailBuffers.set(this.shadowGhostId, []);
    this.trailLengths.set('player', TRAILS_CONFIG.STARTING_TRAIL_LENGTH);
    this.trailLengths.set(this.shadowGhostId, TRAILS_CONFIG.STARTING_TRAIL_LENGTH);
    this.lastTrailTime.set('player', 0);
    this.lastTrailTime.set(this.shadowGhostId, 0);

    // Reset orbit tracking and position history
    this.orbitStartTime.clear();
    this.prevPositions.clear();

    // Clear projectiles and flung balls
    this.projectiles = [];
    this.flungBalls = [];

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
    this.prevPositions.clear();
    this.spheres = [];
    this.projectiles = [];
    this.flungBalls = [];
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
