/**
 * Grid Wars v2.0 Tests
 * Tests for hierarchical territory subdivision (fractal model)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  coordsToAddress,
  addressToCoords,
  buildAddress,
  getParentAddress,
  getLevel,
  getBreadcrumb,
  parseAddress,
  isCenterCell,
  CENTER_CELLS,
  DRILL_CELL
} from '../../shared/address-utils.js';

describe('Address Utilities', () => {
  describe('coordsToAddress', () => {
    it('converts (0,0) to a1', () => {
      expect(coordsToAddress(0, 0)).toBe('a1');
    });

    it('converts (7,7) to h8', () => {
      expect(coordsToAddress(7, 7)).toBe('h8');
    });

    it('converts (3,4) to d5', () => {
      expect(coordsToAddress(3, 4)).toBe('d5');
    });

    it('converts (4,3) to e4', () => {
      expect(coordsToAddress(4, 3)).toBe('e4');
    });
  });

  describe('addressToCoords', () => {
    it('converts a1 to (0,0)', () => {
      expect(addressToCoords('a1')).toEqual({ x: 0, y: 0 });
    });

    it('converts h8 to (7,7)', () => {
      expect(addressToCoords('h8')).toEqual({ x: 7, y: 7 });
    });

    it('converts d5 to (3,4)', () => {
      expect(addressToCoords('d5')).toEqual({ x: 3, y: 4 });
    });

    it('handles compound addresses by extracting leaf', () => {
      expect(addressToCoords('d5.c3')).toEqual({ x: 2, y: 2 });
    });

    it('handles triple-nested addresses', () => {
      expect(addressToCoords('d5.c3.a1')).toEqual({ x: 0, y: 0 });
    });
  });

  describe('buildAddress', () => {
    it('builds root address without parent', () => {
      expect(buildAddress(null, 3, 4)).toBe('d5');
    });

    it('builds nested address with parent', () => {
      expect(buildAddress('d5', 2, 2)).toBe('d5.c3');
    });

    it('builds triple-nested address', () => {
      expect(buildAddress('d5.c3', 0, 0)).toBe('d5.c3.a1');
    });
  });

  describe('getParentAddress', () => {
    it('returns null for root-level address', () => {
      expect(getParentAddress('d5')).toBeNull();
    });

    it('returns parent for single-nested address', () => {
      expect(getParentAddress('d5.c3')).toBe('d5');
    });

    it('returns parent for double-nested address', () => {
      expect(getParentAddress('d5.c3.a1')).toBe('d5.c3');
    });
  });

  describe('getLevel', () => {
    it('returns 0 for root-level address', () => {
      expect(getLevel('d5')).toBe(0);
    });

    it('returns 1 for single-nested address', () => {
      expect(getLevel('d5.c3')).toBe(1);
    });

    it('returns 2 for double-nested address', () => {
      expect(getLevel('d5.c3.a1')).toBe(2);
    });

    it('returns 0 for null/undefined', () => {
      expect(getLevel(null)).toBe(0);
      expect(getLevel(undefined)).toBe(0);
    });
  });

  describe('getBreadcrumb', () => {
    it('returns empty array for null', () => {
      expect(getBreadcrumb(null)).toEqual([]);
    });

    it('returns single element for root address', () => {
      expect(getBreadcrumb('d5')).toEqual(['d5']);
    });

    it('returns multiple elements for nested address', () => {
      expect(getBreadcrumb('d5.c3')).toEqual(['d5', 'c3']);
    });

    it('returns full trail for deep address', () => {
      expect(getBreadcrumb('d5.c3.a1')).toEqual(['d5', 'c3', 'a1']);
    });
  });

  describe('parseAddress', () => {
    it('parses root address', () => {
      const result = parseAddress('d5');
      expect(result.parts).toEqual(['d5']);
      expect(result.level).toBe(0);
      expect(result.parentAddress).toBeNull();
      expect(result.localNotation).toBe('d5');
    });

    it('parses nested address', () => {
      const result = parseAddress('d5.c3');
      expect(result.parts).toEqual(['d5', 'c3']);
      expect(result.level).toBe(1);
      expect(result.parentAddress).toBe('d5');
      expect(result.localNotation).toBe('c3');
    });

    it('parses deeply nested address', () => {
      const result = parseAddress('d5.c3.a1');
      expect(result.parts).toEqual(['d5', 'c3', 'a1']);
      expect(result.level).toBe(2);
      expect(result.parentAddress).toBe('d5.c3');
      expect(result.localNotation).toBe('a1');
    });
  });

  describe('CENTER_CELLS', () => {
    it('contains center 4 cells', () => {
      expect(CENTER_CELLS).toEqual(['d4', 'd5', 'e4', 'e5']);
    });
  });

  describe('isCenterCell', () => {
    it('returns true for d4', () => {
      expect(isCenterCell('d4')).toBe(true);
    });

    it('returns true for d5', () => {
      expect(isCenterCell('d5')).toBe(true);
    });

    it('returns true for e4', () => {
      expect(isCenterCell('e4')).toBe(true);
    });

    it('returns true for e5', () => {
      expect(isCenterCell('e5')).toBe(true);
    });

    it('returns false for corner a1', () => {
      expect(isCenterCell('a1')).toBe(false);
    });

    it('returns false for edge cells', () => {
      expect(isCenterCell('a4')).toBe(false);
      expect(isCenterCell('d1')).toBe(false);
      expect(isCenterCell('h5')).toBe(false);
    });
  });

  describe('DRILL_CELL', () => {
    it('is corner a1', () => {
      expect(DRILL_CELL).toBe('a1');
    });
  });
});

describe('Address Round-Trip', () => {
  it('round-trips correctly for all 64 cells', () => {
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const address = coordsToAddress(x, y);
        const coords = addressToCoords(address);
        expect(coords).toEqual({ x, y });
      }
    }
  });
});

describe('Hierarchy Scenarios', () => {
  describe('Develop Action', () => {
    it('center cells are correct for owner retention', () => {
      // When owner develops d5, they should keep center 4: d4, d5, e4, e5
      // In x,y coords (0-indexed): (3,3), (3,4), (4,3), (4,4)
      const centerCoords = CENTER_CELLS.map(addr => addressToCoords(addr));
      expect(centerCoords).toEqual([
        { x: 3, y: 3 },  // d4
        { x: 3, y: 4 },  // d5
        { x: 4, y: 3 },  // e4
        { x: 4, y: 4 }   // e5
      ]);
    });
  });

  describe('Drill Action', () => {
    it('drill cell is corner a1', () => {
      const drillCoords = addressToCoords(DRILL_CELL);
      expect(drillCoords).toEqual({ x: 0, y: 0 });
    });

    it('drill cell is not a center cell', () => {
      expect(isCenterCell(DRILL_CELL)).toBe(false);
    });
  });

  describe('Subcell Addresses', () => {
    it('builds correct subcell addresses', () => {
      // When d5 is developed, subcells have addresses like d5.a1, d5.c3, etc.
      expect(buildAddress('d5', 0, 0)).toBe('d5.a1');
      expect(buildAddress('d5', 2, 2)).toBe('d5.c3');
      expect(buildAddress('d5', 7, 7)).toBe('d5.h8');
    });

    it('builds correct nested subcell addresses', () => {
      // When d5.c3 is developed, nested subcells have addresses like d5.c3.a1
      expect(buildAddress('d5.c3', 0, 0)).toBe('d5.c3.a1');
      expect(buildAddress('d5.c3', 3, 4)).toBe('d5.c3.d5');
    });
  });
});
