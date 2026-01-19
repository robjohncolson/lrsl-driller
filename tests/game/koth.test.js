/**
 * King of the Hill Tests
 *
 * Tests for KotH rolling window calculation and game logic (v4.3)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GAME_MODE_CONFIG } from '../../shared/game-mode.config.js';

// Import the rolling total calculation logic from server
// (We're testing the algorithm here, which mirrors the server implementation)

const { fullWeightMs, decayStartMs, decayMidMs, windowDurationMs } = GAME_MODE_CONFIG.koth;

/**
 * Calculate rolling total with decay (same logic as server)
 */
function calculateKotHRollingTotal(team, pointEvents, now = Date.now()) {
  let total = 0;

  for (const event of pointEvents.filter(e => e.team === team)) {
    const ageMs = now - new Date(event.earned_at).getTime();

    if (ageMs < 0) continue;

    if (ageMs < fullWeightMs) {
      // 0-3 min: 100% weight
      total += event.points;
    } else if (ageMs < decayMidMs) {
      // 3-5 min: decay from 100% to 50%
      const decayProgress = (ageMs - decayStartMs) / (decayMidMs - decayStartMs);
      total += event.points * (1 - decayProgress * 0.5);
    } else if (ageMs < windowDurationMs) {
      // 5-7 min: decay from 50% to 0%
      const finalDecayProgress = (ageMs - decayMidMs) / (windowDurationMs - decayMidMs);
      total += event.points * 0.5 * (1 - finalDecayProgress);
    }
  }

  return Math.floor(total);
}

/**
 * Determine hill holder
 */
function determineHillHolder(blueTotal, redTotal) {
  if (blueTotal > redTotal) return 'blue';
  if (redTotal > blueTotal) return 'red';
  return null;
}

