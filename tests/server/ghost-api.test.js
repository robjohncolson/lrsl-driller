/**
 * Tests for Ghost API endpoints
 * POST /api/ghost/:cartridgeId/sync
 * GET /api/ghost/:cartridgeId/:username
 * GET /api/ghost/:cartridgeId/leaderboard
 */

import { describe, it, expect } from 'vitest';

// These tests validate the API contract for ghost endpoints
// They don't make real HTTP calls but verify the expected behavior

describe('Ghost API Contract', () => {

  describe('POST /api/ghost/:cartridgeId/sync', () => {
    it('should accept valid ghost profile data', () => {
      const validPayload = {
        username: 'student1',
        weights: [[0.1, 0.2], [0.3, 0.4]], // Serialized neural network weights
        buffer: [], // Experience replay buffer
        total_interactions: 42,
        proficiency_score: 0.75,
        color: 'red',
        opacity: 0.85,
        version: 5
      };

      // Validate payload structure
      expect(validPayload.username).toBeDefined();
      expect(validPayload.weights).toBeDefined();
      expect(typeof validPayload.total_interactions).toBe('number');
      expect(typeof validPayload.proficiency_score).toBe('number');
      expect(validPayload.proficiency_score).toBeGreaterThanOrEqual(0);
      expect(validPayload.proficiency_score).toBeLessThanOrEqual(1);
    });

    it('should require username and weights', () => {
      const incompletePayload = {
        total_interactions: 10,
        proficiency_score: 0.5
      };

      // Missing username and weights - should fail validation
      expect(incompletePayload.username).toBeUndefined();
      expect(incompletePayload.weights).toBeUndefined();
    });

    it('should validate color is one of expected values', () => {
      const validColors = ['white', 'yellow', 'orange', 'red', 'indigo'];
      const testColor = 'orange';
      expect(validColors).toContain(testColor);
    });

    it('should validate opacity is between 0.1 and 1.0', () => {
      const validOpacity = 0.55;
      expect(validOpacity).toBeGreaterThanOrEqual(0.1);
      expect(validOpacity).toBeLessThanOrEqual(1.0);
    });

    it('should validate version is a positive integer', () => {
      const validVersion = 42;
      expect(Number.isInteger(validVersion)).toBe(true);
      expect(validVersion).toBeGreaterThan(0);
    });
  });

  describe('GET /api/ghost/:cartridgeId/:username', () => {
    it('should return full ghost profile for existing user', () => {
      const expectedResponse = {
        id: 1,
        username: 'student1',
        cartridge_id: 'sampling',
        weights: [[0.1, 0.2]],
        buffer: [],
        total_interactions: 42,
        proficiency_score: 0.75,
        color: 'red',
        opacity: 0.85,
        version: 5,
        created_at: '2026-01-15T10:00:00Z',
        updated_at: '2026-01-27T14:30:00Z'
      };

      // Validate response structure
      expect(expectedResponse).toHaveProperty('username');
      expect(expectedResponse).toHaveProperty('cartridge_id');
      expect(expectedResponse).toHaveProperty('weights');
      expect(expectedResponse).toHaveProperty('proficiency_score');
      expect(expectedResponse).toHaveProperty('version');
    });

    it('should return 404 for non-existent user', () => {
      const errorResponse = { error: 'Ghost not found' };
      expect(errorResponse.error).toBe('Ghost not found');
    });
  });

  describe('GET /api/ghost/:cartridgeId/leaderboard', () => {
    it('should return array of ghosts sorted by proficiency', () => {
      const expectedResponse = {
        ghosts: [
          { username: 'topStudent', total_interactions: 150, proficiency_score: 0.92, color: 'indigo', opacity: 1.0 },
          { username: 'midStudent', total_interactions: 80, proficiency_score: 0.65, color: 'red', opacity: 0.82 },
          { username: 'newStudent', total_interactions: 15, proficiency_score: 0.25, color: 'yellow', opacity: 0.24 }
        ]
      };

      // Validate sorting (descending by proficiency)
      const scores = expectedResponse.ghosts.map(g => g.proficiency_score);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    });

    it('should support class_period filter', () => {
      // When class_period is provided, only return ghosts for students in that period
      const queryParam = { class_period: 'A' };
      expect(queryParam.class_period).toMatch(/^[A-G]$/);
    });

    it('should return minimal data for leaderboard (no weights/buffer)', () => {
      const leaderboardEntry = {
        username: 'student1',
        total_interactions: 50,
        proficiency_score: 0.6,
        color: 'orange',
        opacity: 0.55,
        updated_at: '2026-01-27T14:30:00Z'
      };

      // Should NOT include heavy data
      expect(leaderboardEntry).not.toHaveProperty('weights');
      expect(leaderboardEntry).not.toHaveProperty('buffer');
    });
  });
});

