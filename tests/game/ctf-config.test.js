/**
 * CTF Config Tests
 * Tests for the CTF configuration constants
 */

import { describe, it, expect } from 'vitest';
import { CTF_CONFIG } from '../../shared/ctf.config.js';

describe('CTF Config', () => {
  describe('Lane Configuration', () => {
    it('should have 21 positions (0-20)', () => {
      expect(CTF_CONFIG.laneLength).toBe(21);
    });

    it('should start at center position 10', () => {
      expect(CTF_CONFIG.startPosition).toBe(10);
    });

    it('should have blue flag at position 0', () => {
      expect(CTF_CONFIG.blueFlag).toBe(0);
    });

    it('should have red flag at position 20', () => {
      expect(CTF_CONFIG.redFlag).toBe(20);
    });

    it('should have start position in the middle of the lane', () => {
      const middle = Math.floor(CTF_CONFIG.laneLength / 2);
      expect(CTF_CONFIG.startPosition).toBe(middle);
    });

    it('should have start position equidistant from both flags', () => {
      const distanceToBlue = CTF_CONFIG.startPosition - CTF_CONFIG.blueFlag;
      const distanceToRed = CTF_CONFIG.redFlag - CTF_CONFIG.startPosition;
      expect(distanceToBlue).toBe(distanceToRed);
    });
  });

  describe('Points Configuration', () => {
    it('should require 20 points to move front line 1 position', () => {
      expect(CTF_CONFIG.pointsPerMove).toBe(20);
    });

    it('should have star point values', () => {
      expect(CTF_CONFIG.starPoints).toBeDefined();
      expect(CTF_CONFIG.starPoints.gold).toBe(4);
      expect(CTF_CONFIG.starPoints.silver).toBe(3);
      expect(CTF_CONFIG.starPoints.bronze).toBe(2);
      expect(CTF_CONFIG.starPoints.tin).toBe(1);
    });

    it('should have gold worth more than silver', () => {
      expect(CTF_CONFIG.starPoints.gold).toBeGreaterThan(CTF_CONFIG.starPoints.silver);
    });

    it('should have silver worth more than bronze', () => {
      expect(CTF_CONFIG.starPoints.silver).toBeGreaterThan(CTF_CONFIG.starPoints.bronze);
    });

    it('should have bronze worth more than tin', () => {
      expect(CTF_CONFIG.starPoints.bronze).toBeGreaterThan(CTF_CONFIG.starPoints.tin);
    });

    it('should require 5 gold stars to move front line 1 position', () => {
      const goldsNeeded = CTF_CONFIG.pointsPerMove / CTF_CONFIG.starPoints.gold;
      expect(goldsNeeded).toBe(5);
    });
  });

  describe('Canvas Rendering Configuration', () => {
    it('should have cell dimensions', () => {
      expect(CTF_CONFIG.cellWidth).toBeGreaterThan(0);
      expect(CTF_CONFIG.cellHeight).toBeGreaterThan(0);
    });

    it('should have padding', () => {
      expect(CTF_CONFIG.padding).toBeGreaterThan(0);
    });
  });

  describe('Colors Configuration', () => {
    it('should have team colors', () => {
      expect(CTF_CONFIG.colors.blue).toBeDefined();
      expect(CTF_CONFIG.colors.red).toBeDefined();
    });

    it('should have dark variants for progress bars', () => {
      expect(CTF_CONFIG.colors.blueDark).toBeDefined();
      expect(CTF_CONFIG.colors.redDark).toBeDefined();
    });

    it('should have UI colors', () => {
      expect(CTF_CONFIG.colors.neutral).toBeDefined();
      expect(CTF_CONFIG.colors.frontLine).toBeDefined();
      expect(CTF_CONFIG.colors.background).toBeDefined();
      expect(CTF_CONFIG.colors.text).toBeDefined();
    });

    it('should have valid hex color format', () => {
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      Object.values(CTF_CONFIG.colors).forEach(color => {
        expect(color).toMatch(hexColorRegex);
      });
    });
  });

  describe('Game Balance', () => {
    it('should allow a full game to complete (enough positions to reach either flag)', () => {
      // From center, both flags should be reachable
      expect(CTF_CONFIG.startPosition).toBeGreaterThan(CTF_CONFIG.blueFlag);
      expect(CTF_CONFIG.startPosition).toBeLessThan(CTF_CONFIG.redFlag);
    });

    it('should have reasonable point requirements (not too easy, not too hard)', () => {
      // With 20 points per move and 10 moves to win, need 200 total team points
      const movesToWin = CTF_CONFIG.startPosition - CTF_CONFIG.blueFlag;
      const totalPointsToWin = movesToWin * CTF_CONFIG.pointsPerMove;
      expect(totalPointsToWin).toBe(200);
    });

    it('should have star values that allow meaningful contribution', () => {
      // Even tin stars should contribute progress
      const tinProgress = CTF_CONFIG.starPoints.tin / CTF_CONFIG.pointsPerMove;
      expect(tinProgress).toBeGreaterThan(0);
      expect(tinProgress).toBe(0.05); // 5% progress per tin
    });
  });

  // v4.2 Session Configuration Tests
  describe('Session Configuration (v4.2)', () => {
    it('should have session check interval', () => {
      expect(CTF_CONFIG.sessionCheckIntervalMs).toBe(10000);
    });

    it('should have warning minutes array', () => {
      expect(CTF_CONFIG.warningMinutes).toEqual([5, 1]);
    });

    it('should warn at 5 minutes and 1 minute', () => {
      expect(CTF_CONFIG.warningMinutes).toContain(5);
      expect(CTF_CONFIG.warningMinutes).toContain(1);
    });
  });

  // v4.2 Dead Zone Configuration Tests
  describe('Dead Zone Configuration (v4.2)', () => {
    it('should have dead zone boundaries', () => {
      expect(CTF_CONFIG.deadZoneMin).toBeDefined();
      expect(CTF_CONFIG.deadZoneMax).toBeDefined();
    });

    it('should have dead zone centered around start position', () => {
      const deadZoneCenter = (CTF_CONFIG.deadZoneMin + CTF_CONFIG.deadZoneMax) / 2;
      expect(deadZoneCenter).toBe(CTF_CONFIG.startPosition);
    });

    it('should have dead zone span of 3 positions (9, 10, 11)', () => {
      expect(CTF_CONFIG.deadZoneMin).toBe(9);
      expect(CTF_CONFIG.deadZoneMax).toBe(11);
      const deadZoneSize = CTF_CONFIG.deadZoneMax - CTF_CONFIG.deadZoneMin + 1;
      expect(deadZoneSize).toBe(3);
    });
  });

  // v4.2 Tiebreaker Configuration Tests
  describe('Tiebreaker Configuration (v4.2)', () => {
    it('should have ready check timeout', () => {
      expect(CTF_CONFIG.readyCheckTimeoutMs).toBe(30000);
    });

    it('should select 3 champions per team', () => {
      expect(CTF_CONFIG.championsPerTeam).toBe(3);
    });

    it('should require 2 match wins (best of 3)', () => {
      expect(CTF_CONFIG.matchesToWin).toBe(2);
    });

    it('should allow tiebreaker to complete in maximum 3 matches', () => {
      // Best of 3 means max matches = championsPerTeam (if both teams have enough)
      const maxMatches = CTF_CONFIG.championsPerTeam;
      expect(maxMatches).toBe(3);
    });
  });

  // v4.2 Pong Configuration Tests
  describe('Pong Configuration (v4.2)', () => {
    it('should have points to win', () => {
      expect(CTF_CONFIG.pongPointsToWin).toBe(5);
    });

    it('should have canvas dimensions', () => {
      expect(CTF_CONFIG.pongCanvasWidth).toBe(400);
      expect(CTF_CONFIG.pongCanvasHeight).toBe(300);
    });

    it('should have paddle dimensions', () => {
      expect(CTF_CONFIG.pongPaddleHeight).toBe(60);
      expect(CTF_CONFIG.pongPaddleWidth).toBe(10);
    });

    it('should have ball configuration', () => {
      expect(CTF_CONFIG.pongBallRadius).toBe(4);
      expect(CTF_CONFIG.pongBallSpeed).toBe(4);
    });

    it('should have paddle speed', () => {
      expect(CTF_CONFIG.pongPaddleSpeed).toBe(5);
    });

    it('should have reasonable canvas aspect ratio (4:3)', () => {
      const aspectRatio = CTF_CONFIG.pongCanvasWidth / CTF_CONFIG.pongCanvasHeight;
      expect(aspectRatio).toBeCloseTo(4 / 3, 2);
    });

    it('should have paddles that can reasonably block ball', () => {
      // Paddle height should be a reasonable fraction of canvas height
      const paddleCoverage = CTF_CONFIG.pongPaddleHeight / CTF_CONFIG.pongCanvasHeight;
      expect(paddleCoverage).toBeGreaterThan(0.1);  // At least 10% coverage
      expect(paddleCoverage).toBeLessThan(0.5);     // Less than 50% coverage
    });

    it('should have ball speed appropriate for canvas size', () => {
      // Ball should cross canvas in reasonable time (not too fast, not too slow)
      const framesAcross = CTF_CONFIG.pongCanvasWidth / CTF_CONFIG.pongBallSpeed;
      expect(framesAcross).toBeGreaterThan(50);   // At least ~1 second at 60fps
      expect(framesAcross).toBeLessThan(200);     // Less than ~3 seconds
    });
  });

  // v4.2 Valid Periods Configuration Tests
  describe('Valid Periods Configuration (v4.2)', () => {
    it('should have valid periods A-G', () => {
      expect(CTF_CONFIG.validPeriods).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    });

    it('should have exactly 7 periods', () => {
      expect(CTF_CONFIG.validPeriods.length).toBe(7);
    });

    it('should have periods in alphabetical order', () => {
      const sorted = [...CTF_CONFIG.validPeriods].sort();
      expect(CTF_CONFIG.validPeriods).toEqual(sorted);
    });

    it('should have all uppercase period letters', () => {
      CTF_CONFIG.validPeriods.forEach(period => {
        expect(period).toBe(period.toUpperCase());
        expect(period.length).toBe(1);
      });
    });
  });
});
