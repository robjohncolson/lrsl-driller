/**
 * Ghost Orbits - Blizzard Mode Tests
 *
 * Tests for the team-based sphere defense mode.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlizzardMode, BLIZZARD_CONFIG } from '../../platform/game/blizzard-mode.js';
import { BlizzardAI } from '../../platform/game/blizzard-ai.js';
import { WIDE_MAP } from '../../platform/game/orbits-maps.js';

describe('BlizzardMode', () => {
  let mode;
  let mockPhysicsEngine;
  let mockGhost;
  let mockShadowGhost;

  beforeEach(async () => {
    // Mock physics engine
    mockPhysicsEngine = {
      addRecord: vi.fn(),
      getRecords: vi.fn(() => [
        { id: 'record1', position: { x: 180, y: 200 }, radius: 45, captureRadius: 65 },
        { id: 'record2', position: { x: 600, y: 200 }, radius: 45, captureRadius: 65 },
        { id: 'record3', position: { x: 1020, y: 200 }, radius: 45, captureRadius: 65 },
        { id: 'record4', position: { x: 180, y: 600 }, radius: 45, captureRadius: 65 },
        { id: 'record5', position: { x: 600, y: 600 }, radius: 45, captureRadius: 65 },
        { id: 'record6', position: { x: 1020, y: 600 }, radius: 45, captureRadius: 65 }
      ])
    };

    // Create mode with configuration
    mode = new BlizzardMode({
      arenaWidth: WIDE_MAP.arenaWidth,
      arenaHeight: WIDE_MAP.arenaHeight,
      ghostProperties: { color: '#4488ff' },
      cartridgeId: 'test',
      username: 'player',
      physicsEngine: mockPhysicsEngine
    });

    await mode.init({
      arenaWidth: WIDE_MAP.arenaWidth,
      arenaHeight: WIDE_MAP.arenaHeight,
      physicsEngine: mockPhysicsEngine
    });

    // Create mock ghosts
    mockGhost = {
      id: 'player',
      position: { x: 200, y: 600 },
      velocity: { x: 2, y: 0 },
      radius: 10
    };

    mockShadowGhost = {
      id: 'shadow_self',
      position: { x: 1000, y: 200 },
      velocity: { x: -2, y: 0 },
      radius: 10
    };
  });

  describe('Initialization', () => {
    it('uses WIDE_MAP dimensions', () => {
      expect(mode.arenaWidth).toBe(WIDE_MAP.arenaWidth);
      expect(mode.arenaHeight).toBe(WIDE_MAP.arenaHeight);
    });

    it('spawns initial spheres', () => {
      expect(mode.spheres.length).toBeGreaterThan(0);
      expect(mode.spheres.length).toBe(BLIZZARD_CONFIG.WAVE_1.count);
    });

    it('initializes barriers at correct positions', () => {
      expect(mode.barriers.length).toBe(2);

      const topBarrier = mode.barriers.find(b => b.teamId === 0);
      const bottomBarrier = mode.barriers.find(b => b.teamId === 1);

      expect(topBarrier).toBeDefined();
      expect(bottomBarrier).toBeDefined();
      expect(topBarrier.y).toBe(mode.arenaHeight * BLIZZARD_CONFIG.BARRIER_Y_TOP);
      expect(bottomBarrier.y).toBe(mode.arenaHeight * BLIZZARD_CONFIG.BARRIER_Y_BOTTOM);
    });

    it('initializes team assignments', () => {
      expect(mode.teams.get('player')).toBe(0);
      expect(mode.teams.get('shadow_self')).toBe(1);
    });

    it('initializes team scores to zero', () => {
      expect(mode.teamScores[0]).toBe(0);
      expect(mode.teamScores[1]).toBe(0);
    });

    it('sets correct round duration', () => {
      expect(mode.matchTimeRemaining).toBe(BLIZZARD_CONFIG.ROUND_DURATION_MS);
    });

    it('starts at wave 1', () => {
      expect(mode.currentWave).toBe(1);
    });

    it('initializes Shadow AI', () => {
      expect(mode.shadowAI).toBeDefined();
      expect(mode.shadowAI).toBeInstanceOf(BlizzardAI);
    });
  });

  describe('Sphere Mechanics', () => {
    it('spawns spheres in center zone', () => {
      const spawnZone = WIDE_MAP.sphereSpawnZone;
      const minY = mode.arenaHeight * spawnZone.minY;
      const maxY = mode.arenaHeight * spawnZone.maxY;

      for (const sphere of mode.spheres) {
        expect(sphere.y).toBeGreaterThanOrEqual(minY - 50); // Some tolerance
        expect(sphere.y).toBeLessThanOrEqual(maxY + 50);
      }
    });

    it('spheres have correct initial properties', () => {
      for (const sphere of mode.spheres) {
        expect(sphere.id).toBeDefined();
        expect(sphere.radius).toBe(BLIZZARD_CONFIG.SPHERE_RADIUS);
        expect(sphere.teamId).toBeNull(); // Neutral
        expect(sphere.returnCount).toBe(0);
        expect(sphere.speed).toBe(BLIZZARD_CONFIG.WAVE_1.speed);
      }
    });

    it('spheres move when updated', () => {
      const sphere = mode.spheres[0];
      const initialX = sphere.x;
      const initialY = sphere.y;

      // Ensure sphere has velocity
      sphere.velocityX = 50;
      sphere.velocityY = 50;

      mode._updateSpheres(0.1); // 100ms

      expect(sphere.x).not.toBe(initialX);
      expect(sphere.y).not.toBe(initialY);
    });

    it('spheres bounce off side walls', () => {
      const sphere = mode.spheres[0];

      // Move sphere to left wall
      sphere.x = 5;
      sphere.velocityX = -100;
      sphere.velocityY = 0;

      sphere.update(0.1, mode.arenaWidth, mode.arenaHeight);

      expect(sphere.velocityX).toBeGreaterThan(0); // Reversed direction
      expect(sphere.x).toBeGreaterThanOrEqual(sphere.radius);
    });
  });

  describe('Sphere Touch Interactions', () => {
    it('claiming neutral sphere sets team and direction', () => {
      const sphere = mode.spheres[0];
      sphere.x = 200;
      sphere.y = 400;
      sphere.teamId = null;

      // Simulate touch
      const input = {};
      sphere.return('player', 1, 0); // Return toward team 1's barrier, claim for team 0

      expect(sphere.teamId).toBe(0);
      expect(sphere.lastTouchedBy).toBe('player');
      expect(sphere.returnCount).toBe(1);
      expect(sphere.velocityY).toBeGreaterThan(0); // Heading toward bottom (team 1's barrier)
    });

    it('returning own sphere increases speed', () => {
      const sphere = mode.spheres[0];
      sphere.teamId = 0;
      sphere.speed = BLIZZARD_CONFIG.SPHERE_BASE_SPEED;
      sphere.returnCount = 2;

      const originalSpeed = sphere.speed;
      sphere.return('player', 1, 0);

      expect(sphere.speed).toBeGreaterThan(originalSpeed);
      expect(sphere.returnCount).toBe(3);
    });

    it('flipping enemy sphere changes team and reverses direction', () => {
      const sphere = mode.spheres[0];
      sphere.teamId = 1; // Enemy team
      sphere.velocityY = -50; // Heading toward top (team 0's barrier)

      sphere.flip('player', 0);

      expect(sphere.teamId).toBe(0);
      expect(sphere.velocityY).toBeGreaterThan(0); // Reversed, now heading toward bottom
    });

    it('speed boost is capped at maximum', () => {
      const sphere = mode.spheres[0];
      sphere.speed = BLIZZARD_CONFIG.SPHERE_MAX_SPEED - 10;
      sphere.returnCount = 10;

      sphere.return('player', 1, 0);

      expect(sphere.speed).toBeLessThanOrEqual(BLIZZARD_CONFIG.SPHERE_MAX_SPEED);
    });
  });

  describe('Scoring', () => {
    it('scores when sphere crosses enemy barrier', () => {
      const sphere = mode.spheres[0];
      sphere.x = 600;
      sphere.y = mode.arenaHeight * BLIZZARD_CONFIG.BARRIER_Y_BOTTOM + 10;
      sphere.teamId = 0; // Player's team sphere
      sphere.velocityY = 100;

      mode._checkBarrierCollisions();

      expect(mode.teamScores[0]).toBe(1); // Team 0 scores
      expect(mode.spheres.find(s => s.id === sphere.id)).toBeUndefined(); // Removed
    });

    it('neutral spheres do not score', () => {
      const sphere = mode.spheres[0];
      sphere.x = 600;
      sphere.y = mode.arenaHeight * BLIZZARD_CONFIG.BARRIER_Y_BOTTOM + 10;
      sphere.teamId = null; // Neutral sphere
      sphere.velocityY = 100;

      const initialScore0 = mode.teamScores[0];
      const initialScore1 = mode.teamScores[1];

      mode._checkBarrierCollisions();

      // Neutral spheres don't score - must be claimed first
      expect(mode.teamScores[0]).toBe(initialScore0);
      expect(mode.teamScores[1]).toBe(initialScore1);
    });

    it('sphere crossing wrong barrier does not score (own goal prevention)', () => {
      const sphere = mode.spheres[0];
      sphere.x = 600;
      sphere.y = mode.arenaHeight * BLIZZARD_CONFIG.BARRIER_Y_BOTTOM + 10;
      sphere.teamId = 1; // Team 1's sphere crosses team 1's barrier (bottom)
      sphere.velocityY = 100;

      const initialScore0 = mode.teamScores[0];
      const initialScore1 = mode.teamScores[1];

      mode._checkBarrierCollisions();

      // Team 1's sphere at team 1's barrier = no score (own goal prevented)
      // Only team 0's sphere crossing bottom barrier would score for team 0
      expect(mode.teamScores[0]).toBe(initialScore0);
      expect(mode.teamScores[1]).toBe(initialScore1);
    });

    it('removes scored sphere from arena', () => {
      const initialCount = mode.spheres.length;
      const sphere = mode.spheres[0];
      sphere.y = mode.arenaHeight * BLIZZARD_CONFIG.BARRIER_Y_BOTTOM + 10;
      sphere.teamId = 0;

      mode._checkBarrierCollisions();

      expect(mode.spheres.length).toBe(initialCount - 1);
    });
  });

  describe('Win Conditions', () => {
    it('ends match when score limit reached', () => {
      mode.teamScores[0] = BLIZZARD_CONFIG.SCORE_LIMIT;

      const result = mode.checkEndCondition();

      expect(result.ended).toBe(true);
      expect(result.winner).toBe('player');
      expect(result.reason).toBe('score_limit');
    });

    it('ends match on mercy rule', () => {
      mode.teamScores[0] = BLIZZARD_CONFIG.MERCY_LEAD + 2;
      mode.teamScores[1] = 2;

      const result = mode.checkEndCondition();

      expect(result.ended).toBe(true);
      expect(result.winner).toBe('player');
      expect(result.reason).toBe('mercy');
    });

    it('ends match on timeout with score comparison', () => {
      mode.matchTimeRemaining = -1;
      mode.teamScores[0] = 5;
      mode.teamScores[1] = 3;

      const result = mode.checkEndCondition();

      expect(result.ended).toBe(true);
      expect(result.winner).toBe('player');
      expect(result.reason).toBe('timeout');
    });

    it('opponent wins on timeout if they lead', () => {
      mode.matchTimeRemaining = -1;
      mode.teamScores[0] = 3;
      mode.teamScores[1] = 5;

      const result = mode.checkEndCondition();

      expect(result.ended).toBe(true);
      expect(result.winner).toBe('opponent');
      expect(result.reason).toBe('timeout');
    });

    it('does not end match before conditions met', () => {
      mode.teamScores[0] = 5;
      mode.teamScores[1] = 3;
      mode.matchTimeRemaining = 60000;

      const result = mode.checkEndCondition();

      expect(result.ended).toBe(false);
    });
  });

  describe('Wave System', () => {
    it('starts in wave 1', () => {
      expect(mode.currentWave).toBe(1);
    });

    it('progresses to wave 2 after wave 1 duration', () => {
      mode._updateWave(BLIZZARD_CONFIG.WAVE_1_DURATION + 1000);

      expect(mode.currentWave).toBe(2);
    });

    it('progresses to wave 3 after wave 2 duration', () => {
      mode._updateWave(BLIZZARD_CONFIG.WAVE_2_DURATION + 1000);

      expect(mode.currentWave).toBe(3);
    });

    it('wave config has increasing counts', () => {
      expect(BLIZZARD_CONFIG.WAVE_2.count).toBeGreaterThan(BLIZZARD_CONFIG.WAVE_1.count);
      expect(BLIZZARD_CONFIG.WAVE_3.count).toBeGreaterThan(BLIZZARD_CONFIG.WAVE_2.count);
    });

    it('wave config has increasing speeds', () => {
      expect(BLIZZARD_CONFIG.WAVE_2.speed).toBeGreaterThan(BLIZZARD_CONFIG.WAVE_1.speed);
      expect(BLIZZARD_CONFIG.WAVE_3.speed).toBeGreaterThan(BLIZZARD_CONFIG.WAVE_2.speed);
    });
  });

  describe('No Elimination', () => {
    it('handleDamage always blocks damage', () => {
      const result = mode.handleDamage('player', 'source', 'type');

      expect(result.blocked).toBe(true);
      expect(result.livesRemaining).toBe(Infinity);
    });

    it('getPlayerLives returns Infinity', () => {
      expect(mode.getPlayerLives()).toBe(Infinity);
    });

    it('getShadowLives returns Infinity', () => {
      expect(mode.getShadowLives()).toBe(Infinity);
    });

    it('scoreboard shows infinite lives', () => {
      const scoreboard = mode.getScoreboard();

      expect(scoreboard.playerLives).toBe(Infinity);
      expect(scoreboard.opponentLives).toBe(Infinity);
    });
  });

  describe('Render Data', () => {
    it('includes spheres with team colors', () => {
      mode.spheres[0].teamId = 0;

      const renderData = mode.getRenderData();

      expect(renderData.blizzardSpheres).toBeDefined();
      expect(renderData.blizzardSpheres.length).toBe(mode.spheres.length);

      const firstSphere = renderData.blizzardSpheres.find(s => s.teamId === 0);
      expect(firstSphere.teamColor).toBe(mode.teamColors[0]);
    });

    it('includes barriers with team colors', () => {
      const renderData = mode.getRenderData();

      expect(renderData.barriers).toBeDefined();
      expect(renderData.barriers.length).toBe(2);

      for (const barrier of renderData.barriers) {
        expect(barrier.teamColor).toBe(mode.teamColors[barrier.teamId]);
      }
    });

    it('includes team scores', () => {
      mode.teamScores = [3, 5];

      const renderData = mode.getRenderData();

      expect(renderData.teamScores).toEqual([3, 5]);
    });

    it('includes current wave', () => {
      mode.currentWave = 2;

      const renderData = mode.getRenderData();

      expect(renderData.wave).toBe(2);
    });
  });

  describe('Reset', () => {
    it('resets scores on rematch', () => {
      mode.teamScores = [10, 5];

      mode.reset();

      expect(mode.teamScores).toEqual([0, 0]);
    });

    it('resets wave on rematch', () => {
      mode.currentWave = 3;

      mode.reset();

      expect(mode.currentWave).toBe(1);
    });

    it('respawns spheres on rematch', () => {
      mode.spheres = [];

      mode.reset();

      expect(mode.spheres.length).toBeGreaterThan(0);
    });

    it('resets match result on rematch', () => {
      mode.matchResult = 'player_win';
      mode.winCondition = 'score_limit';

      mode.reset();

      expect(mode.matchResult).toBeNull();
      expect(mode.winCondition).toBeNull();
    });
  });

  describe('Serialization', () => {
    it('serializes state correctly', () => {
      mode.teamScores = [5, 3];
      mode.currentWave = 2;
      mode.matchTimeRemaining = 100000;

      const state = mode.serializeState();

      expect(state.type).toBe('BlizzardMode');
      expect(state.teamScores).toEqual([5, 3]);
      expect(state.wave).toBe(2);
      expect(state.matchTimeRemaining).toBe(100000);
      expect(state.spheres).toBeDefined();
      expect(state.barriers).toBeDefined();
    });
  });
});

describe('BlizzardAI', () => {
  let ai;

  beforeEach(() => {
    ai = new BlizzardAI({
      arenaWidth: 1200,
      arenaHeight: 800,
      teamId: 1,
      ghostId: 'shadow_self'
    });
  });

  describe('Initialization', () => {
    it('sets correct team barrier positions', () => {
      expect(ai.ownBarrierY).toBe(800 * 0.95); // Team 1's barrier at bottom
      expect(ai.enemyBarrierY).toBe(800 * 0.05); // Team 0's barrier at top
    });

    it('initializes with team 1', () => {
      expect(ai.teamId).toBe(1);
    });
  });

  describe('Decision Making', () => {
    it('returns move direction for free flight', () => {
      const gameState = {
        selfX: 600,
        selfY: 600,
        selfVx: 0,
        selfVy: 0,
        selfIsOrbiting: false,
        spheres: [],
        barriers: [],
        records: [],
        currentTime: Date.now()
      };

      const decision = ai.update(0.016, gameState);

      expect(decision.moveDirection).toBeDefined();
      expect(decision.wantsOrbit).toBe(false);
    });

    it('prioritizes intercepting spheres heading toward own barrier', () => {
      const gameState = {
        selfX: 600,
        selfY: 600,
        selfVx: 0,
        selfVy: 0,
        selfIsOrbiting: false,
        spheres: [
          {
            id: 'sphere1',
            x: 600,
            y: 700,
            velocityX: 0,
            velocityY: 100, // Heading toward bottom (AI's barrier)
            teamId: 0 // Enemy sphere
          }
        ],
        barriers: [],
        records: [],
        currentTime: Date.now()
      };

      const decision = ai.update(0.016, gameState);

      expect(decision.moveDirection).toBeDefined();
      // Should move toward the sphere
      expect(decision.moveDirection.y).toBeGreaterThan(0);
    });

    it('seeks neutral spheres when no threats', () => {
      const gameState = {
        selfX: 600,
        selfY: 600,
        selfVx: 0,
        selfVy: 0,
        selfIsOrbiting: false,
        spheres: [
          {
            id: 'sphere1',
            x: 400,
            y: 500,
            velocityX: 50,
            velocityY: -50, // Heading away from AI's barrier
            teamId: null // Neutral
          }
        ],
        barriers: [],
        records: [],
        currentTime: Date.now()
      };

      const decision = ai.update(0.016, gameState);

      expect(decision.moveDirection).toBeDefined();
    });

    it('wants to release from orbit when sphere is nearby', () => {
      const gameState = {
        selfX: 600,
        selfY: 600,
        selfVx: 0,
        selfVy: 0,
        selfIsOrbiting: true,
        spheres: [
          {
            id: 'sphere1',
            x: 650, // Within orbit escape range
            y: 620,
            velocityX: 0,
            velocityY: 50,
            teamId: 0
          }
        ],
        barriers: [],
        records: [
          { x: 600, y: 600, radius: 45, captureRadius: 65 }
        ],
        currentTime: Date.now() + 1000 // Past minimum orbit time
      };

      ai.orbitEntryTime = Date.now() - 1000; // Entered orbit 1 second ago

      const decision = ai.update(0.016, gameState);

      expect(decision.wantsRelease).toBe(true);
    });
  });

  describe('Reset', () => {
    it('resets state correctly', () => {
      ai.targetSphere = 'some_sphere';
      ai.decisionLockUntil = Date.now() + 10000;

      ai.reset();

      expect(ai.targetSphere).toBeNull();
      expect(ai.decisionLockUntil).toBe(0);
    });
  });
});

describe('Orbits Maps', () => {
  it('WIDE_MAP has correct dimensions', () => {
    expect(WIDE_MAP.arenaWidth).toBe(1200);
    expect(WIDE_MAP.arenaHeight).toBe(800);
    expect(WIDE_MAP.aspectRatio).toBe(1.5);
  });

  it('WIDE_MAP has 6 records', () => {
    expect(WIDE_MAP.records.length).toBe(6);
  });

  it('WIDE_MAP has barrier definitions', () => {
    expect(WIDE_MAP.barriers).toBeDefined();
    expect(WIDE_MAP.barriers.team0.y).toBe(0.05);
    expect(WIDE_MAP.barriers.team1.y).toBe(0.95);
  });

  it('WIDE_MAP has sphere spawn zone', () => {
    expect(WIDE_MAP.sphereSpawnZone).toBeDefined();
    expect(WIDE_MAP.sphereSpawnZone.minY).toBe(0.35);
    expect(WIDE_MAP.sphereSpawnZone.maxY).toBe(0.65);
  });
});
