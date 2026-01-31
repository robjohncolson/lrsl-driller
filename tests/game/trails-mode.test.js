/**
 * Ghost Orbits - Trails Mode Tests
 *
 * Tests for the snake-style survival mode with trail hazards.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrailsMode, TRAILS_CONFIG } from '../../platform/game/trails-mode.js';
import { TrailsAI } from '../../platform/game/trails-ai.js';

describe('TrailsMode', () => {
  let mode;
  let mockPhysicsEngine;
  let mockGhost;
  let mockShadowGhost;

  beforeEach(async () => {
    // Mock physics engine
    mockPhysicsEngine = {
      getRecords: vi.fn(() => [
        { id: 'record1', position: { x: 200, y: 200 }, radius: 50, captureRadius: 70 },
        { id: 'record2', position: { x: 600, y: 600 }, radius: 50, captureRadius: 70 }
      ])
    };

    // Create mode with configuration
    mode = new TrailsMode({
      arenaSize: 800,
      ghostProperties: { color: '#4488ff' },
      cartridgeId: 'test',
      username: 'player',
      physicsEngine: mockPhysicsEngine
    });

    await mode.init({ arenaSize: 800, physicsEngine: mockPhysicsEngine });

    // Create mock ghosts
    mockGhost = {
      id: 'player',
      position: { x: 100, y: 100 },
      velocity: { x: 2, y: 0 },
      radius: 10,
      isOrbiting: false
    };

    mockShadowGhost = {
      id: 'shadow_self',
      position: { x: 700, y: 700 },
      velocity: { x: -2, y: 0 },
      radius: 10,
      isOrbiting: false
    };
  });

  describe('Initialization', () => {
    it('spawns configured number of spheres', () => {
      expect(mode.spheres.length).toBe(TRAILS_CONFIG.SPHERE_COUNT);
    });

    it('initializes trail buffers for all ghosts', () => {
      expect(mode.trailBuffers.has('player')).toBe(true);
      expect(mode.trailBuffers.has('shadow_self')).toBe(true);
    });

    it('sets starting lives correctly', () => {
      expect(mode.playerLives).toBe(TRAILS_CONFIG.STARTING_LIVES);
      expect(mode.shadowLives).toBe(TRAILS_CONFIG.STARTING_LIVES);
    });

    it('initializes trail lengths to zero', () => {
      expect(mode.trailLengths.get('player')).toBe(0);
      expect(mode.trailLengths.get('shadow_self')).toBe(0);
    });

    it('initializes with correct round duration', () => {
      expect(mode.matchTimeRemaining).toBe(TRAILS_CONFIG.ROUND_DURATION_MS);
    });
  });

  describe('Trail System', () => {
    it('does not record positions when trail length is zero', () => {
      mode.trailLengths.set('player', 0);
      const currentTime = Date.now();

      // Manually call the private record method behavior
      mode.lastTrailTime.set('player', 0);
      mode._recordTrailSegment('player', mockGhost, currentTime);

      const segments = mode.trailBuffers.get('player');
      expect(segments.length).toBe(0);
    });

    it('records positions when trail length > 0 and interval passed', () => {
      mode.trailLengths.set('player', 5);
      mode.lastTrailTime.set('player', 0);
      const currentTime = Date.now() + TRAILS_CONFIG.TRAIL_RECORD_INTERVAL + 10;

      mode._recordTrailSegment('player', mockGhost, currentTime);

      const segments = mode.trailBuffers.get('player');
      expect(segments.length).toBe(1);
      expect(segments[0].ownerId).toBe('player');
      expect(segments[0].x).toBe(mockGhost.position.x);
      expect(segments[0].y).toBe(mockGhost.position.y);
    });

    it('decrements trail length when dropping segment', () => {
      mode.trailLengths.set('player', 5);
      mode.lastTrailTime.set('player', 0);
      const currentTime = Date.now() + TRAILS_CONFIG.TRAIL_RECORD_INTERVAL + 10;

      mode._recordTrailSegment('player', mockGhost, currentTime);

      expect(mode.trailLengths.get('player')).toBe(4);
    });

    it('stops dropping segments when trail length reaches zero', () => {
      mode.trailLengths.set('player', 1);
      mode.lastTrailTime.set('player', 0);
      let currentTime = Date.now() + TRAILS_CONFIG.TRAIL_RECORD_INTERVAL + 10;

      // First segment - should work
      mode._recordTrailSegment('player', mockGhost, currentTime);
      expect(mode.trailBuffers.get('player').length).toBe(1);
      expect(mode.trailLengths.get('player')).toBe(0);

      // Second segment - should not drop (length is 0)
      currentTime += TRAILS_CONFIG.TRAIL_RECORD_INTERVAL + 10;
      mode._recordTrailSegment('player', mockGhost, currentTime);
      expect(mode.trailBuffers.get('player').length).toBe(1); // Still 1
    });

    it('removes segments older than TRAIL_LIFETIME_MS', () => {
      // Add an old segment
      const oldTime = Date.now() - TRAILS_CONFIG.TRAIL_LIFETIME_MS - 1000;
      mode.trailBuffers.set('player', [{
        id: 'old_seg',
        x: 100,
        y: 100,
        ownerId: 'player',
        color: '#4488ff',
        createdAt: oldTime,
        radius: TRAILS_CONFIG.TRAIL_SEGMENT_RADIUS
      }]);

      // Update trails
      mode._updateTrails(Date.now());

      const segments = mode.trailBuffers.get('player');
      expect(segments.length).toBe(0);
    });

    it('grows trail on sphere collection', () => {
      mode.trailLengths.set('player', 0);

      // Position ghost on top of a sphere
      const sphere = mode.spheres[0];
      mockGhost.position.x = sphere.x;
      mockGhost.position.y = sphere.y;

      mode._checkSphereCollection('player', mockGhost, Date.now());

      expect(mode.trailLengths.get('player')).toBe(TRAILS_CONFIG.SEGMENTS_PER_SPHERE);
      expect(sphere.state).toBe('RESPAWNING');
    });
  });

  describe('Collision Detection', () => {
    it('detects ghost hitting own trail -> DEATH', () => {
      // Give ghost trail length
      mode.trailLengths.set('player', 5);

      // Create an old segment at ghost position (past grace period)
      const oldTime = Date.now() - 1000;
      mode.trailBuffers.set('player', [{
        id: 'seg1',
        x: mockGhost.position.x,
        y: mockGhost.position.y,
        ownerId: 'player',
        color: '#4488ff',
        createdAt: oldTime,
        radius: TRAILS_CONFIG.TRAIL_SEGMENT_RADIUS
      }]);

      const collision = mode._checkTrailCollision('player', mockGhost);
      expect(collision).not.toBeNull();
      expect(collision.ownerId).toBe('player');
    });

    it('detects ghost hitting enemy trail -> DEATH', () => {
      // Create shadow trail at player position
      mode.trailBuffers.set('shadow_self', [{
        id: 'seg1',
        x: mockGhost.position.x,
        y: mockGhost.position.y,
        ownerId: 'shadow_self',
        color: '#ff4444',
        createdAt: Date.now(),
        radius: TRAILS_CONFIG.TRAIL_SEGMENT_RADIUS
      }]);

      const collision = mode._checkTrailCollision('player', mockGhost);
      expect(collision).not.toBeNull();
      expect(collision.ownerId).toBe('shadow_self');
    });

    it('detects ghost hitting projectile -> DEATH', () => {
      // Create enemy projectile at player position
      mode.projectiles = [{
        id: 'proj1',
        x: mockGhost.position.x,
        y: mockGhost.position.y,
        vx: 100,
        vy: 0,
        ownerId: 'shadow_self',
        color: '#ff4444',
        radius: TRAILS_CONFIG.PROJECTILE_RADIUS,
        createdAt: Date.now()
      }];

      const collision = mode._checkProjectileCollision('player', mockGhost);
      expect(collision).not.toBeNull();
      expect(collision.ownerId).toBe('shadow_self');
    });

    it('ignores ghost-ghost collision', () => {
      // Position ghosts at same location
      mockShadowGhost.position.x = mockGhost.position.x;
      mockShadowGhost.position.y = mockGhost.position.y;

      // There's no ghost-ghost collision check - ghosts pass through each other
      // This test documents that behavior
      const trailCollision = mode._checkTrailCollision('player', mockGhost);
      expect(trailCollision).toBeNull(); // No trail = no collision
    });

    it('safe while orbiting under MAX_SAFE_ORBIT_MS', () => {
      const now = Date.now();
      mode.orbitStartTime.set('player', now - 1000); // 1 second ago

      const isUnsafe = mode._isOrbitUnsafe('player', now);
      expect(isUnsafe).toBe(false);
    });

    it('vulnerable when orbiting over MAX_SAFE_ORBIT_MS', () => {
      const now = Date.now();
      mode.orbitStartTime.set('player', now - TRAILS_CONFIG.MAX_SAFE_ORBIT_MS - 1000);

      const isUnsafe = mode._isOrbitUnsafe('player', now);
      expect(isUnsafe).toBe(true);
    });

    it('shows warning when approaching orbit limit', () => {
      const now = Date.now();
      mode.orbitStartTime.set('player', now - TRAILS_CONFIG.ORBIT_DECAY_WARNING_MS - 500);

      const isWarning = mode._isOrbitWarning('player', now);
      expect(isWarning).toBe(true);
    });
  });

  describe('Shoot Mechanic', () => {
    it('creates projectile on orbit exit if has trail', () => {
      mode.trailLengths.set('player', 5);
      mockGhost.position = { x: 300, y: 300 };

      const result = mode.applyInput('orbit_exit', {
        tangentVelocity: { x: 100, y: 0 }
      }, mockGhost);

      expect(result.fired).toBe(true);
      expect(mode.projectiles.length).toBe(1);
      expect(mode.projectiles[0].ownerId).toBe('player');
    });

    it('decrements trail length on shot', () => {
      mode.trailLengths.set('player', 5);

      mode.applyInput('orbit_exit', {
        tangentVelocity: { x: 100, y: 0 }
      }, mockGhost);

      expect(mode.trailLengths.get('player')).toBe(4);
    });

    it('no projectile if trail empty', () => {
      mode.trailLengths.set('player', 0);

      const result = mode.applyInput('orbit_exit', {
        tangentVelocity: { x: 100, y: 0 }
      }, mockGhost);

      expect(result.fired).toBe(false);
      expect(mode.projectiles.length).toBe(0);
    });

    it('projectile velocity = PROJECTILE_SPEED_MULT x ghost tangent', () => {
      mode.trailLengths.set('player', 5);
      const tangentVel = { x: 100, y: 50 };

      mode.applyInput('orbit_exit', { tangentVelocity: tangentVel }, mockGhost);

      const proj = mode.projectiles[0];
      expect(proj.vx).toBe(tangentVel.x * TRAILS_CONFIG.PROJECTILE_SPEED_MULT);
      expect(proj.vy).toBe(tangentVel.y * TRAILS_CONFIG.PROJECTILE_SPEED_MULT);
    });

    it('projectile despawns on wall collision', () => {
      mode.projectiles = [{
        id: 'proj1',
        x: -10, // Out of bounds
        y: 400,
        vx: -100,
        vy: 0,
        ownerId: 'player',
        color: '#4488ff',
        radius: TRAILS_CONFIG.PROJECTILE_RADIUS,
        createdAt: Date.now()
      }];

      mode._updateProjectiles(0.016, Date.now());

      expect(mode.projectiles.length).toBe(0);
    });

    it('projectile despawns on lifetime expiry', () => {
      mode.projectiles = [{
        id: 'proj1',
        x: 400,
        y: 400,
        vx: 0,
        vy: 0,
        ownerId: 'player',
        color: '#4488ff',
        radius: TRAILS_CONFIG.PROJECTILE_RADIUS,
        createdAt: Date.now() - TRAILS_CONFIG.PROJECTILE_LIFETIME_MS - 1000
      }];

      mode._updateProjectiles(0.016, Date.now());

      expect(mode.projectiles.length).toBe(0);
    });
  });

  describe('Sphere System', () => {
    it('sphere collected on ghost contact', () => {
      const sphere = mode.spheres[0];
      sphere.state = 'ACTIVE';
      mockGhost.position.x = sphere.x;
      mockGhost.position.y = sphere.y;

      mode._checkSphereCollection('player', mockGhost, Date.now());

      expect(sphere.state).toBe('RESPAWNING');
    });

    it('sphere respawns after SPHERE_RESPAWN_MS', () => {
      const sphere = mode.spheres[0];
      const collectTime = Date.now();
      sphere.state = 'RESPAWNING';
      sphere.respawnAt = collectTime + TRAILS_CONFIG.SPHERE_RESPAWN_MS;

      // Before respawn time
      mode._updateSpheres(0.016, collectTime + 1000);
      expect(sphere.state).toBe('RESPAWNING');

      // After respawn time
      mode._updateSpheres(0.016, collectTime + TRAILS_CONFIG.SPHERE_RESPAWN_MS + 100);
      expect(sphere.state).toBe('ACTIVE');
    });

    it('sphere count stays at SPHERE_COUNT', () => {
      // Collect all spheres
      for (const sphere of mode.spheres) {
        sphere.state = 'RESPAWNING';
        sphere.respawnAt = Date.now();
      }

      // Respawn them
      mode._updateSpheres(0.016, Date.now() + 100);

      const activeCount = mode.spheres.filter(s => s.state === 'ACTIVE').length;
      expect(activeCount).toBe(TRAILS_CONFIG.SPHERE_COUNT);
    });
  });

  describe('Win Conditions', () => {
    it('ends when player has no lives (shadow wins)', () => {
      mode.playerLives = 0;

      const result = mode.checkEndCondition();

      expect(result.ended).toBe(true);
      expect(result.winner).toBe('opponent');
      expect(result.reason).toBe('elimination');
    });

    it('ends when shadow has no lives (player wins)', () => {
      mode.shadowLives = 0;

      const result = mode.checkEndCondition();

      expect(result.ended).toBe(true);
      expect(result.winner).toBe('player');
      expect(result.reason).toBe('elimination');
    });

    it('ends on player score limit reached', () => {
      mode.playerKills = TRAILS_CONFIG.SCORE_LIMIT;

      const result = mode.checkEndCondition();

      expect(result.ended).toBe(true);
      expect(result.winner).toBe('player');
      expect(result.reason).toBe('score_limit');
    });

    it('ends on shadow score limit reached', () => {
      mode.shadowKills = TRAILS_CONFIG.SCORE_LIMIT;

      const result = mode.checkEndCondition();

      expect(result.ended).toBe(true);
      expect(result.winner).toBe('opponent');
      expect(result.reason).toBe('score_limit');
    });

    it('ends on timeout with higher kills wins', () => {
      mode.matchTimeRemaining = 0;
      mode.playerKills = 3;
      mode.shadowKills = 1;

      const result = mode.checkEndCondition();

      expect(result.ended).toBe(true);
      expect(result.winner).toBe('player');
      expect(result.reason).toBe('timeout');
    });

    it('on timeout tie, player with more lives wins', () => {
      mode.matchTimeRemaining = 0;
      mode.playerKills = 2;
      mode.shadowKills = 2;
      mode.playerLives = 2;
      mode.shadowLives = 1;

      const result = mode.checkEndCondition();

      expect(result.ended).toBe(true);
      expect(result.winner).toBe('player');
    });
  });

  describe('Damage Handling', () => {
    it('player takes damage and loses life', () => {
      const initialLives = mode.playerLives;

      const result = mode.handleDamage('player', 'shadow_self', 'trail_collision');

      expect(result.livesRemaining).toBe(initialLives - 1);
      expect(mode.playerLives).toBe(initialLives - 1);
    });

    it('invulnerability blocks damage', () => {
      mode.playerInvulnerableUntil = Date.now() + 10000;

      const result = mode.handleDamage('player', 'shadow_self', 'trail_collision');

      expect(result.blocked).toBe(true);
      expect(mode.playerLives).toBe(TRAILS_CONFIG.STARTING_LIVES);
    });

    it('damage sets invulnerability', () => {
      mode.playerInvulnerableUntil = 0;

      const result = mode.handleDamage('player', 'shadow_self', 'trail_collision');

      expect(result.invulnerableUntil).toBeGreaterThan(Date.now());
    });

    it('eliminated flag set when lives reach zero', () => {
      mode.playerLives = 1;

      const result = mode.handleDamage('player', 'shadow_self', 'trail_collision');

      expect(result.eliminated).toBe(true);
      expect(mode.playerLives).toBe(0);
    });
  });

  describe('Reset', () => {
    it('resets lives to starting values', () => {
      mode.playerLives = 1;
      mode.shadowLives = 0;

      mode.reset();

      expect(mode.playerLives).toBe(TRAILS_CONFIG.STARTING_LIVES);
      expect(mode.shadowLives).toBe(TRAILS_CONFIG.STARTING_LIVES);
    });

    it('resets kill counts', () => {
      mode.playerKills = 5;
      mode.shadowKills = 3;

      mode.reset();

      expect(mode.playerKills).toBe(0);
      expect(mode.shadowKills).toBe(0);
    });

    it('clears trail buffers', () => {
      mode.trailBuffers.set('player', [{ id: 'seg1' }]);
      mode.trailBuffers.set('shadow_self', [{ id: 'seg2' }]);

      mode.reset();

      expect(mode.trailBuffers.get('player').length).toBe(0);
      expect(mode.trailBuffers.get('shadow_self').length).toBe(0);
    });

    it('clears projectiles', () => {
      mode.projectiles = [{ id: 'proj1' }];

      mode.reset();

      expect(mode.projectiles.length).toBe(0);
    });

    it('resets trail lengths to zero', () => {
      mode.trailLengths.set('player', 10);
      mode.trailLengths.set('shadow_self', 8);

      mode.reset();

      expect(mode.trailLengths.get('player')).toBe(0);
      expect(mode.trailLengths.get('shadow_self')).toBe(0);
    });

    it('reinitializes spheres', () => {
      mode.spheres = [];

      mode.reset();

      expect(mode.spheres.length).toBe(TRAILS_CONFIG.SPHERE_COUNT);
    });
  });

  describe('Scoreboard', () => {
    it('returns correct kill counts', () => {
      mode.playerKills = 3;
      mode.shadowKills = 2;

      const scoreboard = mode.getScoreboard();

      expect(scoreboard.playerScore).toBe(3);
      expect(scoreboard.opponentScore).toBe(2);
    });

    it('returns correct lives', () => {
      mode.playerLives = 2;
      mode.shadowLives = 1;

      const scoreboard = mode.getScoreboard();

      expect(scoreboard.playerLives).toBe(2);
      expect(scoreboard.opponentLives).toBe(1);
    });

    it('returns trail lengths', () => {
      mode.trailLengths.set('player', 7);
      mode.trailLengths.set('shadow_self', 4);

      const scoreboard = mode.getScoreboard();

      expect(scoreboard.playerTrailLength).toBe(7);
      expect(scoreboard.opponentTrailLength).toBe(4);
    });
  });

  describe('Render Data', () => {
    it('returns trails with age and alpha', () => {
      const createdAt = Date.now() - 2000; // 2 seconds old
      mode.trailBuffers.set('player', [{
        id: 'seg1',
        x: 100,
        y: 100,
        ownerId: 'player',
        color: '#4488ff',
        createdAt,
        radius: 4
      }]);

      const renderData = mode.getRenderData();

      expect(renderData.trails.length).toBe(1);
      expect(renderData.trails[0].age).toBeGreaterThan(0);
      expect(renderData.trails[0].alpha).toBeLessThan(1);
    });

    it('returns only active spheres', () => {
      mode.spheres[0].state = 'ACTIVE';
      mode.spheres[1].state = 'RESPAWNING';

      const renderData = mode.getRenderData();

      const activeInRender = renderData.spheres.filter(s => s.state === 'ACTIVE').length;
      const totalActive = mode.spheres.filter(s => s.state === 'ACTIVE').length;

      expect(renderData.spheres.length).toBe(totalActive);
    });

    it('returns projectiles', () => {
      mode.projectiles = [
        { id: 'proj1', x: 100, y: 100 },
        { id: 'proj2', x: 200, y: 200 }
      ];

      const renderData = mode.getRenderData();

      expect(renderData.projectiles.length).toBe(2);
    });
  });
});

describe('TrailsAI', () => {
  let ai;

  beforeEach(() => {
    ai = new TrailsAI({
      arenaSize: 800,
      ghostId: 'shadow_self'
    });
  });

  describe('Trail Evasion', () => {
    it('detects trail danger ahead', () => {
      // Trail at look-ahead position (120 units ahead in x direction)
      const trails = [{
        x: 520, // 400 + 120 = 520
        y: 400,
        ownerId: 'player',
        radius: 4
      }];

      const danger = ai._detectTrailDanger(400, 400, { x: 1, y: 0 }, trails);

      expect(danger.isDangerous).toBe(true);
    });

    it('enters orbit when trail danger ahead', () => {
      const gameState = {
        selfX: 400,
        selfY: 400,
        selfVx: 100,
        selfVy: 0,
        selfIsOrbiting: false,
        selfTrailLength: 3,
        playerX: 200,
        playerY: 200,
        playerVx: 0,
        playerVy: 0,
        trails: [{ x: 500, y: 400, ownerId: 'player', radius: 4 }],
        spheres: [],
        projectiles: [],
        records: [{ position: { x: 400, y: 400 }, radius: 50, captureRadius: 70 }],
        arenaSize: 800,
        currentTime: Date.now()
      };

      const decision = ai.update(0.016, gameState);

      // Should want to orbit when danger ahead and near a record
      expect(decision.wantsOrbit).toBe(true);
    });
  });

  describe('Sphere Seeking', () => {
    it('seeks spheres when low ammo', () => {
      const gameState = {
        selfX: 100,
        selfY: 100,
        selfVx: 0,
        selfVy: 0,
        selfIsOrbiting: false,
        selfTrailLength: 1, // Low ammo
        playerX: 700,
        playerY: 700,
        playerVx: 0,
        playerVy: 0,
        trails: [],
        spheres: [{ x: 200, y: 100, state: 'ACTIVE' }],
        projectiles: [],
        records: [],
        arenaSize: 800,
        currentTime: Date.now()
      };

      const decision = ai.update(0.016, gameState);

      // Should move toward sphere
      expect(decision.moveDirection).not.toBeNull();
      expect(decision.moveDirection.x).toBeGreaterThan(0); // Sphere is to the right
    });
  });

  describe('Orbit Behavior', () => {
    it('stays in orbit for minimum time', () => {
      ai.orbitEntryTime = Date.now();

      const gameState = {
        selfX: 400,
        selfY: 400,
        selfVx: 0,
        selfVy: 0,
        selfIsOrbiting: true,
        selfTrailLength: 5,
        playerX: 200,
        playerY: 200,
        playerVx: 0,
        playerVy: 0,
        trails: [],
        spheres: [],
        projectiles: [],
        records: [{ position: { x: 400, y: 400 }, radius: 50, captureRadius: 70 }],
        arenaSize: 800,
        currentTime: Date.now() // Just entered orbit
      };

      const decision = ai.update(0.016, gameState);

      // Should not release immediately
      expect(decision.wantsRelease).toBe(false);
    });

    it('finds safe exit angles', () => {
      const trails = [
        { x: 500, y: 400, ownerId: 'player', radius: 4 }
      ];

      const safeAngles = ai._findSafeExitAngles(400, 400, { x: 400, y: 400, radius: 50 }, trails);

      // Should have some safe angles (not all blocked by trail)
      expect(safeAngles.length).toBeGreaterThan(0);
      expect(safeAngles.length).toBeLessThan(8);
    });
  });

  describe('Reset', () => {
    it('resets AI state', () => {
      ai.currentPriority = 1;
      ai.orbitEntryTime = 12345;
      ai.decisionLockUntil = Date.now() + 10000;

      ai.reset();

      expect(ai.orbitEntryTime).toBe(0);
      expect(ai.decisionLockUntil).toBe(0);
    });
  });
});