describe('KotH Rolling Window Calculation', () => {
  const now = Date.now();

  describe('full weight period (0-3 min)', () => {
    it('should give 100% weight to points earned just now', () => {
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(now).toISOString() }
      ];

      expect(calculateKotHRollingTotal('blue', events, now)).toBe(4);
    });

    it('should give 100% weight to points earned 2 minutes ago', () => {
      const twoMinAgo = now - 2 * 60 * 1000;
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(twoMinAgo).toISOString() }
      ];

      expect(calculateKotHRollingTotal('blue', events, now)).toBe(4);
    });

    it('should give 100% weight to points earned 2:59 ago', () => {
      const almostThreeMin = now - (3 * 60 * 1000 - 1000);
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(almostThreeMin).toISOString() }
      ];

      expect(calculateKotHRollingTotal('blue', events, now)).toBe(4);
    });
  });

  describe('first decay period (3-5 min)', () => {
    it('should give ~100% weight to points earned exactly 3 min ago', () => {
      const threeMinAgo = now - 3 * 60 * 1000;
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(threeMinAgo).toISOString() }
      ];

      // At exactly 3 min, decay has just started (still ~100%)
      const total = calculateKotHRollingTotal('blue', events, now);
      expect(total).toBe(4);
    });

    it('should give ~75% weight to points earned 4 min ago', () => {
      const fourMinAgo = now - 4 * 60 * 1000;
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(fourMinAgo).toISOString() }
      ];

      // Midpoint of 3-5 min decay (100% -> 50%), so ~75%
      const total = calculateKotHRollingTotal('blue', events, now);
      expect(total).toBe(3); // floor(4 * 0.75) = 3
    });

    it('should give ~50% weight to points earned exactly 5 min ago', () => {
      const fiveMinAgo = now - 5 * 60 * 1000;
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(fiveMinAgo).toISOString() }
      ];

      // At exactly 5 min, weight is 50%
      const total = calculateKotHRollingTotal('blue', events, now);
      expect(total).toBe(2); // floor(4 * 0.5) = 2
    });
  });

  describe('final decay period (5-7 min)', () => {
    it('should give ~25% weight to points earned 6 min ago', () => {
      const sixMinAgo = now - 6 * 60 * 1000;
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(sixMinAgo).toISOString() }
      ];

      // Midpoint of 5-7 min decay (50% -> 0%), so ~25%
      const total = calculateKotHRollingTotal('blue', events, now);
      expect(total).toBe(1); // floor(4 * 0.25) = 1
    });

    it('should give 0% weight to points earned 7+ min ago', () => {
      const sevenMinAgo = now - 7 * 60 * 1000;
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(sevenMinAgo).toISOString() }
      ];

      expect(calculateKotHRollingTotal('blue', events, now)).toBe(0);
    });

    it('should give 0% weight to points earned 10 min ago', () => {
      const tenMinAgo = now - 10 * 60 * 1000;
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(tenMinAgo).toISOString() }
      ];

      expect(calculateKotHRollingTotal('blue', events, now)).toBe(0);
    });
  });

  describe('team filtering', () => {
    it('should only count points for the specified team', () => {
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(now).toISOString() },
        { team: 'red', points: 3, earned_at: new Date(now).toISOString() }
      ];

      expect(calculateKotHRollingTotal('blue', events, now)).toBe(4);
      expect(calculateKotHRollingTotal('red', events, now)).toBe(3);
    });
  });

  describe('multiple events', () => {
    it('should sum points across multiple events', () => {
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(now).toISOString() },
        { team: 'blue', points: 3, earned_at: new Date(now - 60000).toISOString() },
        { team: 'blue', points: 2, earned_at: new Date(now - 120000).toISOString() }
      ];

      expect(calculateKotHRollingTotal('blue', events, now)).toBe(9);
    });

    it('should apply different decay to events at different ages', () => {
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(now).toISOString() }, // 100% = 4
        { team: 'blue', points: 4, earned_at: new Date(now - 4 * 60 * 1000).toISOString() }, // ~75% = 3
        { team: 'blue', points: 4, earned_at: new Date(now - 6 * 60 * 1000).toISOString() } // ~25% = 1
      ];

      expect(calculateKotHRollingTotal('blue', events, now)).toBe(8); // 4 + 3 + 1
    });
  });

  describe('edge cases', () => {
    it('should handle empty events array', () => {
      expect(calculateKotHRollingTotal('blue', [], now)).toBe(0);
    });

    it('should ignore future events', () => {
      const futureEvent = now + 60000;
      const events = [
        { team: 'blue', points: 4, earned_at: new Date(futureEvent).toISOString() }
      ];

      expect(calculateKotHRollingTotal('blue', events, now)).toBe(0);
    });
  });
});

describe('Hill Control', () => {
  it('should return blue when blue has more points', () => {
    expect(determineHillHolder(10, 5)).toBe('blue');
  });

  it('should return red when red has more points', () => {
    expect(determineHillHolder(5, 10)).toBe('red');
  });

  it('should return null when tied', () => {
    expect(determineHillHolder(10, 10)).toBeNull();
  });

  it('should return null when both are zero', () => {
    expect(determineHillHolder(0, 0)).toBeNull();
  });
});

describe('Tiebreaker Threshold', () => {
  const threshold = GAME_MODE_CONFIG.koth.tiebreakerThresholdSeconds;

  it('should have a 30-second threshold', () => {
    expect(threshold).toBe(30);
  });

  it('should trigger tiebreaker when within threshold', () => {
    const blueBanked = 120;
    const redBanked = 110;
    const diff = Math.abs(blueBanked - redBanked);

    expect(diff <= threshold).toBe(true);
  });

  it('should not trigger tiebreaker when outside threshold', () => {
    const blueBanked = 120;
    const redBanked = 80;
    const diff = Math.abs(blueBanked - redBanked);

    expect(diff <= threshold).toBe(false);
  });
});

describe('Star Points', () => {
  const starPoints = GAME_MODE_CONFIG.koth.starPoints;

  it('should match CTF star point values', () => {
    expect(starPoints.gold).toBe(4);
    expect(starPoints.silver).toBe(3);
    expect(starPoints.bronze).toBe(2);
    expect(starPoints.tin).toBe(1);
  });
});
