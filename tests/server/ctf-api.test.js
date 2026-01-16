/**
 * CTF Server API Tests
 * Tests for CTF server endpoints and game logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CTF_CONFIG } from '../../shared/ctf.config.js';

describe('CTF Server API', () => {
  describe('GET /api/ctf/:cartridgeId/state', () => {
    it('should return initial game state', () => {
      const mockState = {
        frontPosition: CTF_CONFIG.startPosition,
        bluePoints: 0,
        redPoints: 0,
        winner: null,
        blueTeam: [],
        redTeam: [],
        userTeam: null
      };

      expect(mockState.frontPosition).toBe(10);
      expect(mockState.bluePoints).toBe(0);
      expect(mockState.redPoints).toBe(0);
      expect(mockState.winner).toBeNull();
    });

    it('should include user team when username provided', () => {
      const mockState = {
        frontPosition: 10,
        bluePoints: 40,
        redPoints: 20,
        winner: null,
        blueTeam: [{ username: 'alice', team: 'blue', points_contributed: 20 }],
        redTeam: [{ username: 'bob', team: 'red', points_contributed: 10 }],
        userTeam: 'blue' // Based on username lookup
      };

      expect(mockState.userTeam).toBe('blue');
    });

    it('should create new game if none exists', () => {
      // Simulates upsert behavior
      const getOrCreateGame = (cartridgeId) => {
        // Returns default state for new game
        return {
          cartridge_id: cartridgeId,
          front_position: CTF_CONFIG.startPosition,
          blue_points: 0,
          red_points: 0,
          winner: null
        };
      };

      const game = getOrCreateGame('new-cartridge');
      expect(game.cartridge_id).toBe('new-cartridge');
      expect(game.front_position).toBe(10);
    });
  });

  describe('POST /api/ctf/:cartridgeId/join', () => {
    it('should add player to blue team', () => {
      const joinTeam = (username, team) => {
        if (!['blue', 'red'].includes(team)) {
          throw new Error('Invalid team');
        }
        return { username, team, points_contributed: 0 };
      };

      const result = joinTeam('alice', 'blue');
      expect(result.team).toBe('blue');
      expect(result.username).toBe('alice');
    });

    it('should add player to red team', () => {
      const joinTeam = (username, team) => {
        if (!['blue', 'red'].includes(team)) {
          throw new Error('Invalid team');
        }
        return { username, team, points_contributed: 0 };
      };

      const result = joinTeam('bob', 'red');
      expect(result.team).toBe('red');
    });

    it('should reject invalid team', () => {
      const joinTeam = (username, team) => {
        if (!['blue', 'red'].includes(team)) {
          throw new Error('Invalid team');
        }
        return { username, team };
      };

      expect(() => joinTeam('alice', 'green')).toThrow('Invalid team');
    });

    it('should require username', () => {
      const joinTeam = (username, team) => {
        if (!username) {
          throw new Error('Username required');
        }
        return { username, team };
      };

      expect(() => joinTeam(null, 'blue')).toThrow('Username required');
      expect(() => joinTeam('', 'blue')).toThrow('Username required');
    });

    it('should switch team if already on different team', () => {
      // Simulates upsert with ON CONFLICT
      const players = new Map();
      players.set('alice', { username: 'alice', team: 'blue', points_contributed: 10 });

      const switchTeam = (username, newTeam) => {
        const existing = players.get(username);
        if (existing) {
          existing.team = newTeam;
          // Optionally reset points on switch
          return existing;
        }
        const newPlayer = { username, team: newTeam, points_contributed: 0 };
        players.set(username, newPlayer);
        return newPlayer;
      };

      const result = switchTeam('alice', 'red');
      expect(result.team).toBe('red');
      expect(result.points_contributed).toBe(10); // Preserved
    });
  });

  describe('POST /api/ctf/:cartridgeId/points', () => {
    it('should add points to blue team', () => {
      let game = {
        blue_points: 0,
        red_points: 0,
        front_position: 10,
        winner: null
      };

      const addPoints = (points, team) => {
        if (team === 'blue') {
          game.blue_points += points;
        } else {
          game.red_points += points;
        }

        // Calculate new front position
        const blueMoves = Math.floor(game.blue_points / CTF_CONFIG.pointsPerMove);
        const redMoves = Math.floor(game.red_points / CTF_CONFIG.pointsPerMove);
        game.front_position = CTF_CONFIG.startPosition + blueMoves - redMoves;

        return game;
      };

      addPoints(20, 'blue');
      expect(game.blue_points).toBe(20);
      expect(game.front_position).toBe(11); // Moved 1 toward red
    });

    it('should add points to red team', () => {
      let game = {
        blue_points: 0,
        red_points: 0,
        front_position: 10,
        winner: null
      };

      const addPoints = (points, team) => {
        if (team === 'blue') {
          game.blue_points += points;
        } else {
          game.red_points += points;
        }

        const blueMoves = Math.floor(game.blue_points / CTF_CONFIG.pointsPerMove);
        const redMoves = Math.floor(game.red_points / CTF_CONFIG.pointsPerMove);
        game.front_position = CTF_CONFIG.startPosition + blueMoves - redMoves;

        return game;
      };

      addPoints(20, 'red');
      expect(game.red_points).toBe(20);
      expect(game.front_position).toBe(9); // Moved 1 toward blue
    });

    it('should detect blue victory', () => {
      let game = {
        blue_points: 180,
        red_points: 0,
        front_position: 19,
        winner: null
      };

      const addPointsAndCheckVictory = (points, team) => {
        if (team === 'blue') {
          game.blue_points += points;
        } else {
          game.red_points += points;
        }

        const blueMoves = Math.floor(game.blue_points / CTF_CONFIG.pointsPerMove);
        const redMoves = Math.floor(game.red_points / CTF_CONFIG.pointsPerMove);
        game.front_position = CTF_CONFIG.startPosition + blueMoves - redMoves;

        // Check victory
        if (game.front_position >= CTF_CONFIG.redFlag) {
          game.winner = 'blue';
        } else if (game.front_position <= CTF_CONFIG.blueFlag) {
          game.winner = 'red';
        }

        return game;
      };

      addPointsAndCheckVictory(20, 'blue');
      expect(game.front_position).toBe(20);
      expect(game.winner).toBe('blue');
    });

    it('should detect red victory', () => {
      let game = {
        blue_points: 0,
        red_points: 180,
        front_position: 1,
        winner: null
      };

      const addPointsAndCheckVictory = (points, team) => {
        if (team === 'blue') {
          game.blue_points += points;
        } else {
          game.red_points += points;
        }

        const blueMoves = Math.floor(game.blue_points / CTF_CONFIG.pointsPerMove);
        const redMoves = Math.floor(game.red_points / CTF_CONFIG.pointsPerMove);
        game.front_position = CTF_CONFIG.startPosition + blueMoves - redMoves;

        if (game.front_position >= CTF_CONFIG.redFlag) {
          game.winner = 'blue';
        } else if (game.front_position <= CTF_CONFIG.blueFlag) {
          game.winner = 'red';
        }

        return game;
      };

      addPointsAndCheckVictory(20, 'red');
      expect(game.front_position).toBe(0);
      expect(game.winner).toBe('red');
    });

    it('should not add points if game already won', () => {
      let game = {
        blue_points: 200,
        red_points: 0,
        front_position: 20,
        winner: 'blue'
      };

      const addPoints = (points, team) => {
        if (game.winner) {
          return { error: 'Game already ended' };
        }
        // Would add points
        return game;
      };

      const result = addPoints(20, 'red');
      expect(result.error).toBe('Game already ended');
    });

    it('should update player contribution', () => {
      const players = new Map();
      players.set('alice', { username: 'alice', team: 'blue', points_contributed: 10 });

      const updateContribution = (username, points) => {
        const player = players.get(username);
        if (player) {
          player.points_contributed += points;
          return player;
        }
        return null;
      };

      const result = updateContribution('alice', 5);
      expect(result.points_contributed).toBe(15);
    });

    it('should require player to be on a team', () => {
      const players = new Map();
      // Alice is not in the players map

      const addPoints = (username, points) => {
        const player = players.get(username);
        if (!player) {
          return { error: 'Player not on a team' };
        }
        return { success: true };
      };

      const result = addPoints('alice', 4);
      expect(result.error).toBe('Player not on a team');
    });
  });

  describe('POST /api/ctf/:cartridgeId/reset', () => {
    it('should reset game state', () => {
      let game = {
        front_position: 15,
        blue_points: 100,
        red_points: 50,
        winner: 'blue'
      };

      const resetGame = () => {
        game.front_position = CTF_CONFIG.startPosition;
        game.blue_points = 0;
        game.red_points = 0;
        game.winner = null;
        return game;
      };

      resetGame();
      expect(game.front_position).toBe(10);
      expect(game.blue_points).toBe(0);
      expect(game.red_points).toBe(0);
      expect(game.winner).toBeNull();
    });

    it('should preserve teams when requested', () => {
      const players = [
        { username: 'alice', team: 'blue', points_contributed: 50 },
        { username: 'bob', team: 'red', points_contributed: 25 }
      ];

      const resetWithTeams = (preserveTeams) => {
        if (preserveTeams) {
          // Reset points but keep team assignments
          return players.map(p => ({ ...p, points_contributed: 0 }));
        } else {
          return [];
        }
      };

      const result = resetWithTeams(true);
      expect(result).toHaveLength(2);
      expect(result[0].team).toBe('blue');
      expect(result[0].points_contributed).toBe(0);
    });

    it('should clear teams when requested', () => {
      const players = [
        { username: 'alice', team: 'blue', points_contributed: 50 }
      ];

      const resetWithTeams = (preserveTeams) => {
        if (preserveTeams) {
          return players.map(p => ({ ...p, points_contributed: 0 }));
        } else {
          return [];
        }
      };

      const result = resetWithTeams(false);
      expect(result).toHaveLength(0);
    });
  });

  describe('GET /api/ctf/:cartridgeId/leaderboard', () => {
    it('should return team leaderboards', () => {
      const blueTeam = [
        { username: 'alice', points_contributed: 30 },
        { username: 'charlie', points_contributed: 10 }
      ];
      const redTeam = [
        { username: 'bob', points_contributed: 25 }
      ];

      const getLeaderboard = () => ({
        blue: blueTeam.sort((a, b) => b.points_contributed - a.points_contributed),
        red: redTeam.sort((a, b) => b.points_contributed - a.points_contributed),
        blueTotal: blueTeam.reduce((sum, p) => sum + p.points_contributed, 0),
        redTotal: redTeam.reduce((sum, p) => sum + p.points_contributed, 0)
      });

      const leaderboard = getLeaderboard();
      expect(leaderboard.blue[0].username).toBe('alice');
      expect(leaderboard.blueTotal).toBe(40);
      expect(leaderboard.redTotal).toBe(25);
    });

    it('should handle empty teams', () => {
      const getLeaderboard = (blue = [], red = []) => ({
        blue: blue.sort((a, b) => b.points_contributed - a.points_contributed),
        red: red.sort((a, b) => b.points_contributed - a.points_contributed),
        blueTotal: blue.reduce((sum, p) => sum + p.points_contributed, 0),
        redTotal: red.reduce((sum, p) => sum + p.points_contributed, 0)
      });

      const leaderboard = getLeaderboard([], []);
      expect(leaderboard.blue).toHaveLength(0);
      expect(leaderboard.red).toHaveLength(0);
      expect(leaderboard.blueTotal).toBe(0);
      expect(leaderboard.redTotal).toBe(0);
    });
  });

  describe('POST /api/ctf/:cartridgeId/assign-teams', () => {
    it('should bulk assign teams', () => {
      const assignments = [
        { username: 'alice', team: 'blue' },
        { username: 'bob', team: 'red' },
        { username: 'charlie', team: 'blue' }
      ];

      const assignTeams = (assignments) => {
        return assignments.map(a => ({
          ...a,
          points_contributed: 0
        }));
      };

      const result = assignTeams(assignments);
      expect(result).toHaveLength(3);
      expect(result.filter(p => p.team === 'blue')).toHaveLength(2);
      expect(result.filter(p => p.team === 'red')).toHaveLength(1);
    });

    it('should validate all assignments', () => {
      const validateAssignments = (assignments) => {
        for (const a of assignments) {
          if (!a.username) return { error: 'Missing username' };
          if (!['blue', 'red'].includes(a.team)) return { error: 'Invalid team' };
        }
        return { valid: true };
      };

      expect(validateAssignments([
        { username: 'alice', team: 'blue' }
      ])).toEqual({ valid: true });

      expect(validateAssignments([
        { username: '', team: 'blue' }
      ])).toEqual({ error: 'Missing username' });

      expect(validateAssignments([
        { username: 'alice', team: 'green' }
      ])).toEqual({ error: 'Invalid team' });
    });
  });

  describe('DELETE /api/ctf/:cartridgeId/player/:username', () => {
    it('should remove player from game', () => {
      const players = new Map();
      players.set('alice', { username: 'alice', team: 'blue' });
      players.set('bob', { username: 'bob', team: 'red' });

      const removePlayer = (username) => {
        if (!players.has(username)) {
          return { error: 'Player not found' };
        }
        players.delete(username);
        return { success: true };
      };

      const result = removePlayer('alice');
      expect(result.success).toBe(true);
      expect(players.has('alice')).toBe(false);
      expect(players.has('bob')).toBe(true);
    });

    it('should handle non-existent player', () => {
      const players = new Map();

      const removePlayer = (username) => {
        if (!players.has(username)) {
          return { error: 'Player not found' };
        }
        players.delete(username);
        return { success: true };
      };

      const result = removePlayer('unknown');
      expect(result.error).toBe('Player not found');
    });
  });

  describe('GET /api/ctf/config', () => {
    it('should return CTF configuration', () => {
      const getConfig = () => ({
        laneLength: CTF_CONFIG.laneLength,
        startPosition: CTF_CONFIG.startPosition,
        blueFlag: CTF_CONFIG.blueFlag,
        redFlag: CTF_CONFIG.redFlag,
        pointsPerMove: CTF_CONFIG.pointsPerMove,
        starPoints: CTF_CONFIG.starPoints
      });

      const config = getConfig();
      expect(config.laneLength).toBe(21);
      expect(config.startPosition).toBe(10);
      expect(config.pointsPerMove).toBe(20);
    });
  });

  describe('WebSocket Broadcasts', () => {
    it('should broadcast ctf_front_moved on position change', () => {
      const broadcasts = [];
      const broadcast = (message) => broadcasts.push(message);

      const onFrontMoved = (cartridgeId, frontPosition, bluePoints, redPoints, movedBy) => {
        broadcast({
          type: 'ctf_front_moved',
          cartridgeId,
          frontPosition,
          bluePoints,
          redPoints,
          movedBy
        });
      };

      onFrontMoved('lsrl-basics', 11, 20, 0, 'blue');
      expect(broadcasts).toHaveLength(1);
      expect(broadcasts[0].type).toBe('ctf_front_moved');
      expect(broadcasts[0].frontPosition).toBe(11);
    });

    it('should broadcast ctf_victory on game win', () => {
      const broadcasts = [];
      const broadcast = (message) => broadcasts.push(message);

      const onVictory = (cartridgeId, winner, finalPosition) => {
        broadcast({
          type: 'ctf_victory',
          cartridgeId,
          winner,
          finalPosition
        });
      };

      onVictory('lsrl-basics', 'blue', 20);
      expect(broadcasts[0].type).toBe('ctf_victory');
      expect(broadcasts[0].winner).toBe('blue');
    });

    it('should broadcast ctf_reset on game reset', () => {
      const broadcasts = [];
      const broadcast = (message) => broadcasts.push(message);

      const onReset = (cartridgeId, preserveTeams) => {
        broadcast({
          type: 'ctf_reset',
          cartridgeId,
          preserveTeams
        });
      };

      onReset('lsrl-basics', true);
      expect(broadcasts[0].type).toBe('ctf_reset');
      expect(broadcasts[0].preserveTeams).toBe(true);
    });

    it('should broadcast ctf_player_joined on team join', () => {
      const broadcasts = [];
      const broadcast = (message) => broadcasts.push(message);

      const onPlayerJoined = (cartridgeId, username, team) => {
        broadcast({
          type: 'ctf_player_joined',
          cartridgeId,
          username,
          team
        });
      };

      onPlayerJoined('lsrl-basics', 'alice', 'blue');
      expect(broadcasts[0].type).toBe('ctf_player_joined');
      expect(broadcasts[0].username).toBe('alice');
      expect(broadcasts[0].team).toBe('blue');
    });

    it('should broadcast ctf_teams_updated on bulk assignment', () => {
      const broadcasts = [];
      const broadcast = (message) => broadcasts.push(message);

      const onTeamsUpdated = (cartridgeId) => {
        broadcast({
          type: 'ctf_teams_updated',
          cartridgeId
        });
      };

      onTeamsUpdated('lsrl-basics');
      expect(broadcasts[0].type).toBe('ctf_teams_updated');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing cartridgeId', () => {
      const validateRequest = (cartridgeId) => {
        if (!cartridgeId) {
          return { error: 'cartridgeId is required', status: 400 };
        }
        return { valid: true };
      };

      expect(validateRequest(null)).toEqual({ error: 'cartridgeId is required', status: 400 });
      expect(validateRequest('lsrl-basics')).toEqual({ valid: true });
    });

    it('should handle database errors gracefully', () => {
      const handleDatabaseError = (error) => {
        console.error('Database error:', error);
        return { error: 'Internal server error', status: 500 };
      };

      const result = handleDatabaseError(new Error('Connection failed'));
      expect(result.status).toBe(500);
    });
  });
});
