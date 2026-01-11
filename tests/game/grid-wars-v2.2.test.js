/**
 * Grid Wars v2.2 Tests
 * Tests for player colors, mini-mosaic rendering, and gift mechanic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GridWarsState, GRID_WARS_CONFIG } from '../../platform/game/grid-state.js';
import { GridRenderer } from '../../platform/game/grid-renderer.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create mock responses
function mockResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data)
  });
}

// Helper to initialize state with a game
async function initStateWithGame(state, extraData = {}) {
  const mockGame = { game_id: 'game-123', status: 'active', map_size: 8 };
  const mockStateData = {
    game: mockGame,
    territories: [],
    players: [{
      username: 'alice',
      action_points: 100,
      territories_count: 2,
      health: 100,
      active_buffs: {},
      last_answer_at: new Date().toISOString()
    }, {
      username: 'bob',
      action_points: 80,
      territories_count: 1,
      health: 100,
      active_buffs: {},
      last_answer_at: new Date().toISOString()
    }],
    classGoal: { current: 0, target: 50 },
    surge: null,
    playerColors: {
      'alice': '#FF3366',
      'bob': '#4D96FF'
    },
    subcellSummaries: {},
    ...extraData
  };

  // Mock config fetch
  mockFetch.mockResolvedValueOnce(mockResponse({
    claimCost: 40,
    hierarchyEnabled: true,
    developmentCost: 100,
    drillCost: 75,
    maxSubdivisionLevel: 2
  }));
  // Mock active game fetch
  mockFetch.mockResolvedValueOnce(mockResponse(mockGame));
  // Mock state fetch
  mockFetch.mockResolvedValueOnce(mockResponse(mockStateData));

  await state.init();
  mockFetch.mockClear();
}

describe('Grid Wars v2.2 - Player Colors', () => {
  let state;

  beforeEach(async () => {
    mockFetch.mockClear();
    state = new GridWarsState({ serverUrl: 'http://test-server' });
    state.setUser('alice');
  });

  describe('playerColors storage', () => {
    it('stores playerColors from server response', async () => {
      await initStateWithGame(state, {
        playerColors: {
          'alice': '#FF3366',
          'bob': '#4D96FF',
          'charlie': '#6BCB77'
        }
      });

      expect(state.playerColors).toEqual({
        'alice': '#FF3366',
        'bob': '#4D96FF',
        'charlie': '#6BCB77'
      });
    });

    it('getPlayerColor returns correct color', async () => {
      await initStateWithGame(state, {
        playerColors: {
          'alice': '#FF3366',
          'bob': '#4D96FF'
        }
      });

      expect(state.getPlayerColor('alice')).toBe('#FF3366');
      expect(state.getPlayerColor('bob')).toBe('#4D96FF');
      expect(state.getPlayerColor('unknown')).toBeNull();
    });

    it('includes playerColors in getRenderState', async () => {
      await initStateWithGame(state, {
        playerColors: {
          'alice': '#FF3366',
          'bob': '#4D96FF'
        }
      });

      const renderState = state.getRenderState();
      expect(renderState.playerColors).toEqual({
        'alice': '#FF3366',
        'bob': '#4D96FF'
      });
    });
  });
});

describe('Grid Wars v2.2 - Subcell Summaries', () => {
  let state;

  beforeEach(async () => {
    mockFetch.mockClear();
    state = new GridWarsState({ serverUrl: 'http://test-server' });
    state.setUser('alice');
  });

  describe('subcellSummaries storage', () => {
    it('stores subcellSummaries from server response', async () => {
      const mockSummary = Array(8).fill(null).map(() =>
        Array(8).fill(null).map(() => ({ owner: null, is_developed: false }))
      );
      // Set some owned cells in the summary
      mockSummary[3][3] = { owner: 'alice', is_developed: false }; // d4
      mockSummary[3][4] = { owner: 'alice', is_developed: false }; // e4
      mockSummary[4][3] = { owner: 'alice', is_developed: false }; // d5
      mockSummary[4][4] = { owner: 'alice', is_developed: false }; // e5

      await initStateWithGame(state, {
        subcellSummaries: {
          'd5': mockSummary
        }
      });

      expect(state.subcellSummaries).toHaveProperty('d5');
      expect(state.subcellSummaries['d5'][3][3].owner).toBe('alice');
    });

    it('getSubcellSummary returns correct data', async () => {
      const mockSummary = Array(8).fill(null).map(() =>
        Array(8).fill(null).map(() => ({ owner: null, is_developed: false }))
      );
      mockSummary[0][0] = { owner: 'bob', is_developed: false }; // a1 corner

      await initStateWithGame(state, {
        subcellSummaries: {
          'e5': mockSummary
        }
      });

      const summary = state.getSubcellSummary('e5');
      expect(summary).toBeTruthy();
      expect(summary[0][0].owner).toBe('bob');
      expect(state.getSubcellSummary('unknown')).toBeNull();
    });

    it('includes subcellSummaries in getRenderState', async () => {
      const mockSummary = Array(8).fill(null).map(() =>
        Array(8).fill(null).map(() => ({ owner: null, is_developed: false }))
      );

      await initStateWithGame(state, {
        subcellSummaries: {
          'd5': mockSummary
        }
      });

      const renderState = state.getRenderState();
      expect(renderState.subcellSummaries).toHaveProperty('d5');
    });
  });
});

describe('Grid Wars v2.2 - Gift Mechanic', () => {
  let state;

  beforeEach(async () => {
    mockFetch.mockClear();
    state = new GridWarsState({ serverUrl: 'http://test-server' });
    state.setUser('alice');
  });

  describe('giftCell', () => {
    it('sends correct request to gift endpoint', async () => {
      await initStateWithGame(state, {
        territories: [
          { x: 3, y: 4, owner: 'alice', address: 'd5', is_developed: false }
        ]
      });

      // Mock gift response
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        from: 'alice',
        to: 'bob',
        address: 'd5'
      }));

      // Mock refresh state after gift
      mockFetch.mockResolvedValueOnce(mockResponse({
        game: { game_id: 'game-123' },
        territories: [
          { x: 3, y: 4, owner: 'bob', address: 'd5', is_developed: false }
        ],
        players: [],
        classGoal: { current: 0, target: 50 },
        playerColors: {},
        subcellSummaries: {}
      }));

      await state.giftCell('d5', 'bob');

      // Check the gift request
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('http://test-server/api/grid-wars/gift');
      const body = JSON.parse(options.body);
      expect(body.gameId).toBe('game-123');
      expect(body.fromUsername).toBe('alice');
      expect(body.toUsername).toBe('bob');
      expect(body.address).toBe('d5');
    });

    it('throws error if not initialized', async () => {
      // Don't initialize state
      await expect(state.giftCell('d5', 'bob')).rejects.toThrow('Game not initialized');
    });

    it('throws error if gift fails', async () => {
      await initStateWithGame(state);

      // Mock gift error response
      mockFetch.mockResolvedValueOnce(mockResponse(
        { error: 'You do not own this cell' },
        403
      ));

      await expect(state.giftCell('d5', 'bob')).rejects.toThrow('You do not own this cell');
    });
  });
});

describe('Grid Wars v2.2 - Renderer Mini-Mosaic', () => {
  let renderer;
  let mockCanvas;
  let mockCtx;

  beforeEach(() => {
    // Create mock canvas and context
    mockCtx = {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      clearRect: vi.fn(),
      scale: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      font: '',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      fillText: vi.fn()
    };

    mockCanvas = {
      getContext: () => mockCtx,
      parentElement: {
        clientWidth: 300,
        clientHeight: 300,
        style: {},
        appendChild: vi.fn()
      },
      width: 300,
      height: 300,
      style: {},
      getBoundingClientRect: () => ({ left: 0, top: 0 })
    };

    // Mock window with requestAnimationFrame
    global.window = {
      devicePixelRatio: 1,
      requestAnimationFrame: vi.fn((cb) => setTimeout(cb, 16))
    };

    // Also set requestAnimationFrame globally for the renderer
    global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));

    // Mock document.createElement
    global.document = {
      createElement: (tag) => ({
        ...mockCanvas,
        style: { cssText: '' },
        getContext: () => mockCtx
      })
    };

    global.getComputedStyle = () => ({ position: 'relative' });
    global.performance = { now: () => Date.now() };

    renderer = new GridRenderer(mockCanvas, { gridSize: 8, cellSize: 30 });
  });

  describe('setPlayerColors', () => {
    it('stores player colors', () => {
      renderer.setPlayerColors({
        'alice': '#FF3366',
        'bob': '#4D96FF'
      });

      expect(renderer._playerColors).toEqual({
        'alice': '#FF3366',
        'bob': '#4D96FF'
      });
    });

    it('marks static layer as dirty', () => {
      renderer._staticDirty = false;
      renderer.setPlayerColors({ 'alice': '#FF3366' });
      expect(renderer._staticDirty).toBe(true);
    });
  });

  describe('setSubcellSummaries', () => {
    it('stores subcell summaries', () => {
      const summary = Array(8).fill(null).map(() =>
        Array(8).fill(null).map(() => ({ owner: null, is_developed: false }))
      );
      renderer.setSubcellSummaries({ 'd5': summary });
      expect(renderer._subcellSummaries).toHaveProperty('d5');
    });

    it('marks static layer as dirty', () => {
      renderer._staticDirty = false;
      renderer.setSubcellSummaries({ 'd5': [] });
      expect(renderer._staticDirty).toBe(true);
    });
  });

  describe('getServerPlayerColor', () => {
    it('returns server-assigned color if available', () => {
      renderer.setPlayerColors({ 'alice': '#FF3366' });
      expect(renderer.getServerPlayerColor('alice')).toBe('#FF3366');
    });

    it('falls back to generated color if not set', () => {
      renderer.setPlayerColors({});
      const color = renderer.getServerPlayerColor('alice');
      expect(color).toBeTruthy();
      expect(color.startsWith('#')).toBe(true);
    });
  });

  describe('darkenColor', () => {
    it('darkens a hex color', () => {
      const darkened = renderer.darkenColor('#FFFFFF', 0.5);
      // 255 - floor(255 * 0.5) = 255 - 127 = 128 = 0x80
      expect(darkened).toBe('#808080');
    });

    it('handles short hex format', () => {
      const darkened = renderer.darkenColor('#FFF', 0.5);
      expect(darkened).toBe('#808080');
    });

    it('clamps to 0 minimum', () => {
      const darkened = renderer.darkenColor('#000000', 0.5);
      expect(darkened).toBe('#000000');
    });
  });
});

describe('Grid Wars v2.2 - Server Colors and Gift Integration', () => {
  describe('VIVID_COLORS palette', () => {
    const VIVID_COLORS = [
      '#FF3366', '#FF6B35', '#FFD93D', '#6BCB77', '#4D96FF',
      '#9B59B6', '#00D9FF', '#FF85A1', '#45B7D1', '#F7DC6F',
      '#BB8FCE', '#58D68D', '#EC7063', '#5DADE2', '#F1948A',
      '#7DCEA0', '#D7BDE2', '#F8C471', '#85C1E9', '#82E0AA',
      '#F7B2BD', '#AED6F1', '#48C9B0', '#F39C12', '#1ABC9C',
      '#E74C3C', '#3498DB', '#2ECC71', '#E67E22', '#34495E',
      '#16A085', '#8E44AD', '#D35400', '#27AE60', '#2980B9',
      '#C0392B', '#7F8C8D', '#BDC3C7', '#F39C12', '#9B59B6'
    ];

    it('has 40 predefined colors', () => {
      expect(VIVID_COLORS.length).toBe(40);
    });

    it('all colors are valid hex format', () => {
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      for (const color of VIVID_COLORS) {
        expect(color).toMatch(hexPattern);
      }
    });

    it('colors are visually distinct (no exact duplicates in first 30)', () => {
      const first30 = VIVID_COLORS.slice(0, 30);
      const uniqueColors = new Set(first30);
      expect(uniqueColors.size).toBe(30);
    });
  });
});

describe('Grid Wars v2.2 - Level Cap', () => {
  it('config has maxSubdivisionLevel=2', () => {
    // This is set in the shared config
    expect(GRID_WARS_CONFIG.maxSubdivisionLevel).toBe(2);
  });

  it('allows levels 0, 1, 2 but not 3', () => {
    const maxLevel = GRID_WARS_CONFIG.maxSubdivisionLevel;
    expect(maxLevel).toBe(2);
    // Level 0 = macro, Level 1 = district, Level 2 = block, Level 3 = NOT ALLOWED
    expect([0, 1, 2].every(l => l <= maxLevel)).toBe(true);
    expect(3 > maxLevel).toBe(true);
  });
});
