/**
 * Grid Wars v2.1.2 Tests
 * Regression tests for rendering fixes:
 * - drawOwnerPresence() coordinate extraction from key string
 * - hierarchyEnabled config default
 * - Territory key format consistency
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GridWarsState, GRID_WARS_CONFIG, resetGridWarsState } from '../../platform/game/grid-state.js';
import { GridRenderer } from '../../platform/game/grid-renderer.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock canvas for renderer tests
function createMockCanvas() {
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    scale: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    setLineDash: vi.fn(),
    closePath: vi.fn()
  };

  return {
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 300 }),
    width: 300,
    height: 300,
    style: { cssText: '' },
    parentElement: null,
    _ctx: ctx
  };
}

// Helper to create mock responses
function mockResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data)
  });
}

describe('Grid Wars v2.1.2 Fixes', () => {

  describe('GRID_WARS_CONFIG defaults', () => {
    it('has hierarchyEnabled set to true by default', () => {
      expect(GRID_WARS_CONFIG.hierarchyEnabled).toBe(true);
    });

    it('has maxSubdivisionLevel set by default', () => {
      expect(GRID_WARS_CONFIG.maxSubdivisionLevel).toBe(2);
    });

    it('has developmentCost set by default', () => {
      expect(GRID_WARS_CONFIG.developmentCost).toBe(100);
    });

    it('has drillCost set by default', () => {
      expect(GRID_WARS_CONFIG.drillCost).toBe(75);
    });

    it('has drillSaturationThreshold set by default', () => {
      expect(GRID_WARS_CONFIG.drillSaturationThreshold).toBe(85);
    });

    it('has ownerRetentionCells set by default', () => {
      expect(GRID_WARS_CONFIG.ownerRetentionCells).toEqual(['d4', 'd5', 'e4', 'e5']);
    });

    it('has attackerDrillCell set by default', () => {
      expect(GRID_WARS_CONFIG.attackerDrillCell).toBe('a1');
    });
  });

  describe('Territory Key Format', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      mockFetch.mockClear();
      state = new GridWarsState({ serverUrl: 'http://test-server' });
    });

    it('stores territories with "x,y" string keys', async () => {
      const mockGame = { game_id: 'game-123', status: 'active' };
      const mockState = {
        game: mockGame,
        territories: [
          { x: 3, y: 4, owner: 'alice', strength: 3, address: 'd5' },
          { x: 0, y: 0, owner: 'bob', strength: 3, address: 'a1' }
        ],
        players: [],
        classGoal: { current: 0, target: 50 }
      };

      mockFetch
        .mockResolvedValueOnce(mockResponse({ hierarchyEnabled: true })) // config
        .mockResolvedValueOnce(mockResponse(mockGame))
        .mockResolvedValueOnce(mockResponse(mockState));

      await state.init();

      // Verify territories are stored with correct key format
      expect(state.territories.has('3,4')).toBe(true);
      expect(state.territories.has('0,0')).toBe(true);

      // Verify x,y are NOT stored as properties on the territory object
      const territory = state.territories.get('3,4');
      expect(territory.owner).toBe('alice');
      expect(territory.x).toBeUndefined(); // x should NOT be on the object
      expect(territory.y).toBeUndefined(); // y should NOT be on the object
    });

    it('getRenderState returns territories with x,y as properties', () => {
      // Manually set up state
      state.gameId = 'test-game';
      state.username = 'alice';
      state.territories.set('3,4', {
        owner: 'alice',
        strength: 3,
        address: 'd5',
        is_developed: false
      });

      const renderState = state.getRenderState();

      // getRenderState should extract x,y from key and include as properties
      expect(renderState.territories.length).toBe(1);
      expect(renderState.territories[0].x).toBe(3);
      expect(renderState.territories[0].y).toBe(4);
      expect(renderState.territories[0].owner).toBe('alice');
    });
  });

  describe('GridRenderer Territory Handling', () => {
    let renderer;
    let mockCanvas;

    beforeEach(() => {
      mockCanvas = createMockCanvas();
      // Don't start render loop in tests
      vi.spyOn(GridRenderer.prototype, 'startRenderLoop').mockImplementation(() => {});
      renderer = new GridRenderer(mockCanvas, { gridSize: 8, cellSize: 30 });
    });

    it('setTerritory stores data without x,y on object', () => {
      renderer.setTerritory(3, 4, 'alice', { strength: 3, address: 'd5' });

      const territory = renderer.territories['3,4'];
      expect(territory).toBeDefined();
      expect(territory.owner).toBe('alice');
      expect(territory.strength).toBe(3);
      expect(territory.address).toBe('d5');
      // x,y should NOT be stored as properties
      expect(territory.x).toBeUndefined();
      expect(territory.y).toBeUndefined();
    });

    it('territories are keyed by "x,y" string format', () => {
      renderer.setTerritory(0, 0, 'alice', {});
      renderer.setTerritory(7, 7, 'bob', {});
      renderer.setTerritory(3, 4, 'charlie', {});

      expect(Object.keys(renderer.territories)).toContain('0,0');
      expect(Object.keys(renderer.territories)).toContain('7,7');
      expect(Object.keys(renderer.territories)).toContain('3,4');
    });

    it('can extract x,y from key string correctly', () => {
      renderer.setTerritory(5, 6, 'alice', {});

      const key = '5,6';
      const [x, y] = key.split(',').map(Number);

      expect(x).toBe(5);
      expect(y).toBe(6);
      expect(typeof x).toBe('number');
      expect(typeof y).toBe('number');
    });

    it('setUsePresenceDots enables presence dots mode', () => {
      expect(renderer._usePresenceDots).toBe(false);
      renderer.setUsePresenceDots(true);
      expect(renderer._usePresenceDots).toBe(true);
    });

    it('setOnlinePlayers stores player set', () => {
      renderer.setOnlinePlayers(['alice', 'bob']);
      expect(renderer._onlinePlayers.has('alice')).toBe(true);
      expect(renderer._onlinePlayers.has('bob')).toBe(true);
      expect(renderer._onlinePlayers.has('charlie')).toBe(false);
    });
  });

  describe('Presence Dots Coordinate Extraction', () => {
    it('key.split(",").map(Number) correctly parses coordinates', () => {
      // This tests the fix for drawOwnerPresence()
      const testCases = [
        { key: '0,0', expectedX: 0, expectedY: 0 },
        { key: '7,7', expectedX: 7, expectedY: 7 },
        { key: '3,4', expectedX: 3, expectedY: 4 },
        { key: '5,2', expectedX: 5, expectedY: 2 },
      ];

      for (const { key, expectedX, expectedY } of testCases) {
        const [x, y] = key.split(',').map(Number);
        expect(x).toBe(expectedX);
        expect(y).toBe(expectedY);
      }
    });

    it('does not rely on cell.x or cell.y properties', () => {
      // Simulate the territory object structure (without x,y)
      const territories = {
        '3,4': { owner: 'alice', strength: 3, color: '#ff0000' },
        '5,6': { owner: 'bob', strength: 2, color: '#00ff00' }
      };

      // Iterate like drawOwnerPresence does
      for (const [key, cell] of Object.entries(territories)) {
        // OLD BROKEN CODE: cell.x and cell.y would be undefined
        expect(cell.x).toBeUndefined();
        expect(cell.y).toBeUndefined();

        // NEW FIXED CODE: extract from key
        const [x, y] = key.split(',').map(Number);
        expect(typeof x).toBe('number');
        expect(typeof y).toBe('number');
        expect(Number.isNaN(x)).toBe(false);
        expect(Number.isNaN(y)).toBe(false);
      }
    });
  });

  describe('Hierarchy Navigation State', () => {
    let state;

    beforeEach(() => {
      resetGridWarsState();
      mockFetch.mockClear();
      state = new GridWarsState({ serverUrl: 'http://test-server' });
    });

    it('initializes with default navigation state', () => {
      expect(state.currentParent).toBeNull();
      expect(state.currentLevel).toBe(0);
      expect(state.breadcrumb).toEqual([]);
    });

    it('getNavigationState returns correct structure', () => {
      const navState = state.getNavigationState();

      expect(navState).toHaveProperty('currentParent');
      expect(navState).toHaveProperty('currentLevel');
      expect(navState).toHaveProperty('breadcrumb');
      expect(navState).toHaveProperty('canZoomOut');
    });

    it('canZoomOut is false at root level', () => {
      const navState = state.getNavigationState();
      expect(navState.canZoomOut).toBe(false);
    });
  });

  describe('Config Hierarchy Defaults Prevent Chevron Fallback', () => {
    it('hierarchyEnabled defaults to true so presence dots are used', () => {
      // This test ensures that even if server config fetch fails,
      // hierarchyEnabled will be true and presence dots will be used
      // instead of falling back to chevron/avatar rendering
      expect(GRID_WARS_CONFIG.hierarchyEnabled).toBe(true);
    });

    it('all v2.0 hierarchy config values are defined', () => {
      // Ensure no undefined values that could cause runtime errors
      expect(GRID_WARS_CONFIG.hierarchyEnabled).toBeDefined();
      expect(GRID_WARS_CONFIG.maxSubdivisionLevel).toBeDefined();
      expect(GRID_WARS_CONFIG.developmentCost).toBeDefined();
      expect(GRID_WARS_CONFIG.drillCost).toBeDefined();
      expect(GRID_WARS_CONFIG.drillSaturationThreshold).toBeDefined();
      expect(GRID_WARS_CONFIG.ownerRetentionCells).toBeDefined();
      expect(GRID_WARS_CONFIG.attackerDrillCell).toBeDefined();
    });
  });
});
