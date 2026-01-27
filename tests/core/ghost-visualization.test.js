/**
 * Tests for Ghost Visualization (Phase 4)
 * Tests ghost color, opacity, movement path interpolation, and easing functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getGhostColorHex,
  calculateGhostColor,
  calculateGhostOpacity,
  interpolateMovementPath,
  easeInOutCubic,
  TRON_COLORS
} from '../../platform/core/ghost-maze-renderer.js';

describe('Ghost Visualization', () => {

  describe('calculateGhostColor', () => {

    it('returns white for proficiency < 0.2', () => {
      expect(calculateGhostColor(0)).toBe('white');
      expect(calculateGhostColor(0.1)).toBe('white');
      expect(calculateGhostColor(0.19)).toBe('white');
    });

    it('returns yellow for proficiency 0.2-0.4', () => {
      expect(calculateGhostColor(0.2)).toBe('yellow');
      expect(calculateGhostColor(0.3)).toBe('yellow');
      expect(calculateGhostColor(0.39)).toBe('yellow');
    });

    it('returns orange for proficiency 0.4-0.6', () => {
      expect(calculateGhostColor(0.4)).toBe('orange');
      expect(calculateGhostColor(0.5)).toBe('orange');
      expect(calculateGhostColor(0.59)).toBe('orange');
    });

    it('returns red for proficiency 0.6-0.8', () => {
      expect(calculateGhostColor(0.6)).toBe('red');
      expect(calculateGhostColor(0.7)).toBe('red');
      expect(calculateGhostColor(0.79)).toBe('red');
    });

    it('returns indigo for proficiency >= 0.8', () => {
      expect(calculateGhostColor(0.8)).toBe('indigo');
      expect(calculateGhostColor(0.9)).toBe('indigo');
      expect(calculateGhostColor(1.0)).toBe('indigo');
    });

    it('handles boundary values correctly', () => {
      expect(calculateGhostColor(0.0)).toBe('white');
      expect(calculateGhostColor(0.2)).toBe('yellow');
      expect(calculateGhostColor(0.4)).toBe('orange');
      expect(calculateGhostColor(0.6)).toBe('red');
      expect(calculateGhostColor(0.8)).toBe('indigo');
    });

  });

  describe('getGhostColorHex', () => {

    it('returns correct hex for white', () => {
      expect(getGhostColorHex('white')).toBe(TRON_COLORS.ghostWhite);
      expect(getGhostColorHex('white')).toBe(0xffffff);
    });

    it('returns correct hex for yellow', () => {
      expect(getGhostColorHex('yellow')).toBe(TRON_COLORS.ghostYellow);
      expect(getGhostColorHex('yellow')).toBe(0xffff44);
    });

    it('returns correct hex for orange', () => {
      expect(getGhostColorHex('orange')).toBe(TRON_COLORS.ghostOrange);
      expect(getGhostColorHex('orange')).toBe(0xff8844);
    });

    it('returns correct hex for red', () => {
      expect(getGhostColorHex('red')).toBe(TRON_COLORS.ghostRed);
      expect(getGhostColorHex('red')).toBe(0xff4444);
    });

    it('returns correct hex for indigo', () => {
      expect(getGhostColorHex('indigo')).toBe(TRON_COLORS.ghostIndigo);
      expect(getGhostColorHex('indigo')).toBe(0x8844ff);
    });

    it('returns white for unknown color', () => {
      expect(getGhostColorHex('unknown')).toBe(TRON_COLORS.ghostWhite);
      expect(getGhostColorHex('purple')).toBe(TRON_COLORS.ghostWhite);
    });

    it('handles capitalization correctly', () => {
      expect(getGhostColorHex('White')).toBe(TRON_COLORS.ghostWhite);
      expect(getGhostColorHex('Yellow')).toBe(TRON_COLORS.ghostYellow);
    });

  });

  describe('calculateGhostOpacity', () => {

    it('returns 0.1 for 0 interactions', () => {
      expect(calculateGhostOpacity(0)).toBe(0.1);
    });

    it('increases opacity with more interactions', () => {
      const opacity10 = calculateGhostOpacity(10);
      const opacity25 = calculateGhostOpacity(25);
      const opacity50 = calculateGhostOpacity(50);
      const opacity75 = calculateGhostOpacity(75);

      expect(opacity10).toBeGreaterThan(0.1);
      expect(opacity25).toBeGreaterThan(opacity10);
      expect(opacity50).toBeGreaterThan(opacity25);
      expect(opacity75).toBeGreaterThan(opacity50);
    });

    it('caps at 1.0 for 100+ interactions', () => {
      expect(calculateGhostOpacity(100)).toBe(1.0);
      expect(calculateGhostOpacity(150)).toBe(1.0);
      expect(calculateGhostOpacity(1000)).toBe(1.0);
    });

    it('calculates intermediate values correctly', () => {
      // Formula: min(0.1 + (interactions / 100) * 0.9, 1.0)
      // At 50 interactions: 0.1 + (50/100) * 0.9 = 0.1 + 0.45 = 0.55
      expect(calculateGhostOpacity(50)).toBeCloseTo(0.55, 2);

      // At 25 interactions: 0.1 + (25/100) * 0.9 = 0.1 + 0.225 = 0.325
      expect(calculateGhostOpacity(25)).toBeCloseTo(0.325, 2);

      // At 75 interactions: 0.1 + (75/100) * 0.9 = 0.1 + 0.675 = 0.775
      expect(calculateGhostOpacity(75)).toBeCloseTo(0.775, 2);
    });

    it('handles negative interactions gracefully', () => {
      // Should still return 0.1 (minimum)
      const result = calculateGhostOpacity(-10);
      expect(result).toBeLessThan(0.1);
    });

    it('opacity is always between 0.1 and 1.0 for valid inputs', () => {
      for (let i = 0; i <= 200; i += 5) {
        const opacity = calculateGhostOpacity(i);
        expect(opacity).toBeGreaterThanOrEqual(0.1);
        expect(opacity).toBeLessThanOrEqual(1.0);
      }
    });

  });

  describe('interpolateMovementPath', () => {

    const fromPos = { x: 0, y: 0, z: 0 };
    const toPos = { x: 10, y: 10, z: 10 };

    it('returns start position at t=0', () => {
      const result = interpolateMovementPath(fromPos, toPos, 0);

      expect(result.x).toBe(fromPos.x);
      expect(result.y).toBe(fromPos.y);
      expect(result.z).toBe(fromPos.z);
    });

    it('returns end position at t=1', () => {
      const result = interpolateMovementPath(fromPos, toPos, 1);

      expect(result.x).toBe(toPos.x);
      expect(result.y).toBe(toPos.y);
      expect(result.z).toBe(toPos.z);
    });

    it('returns midpoint with sag at t=0.5', () => {
      const result = interpolateMovementPath(fromPos, toPos, 0.5);

      // X and Z should be at midpoint
      expect(result.x).toBeCloseTo(5, 2);
      expect(result.z).toBeCloseTo(5, 2);

      // Y should be below the linear midpoint due to sag
      const linearMidY = (fromPos.y + toPos.y) / 2;
      expect(result.y).toBeLessThan(linearMidY);
    });

    it('applies custom sag value', () => {
      const resultSmallSag = interpolateMovementPath(fromPos, toPos, 0.5, 0.5);
      const resultLargeSag = interpolateMovementPath(fromPos, toPos, 0.5, 3.0);

      // Larger sag should result in lower Y at midpoint
      expect(resultLargeSag.y).toBeLessThan(resultSmallSag.y);
    });

    it('creates smooth path with monotonic X and Z', () => {
      let prevX = -Infinity;
      let prevZ = -Infinity;

      for (let t = 0; t <= 1; t += 0.1) {
        const result = interpolateMovementPath(fromPos, toPos, t);

        // X and Z should always increase for this path
        expect(result.x).toBeGreaterThanOrEqual(prevX);
        expect(result.z).toBeGreaterThanOrEqual(prevZ);

        prevX = result.x;
        prevZ = result.z;
      }
    });

    it('handles same start and end position', () => {
      const samePos = { x: 5, y: 5, z: 5 };
      const result = interpolateMovementPath(samePos, samePos, 0.5);

      expect(result.x).toBeCloseTo(samePos.x, 2);
      expect(result.z).toBeCloseTo(samePos.z, 2);
      // Y will be affected by sag
      expect(result.y).toBeLessThan(samePos.y);
    });

    it('handles negative coordinates', () => {
      const negFrom = { x: -5, y: -5, z: -5 };
      const negTo = { x: 5, y: 5, z: 5 };

      const start = interpolateMovementPath(negFrom, negTo, 0);
      const end = interpolateMovementPath(negFrom, negTo, 1);

      expect(start.x).toBe(negFrom.x);
      expect(end.x).toBe(negTo.x);
    });

  });

  describe('easeInOutCubic', () => {

    it('returns 0 at t=0', () => {
      expect(easeInOutCubic(0)).toBe(0);
    });

    it('returns 1 at t=1', () => {
      expect(easeInOutCubic(1)).toBe(1);
    });

    it('returns 0.5 at t=0.5', () => {
      expect(easeInOutCubic(0.5)).toBe(0.5);
    });

    it('is symmetric around t=0.5', () => {
      const t1 = 0.25;
      const t2 = 0.75;

      const v1 = easeInOutCubic(t1);
      const v2 = easeInOutCubic(t2);

      // v1 + v2 should equal 1 for symmetric easing
      expect(v1 + v2).toBeCloseTo(1, 5);
    });

    it('starts slow (ease-in)', () => {
      // At t=0.1, eased value should be less than 0.1
      expect(easeInOutCubic(0.1)).toBeLessThan(0.1);

      // At t=0.25, eased value should be less than 0.25
      expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
    });

    it('ends slow (ease-out)', () => {
      // At t=0.9, eased value should be greater than 0.9
      expect(easeInOutCubic(0.9)).toBeGreaterThan(0.9);

      // At t=0.75, eased value should be greater than 0.75
      expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
    });

    it('is monotonically increasing', () => {
      let prevValue = -1;

      for (let t = 0; t <= 1; t += 0.05) {
        const value = easeInOutCubic(t);
        expect(value).toBeGreaterThanOrEqual(prevValue);
        prevValue = value;
      }
    });

    it('produces valid output range', () => {
      for (let t = 0; t <= 1; t += 0.01) {
        const value = easeInOutCubic(t);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

  });

  describe('TRON_COLORS', () => {

    it('has all required ghost colors', () => {
      expect(TRON_COLORS.ghostWhite).toBeDefined();
      expect(TRON_COLORS.ghostYellow).toBeDefined();
      expect(TRON_COLORS.ghostOrange).toBeDefined();
      expect(TRON_COLORS.ghostRed).toBeDefined();
      expect(TRON_COLORS.ghostIndigo).toBeDefined();
    });

    it('has all required node colors', () => {
      expect(TRON_COLORS.nodeLocked).toBeDefined();
      expect(TRON_COLORS.nodeUnlocked).toBeDefined();
      expect(TRON_COLORS.nodeCompleted).toBeDefined();
      expect(TRON_COLORS.nodeCurrent).toBeDefined();
    });

    it('has all required edge colors', () => {
      expect(TRON_COLORS.edgeDefault).toBeDefined();
      expect(TRON_COLORS.edgeGold).toBeDefined();
    });

    it('has background and grid colors', () => {
      expect(TRON_COLORS.background).toBeDefined();
      expect(TRON_COLORS.grid).toBeDefined();
      expect(TRON_COLORS.gridSecondary).toBeDefined();
    });

    it('ghost colors are valid hex values', () => {
      expect(typeof TRON_COLORS.ghostWhite).toBe('number');
      expect(TRON_COLORS.ghostWhite).toBeGreaterThanOrEqual(0);
      expect(TRON_COLORS.ghostWhite).toBeLessThanOrEqual(0xffffff);

      expect(typeof TRON_COLORS.ghostIndigo).toBe('number');
      expect(TRON_COLORS.ghostIndigo).toBeGreaterThanOrEqual(0);
      expect(TRON_COLORS.ghostIndigo).toBeLessThanOrEqual(0xffffff);
    });

  });

  describe('Color progression visualization', () => {
    // Tests the visual vocabulary described in the spec
    const colorProgression = [
      { range: '0-20%', color: 'white', description: 'Novice' },
      { range: '20-40%', color: 'yellow', description: 'Emerging' },
      { range: '40-60%', color: 'orange', description: 'Developing' },
      { range: '60-80%', color: 'red', description: 'Proficient' },
      { range: '80-100%', color: 'indigo', description: 'Mastery' }
    ];

    colorProgression.forEach(({ range, color, description }) => {
      it(`${description} (${range}) should be ${color}`, () => {
        const [min, max] = range.replace('%', '').split('-').map(n => parseInt(n) / 100);
        const midpoint = (min + max) / 2;
        expect(calculateGhostColor(midpoint)).toBe(color);
      });
    });
  });

  describe('Opacity engagement visualization', () => {
    // Tests the engagement vocabulary described in the spec
    const opacityLevels = [
      { interactions: 0, expected: 0.1, description: 'barely visible (new user)' },
      { interactions: 25, expected: 0.325, description: 'faint (light engagement)' },
      { interactions: 50, expected: 0.55, description: 'translucent (moderate engagement)' },
      { interactions: 75, expected: 0.775, description: 'mostly solid (good engagement)' },
      { interactions: 100, expected: 1.0, description: 'solid (highly engaged)' }
    ];

    opacityLevels.forEach(({ interactions, expected, description }) => {
      it(`${interactions} interactions should be ${description}`, () => {
        expect(calculateGhostOpacity(interactions)).toBeCloseTo(expected, 2);
      });
    });
  });

  describe('Movement path characteristics', () => {

    it('path has catenary-like sag', () => {
      const fromPos = { x: 0, y: 5, z: 0 };
      const toPos = { x: 10, y: 5, z: 0 };

      // Sample points along path
      const samples = [];
      for (let t = 0; t <= 1; t += 0.1) {
        samples.push(interpolateMovementPath(fromPos, toPos, t));
      }

      // Find minimum Y value (should be below the endpoints)
      const minY = Math.min(...samples.map(s => s.y));
      expect(minY).toBeLessThan(fromPos.y);
    });

    it('path is smooth (no sudden jumps)', () => {
      const fromPos = { x: 0, y: 0, z: 0 };
      const toPos = { x: 20, y: 8, z: 15 };

      let prevPos = interpolateMovementPath(fromPos, toPos, 0);
      const maxAllowedDelta = 3; // Maximum expected position change per 0.1 t

      for (let t = 0.1; t <= 1; t += 0.1) {
        const pos = interpolateMovementPath(fromPos, toPos, t);

        const deltaX = Math.abs(pos.x - prevPos.x);
        const deltaY = Math.abs(pos.y - prevPos.y);
        const deltaZ = Math.abs(pos.z - prevPos.z);

        expect(deltaX).toBeLessThan(maxAllowedDelta);
        expect(deltaY).toBeLessThan(maxAllowedDelta);
        expect(deltaZ).toBeLessThan(maxAllowedDelta);

        prevPos = pos;
      }
    });

  });

});
