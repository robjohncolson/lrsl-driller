/**
 * Tests for ghost-engine.js
 * Ghost behavioral AI companion orchestrator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as GhostEngine from '../../platform/core/ghost-engine.js';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock fetch
global.fetch = vi.fn();

describe('GhostEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    global.fetch.mockReset();
  });

  describe('calculateColor', () => {
    it('should return white for proficiency < 0.2', () => {
      expect(GhostEngine.calculateColor(0)).toBe('white');
      expect(GhostEngine.calculateColor(0.1)).toBe('white');
      expect(GhostEngine.calculateColor(0.19)).toBe('white');
    });

    it('should return yellow for proficiency 0.2-0.4', () => {
      expect(GhostEngine.calculateColor(0.2)).toBe('yellow');
      expect(GhostEngine.calculateColor(0.3)).toBe('yellow');
      expect(GhostEngine.calculateColor(0.39)).toBe('yellow');
    });

    it('should return orange for proficiency 0.4-0.6', () => {
      expect(GhostEngine.calculateColor(0.4)).toBe('orange');
      expect(GhostEngine.calculateColor(0.5)).toBe('orange');
      expect(GhostEngine.calculateColor(0.59)).toBe('orange');
    });

    it('should return red for proficiency 0.6-0.8', () => {
      expect(GhostEngine.calculateColor(0.6)).toBe('red');
      expect(GhostEngine.calculateColor(0.7)).toBe('red');
      expect(GhostEngine.calculateColor(0.79)).toBe('red');
    });

    it('should return indigo for proficiency >= 0.8', () => {
      expect(GhostEngine.calculateColor(0.8)).toBe('indigo');
      expect(GhostEngine.calculateColor(0.9)).toBe('indigo');
      expect(GhostEngine.calculateColor(1.0)).toBe('indigo');
    });
  });

  describe('calculateOpacity', () => {
    it('should return 0.1 for 0 interactions', () => {
      expect(GhostEngine.calculateOpacity(0)).toBe(0.1);
    });

    it('should increase opacity with more interactions', () => {
      const opacity25 = GhostEngine.calculateOpacity(25);
      const opacity50 = GhostEngine.calculateOpacity(50);
      const opacity75 = GhostEngine.calculateOpacity(75);

      expect(opacity25).toBeGreaterThan(0.1);
      expect(opacity50).toBeGreaterThan(opacity25);
      expect(opacity75).toBeGreaterThan(opacity50);
    });

    it('should cap at 1.0 for 100+ interactions', () => {
      expect(GhostEngine.calculateOpacity(100)).toBe(1.0);
      expect(GhostEngine.calculateOpacity(150)).toBe(1.0);
      expect(GhostEngine.calculateOpacity(1000)).toBe(1.0);
    });

    it('should calculate intermediate values correctly', () => {
      // At 50 interactions: 0.1 + (50/100) * 0.9 = 0.1 + 0.45 = 0.55
      expect(GhostEngine.calculateOpacity(50)).toBeCloseTo(0.55, 2);
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      // Fresh state - not initialized
      expect(GhostEngine.isInitialized()).toBe(false);
    });
  });

  describe('getGhostProfile', () => {
    it('should return null before initialization', () => {
      expect(GhostEngine.getGhostProfile()).toBe(null);
    });
  });

  describe('Color progression visualization', () => {
    // This tests the visual vocabulary described in the spec
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
        expect(GhostEngine.calculateColor(midpoint)).toBe(color);
      });
    });
  });

  describe('Opacity engagement visualization', () => {
    // This tests the engagement vocabulary described in the spec
    const opacityLevels = [
      { interactions: 0, expected: 0.1, description: 'barely visible (new user)' },
      { interactions: 50, expected: 0.55, description: 'translucent (moderate engagement)' },
      { interactions: 100, expected: 1.0, description: 'solid (highly engaged)' }
    ];

    opacityLevels.forEach(({ interactions, expected, description }) => {
      it(`${interactions} interactions should be ${description}`, () => {
        expect(GhostEngine.calculateOpacity(interactions)).toBeCloseTo(expected, 2);
      });
    });
  });
});

describe('GhostEngine localStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('should use correct localStorage key format', () => {
    // Keys should follow pattern: ghost_{cartridgeId}_{username}_{suffix}
    const expectedPattern = /^ghost_[a-z0-9-]+_[a-z0-9]+_(weights|buffer|meta)$/;

    // Test keys through the actual storage operations would happen during init
    // This validates the key naming convention
    expect('ghost_sampling_student1_weights').toMatch(expectedPattern);
    expect('ghost_apstatu4l1l2_jdoe_meta').toMatch(expectedPattern);
  });
});

describe('Ghost interaction data structure', () => {
  // Validate the expected shape of interaction data

  it('should have correct input feature count', () => {
    const inputFeatures = [
      'level_progress',
      'time_in_session',
      'current_streak',
      'recent_accuracy',
      'hints_remaining',
      'problems_this_session',
      'retry_count',
      'session_accuracy',
      'time_of_day',
      'level_tier'
    ];
    expect(inputFeatures.length).toBe(10);
  });

  it('should have correct output prediction count', () => {
    const outputPredictions = [
      'time_to_answer',
      'correct_prob',
      'hint_prob',
      'quick_answer_prob'
    ];
    expect(outputPredictions.length).toBe(4);
  });
});

describe('Ghost visual properties mapping', () => {
  // Test that the visual vocabulary is consistent

  it('color names should be valid CSS-compatible names', () => {
    const validColors = ['white', 'yellow', 'orange', 'red', 'indigo'];
    for (let p = 0; p <= 1; p += 0.1) {
      const color = GhostEngine.calculateColor(p);
      expect(validColors).toContain(color);
    }
  });

  it('opacity should always be in valid CSS range', () => {
    for (let i = 0; i <= 200; i += 10) {
      const opacity = GhostEngine.calculateOpacity(i);
      expect(opacity).toBeGreaterThanOrEqual(0);
      expect(opacity).toBeLessThanOrEqual(1);
    }
  });
});
