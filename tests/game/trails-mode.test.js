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

    it('initializes trail lengths to 0 (12-orbits style)', () => {
      // 12-orbits style: Start with no tail
      expect(mode.trailLengths.get('player')).toBe(0);
      expect(mode.trailLengths.get('shadow_self')).toBe(0);
    });

    it('initializes with correct round duration', () => {
      expect(mode.matchTimeRemaining).toBe(TRAILS_CONFIG.ROUND_DURATION_MS);
    });

    it('initializes flung balls array', () => {
      expect(mode.flungBalls).toBeDefined();
      expect(Array.isArray(mode.flungBalls)).toBe(true);
      expect(mode.flungBalls.length).toBe(0);
    });
  });

  describe('Trail System (12-orbits style)', () => {
    it('creates segments to match trail length', () => {
      // 12-orbits style: trail segments are created to match trailLength
      mode.trailLengths.set('player', 5);

      mode._updateTrailChain('player', mockGhost, 0.016);

      const segments = mode.trailBuffers.get('player');
      expect(segments.length).toBe(5);
      expect(segments[0].ownerId).toBe('player');
      // First segment starts at ghost position
      expect(segments[4].x).toBe(mockGhost.position.x);
      expect(segments[4].y).toBe(mockGhost.position.y);
    });

    it('does not decrement trail length when updating chain', () => {
      // 12-orbits style: trailLength is max buffer size, not capacity that depletes
      mode.trailLengths.set('player', 5);

      mode._updateTrailChain('player', mockGhost, 0.016);

      expect(mode.trailLengths.get('player')).toBe(5); // Stays the same
    });

    it('trims buffer to max length (following tail effect)', () => {
      mode.trailLengths.set('player', 3); // Max 3 segments

      // Add 5 segments manually
      for (let i = 0; i < 5; i++) {
        mode.trailBuffers.get('player').push({
          id: `seg_${i}`,
          x: 100 + i * 10,
          y: 100,
          vx: 0,
          vy: 0,
          ownerId: 'player',
          color: '#4488ff',
          radius: TRAILS_CONFIG.TRAIL_SEGMENT_RADIUS,
          createdAt: performance.now()
        });
      }

      // updateTrailChain should trim to 3
      mode._updateTrailChain('player', mockGhost, 0.016);

      expect(mode.trailBuffers.get('player').length).toBe(3);
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

    it('grows trail by 1 ball per sphere collection (12-orbits style)', () => {
      mode.trailLengths.set('player', 0);

      // Position ghost on top of a sphere
      const sphere = mode.spheres[0];
      mockGhost.position.x = sphere.x;
      mockGhost.position.y = sphere.y;

      mode._checkSphereCollection('player', mockGhost, Date.now());

      // 12-orbits style: 1 ball per sphere
      expect(mode.trailLengths.get('player')).toBe(1);
      expect(sphere.state).toBe('RESPAWNING');
    });
  });

  describe('Collision Detection', () => {
    it('no self-collision damage (12-orbits style)', () => {
      // 12-orbits style: NO self-collision damage
      // Even if ghost crosses own trail line, no collision
      mode.trailBuffers.set('player', [
        { id: 'seg1', x: 350, y: 400, ownerId: 'player', color: '#4488ff', radius: 12 },
        { id: 'seg2', x: 450, y: 400, ownerId: 'player', color: '#4488ff', radius: 12 }
      ]);

      // Ghost moves across own trail line
      const prevPos = { x: 400, y: 380 };
      mockGhost.position = { x: 400, y: 420 };

      // 12-orbits style: own trail = no collision
      const collision = mode._checkTrailCollision('player', mockGhost, prevPos);
      expect(collision).toBeNull();
    });

    it('detects ghost crossing enemy trail line segment -> SEVER', () => {
      // 12-orbits sever mechanic: ghost must CROSS the line between two dots
      // Create enemy trail with two segments forming a horizontal line
      mode.trailBuffers.set('shadow_self', [
        { id: 'seg1', x: 350, y: 400, ownerId: 'shadow_self', color: '#ff4444', radius: 12 },
        { id: 'seg2', x: 450, y: 400, ownerId: 'shadow_self', color: '#ff4444', radius: 12 }
      ]);

      // Ghost moves from above the line to below it (crossing the segment)
      const prevPos = { x: 400, y: 380 }; // Above the line
      mockGhost.position = { x: 400, y: 420 }; // Below the line

      const collision = mode._checkTrailCollision('player', mockGhost, prevPos);
      expect(collision).not.toBeNull();
      expect(collision.ownerId).toBe('shadow_self');
    });

    it('no collision if ghost does not cross trail line', () => {
      // Ghost moves parallel to trail, never crossing
      mode.trailBuffers.set('shadow_self', [
        { id: 'seg1', x: 350, y: 400, ownerId: 'shadow_self', color: '#ff4444', radius: 12 },
        { id: 'seg2', x: 450, y: 400, ownerId: 'shadow_self', color: '#ff4444', radius: 12 }
      ]);

      const prevPos = { x: 380, y: 380 }; // Above the line
      mockGhost.position = { x: 420, y: 380 }; // Still above the line

      const collision = mode._checkTrailCollision('player', mockGhost, prevPos);
      expect(collision).toBeNull();
    });

    it('ignores ghost-ghost collision', () => {
      // Position ghosts at same location
      mockShadowGhost.position.x = mockGhost.position.x;
      mockShadowGhost.position.y = mockGhost.position.y;

      // There's no ghost-ghost collision check - ghosts pass through each other
      const prevPos = { x: mockGhost.position.x - 10, y: mockGhost.position.y };
      const trailCollision = mode._checkTrailCollision('player', mockGhost, prevPos);
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

  describe('Orbit Exit (12-orbits style)', () => {
    it('does NOT fire projectile on orbit exit (12-orbits style)', () => {
      // In 12-orbits style, orbit_exit does NOT fire balls
      // Balls are only flung via explicit spacebar during FREE_FLIGHT
      mode.trailLengths.set('player', 5);
      mockGhost.position = { x: 300, y: 300 };

      const result = mode.applyInput('orbit_exit', {
        tangentVelocity: { x: 100, y: 0 }
      }, mockGhost);

      expect(result.fired).toBe(false);
      expect(mode.projectiles.length).toBe(0);
    });

    it('does NOT decrement trail length on orbit exit', () => {
      mode.trailLengths.set('player', 5);

      mode.applyInput('orbit_exit', {
        tangentVelocity: { x: 100, y: 0 }
      }, mockGhost);

      expect(mode.trailLengths.get('player')).toBe(5); // Unchanged
    });

    it('projectile collision detection still works (legacy)', () => {
      // Projectile collision detection kept for any externally-created projectiles
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

  describe('Ball Fling System (12-orbits style)', () => {
    it('flings ball from tail when has trail length', () => {
      mode.trailLengths.set('player', 3);
      mockGhost.velocity = { x: 100, y: 0 };

      const result = mode.flingBall('player', mockGhost);

      expect(result).not.toBeNull();
      expect(result.ownerId).toBe('player');
      expect(result.state).toBe('FLYING');
      expect(mode.flungBalls.length).toBe(1);
    });

    it('decrements trail length when flinging', () => {
      mode.trailLengths.set('player', 5);
      mockGhost.velocity = { x: 100, y: 0 };

      mode.flingBall('player', mockGhost);

      expect(mode.trailLengths.get('player')).toBe(4);
    });

    it('cannot fling when trail is empty', () => {
      mode.trailLengths.set('player', 0);
      mockGhost.velocity = { x: 100, y: 0 };

      const result = mode.flingBall('player', mockGhost);

      expect(result).toBeNull();
      expect(mode.flungBalls.length).toBe(0);
    });

    it('flung ball travels in movement direction', () => {
      mode.trailLengths.set('player', 3);
      mockGhost.velocity = { x: 100, y: 50 };

      const ball = mode.flingBall('player', mockGhost);

      // Ball velocity should be in same direction as ghost
      expect(ball.vx).toBeGreaterThan(0);
      expect(ball.vy).toBeGreaterThan(0);
    });

    it('flung ball has constant velocity (no decay - 12-orbits style)', () => {
      mode.trailLengths.set('player', 3);
      mockGhost.velocity = { x: 100, y: 0 };
      const ball = mode.flingBall('player', mockGhost);
      const initialVx = ball.vx;

      mode._updateFlungBalls(0.1, performance.now(), mockGhost, mockShadowGhost);

      // 12-orbits style: constant velocity, no decay
      expect(ball.vx).toBe(initialVx);
    });

    it('flung ball bounces off wall with dampened velocity', () => {
      // Position ball near wall, moving toward it
      mode.flungBalls = [{
        id: 'flung1',
        x: 5,  // Very close to left wall
        y: 400,
        vx: -100,  // Moving toward wall
        vy: 0,
        ownerId: 'player',
        color: '#4488ff',
        radius: TRAILS_CONFIG.FLUNG_BALL_RADIUS,
        createdAt: performance.now(),
        state: 'FLYING'
      }];

      mode._updateFlungBalls(0.1, performance.now(), mockGhost, mockShadowGhost);

      // Ball should bounce (velocity reversed and dampened, still flying)
      expect(mode.flungBalls.length).toBe(1);
      expect(mode.flungBalls[0].vx).toBeGreaterThan(0);  // Reversed direction
      expect(mode.flungBalls[0].vx).toBeLessThan(100);   // Dampened
    });

    it('flung ball converts to sphere when speed drops below minimum', () => {
      // Ball with very low speed
      mode.flungBalls = [{
        id: 'flung1',
        x: 400,
        y: 400,
        vx: 10,  // Below FLUNG_BALL_MIN_SPEED (40)
        vy: 10,
        ownerId: 'player',
        color: '#4488ff',
        radius: TRAILS_CONFIG.FLUNG_BALL_RADIUS,
        createdAt: performance.now(),
        state: 'FLYING'
      }];

      const sphereCountBefore = mode.spheres.length;
      mode._updateFlungBalls(0.1, performance.now(), mockGhost, mockShadowGhost);

      expect(mode.spheres.length).toBe(sphereCountBefore + 1);
      expect(mode.flungBalls.length).toBe(0);
    });

    it('flung ball kills opponent on body hit', () => {
      // Position flung ball at shadow position
      mode.flungBalls = [{
        id: 'flung1',
        x: mockShadowGhost.position.x,
        y: mockShadowGhost.position.y,
        vx: 100,
        vy: 0,
        ownerId: 'player',
        color: '#4488ff',
        radius: TRAILS_CONFIG.FLUNG_BALL_RADIUS,
        createdAt: performance.now(),
        state: 'FLYING'
      }];

      const collision = mode._checkFlungBallCollision('shadow_self', mockShadowGhost);

      expect(collision).not.toBeNull();
      expect(collision.ownerId).toBe('player');
    });

    it('flung ball passes through trails (no collision)', () => {
      // This is implicit - flung balls only check body collision, not trail collision
      // The _checkFlungBallCollision method doesn't check trails
      mode.trailLengths.set('player', 3);
      mode.flungBalls = [{
        id: 'flung1',
        x: 300,
        y: 300,
        vx: 100,
        vy: 0,
        ownerId: 'shadow_self',
        color: '#ff4444',
        radius: TRAILS_CONFIG.FLUNG_BALL_RADIUS,
        createdAt: performance.now(),
        state: 'FLYING'
      }];

      // Create player trail at ball position
      mode.trailBuffers.set('player', [{
        id: 'seg1',
        x: 300,
        y: 300,
        ownerId: 'player',
        color: '#4488ff',
        createdAt: Date.now(),
        radius: TRAILS_CONFIG.TRAIL_SEGMENT_RADIUS
      }]);

      // Update - ball should not be destroyed by trail
      mode._updateFlungBalls(0.016, performance.now(), mockGhost, mockShadowGhost);

      // Ball still exists (wasn't destroyed by trail)
      expect(mode.flungBalls.length).toBe(1);
    });

    it('applyInput fling returns correct result', () => {
      mode.trailLengths.set('player', 3);
      mockGhost.velocity = { x: 100, y: 0 };

      const result = mode.applyInput('fling', {}, mockGhost);

      expect(result.flung).toBe(true);
      expect(result.ballSpeed).toBeGreaterThan(0);
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

  describe('Ball Transfer on Death (12-orbits style)', () => {
    it('transfers balls from dead player to killer on trail collision', () => {
      mode.trailLengths.set('player', 5);
      mode.trailLengths.set('shadow_self', 3);

      const result = mode.handleDamage('player', 'shadow_self', 'trail_collision');

      expect(result.ballsTransferred).toBe(5);
      expect(mode.trailLengths.get('player')).toBe(0);
      expect(mode.trailLengths.get('shadow_self')).toBe(8); // 3 + 5
    });

    it('clears dead player trail buffer on death', () => {
      mode.trailLengths.set('player', 5);
      mode.trailBuffers.set('player', [
        { id: 'seg1', x: 100, y: 100 },
        { id: 'seg2', x: 110, y: 100 }
      ]);

      mode.handleDamage('player', 'shadow_self', 'trail_collision');

      expect(mode.trailBuffers.get('player').length).toBe(0);
    });

    it('no ball transfer on projectile hit (only trail collision transfers)', () => {
      mode.trailLengths.set('player', 5);
      mode.trailLengths.set('shadow_self', 3);

      const result = mode.handleDamage('player', 'shadow_self', 'projectile_hit');

      // No ball transfer on projectile hit - ballsTransferred is 0 or undefined
      expect(result.ballsTransferred === undefined || result.ballsTransferred === 0).toBe(true);
      expect(mode.trailLengths.get('player')).toBe(5); // Unchanged
    });

    it('no ball transfer on flung ball hit (only trail collision transfers)', () => {
      mode.trailLengths.set('player', 5);
      mode.trailLengths.set('shadow_self', 3);

      const result = mode.handleDamage('player', 'shadow_self', 'flung_ball_hit');

      // No ball transfer on flung ball hit - ballsTransferred is 0 or undefined
      expect(result.ballsTransferred === undefined || result.ballsTransferred === 0).toBe(true);
      expect(mode.trailLengths.get('player')).toBe(5); // Unchanged
    });

    it('no transfer if dead player had no balls', () => {
      mode.trailLengths.set('player', 0);
      mode.trailLengths.set('shadow_self', 3);

      const result = mode.handleDamage('player', 'shadow_self', 'trail_collision');

      expect(result.ballsTransferred).toBe(0);
      expect(mode.trailLengths.get('shadow_self')).toBe(3); // Unchanged
    });

    it('shadow to player transfer works correctly', () => {
      mode.trailLengths.set('shadow_self', 7);
      mode.trailLengths.set('player', 2);

      const result = mode.handleDamage('shadow', 'player', 'trail_collision');

      expect(result.ballsTransferred).toBe(7);
      expect(mode.trailLengths.get('shadow_self')).toBe(0);
      expect(mode.trailLengths.get('player')).toBe(9); // 2 + 7
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

    it('resets trail lengths to 0 (12-orbits style)', () => {
      mode.trailLengths.set('player', 50);
      mode.trailLengths.set('shadow_self', 40);

      mode.reset();

      // 12-orbits style: start with 0 tail
      expect(mode.trailLengths.get('player')).toBe(0);
      expect(mode.trailLengths.get('shadow_self')).toBe(0);
    });

    it('clears flung balls', () => {
      mode.flungBalls = [{ id: 'flung1' }, { id: 'flung2' }];

      mode.reset();

      expect(mode.flungBalls.length).toBe(0);
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
      const createdAt = performance.now() - 2000; // 2 seconds old (use performance.now for consistency)
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

    it('returns flung balls', () => {
      mode.flungBalls = [
        { id: 'flung1', x: 100, y: 100, state: 'FLYING' },
        { id: 'flung2', x: 200, y: 200, state: 'FLYING' }
      ];

      const renderData = mode.getRenderData();

      expect(renderData.flungBalls.length).toBe(2);
    });

    it('only returns flying flung balls', () => {
      mode.flungBalls = [
        { id: 'flung1', x: 100, y: 100, state: 'FLYING' },
        { id: 'flung2', x: 200, y: 200, state: 'STOPPED' },
        { id: 'flung3', x: 300, y: 300, state: 'HIT' }
      ];

      const renderData = mode.getRenderData();

      expect(renderData.flungBalls.length).toBe(1);
      expect(renderData.flungBalls[0].id).toBe('flung1');
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
