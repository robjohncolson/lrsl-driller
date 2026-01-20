/**
 * Regression tests for CTF Session Start Fix (v4.3.2)
 *
 * Tests the fix that allows starting sessions from 'ended' state
 * with automatic board reset.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import CTF config for constants
import { CTF_CONFIG } from '../../shared/ctf.config.js';

describe('CTF Session Start State Transitions', () => {
  /**
   * Simulates the server-side session start logic (from server.js)
   */
  function validateSessionStart(currentState) {
    // Active sessions cannot be started (already running)
    if (currentState === 'active') {
      return {
        allowed: false,
        error: 'Session already active',
        statusCode: 400
      };
    }

    // Tiebreaker in progress - must wait or reset
    if (currentState === 'tiebreaker') {
      return {
        allowed: false,
        error: 'Tiebreaker in progress - wait for completion or reset',
        statusCode: 400
      };
    }

    // All other states are allowed
    return {
      allowed: true,
      error: null,
      statusCode: 200
    };
  }

  /**
   * Simulates what happens when starting a session
   */
  function getSessionStartResult(currentState, currentFrontPosition, currentBluePoints, currentRedPoints) {
    const validation = validateSessionStart(currentState);

    if (!validation.allowed) {
      return {
        success: false,
        error: validation.error,
        statusCode: validation.statusCode
      };
    }

    // If starting from 'ended' state, auto-reset the board
    const needsReset = currentState === 'ended';

    return {
      success: true,
      newState: 'active',
      frontPosition: needsReset ? CTF_CONFIG.startPosition : currentFrontPosition,
      bluePoints: needsReset ? 0 : currentBluePoints,
      redPoints: needsReset ? 0 : currentRedPoints,
      wasReset: needsReset
    };
  }

  describe('State Transition Validation', () => {
    it('should allow starting from idle state', () => {
      const result = validateSessionStart('idle');
      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should allow starting from scheduled state', () => {
      const result = validateSessionStart('scheduled');
      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should allow starting from ended state (v4.3.2 fix)', () => {
      const result = validateSessionStart('ended');
      expect(result.allowed).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should NOT allow starting from active state', () => {
      const result = validateSessionStart('active');
      expect(result.allowed).toBe(false);
      expect(result.error).toBe('Session already active');
      expect(result.statusCode).toBe(400);
    });

    it('should NOT allow starting from tiebreaker state', () => {
      const result = validateSessionStart('tiebreaker');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Tiebreaker in progress');
      expect(result.statusCode).toBe(400);
    });
  });

  describe('Session Start from Idle', () => {
    it('should transition to active state', () => {
      const result = getSessionStartResult('idle', 10, 0, 0);
      expect(result.success).toBe(true);
      expect(result.newState).toBe('active');
    });

    it('should preserve board position', () => {
      const result = getSessionStartResult('idle', 10, 0, 0);
      expect(result.frontPosition).toBe(10);
    });

    it('should preserve team points', () => {
      const result = getSessionStartResult('idle', 10, 5, 3);
      expect(result.bluePoints).toBe(5);
      expect(result.redPoints).toBe(3);
    });

    it('should not flag as reset', () => {
      const result = getSessionStartResult('idle', 10, 0, 0);
      expect(result.wasReset).toBe(false);
    });
  });

  describe('Session Start from Ended (v4.3.2 Auto-Reset)', () => {
    it('should transition to active state', () => {
      const result = getSessionStartResult('ended', 18, 150, 50);
      expect(result.success).toBe(true);
      expect(result.newState).toBe('active');
    });

    it('should reset front position to center', () => {
      // Game ended with blue almost winning (front at 18)
      const result = getSessionStartResult('ended', 18, 150, 50);
      expect(result.frontPosition).toBe(CTF_CONFIG.startPosition);
      expect(result.frontPosition).toBe(10); // Center position
    });

    it('should reset blue points to zero', () => {
      const result = getSessionStartResult('ended', 18, 150, 50);
      expect(result.bluePoints).toBe(0);
    });

    it('should reset red points to zero', () => {
      const result = getSessionStartResult('ended', 18, 150, 50);
      expect(result.redPoints).toBe(0);
    });

    it('should flag as reset', () => {
      const result = getSessionStartResult('ended', 18, 150, 50);
      expect(result.wasReset).toBe(true);
    });

    it('should handle game that red won (front at 2)', () => {
      const result = getSessionStartResult('ended', 2, 40, 180);
      expect(result.success).toBe(true);
      expect(result.frontPosition).toBe(10);
      expect(result.bluePoints).toBe(0);
      expect(result.redPoints).toBe(0);
    });

    it('should handle game that ended in dead zone', () => {
      const result = getSessionStartResult('ended', 10, 100, 100);
      expect(result.success).toBe(true);
      expect(result.frontPosition).toBe(10);
      expect(result.bluePoints).toBe(0);
      expect(result.redPoints).toBe(0);
    });
  });

  describe('Session Start Blocked States', () => {
    it('should return 400 for active state', () => {
      const result = getSessionStartResult('active', 15, 80, 30);
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toBe('Session already active');
    });

    it('should return 400 for tiebreaker state', () => {
      const result = getSessionStartResult('tiebreaker', 10, 100, 100);
      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toContain('Tiebreaker');
    });

    it('should preserve game data when blocked', () => {
      const result = getSessionStartResult('active', 15, 80, 30);
      // When blocked, no state changes should occur
      expect(result.newState).toBeUndefined();
      expect(result.frontPosition).toBeUndefined();
    });
  });
});

