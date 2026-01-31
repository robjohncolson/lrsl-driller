/**
 * Tests for Ghost Orbits Multiplayer Manager
 * @see railway-server/ghost-orbits-multiplayer-manager.js
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  OrbitsMultiplayerManager,
  MultiplayerRoom,
  MultiplayerGhost,
  MULTIPLAYER_CONFIG,
  RoomState
} = require('../../railway-server/ghost-orbits-multiplayer-manager.js');

describe('Ghost Orbits Multiplayer Manager', () => {
  // ============================================
  // MULTIPLAYER CONFIG
  // ============================================

  describe('MULTIPLAYER_CONFIG', () => {
    it('should have correct tick rates', () => {
      expect(MULTIPLAYER_CONFIG.tickRate).toBe(60);
      expect(MULTIPLAYER_CONFIG.snapshotRate).toBe(20);
    });

    it('should have room code length of 6', () => {
      expect(MULTIPLAYER_CONFIG.roomCodeLength).toBe(6);
    });

    it('should support 2 players per room (1v1)', () => {
      expect(MULTIPLAYER_CONFIG.maxPlayersPerRoom).toBe(2);
    });

    it('should have reasonable round duration', () => {
      expect(MULTIPLAYER_CONFIG.roundDuration).toBe(120000); // 2 minutes
    });

    it('should have 90% win threshold', () => {
      expect(MULTIPLAYER_CONFIG.winThreshold).toBe(0.90);
    });

    it('should have 15px claim radius (matches single-player Arena)', () => {
      expect(MULTIPLAYER_CONFIG.dotClaimRadius).toBe(15);
    });

    it('should have 15px damage radius (matches single-player Arena)', () => {
      expect(MULTIPLAYER_CONFIG.dotDamageRadius).toBe(15);
    });
  });

  // ============================================
  // ROOM STATE
  // ============================================

  describe('RoomState', () => {
    it('should have all required states', () => {
      expect(RoomState.LOBBY).toBe('lobby');
      expect(RoomState.COUNTDOWN).toBe('countdown');
      expect(RoomState.PLAYING).toBe('playing');
      expect(RoomState.ENDED).toBe('ended');
    });
  });

  // ============================================
  // ORBITS MULTIPLAYER MANAGER
  // ============================================

  describe('OrbitsMultiplayerManager', () => {
    let manager;

    beforeEach(() => {
      manager = new OrbitsMultiplayerManager();
    });

    afterEach(() => {
      manager.destroy();
    });

    describe('Room Creation', () => {
      it('should create a room with unique code', () => {
        const result = manager.createRoom('testuser', 'arena');

        expect(result.success).toBe(true);
        expect(result.roomCode).toHaveLength(6);
        expect(result.playerId).toMatch(/^p_/);
      });

      it('should create rooms with different codes', () => {
        const result1 = manager.createRoom('user1', 'arena');
        const result2 = manager.createRoom('user2', 'arena');

        expect(result1.roomCode).not.toBe(result2.roomCode);
      });

      it('should track room in active rooms', () => {
        const result = manager.createRoom('testuser', 'arena');
        const room = manager.getRoom(result.roomCode);

        expect(room).toBeDefined();
        expect(room.roomCode).toBe(result.roomCode);
      });

      it('should set creator as host', () => {
        const result = manager.createRoom('testuser', 'arena');
        const room = manager.getRoom(result.roomCode);

        expect(room.hostId).toBe(result.playerId);
      });

      it('should accept mode parameter', () => {
        const result = manager.createRoom('testuser', 'trails');
        const room = manager.getRoom(result.roomCode);

        expect(room.mode).toBe('trails');
      });
    });

    describe('Room Joining', () => {
      it('should allow joining existing room', () => {
        const createResult = manager.createRoom('host', 'arena');
        const joinResult = manager.joinRoom(createResult.roomCode, 'joiner');

        expect(joinResult.success).toBe(true);
        expect(joinResult.roomCode).toBe(createResult.roomCode);
        expect(joinResult.playerId).toMatch(/^p_/);
      });

      it('should fail joining non-existent room', () => {
        const result = manager.joinRoom('ZZZZZZ', 'joiner');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Room not found');
      });

      it('should fail joining full room', () => {
        const createResult = manager.createRoom('host', 'arena');
        manager.joinRoom(createResult.roomCode, 'player2');
        const thirdPlayer = manager.joinRoom(createResult.roomCode, 'player3');

        expect(thirdPlayer.success).toBe(false);
        expect(thirdPlayer.error).toBe('Room is full');
      });

      it('should be case insensitive', () => {
        const createResult = manager.createRoom('host', 'arena');
        const joinResult = manager.joinRoom(createResult.roomCode.toLowerCase(), 'joiner');

        expect(joinResult.success).toBe(true);
      });
    });

    describe('Room Leaving', () => {
      it('should remove player from room', () => {
        const createResult = manager.createRoom('host', 'arena');
        const joinResult = manager.joinRoom(createResult.roomCode, 'joiner');

        manager.leaveRoom(joinResult.playerId);

        const room = manager.getRoom(createResult.roomCode);
        expect(room.players.size).toBe(1);
      });

      it('should delete empty room', () => {
        const createResult = manager.createRoom('host', 'arena');
        manager.leaveRoom(createResult.playerId);

        const room = manager.getRoom(createResult.roomCode);
        expect(room).toBeUndefined();
      });

      it('should reassign host when host leaves', () => {
        const createResult = manager.createRoom('host', 'arena');
        const joinResult = manager.joinRoom(createResult.roomCode, 'joiner');

        manager.leaveRoom(createResult.playerId);

        const room = manager.getRoom(createResult.roomCode);
        expect(room.hostId).toBe(joinResult.playerId);
      });
    });

    describe('Active Rooms', () => {
      it('should list active rooms', () => {
        manager.createRoom('user1', 'arena');
        manager.createRoom('user2', 'trails');

        const activeRooms = manager.getActiveRooms();

        expect(activeRooms).toHaveLength(2);
        expect(activeRooms[0].state).toBe('lobby');
      });

      it('should include room details in active list', () => {
        const result = manager.createRoom('testuser', 'arena');
        const activeRooms = manager.getActiveRooms();

        const room = activeRooms.find(r => r.roomCode === result.roomCode);
        expect(room).toBeDefined();
        expect(room.playerCount).toBe(1);
        expect(room.mode).toBe('arena');
        expect(room.hostUsername).toBe('testuser');
      });
    });

    describe('Room Rejoining', () => {
      it('should allow rejoining with existing playerId', () => {
        const createResult = manager.createRoom('host', 'arena');
        const mockWs = { readyState: 1, send: vi.fn() };

        const rejoinResult = manager.rejoinRoom(
          createResult.roomCode,
          createResult.playerId,
          'host',
          mockWs
        );

        expect(rejoinResult.success).toBe(true);
        expect(rejoinResult.playerId).toBe(createResult.playerId);
        expect(rejoinResult.isHost).toBe(true);
      });

      it('should update WebSocket on rejoin', () => {
        const createResult = manager.createRoom('host', 'arena');
        const mockWs = { readyState: 1, send: vi.fn() };

        manager.rejoinRoom(
          createResult.roomCode,
          createResult.playerId,
          'host',
          mockWs
        );

        const room = manager.getRoom(createResult.roomCode);
        expect(room.players.get(createResult.playerId).ws).toBe(mockWs);
      });

      it('should fail rejoin for non-existent room', () => {
        const mockWs = { readyState: 1, send: vi.fn() };

        const rejoinResult = manager.rejoinRoom(
          'ZZZZZZ',
          'fake_id',
          'user',
          mockWs
        );

        expect(rejoinResult.success).toBe(false);
        expect(rejoinResult.error).toBe('Room not found');
      });

      it('should allow fresh join if playerId not found and room not full', () => {
        const createResult = manager.createRoom('host', 'arena');
        const mockWs = { readyState: 1, send: vi.fn() };

        const rejoinResult = manager.rejoinRoom(
          createResult.roomCode,
          'non_existent_player_id',
          'newplayer',
          mockWs
        );

        expect(rejoinResult.success).toBe(true);
        expect(rejoinResult.playerId).not.toBe('non_existent_player_id'); // New ID generated
      });
    });
  });

  // ============================================
  // MULTIPLAYER ROOM
  // ============================================

  describe('MultiplayerRoom', () => {
    let room;
    let broadcastMock;

    beforeEach(() => {
      broadcastMock = vi.fn();
      room = new MultiplayerRoom('ABC123', 'host_id', 'hostuser', 'arena', broadcastMock);
    });

    afterEach(() => {
      room.destroy();
    });

    describe('Initialization', () => {
      it('should start in lobby state', () => {
        expect(room.state).toBe(RoomState.LOBBY);
      });

      it('should have host as first player', () => {
        expect(room.players.size).toBe(1);
        expect(room.players.get('host_id').username).toBe('hostuser');
      });

      it('should track arena size', () => {
        expect(room.arenaSize).toBe(800);
      });
    });

    describe('Player Management', () => {
      it('should add player successfully', () => {
        const result = room.addPlayer('player2_id', 'player2', null);

        expect(result.success).toBe(true);
        expect(room.players.size).toBe(2);
      });

      it('should reject player when room is full', () => {
        room.addPlayer('player2_id', 'player2', null);
        const result = room.addPlayer('player3_id', 'player3', null);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Room is full');
      });

      it('should assign different colors to players', () => {
        room.addPlayer('player2_id', 'player2', null);

        const hostColor = room.players.get('host_id').color;
        const player2Color = room.players.get('player2_id').color;

        expect(hostColor).not.toBe(player2Color);
      });

      it('should remove player correctly', () => {
        room.addPlayer('player2_id', 'player2', null);
        room.removePlayer('player2_id');

        expect(room.players.size).toBe(1);
        expect(room.players.has('player2_id')).toBe(false);
      });
    });

    describe('Ready System', () => {
      it('should track player ready state', () => {
        room.addPlayer('player2_id', 'player2', null);
        room.setPlayerReady('player2_id', true);

        expect(room.players.get('player2_id').ready).toBe(true);
      });

      it('should not be able to start with only one player', () => {
        room.setPlayerReady('host_id', true);

        expect(room.canStart()).toBe(false);
      });

      it('should not be able to start when not all ready', () => {
        room.addPlayer('player2_id', 'player2', null);
        room.setPlayerReady('host_id', true);
        // player2 not ready

        expect(room.canStart()).toBe(false);
      });

      it('should be able to start when all players ready', () => {
        room.addPlayer('player2_id', 'player2', null);
        room.setPlayerReady('host_id', true);
        room.setPlayerReady('player2_id', true);

        expect(room.canStart()).toBe(true);
      });
    });

    describe('Match Starting', () => {
      beforeEach(() => {
        room.addPlayer('player2_id', 'player2', null);
        room.setPlayerReady('host_id', true);
        room.setPlayerReady('player2_id', true);
      });

      it('should reject start when cannot start', () => {
        room.setPlayerReady('player2_id', false);
        const result = room.startCountdown();

        expect(result.success).toBe(false);
      });

      it('should transition to countdown state', () => {
        room.startCountdown();

        expect(room.state).toBe(RoomState.COUNTDOWN);
      });

      it('should broadcast countdown messages', () => {
        // Add mock WebSocket clients to receive broadcasts
        const mockWs1 = { readyState: 1, send: vi.fn() };
        const mockWs2 = { readyState: 1, send: vi.fn() };
        room.players.get('host_id').ws = mockWs1;
        room.players.get('player2_id').ws = mockWs2;

        room.startCountdown();

        // Check that at least one client received countdown message
        expect(mockWs1.send).toHaveBeenCalled();
        const sentMessage = JSON.parse(mockWs1.send.mock.calls[0][0]);
        expect(sentMessage.type).toBe('orbits_countdown');
        expect(sentMessage.payload.secondsRemaining).toBe(3);
      });
    });

    describe('Staleness', () => {
      it('should not be stale when recently active', () => {
        expect(room.isStale()).toBe(false);
      });

      it('should track last activity', () => {
        const beforeActivity = room.lastActivity;
        room.addPlayer('player2_id', 'player2', null);

        expect(room.lastActivity).toBeGreaterThanOrEqual(beforeActivity);
      });
    });
  });

  // ============================================
  // MULTIPLAYER GHOST
  // ============================================

  describe('MultiplayerGhost', () => {
    let ghost;

    beforeEach(() => {
      const Vector2 = require('../../railway-server/ghost-orbits-multiplayer-manager.js').Vector2 ||
        class Vector2 {
          constructor(x = 0, y = 0) { this.x = x; this.y = y; }
          clone() { return { x: this.x, y: this.y }; }
        };
      const spawnPos = { x: 100, y: 100, clone() { return { ...this }; } };
      ghost = new MultiplayerGhost('test_id', 'testuser', '#4488ff', spawnPos, 800);
    });

    it('should initialize with correct properties', () => {
      expect(ghost.playerId).toBe('test_id');
      expect(ghost.username).toBe('testuser');
      expect(ghost.color).toBe('#4488ff');
      expect(ghost.lives).toBe(MULTIPLAYER_CONFIG.initialLives);
    });

    it('should start in FREE_FLIGHT state', () => {
      expect(ghost.movementState).toBe('FREE_FLIGHT');
    });

    it('should be alive initially', () => {
      expect(ghost.isAlive).toBe(true);
    });

    describe('Damage', () => {
      it('should reduce lives on damage', () => {
        const initialLives = ghost.lives;
        ghost.takeDamage();

        expect(ghost.lives).toBe(initialLives - 1);
      });

      it('should set invulnerability after damage', () => {
        ghost.takeDamage();

        expect(ghost.invulnerableUntil).toBeGreaterThan(Date.now());
      });

      it('should not take damage while invulnerable', () => {
        ghost.takeDamage();
        const livesAfterFirst = ghost.lives;
        ghost.takeDamage(); // Should not reduce

        expect(ghost.lives).toBe(livesAfterFirst);
      });

      it('should die when lives reach 0', () => {
        ghost.invulnerableUntil = 0; // Clear invuln for testing
        ghost.lives = 1;
        ghost.takeDamage();

        expect(ghost.isAlive).toBe(false);
      });
    });

    describe('Input Buffer', () => {
      it('should add inputs to buffer', () => {
        ghost.addInput({ action: 'PRESS', timestamp: Date.now() });

        expect(ghost.inputBuffer).toHaveLength(1);
      });

      it('should limit buffer size', () => {
        for (let i = 0; i < 15; i++) {
          ghost.addInput({ action: 'PRESS', timestamp: Date.now() });
        }

        expect(ghost.inputBuffer.length).toBeLessThanOrEqual(MULTIPLAYER_CONFIG.inputBufferSize);
      });

      it('should update lastSpacebarTime on PRESS action', () => {
        const beforeTime = ghost.lastSpacebarTime;
        ghost.addInput({ action: 'PRESS', timestamp: Date.now() });

        expect(ghost.lastSpacebarTime).toBeGreaterThan(beforeTime);
      });

      it('should not update lastSpacebarTime for non-PRESS actions', () => {
        ghost.lastSpacebarTime = 1000; // Set to a known value
        ghost.addInput({ action: 'OTHER', timestamp: Date.now() });

        expect(ghost.lastSpacebarTime).toBe(1000);
      });
    });

    describe('Serialization', () => {
      it('should serialize to JSON correctly', () => {
        const json = ghost.toJSON();

        expect(json.playerId).toBe('test_id');
        expect(json.username).toBe('testuser');
        expect(json.color).toBe('#4488ff');
        expect(json.x).toBeDefined();
        expect(json.y).toBeDefined();
        expect(json.lives).toBe(MULTIPLAYER_CONFIG.initialLives);
        expect(json.movementState).toBe('FREE_FLIGHT');
      });

      it('should include invulnerability status', () => {
        ghost.takeDamage();
        const json = ghost.toJSON();

        expect(json.invulnerable).toBe(true);
      });
    });
  });

  // ============================================
  // MESSAGE HANDLING
  // ============================================

  describe('Message Handling', () => {
    let manager;
    let mockWs;

    beforeEach(() => {
      manager = new OrbitsMultiplayerManager();
      mockWs = {
        readyState: 1,
        send: vi.fn()
      };
    });

    afterEach(() => {
      manager.destroy();
    });

    it('should handle ready message', () => {
      const createResult = manager.createRoom('host', 'arena');
      const joinResult = manager.joinRoom(createResult.roomCode, 'player2');

      manager.setPlayerWs(createResult.playerId, mockWs);
      manager.setPlayerWs(joinResult.playerId, mockWs);

      manager.handleMessage(joinResult.playerId, mockWs, {
        type: 'orbits_ready',
        payload: { ready: true }
      });

      const room = manager.getRoom(createResult.roomCode);
      const player = room.players.get(joinResult.playerId);
      expect(player.ready).toBe(true);
    });

    it('should only allow host to start', () => {
      const createResult = manager.createRoom('host', 'arena');
      const joinResult = manager.joinRoom(createResult.roomCode, 'player2');

      manager.setPlayerWs(createResult.playerId, mockWs);
      manager.setPlayerWs(joinResult.playerId, mockWs);

      // Non-host trying to start
      manager.handleMessage(joinResult.playerId, mockWs, {
        type: 'orbits_start',
        payload: {}
      });

      const room = manager.getRoom(createResult.roomCode);
      expect(room.state).toBe(RoomState.LOBBY); // Should still be in lobby
    });
  });
});
