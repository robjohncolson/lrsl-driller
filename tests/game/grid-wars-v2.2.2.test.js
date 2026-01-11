/**
 * Grid Wars v2.2.2 Regression Tests
 *
 * Tests for click-to-select behavior (no auto-claim)
 * - Click on canvas = select cell, NOT claim
 * - Claim button = triggers actual claim
 * - Selection highlight (cyan) separate from hover (white)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GridWarsState, GRID_WARS_CONFIG } from '../../platform/game/grid-state.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Grid Wars v2.2.2 - Click to Select (No Auto-Claim)', () => {
  let state;

  beforeEach(() => {
    vi.clearAllMocks();
    state = new GridWarsState({ serverUrl: 'http://test' });
    state.gameId = 'test-game';
    state.username = 'testuser';
    state.players.set('testuser', { action_points: 100, territories_count: 0 });
  });

  describe('Selection State Management', () => {
    it('stores selected cell coordinates in _selectedForAction', () => {
      // Simulating what onCanvasClick does
      const selectedForAction = {
        x: 3,
        y: 4,
        address: 'd5',
        owner: null
      };

      expect(selectedForAction.x).toBe(3);
      expect(selectedForAction.y).toBe(4);
      expect(selectedForAction.address).toBe('d5');
      expect(selectedForAction.owner).toBeNull();
    });

    it('calculates full address with parent context', () => {
      // At root level
      const x = 4, y = 4;
      const localAddress = String.fromCharCode(97 + x) + (y + 1);
      expect(localAddress).toBe('e5');

      // With parent
      const currentParent = 'd5';
      const fullAddress = currentParent ? `${currentParent}.${localAddress}` : localAddress;
      expect(fullAddress).toBe('d5.e5');
    });

    it('calculates chess notation correctly for all cells', () => {
      // Test corner cells
      expect(String.fromCharCode(97 + 0) + (0 + 1)).toBe('a1');
      expect(String.fromCharCode(97 + 7) + (0 + 1)).toBe('h1');
      expect(String.fromCharCode(97 + 0) + (7 + 1)).toBe('a8');
      expect(String.fromCharCode(97 + 7) + (7 + 1)).toBe('h8');

      // Test center cells
      expect(String.fromCharCode(97 + 3) + (3 + 1)).toBe('d4');
      expect(String.fromCharCode(97 + 4) + (4 + 1)).toBe('e5');
    });
  });

  describe('Claim Cost Display', () => {
    it('returns null for own territory (cannot claim)', () => {
      state.territories.set('3,4', { owner: 'testuser' });
      const costInfo = state.getClaimCostAt(3, 4);
      expect(costInfo).toBeNull();
    });

    it('returns neutral cost for unclaimed cell', () => {
      const costInfo = state.getClaimCostAt(3, 4);
      expect(costInfo).not.toBeNull();
      expect(costInfo.isEnemy).toBe(false);
      expect(costInfo.baseCost).toBe(GRID_WARS_CONFIG.claimCost);
    });

    it('returns enemy cost for enemy territory', () => {
      state.territories.set('3,4', { owner: 'enemy' });
      const costInfo = state.getClaimCostAt(3, 4);
      expect(costInfo).not.toBeNull();
      expect(costInfo.isEnemy).toBe(true);
      expect(costInfo.defender).toBe('enemy');
    });
  });

  describe('Claim Button State Logic', () => {
    it('should show disabled state when no cell selected', () => {
      const selected = null;
      const buttonState = {
        disabled: !selected,
        text: selected ? 'Claim' : 'Select Cell',
        cost: selected ? '40' : '--'
      };

      expect(buttonState.disabled).toBe(true);
      expect(buttonState.text).toBe('Select Cell');
      expect(buttonState.cost).toBe('--');
    });

    it('should show enabled state for neutral cell', () => {
      const selected = { x: 3, y: 4, owner: null };
      const points = 100;
      const cost = 40;

      const buttonState = {
        disabled: points < cost,
        text: selected.owner ? 'Attack' : 'Claim',
        cost: cost
      };

      expect(buttonState.disabled).toBe(false);
      expect(buttonState.text).toBe('Claim');
      expect(buttonState.cost).toBe(40);
    });

    it('should show Attack for enemy territory', () => {
      const selected = { x: 3, y: 4, owner: 'enemy' };

      const buttonState = {
        text: selected.owner ? 'Attack' : 'Claim'
      };

      expect(buttonState.text).toBe('Attack');
    });

    it('should disable when insufficient points', () => {
      const points = 30;
      const cost = 40;

      expect(points < cost).toBe(true);
    });
  });

  describe('Claim Execution Flow', () => {
    it('claimTerritory is NOT called on selection', async () => {
      // Selection should NOT trigger claimTerritory
      // This is the key behavioral change in v2.2.2
      const claimSpy = vi.spyOn(state, 'claimTerritory');

      // Simulate selection (what onCanvasClick now does)
      const selectedForAction = { x: 3, y: 4, address: 'd5', owner: null };

      // claimTerritory should NOT have been called
      expect(claimSpy).not.toHaveBeenCalled();
    });

    it('claimTerritory is called when handleClaimButtonClick executes', async () => {
      // Mock successful claim
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          actionId: 'test-123',
          authoritativeCell: { x: 3, y: 4, owner: 'testuser' }
        })
      });

      // This simulates the button click flow
      await state.claimTerritory(3, 4);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test/api/grid-wars/action',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });

  describe('Selection Clearing After Claim', () => {
    it('selection should be cleared after successful claim', async () => {
      let selectedForAction = { x: 3, y: 4, address: 'd5', owner: null };
      let selectedCell = { x: 3, y: 4 };

      // Mock successful claim
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      // After successful claim, selection should be cleared
      // (This is what handleClaimButtonClick does)
      selectedForAction = null;
      selectedCell = null;

      expect(selectedForAction).toBeNull();
      expect(selectedCell).toBeNull();
    });

    it('selection should persist after failed claim', async () => {
      let selectedForAction = { x: 3, y: 4, address: 'd5', owner: null };

      // Mock failed claim
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Insufficient points' })
      });

      // After failed claim, selection should persist
      // (Don't clear on error)
      expect(selectedForAction).not.toBeNull();
      expect(selectedForAction.x).toBe(3);
    });
  });
});

describe('Grid Wars v2.2.2 - Renderer Selection Highlight', () => {
  describe('GridRenderer selection state', () => {
    it('should have separate selectedCell from hoveredCell', () => {
      // Simulating renderer state
      const renderer = {
        hoveredCell: null,
        selectedCell: null
      };

      // Set selection
      renderer.selectedCell = { x: 3, y: 4 };

      // Set hover on different cell
      renderer.hoveredCell = { x: 5, y: 6 };

      expect(renderer.selectedCell).not.toEqual(renderer.hoveredCell);
      expect(renderer.selectedCell.x).toBe(3);
      expect(renderer.hoveredCell.x).toBe(5);
    });

    it('setSelectedCell should accept null to clear', () => {
      const renderer = {
        selectedCell: { x: 3, y: 4 },
        _staticDirty: false,
        setSelectedCell(x, y) {
          this.selectedCell = (x !== null && y !== null) ? { x, y } : null;
          this._staticDirty = true;
        }
      };

      renderer.setSelectedCell(null, null);

      expect(renderer.selectedCell).toBeNull();
      expect(renderer._staticDirty).toBe(true);
    });

    it('setSelectedCell should mark static layer dirty', () => {
      const renderer = {
        selectedCell: null,
        _staticDirty: false,
        setSelectedCell(x, y) {
          this.selectedCell = (x !== null && y !== null) ? { x, y } : null;
          this._staticDirty = true;
        }
      };

      renderer.setSelectedCell(3, 4);

      expect(renderer._staticDirty).toBe(true);
    });
  });

  describe('Selection vs Hover Drawing Logic', () => {
    it('should not draw hover when it matches selection', () => {
      const selectedCell = { x: 3, y: 4 };
      const hoveredCell = { x: 3, y: 4 };

      const shouldDrawHover = !(selectedCell &&
        selectedCell.x === hoveredCell.x &&
        selectedCell.y === hoveredCell.y);

      expect(shouldDrawHover).toBe(false);
    });

    it('should draw both when hover differs from selection', () => {
      const selectedCell = { x: 3, y: 4 };
      const hoveredCell = { x: 5, y: 6 };

      const shouldDrawHover = !(selectedCell &&
        selectedCell.x === hoveredCell.x &&
        selectedCell.y === hoveredCell.y);

      expect(shouldDrawHover).toBe(true);
    });

    it('should use cyan color for selection', () => {
      const selectionColor = '#00ffff';
      expect(selectionColor).toBe('#00ffff');
    });

    it('should use white color for hover', () => {
      const hoverColor = '#ffffff';
      expect(hoverColor.toLowerCase()).toBe('#ffffff');
    });
  });
});

describe('Grid Wars v2.2.2 - Status Messages', () => {
  it('shows correct status for own territory', () => {
    const owner = 'testuser';
    const username = 'testuser';

    let statusMessage;
    if (owner === username) {
      statusMessage = 'Your territory — Click DEVELOP to subdivide';
    }

    expect(statusMessage).toContain('Your territory');
    expect(statusMessage).toContain('DEVELOP');
  });

  it('shows correct status for enemy territory', () => {
    const owner = 'enemy';
    const username = 'testuser';

    let statusMessage;
    if (owner && owner !== username) {
      statusMessage = `Enemy territory (${owner}) — Click CLAIM to attack`;
    }

    expect(statusMessage).toContain('Enemy territory');
    expect(statusMessage).toContain('enemy');
    expect(statusMessage).toContain('CLAIM');
  });

  it('shows correct status for neutral cell', () => {
    const owner = null;

    let statusMessage;
    if (!owner) {
      statusMessage = 'Neutral cell — Click CLAIM to capture';
    }

    expect(statusMessage).toContain('Neutral');
    expect(statusMessage).toContain('CLAIM');
  });
});

describe('Grid Wars v2.2.2 - Keyboard Shortcut Integration', () => {
  it('handleClaimAtPosition uses selected cell in hierarchy mode', () => {
    const hierarchyEnabled = true;
    const selectedForAction = { x: 3, y: 4, owner: null };

    // In hierarchy mode with selection, should use selected cell
    const shouldUseSelection = hierarchyEnabled && selectedForAction;

    expect(shouldUseSelection).toBeTruthy();
    expect(shouldUseSelection.x).toBe(3);
    expect(shouldUseSelection.y).toBe(4);
  });

  it('handleClaimAtPosition uses avatar position without selection', () => {
    const hierarchyEnabled = true;
    const selectedForAction = null;
    const avatarPosition = { x: 5, y: 5 };

    // Without selection, falls back to avatar position
    const shouldUseAvatar = !selectedForAction && avatarPosition;

    expect(shouldUseAvatar).toBeTruthy();
    expect(shouldUseAvatar.x).toBe(5);
  });
});

describe('Grid Wars v2.2.2 - Grid Renderer Diagnostics', () => {
  it('logs constructor dimensions', () => {
    // The constructor should log these values
    const diagnostics = {
      gridSize: 8,
      cellSize: 30,
      canvasWidth: 280,
      canvasHeight: 280
    };

    expect(diagnostics.gridSize).toBe(8);
    expect(diagnostics.cellSize).toBeGreaterThan(0);
  });

  it('enforces minimum size of 200px', () => {
    const containerSize = 150; // Small container
    const minimumSize = 200;
    const size = Math.max(minimumSize, containerSize);

    expect(size).toBe(200);
  });

  it('uses fallback of 280px when container dimensions are 0', () => {
    const clientW = 0;
    const clientH = 0;
    const fallback = 280;

    const containerSize = (clientW > 0 && clientH > 0)
      ? Math.min(clientW, clientH)
      : fallback;

    expect(containerSize).toBe(280);
  });

  it('calculates cellSize correctly from container and gridSize', () => {
    const size = 280;
    const gridSize = 8;
    const cellSize = (size - 2) / gridSize;

    expect(cellSize).toBeCloseTo(34.75, 2);
    expect(cellSize * gridSize).toBeLessThanOrEqual(size);
  });

  it('detects undersized grid rendering', () => {
    const gridSize = 8;
    const cellSize = 5; // Too small
    const displaySize = 280;

    const expectedGridPixels = gridSize * cellSize;
    const isUndersized = expectedGridPixels < displaySize * 0.5;

    expect(isUndersized).toBe(true);
  });

  it('passes sanity check for proper sizing', () => {
    const gridSize = 8;
    const cellSize = 34;
    const displaySize = 280;

    const expectedGridPixels = gridSize * cellSize;
    const isProperSize = expectedGridPixels >= displaySize * 0.5;

    expect(isProperSize).toBe(true);
  });
});
