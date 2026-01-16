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
});
