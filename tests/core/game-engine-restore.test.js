/**
 * GameEngine Restore Tests
 * Tests the restoreFromServer() functionality for bidirectional sync
 *
 * Run with: npm test -- tests/core/game-engine-restore.test.js
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GameEngine } from '../../platform/core/game-engine.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
    removeItem: vi.fn((key) => { delete store[key]; })
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GameEngine restoreFromServer', () => {
  let engine;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    engine = new GameEngine({
      onStreakUpdate: vi.fn(),
      onStarEarned: vi.fn(),
      onTierUnlocked: vi.fn()
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Guard conditions', () => {
    it('returns skipped when no cartridge loaded', async () => {
      const result = await engine.restoreFromServer('http://localhost', 'testuser');

      expect(result.restored).toBe(false);
      expect(result.source).toBe('skipped');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns skipped when no username provided', async () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [{ id: 'l01', unlockedBy: 'default' }]
      };
      engine.loadCartridge(manifest);

      const result = await engine.restoreFromServer('http://localhost', '');

      expect(result.restored).toBe(false);
      expect(result.source).toBe('skipped');
    });

    it('returns skipped when username is null', async () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [{ id: 'l01', unlockedBy: 'default' }]
      };
      engine.loadCartridge(manifest);

      const result = await engine.restoreFromServer('http://localhost', null);

      expect(result.restored).toBe(false);
      expect(result.source).toBe('skipped');
    });
  });

  describe('Server not found scenarios', () => {
    it('returns local when server returns found:false', async () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [{ id: 'l01', unlockedBy: 'default' }]
      };
      engine.loadCartridge(manifest);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ found: false, data: null })
      });

      const result = await engine.restoreFromServer('http://localhost', 'testuser');

      expect(result.restored).toBe(false);
      expect(result.source).toBe('local');
    });

    it('returns local when server responds with error status', async () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [{ id: 'l01', unlockedBy: 'default' }]
      };
      engine.loadCartridge(manifest);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await engine.restoreFromServer('http://localhost', 'testuser');

      expect(result.restored).toBe(false);
      expect(result.source).toBe('local');
    });
  });

  describe('Restore scenarios', () => {
    it('restores from server when local is empty', async () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [
          { id: 'l01', unlockedBy: 'default' },
          { id: 'l02', unlockedBy: { gold: 2 } }
        ]
      };
      engine.loadCartridge(manifest);

      // Server has progress
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          data: {
            gold_stars: 5,
            silver_stars: 2,
            bronze_stars: 1,
            tin_stars: 0,
            mode_progress: {
              'l01': { gold: 3, silver: 2, bronze: 1, tin: 0 },
              'l02': { gold: 2, silver: 0, bronze: 0, tin: 0 }
            },
            updated_at: '2025-01-15T10:00:00Z'
          }
        })
      });

      const result = await engine.restoreFromServer('http://localhost', 'testuser');

      expect(result.restored).toBe(true);
      expect(result.source).toBe('server');
      expect(engine.starCounts.gold).toBe(5);
      expect(engine.starCounts.silver).toBe(2);
      expect(engine.starsPerMode['l01'].gold).toBe(3);
    });

    it('keeps local when local is newer than server', async () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [{ id: 'l01', unlockedBy: 'default' }]
      };
      engine.loadCartridge(manifest);

      // Earn local progress (this sets updated_at to now)
      engine.awardStar('gold', 'l01');
      engine.awardStar('gold', 'l01');

      // Server has older progress
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          data: {
            gold_stars: 1,
            silver_stars: 0,
            bronze_stars: 0,
            tin_stars: 0,
            mode_progress: { 'l01': { gold: 1, silver: 0, bronze: 0, tin: 0 } },
            updated_at: '2024-01-01T10:00:00Z'  // Old timestamp
          }
        })
      });

      const result = await engine.restoreFromServer('http://localhost', 'testuser');

      expect(result.restored).toBe(false);
      expect(result.source).toBe('local');
      expect(engine.starCounts.gold).toBe(2);  // Local progress preserved
    });

    it('restores from server when server is newer', async () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [{ id: 'l01', unlockedBy: 'default' }]
      };
      engine.loadCartridge(manifest);

      // Set old local timestamp
      engine.stateUpdatedAt = '2024-01-01T10:00:00Z';
      engine.saveState();

      // Server has newer progress
      const futureDate = new Date(Date.now() + 86400000).toISOString();  // Tomorrow
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          data: {
            gold_stars: 10,
            silver_stars: 5,
            bronze_stars: 2,
            tin_stars: 1,
            mode_progress: { 'l01': { gold: 10, silver: 5, bronze: 2, tin: 1 } },
            updated_at: futureDate
          }
        })
      });

      const result = await engine.restoreFromServer('http://localhost', 'testuser');

      expect(result.restored).toBe(true);
      expect(result.source).toBe('server');
      expect(engine.starCounts.gold).toBe(10);
    });
  });

  describe('Unlock recalculation', () => {
    it('recalculates unlocked tiers after restore', async () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [
          { id: 'l01', unlockedBy: 'default' },
          { id: 'l02', unlockedBy: { gold: 3 } },
          { id: 'l03', unlockedBy: { gold: 3 } }
        ]
      };
      engine.loadCartridge(manifest);

      // Initially only l01 unlocked
      expect(engine.unlockedTiers).toContain('l01');
      expect(engine.unlockedTiers).not.toContain('l02');

      // Server has progress that should unlock l02
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          found: true,
          data: {
            gold_stars: 6,
            silver_stars: 0,
            bronze_stars: 0,
            tin_stars: 0,
            mode_progress: {
              'l01': { gold: 3, silver: 0, bronze: 0, tin: 0 },
              'l02': { gold: 3, silver: 0, bronze: 0, tin: 0 }
            },
            updated_at: new Date().toISOString()
          }
        })
      });

      await engine.restoreFromServer('http://localhost', 'testuser');

      expect(engine.unlockedTiers).toContain('l01');
      expect(engine.unlockedTiers).toContain('l02');
      expect(engine.unlockedTiers).toContain('l03');
    });
  });

  describe('Network error handling', () => {
    it('handles network errors gracefully', async () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [{ id: 'l01', unlockedBy: 'default' }]
      };
      engine.loadCartridge(manifest);

      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const result = await engine.restoreFromServer('http://localhost', 'testuser');

      expect(result.restored).toBe(false);
      expect(result.source).toBe('local');
    });

    it('handles JSON parse errors gracefully', async () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [{ id: 'l01', unlockedBy: 'default' }]
      };
      engine.loadCartridge(manifest);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const result = await engine.restoreFromServer('http://localhost', 'testuser');

      expect(result.restored).toBe(false);
      expect(result.source).toBe('local');
    });
  });

  describe('Timestamp persistence', () => {
    it('saveState includes updated_at timestamp', () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [{ id: 'l01', unlockedBy: 'default' }]
      };
      engine.loadCartridge(manifest);

      engine.saveState();

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedCalls = localStorageMock.setItem.mock.calls;
      const stateCall = savedCalls.find(c => c[0].includes('gameState'));
      expect(stateCall).toBeDefined();

      const savedState = JSON.parse(stateCall[1]);
      expect(savedState.updated_at).toBeDefined();
      // Should be a valid ISO date string
      expect(new Date(savedState.updated_at).getTime()).not.toBeNaN();
    });

    it('loadState restores updated_at timestamp', () => {
      const testTimestamp = '2025-06-15T14:30:00Z';
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({
        streaks: {},
        starCounts: { gold: 5, silver: 3, bronze: 2, tin: 1 },
        starsPerMode: {},
        currentTier: 'l01',
        unlockedTiers: ['l01'],
        updated_at: testTimestamp
      }));

      engine.storagePrefix = 'driller_test_';
      engine.loadState();

      expect(engine.stateUpdatedAt).toBe(testTimestamp);
    });
  });

  describe('URL encoding', () => {
    it('encodes username and cartridgeId in URL', async () => {
      const manifest = {
        meta: { id: 'test-cartridge', name: 'Test' },
        modes: [{ id: 'l01', unlockedBy: 'default' }]
      };
      engine.loadCartridge(manifest);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ found: false, data: null })
      });

      await engine.restoreFromServer('http://localhost', 'user with spaces');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost/api/progress/cartridge/user%20with%20spaces/test-cartridge'
      );
    });
  });
});
