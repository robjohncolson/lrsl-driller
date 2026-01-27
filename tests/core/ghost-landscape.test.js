/**
 * Tests for Ghost Landscape (Phase 5)
 * Tests multi-ghost clustering, node glow, overview camera, and leaderboard parsing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateClusterPositions,
  calculateNodeGlowIntensity,
  calculateOverviewCamera,
  parseLeaderboardData,
  CLUSTER_RADIUS,
  VERTICAL_SPACING,
  GHOSTS_PER_RING,
  CLASS_VIEW_GHOST_SCALE,
  CLASS_VIEW_OPACITY_FACTOR,
  MAX_DISPLAYED_GHOSTS,
  GHOST_HEIGHT_OFFSET
} from '../../platform/core/ghost-maze-renderer.js';

describe('Ghost Landscape (Phase 5)', () => {

  describe('calculateClusterPositions', () => {

    const baseNodePosition = { x: 0, y: 10, z: 0 };

    it('centers single ghost on node', () => {
      const ghosts = [{ username: 'student1' }];
      const positions = calculateClusterPositions(ghosts, baseNodePosition);

      expect(positions).toHaveLength(1);
      expect(positions[0].x).toBe(baseNodePosition.x);
      expect(positions[0].y).toBe(baseNodePosition.y + GHOST_HEIGHT_OFFSET);
      expect(positions[0].z).toBe(baseNodePosition.z);
    });

    it('arranges two ghosts in circle around node', () => {
      const ghosts = [{ username: 'a' }, { username: 'b' }];
      const positions = calculateClusterPositions(ghosts, baseNodePosition);

      expect(positions).toHaveLength(2);

      // Both should be at same height
      expect(positions[0].y).toBe(positions[1].y);

      // Should be spread apart horizontally
      const dist = Math.sqrt(
        Math.pow(positions[0].x - positions[1].x, 2) +
        Math.pow(positions[0].z - positions[1].z, 2)
      );
      expect(dist).toBeGreaterThan(0);
    });

    it('arranges six ghosts in circle (max per ring)', () => {
      const ghosts = Array(6).fill(null).map((_, i) => ({ username: `s${i}` }));
      const positions = calculateClusterPositions(ghosts, baseNodePosition);

      expect(positions).toHaveLength(6);

      // All should be at same height (first ring)
      const firstHeight = positions[0].y;
      positions.forEach(pos => {
        expect(pos.y).toBe(firstHeight);
      });

      // Each should be at approximately CLUSTER_RADIUS from center
      positions.forEach(pos => {
        const distFromCenter = Math.sqrt(
          Math.pow(pos.x - baseNodePosition.x, 2) +
          Math.pow(pos.z - baseNodePosition.z, 2)
        );
        expect(distFromCenter).toBeCloseTo(CLUSTER_RADIUS, 1);
      });
    });

    it('creates second ring for 7+ ghosts', () => {
      const ghosts = Array(7).fill(null).map((_, i) => ({ username: `s${i}` }));
      const positions = calculateClusterPositions(ghosts, baseNodePosition);

      expect(positions).toHaveLength(7);

      // First 6 should be at first ring height
      const ring1Height = positions[0].y;
      for (let i = 0; i < 6; i++) {
        expect(positions[i].y).toBe(ring1Height);
      }

      // 7th ghost should be higher (second ring)
      expect(positions[6].y).toBeGreaterThan(ring1Height);
      expect(positions[6].y).toBeCloseTo(ring1Height + VERTICAL_SPACING, 2);
    });

    it('creates multiple rings for large groups', () => {
      const ghostCount = 15;
      const ghosts = Array(ghostCount).fill(null).map((_, i) => ({ username: `s${i}` }));
      const positions = calculateClusterPositions(ghosts, baseNodePosition);

      expect(positions).toHaveLength(ghostCount);

      // Ring 0: indices 0-5
      // Ring 1: indices 6-11
      // Ring 2: indices 12-14

      const ring0Height = positions[0].y;
      const ring1Height = positions[6].y;
      const ring2Height = positions[12].y;

      expect(ring1Height).toBeGreaterThan(ring0Height);
      expect(ring2Height).toBeGreaterThan(ring1Height);
    });

    it('expands radius for outer rings', () => {
      const ghosts = Array(12).fill(null).map((_, i) => ({ username: `s${i}` }));
      const positions = calculateClusterPositions(ghosts, baseNodePosition);

      // Measure radius of first ring ghost
      const ring0Radius = Math.sqrt(
        Math.pow(positions[0].x - baseNodePosition.x, 2) +
        Math.pow(positions[0].z - baseNodePosition.z, 2)
      );

      // Measure radius of second ring ghost
      const ring1Radius = Math.sqrt(
        Math.pow(positions[6].x - baseNodePosition.x, 2) +
        Math.pow(positions[6].z - baseNodePosition.z, 2)
      );

      // Second ring should have larger radius
      expect(ring1Radius).toBeGreaterThan(ring0Radius);
    });

    it('handles empty ghost array', () => {
      const positions = calculateClusterPositions([], baseNodePosition);
      expect(positions).toHaveLength(0);
    });

    it('positions are distinct for all ghosts', () => {
      const ghosts = Array(20).fill(null).map((_, i) => ({ username: `s${i}` }));
      const positions = calculateClusterPositions(ghosts, baseNodePosition);

      // Check no two positions are identical
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const sameX = positions[i].x === positions[j].x;
          const sameY = positions[i].y === positions[j].y;
          const sameZ = positions[i].z === positions[j].z;
          expect(sameX && sameY && sameZ).toBe(false);
        }
      }
    });

  });

  describe('calculateNodeGlowIntensity', () => {

    it('returns 1.0 for empty node', () => {
      expect(calculateNodeGlowIntensity(0)).toBe(1.0);
    });

    it('returns 1.2 for 1-2 ghosts', () => {
      expect(calculateNodeGlowIntensity(1)).toBe(1.2);
      expect(calculateNodeGlowIntensity(2)).toBe(1.2);
    });

    it('returns 1.5 for 3-5 ghosts', () => {
      expect(calculateNodeGlowIntensity(3)).toBe(1.5);
      expect(calculateNodeGlowIntensity(4)).toBe(1.5);
      expect(calculateNodeGlowIntensity(5)).toBe(1.5);
    });

    it('returns 1.8 for 6-10 ghosts', () => {
      expect(calculateNodeGlowIntensity(6)).toBe(1.8);
      expect(calculateNodeGlowIntensity(8)).toBe(1.8);
      expect(calculateNodeGlowIntensity(10)).toBe(1.8);
    });

    it('returns 2.0 for 11+ ghosts', () => {
      expect(calculateNodeGlowIntensity(11)).toBe(2.0);
      expect(calculateNodeGlowIntensity(20)).toBe(2.0);
      expect(calculateNodeGlowIntensity(100)).toBe(2.0);
    });

    it('intensity increases monotonically with ghost count', () => {
      const testCounts = [0, 1, 3, 6, 11, 50];
      let prevIntensity = 0;

      for (const count of testCounts) {
        const intensity = calculateNodeGlowIntensity(count);
        expect(intensity).toBeGreaterThanOrEqual(prevIntensity);
        prevIntensity = intensity;
      }
    });

  });

  describe('calculateOverviewCamera', () => {

    it('returns default position for empty nodes map', () => {
      const camera = calculateOverviewCamera(new Map());

      expect(camera.position).toBeDefined();
      expect(camera.target).toBeDefined();
      expect(camera.position.x).toBeGreaterThan(0);
      expect(camera.position.y).toBeGreaterThan(0);
    });

    it('returns default position for null input', () => {
      const camera = calculateOverviewCamera(null);

      expect(camera.position).toBeDefined();
      expect(camera.target).toBeDefined();
    });

    it('centers target on maze', () => {
      const nodes = new Map();
      nodes.set('l1', { id: 'l1', position: { x: -10, y: 0, z: -10 } });
      nodes.set('l2', { id: 'l2', position: { x: 10, y: 20, z: 10 } });

      const camera = calculateOverviewCamera(nodes);

      // Target should be at center
      expect(camera.target.x).toBeCloseTo(0, 1);
      expect(camera.target.y).toBeCloseTo(10, 1);
      expect(camera.target.z).toBeCloseTo(0, 1);
    });

    it('positions camera far enough to see all nodes', () => {
      const nodes = new Map();
      nodes.set('l1', { id: 'l1', position: { x: -50, y: 0, z: -50 } });
      nodes.set('l2', { id: 'l2', position: { x: 50, y: 100, z: 50 } });

      const camera = calculateOverviewCamera(nodes);

      // Camera should be positioned outside the bounding box
      const maxCoord = 50;
      expect(Math.abs(camera.position.x)).toBeGreaterThan(maxCoord);
      expect(camera.position.y).toBeGreaterThan(50); // Above the maze
    });

    it('handles single node', () => {
      const nodes = new Map();
      nodes.set('l1', { id: 'l1', position: { x: 5, y: 10, z: 5 } });

      const camera = calculateOverviewCamera(nodes);

      // Target should be at the node
      expect(camera.target.x).toBeCloseTo(5, 1);
      expect(camera.target.y).toBeCloseTo(10, 1);
      expect(camera.target.z).toBeCloseTo(5, 1);

      // Camera should be offset
      expect(camera.position.x).not.toBe(camera.target.x);
      expect(camera.position.y).not.toBe(camera.target.y);
    });

    it('ignores nodes without positions', () => {
      const nodes = new Map();
      nodes.set('l1', { id: 'l1', position: { x: 0, y: 0, z: 0 } });
      nodes.set('l2', { id: 'l2', position: null }); // No position
      nodes.set('l3', { id: 'l3' }); // No position property

      const camera = calculateOverviewCamera(nodes);

      // Should calculate based only on l1
      expect(camera.target.x).toBeCloseTo(0, 1);
      expect(camera.target.y).toBeCloseTo(0, 1);
    });

  });

  describe('parseLeaderboardData', () => {

    const createMockNodes = () => {
      const nodes = new Map();
      nodes.set('l1', { id: 'l1', tier: 0, position: { x: 0, y: 0, z: 0 } });
      nodes.set('l2', { id: 'l2', tier: 1, position: { x: 0, y: 8, z: 0 } });
      nodes.set('l3', { id: 'l3', tier: 2, position: { x: 0, y: 16, z: 0 } });
      nodes.set('l4', { id: 'l4', tier: 3, position: { x: 0, y: 24, z: 0 } });
      return nodes;
    };

    it('returns empty array for null input', () => {
      expect(parseLeaderboardData(null, new Map())).toEqual([]);
    });

    it('returns empty array for non-array input', () => {
      expect(parseLeaderboardData('not an array', new Map())).toEqual([]);
    });

    it('returns original data when nodes map is empty', () => {
      const ghosts = [{ username: 'a', proficiency_score: 0.5 }];
      const result = parseLeaderboardData(ghosts, new Map());
      expect(result).toEqual(ghosts);
    });

    it('preserves existing currentLevel', () => {
      const nodes = createMockNodes();
      const ghosts = [{ username: 'a', currentLevel: 'l3', proficiency_score: 0.1 }];

      const result = parseLeaderboardData(ghosts, nodes);

      expect(result[0].currentLevel).toBe('l3');
    });

    it('estimates currentLevel from proficiency score', () => {
      const nodes = createMockNodes();
      const ghosts = [
        { username: 'beginner', proficiency_score: 0.0 },
        { username: 'advanced', proficiency_score: 1.0 }
      ];

      const result = parseLeaderboardData(ghosts, nodes);

      // Beginner should be at first level
      expect(result[0].currentLevel).toBe('l1');
      // Advanced should be at last level
      expect(result[1].currentLevel).toBe('l4');
    });

    it('handles mid-range proficiency scores', () => {
      const nodes = createMockNodes();
      const ghosts = [{ username: 'mid', proficiency_score: 0.5 }];

      const result = parseLeaderboardData(ghosts, nodes);

      // 0.5 proficiency with 4 nodes (indices 0-3) should be around index 1 or 2
      expect(['l2', 'l3']).toContain(result[0].currentLevel);
    });

    it('handles missing proficiency_score', () => {
      const nodes = createMockNodes();
      const ghosts = [{ username: 'unknown' }];

      const result = parseLeaderboardData(ghosts, nodes);

      // Should default to first level
      expect(result[0].currentLevel).toBe('l1');
    });

    it('preserves all original ghost properties', () => {
      const nodes = createMockNodes();
      const ghosts = [{
        username: 'test',
        proficiency_score: 0.5,
        total_interactions: 42,
        color: 'orange',
        opacity: 0.7,
        updated_at: '2026-01-27T10:00:00Z'
      }];

      const result = parseLeaderboardData(ghosts, nodes);

      expect(result[0].username).toBe('test');
      expect(result[0].total_interactions).toBe(42);
      expect(result[0].color).toBe('orange');
      expect(result[0].opacity).toBe(0.7);
      expect(result[0].currentLevel).toBeDefined();
    });

    it('handles multiple ghosts', () => {
      const nodes = createMockNodes();
      const ghosts = [
        { username: 'a', proficiency_score: 0.2 },
        { username: 'b', proficiency_score: 0.5 },
        { username: 'c', proficiency_score: 0.8 }
      ];

      const result = parseLeaderboardData(ghosts, nodes);

      expect(result).toHaveLength(3);
      result.forEach(ghost => {
        expect(ghost.currentLevel).toBeDefined();
        expect(nodes.has(ghost.currentLevel)).toBe(true);
      });
    });

  });

  describe('Exported constants', () => {

    it('CLUSTER_RADIUS is positive', () => {
      expect(CLUSTER_RADIUS).toBeGreaterThan(0);
    });

    it('VERTICAL_SPACING is positive', () => {
      expect(VERTICAL_SPACING).toBeGreaterThan(0);
    });

    it('GHOSTS_PER_RING is positive integer', () => {
      expect(GHOSTS_PER_RING).toBeGreaterThan(0);
      expect(Number.isInteger(GHOSTS_PER_RING)).toBe(true);
    });

    it('CLASS_VIEW_GHOST_SCALE is between 0 and 1', () => {
      expect(CLASS_VIEW_GHOST_SCALE).toBeGreaterThan(0);
      expect(CLASS_VIEW_GHOST_SCALE).toBeLessThanOrEqual(1);
    });

    it('CLASS_VIEW_OPACITY_FACTOR is between 0 and 1', () => {
      expect(CLASS_VIEW_OPACITY_FACTOR).toBeGreaterThan(0);
      expect(CLASS_VIEW_OPACITY_FACTOR).toBeLessThanOrEqual(1);
    });

    it('MAX_DISPLAYED_GHOSTS is reasonable', () => {
      expect(MAX_DISPLAYED_GHOSTS).toBeGreaterThanOrEqual(10);
      expect(MAX_DISPLAYED_GHOSTS).toBeLessThanOrEqual(200);
    });

    it('GHOST_HEIGHT_OFFSET is positive', () => {
      expect(GHOST_HEIGHT_OFFSET).toBeGreaterThan(0);
    });

  });

  describe('Class view visual specifications', () => {

    it('scaled ghost core radius is smaller than normal', () => {
      const normalCoreRadius = 0.8;
      const scaledCoreRadius = normalCoreRadius * CLASS_VIEW_GHOST_SCALE;
      expect(scaledCoreRadius).toBeLessThan(normalCoreRadius);
    });

    it('scaled ghost glow radius is smaller than normal', () => {
      const normalGlowRadius = 1.2;
      const scaledGlowRadius = normalGlowRadius * CLASS_VIEW_GHOST_SCALE;
      expect(scaledGlowRadius).toBeLessThan(normalGlowRadius);
    });

    it('class view opacity is reduced', () => {
      const baseOpacity = 0.7;
      const classViewOpacity = baseOpacity * CLASS_VIEW_OPACITY_FACTOR;
      expect(classViewOpacity).toBeLessThan(baseOpacity);
    });

  });

  describe('Clustering edge cases', () => {

    it('handles very large ghost count', () => {
      const ghosts = Array(100).fill(null).map((_, i) => ({ username: `s${i}` }));
      const nodePosition = { x: 0, y: 0, z: 0 };

      const positions = calculateClusterPositions(ghosts, nodePosition);

      expect(positions).toHaveLength(100);

      // All positions should be valid numbers
      positions.forEach(pos => {
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
        expect(typeof pos.z).toBe('number');
        expect(Number.isFinite(pos.x)).toBe(true);
        expect(Number.isFinite(pos.y)).toBe(true);
        expect(Number.isFinite(pos.z)).toBe(true);
      });
    });

    it('positions are deterministic (same input = same output)', () => {
      const ghosts = [{ username: 'a' }, { username: 'b' }, { username: 'c' }];
      const nodePosition = { x: 5, y: 10, z: 5 };

      const positions1 = calculateClusterPositions(ghosts, nodePosition);
      const positions2 = calculateClusterPositions(ghosts, nodePosition);

      expect(positions1).toEqual(positions2);
    });

    it('handles negative node coordinates', () => {
      const ghosts = [{ username: 'a' }, { username: 'b' }];
      const nodePosition = { x: -20, y: -5, z: -15 };

      const positions = calculateClusterPositions(ghosts, nodePosition);

      expect(positions).toHaveLength(2);
      // Positions should be relative to node position
      positions.forEach(pos => {
        expect(Number.isFinite(pos.x)).toBe(true);
        expect(Number.isFinite(pos.y)).toBe(true);
        expect(Number.isFinite(pos.z)).toBe(true);
      });
    });

  });

  describe('Glow intensity boundaries', () => {

    it('intensity changes at exact boundaries', () => {
      // Test boundary values
      expect(calculateNodeGlowIntensity(2)).toBe(1.2);
      expect(calculateNodeGlowIntensity(3)).toBe(1.5);
      expect(calculateNodeGlowIntensity(5)).toBe(1.5);
      expect(calculateNodeGlowIntensity(6)).toBe(1.8);
      expect(calculateNodeGlowIntensity(10)).toBe(1.8);
      expect(calculateNodeGlowIntensity(11)).toBe(2.0);
    });

    it('intensity is always between 1.0 and 2.0', () => {
      for (let i = 0; i <= 100; i++) {
        const intensity = calculateNodeGlowIntensity(i);
        expect(intensity).toBeGreaterThanOrEqual(1.0);
        expect(intensity).toBeLessThanOrEqual(2.0);
      }
    });

  });

  describe('Camera positioning math', () => {

    it('camera is positioned at approximately 45 degrees', () => {
      const nodes = new Map();
      nodes.set('l1', { id: 'l1', position: { x: 0, y: 0, z: 0 } });

      const camera = calculateOverviewCamera(nodes);

      // For 45 degrees, x and z components should be similar
      const xzRatio = Math.abs(camera.position.x / camera.position.z);
      expect(xzRatio).toBeGreaterThan(0.5);
      expect(xzRatio).toBeLessThan(2.0);
    });

    it('camera is above the maze', () => {
      const nodes = new Map();
      nodes.set('l1', { id: 'l1', position: { x: 0, y: 0, z: 0 } });
      nodes.set('l2', { id: 'l2', position: { x: 10, y: 50, z: 10 } });

      const camera = calculateOverviewCamera(nodes);

      // Camera Y should be higher than the maze center
      const centerY = (0 + 50) / 2;
      expect(camera.position.y).toBeGreaterThan(centerY);
    });

  });

});
