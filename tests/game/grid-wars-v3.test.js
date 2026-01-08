/**
 * Grid Wars v3 Tests
 * Tests for contestation, decay, resource nodes, and surge features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GridWarsState, GRID_WARS_CONFIG } from '../../platform/game/grid-state.js';

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
  const mockGame = { game_id: 'game-123', status: 'active', map_size: 20 };
  const mockStateData = {
    game: mockGame,
    territories: [],
    players: [{
      username: 'alice',
      action_points: 50,
      territories_count: 0,
      health: 100,
      active_buffs: {},
      last_answer_at: null
    }],
    classGoal: { current: 0, target: 200 },
    surge: null,
    ...extraData
  };

  // Mock config fetch
  mockFetch.mockResolvedValueOnce(mockResponse({
    claimCost: 10,
    nodeClaimCost: 15,
    surgeCost: 5,
    reinforceCost: 5,
    maxCellStrength: 3
  }));
  // Mock active game fetch
  mockFetch.mockResolvedValueOnce(mockResponse(mockGame));
  // Mock state fetch
  mockFetch.mockResolvedValueOnce(mockResponse(mockStateData));

  await state.init();
  mockFetch.mockClear();
}

describe('Grid Wars v3 - Config', () => {
  it('has node claim cost (15 pts)', () => {
    expect(GRID_WARS_CONFIG.nodeClaimCost).toBe(15);
  });

  it('has surge cost (5 pts)', () => {
    expect(GRID_WARS_CONFIG.surgeCost).toBe(5);
  });

  it('has reinforce cost (5 pts)', () => {
    expect(GRID_WARS_CONFIG.reinforceCost).toBe(5);
  });

  it('has contestation timing settings', () => {
    expect(GRID_WARS_CONFIG.contestationStartTime).toBe(30);
    expect(GRID_WARS_CONFIG.contestationFlipTime).toBe(90);
  });

  it('has max cell strength (3)', () => {
    expect(GRID_WARS_CONFIG.maxCellStrength).toBe(3);
  });

  it('has buff duration settings', () => {
    expect(GRID_WARS_CONFIG.beaconDuration).toBe(300);
    expect(GRID_WARS_CONFIG.anchorDuration).toBe(180);
    expect(GRID_WARS_CONFIG.amplifierCharges).toBe(5);
    expect(GRID_WARS_CONFIG.amplifierBonus).toBe(3);
  });

  it('has surge duration (90s)', () => {
    expect(GRID_WARS_CONFIG.surgeDuration).toBe(90);
  });
});

describe('Grid Wars v3 - Territory Strength', () => {
  let state;

  beforeEach(async () => {
    mockFetch.mockClear();
    state = new GridWarsState({ serverUrl: 'http://test-server' });
    state.setUser('alice');
  });

  it('territories have strength field in state', async () => {
    await initStateWithGame(state, {
      territories: [
        { x: 5, y: 5, owner: 'alice', strength: 3 },
        { x: 6, y: 5, owner: 'alice', strength: 1 }
      ]
    });

    const t1 = state.territories.get('5,5');
    const t2 = state.territories.get('6,5');

    expect(t1.strength).toBe(3);
    expect(t2.strength).toBe(1);
  });

  it('handles cell_strength_changed WebSocket message', async () => {
    await initStateWithGame(state, {
      territories: [{ x: 5, y: 5, owner: 'alice', strength: 3 }]
    });

    state.handleWebSocketMessage({
      type: 'cell_strength_changed',
      gameId: 'game-123',
      x: 5,
      y: 5,
      strength: 2
    });

    const territory = state.territories.get('5,5');
    expect(territory.strength).toBe(2);
  });

  it('handles cell_decayed WebSocket message', async () => {
    await initStateWithGame(state, {
      territories: [{ x: 5, y: 5, owner: 'alice', strength: 1 }]
    });

    state.handleWebSocketMessage({
      type: 'cell_decayed',
      gameId: 'game-123',
      x: 5,
      y: 5,
      previousOwner: 'alice'
    });

    expect(state.territories.has('5,5')).toBe(false);
  });

  it('getRenderState includes strength', async () => {
    await initStateWithGame(state, {
      territories: [{ x: 5, y: 5, owner: 'alice', strength: 2 }]
    });

    const renderState = state.getRenderState();
    expect(renderState.territories[0].strength).toBe(2);
  });
});

describe('Grid Wars v3 - Contestation', () => {
  let state;

  beforeEach(async () => {
    mockFetch.mockClear();
    state = new GridWarsState({ serverUrl: 'http://test-server' });
    state.setUser('alice');
  });

  it('territories have contested_by field in state', async () => {
    await initStateWithGame(state, {
      territories: [
        { x: 5, y: 5, owner: 'alice', strength: 3, contested_by: 'bob' }
      ]
    });

    const territory = state.territories.get('5,5');
    expect(territory.contested_by).toBe('bob');
  });

  it('handles contestation_started WebSocket message', async () => {
    const onContestationAlert = vi.fn();
    await initStateWithGame(state, {
      territories: [{ x: 5, y: 5, owner: 'alice', strength: 3 }]
    });
    state.onContestationAlert = onContestationAlert;

    state.handleWebSocketMessage({
      type: 'contestation_started',
      gameId: 'game-123',
      x: 5,
      y: 5,
      contester: 'bob'
    });

    const territory = state.territories.get('5,5');
    expect(territory.contested_by).toBe('bob');
    expect(onContestationAlert).toHaveBeenCalledWith({
      x: 5,
      y: 5,
      contester: 'bob'
    });
  });

  it('handles contestation_cleared WebSocket message', async () => {
    await initStateWithGame(state, {
      territories: [{ x: 5, y: 5, owner: 'alice', strength: 3, contested_by: 'bob' }]
    });

    state.handleWebSocketMessage({
      type: 'contestation_cleared',
      gameId: 'game-123',
      x: 5,
      y: 5
    });

    const territory = state.territories.get('5,5');
    expect(territory.contested_by).toBeNull();
  });

  it('handles cell_flipped_neutral WebSocket message', async () => {
    await initStateWithGame(state, {
      territories: [{ x: 5, y: 5, owner: 'alice', strength: 3, contested_by: 'bob' }]
    });

    state.handleWebSocketMessage({
      type: 'cell_flipped_neutral',
      gameId: 'game-123',
      x: 5,
      y: 5,
      previousOwner: 'alice'
    });

    expect(state.territories.has('5,5')).toBe(false);
  });

  it('getMyContestedCells returns cells being contested', async () => {
    await initStateWithGame(state, {
      territories: [
        { x: 5, y: 5, owner: 'alice', strength: 3, contested_by: 'bob' },
        { x: 6, y: 5, owner: 'alice', strength: 3, contested_by: null },
        { x: 7, y: 5, owner: 'alice', strength: 3, contested_by: 'charlie' }
      ]
    });

    const contested = state.getMyContestedCells();
    expect(contested).toHaveLength(2);
    expect(contested.some(c => c.x === 5 && c.y === 5)).toBe(true);
    expect(contested.some(c => c.x === 7 && c.y === 5)).toBe(true);
  });

  it('getRenderState includes contested_by', async () => {
    await initStateWithGame(state, {
      territories: [{ x: 5, y: 5, owner: 'alice', strength: 3, contested_by: 'bob' }]
    });

    const renderState = state.getRenderState();
    expect(renderState.territories[0].contested_by).toBe('bob');
  });
});

describe('Grid Wars v3 - Reinforce Action', () => {
  let state;

  beforeEach(async () => {
    mockFetch.mockClear();
    state = new GridWarsState({ serverUrl: 'http://test-server' });
    state.setUser('alice');
  });

  it('reinforceCell calls API with correct parameters', async () => {
    await initStateWithGame(state, {
      territories: [{ x: 5, y: 5, owner: 'alice', strength: 2, contested_by: 'bob' }]
    });

    mockFetch.mockResolvedValueOnce(mockResponse({
      success: true,
      action: 'reinforce',
      x: 5,
      y: 5,
      cost: 5,
      newPoints: 45
    }));

    await state.reinforceCell(5, 5);

    expect(mockFetch).toHaveBeenCalledWith(
      'http://test-server/api/grid-wars/action',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"action":"reinforce"')
      })
    );
  });

  it('reinforceCell clears contestation locally', async () => {
    await initStateWithGame(state, {
      territories: [{ x: 5, y: 5, owner: 'alice', strength: 2, contested_by: 'bob' }]
    });

    mockFetch.mockResolvedValueOnce(mockResponse({
      success: true,
      action: 'reinforce',
      x: 5,
      y: 5,
      cost: 5,
      newPoints: 45
    }));

    await state.reinforceCell(5, 5);

    const territory = state.territories.get('5,5');
    expect(territory.contested_by).toBeNull();
    expect(territory.strength).toBe(GRID_WARS_CONFIG.maxCellStrength);
  });

  it('handles territory_reinforced WebSocket message', async () => {
    await initStateWithGame(state, {
      territories: [{ x: 5, y: 5, owner: 'alice', strength: 1, contested_by: 'bob' }]
    });

    state.handleWebSocketMessage({
      type: 'territory_reinforced',
      gameId: 'game-123',
      username: 'alice',
      x: 5,
      y: 5
    });

    const territory = state.territories.get('5,5');
    expect(territory.contested_by).toBeNull();
    expect(territory.strength).toBe(GRID_WARS_CONFIG.maxCellStrength);
  });
});

describe('Grid Wars v3 - Resource Nodes', () => {
  let state;

  beforeEach(async () => {
    mockFetch.mockClear();
    state = new GridWarsState({ serverUrl: 'http://test-server' });
    state.setUser('alice');
  });

  it('territories have node_type field in state', async () => {
    await initStateWithGame(state, {
      territories: [
        { x: 10, y: 10, owner: null, node_type: 'amplifier', strength: 3 },
        { x: 4, y: 4, owner: null, node_type: 'beacon', strength: 3 },
        { x: 15, y: 15, owner: null, node_type: 'anchor', strength: 3 }
      ]
    });

    expect(state.territories.get('10,10').node_type).toBe('amplifier');
    expect(state.territories.get('4,4').node_type).toBe('beacon');
    expect(state.territories.get('15,15').node_type).toBe('anchor');
  });

  it('handles buff_acquired WebSocket message for amplifier', async () => {
    const onBuffAcquired = vi.fn();
    await initStateWithGame(state);
    state.onBuffAcquired = onBuffAcquired;

    state.handleWebSocketMessage({
      type: 'buff_acquired',
      gameId: 'game-123',
      username: 'alice',
      buff: { type: 'amplifier', charges: 5 }
    });

    expect(onBuffAcquired).toHaveBeenCalledWith({ type: 'amplifier', charges: 5 });

    const buffs = state.getActiveBuffs();
    expect(buffs.amplifier).toBeDefined();
    expect(buffs.amplifier.remaining).toBe(5);
  });

  it('handles buff_acquired WebSocket message for beacon', async () => {
    await initStateWithGame(state);

    state.handleWebSocketMessage({
      type: 'buff_acquired',
      gameId: 'game-123',
      username: 'alice',
      buff: { type: 'beacon', duration: 300 }
    });

    const buffs = state.getActiveBuffs();
    expect(buffs.beacon).toBeDefined();
    expect(buffs.beacon.expires).toBeDefined();
  });

  it('handles buff_acquired WebSocket message for anchor', async () => {
    await initStateWithGame(state);

    state.handleWebSocketMessage({
      type: 'buff_acquired',
      gameId: 'game-123',
      username: 'alice',
      buff: { type: 'anchor', duration: 180 }
    });

    const buffs = state.getActiveBuffs();
    expect(buffs.anchor).toBeDefined();
    expect(buffs.anchor.expires).toBeDefined();
  });

  it('getActiveBuffs returns empty object for no buffs', async () => {
    await initStateWithGame(state);
    const buffs = state.getActiveBuffs();
    expect(buffs).toEqual({});
  });

  it('getRenderState includes node_type', async () => {
    await initStateWithGame(state, {
      territories: [{ x: 10, y: 10, owner: null, node_type: 'amplifier', strength: 3 }]
    });

    const renderState = state.getRenderState();
    expect(renderState.territories[0].node_type).toBe('amplifier');
  });

  it('territory_claimed includes nodeType for claimed nodes', async () => {
    await initStateWithGame(state, {
      territories: [{ x: 10, y: 10, owner: null, node_type: 'amplifier', strength: 3 }]
    });

    state.handleWebSocketMessage({
      type: 'territory_claimed',
      gameId: 'game-123',
      username: 'alice',
      x: 10,
      y: 10,
      nodeType: 'amplifier'
    });

    const territory = state.territories.get('10,10');
    expect(territory.owner).toBe('alice');
    expect(territory.node_type).toBe('amplifier');
  });
});

describe('Grid Wars v3 - Surge Event', () => {
  let state;

  beforeEach(async () => {
    mockFetch.mockClear();
    state = new GridWarsState({ serverUrl: 'http://test-server' });
    state.setUser('alice');
  });

  it('state tracks surge cell', async () => {
    await initStateWithGame(state, {
      surge: { x: 8, y: 8, expiresIn: 60 }
    });

    expect(state.surge).toEqual({ x: 8, y: 8, expiresIn: 60 });
  });

  it('getSurge returns current surge', async () => {
    await initStateWithGame(state, {
      surge: { x: 8, y: 8, expiresIn: 60 }
    });

    const surge = state.getSurge();
    expect(surge).toEqual({ x: 8, y: 8, expiresIn: 60 });
  });

  it('handles surge_activated WebSocket message', async () => {
    const onSurgeActivated = vi.fn();
    await initStateWithGame(state);
    state.onSurgeActivated = onSurgeActivated;

    state.handleWebSocketMessage({
      type: 'surge_activated',
      gameId: 'game-123',
      x: 12,
      y: 12,
      cost: 5,
      expiresIn: 90
    });

    expect(state.surge).toEqual({ x: 12, y: 12, expiresIn: 90 });
    expect(onSurgeActivated).toHaveBeenCalledWith({ x: 12, y: 12, expiresIn: 90 });
  });

  it('handles surge_expired WebSocket message', async () => {
    await initStateWithGame(state, {
      surge: { x: 8, y: 8, expiresIn: 60 }
    });

    state.handleWebSocketMessage({
      type: 'surge_expired',
      gameId: 'game-123',
      x: 8,
      y: 8
    });

    expect(state.surge).toBeNull();
  });

  it('handles surge_claimed WebSocket message', async () => {
    await initStateWithGame(state, {
      surge: { x: 8, y: 8, expiresIn: 60 }
    });

    state.handleWebSocketMessage({
      type: 'surge_claimed',
      gameId: 'game-123',
      x: 8,
      y: 8,
      claimedBy: 'bob'
    });

    expect(state.surge).toBeNull();
  });

  it('getRenderState includes surge', async () => {
    await initStateWithGame(state, {
      surge: { x: 8, y: 8, expiresIn: 60 }
    });

    const renderState = state.getRenderState();
    expect(renderState.surge).toEqual({ x: 8, y: 8, expiresIn: 60 });
  });
});

describe('Grid Wars v3 - Active Drilling', () => {
  let state;

  beforeEach(async () => {
    mockFetch.mockClear();
    state = new GridWarsState({ serverUrl: 'http://test-server' });
    state.setUser('alice');
  });

  it('players have last_answer_at field', async () => {
    const timestamp = new Date().toISOString();
    await initStateWithGame(state, {
      players: [{
        username: 'alice',
        action_points: 50,
        territories_count: 0,
        health: 100,
        active_buffs: {},
        last_answer_at: timestamp
      }]
    });

    const player = state.players.get('alice');
    expect(player.last_answer_at).toBe(timestamp);
  });

  it('points_earned updates last_answer_at', async () => {
    await initStateWithGame(state);

    const beforeTime = Date.now();

    state.handleWebSocketMessage({
      type: 'points_earned',
      gameId: 'game-123',
      username: 'alice',
      points: 4,
      total: 54,
      starType: 'gold'
    });

    const player = state.players.get('alice');
    const answerTime = new Date(player.last_answer_at).getTime();

    expect(answerTime).toBeGreaterThanOrEqual(beforeTime);
  });

  it('points_earned includes amplifierBonus in callback', async () => {
    const onPointsEarned = vi.fn();
    await initStateWithGame(state);
    state.onPointsEarned = onPointsEarned;

    state.handleWebSocketMessage({
      type: 'points_earned',
      gameId: 'game-123',
      username: 'alice',
      points: 7,
      basePoints: 4,
      amplifierBonus: 3,
      total: 57,
      starType: 'gold'
    });

    expect(onPointsEarned).toHaveBeenCalledWith(expect.objectContaining({
      amplifierBonus: 3
    }));
  });
});

describe('Grid Wars v3 API - Reinforce', () => {
  it('POST /api/grid-wars/action with reinforce clears contestation', async () => {
    const successResponse = {
      success: true,
      action: 'reinforce',
      x: 5,
      y: 5,
      cost: 5,
      newPoints: 45
    };

    mockFetch.mockResolvedValueOnce(mockResponse(successResponse));

    const response = await fetch('http://localhost:3000/api/grid-wars/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'game-123',
        username: 'alice',
        action: 'reinforce',
        x: 5,
        y: 5
      })
    });
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.action).toBe('reinforce');
    expect(data.cost).toBe(5);
  });

  it('reinforce rejects if not owned by user', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(
      { error: 'You do not own this territory' },
      400
    ));

    const response = await fetch('http://localhost:3000/api/grid-wars/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'game-123',
        username: 'alice',
        action: 'reinforce',
        x: 5,
        y: 5
      })
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('do not own');
  });

  it('reinforce rejects if not contested', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(
      { error: 'This territory is not being contested' },
      400
    ));

    const response = await fetch('http://localhost:3000/api/grid-wars/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'game-123',
        username: 'alice',
        action: 'reinforce',
        x: 5,
        y: 5
      })
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('not being contested');
  });
});

describe('Grid Wars v3 API - Surge', () => {
  it('POST /api/grid-wars/surge activates surge cell', async () => {
    const successResponse = {
      success: true,
      surge: {
        x: 8,
        y: 8,
        cost: 5,
        expiresIn: 90
      }
    };

    mockFetch.mockResolvedValueOnce(mockResponse(successResponse));

    const response = await fetch('http://localhost:3000/api/grid-wars/surge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'game-123',
        password: 'teacher-password'
      })
    });
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
    expect(data.surge.cost).toBe(5);
    expect(data.surge.expiresIn).toBe(90);
  });

  it('surge rejects without teacher password', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(
      { error: 'Invalid teacher password' },
      403
    ));

    const response = await fetch('http://localhost:3000/api/grid-wars/surge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'game-123',
        password: 'wrong-password'
      })
    });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Invalid teacher password');
  });

  it('surge rejects if already active', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(
      { error: 'A surge is already active' },
      400
    ));

    const response = await fetch('http://localhost:3000/api/grid-wars/surge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'game-123',
        password: 'teacher-password'
      })
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('already active');
  });
});

describe('Grid Wars v3 API - Node Claiming', () => {
  it('claiming resource node costs 15 points', async () => {
    const successResponse = {
      success: true,
      action: 'claim',
      x: 10,
      y: 10,
      cost: 15,
      newPoints: 35,
      buffApplied: { type: 'amplifier', charges: 5 }
    };

    mockFetch.mockResolvedValueOnce(mockResponse(successResponse));

    const response = await fetch('http://localhost:3000/api/grid-wars/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'game-123',
        username: 'alice',
        action: 'claim',
        x: 10,
        y: 10
      })
    });
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.cost).toBe(15);
    expect(data.buffApplied).toBeDefined();
    expect(data.buffApplied.type).toBe('amplifier');
  });

  it('claiming surge cell costs 5 points', async () => {
    const successResponse = {
      success: true,
      action: 'claim',
      x: 8,
      y: 8,
      cost: 5,
      newPoints: 45,
      wasSurge: true
    };

    mockFetch.mockResolvedValueOnce(mockResponse(successResponse));

    const response = await fetch('http://localhost:3000/api/grid-wars/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'game-123',
        username: 'alice',
        action: 'claim',
        x: 8,
        y: 8
      })
    });
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.cost).toBe(5);
    expect(data.wasSurge).toBe(true);
  });
});

describe('Grid Wars v3 API - Points with Amplifier', () => {
  it('points/add includes amplifier bonus when active', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      success: true,
      pointsAdded: 7,
      breakdown: {
        base: 4,
        contiguityBonus: 0,
        amplifierBonus: 3,
        cluster: 0
      },
      newTotal: 57
    }));

    const response = await fetch('http://localhost:3000/api/grid-wars/points/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'game-123',
        username: 'alice',
        starType: 'gold'
      })
    });
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.pointsAdded).toBe(7);
    expect(data.breakdown.amplifierBonus).toBe(3);
  });
});

describe('Grid Wars v3 API - Class Goal', () => {
  it('POST /api/grid-wars/class-goal updates target', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      success: true,
      updates: { class_goal_target: 300 }
    }));

    const response = await fetch('http://localhost:3000/api/grid-wars/class-goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'game-123',
        password: 'teacher-password',
        target: 300
      })
    });
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
  });

  it('POST /api/grid-wars/class-goal resets progress', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({
      success: true,
      updates: { class_goal_current: 0 }
    }));

    const response = await fetch('http://localhost:3000/api/grid-wars/class-goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId: 'game-123',
        password: 'teacher-password',
        reset: true
      })
    });
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
  });
});
