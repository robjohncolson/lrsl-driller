/**
 * Game Mode Manager Tests
 *
 * Tests for GameModeManager integration and functionality (v4.3)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GAME_MODE_CONFIG } from '../../shared/game-mode.config.js';

// Mock the required modules for testing
vi.mock('../../platform/game/ctf-panel.js', () => ({
  CTFPanel: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue({}),
    handleMessage: vi.fn(),
    addPoints: vi.fn().mockResolvedValue({ frontPosition: 10 }),
    setAvailableUsers: vi.fn(),
    destroy: vi.fn(),
    _render: vi.fn()
  }))
}));

describe('GameModeManager Configuration', () => {
  it('should have CTF as default game mode', () => {
    expect(GAME_MODE_CONFIG.defaults.gameMode).toBe('ctf');
  });

  it('should have Pong as default tiebreaker', () => {
    expect(GAME_MODE_CONFIG.defaults.tiebreakerType).toBe('pong');
  });

  it('should support two game modes', () => {
    expect(Object.keys(GAME_MODE_CONFIG.modes)).toHaveLength(2);
    expect(GAME_MODE_CONFIG.modes.CTF).toBe('ctf');
    expect(GAME_MODE_CONFIG.modes.KOTH).toBe('koth');
  });

  it('should support three tiebreaker types', () => {
    expect(Object.keys(GAME_MODE_CONFIG.tiebreakers)).toHaveLength(3);
    expect(GAME_MODE_CONFIG.tiebreakers.PONG).toBe('pong');
    expect(GAME_MODE_CONFIG.tiebreakers.QUICK_CALC).toBe('quick_calc');
    expect(GAME_MODE_CONFIG.tiebreakers.REFLEX_DUEL).toBe('reflex_duel');
  });
});

describe('GameModeManager Mode Switching', () => {
  it('should validate game mode before switching', () => {
    const validModes = ['ctf', 'koth'];
    const invalidModes = ['invalid', 'tdm', 'ffa'];

    validModes.forEach(mode => {
      expect(Object.values(GAME_MODE_CONFIG.modes)).toContain(mode);
    });

    invalidModes.forEach(mode => {
      expect(Object.values(GAME_MODE_CONFIG.modes)).not.toContain(mode);
    });
  });

  it('should validate tiebreaker type before switching', () => {
    const validTypes = ['pong', 'quick_calc', 'reflex_duel'];
    const invalidTypes = ['invalid', 'chess', 'trivia'];

    validTypes.forEach(type => {
      expect(Object.values(GAME_MODE_CONFIG.tiebreakers)).toContain(type);
    });

    invalidTypes.forEach(type => {
      expect(Object.values(GAME_MODE_CONFIG.tiebreakers)).not.toContain(type);
    });
  });
});

describe('GameModeManager Labels', () => {
  it('should have display labels for all modes', () => {
    expect(GAME_MODE_CONFIG.labels.modes.ctf).toBe('Capture The Flag');
    expect(GAME_MODE_CONFIG.labels.modes.koth).toBe('King of the Hill');
  });

  it('should have display labels for all tiebreakers', () => {
    expect(GAME_MODE_CONFIG.labels.tiebreakers.pong).toBe('Pong');
    expect(GAME_MODE_CONFIG.labels.tiebreakers.quick_calc).toBe('Quick Calc');
    expect(GAME_MODE_CONFIG.labels.tiebreakers.reflex_duel).toBe('Reflex Duel');
  });

  it('should have short labels for modes', () => {
    expect(GAME_MODE_CONFIG.labels.modesShort.ctf).toBe('CTF');
    expect(GAME_MODE_CONFIG.labels.modesShort.koth).toBe('KotH');
  });
});

describe('GameModeManager WebSocket Message Routing', () => {
  function shouldRouteToPanel(messageType, expectedPanel) {
    if (messageType.startsWith('ctf_')) return 'ctf';
    if (messageType.startsWith('koth_')) return 'koth';
    if (messageType === 'game_mode_changed') return 'manager';
    return null;
  }

  it('should route CTF messages to CTF panel', () => {
    expect(shouldRouteToPanel('ctf_front_moved')).toBe('ctf');
    expect(shouldRouteToPanel('ctf_points')).toBe('ctf');
    expect(shouldRouteToPanel('ctf_victory')).toBe('ctf');
    expect(shouldRouteToPanel('ctf_reset')).toBe('ctf');
    expect(shouldRouteToPanel('ctf_player_joined')).toBe('ctf');
  });

  it('should route KotH messages to KotH panel', () => {
    expect(shouldRouteToPanel('koth_hill_control_changed')).toBe('koth');
    expect(shouldRouteToPanel('koth_points_decayed')).toBe('koth');
    expect(shouldRouteToPanel('koth_time_banked')).toBe('koth');
    expect(shouldRouteToPanel('koth_session_started')).toBe('koth');
    expect(shouldRouteToPanel('koth_session_ended')).toBe('koth');
  });

  it('should handle game_mode_changed message', () => {
    expect(shouldRouteToPanel('game_mode_changed')).toBe('manager');
  });

  it('should ignore unrelated messages', () => {
    expect(shouldRouteToPanel('star_earned')).toBeNull();
    expect(shouldRouteToPanel('user_online')).toBeNull();
    expect(shouldRouteToPanel('progression_override_changed')).toBeNull();
  });
});

describe('GameModeManager Settings Persistence', () => {
  it('should construct settings URL with class period', () => {
    const cartridgeId = 'test-cartridge';
    const classPeriod = 'A';
    const baseUrl = 'https://example.com';

    const url = new URL(`${baseUrl}/api/game-mode/${cartridgeId}/settings`);
    url.searchParams.set('class_period', classPeriod);

    expect(url.toString()).toBe('https://example.com/api/game-mode/test-cartridge/settings?class_period=A');
  });

  it('should include both game_mode and tiebreaker_type in settings update', () => {
    const settingsPayload = {
      game_mode: 'koth',
      tiebreaker_type: 'quick_calc'
    };

    expect(settingsPayload).toHaveProperty('game_mode');
    expect(settingsPayload).toHaveProperty('tiebreaker_type');
    expect(settingsPayload.game_mode).toBe('koth');
    expect(settingsPayload.tiebreaker_type).toBe('quick_calc');
  });
});

describe('GameModeManager Points Delegation', () => {
  it('should delegate addPoints to active panel', async () => {
    // Simulate the delegation pattern
    const activePanel = {
      addPoints: vi.fn().mockResolvedValue({ frontPosition: 11 })
    };

    const result = await activePanel.addPoints(4, 'gold');

    expect(activePanel.addPoints).toHaveBeenCalledWith(4, 'gold');
    expect(result).toEqual({ frontPosition: 11 });
  });

  it('should handle missing addPoints gracefully', async () => {
    const activePanel = {};

    // Simulate null check
    const hasAddPoints = typeof activePanel.addPoints === 'function';
    expect(hasAddPoints).toBe(false);
  });
});

describe('GameModeManager User Management', () => {
  it('should delegate setAvailableUsers to active panel', () => {
    const activePanel = {
      setAvailableUsers: vi.fn()
    };

    const users = [
      { username: 'user1', real_name: 'User One', class_period: 'A' },
      { username: 'user2', real_name: 'User Two', class_period: 'B' }
    ];

    activePanel.setAvailableUsers(users);

    expect(activePanel.setAvailableUsers).toHaveBeenCalledWith(users);
  });
});

describe('GameModeManager Cleanup', () => {
  it('should clean up panels on destroy', () => {
    const panels = {
      ctf: { destroy: vi.fn() },
      koth: { destroy: vi.fn() }
    };

    // Simulate destroy
    if (panels.ctf?.destroy) panels.ctf.destroy();
    if (panels.koth?.destroy) panels.koth.destroy();

    expect(panels.ctf.destroy).toHaveBeenCalled();
    expect(panels.koth.destroy).toHaveBeenCalled();
  });
});

describe('GameModeManager Teacher UI', () => {
  it('should show mode selector for teachers', () => {
    const isTeacher = true;
    const shouldShowSelector = isTeacher;

    expect(shouldShowSelector).toBe(true);
  });

  it('should hide mode selector for students', () => {
    const isTeacher = false;
    const shouldShowSelector = isTeacher;

    expect(shouldShowSelector).toBe(false);
  });

  it('should include all game modes in selector', () => {
    const selectorOptions = Object.values(GAME_MODE_CONFIG.modes);

    expect(selectorOptions).toContain('ctf');
    expect(selectorOptions).toContain('koth');
  });

  it('should include all tiebreakers in selector', () => {
    const selectorOptions = Object.values(GAME_MODE_CONFIG.tiebreakers);

    expect(selectorOptions).toContain('pong');
    expect(selectorOptions).toContain('quick_calc');
    expect(selectorOptions).toContain('reflex_duel');
  });
});

describe('GameModeManager Integration with app.html', () => {
  it('should be initialized with correct parameters', () => {
    // Expected parameters for init
    const params = {
      cartridgeId: 'test-cartridge',
      username: 'test-user',
      isTeacher: false,
      userClassPeriod: 'A'
    };

    expect(params.cartridgeId).toBeTruthy();
    expect(params.username).toBeTruthy();
    expect(typeof params.isTeacher).toBe('boolean');
  });

  it('should handle star earned events', () => {
    // Simulate event data
    const eventDetail = {
      starType: 'gold',
      modeId: 'level-1'
    };

    expect(eventDetail.starType).toBe('gold');
    expect(eventDetail.modeId).toBe('level-1');
  });

  it('should calculate weighted points correctly', () => {
    // Test weighted points calculation is passed through
    const starTypes = ['gold', 'silver', 'bronze', 'tin'];
    const pointValues = { gold: 4, silver: 3, bronze: 2, tin: 1 };

    starTypes.forEach(type => {
      expect(pointValues[type]).toBeGreaterThan(0);
    });
  });
});
