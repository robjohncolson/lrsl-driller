/**
 * Game Mode Configuration Tests
 *
 * Tests for the shared game mode configuration (v4.3)
 */

import { describe, it, expect } from 'vitest';
import { GAME_MODE_CONFIG } from '../../shared/game-mode.config.js';

describe('GAME_MODE_CONFIG', () => {
  describe('modes', () => {
    it('should define CTF and KotH modes', () => {
      expect(GAME_MODE_CONFIG.modes.CTF).toBe('ctf');
      expect(GAME_MODE_CONFIG.modes.KOTH).toBe('koth');
    });

    it('should have exactly 2 game modes', () => {
      expect(Object.keys(GAME_MODE_CONFIG.modes)).toHaveLength(2);
    });
  });

  describe('tiebreakers', () => {
    it('should define all tiebreaker types', () => {
      expect(GAME_MODE_CONFIG.tiebreakers.PONG).toBe('pong');
      expect(GAME_MODE_CONFIG.tiebreakers.QUICK_CALC).toBe('quick_calc');
      expect(GAME_MODE_CONFIG.tiebreakers.REFLEX_DUEL).toBe('reflex_duel');
    });

    it('should have exactly 3 tiebreaker types', () => {
      expect(Object.keys(GAME_MODE_CONFIG.tiebreakers)).toHaveLength(3);
    });
  });

  describe('defaults', () => {
    it('should default to CTF game mode', () => {
      expect(GAME_MODE_CONFIG.defaults.gameMode).toBe('ctf');
    });

    it('should default to Pong tiebreaker', () => {
      expect(GAME_MODE_CONFIG.defaults.tiebreakerType).toBe('pong');
    });
  });

  describe('koth configuration', () => {
    const koth = GAME_MODE_CONFIG.koth;

    it('should have a 7-minute rolling window', () => {
      expect(koth.windowDurationMs).toBe(7 * 60 * 1000);
    });

    it('should have full weight for first 3 minutes', () => {
      expect(koth.fullWeightMs).toBe(3 * 60 * 1000);
    });

    it('should start decay at 3 minutes', () => {
      expect(koth.decayStartMs).toBe(3 * 60 * 1000);
    });

    it('should reach 50% weight at 5 minutes', () => {
      expect(koth.decayMidMs).toBe(5 * 60 * 1000);
    });

    it('should have a 30-second tiebreaker threshold', () => {
      expect(koth.tiebreakerThresholdSeconds).toBe(30);
    });

    it('should have correct star points', () => {
      expect(koth.starPoints.gold).toBe(4);
      expect(koth.starPoints.silver).toBe(3);
      expect(koth.starPoints.bronze).toBe(2);
      expect(koth.starPoints.tin).toBe(1);
    });
  });

  describe('quick calc configuration', () => {
    const qc = GAME_MODE_CONFIG.quickCalc;

    it('should require 5 points to win', () => {
      expect(qc.pointsToWin).toBe(5);
    });

    it('should have a 1-second lockout', () => {
      expect(qc.lockoutMs).toBe(1000);
    });

    it('should have a 15-second timeout', () => {
      expect(qc.timeoutMs).toBe(15000);
    });

    it('should use 2-digit numbers (10-99)', () => {
      expect(qc.minNumber).toBe(10);
      expect(qc.maxNumber).toBe(99);
    });

    it('should support addition, subtraction, and multiplication', () => {
      expect(qc.operations).toContain('+');
      expect(qc.operations).toContain('-');
      expect(qc.operations).toContain('*');
      expect(qc.operations).toHaveLength(3);
    });
  });

  describe('reflex duel configuration', () => {
    const rd = GAME_MODE_CONFIG.reflexDuel;

    it('should require 5 points to win', () => {
      expect(rd.pointsToWin).toBe(5);
    });

    it('should have a minimum delay of 1.5 seconds', () => {
      expect(rd.minDelayMs).toBe(1500);
    });

    it('should have a maximum delay of 4 seconds', () => {
      expect(rd.maxDelayMs).toBe(4000);
    });

    it('should have a 20ms tie threshold', () => {
      expect(rd.tieThresholdMs).toBe(20);
    });
  });

  describe('series configuration', () => {
    const series = GAME_MODE_CONFIG.series;

    it('should require 2 wins for best-of-3', () => {
      expect(series.matchesToWin).toBe(2);
    });

    it('should have 30-second ready check timeout', () => {
      expect(series.readyCheckTimeoutMs).toBe(30000);
    });

    it('should select 3 champions per team', () => {
      expect(series.championsPerTeam).toBe(3);
    });
  });

  describe('valid periods', () => {
    it('should have 7 class periods (A-G)', () => {
      expect(GAME_MODE_CONFIG.validPeriods).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    });
  });

  describe('labels', () => {
    it('should have display labels for modes', () => {
      expect(GAME_MODE_CONFIG.labels.modes.ctf).toBe('Capture The Flag');
      expect(GAME_MODE_CONFIG.labels.modes.koth).toBe('King of the Hill');
    });

    it('should have display labels for tiebreakers', () => {
      expect(GAME_MODE_CONFIG.labels.tiebreakers.pong).toBe('Pong');
      expect(GAME_MODE_CONFIG.labels.tiebreakers.quick_calc).toBe('Quick Calc');
      expect(GAME_MODE_CONFIG.labels.tiebreakers.reflex_duel).toBe('Reflex Duel');
    });

    it('should have short labels for modes', () => {
      expect(GAME_MODE_CONFIG.labels.modesShort.ctf).toBe('CTF');
      expect(GAME_MODE_CONFIG.labels.modesShort.koth).toBe('KotH');
    });
  });
});
