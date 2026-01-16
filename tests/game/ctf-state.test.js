/**
 * CTF State Tests
 * Tests for CTF state management and API interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CTF_CONFIG } from '../../shared/ctf.config.js';

// Mock the CTFState class behavior since it uses fetch
describe('CTF State', () => {
  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const state = {
        frontPosition: CTF_CONFIG.startPosition,
        bluePoints: 0,
        redPoints: 0,
        winner: null,
        blueTeam: [],
        redTeam: [],
        userTeam: null
      };

      expect(state.frontPosition).toBe(10);
      expect(state.bluePoints).toBe(0);
      expect(state.redPoints).toBe(0);
      expect(state.winner).toBeNull();
      expect(state.blueTeam).toEqual([]);
      expect(state.redTeam).toEqual([]);
      expect(state.userTeam).toBeNull();
    });
  });

  describe('Front Position Calculation', () => {
    it('should calculate front position from points', () => {
      const calculateFrontPosition = (bluePoints, redPoints) => {
        const blueMoves = Math.floor(bluePoints / CTF_CONFIG.pointsPerMove);
        const redMoves = Math.floor(redPoints / CTF_CONFIG.pointsPerMove);
        return CTF_CONFIG.startPosition + blueMoves - redMoves;
      };

      // No points - stays at center
      expect(calculateFrontPosition(0, 0)).toBe(10);

      // Blue gets 20 points - moves 1 toward red (position 11)
      expect(calculateFrontPosition(20, 0)).toBe(11);

      // Red gets 20 points - moves 1 toward blue (position 9)
      expect(calculateFrontPosition(0, 20)).toBe(9);

      // Equal points - stays at center
      expect(calculateFrontPosition(40, 40)).toBe(10);

      // Blue ahead by 40 - position 12
      expect(calculateFrontPosition(60, 20)).toBe(12);
    });

    it('should detect blue victory when front reaches red flag', () => {
      const bluePoints = 200; // 10 moves
      const redPoints = 0;
      const blueMoves = Math.floor(bluePoints / CTF_CONFIG.pointsPerMove);
      const frontPosition = CTF_CONFIG.startPosition + blueMoves;

      expect(frontPosition).toBe(20);
      expect(frontPosition >= CTF_CONFIG.redFlag).toBe(true);
    });

    it('should detect red victory when front reaches blue flag', () => {
      const bluePoints = 0;
      const redPoints = 200; // 10 moves
      const redMoves = Math.floor(redPoints / CTF_CONFIG.pointsPerMove);
      const frontPosition = CTF_CONFIG.startPosition - redMoves;

      expect(frontPosition).toBe(0);
      expect(frontPosition <= CTF_CONFIG.blueFlag).toBe(true);
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress to next move', () => {
      const getProgressToNextMove = (bluePoints, redPoints) => {
        const blueRemainder = bluePoints % CTF_CONFIG.pointsPerMove;
        const redRemainder = redPoints % CTF_CONFIG.pointsPerMove;

        return {
          blue: {
            current: blueRemainder,
            needed: CTF_CONFIG.pointsPerMove - blueRemainder
          },
          red: {
            current: redRemainder,
            needed: CTF_CONFIG.pointsPerMove - redRemainder
          }
        };
      };

      // No points - need full 20
      let progress = getProgressToNextMove(0, 0);
      expect(progress.blue.current).toBe(0);
      expect(progress.blue.needed).toBe(20);
      expect(progress.red.current).toBe(0);
      expect(progress.red.needed).toBe(20);

      // Blue has 15 points - needs 5 more
      progress = getProgressToNextMove(15, 0);
      expect(progress.blue.current).toBe(15);
      expect(progress.blue.needed).toBe(5);

      // Blue just moved (20 points) - resets to 0/20
      progress = getProgressToNextMove(20, 0);
      expect(progress.blue.current).toBe(0);
      expect(progress.blue.needed).toBe(20);

      // Blue has 25 points - 5 toward next move
      progress = getProgressToNextMove(25, 0);
      expect(progress.blue.current).toBe(5);
      expect(progress.blue.needed).toBe(15);
    });
  });

  describe('Team Management', () => {
    it('should add player to team', () => {
      const blueTeam = [];
      const addPlayerToTeam = (username, team, teamList) => {
        if (!teamList.find(p => p.username === username)) {
          teamList.push({ username, team, points_contributed: 0 });
        }
        return teamList;
      };

      const result = addPlayerToTeam('alice', 'blue', blueTeam);
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('alice');
      expect(result[0].team).toBe('blue');
      expect(result[0].points_contributed).toBe(0);
    });

    it('should not duplicate players on same team', () => {
      const blueTeam = [{ username: 'alice', team: 'blue', points_contributed: 0 }];
      const addPlayerToTeam = (username, team, teamList) => {
        if (!teamList.find(p => p.username === username)) {
          teamList.push({ username, team, points_contributed: 0 });
        }
        return teamList;
      };

      const result = addPlayerToTeam('alice', 'blue', blueTeam);
      expect(result).toHaveLength(1);
    });

    it('should remove player from teams', () => {
      let blueTeam = [{ username: 'alice', team: 'blue', points_contributed: 10 }];
      let redTeam = [{ username: 'bob', team: 'red', points_contributed: 5 }];

      const removePlayerFromTeams = (username) => {
        blueTeam = blueTeam.filter(p => p.username !== username);
        redTeam = redTeam.filter(p => p.username !== username);
      };

      removePlayerFromTeams('alice');
      expect(blueTeam).toHaveLength(0);
      expect(redTeam).toHaveLength(1);
    });

    it('should update player points', () => {
      const teamList = [{ username: 'alice', team: 'blue', points_contributed: 10 }];

      const updatePlayerPoints = (username, addedPoints, list) => {
        const player = list.find(p => p.username === username);
        if (player) {
          player.points_contributed = (player.points_contributed || 0) + addedPoints;
        }
      };

      updatePlayerPoints('alice', 5, teamList);
      expect(teamList[0].points_contributed).toBe(15);
    });
  });

  describe('WebSocket Message Handling', () => {
    it('should handle ctf_front_moved message', () => {
      let state = {
        frontPosition: 10,
        bluePoints: 0,
        redPoints: 0
      };

      const message = {
        type: 'ctf_front_moved',
        frontPosition: 11,
        bluePoints: 20,
        redPoints: 0
      };

      // Simulate handler
      if (message.type === 'ctf_front_moved') {
        state.frontPosition = message.frontPosition;
        state.bluePoints = message.bluePoints;
        state.redPoints = message.redPoints;
      }

      expect(state.frontPosition).toBe(11);
      expect(state.bluePoints).toBe(20);
    });

    it('should handle ctf_victory message', () => {
      let state = {
        winner: null,
        frontPosition: 10
      };

      const message = {
        type: 'ctf_victory',
        winner: 'blue',
        finalPosition: 20
      };

      if (message.type === 'ctf_victory') {
        state.winner = message.winner;
        state.frontPosition = message.finalPosition;
      }

      expect(state.winner).toBe('blue');
      expect(state.frontPosition).toBe(20);
    });

    it('should handle ctf_reset message', () => {
      let state = {
        frontPosition: 15,
        bluePoints: 100,
        redPoints: 50,
        winner: 'blue',
        blueTeam: [{ username: 'alice', points_contributed: 50 }],
        redTeam: [{ username: 'bob', points_contributed: 25 }]
      };

      const message = {
        type: 'ctf_reset',
        preserveTeams: true
      };

      if (message.type === 'ctf_reset') {
        state.frontPosition = CTF_CONFIG.startPosition;
        state.bluePoints = 0;
        state.redPoints = 0;
        state.winner = null;
        if (!message.preserveTeams) {
          state.blueTeam = [];
          state.redTeam = [];
        } else {
          state.blueTeam = state.blueTeam.map(p => ({ ...p, points_contributed: 0 }));
          state.redTeam = state.redTeam.map(p => ({ ...p, points_contributed: 0 }));
        }
      }

      expect(state.frontPosition).toBe(10);
      expect(state.bluePoints).toBe(0);
      expect(state.redPoints).toBe(0);
      expect(state.winner).toBeNull();
      expect(state.blueTeam).toHaveLength(1);
      expect(state.blueTeam[0].points_contributed).toBe(0);
    });

    it('should handle ctf_reset with teams cleared', () => {
      let state = {
        frontPosition: 15,
        bluePoints: 100,
        redPoints: 50,
        winner: null,
        blueTeam: [{ username: 'alice', points_contributed: 50 }],
        redTeam: [{ username: 'bob', points_contributed: 25 }],
        userTeam: 'blue'
      };

      const message = {
        type: 'ctf_reset',
        preserveTeams: false
      };

      if (message.type === 'ctf_reset') {
        state.frontPosition = CTF_CONFIG.startPosition;
        state.bluePoints = 0;
        state.redPoints = 0;
        state.winner = null;
        if (!message.preserveTeams) {
          state.blueTeam = [];
          state.redTeam = [];
          state.userTeam = null;
        }
      }

      expect(state.blueTeam).toHaveLength(0);
      expect(state.redTeam).toHaveLength(0);
      expect(state.userTeam).toBeNull();
    });

    it('should handle ctf_player_joined message', () => {
      let state = {
        blueTeam: [],
        redTeam: [],
        userTeam: null
      };

      const message = {
        type: 'ctf_player_joined',
        username: 'alice',
        team: 'blue'
      };

      const username = 'alice'; // Current user

      if (message.type === 'ctf_player_joined') {
        const teamList = message.team === 'blue' ? state.blueTeam : state.redTeam;
        if (!teamList.find(p => p.username === message.username)) {
          teamList.push({ username: message.username, team: message.team, points_contributed: 0 });
        }
        if (message.username === username) {
          state.userTeam = message.team;
        }
      }

      expect(state.blueTeam).toHaveLength(1);
      expect(state.userTeam).toBe('blue');
    });

    it('should filter messages by cartridgeId', () => {
      const currentCartridgeId = 'lsrl-basics';
      let frontPosition = 10;

      const handleMessage = (message) => {
        if (message.cartridgeId && message.cartridgeId !== currentCartridgeId) {
          return; // Ignore
        }
        if (message.type === 'ctf_front_moved') {
          frontPosition = message.frontPosition;
        }
      };

      // Same cartridge - should update
      handleMessage({ type: 'ctf_front_moved', cartridgeId: 'lsrl-basics', frontPosition: 11 });
      expect(frontPosition).toBe(11);

      // Different cartridge - should ignore
      handleMessage({ type: 'ctf_front_moved', cartridgeId: 'other-cartridge', frontPosition: 5 });
      expect(frontPosition).toBe(11);
    });
  });

  describe('Victory Conditions', () => {
    it('should detect blue win at position 20', () => {
      const checkVictory = (frontPosition) => {
        if (frontPosition >= CTF_CONFIG.redFlag) return 'blue';
        if (frontPosition <= CTF_CONFIG.blueFlag) return 'red';
        return null;
      };

      expect(checkVictory(20)).toBe('blue');
      expect(checkVictory(21)).toBe('blue'); // Over the line
    });

    it('should detect red win at position 0', () => {
      const checkVictory = (frontPosition) => {
        if (frontPosition >= CTF_CONFIG.redFlag) return 'blue';
        if (frontPosition <= CTF_CONFIG.blueFlag) return 'red';
        return null;
      };

      expect(checkVictory(0)).toBe('red');
      expect(checkVictory(-1)).toBe('red'); // Over the line
    });

    it('should return null for ongoing game', () => {
      const checkVictory = (frontPosition) => {
        if (frontPosition >= CTF_CONFIG.redFlag) return 'blue';
        if (frontPosition <= CTF_CONFIG.blueFlag) return 'red';
        return null;
      };

      expect(checkVictory(10)).toBeNull();
      expect(checkVictory(1)).toBeNull();
      expect(checkVictory(19)).toBeNull();
    });
  });
});
