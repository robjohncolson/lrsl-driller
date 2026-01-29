/**
 * Tests for Ghost Orbits Arena Manager
 * @see railway-server/ghost-orbits-manager.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import the modules we're testing
const { ArenaManager, Arena, Ghost, Vector2, ARENA_CONFIG, RoundState } = require('../../railway-server/ghost-orbits-manager.js');

describe('Ghost Orbits Arena Manager', () => {
  describe('Vector2', () => {
    it('should create a vector with x and y', () => {
      const v = new Vector2(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });

    it('should calculate length correctly', () => {
      const v = new Vector2(3, 4);
      expect(v.length()).toBe(5);
    });

    it('should normalize correctly', () => {
      const v = new Vector2(3, 4);
      v.normalize();
      expect(Math.abs(v.length() - 1)).toBeLessThan(0.0001);
    });

    it('should add vectors correctly', () => {
      const v1 = new Vector2(1, 2);
      const v2 = new Vector2(3, 4);
      v1.add(v2);
      expect(v1.x).toBe(4);
      expect(v1.y).toBe(6);
    });

    it('should calculate distance correctly', () => {
      const v1 = new Vector2(0, 0);
      const v2 = new Vector2(3, 4);
      expect(v1.distanceTo(v2)).toBe(5);
    });

    it('should clone correctly', () => {
      const v1 = new Vector2(3, 4);
      const v2 = v1.clone();
      v2.x = 10;
      expect(v1.x).toBe(3);
      expect(v2.x).toBe(10);
    });

    it('should create vector from angle', () => {
      const v = Vector2.fromAngle(0);
      expect(Math.abs(v.x - 1)).toBeLessThan(0.0001);
      expect(Math.abs(v.y - 0)).toBeLessThan(0.0001);
    });
  });

  describe('Ghost', () => {
    it('should create a ghost with username and position', () => {
      const spawnPos = new Vector2(100, 100);
      const ghost = new Ghost('testuser', null, spawnPos, 600);

      expect(ghost.username).toBe('testuser');
      expect(ghost.position.x).toBe(100);
      expect(ghost.position.y).toBe(100);
      expect(ghost.isAlive).toBe(true);
    });

    it('should generate consistent color from username', () => {
      const spawnPos = new Vector2(100, 100);
      const ghost1 = new Ghost('testuser', null, spawnPos, 600);
      const ghost2 = new Ghost('testuser', null, spawnPos, 600);

      expect(ghost1.color).toBe(ghost2.color);
    });

    it('should have initial energy', () => {
      const spawnPos = new Vector2(100, 100);
      const ghost = new Ghost('testuser', null, spawnPos, 600);

      expect(ghost.energy).toBe(ARENA_CONFIG.maxEnergy);
    });

    it('should have default properties without profile', () => {
      const spawnPos = new Vector2(100, 100);
      const ghost = new Ghost('testuser', null, spawnPos, 600);

      expect(ghost.properties.mass).toBe(1.0);
      expect(ghost.properties.thrustEfficiency).toBe(1.0);
    });

    it('should calculate properties from profile', () => {
      const spawnPos = new Vector2(100, 100);
      const profile = { proficiency_score: 0.8 };
      const ghost = new Ghost('testuser', profile, spawnPos, 600);

      // Mass should be 0.5 + 0.8 = 1.3
      expect(ghost.properties.mass).toBeCloseTo(1.3, 2);
      // Thrust should be 0.7 + 0.8 * 0.6 = 1.18
      expect(ghost.properties.thrustEfficiency).toBeCloseTo(1.18, 2);
    });

    it('should apply thrust and consume energy', () => {
      const spawnPos = new Vector2(100, 100);
      const ghost = new Ghost('testuser', null, spawnPos, 600);
      ghost.velocity = new Vector2(0, 0);  // Reset random velocity
      const initialEnergy = ghost.energy;

      ghost.applyThrust(new Vector2(1, 0));

      expect(ghost.energy).toBeLessThan(initialEnergy);
      expect(ghost.velocity.x).toBeGreaterThan(0);
    });

    it('should not thrust when out of energy', () => {
      const spawnPos = new Vector2(100, 100);
      const ghost = new Ghost('testuser', null, spawnPos, 600);
      ghost.energy = 0;

      ghost.applyThrust(new Vector2(1, 0));

      expect(ghost.velocity.length()).toBeLessThan(5); // Only initial random velocity
    });

    it('should eliminate ghost', () => {
      const spawnPos = new Vector2(100, 100);
      const ghost = new Ghost('testuser', null, spawnPos, 600);

      ghost.eliminate('attacker');

      expect(ghost.isAlive).toBe(false);
      expect(ghost.eliminatedBy).toBe('attacker');
    });

    it('should gain mass', () => {
      const spawnPos = new Vector2(100, 100);
      const ghost = new Ghost('testuser', null, spawnPos, 600);
      const initialMass = ghost.mass;

      ghost.gainMass(0.5);

      expect(ghost.mass).toBe(initialMass + 0.5);
    });

    it('should serialize to JSON', () => {
      const spawnPos = new Vector2(100, 100);
      const ghost = new Ghost('testuser', null, spawnPos, 600);
      const json = ghost.toJSON();

      expect(json.username).toBe('testuser');
      expect(json.position).toHaveProperty('x');
      expect(json.position).toHaveProperty('y');
      expect(json.isAlive).toBe(true);
    });
  });

  describe('Arena', () => {
    let arena;
    let broadcastMessages;

    beforeEach(() => {
      broadcastMessages = [];
      arena = new Arena('test-cartridge', 'A', (msg) => {
        broadcastMessages.push(msg);
      });
    });

    afterEach(() => {
      arena.destroy();
    });

    it('should create arena with correct initial state', () => {
      expect(arena.cartridgeId).toBe('test-cartridge');
      expect(arena.periodId).toBe('A');
      expect(arena.state).toBe(RoundState.WAITING);
      expect(arena.ghosts.size).toBe(0);
    });

    it('should add player to arena', () => {
      const result = arena.addPlayer('player1', { proficiency_score: 0.5 });

      expect(result.success).toBe(true);
      expect(arena.ghosts.size).toBe(1);
      expect(arena.ghosts.has('player1')).toBe(true);
    });

    it('should broadcast player_joined on join', () => {
      arena.addPlayer('player1', null);

      const joinMsg = broadcastMessages.find(m => m.type === 'player_joined');
      expect(joinMsg).toBeDefined();
      expect(joinMsg.username).toBe('player1');
    });

    it('should remove player from arena', () => {
      arena.addPlayer('player1', null);
      arena.removePlayer('player1');

      expect(arena.ghosts.size).toBe(0);
    });

    it('should broadcast player_left on leave', () => {
      arena.addPlayer('player1', null);
      arena.removePlayer('player1');

      const leaveMsg = broadcastMessages.find(m => m.type === 'player_left');
      expect(leaveMsg).toBeDefined();
      expect(leaveMsg.username).toBe('player1');
    });

    it('should queue players during active round', () => {
      // Add player to start
      arena.addPlayer('player1', null);

      // Force active state
      arena.state = RoundState.ACTIVE;

      // Try to add another player
      arena.addPlayer('player2', null);

      // Should be in pending, not ghosts
      expect(arena.ghosts.size).toBe(1);
      expect(arena.pendingPlayers.size).toBe(1);
      expect(arena.pendingPlayers.has('player2')).toBe(true);
    });

    it('should calculate arena size based on player count', () => {
      expect(arena.calculateArenaSize(1)).toBe(ARENA_CONFIG.minArenaSize);
      expect(arena.calculateArenaSize(5)).toBe(
        ARENA_CONFIG.minArenaSize + 4 * ARENA_CONFIG.spacePerPlayer
      );
    });

    it('should cap arena size at maximum', () => {
      expect(arena.calculateArenaSize(100)).toBe(ARENA_CONFIG.maxArenaSize);
    });

    it('should calculate spawn positions around edges', () => {
      arena.arenaSize = 600;

      // With 2 players, positions should be on opposite sides
      const pos1 = arena.getSpawnPosition(0);
      arena.ghosts.set('dummy1', {});
      arena.ghosts.set('dummy2', {});
      const pos2 = arena.getSpawnPosition(1);

      // Positions should be different for different indices with multiple players
      expect(pos1.x).not.toBe(pos2.x);
      arena.ghosts.clear();
    });

    it('should get arena ID', () => {
      expect(arena.getArenaId()).toBe('test-cartridge:A');
    });

    it('should get alive count', () => {
      // Create ghosts directly to avoid state changes
      const ghost1 = new Ghost('player1', null, new Vector2(100, 100), 600);
      const ghost2 = new Ghost('player2', null, new Vector2(200, 200), 600);
      arena.ghosts.set('player1', ghost1);
      arena.ghosts.set('player2', ghost2);

      expect(arena.getAliveCount()).toBe(2);

      ghost1.eliminate('player2');

      expect(arena.getAliveCount()).toBe(1);
    });

    it('should get state snapshot', () => {
      // Add ghost directly to avoid triggering countdown
      const ghost = new Ghost('player1', null, new Vector2(100, 100), 600);
      arena.ghosts.set('player1', ghost);

      const state = arena.getState();

      expect(state.arenaId).toBe('test-cartridge:A');
      expect(state.state).toBe(RoundState.WAITING);
      expect(state.ghosts).toHaveProperty('player1');
      expect(state.playerCount).toBe(1);
    });

    it('should clean up on destroy', () => {
      arena.addPlayer('player1', null);
      arena.destroy();

      expect(arena.ghosts.size).toBe(0);
      expect(arena.trails.length).toBe(0);
    });
  });

  describe('ArenaManager', () => {
    let manager;
    let broadcastMessages;

    beforeEach(() => {
      broadcastMessages = [];
      manager = new ArenaManager((msg) => {
        broadcastMessages.push(msg);
      });
    });

    afterEach(() => {
      manager.destroyAll();
    });

    it('should get arena ID from cartridge and period', () => {
      expect(manager.getArenaId('cartridge1', 'A')).toBe('cartridge1:A');
    });

    it('should create arena on first access', () => {
      const arena = manager.getOrCreateArena('cartridge1', 'A');

      expect(arena).toBeDefined();
      expect(arena.cartridgeId).toBe('cartridge1');
      expect(arena.periodId).toBe('A');
    });

    it('should return same arena on subsequent access', () => {
      const arena1 = manager.getOrCreateArena('cartridge1', 'A');
      const arena2 = manager.getOrCreateArena('cartridge1', 'A');

      expect(arena1).toBe(arena2);
    });

    it('should create separate arenas for different periods', () => {
      const arena1 = manager.getOrCreateArena('cartridge1', 'A');
      const arena2 = manager.getOrCreateArena('cartridge1', 'B');

      expect(arena1).not.toBe(arena2);
    });

    it('should handle join arena', () => {
      const result = manager.handleJoinArena('player1', 'cartridge1', 'A', null);

      expect(result.success).toBe(true);

      const state = manager.getArenaState('cartridge1', 'A');
      expect(state.ghosts).toHaveProperty('player1');
    });

    it('should handle leave arena', () => {
      manager.handleJoinArena('player1', 'cartridge1', 'A', null);
      manager.handleLeaveArena('player1', 'cartridge1', 'A');

      // Arena should be destroyed when empty
      expect(manager.getArena('cartridge1', 'A')).toBeUndefined();
    });

    it('should get active arenas list', () => {
      manager.handleJoinArena('player1', 'cartridge1', 'A', null);
      manager.handleJoinArena('player2', 'cartridge1', 'B', null);

      const active = manager.getActiveArenas();

      expect(active.length).toBe(2);
      expect(active.map(a => a.arenaId)).toContain('cartridge1:A');
      expect(active.map(a => a.arenaId)).toContain('cartridge1:B');
    });

    it('should destroy specific arena', () => {
      manager.handleJoinArena('player1', 'cartridge1', 'A', null);
      manager.destroyArena('cartridge1', 'A');

      expect(manager.getArena('cartridge1', 'A')).toBeUndefined();
    });

    it('should destroy all arenas', () => {
      manager.handleJoinArena('player1', 'cartridge1', 'A', null);
      manager.handleJoinArena('player2', 'cartridge1', 'B', null);
      manager.destroyAll();

      expect(manager.getActiveArenas().length).toBe(0);
    });
  });

  describe('ARENA_CONFIG', () => {
    it('should have required configuration values', () => {
      expect(ARENA_CONFIG.minArenaSize).toBeDefined();
      expect(ARENA_CONFIG.maxArenaSize).toBeDefined();
      expect(ARENA_CONFIG.tickRate).toBe(20);
      expect(ARENA_CONFIG.countdownDuration).toBe(3000);
      expect(ARENA_CONFIG.roundDuration).toBe(150000);
      expect(ARENA_CONFIG.intermissionDuration).toBe(10000);
    });

    it('should have physics configuration', () => {
      expect(ARENA_CONFIG.thrustForce).toBeDefined();
      expect(ARENA_CONFIG.maxVelocity).toBeDefined();
      expect(ARENA_CONFIG.friction).toBeDefined();
      expect(ARENA_CONFIG.wallBounceRestitution).toBeDefined();
    });

    it('should have collision configuration', () => {
      expect(ARENA_CONFIG.massAbsorptionThreshold).toBe(1.2);
      expect(ARENA_CONFIG.massGainRatio).toBe(0.5);
    });

    it('should have end conditions', () => {
      expect(ARENA_CONFIG.territoryThreshold).toBe(0.7);
    });
  });

  describe('RoundState', () => {
    it('should have all required states', () => {
      expect(RoundState.WAITING).toBe('waiting');
      expect(RoundState.COUNTDOWN).toBe('countdown');
      expect(RoundState.ACTIVE).toBe('active');
      expect(RoundState.ENDED).toBe('ended');
      expect(RoundState.INTERMISSION).toBe('intermission');
    });
  });
});
