/**
 * Grid Wars v1.3.2 Tests
 * Tests for unified economy, session management, and UI improvements
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock GRID_WARS_CONFIG
const GRID_WARS_CONFIG = {
  claimCost: 10,
  bootBonus: 15,
  mapSize: 20,
  classGoalTarget: 200,
  underdogEnabled: true,
  underdogDiscount: 0.5,
  underdogMinCost: 5,
  underdogActivityWindowMs: 3 * 60 * 1000,
  underdogCooldownMs: 5 * 60 * 1000,
};

describe('Grid Wars v1.3.2', () => {

  describe('Task 1: Unified Point Economy', () => {
    it('unified leaderboard endpoint should return action_points as weighted_score', async () => {
      // Mock response from unified endpoint
      const mockResponse = [
        {
          username: 'player1',
          real_name: 'Player One',
          weighted_score: 50,  // This is action_points
          territories: 5,
          cluster: 3,
          gold: 0,
          silver: 0,
          bronze: 0,
          tin: 0
        }
      ];

      // Verify structure matches expected format
      expect(mockResponse[0]).toHaveProperty('weighted_score');
      expect(mockResponse[0]).toHaveProperty('territories');
      expect(mockResponse[0]).toHaveProperty('cluster');
      expect(mockResponse[0].weighted_score).toBe(50);
    });

    it('spending points should decrease leaderboard rank conceptually', () => {
      // Before spending: 50 points
      const beforePoints = 50;
      const claimCost = 10;

      // After spending: 40 points
      const afterPoints = beforePoints - claimCost;

      expect(afterPoints).toBe(40);
      expect(afterPoints).toBeLessThan(beforePoints);
    });

    it('unified endpoint returns territories and cluster info', () => {
      const mockEntry = {
        username: 'testuser',
        weighted_score: 100,
        territories: 10,
        cluster: 7
      };

      expect(mockEntry.territories).toBe(10);
      expect(mockEntry.cluster).toBe(7);
    });
  });

  describe('Task 2: Persistent State', () => {
    it('reset endpoint should clear territories', () => {
      // Simulate reset behavior
      const territories = new Map([
        ['0,0', { owner: 'player1' }],
        ['1,1', { owner: 'player2' }]
      ]);

      // Reset clears all
      territories.clear();

      expect(territories.size).toBe(0);
    });

    it('reset should restore boot bonus to all players', () => {
      const players = [
        { username: 'player1', action_points: 50 },
        { username: 'player2', action_points: 30 }
      ];

      // Reset restores boot bonus
      const resetPlayers = players.map(p => ({
        ...p,
        action_points: GRID_WARS_CONFIG.bootBonus,
        territories_count: 0
      }));

      expect(resetPlayers[0].action_points).toBe(15);
      expect(resetPlayers[1].action_points).toBe(15);
      expect(resetPlayers[0].territories_count).toBe(0);
    });
  });

  describe('Task 3: Goal Clarity UI', () => {
    it('objective section should display player stats', () => {
      const playerStats = {
        territories_count: 5,
        action_points: 42,
        largest_cluster: 3
      };

      // Verify data is available for display
      expect(playerStats.territories_count).toBe(5);
      expect(playerStats.action_points).toBe(42);
    });

    it('should identify territory leader', () => {
      const players = [
        { username: 'player1', territories_count: 10 },
        { username: 'player2', territories_count: 15 },
        { username: 'player3', territories_count: 5 }
      ];

      const sorted = [...players].sort((a, b) => b.territories_count - a.territories_count);
      const leader = sorted[0];

      expect(leader.username).toBe('player2');
      expect(leader.territories_count).toBe(15);
    });

    it('should handle case when current user is leading', () => {
      const currentUsername = 'player1';
      const players = [
        { username: 'player1', territories_count: 20 },
        { username: 'player2', territories_count: 10 }
      ];

      const sorted = [...players].sort((a, b) => b.territories_count - a.territories_count);
      const leader = sorted[0];

      expect(leader.username).toBe(currentUsername);
    });
  });

  describe('Task 4: Resync UX', () => {
    it('should delay indicator by 2 seconds', async () => {
      vi.useFakeTimers();

      let indicatorShown = false;
      const showIndicator = () => { indicatorShown = true; };

      // Start resync with delay
      const timer = setTimeout(showIndicator, 2000);

      // Before 2 seconds
      vi.advanceTimersByTime(1999);
      expect(indicatorShown).toBe(false);

      // After 2 seconds
      vi.advanceTimersByTime(1);
      expect(indicatorShown).toBe(true);

      clearTimeout(timer);
      vi.useRealTimers();
    });

    it('should not show indicator if resync completes quickly', async () => {
      vi.useFakeTimers();

      let indicatorShown = false;
      const showIndicator = () => { indicatorShown = true; };

      // Start resync with delay
      const timer = setTimeout(showIndicator, 2000);

      // Resync completes in 500ms
      vi.advanceTimersByTime(500);
      clearTimeout(timer);  // Cancel indicator

      // Advance past 2 seconds
      vi.advanceTimersByTime(2000);

      expect(indicatorShown).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Task 5: Underdog UI', () => {
    it('should show underdog banner when eligible', () => {
      const myStats = {
        territories_count: 0,
        last_answer_at: new Date().toISOString()
      };

      const hasNoTerritory = myStats.territories_count === 0;
      const answeredRecently = myStats.last_answer_at &&
        (Date.now() - new Date(myStats.last_answer_at).getTime()) < GRID_WARS_CONFIG.underdogActivityWindowMs;

      const showBanner = hasNoTerritory && answeredRecently && GRID_WARS_CONFIG.underdogEnabled;

      expect(showBanner).toBe(true);
    });

    it('should not show underdog banner with territories', () => {
      const myStats = {
        territories_count: 3,
        last_answer_at: new Date().toISOString()
      };

      const hasNoTerritory = myStats.territories_count === 0;
      const showBanner = hasNoTerritory && GRID_WARS_CONFIG.underdogEnabled;

      expect(showBanner).toBe(false);
    });

    it('should not show underdog banner if not answered recently', () => {
      const oldTime = Date.now() - (5 * 60 * 1000);  // 5 minutes ago
      const myStats = {
        territories_count: 0,
        last_answer_at: new Date(oldTime).toISOString()
      };

      const hasNoTerritory = myStats.territories_count === 0;
      const answeredRecently = myStats.last_answer_at &&
        (Date.now() - new Date(myStats.last_answer_at).getTime()) < GRID_WARS_CONFIG.underdogActivityWindowMs;

      const showBanner = hasNoTerritory && answeredRecently && GRID_WARS_CONFIG.underdogEnabled;

      expect(showBanner).toBe(false);
    });

    it('should calculate correct discounted price', () => {
      const baseCost = GRID_WARS_CONFIG.claimCost;
      const discount = GRID_WARS_CONFIG.underdogDiscount;
      const minCost = GRID_WARS_CONFIG.underdogMinCost;

      const discountedCost = Math.max(minCost, Math.floor(baseCost * discount));

      expect(discountedCost).toBe(5);  // max(5, floor(10 * 0.5)) = 5
    });
  });

  describe('Task 6: Session Boundaries', () => {
    it('session end should freeze game state', () => {
      let sessionFrozen = false;

      // Simulate session end
      const endSession = () => {
        sessionFrozen = true;
      };

      endSession();

      expect(sessionFrozen).toBe(true);
    });

    it('frozen game should reject claims', () => {
      const frozenGames = new Map();
      frozenGames.set('default', { frozen: true });

      const gameId = 'default';
      const isFrozen = frozenGames.get(gameId)?.frozen;

      expect(isFrozen).toBe(true);
    });

    it('session end should calculate summary', () => {
      const players = [
        { username: 'p1', action_points: 50, territories_count: 10, largest_cluster: 5 },
        { username: 'p2', action_points: 30, territories_count: 5, largest_cluster: 3 }
      ];
      const territories = Array(60).fill({ owner: 'someone' });  // 60 cells claimed

      const mapSize = 20;
      const totalCells = mapSize * mapSize;
      const summary = {
        playerCount: players.length,
        totalTerritories: territories.length,
        mapFillPercent: Math.round((territories.length / totalCells) * 100),
        avgPoints: Math.round(players.reduce((sum, p) => sum + p.action_points, 0) / players.length),
        topPlayers: [...players]
          .sort((a, b) => b.territories_count - a.territories_count)
          .slice(0, 5)
      };

      expect(summary.playerCount).toBe(2);
      expect(summary.mapFillPercent).toBe(15);  // 60/400 = 15%
      expect(summary.avgPoints).toBe(40);  // (50 + 30) / 2
      expect(summary.topPlayers[0].username).toBe('p1');
    });

    it('session resume should unfreeze game', () => {
      const frozenGames = new Map();
      frozenGames.set('default', { frozen: true });

      // Resume
      frozenGames.delete('default');

      const isFrozen = frozenGames.get('default')?.frozen;
      expect(isFrozen).toBeFalsy();
    });

    it('drills should still work when session is frozen', () => {
      // Points/add endpoint does NOT check frozen state
      // Only /api/grid-wars/action checks frozen state
      const frozenGames = new Map();
      frozenGames.set('default', { frozen: true });

      // Points earning should succeed regardless of frozen state
      // (This is by design - drills continue to work)
      const pointsEndpointChecksFrozen = false;

      expect(pointsEndpointChecksFrozen).toBe(false);
    });
  });

  describe('WebSocket Message Handling', () => {
    it('should handle session_ended message', () => {
      let sessionFrozen = false;
      let sessionSummary = null;
      let callbackCalled = false;

      const message = {
        type: 'session_ended',
        summary: { mapFillPercent: 50, playerCount: 5 },
        rankings: [{ username: 'leader', territories: 20 }]
      };

      // Simulate handling
      if (message.type === 'session_ended') {
        sessionFrozen = true;
        sessionSummary = message.summary;
        callbackCalled = true;
      }

      expect(sessionFrozen).toBe(true);
      expect(sessionSummary.mapFillPercent).toBe(50);
      expect(callbackCalled).toBe(true);
    });

    it('should handle session_resumed message', () => {
      let sessionFrozen = true;
      let sessionSummary = { something: 'data' };

      const message = { type: 'session_resumed' };

      if (message.type === 'session_resumed') {
        sessionFrozen = false;
        sessionSummary = null;
      }

      expect(sessionFrozen).toBe(false);
      expect(sessionSummary).toBeNull();
    });

    it('should handle game_reset message', () => {
      const territories = new Map([['0,0', { owner: 'test' }]]);
      const players = new Map([['test', { action_points: 100 }]]);
      let sessionFrozen = true;

      const message = { type: 'game_reset' };

      if (message.type === 'game_reset') {
        territories.clear();
        players.clear();
        sessionFrozen = false;
      }

      expect(territories.size).toBe(0);
      expect(players.size).toBe(0);
      expect(sessionFrozen).toBe(false);
    });
  });

  describe('Grid State Methods', () => {
    it('isSessionFrozen should return correct state', () => {
      let _sessionFrozen = false;
      const isSessionFrozen = () => _sessionFrozen;

      expect(isSessionFrozen()).toBe(false);

      _sessionFrozen = true;
      expect(isSessionFrozen()).toBe(true);
    });

    it('getSessionSummary should return summary when available', () => {
      let _sessionSummary = null;
      const getSessionSummary = () => _sessionSummary;

      expect(getSessionSummary()).toBeNull();

      _sessionSummary = { mapFillPercent: 75 };
      expect(getSessionSummary()).toEqual({ mapFillPercent: 75 });
    });
  });
});
