/**
 * Server API Integration Tests
 * Tests the Railway server endpoints to prevent regression
 *
 * Run with: npm test -- tests/server/api.test.js
 *
 * Note: These tests run against the production server by default.
 * Set TEST_SERVER_URL env var to test against a different server.
 */
import { describe, it, expect, beforeAll } from 'vitest';

const SERVER_URL = process.env.TEST_SERVER_URL || 'https://lrsl-driller-production.up.railway.app';

// Helper to make API requests
async function api(path, options = {}) {
  const response = await fetch(`${SERVER_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  return {
    status: response.status,
    data: await response.json().catch(() => null)
  };
}

describe('Server API', () => {
  // ==================== HEALTH CHECK ====================
  describe('Health Check', () => {
    it('GET / returns status ok', async () => {
      const { status, data } = await api('/');

      expect(status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.service).toBe('lsrl-trainer-server');
    });

    it('GET / includes version number', async () => {
      const { data } = await api('/');

      expect(data.version).toBeDefined();
      expect(data.version).toMatch(/^\d+\.\d+\.\d+$/); // semantic version format
    });
  });

  // ==================== VERSION ENDPOINT ====================
  describe('Version Endpoint', () => {
    it('GET /api/version returns version info', async () => {
      const { status, data } = await api('/api/version');

      expect(status).toBe(200);
      expect(data.version).toBeDefined();
      expect(data.message).toBeDefined();
    });

    it('version follows semantic versioning', async () => {
      const { data } = await api('/api/version');

      expect(data.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('message includes refresh instruction', async () => {
      const { data } = await api('/api/version');

      expect(data.message.toLowerCase()).toContain('refresh');
    });
  });

  // ==================== LEADERBOARD ENDPOINT ====================
  describe('Leaderboard Endpoint', () => {
    it('GET /api/leaderboard returns array', async () => {
      const { status, data } = await api('/api/leaderboard');

      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('leaderboard entries have required fields', async () => {
      const { data } = await api('/api/leaderboard?limit=1');

      if (data.length > 0) {
        const entry = data[0];
        expect(entry).toHaveProperty('username');
        expect(entry).toHaveProperty('gold');
        expect(entry).toHaveProperty('silver');
        expect(entry).toHaveProperty('bronze');
        expect(entry).toHaveProperty('tin');
        expect(entry).toHaveProperty('weighted_score');
      }
    });

    it('respects limit parameter', async () => {
      const { data } = await api('/api/leaderboard?limit=3');

      expect(data.length).toBeLessThanOrEqual(3);
    });

    it('supports period=all filter', async () => {
      const { status, data } = await api('/api/leaderboard?period=all');

      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('supports period=1h filter', async () => {
      const { status, data } = await api('/api/leaderboard?period=1h');

      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('leaderboard is sorted by weighted_score descending', async () => {
      const { data } = await api('/api/leaderboard?limit=10');

      if (data.length >= 2) {
        for (let i = 1; i < data.length; i++) {
          expect(data[i - 1].weighted_score).toBeGreaterThanOrEqual(data[i].weighted_score);
        }
      }
    });

    it('star counts are non-negative integers', async () => {
      const { data } = await api('/api/leaderboard?limit=5');

      for (const entry of data) {
        expect(entry.gold).toBeGreaterThanOrEqual(0);
        expect(entry.silver).toBeGreaterThanOrEqual(0);
        expect(entry.bronze).toBeGreaterThanOrEqual(0);
        expect(entry.tin).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(entry.gold)).toBe(true);
        expect(Number.isInteger(entry.silver)).toBe(true);
        expect(Number.isInteger(entry.bronze)).toBe(true);
        expect(Number.isInteger(entry.tin)).toBe(true);
      }
    });
  });

  // ==================== USERS ENDPOINT ====================
  describe('Users Endpoint', () => {
    it('GET /api/users returns array', async () => {
      const { status, data } = await api('/api/users');

      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('users have username field', async () => {
      const { data } = await api('/api/users');

      if (data.length > 0) {
        expect(data[0]).toHaveProperty('username');
      }
    });
  });

  // ==================== PROGRESS ENDPOINT ====================
  describe('Progress Endpoint', () => {
    it('GET /api/progress/:username returns user progress', async () => {
      // Use a known test username or skip if none exists
      const { data: users } = await api('/api/users');

      if (users.length > 0) {
        const testUser = users[0].username;
        const { status, data } = await api(`/api/progress/${testUser}`);

        expect(status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
      }
    });

    it('returns empty array for non-existent user', async () => {
      const { status, data } = await api('/api/progress/nonexistent_user_12345');

      expect(status).toBe(200);
      expect(data).toEqual([]);
    });
  });

  // ==================== AI GRADING ENDPOINT ====================
  describe('AI Grading Endpoint', () => {
    it('POST /api/ai/grade requires body', async () => {
      const { status } = await api('/api/ai/grade', {
        method: 'POST',
        body: JSON.stringify({})
      });

      // Should return error for empty body
      expect(status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/ai/grade validates required fields', async () => {
      const { status, data } = await api('/api/ai/grade', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          answer: 'test'
        })
      });

      expect(status).toBeGreaterThanOrEqual(400);
    });
  });

  // ==================== ERROR HANDLING ====================
  describe('Error Handling', () => {
    it('returns 404 for unknown endpoints', async () => {
      const response = await fetch(`${SERVER_URL}/api/nonexistent`);

      expect(response.status).toBe(404);
    });

    it('handles malformed JSON gracefully', async () => {
      const response = await fetch(`${SERVER_URL}/api/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json'
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
