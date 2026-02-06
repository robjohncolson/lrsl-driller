/**
 * Asset Coordination Tests
 * Tests server-side P2P asset stampede prevention logic
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Asset Coordination', () => {
  let clients;
  let assetLeases;
  let assetHolders;
  const LEASE_TIMEOUT_MS = 15000;

  function sendToUser(targetUsername, message) {
    const payload = JSON.stringify(message);
    for (const [ws, data] of clients) {
      if (ws.readyState === 1 && data.username === targetUsername) {
        ws.send(payload);
        return true;
      }
    }
    return false;
  }

  function createMockWs(username) {
    const ws = {
      readyState: 1,
      send: vi.fn(),
      terminate: vi.fn()
    };
    clients.set(ws, { username, lastHeartbeat: Date.now() });
    return ws;
  }

  // Replicate server logic for testing
  function handleAssetNeed(ws, message) {
    const client = clients.get(ws);
    if (!client?.username) return;
    const { fileKey } = message;
    if (!fileKey) return;

    const holders = assetHolders.get(fileKey);
    if (holders && holders.size > 0) {
      const peers = [...holders].filter(u => u !== client.username);
      if (peers.length > 0) {
        ws.send(JSON.stringify({ type: 'asset_available', fileKey, peers }));
        return;
      }
    }

    const lease = assetLeases.get(fileKey);
    if (lease && lease.leaseExpiry > Date.now()) {
      lease.waitQueue.push({ ws, username: client.username });
      ws.send(JSON.stringify({ type: 'asset_queued', fileKey, position: lease.waitQueue.length }));
      return;
    }

    assetLeases.set(fileKey, {
      assignee: client.username,
      leaseExpiry: Date.now() + LEASE_TIMEOUT_MS,
      waitQueue: []
    });
    ws.send(JSON.stringify({ type: 'asset_fetch_assigned', fileKey }));
  }

  function handleAssetHave(ws, message) {
    const client = clients.get(ws);
    if (!client?.username) return;
    const { fileKey, hash } = message;
    if (!fileKey) return;

    if (!assetHolders.has(fileKey)) assetHolders.set(fileKey, new Set());
    assetHolders.get(fileKey).add(client.username);

    const lease = assetLeases.get(fileKey);
    if (lease) {
      const peers = [...(assetHolders.get(fileKey) || [])];
      for (const waiter of lease.waitQueue) {
        try {
          if (waiter.ws.readyState === 1) {
            waiter.ws.send(JSON.stringify({ type: 'asset_available', fileKey, peers, hash }));
          }
        } catch { /* ignore */ }
      }
      assetLeases.delete(fileKey);
    }
  }

  function handleAssetQuery(ws, message) {
    const { fileKey } = message;
    if (!fileKey) return;
    const holders = assetHolders.get(fileKey);
    const peers = holders ? [...holders] : [];
    ws.send(JSON.stringify({ type: 'asset_holders', fileKey, peers }));
  }

  function cleanupAssetHoldersForUser(username) {
    for (const [fileKey, holders] of assetHolders) {
      holders.delete(username);
      if (holders.size === 0) assetHolders.delete(fileKey);
    }
    for (const [fileKey, lease] of assetLeases) {
      if (lease.assignee === username) {
        const nextWaiter = lease.waitQueue.shift();
        if (nextWaiter && nextWaiter.ws.readyState === 1) {
          assetLeases.set(fileKey, {
            assignee: nextWaiter.username,
            leaseExpiry: Date.now() + LEASE_TIMEOUT_MS,
            waitQueue: lease.waitQueue
          });
          nextWaiter.ws.send(JSON.stringify({ type: 'asset_fetch_assigned', fileKey }));
        } else {
          assetLeases.delete(fileKey);
        }
      }
    }
  }

  function cleanupAssetLeases() {
    const now = Date.now();
    for (const [fileKey, lease] of assetLeases) {
      if (lease.leaseExpiry <= now) {
        const nextWaiter = lease.waitQueue.shift();
        if (nextWaiter && nextWaiter.ws.readyState === 1) {
          assetLeases.set(fileKey, {
            assignee: nextWaiter.username,
            leaseExpiry: now + LEASE_TIMEOUT_MS,
            waitQueue: lease.waitQueue
          });
          nextWaiter.ws.send(JSON.stringify({ type: 'asset_fetch_assigned', fileKey }));
        } else {
          assetLeases.delete(fileKey);
        }
      }
    }
  }

  beforeEach(() => {
    clients = new Map();
    assetLeases = new Map();
    assetHolders = new Map();
  });

  describe('asset_need — first requester', () => {
    it('assigns the first requester to fetch', () => {
      const alice = createMockWs('alice');
      handleAssetNeed(alice, { fileKey: 'cart1/Video.mp4' });

      expect(alice.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'asset_fetch_assigned', fileKey: 'cart1/Video.mp4' })
      );
      expect(assetLeases.has('cart1/Video.mp4')).toBe(true);
      expect(assetLeases.get('cart1/Video.mp4').assignee).toBe('alice');
    });
  });

  describe('asset_need — second requester', () => {
    it('queues the second requester', () => {
      const alice = createMockWs('alice');
      const bob = createMockWs('bob');

      handleAssetNeed(alice, { fileKey: 'cart1/Video.mp4' });
      handleAssetNeed(bob, { fileKey: 'cart1/Video.mp4' });

      expect(bob.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'asset_queued', fileKey: 'cart1/Video.mp4', position: 1 })
      );
    });
  });

  describe('asset_need — peer already has it', () => {
    it('returns asset_available with peer list', () => {
      const alice = createMockWs('alice');
      const bob = createMockWs('bob');

      // Alice already has the file
      assetHolders.set('cart1/Video.mp4', new Set(['alice']));

      handleAssetNeed(bob, { fileKey: 'cart1/Video.mp4' });

      expect(bob.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'asset_available', fileKey: 'cart1/Video.mp4', peers: ['alice'] })
      );
    });

    it('does not include self in peer list', () => {
      const alice = createMockWs('alice');

      // Alice is the only holder
      assetHolders.set('cart1/Video.mp4', new Set(['alice']));

      handleAssetNeed(alice, { fileKey: 'cart1/Video.mp4' });

      // Should assign fetch since no OTHER peers
      expect(alice.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'asset_fetch_assigned', fileKey: 'cart1/Video.mp4' })
      );
    });
  });

  describe('asset_have — notifies waiters', () => {
    it('notifies all queued clients when file becomes available', () => {
      const alice = createMockWs('alice');
      const bob = createMockWs('bob');
      const carol = createMockWs('carol');

      handleAssetNeed(alice, { fileKey: 'f1' }); // assigned
      handleAssetNeed(bob, { fileKey: 'f1' });   // queued
      handleAssetNeed(carol, { fileKey: 'f1' }); // queued

      // Alice finishes downloading
      handleAssetHave(alice, { fileKey: 'f1', hash: 'abc123' });

      // Bob and Carol should be notified
      const expectedMsg = JSON.stringify({
        type: 'asset_available',
        fileKey: 'f1',
        peers: ['alice'],
        hash: 'abc123'
      });
      expect(bob.send).toHaveBeenCalledWith(expectedMsg);
      expect(carol.send).toHaveBeenCalledWith(expectedMsg);

      // Lease should be cleared
      expect(assetLeases.has('f1')).toBe(false);
      // Alice registered as holder
      expect(assetHolders.get('f1').has('alice')).toBe(true);
    });
  });

  describe('asset_query', () => {
    it('returns current holders', () => {
      const alice = createMockWs('alice');
      assetHolders.set('f1', new Set(['bob', 'carol']));

      handleAssetQuery(alice, { fileKey: 'f1' });

      expect(alice.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'asset_holders', fileKey: 'f1', peers: ['bob', 'carol'] })
      );
    });

    it('returns empty array when no holders', () => {
      const alice = createMockWs('alice');

      handleAssetQuery(alice, { fileKey: 'unknown' });

      expect(alice.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'asset_holders', fileKey: 'unknown', peers: [] })
      );
    });
  });

  describe('client disconnect cleanup', () => {
    it('removes disconnected user from holders', () => {
      assetHolders.set('f1', new Set(['alice', 'bob']));

      cleanupAssetHoldersForUser('alice');

      expect(assetHolders.get('f1').has('alice')).toBe(false);
      expect(assetHolders.get('f1').has('bob')).toBe(true);
    });

    it('removes fileKey when last holder disconnects', () => {
      assetHolders.set('f1', new Set(['alice']));

      cleanupAssetHoldersForUser('alice');

      expect(assetHolders.has('f1')).toBe(false);
    });

    it('reassigns lease when assignee disconnects', () => {
      const alice = createMockWs('alice');
      const bob = createMockWs('bob');

      handleAssetNeed(alice, { fileKey: 'f1' }); // assigned
      handleAssetNeed(bob, { fileKey: 'f1' });   // queued

      // Alice disconnects
      cleanupAssetHoldersForUser('alice');

      // Bob should be assigned
      expect(bob.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'asset_fetch_assigned', fileKey: 'f1' })
      );
      expect(assetLeases.get('f1').assignee).toBe('bob');
    });
  });

  describe('lease expiry', () => {
    it('reassigns expired lease to next waiter', () => {
      const alice = createMockWs('alice');
      const bob = createMockWs('bob');

      handleAssetNeed(alice, { fileKey: 'f1' });
      handleAssetNeed(bob, { fileKey: 'f1' });

      // Expire the lease
      assetLeases.get('f1').leaseExpiry = Date.now() - 1000;

      cleanupAssetLeases();

      expect(bob.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'asset_fetch_assigned', fileKey: 'f1' })
      );
      expect(assetLeases.get('f1').assignee).toBe('bob');
    });

    it('deletes lease when no waiters remain', () => {
      const alice = createMockWs('alice');

      handleAssetNeed(alice, { fileKey: 'f1' });
      assetLeases.get('f1').leaseExpiry = Date.now() - 1000;

      cleanupAssetLeases();

      expect(assetLeases.has('f1')).toBe(false);
    });
  });

  describe('stampede prevention (30 students)', () => {
    it('assigns 1 fetcher and queues 29 others', () => {
      const students = [];
      for (let i = 0; i < 30; i++) {
        students.push(createMockWs(`student${i}`));
      }

      for (const ws of students) {
        handleAssetNeed(ws, { fileKey: 'big-video.mp4' });
      }

      // First student gets assigned
      expect(students[0].send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'asset_fetch_assigned', fileKey: 'big-video.mp4' })
      );

      // Remaining 29 get queued
      for (let i = 1; i < 30; i++) {
        expect(students[i].send).toHaveBeenCalledWith(
          JSON.stringify({ type: 'asset_queued', fileKey: 'big-video.mp4', position: i })
        );
      }

      // First student completes download
      handleAssetHave(students[0], { fileKey: 'big-video.mp4', hash: 'sha256hash' });

      // All 29 get notified
      for (let i = 1; i < 30; i++) {
        expect(students[i].send).toHaveBeenCalledWith(
          JSON.stringify({
            type: 'asset_available',
            fileKey: 'big-video.mp4',
            peers: ['student0'],
            hash: 'sha256hash'
          })
        );
      }
    });
  });
});
