/**
 * Ghost Orbits - Blizzard Mode Tests (12-Orbits Style)
 *
 * Tests for the dot-based territory game with smash physics.
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
        { id: 'record1', position: { x: 180, y: 133 }, radius: 70, captureRadius: 70 },
        { id: 'record2', position: { x: 180, y: 400 }, radius: 70, captureRadius: 70 },
        { id: 'record3', position: { x: 180, y: 666 }, radius: 70, captureRadius: 70 },
        { id: 'record4', position: { x: 420, y: 266 }, radius: 70, captureRadius: 70 },
        { id: 'record5', position: { x: 420, y: 533 }, radius: 70, captureRadius: 70 },
        { id: 'record6', position: { x: 780, y: 266 }, radius: 70, captureRadius: 70 },
        { id: 'record7', position: { x: 780, y: 533 }, radius: 70, captureRadius: 70 },
        { id: 'record8', position: { x: 1020, y: 133 }, radius: 70, captureRadius: 70 },
        { id: 'record9', position: { x: 1020, y: 400 }, radius: 70, captureRadius: 70 },
        { id: 'record10', position: { x: 1020, y: 666 }, radius: 70, captureRadius: 70 }
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

    it('spawns initial dots from center emitter', () => {
      expect(mode.dots.length).toBe(WIDE_MAP.dotEmitter.initialDots);
    });

    it('initializes barriers at correct positions', () => {
      expect(mode.barriers.length).toBe(2);

      const leftBarrier = mode.barriers.find(b => b.teamId === 0);
      const rightBarrier = mode.barriers.find(b => b.teamId === 1);

      expect(leftBarrier).toBeDefined();
      expect(rightBarrier).toBeDefined();
      expect(leftBarrier.x).toBe(0);
      expect(rightBarrier.x).toBe(mode.arenaWidth);
      expect(leftBarrier.orientation).toBe('vertical');
      expect(rightBarrier.orientation).toBe('vertical');
    });

    it('initializes team assignments', () => {
      expect(mode.teams.get('player')).toBe(0);
      expect(mode.teams.get('shadow_self')).toBe(1);
    });

    it('initializes team scores to zero', () => {
      expect(mode.teamScores[0]).toBe(0);
      expect(mode.teamScores[1]).toBe(0);
    });

    it('sets 1 minute round duration', () => {
      expect(mode.matchTimeRemaining).toBe(BLIZZARD_CONFIG.ROUND_DURATION_MS);
      expect(BLIZZARD_CONFIG.ROUND_DURATION_MS).toBe(60000);
    });

    it('initializes Shadow AI', () => {
      expect(mode.shadowAI).toBeDefined();
      expect(mode.shadowAI).toBeInstanceOf(BlizzardAI);
    });
  });

  describe('Dot Mechanics', () => {
    it('dots spawn at center with drift', () => {
      const centerX = mode.arenaWidth * WIDE_MAP.dotEmitter.x;

      for (const dot of mode.dots) {
        // Dots should spawn at center x
        expect(dot.x).toBe(centerX);
        // Should have some velocity (drift)
        const speed = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);
        expect(speed).toBeCloseTo(WIDE_MAP.dotEmitter.driftSpeed, 1);
      }
    });

    it('dots are neutral initially', () => {
      for (const dot of mode.dots) {
        expect(dot.teamId).toBeNull();
      }
    });

    it('dots have correct radius', () => {
      for (const dot of mode.dots) {
        expect(dot.radius).toBe(BLIZZARD_CONFIG.DOT_RADIUS);
      }
    });

    it('dots move when updated', () => {
      const dot = mode.dots[0];
      const initialX = dot.x;
      const initialY = dot.y;

      // Ensure dot has velocity
      dot.vx = 50;
      dot.vy = 50;

      mode._updateDots(0.1); // 100ms

      expect(dot.x).not.toBe(initialX);
      expect(dot.y).not.toBe(initialY);
    });

    it('dots bounce off top/bottom walls', () => {
      const dot = mode.dots[0];

      // Move dot to top wall
      dot.x = 400;
      dot.y = 5;
      dot.vx = 0;
      dot.vy = -100;

      dot.update(0.1, mode.arenaWidth, mode.arenaHeight);

      expect(dot.vy).toBeGreaterThan(0); // Reversed direction
      expect(dot.y).toBeGreaterThanOrEqual(dot.radius);
    });
  });

  describe('Smash Mechanics (Billiard Physics)', () => {
    it('touching dot claims it and smashes away from player', () => {
      const dot = mode.dots[0];
      dot.x = 250;
      dot.y = 600;
      dot.teamId = null;
      dot.vx = 0;
      dot.vy = 0;

      // Player at 200, 600 touches dot at 250, 600
      // Dot should fly to the RIGHT (away from player)
      mode._handleDotCollision(dot, 'player', 0, 200, 600, false);

      expect(dot.teamId).toBe(0);
      expect(dot.lastTouchedBy).toBe('player');
      expect(dot.vx).toBeGreaterThan(0); // Flying away (right)
      const speed = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);
      expect(speed).toBeCloseTo(BLIZZARD_CONFIG.DOT_BASE_SPEED, 10);
    });

    it('dash gives 1.5x power hit velocity', () => {
      const dot = mode.dots[0];
      dot.x = 250;
      dot.y = 600;
      dot.teamId = null;

      // Power hit (dashing = true)
      mode._handleDotCollision(dot, 'player', 0, 200, 600, true);

      const speed = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);
      const expectedSpeed = BLIZZARD_CONFIG.DOT_BASE_SPEED * BLIZZARD_CONFIG.DASH_POWER_MULTIPLIER;
      expect(speed).toBeCloseTo(expectedSpeed, 10);
    });

    it('smash direction is away from player center', () => {
      const dot = mode.dots[0];

      // Test: player below-left of dot
      dot.x = 300;
      dot.y = 300;
      mode._handleDotCollision(dot, 'player', 0, 200, 400, false);

      // Dot should fly up-right (away from player)
      expect(dot.vx).toBeGreaterThan(0);
      expect(dot.vy).toBeLessThan(0);
    });
  });

  describe('Goal-Based Scoring', () => {
    it('team 0 scores when their dot crosses right goal', () => {
      const dot = mode.dots[0];
      dot.x = mode.arenaWidth + dot.radius + 1;
      dot.y = 400;
      dot.teamId = 0; // Team 0's dot
      dot.vx = 100;

      mode._checkGoalCollisions();

      expect(mode.teamScores[0]).toBe(1);
      expect(mode.dots.find(d => d.id === dot.id)).toBeUndefined();
    });

    it('team 1 scores when their dot crosses left goal', () => {
      const dot = mode.dots[0];
      dot.x = -dot.radius - 1;
      dot.y = 400;
      dot.teamId = 1; // Team 1's dot
      dot.vx = -100;

      mode._checkGoalCollisions();

      expect(mode.teamScores[1]).toBe(1);
    });

    it('neutral dots do not score (despawn only)', () => {
      const dot = mode.dots[0];
      dot.x = mode.arenaWidth + dot.radius + 1;
      dot.y = 400;
      dot.teamId = null; // Neutral
      dot.vx = 100;

      const initialScore0 = mode.teamScores[0];
      const initialScore1 = mode.teamScores[1];

      mode._checkGoalCollisions();

      expect(mode.teamScores[0]).toBe(initialScore0);
      expect(mode.teamScores[1]).toBe(initialScore1);
      expect(mode.dots.find(d => d.id === dot.id)).toBeUndefined(); // Still removed
    });

    it('own goal is prevented (team 0 dot at team 0 goal = no score)', () => {
      const dot = mode.dots[0];
      dot.x = -dot.radius - 1;
      dot.y = 400;
      dot.teamId = 0; // Team 0's dot at team 0's goal
      dot.vx = -100;

      const initialScore0 = mode.teamScores[0];
      const initialScore1 = mode.teamScores[1];

      mode._checkGoalCollisions();

      // No score awarded
      expect(mode.teamScores[0]).toBe(initialScore0);
      expect(mode.teamScores[1]).toBe(initialScore1);
    });
  });

  describe('Dash State Management', () => {
    it('setPlayerDashing sets dash until timestamp', () => {
      const dashUntil = Date.now() + 400;
      mode.setPlayerDashing(dashUntil);
      expect(mode.playerDashUntil).toBe(dashUntil);
    });

    it('setShadowDashing sets shadow dash until timestamp', () => {
      const dashUntil = Date.now() + 400;
      mode.setShadowDashing(dashUntil);
      expect(mode.shadowDashUntil).toBe(dashUntil);
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
      mode.matchTimeRemaining = 30000;

      const result = mode.checkEndCondition();

      expect(result.ended).toBe(false);
    });
  });

  describe('Dot Spawner', () => {
    it('spawns new dots periodically up to max', () => {
      const emitter = WIDE_MAP.dotEmitter;
      mode.dots = [];
      mode.lastDotSpawn = 0;

      mode._checkDotSpawner(emitter.spawnInterval + 1);

      expect(mode.dots.length).toBe(1);
    });

    it('does not exceed max dots', () => {
      const emitter = WIDE_MAP.dotEmitter;

      // Fill to max
      while (mode.dots.length < emitter.maxDots) {
        mode._spawnDotAtCenter();
      }

      const countBefore = mode.dots.length;
      mode._checkDotSpawner(Date.now() + emitter.spawnInterval * 10);

      expect(mode.dots.length).toBe(countBefore);
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
    it('includes dots with team colors', () => {
      mode.dots[0].teamId = 0;

      const renderData = mode.getRenderData();

      expect(renderData.blizzardDots).toBeDefined();
      expect(renderData.blizzardDots.length).toBe(mode.dots.length);

      const ownedDot = renderData.blizzardDots.find(d => d.teamId === 0);
      expect(ownedDot.teamColor).toBe(mode.teamColors[0]);
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
  });

  describe('Reset', () => {
    it('resets scores on rematch', () => {
      mode.teamScores = [10, 5];

      mode.reset();

      expect(mode.teamScores).toEqual([0, 0]);
    });

    it('respawns dots on rematch', () => {
      mode.dots = [];

      mode.reset();

      expect(mode.dots.length).toBe(WIDE_MAP.dotEmitter.initialDots);
    });

    it('resets match result on rematch', () => {
      mode.matchResult = 'player_win';
      mode.winCondition = 'score_limit';

      mode.reset();

      expect(mode.matchResult).toBeNull();
      expect(mode.winCondition).toBeNull();
    });

    it('resets dash states on rematch', () => {
      mode.playerDashUntil = Date.now() + 1000;
      mode.shadowDashUntil = Date.now() + 1000;

      mode.reset();

      expect(mode.playerDashUntil).toBe(0);
      expect(mode.shadowDashUntil).toBe(0);
    });
  });

  describe('Serialization', () => {
    it('serializes state correctly', () => {
      mode.teamScores = [5, 3];
      mode.matchTimeRemaining = 30000;

      const state = mode.serializeState();

      expect(state.type).toBe('BlizzardMode');
      expect(state.teamScores).toEqual([5, 3]);
      expect(state.matchTimeRemaining).toBe(30000);
      expect(state.dots).toBeDefined();
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
    it('sets correct goal positions', () => {
      // Team 1 defends RIGHT goal
      expect(ai.ownGoalX).toBe(1200);
      expect(ai.enemyGoalX).toBe(0);
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
        dots: [],
        barriers: [],
        records: [],
        currentTime: Date.now()
      };

      const decision = ai.update(0.016, gameState);

      expect(decision.moveDirection).toBeDefined();
      expect(decision.wantsOrbit).toBe(false);
      expect(decision.wantsDash).toBe(false);
    });

    it('prioritizes intercepting enemy dots heading toward own goal', () => {
      const gameState = {
        selfX: 1000,
        selfY: 400,
        selfVx: 0,
        selfVy: 0,
        selfIsOrbiting: false,
        dots: [
          {
            id: 'dot1',
            x: 950,
            y: 500,
            vx: 200, // Fast, heading toward right (AI's goal)
            vy: 0,
            teamId: 0 // Enemy dot
          }
        ],
        barriers: [],
        records: [],
        currentTime: Date.now()
      };

      const decision = ai.update(0.016, gameState);

      expect(decision.moveDirection).toBeDefined();
      // Should move toward the dot's predicted position
      expect(decision.moveDirection.y).toBeGreaterThan(0); // Moving toward dot
    });

    it('seeks neutral dots when no threats', () => {
      const gameState = {
        selfX: 1000,
        selfY: 400,
        selfVx: 0,
        selfVy: 0,
        selfIsOrbiting: false,
        dots: [
          {
            id: 'dot1',
            x: 800,
            y: 400,
            vx: -50, // Heading away from AI's goal
            vy: 0,
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

    it('wants to release from orbit when dot is nearby', () => {
      const gameState = {
        selfX: 600,
        selfY: 600,
        selfVx: 0,
        selfVy: 0,
        selfIsOrbiting: true,
        dots: [
          {
            id: 'dot1',
            x: 650,
            y: 620,
            vx: 0,
            vy: 50,
            teamId: 0
          }
        ],
        barriers: [],
        records: [
          { x: 600, y: 600, radius: 70, captureRadius: 70 }
        ],
        currentTime: Date.now() + 1000
      };

      ai.orbitEntryTime = Date.now() - 1000;

      const decision = ai.update(0.016, gameState);

      expect(decision.wantsRelease).toBe(true);
    });

    it('can decide to dash for power hit', () => {
      // Force a dash decision by being very close to a dot
      const gameState = {
        selfX: 820,
        selfY: 400,
        selfVx: 0,
        selfVy: 0,
        selfIsOrbiting: false,
        dots: [
          {
            id: 'dot1',
            x: 840, // Very close
            y: 400,
            vx: -50,
            vy: 0,
            teamId: null
          }
        ],
        barriers: [],
        records: [],
        currentTime: Date.now() + 1000
      };

      // Run multiple times since dash has randomness
      let sawDash = false;
      for (let i = 0; i < 20; i++) {
        ai.decisionLockUntil = 0; // Reset lock
        const decision = ai.update(0.016, { ...gameState, currentTime: Date.now() + i * 100 });
        if (decision.wantsDash) sawDash = true;
      }

      expect(sawDash).toBe(true); // Should have seen at least one dash decision
    });
  });

  describe('Reset', () => {
    it('resets state correctly', () => {
      ai.targetDot = 'some_dot';
      ai.decisionLockUntil = Date.now() + 10000;

      ai.reset();

      expect(ai.targetDot).toBeNull();
      expect(ai.decisionLockUntil).toBe(0);
      expect(ai.lastDecision.wantsDash).toBe(false);
    });
  });
});

describe('Orbits Maps', () => {
  it('WIDE_MAP has correct dimensions', () => {
    expect(WIDE_MAP.arenaWidth).toBe(1200);
    expect(WIDE_MAP.arenaHeight).toBe(800);
    expect(WIDE_MAP.aspectRatio).toBe(1.5);
  });

  it('WIDE_MAP has 10 records (12-orbits Blizzard layout)', () => {
    expect(WIDE_MAP.records.length).toBe(10);
  });

  it('WIDE_MAP has 75% larger records', () => {
    expect(WIDE_MAP.recordRadius).toBe(70);
    expect(WIDE_MAP.captureRadius).toBe(70);
  });

  it('WIDE_MAP has barrier definitions', () => {
    expect(WIDE_MAP.barriers).toBeDefined();
    expect(WIDE_MAP.barriers.team0.x).toBe(0.0);
    expect(WIDE_MAP.barriers.team1.x).toBe(1.0);
  });

  it('WIDE_MAP has dot emitter config', () => {
    expect(WIDE_MAP.dotEmitter).toBeDefined();
    expect(WIDE_MAP.dotEmitter.x).toBe(0.5);
    expect(WIDE_MAP.dotEmitter.spawnInterval).toBe(2500);
    expect(WIDE_MAP.dotEmitter.initialDots).toBe(8);
    expect(WIDE_MAP.dotEmitter.maxDots).toBe(15);
    expect(WIDE_MAP.dotEmitter.driftSpeed).toBe(20);
  });
});

describe('BLIZZARD_CONFIG', () => {
  it('has 1 minute round duration', () => {
    expect(BLIZZARD_CONFIG.ROUND_DURATION_MS).toBe(60000);
  });

  it('has correct dot physics config', () => {
    expect(BLIZZARD_CONFIG.DOT_RADIUS).toBe(10);
    expect(BLIZZARD_CONFIG.DOT_BASE_SPEED).toBe(300);
    expect(BLIZZARD_CONFIG.DOT_DRIFT_SPEED).toBe(20);
    expect(BLIZZARD_CONFIG.DOT_FRICTION).toBe(0.998);
  });

  it('has 1.5x dash power multiplier', () => {
    expect(BLIZZARD_CONFIG.DASH_POWER_MULTIPLIER).toBe(1.5);
  });

  it('has correct spawner config', () => {
    expect(BLIZZARD_CONFIG.INITIAL_DOTS).toBe(8);
    expect(BLIZZARD_CONFIG.MAX_DOTS).toBe(15);
    expect(BLIZZARD_CONFIG.SPAWN_INTERVAL).toBe(2500);
  });
});
