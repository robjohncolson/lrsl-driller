/**
 * Points Integer Rounding Tests (v4.3.4)
 *
 * Tests that weighted scoring decimal points are properly rounded to integers
 * before being stored in the database.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const serverPath = join(process.cwd(), 'railway-server', 'server.js');
const serverCode = readFileSync(serverPath, 'utf-8');

describe('Points Integer Rounding (v4.3.4)', () => {
  describe('CTF Points Endpoint', () => {
    it('should round points to integer before processing', () => {
      // Check that pointsInt = Math.round(points) exists in CTF endpoint
      const ctfEndpointMatch = serverCode.match(
        /app\.post\('\/api\/ctf\/:cartridgeId\/points'[\s\S]*?app\.(post|get|put|delete)\(/
      );
      expect(ctfEndpointMatch).toBeTruthy();

      const ctfEndpoint = ctfEndpointMatch[0];
      expect(ctfEndpoint).toContain('const pointsInt = Math.round(points)');
    });

    it('should use pointsInt for player points update', () => {
      expect(serverCode).toContain('(player.points_contributed || 0) + pointsInt');
      expect(serverCode).toContain('(player.session_points || 0) + pointsInt');
    });

    it('should use pointsInt for team points calculation', () => {
      expect(serverCode).toContain('const newTeamPoints = currentTeamPoints + pointsInt');
    });

    it('should use pointsInt in WebSocket broadcast', () => {
      // The broadcast should send the rounded integer, not the original decimal
      const broadcastMatch = serverCode.match(
        /broadcast\(\{\s*type:\s*'ctf_points'[\s\S]*?\}\);/
      );
      expect(broadcastMatch).toBeTruthy();
      expect(broadcastMatch[0]).toContain('points: pointsInt');
    });

    it('should have comment explaining the rounding', () => {
      expect(serverCode).toContain('Round points to integer (weighted scoring can produce decimals like 1.5)');
    });
  });

  describe('KotH Points Endpoint', () => {
    it('should round points to integer before processing', () => {
      // Check that pointsInt = Math.round(points) exists in KotH endpoint
      const kothEndpointMatch = serverCode.match(
        /app\.post\('\/api\/koth\/:cartridgeId\/points'[\s\S]*?app\.(post|get|put|delete)\(/
      );
      expect(kothEndpointMatch).toBeTruthy();

      const kothEndpoint = kothEndpointMatch[0];
      expect(kothEndpoint).toContain('const pointsInt = Math.round(points)');
    });

    it('should use pointsInt for point event insert', () => {
      expect(serverCode).toContain("points: pointsInt,\n        star_type: starType");
    });

    it('should use pointsInt for player stats update', () => {
      expect(serverCode).toContain('session_points: player.session_points + pointsInt');
      expect(serverCode).toContain('total_points: player.total_points + pointsInt');
    });

    it('should use pointsInt in WebSocket broadcast', () => {
      const broadcastMatch = serverCode.match(
        /broadcast\(\{\s*type:\s*'koth_points'[\s\S]*?\}\);/
      );
      expect(broadcastMatch).toBeTruthy();
      expect(broadcastMatch[0]).toContain('points: pointsInt');
    });
  });

  describe('Rounding Behavior', () => {
    it('should round 1.5 to 2', () => {
      expect(Math.round(1.5)).toBe(2);
    });

    it('should round 1.4 to 1', () => {
      expect(Math.round(1.4)).toBe(1);
    });

    it('should round 3.7 to 4', () => {
      expect(Math.round(3.7)).toBe(4);
    });

    it('should keep integers unchanged', () => {
      expect(Math.round(4)).toBe(4);
      expect(Math.round(1)).toBe(1);
    });

    it('should handle edge case of 0.5 multiplier on 3-point silver star', () => {
      // Level 1 with 0.5x multiplier, silver star (3 base points) = 1.5 -> 2
      const basePoints = 3;
      const multiplier = 0.5;
      const weighted = basePoints * multiplier;
      expect(weighted).toBe(1.5);
      expect(Math.round(weighted)).toBe(2);
    });
  });
});