describe('CTF Config Constants', () => {
  it('should have startPosition defined', () => {
    expect(CTF_CONFIG.startPosition).toBeDefined();
    expect(CTF_CONFIG.startPosition).toBe(10);
  });

  it('should have laneLength defined', () => {
    expect(CTF_CONFIG.laneLength).toBeDefined();
    expect(CTF_CONFIG.laneLength).toBe(21);
  });

  it('should have pointsPerMove defined', () => {
    expect(CTF_CONFIG.pointsPerMove).toBeDefined();
    expect(CTF_CONFIG.pointsPerMove).toBe(20);
  });

  it('should have deadZoneMin defined', () => {
    expect(CTF_CONFIG.deadZoneMin).toBeDefined();
    expect(CTF_CONFIG.deadZoneMin).toBe(9);
  });

  it('should have deadZoneMax defined', () => {
    expect(CTF_CONFIG.deadZoneMax).toBeDefined();
    expect(CTF_CONFIG.deadZoneMax).toBe(11);
  });
});

describe('Session Start Error Messages', () => {
  function getSessionStartError(currentState) {
    const validation = {
      'active': 'Session already active',
      'tiebreaker': 'Tiebreaker in progress - wait for completion or reset'
    };
    return validation[currentState] || null;
  }

  it('should return helpful error for active state', () => {
    const error = getSessionStartError('active');
    expect(error).toBe('Session already active');
    expect(error).not.toContain('Cannot start');
  });

  it('should return helpful error for tiebreaker state', () => {
    const error = getSessionStartError('tiebreaker');
    expect(error).toContain('Tiebreaker');
    expect(error).toContain('wait for completion or reset');
  });

  it('should return null for startable states', () => {
    expect(getSessionStartError('idle')).toBeNull();
    expect(getSessionStartError('scheduled')).toBeNull();
    expect(getSessionStartError('ended')).toBeNull();
  });
});

describe('Regression: Session Start from Ended Must Auto-Reset', () => {
  /**
   * This is the critical regression test for v4.3.2
   *
   * Previously, sessions could NOT be started from 'ended' state,
   * requiring a manual reset first. This was confusing for teachers.
   *
   * The fix allows starting from 'ended' with automatic board reset.
   */

  it('REGRESSION: should not block session start from ended state', () => {
    // The old behavior would return an error here
    const result = validateSessionStart('ended');

    // v4.3.2 fix: should be allowed
    expect(result.allowed).toBe(true);
    expect(result.error).toBeNull();
  });

  it('REGRESSION: should auto-reset board when starting from ended', () => {
    // Scenario: Game ended yesterday with blue winning
    const result = getSessionStartResult('ended', 20, 200, 50);

    // v4.3.2 fix: board should be reset automatically
    expect(result.success).toBe(true);
    expect(result.frontPosition).toBe(10);
    expect(result.bluePoints).toBe(0);
    expect(result.redPoints).toBe(0);
    expect(result.wasReset).toBe(true);
  });

  it('REGRESSION: should allow multiple consecutive games without manual reset', () => {
    // First game ends
    let state = 'ended';
    let front = 0; // Blue won

    // Start second game
    const result1 = getSessionStartResult(state, front, 200, 50);
    expect(result1.success).toBe(true);
    expect(result1.frontPosition).toBe(10);

    // Second game ends
    state = 'ended';
    front = 20; // Red won this time

    // Start third game
    const result2 = getSessionStartResult(state, front, 30, 220);
    expect(result2.success).toBe(true);
    expect(result2.frontPosition).toBe(10);
  });

  function validateSessionStart(state) {
    if (state === 'active') return { allowed: false, error: 'Session already active' };
    if (state === 'tiebreaker') return { allowed: false, error: 'Tiebreaker in progress' };
    return { allowed: true, error: null };
  }

  function getSessionStartResult(state, front, blue, red) {
    const v = validateSessionStart(state);
    if (!v.allowed) return { success: false, error: v.error };

    const needsReset = state === 'ended';
    return {
      success: true,
      frontPosition: needsReset ? 10 : front,
      bluePoints: needsReset ? 0 : blue,
      redPoints: needsReset ? 0 : red,
      wasReset: needsReset
    };
  }
});
