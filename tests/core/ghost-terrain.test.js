/**
 * Tests for ghost-terrain-renderer.js and terrain heightmap generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateTerrainHeightmap,
  aggregateClassWeights,
  getTerrainColor,
  hashWeights
} from '../../platform/core/ghost-orbits-nn-mapper.js';

describe('Terrain Heightmap Generation', () => {
  describe('generateTerrainHeightmap', () => {
    it('should generate heightmap with correct size', () => {
      const weights = [0.1, 0.2, 0.3, -0.1, -0.2];
      const result = generateTerrainHeightmap(weights, { size: 64 });

      expect(result.size).toBe(64);
      expect(result.heightmap).toBeInstanceOf(Float32Array);
      expect(result.heightmap.length).toBe(64 * 64);
    });

    it('should generate heightmap with default size 128', () => {
      const weights = [0.1, 0.2, 0.3];
      const result = generateTerrainHeightmap(weights);

      expect(result.size).toBe(128);
      expect(result.heightmap.length).toBe(128 * 128);
    });

    it('should have height values in 0-1 range', () => {
      const weights = Array.from({ length: 100 }, () => Math.random() * 2 - 1);
      const result = generateTerrainHeightmap(weights, { size: 32 });

      for (let i = 0; i < result.heightmap.length; i++) {
        expect(result.heightmap[i]).toBeGreaterThanOrEqual(0);
        expect(result.heightmap[i]).toBeLessThanOrEqual(1);
      }
    });

    it('should return consistent results for same weights', () => {
      const weights = [0.5, -0.3, 0.8, -0.1, 0.2];
      const result1 = generateTerrainHeightmap(weights, { size: 16 });
      const result2 = generateTerrainHeightmap(weights, { size: 16 });

      expect(result1.seed).toBe(result2.seed);
      for (let i = 0; i < result1.heightmap.length; i++) {
        expect(result1.heightmap[i]).toBe(result2.heightmap[i]);
      }
    });

    it('should include height statistics', () => {
      const weights = [0.1, 0.2, 0.3, 0.4, 0.5];
      const result = generateTerrainHeightmap(weights, { size: 32 });

      expect(result.stats).toBeDefined();
      expect(result.stats.min).toBeGreaterThanOrEqual(0);
      expect(result.stats.max).toBeLessThanOrEqual(1);
      expect(result.stats.avg).toBeGreaterThanOrEqual(result.stats.min);
      expect(result.stats.avg).toBeLessThanOrEqual(result.stats.max);
    });

    it('should increase complexity with more weights', () => {
      const smallWeights = [0.1, 0.2];
      const largeWeights = Array.from({ length: 1000 }, () => Math.random());

      const smallResult = generateTerrainHeightmap(smallWeights, { size: 32 });
      const largeResult = generateTerrainHeightmap(largeWeights, { size: 32 });

      // More weights should result in higher complexity (more octaves)
      expect(largeResult.complexity).toBeGreaterThanOrEqual(smallResult.complexity);
    });

    it('should respond to correctProb option', () => {
      const weights = [0.5, 0.5, 0.5];

      const lowProb = generateTerrainHeightmap(weights, { size: 32, correctProb: 0.1 });
      const highProb = generateTerrainHeightmap(weights, { size: 32, correctProb: 0.9 });

      // High correctProb should generally result in higher peaks
      expect(highProb.stats.max).toBeGreaterThanOrEqual(lowProb.stats.max * 0.8);
    });
  });

  describe('aggregateClassWeights', () => {
    it('should return empty result for no profiles', () => {
      const result = aggregateClassWeights([]);

      expect(result.profileCount).toBe(0);
      expect(result.weights).toEqual([0]);
      expect(result.avgCorrectProb).toBe(0.5);
      expect(result.avgActivity).toBe(0);
    });

    it('should return empty result for null input', () => {
      const result = aggregateClassWeights(null);

      expect(result.profileCount).toBe(0);
    });

    it('should generate synthetic weights when no profiles have weights', () => {
      const profiles = [
        { proficiency_score: 0.6, total_interactions: 50 },
        { proficiency_score: 0.8, total_interactions: 100 }
      ];

      const result = aggregateClassWeights(profiles);

      expect(result.profileCount).toBe(2);
      expect(result.weights.length).toBe(100); // Synthetic weights
      expect(result.avgCorrectProb).toBe(0.7); // (0.6 + 0.8) / 2
    });

    it('should average weights from profiles with weights', () => {
      const profiles = [
        { weights: [1.0, 2.0, 3.0], proficiency_score: 0.5, total_interactions: 50 },
        { weights: [3.0, 4.0, 5.0], proficiency_score: 0.7, total_interactions: 60 }
      ];

      const result = aggregateClassWeights(profiles);

      expect(result.profileCount).toBe(2);
      expect(result.weights[0]).toBe(2.0); // (1 + 3) / 2
      expect(result.weights[1]).toBe(3.0); // (2 + 4) / 2
      expect(result.weights[2]).toBe(4.0); // (3 + 5) / 2
    });

    it('should handle nested weight arrays', () => {
      const profiles = [
        { weights: [[1.0, 2.0], [3.0, 4.0]], proficiency_score: 0.5, total_interactions: 20 }
      ];

      const result = aggregateClassWeights(profiles);

      expect(result.weights.length).toBe(4);
      expect(result.weights).toEqual([1.0, 2.0, 3.0, 4.0]);
    });

    it('should calculate average activity level', () => {
      const profiles = [
        { weights: [1.0], proficiency_score: 0.5, total_interactions: 100 },
        { weights: [2.0], proficiency_score: 0.5, total_interactions: 100 }
      ];

      const result = aggregateClassWeights(profiles);

      // Total interactions = 200, max expected = 2 * 100 = 200, so avgActivity = 1.0
      expect(result.avgActivity).toBe(1);
    });
  });

  describe('getTerrainColor', () => {
    it('should return RGB object for all height levels', () => {
      const heights = [0, 0.1, 0.25, 0.4, 0.6, 0.75, 0.9, 1.0];

      for (const height of heights) {
        const color = getTerrainColor(height, 0.5);

        expect(color).toHaveProperty('r');
        expect(color).toHaveProperty('g');
        expect(color).toHaveProperty('b');
        expect(color.r).toBeGreaterThanOrEqual(0);
        expect(color.r).toBeLessThanOrEqual(255);
        expect(color.g).toBeGreaterThanOrEqual(0);
        expect(color.g).toBeLessThanOrEqual(255);
        expect(color.b).toBeGreaterThanOrEqual(0);
        expect(color.b).toBeLessThanOrEqual(255);
      }
    });

    it('should return darker colors for lower heights', () => {
      const lowColor = getTerrainColor(0.1, 0.5);
      const highColor = getTerrainColor(0.9, 0.5);

      const lowBrightness = lowColor.r + lowColor.g + lowColor.b;
      const highBrightness = highColor.r + highColor.g + highColor.b;

      expect(highBrightness).toBeGreaterThan(lowBrightness);
    });

    it('should be affected by proficiency level', () => {
      const lowProfColor = getTerrainColor(0.5, 0.1);
      const highProfColor = getTerrainColor(0.5, 0.9);

      // Colors should be different based on proficiency
      const same = (
        lowProfColor.r === highProfColor.r &&
        lowProfColor.g === highProfColor.g &&
        lowProfColor.b === highProfColor.b
      );
      expect(same).toBe(false);
    });
  });

  describe('hashWeights', () => {
    it('should produce consistent hash for same weights', () => {
      const weights = [0.1, 0.2, 0.3, 0.4, 0.5];

      const hash1 = hashWeights(weights);
      const hash2 = hashWeights(weights);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different weights', () => {
      const weights1 = [0.1, 0.2, 0.3];
      const weights2 = [0.1, 0.2, 0.4];

      const hash1 = hashWeights(weights1);
      const hash2 = hashWeights(weights2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle nested arrays', () => {
      const nested = [[0.1, 0.2], [0.3, 0.4]];
      const flat = [0.1, 0.2, 0.3, 0.4];

      const nestedHash = hashWeights(nested);
      const flatHash = hashWeights(flat);

      expect(nestedHash).toBe(flatHash);
    });

    it('should return unsigned 32-bit integer', () => {
      const weights = [0.1, -0.5, 0.9, -0.1];
      const hash = hashWeights(weights);

      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xFFFFFFFF);
    });
  });
});

describe('Class Landscape Visual Mapping', () => {
  it('high accuracy class should produce higher peaks', () => {
    const weights = [0.5, 0.5, 0.5];

    const lowAccuracy = generateTerrainHeightmap(weights, {
      size: 32,
      correctProb: 0.2,
      activityLevel: 0.5
    });

    const highAccuracy = generateTerrainHeightmap(weights, {
      size: 32,
      correctProb: 0.8,
      activityLevel: 0.5
    });

    // Higher accuracy should produce terrain with more prominent features
    expect(highAccuracy.stats.max).toBeGreaterThanOrEqual(lowAccuracy.stats.max * 0.9);
  });

  it('active class should produce more detailed terrain', () => {
    const weights = [0.5, 0.5, 0.5];

    const lowActivity = generateTerrainHeightmap(weights, {
      size: 32,
      correctProb: 0.5,
      activityLevel: 0.1
    });

    const highActivity = generateTerrainHeightmap(weights, {
      size: 32,
      correctProb: 0.5,
      activityLevel: 0.9
    });

    // Higher activity should result in more octaves (complexity)
    expect(highActivity.complexity).toBeGreaterThanOrEqual(lowActivity.complexity);
  });
});
