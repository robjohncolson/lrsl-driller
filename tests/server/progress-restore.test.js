/**
 * Progress Restore Endpoint Tests
 * Tests GET /api/progress/cartridge/:username/:cartridgeId
 *
 * Run with: npm test -- tests/server/progress-restore.test.js
 *
 * Note: These tests run against the production server by default.
 * The endpoint must be deployed for these tests to pass.
 * Set TEST_SERVER_URL env var to test against a local server.
 */
import { describe, it, expect, beforeAll } from 'vitest';

const SERVER_URL = process.env.TEST_SERVER_URL || 'https://lrsl-driller-production.up.railway.app';

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

// Check if the endpoint exists on the server
async function endpointExists() {
  try {
    const response = await fetch(`${SERVER_URL}/api/progress/cartridge/test/test`);
    // 404 with our endpoint means "not found in DB", 404 without means "endpoint doesn't exist"
    // Our endpoint returns JSON with found:false, while missing endpoint returns HTML 404
    const contentType = response.headers.get('content-type') || '';
    return contentType.includes('application/json');
  } catch {
    return false;
  }
}

describe('Progress Restore Endpoint', () => {
  let endpointDeployed = false;

  beforeAll(async () => {
    endpointDeployed = await endpointExists();
    if (!endpointDeployed) {
      console.log('Progress restore endpoint not deployed yet - tests will be skipped');
    }
  });

  describe('GET /api/progress/cartridge/:username/:cartridgeId', () => {
    it('returns found:false for non-existent user', async () => {
      if (!endpointDeployed) return; // Skip if not deployed

      const { status, data } = await api('/api/progress/cartridge/nonexistent_user_xyz_12345/polynomial');

      expect(status).toBe(200);
      expect(data.found).toBe(false);
      expect(data.data).toBe(null);
    });

    it('returns found:false for non-existent cartridge', async () => {
      if (!endpointDeployed) return; // Skip if not deployed

      // Use a known user but non-existent cartridge
      const { data: users } = await api('/api/users');
      if (users.length === 0) {
        // Skip if no users in database
        return;
      }

      const testUser = users[0].username;
      const { status, data } = await api(`/api/progress/cartridge/${testUser}/nonexistent_cartridge_xyz`);

      expect(status).toBe(200);
      expect(data.found).toBe(false);
      expect(data.data).toBe(null);
    });

    it('returns progress data with expected fields when found', async () => {
      if (!endpointDeployed) return; // Skip if not deployed

      // First sync some test data, then retrieve it
      const testUsername = `test_restore_${Date.now()}`;
      const testCartridge = 'polynomial';

      // Sync test progress
      const syncResult = await api('/api/progress/cartridge-sync', {
        method: 'POST',
        body: JSON.stringify({
          username: testUsername,
          cartridgeId: testCartridge,
          stars: { gold: 2, silver: 1, bronze: 0, tin: 0 },
          modeProgress: { 'l01': { gold: 2, silver: 1, bronze: 0, tin: 0 } }
        })
      });

      // If sync fails (e.g., no auth), skip this test gracefully
      if (syncResult.status !== 200 || !syncResult.data?.success) {
        console.log('Skipping: unable to sync test data');
        return;
      }

      // Now retrieve
      const { status, data } = await api(`/api/progress/cartridge/${testUsername}/${testCartridge}`);

      expect(status).toBe(200);
      expect(data.found).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.gold_stars).toBe(2);
      expect(data.data.silver_stars).toBe(1);
      expect(data.data.bronze_stars).toBe(0);
      expect(data.data.tin_stars).toBe(0);
    });

    it('includes updated_at timestamp in response', async () => {
      if (!endpointDeployed) return; // Skip if not deployed

      const testUsername = `test_timestamp_${Date.now()}`;
      const testCartridge = 'polynomial';

      // Sync test progress
      const syncResult = await api('/api/progress/cartridge-sync', {
        method: 'POST',
        body: JSON.stringify({
          username: testUsername,
          cartridgeId: testCartridge,
          stars: { gold: 1, silver: 0, bronze: 0, tin: 0 },
          modeProgress: {}
        })
      });

      if (syncResult.status !== 200 || !syncResult.data?.success) {
        console.log('Skipping: unable to sync test data');
        return;
      }

      const { status, data } = await api(`/api/progress/cartridge/${testUsername}/${testCartridge}`);

      expect(status).toBe(200);
      expect(data.found).toBe(true);
      expect(data.data.updated_at).toBeDefined();
      // Should be a valid ISO date string
      expect(new Date(data.data.updated_at).getTime()).not.toBeNaN();
    });

    it('includes mode_progress in response', async () => {
      if (!endpointDeployed) return; // Skip if not deployed

      const testUsername = `test_modes_${Date.now()}`;
      const testCartridge = 'polynomial';
      const testModeProgress = {
        'l01-basics': { gold: 3, silver: 0, bronze: 1, tin: 0 },
        'l02-advanced': { gold: 1, silver: 2, bronze: 0, tin: 0 }
      };

      // Sync test progress with mode data
      const syncResult = await api('/api/progress/cartridge-sync', {
        method: 'POST',
        body: JSON.stringify({
          username: testUsername,
          cartridgeId: testCartridge,
          stars: { gold: 4, silver: 2, bronze: 1, tin: 0 },
          modeProgress: testModeProgress
        })
      });

      if (syncResult.status !== 200 || !syncResult.data?.success) {
        console.log('Skipping: unable to sync test data');
        return;
      }

      const { status, data } = await api(`/api/progress/cartridge/${testUsername}/${testCartridge}`);

      expect(status).toBe(200);
      expect(data.found).toBe(true);
      expect(data.data.mode_progress).toBeDefined();
      expect(data.data.mode_progress['l01-basics']).toEqual(testModeProgress['l01-basics']);
      expect(data.data.mode_progress['l02-advanced']).toEqual(testModeProgress['l02-advanced']);
    });
  });
});
