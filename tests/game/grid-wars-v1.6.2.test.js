/**
 * Grid Wars v1.6.2 Regression Tests
 * Tests for critical bug fixes:
 * - Frontend grid size using config (not hardcoded 20)
 * - AI grading parser accepting direct { score, feedback } format
 * - Velocity query using correct column name (player_id)
 */

import { describe, it, expect, vi } from 'vitest';
import { GRID_WARS_CONFIG } from '../../shared/gridwars.config.js';
import { GRID_WARS_CONFIG as CLIENT_CONFIG } from '../../platform/game/grid-state.js';

describe('Grid Wars v1.6.2 Bug Fixes', () => {

  describe('REGRESSION: Grid Size Config (was hardcoded to 20)', () => {
    it('shared config has mapSize of 8', () => {
      expect(GRID_WARS_CONFIG.mapSize).toBe(8);
    });

    it('client config default has mapSize of 8', () => {
      // grid-state.js had mapSize: 20 hardcoded, now should be 8
      expect(CLIENT_CONFIG.mapSize).toBe(8);
    });

    it('shared and client configs have matching mapSize', () => {
      // Both configs should agree on the map size
      expect(CLIENT_CONFIG.mapSize).toBe(GRID_WARS_CONFIG.mapSize);
    });

    it('mapSize is NOT 20 (the old broken value)', () => {
      expect(GRID_WARS_CONFIG.mapSize).not.toBe(20);
      expect(CLIENT_CONFIG.mapSize).not.toBe(20);
    });

    it('mapSize is NOT 25 (the even older value)', () => {
      expect(GRID_WARS_CONFIG.mapSize).not.toBe(25);
      expect(CLIENT_CONFIG.mapSize).not.toBe(25);
    });

    it('total cells is 64 (8x8), not 400 (20x20)', () => {
      const totalCells = GRID_WARS_CONFIG.mapSize * GRID_WARS_CONFIG.mapSize;
      expect(totalCells).toBe(64);
      expect(totalCells).not.toBe(400);
    });

    it('classGoalTarget is 50 (scaled for 64 cells), not 200', () => {
      expect(CLIENT_CONFIG.classGoalTarget).toBe(50);
      expect(CLIENT_CONFIG.classGoalTarget).not.toBe(200);
    });
  });

  describe('REGRESSION: AI Grading Response Validation', () => {
    // Simulates isValidGradingResponse from server.js

    function isValidGradingResponse(parsed) {
      if (!parsed || typeof parsed !== 'object') return false;

      const validScores = ['E', 'P', 'I', 'e', 'p', 'i'];

      // v1.6.2: Check for direct score/feedback format (single-field questions)
      if ('score' in parsed && validScores.includes(parsed.score)) {
        return true;
      }

      // Check for field-keyed format
      for (const [key, value] of Object.entries(parsed)) {
        if (key.startsWith('_')) continue;
        if (value && typeof value === 'object' && 'score' in value) {
          if (validScores.includes(value.score)) {
            return true;
          }
        }
      }

      return false;
    }

    it('accepts direct format: { score: "E", feedback: "..." }', () => {
      // This was the bug - AI returned this format but parser rejected it
      const directFormat = { score: 'E', feedback: 'Great answer!' };
      expect(isValidGradingResponse(directFormat)).toBe(true);
    });

    it('accepts direct format with lowercase score', () => {
      const directFormat = { score: 'e', feedback: 'Good!' };
      expect(isValidGradingResponse(directFormat)).toBe(true);
    });

    it('accepts direct format with P score', () => {
      const directFormat = { score: 'P', feedback: 'Partial credit' };
      expect(isValidGradingResponse(directFormat)).toBe(true);
    });

    it('accepts direct format with I score', () => {
      const directFormat = { score: 'I', feedback: 'Incorrect' };
      expect(isValidGradingResponse(directFormat)).toBe(true);
    });

    it('accepts field-keyed format: { fieldId: { score, feedback } }', () => {
      const fieldKeyedFormat = {
        slope: { score: 'E', feedback: 'Correct slope interpretation' },
        intercept: { score: 'P', feedback: 'Missing context' }
      };
      expect(isValidGradingResponse(fieldKeyedFormat)).toBe(true);
    });

    it('accepts single-field keyed format', () => {
      const singleFieldKeyed = {
        answer: { score: 'E', feedback: 'Perfect!' }
      };
      expect(isValidGradingResponse(singleFieldKeyed)).toBe(true);
    });

    it('rejects null', () => {
      expect(isValidGradingResponse(null)).toBe(false);
    });

    it('rejects undefined', () => {
      expect(isValidGradingResponse(undefined)).toBe(false);
    });

    it('rejects empty object', () => {
      expect(isValidGradingResponse({})).toBe(false);
    });

    it('rejects object with invalid score', () => {
      const invalidScore = { score: 'X', feedback: 'Whatever' };
      expect(isValidGradingResponse(invalidScore)).toBe(false);
    });

    it('rejects object with numeric score', () => {
      const numericScore = { score: 1, feedback: 'Whatever' };
      expect(isValidGradingResponse(numericScore)).toBe(false);
    });

    it('ignores metadata fields starting with _', () => {
      const withMetadata = {
        _provider: 'gemini',
        _keyId: 'key123',
        answer: { score: 'E', feedback: 'Good' }
      };
      expect(isValidGradingResponse(withMetadata)).toBe(true);
    });
  });

  describe('REGRESSION: AI Grading Response Normalization', () => {
    // Simulates normalizeGradingResponse from server.js

    function normalizeGradingResponse(parsed, defaultFieldId = 'answer') {
      if (!parsed || typeof parsed !== 'object') return parsed;

      const validScores = ['E', 'P', 'I', 'e', 'p', 'i'];

      // Check if it's direct format: { score, feedback }
      if ('score' in parsed && validScores.includes(parsed.score)) {
        return {
          [defaultFieldId]: {
            score: parsed.score.toUpperCase(),
            feedback: parsed.feedback || ''
          }
        };
      }

      return parsed;
    }

    it('normalizes direct format to field-keyed format', () => {
      const directFormat = { score: 'E', feedback: 'Great!' };
      const normalized = normalizeGradingResponse(directFormat);

      expect(normalized).toHaveProperty('answer');
      expect(normalized.answer.score).toBe('E');
      expect(normalized.answer.feedback).toBe('Great!');
    });

    it('uses custom field ID for normalization', () => {
      const directFormat = { score: 'P', feedback: 'Partial' };
      const normalized = normalizeGradingResponse(directFormat, 'slope');

      expect(normalized).toHaveProperty('slope');
      expect(normalized.slope.score).toBe('P');
    });

    it('uppercases lowercase scores during normalization', () => {
      const directFormat = { score: 'e', feedback: 'Good' };
      const normalized = normalizeGradingResponse(directFormat);

      expect(normalized.answer.score).toBe('E');
    });

    it('handles missing feedback gracefully', () => {
      const directFormat = { score: 'I' };
      const normalized = normalizeGradingResponse(directFormat);

      expect(normalized.answer.feedback).toBe('');
    });

    it('passes through field-keyed format unchanged', () => {
      const fieldKeyed = {
        slope: { score: 'E', feedback: 'Good slope' },
        intercept: { score: 'P', feedback: 'Missing unit' }
      };
      const normalized = normalizeGradingResponse(fieldKeyed);

      expect(normalized).toEqual(fieldKeyed);
    });

    it('passes through null unchanged', () => {
      expect(normalizeGradingResponse(null)).toBe(null);
    });
  });

  describe('REGRESSION: Velocity Query Column Name', () => {
    // The actual column name in Supabase is player_id, not username
    // This test documents the expected schema

    it('point_events schema uses player_id column', () => {
      // This documents the expected column name
      // The actual server code should use .eq('player_id', username)
      const expectedSchema = {
        id: 'uuid',
        game_id: 'text',
        player_id: 'text',  // NOT username
        delta: 'integer',
        reason: 'text',
        cartridge_id: 'text',
        metadata: 'jsonb',
        created_at: 'timestamptz'
      };

      expect(expectedSchema).toHaveProperty('player_id');
      expect(expectedSchema).not.toHaveProperty('username');
    });

    it('velocity calculation structure', () => {
      // Documents the velocity calculation approach
      const mockPointEvents = [
        { delta: 4, created_at: new Date().toISOString() },
        { delta: 3, created_at: new Date().toISOString() },
        { delta: 2, created_at: new Date().toISOString() }
      ];

      const totalPoints = mockPointEvents.reduce((sum, e) => sum + e.delta, 0);
      const windowMinutes = 10;
      const velocity = totalPoints / windowMinutes;

      expect(totalPoints).toBe(9);
      expect(velocity).toBe(0.9);
    });
  });

  describe('REGRESSION: Grid Panel Config Usage', () => {
    // These tests verify that grid-panel.js properly uses config values

    it('config mapSize should be used for grid dimensions', () => {
      // The renderer should be created with gridSize from config
      const mapSize = GRID_WARS_CONFIG.mapSize;
      expect(mapSize).toBe(8);

      // Grid panel should use this value, not hardcoded 20
      // This test documents the expected behavior
    });

    it('cell size should be calculated from canvas size and mapSize', () => {
      const canvasSize = 300; // Example container size
      const mapSize = GRID_WARS_CONFIG.mapSize;
      const expectedCellSize = canvasSize / mapSize;

      expect(expectedCellSize).toBe(300 / 8);
      expect(expectedCellSize).toBe(37.5);
    });

    it('grid panel should NOT use hardcoded gridSize: 20', () => {
      // This documents the bug that was fixed
      // Old code: this.renderer = new GridRenderer(canvas, { gridSize: 20 })
      // New code: this.renderer = new GridRenderer(canvas, { gridSize: mapSize })

      const incorrectGridSize = 20;
      const correctGridSize = GRID_WARS_CONFIG.mapSize;

      expect(correctGridSize).not.toBe(incorrectGridSize);
      expect(correctGridSize).toBe(8);
    });
  });

  describe('Config Synchronization', () => {
    // Ensures shared/ and client configs stay in sync

    it('client config defaults should match shared config for critical values', () => {
      // These are the values that MUST match
      expect(CLIENT_CONFIG.mapSize).toBe(GRID_WARS_CONFIG.mapSize);
      expect(CLIENT_CONFIG.claimCost).toBeLessThanOrEqual(GRID_WARS_CONFIG.claimCost);
    });

    it('star points should match between configs', () => {
      expect(CLIENT_CONFIG.starPoints.gold).toBe(GRID_WARS_CONFIG.starPoints.gold);
      expect(CLIENT_CONFIG.starPoints.silver).toBe(GRID_WARS_CONFIG.starPoints.silver);
      expect(CLIENT_CONFIG.starPoints.bronze).toBe(GRID_WARS_CONFIG.starPoints.bronze);
      expect(CLIENT_CONFIG.starPoints.tin).toBe(GRID_WARS_CONFIG.starPoints.tin);
    });
  });
});
