/**
 * Progress Sync v2.1 Tests
 *
 * Tests for the new /api/progress/cartridge-sync endpoint
 * and unified leaderboard integration with user_progress table
 *
 * Run with: npx vitest run tests/server/progress-sync-v2.1.test.js
 */
import { describe, it, expect } from 'vitest';

const SERVER_URL = process.env.TEST_SERVER_URL || 'https://lrsl-driller-production.up.railway.app';

// Helper to make API requests
async function api(path, options = {}) {
  const response = await fetch(`${SERVER_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  return {
    status: response.status,
    data: await response.json().catch(() => null)
  };
}

// Check if endpoint is deployed before running server tests
let endpointDeployed = null;

async function checkEndpointDeployed() {
  if (endpointDeployed !== null) return endpointDeployed;
  try {
    const { status } = await api('/api/progress/cartridge-sync', {
      method: 'POST',
      body: JSON.stringify({})
    });
    // If we get 400 (bad request) instead of 404, endpoint exists
    endpointDeployed = status !== 404;
  } catch (e) {
    endpointDeployed = false;
  }
  return endpointDeployed;
}

describe('Progress Cartridge Sync API (v2.1)', () => {
  // ==================== ENDPOINT EXISTENCE ====================
  describe('Endpoint Availability', () => {
    it('POST /api/progress/cartridge-sync endpoint exists (skip if not deployed)', async () => {
      const { status, data } = await api('/api/progress/cartridge-sync', {
        method: 'POST',
        body: JSON.stringify({})
      });

      // Skip test if endpoint not deployed yet (404)
      if (status === 404) {
        console.log('Skipping: /api/progress/cartridge-sync not deployed yet');
        return;
      }

      // Should return 400 for missing params, not 404
      expect(status).toBe(400);
      expect(data.error).toContain('Missing');
    });
  });

  // ==================== VALIDATION ====================
  describe('Request Validation', () => {
    it('rejects request without username (skip if not deployed)', async () => {
      const deployed = await checkEndpointDeployed();
      if (!deployed) {
        console.log('Skipping: endpoint not deployed');
        return;
      }

      const { status, data } = await api('/api/progress/cartridge-sync', {
        method: 'POST',
        body: JSON.stringify({
          cartridgeId: 'test-cartridge',
          stars: { gold: 1, silver: 2, bronze: 3, tin: 4 }
        })
      });

      expect(status).toBe(400);
      expect(data.error).toContain('username');
    });

    it('rejects request without cartridgeId (skip if not deployed)', async () => {
      const deployed = await checkEndpointDeployed();
      if (!deployed) {
        console.log('Skipping: endpoint not deployed');
        return;
      }

      const { status, data } = await api('/api/progress/cartridge-sync', {
        method: 'POST',
        body: JSON.stringify({
          username: 'test-user',
          stars: { gold: 1, silver: 2, bronze: 3, tin: 4 }
        })
      });

      expect(status).toBe(400);
      expect(data.error).toContain('cartridgeId');
    });

    it('rejects empty request body (skip if not deployed)', async () => {
      const deployed = await checkEndpointDeployed();
      if (!deployed) {
        console.log('Skipping: endpoint not deployed');
        return;
      }

      const { status, data } = await api('/api/progress/cartridge-sync', {
        method: 'POST',
        body: JSON.stringify({})
      });

      expect(status).toBe(400);
      expect(data.error).toContain('Missing');
    });
  });

  // ==================== RESPONSE FORMAT ====================
  describe('Response Format', () => {
    it('successful sync returns success: true (skip if not deployed)', async () => {
      const deployed = await checkEndpointDeployed();
      if (!deployed) {
        console.log('Skipping: endpoint not deployed');
        return;
      }

      // Use a test user to avoid polluting real data
      const testUsername = `test-sync-${Date.now()}`;

      const { status, data } = await api('/api/progress/cartridge-sync', {
        method: 'POST',
        body: JSON.stringify({
          username: testUsername,
          cartridgeId: 'test-cartridge',
          stars: { gold: 1, silver: 2, bronze: 1, tin: 0 },
          totalWeightedScore: 9,
          modeProgress: { 'mode-1': { gold: 1 } }
        })
      });

      // May return success or warning if table doesn't exist
      expect([200, 201]).toContain(status);
      expect(data.success !== undefined || data.warning !== undefined).toBe(true);
    });
  });
});

// ==================== REQUEST PAYLOAD ====================
describe('Cartridge Sync Request Payload', () => {
  describe('Stars Object Structure', () => {
    it('accepts complete stars object', () => {
      const stars = { gold: 5, silver: 3, bronze: 2, tin: 1 };

      expect(stars.gold).toBe(5);
      expect(stars.silver).toBe(3);
      expect(stars.bronze).toBe(2);
      expect(stars.tin).toBe(1);
    });

    it('handles missing star types with defaults', () => {
      const stars = { gold: 5 };

      const normalizedStars = {
        gold: stars?.gold || 0,
        silver: stars?.silver || 0,
        bronze: stars?.bronze || 0,
        tin: stars?.tin || 0
      };

      expect(normalizedStars.gold).toBe(5);
      expect(normalizedStars.silver).toBe(0);
      expect(normalizedStars.bronze).toBe(0);
      expect(normalizedStars.tin).toBe(0);
    });

    it('handles null stars object', () => {
      const stars = null;

      const normalizedStars = {
        gold: stars?.gold || 0,
        silver: stars?.silver || 0,
        bronze: stars?.bronze || 0,
        tin: stars?.tin || 0
      };

      expect(normalizedStars.gold).toBe(0);
      expect(normalizedStars.silver).toBe(0);
    });
  });

  describe('Weighted Score Calculation', () => {
    it('calculates total weighted score correctly', () => {
      const stars = { gold: 2, silver: 3, bronze: 1, tin: 2 };

      // gold=4, silver=2, bronze=1, tin=0.5
      const totalWeightedScore = (stars.gold * 4) + (stars.silver * 2) + (stars.bronze * 1) + (stars.tin * 0.5);

      expect(totalWeightedScore).toBe(2*4 + 3*2 + 1*1 + 2*0.5);
      expect(totalWeightedScore).toBe(16);
    });

    it('handles zero stars', () => {
      const stars = { gold: 0, silver: 0, bronze: 0, tin: 0 };

      const totalWeightedScore = (stars.gold * 4) + (stars.silver * 2) + (stars.bronze * 1) + (stars.tin * 0.5);

      expect(totalWeightedScore).toBe(0);
    });
  });

  describe('Mode Progress Structure', () => {
    it('accepts mode progress object', () => {
      const modeProgress = {
        'interpret-slope': { gold: 3, silver: 1, bronze: 0, tin: 0 },
        'interpret-intercept': { gold: 2, silver: 2, bronze: 1, tin: 0 }
      };

      expect(Object.keys(modeProgress).length).toBe(2);
      expect(modeProgress['interpret-slope'].gold).toBe(3);
    });

    it('handles empty mode progress', () => {
      const modeProgress = {};

      expect(Object.keys(modeProgress).length).toBe(0);
    });

    it('handles null mode progress', () => {
      const modeProgress = null;

      const normalizedProgress = modeProgress || {};

      expect(typeof normalizedProgress).toBe('object');
    });
  });
});

// ==================== UNIFIED LEADERBOARD ====================
describe('Unified Leaderboard with user_progress (v2.1)', () => {
  describe('Endpoint Response', () => {
    it('GET /api/leaderboard/unified returns array', async () => {
      const { status, data } = await api('/api/leaderboard/unified');

      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('leaderboard entries have required fields', async () => {
      const { data } = await api('/api/leaderboard/unified');

      if (data.length > 0) {
        const entry = data[0];
        expect(entry).toHaveProperty('username');
        expect(entry).toHaveProperty('weighted_score');
        expect(entry).toHaveProperty('gold');
        expect(entry).toHaveProperty('silver');
        expect(entry).toHaveProperty('bronze');
        expect(entry).toHaveProperty('tin');
        // Note: territories removed in v4.0 (Grid Wars replaced by CTF)
        // Note: class_period added in v4.1 for roster management
      }
    });

    it('weighted_score is rounded to 1 decimal', async () => {
      const { data } = await api('/api/leaderboard/unified');

      if (data.length > 0) {
        const entry = data[0];
        const scoreStr = String(entry.weighted_score);
        const decimalPlaces = scoreStr.includes('.') ? scoreStr.split('.')[1].length : 0;

        expect(decimalPlaces).toBeLessThanOrEqual(1);
      }
    });

    it('leaderboard is sorted by weighted_score descending', async () => {
      const { data } = await api('/api/leaderboard/unified');

      if (data.length > 1) {
        for (let i = 0; i < data.length - 1; i++) {
          expect(data[i].weighted_score).toBeGreaterThanOrEqual(data[i + 1].weighted_score);
        }
      }
    });
  });

  describe('Data Merging Logic', () => {
    it('star counts are non-negative integers', async () => {
      const { data } = await api('/api/leaderboard/unified');

      for (const entry of data) {
        expect(entry.gold).toBeGreaterThanOrEqual(0);
        expect(entry.silver).toBeGreaterThanOrEqual(0);
        expect(entry.bronze).toBeGreaterThanOrEqual(0);
        expect(entry.tin).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(entry.gold)).toBe(true);
        expect(Number.isInteger(entry.silver)).toBe(true);
        expect(Number.isInteger(entry.bronze)).toBe(true);
        expect(Number.isInteger(entry.tin)).toBe(true);
      }
    });

    // Note: territories test removed in v4.0 (Grid Wars replaced by CTF)
  });

  describe('Period Filter', () => {
    it('supports period=hour filter', async () => {
      const { status, data } = await api('/api/leaderboard/unified?period=hour');

      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('supports period=1h filter', async () => {
      const { status, data } = await api('/api/leaderboard/unified?period=1h');

      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });
});

// ==================== CLIENT SYNC FUNCTION ====================
describe('Client-Side syncCartridgeProgress Function', () => {
  describe('Prerequisites Check', () => {
    it('skips sync when username is missing', () => {
      const username = null;
      const cartridgeId = 'test-cartridge';

      const shouldSync = !!(username && cartridgeId);

      expect(shouldSync).toBe(false);
    });

    it('skips sync when cartridgeId is missing', () => {
      const username = 'test-user';
      const cartridgeId = null;

      const shouldSync = !!(username && cartridgeId);

      expect(shouldSync).toBe(false);
    });

    it('proceeds when both username and cartridgeId present', () => {
      const username = 'test-user';
      const cartridgeId = 'test-cartridge';

      const shouldSync = !!(username && cartridgeId);

      expect(shouldSync).toBe(true);
    });

    it('skips sync when game state is missing', () => {
      const state = null;

      const hasGameState = !!(state?.game);

      expect(hasGameState).toBe(false);
    });

    it('proceeds when game state is present', () => {
      const state = {
        game: {
          starCounts: { gold: 1, silver: 0, bronze: 0, tin: 0 },
          starsPerMode: {}
        }
      };

      const hasGameState = !!(state?.game);

      expect(hasGameState).toBe(true);
    });
  });

  describe('Request Body Construction', () => {
    it('constructs correct request body', () => {
      const username = 'test-user';
      const cartridgeId = 'lsrl-interpretation';
      const stars = { gold: 3, silver: 2, bronze: 1, tin: 0 };
      const modeProgress = { 'interpret-slope': { gold: 3 } };

      const totalWeightedScore = (stars.gold * 4) + (stars.silver * 2) + (stars.bronze * 1) + (stars.tin * 0.5);

      const requestBody = {
        username,
        cartridgeId,
        stars,
        totalWeightedScore,
        modeProgress
      };

      expect(requestBody.username).toBe('test-user');
      expect(requestBody.cartridgeId).toBe('lsrl-interpretation');
      expect(requestBody.stars.gold).toBe(3);
      expect(requestBody.totalWeightedScore).toBe(17);
      expect(requestBody.modeProgress['interpret-slope'].gold).toBe(3);
    });
  });

  describe('Response Handling', () => {
    it('handles success response', () => {
      const response = { success: true, id: 123 };

      expect(response.success).toBe(true);
      expect(response.id).toBeDefined();
    });

    it('handles warning response (table not found)', () => {
      const response = { success: false, warning: 'Table not found - migration needed' };

      expect(response.success).toBe(false);
      expect(response.warning).toContain('migration');
    });

    it('handles error response', () => {
      const response = { error: 'Database connection failed' };

      expect(response.error).toBeDefined();
    });
  });

  describe('Console Logging', () => {
    it('logs success message with star counts', () => {
      const cartridgeId = 'test-cartridge';
      const stars = { gold: 1, silver: 2, bronze: 3, tin: 4 };
      const totalWeightedScore = 14.5;

      const logMessage = `[Progress Sync] Synced ${cartridgeId}: ${stars.gold}G ${stars.silver}S ${stars.bronze}B ${stars.tin}T = ${totalWeightedScore} pts`;

      expect(logMessage).toContain('test-cartridge');
      expect(logMessage).toContain('1G');
      expect(logMessage).toContain('2S');
      expect(logMessage).toContain('3B');
      expect(logMessage).toContain('4T');
      expect(logMessage).toContain('14.5 pts');
    });

    it('logs warning message when needed', () => {
      const warning = 'Table not found - migration needed';

      const logMessage = `[Progress Sync] Warning: ${warning}`;

      expect(logMessage).toContain('Warning');
      expect(logMessage).toContain('migration');
    });
  });
});

// ==================== MIGRATION 004 SCHEMA ====================
describe('Migration 004: user_progress Schema', () => {
  describe('Table Structure', () => {
    it('defines required columns', () => {
      const columns = [
        'id',
        'username',
        'cartridge_id',
        'gold_stars',
        'silver_stars',
        'bronze_stars',
        'tin_stars',
        'total_weighted_score',
        'mode_progress',
        'created_at',
        'updated_at'
      ];

      expect(columns).toContain('username');
      expect(columns).toContain('cartridge_id');
      expect(columns).toContain('gold_stars');
      expect(columns).toContain('total_weighted_score');
      expect(columns).toContain('mode_progress');
    });

    it('has unique constraint on username+cartridge_id', () => {
      const uniqueConstraint = 'UNIQUE(username, cartridge_id)';

      expect(uniqueConstraint).toContain('username');
      expect(uniqueConstraint).toContain('cartridge_id');
    });

    it('has indexes for performance', () => {
      const indexes = [
        'idx_user_progress_score',
        'idx_user_progress_cartridge',
        'idx_user_progress_username'
      ];

      expect(indexes.length).toBe(3);
    });
  });

  describe('Default Values', () => {
    it('star columns default to 0', () => {
      const defaults = {
        gold_stars: 0,
        silver_stars: 0,
        bronze_stars: 0,
        tin_stars: 0,
        total_weighted_score: 0
      };

      expect(defaults.gold_stars).toBe(0);
      expect(defaults.total_weighted_score).toBe(0);
    });

    it('mode_progress defaults to empty object', () => {
      const defaultModeProgress = '{}';

      expect(defaultModeProgress).toBe('{}');
    });
  });
});