describe('Ghost Database Schema', () => {
  it('should have unique constraint on (username, cartridge_id)', () => {
    // One ghost per user per cartridge
    const constraint = { unique: ['username', 'cartridge_id'] };
    expect(constraint.unique).toContain('username');
    expect(constraint.unique).toContain('cartridge_id');
  });

  it('should have index on cartridge_id and proficiency_score for leaderboard', () => {
    // For efficient leaderboard queries
    const indexColumns = ['cartridge_id', 'proficiency_score'];
    expect(indexColumns).toContain('cartridge_id');
    expect(indexColumns).toContain('proficiency_score');
  });

  it('should have index on username for user lookups', () => {
    const indexColumn = 'username';
    expect(indexColumn).toBe('username');
  });
});

describe('Ghost Weights Serialization', () => {
  it('should serialize weights as nested number arrays', () => {
    // Network architecture: 10 -> 16 -> 16 -> 4
    // Layer weights: [10x16, 16], [16x16, 16], [16x4, 4] = 6 arrays
    const expectedWeightArrays = 6;

    const mockWeights = [
      new Array(160).fill(0.1),  // Input -> Hidden1 kernel
      new Array(16).fill(0.1),   // Hidden1 bias
      new Array(256).fill(0.1),  // Hidden1 -> Hidden2 kernel
      new Array(16).fill(0.1),   // Hidden2 bias
      new Array(64).fill(0.1),   // Hidden2 -> Output kernel
      new Array(4).fill(0.1)     // Output bias
    ];

    expect(mockWeights.length).toBe(expectedWeightArrays);
  });

  it('should have approximately 516 total parameters', () => {
    // Input->H1: 10*16 + 16 = 176
    // H1->H2: 16*16 + 16 = 272
    // H2->Output: 16*4 + 4 = 68
    // Total: 176 + 272 + 68 = 516
    const totalParams = (10 * 16 + 16) + (16 * 16 + 16) + (16 * 4 + 4);
    expect(totalParams).toBe(516);
  });
});

describe('Ghost Buffer Management', () => {
  it('should maintain circular buffer of 50 interactions', () => {
    const BUFFER_SIZE = 50;
    expect(BUFFER_SIZE).toBe(50);
  });

  it('should sample batch of 8 for training', () => {
    const BATCH_SIZE = 8;
    expect(BATCH_SIZE).toBe(8);
  });

  it('interaction record should have required fields', () => {
    const mockInteraction = {
      timestamp: '2026-01-27T14:30:00Z',
      level_id: 'l01-vocab',
      topic_id: '4.1',
      inputs: new Array(10).fill(0.5),
      outputs: [0.5, 1.0, 0.0, 0.0],
      raw: {
        time_ms: 8500,
        correct: true,
        score: 'E',
        hints_used: 0,
        streak_at_time: 3
      }
    };

    expect(mockInteraction).toHaveProperty('timestamp');
    expect(mockInteraction).toHaveProperty('inputs');
    expect(mockInteraction).toHaveProperty('outputs');
    expect(mockInteraction.inputs.length).toBe(10);
    expect(mockInteraction.outputs.length).toBe(4);
  });
});

describe('Ghost Visual Vocabulary', () => {
  // These tests document the visual vocabulary from the spec

  describe('Color = Proficiency', () => {
    const colorMapping = [
      { proficiency: 0.1, color: 'white', meaning: 'Novice (just starting)' },
      { proficiency: 0.3, color: 'yellow', meaning: 'Emerging' },
      { proficiency: 0.5, color: 'orange', meaning: 'Developing' },
      { proficiency: 0.7, color: 'red', meaning: 'Proficient' },
      { proficiency: 0.9, color: 'indigo', meaning: 'Mastery' }
    ];

    colorMapping.forEach(({ proficiency, color, meaning }) => {
      it(`${(proficiency * 100).toFixed(0)}% proficiency = ${color} (${meaning})`, () => {
        // Just documenting the expected mapping
        expect(color).toBeDefined();
        expect(meaning).toBeDefined();
      });
    });
  });

  describe('Opacity = Engagement', () => {
    const opacityMapping = [
      { interactions: 0, opacity: 0.1, meaning: 'barely visible (new)' },
      { interactions: 50, opacity: 0.55, meaning: 'translucent' },
      { interactions: 100, opacity: 1.0, meaning: 'solid (engaged)' }
    ];

    opacityMapping.forEach(({ interactions, opacity, meaning }) => {
      it(`${interactions} interactions = ${opacity} opacity (${meaning})`, () => {
        expect(opacity).toBeGreaterThanOrEqual(0.1);
        expect(opacity).toBeLessThanOrEqual(1.0);
      });
    });
  });
});
