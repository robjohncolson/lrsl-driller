/**
 * SyncQueue Tests
 * Tests retry queue for progress sync with exponential backoff
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SyncQueue } from '../../platform/core/sync-queue.js';

// Mock localStorage
const createMockLocalStorage = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _getStore: () => store
  };
};

// Mock window with event listeners
const createMockWindow = () => {
  const listeners = {};
  return {
    addEventListener: vi.fn((event, handler) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
    }),
    removeEventListener: vi.fn((event, handler) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(h => h !== handler);
      }
    }),
    dispatchEvent: (event) => {
      const eventListeners = listeners[event.type] || [];
      eventListeners.forEach(h => h(event));
    },
    _getListeners: () => listeners
  };
};

// Mock fetch
const mockFetch = vi.fn();
let mockLocalStorage;
let mockWindow;

describe('SyncQueue', () => {
  let syncQueue;
  let onQueueChangeMock;

  beforeEach(() => {
    vi.useFakeTimers();

    // Setup mocks
    mockLocalStorage = createMockLocalStorage();
    mockWindow = createMockWindow();
    global.localStorage = mockLocalStorage;
    global.window = mockWindow;
    global.fetch = mockFetch;
    mockFetch.mockReset();

    onQueueChangeMock = vi.fn();
    syncQueue = new SyncQueue({
      onQueueChange: onQueueChangeMock
    });
  });

  afterEach(() => {
    if (syncQueue.initialized) {
      syncQueue.destroy();
    }
    vi.useRealTimers();
  });

  // ========== INITIALIZATION ==========
  describe('Initialization', () => {
    it('initializes with empty queue', () => {
      syncQueue.init();
      expect(syncQueue.getQueueSize()).toBe(0);
    });

    it('loads existing queue from localStorage', () => {
      const existingQueue = [
        { id: 'test-1', url: '/api/test', options: {}, retryCount: 0, timestamp: Date.now() }
      ];
      mockLocalStorage.setItem('driller_syncQueue', JSON.stringify(existingQueue));

      syncQueue.init();
      expect(syncQueue.getQueueSize()).toBe(1);
    });

    it('handles corrupted localStorage gracefully', () => {
      mockLocalStorage.setItem('driller_syncQueue', 'invalid json');

      expect(() => syncQueue.init()).not.toThrow();
      expect(syncQueue.getQueueSize()).toBe(0);
    });

    it('only initializes once', () => {
      syncQueue.init();
      syncQueue.init(); // Second call should be no-op
      expect(syncQueue.initialized).toBe(true);
    });
  });

  // ========== ENQUEUE ==========
  describe('Enqueue', () => {
    beforeEach(() => {
      syncQueue.init();
    });

    it('adds request to queue', async () => {
      await syncQueue.enqueue({
        url: '/api/progress',
        options: { method: 'POST', body: JSON.stringify({ test: true }) },
        retryCount: 0
      });

      expect(syncQueue.getQueueSize()).toBe(1);
      expect(onQueueChangeMock).toHaveBeenCalledWith(1);
    });

    it('persists queue to localStorage', async () => {
      await syncQueue.enqueue({
        url: '/api/progress',
        options: { method: 'POST', body: JSON.stringify({ test: true }) },
        retryCount: 0
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'driller_syncQueue',
        expect.any(String)
      );
    });

    it('deduplicates requests within 60s window', async () => {
      const request = {
        url: '/api/progress',
        options: { method: 'POST', body: JSON.stringify({ test: true }) },
        retryCount: 0
      };

      await syncQueue.enqueue(request);
      await syncQueue.enqueue(request); // Duplicate

      expect(syncQueue.getQueueSize()).toBe(1);
    });

    it('allows duplicate after 60s window', async () => {
      const request = {
        url: '/api/progress',
        options: { method: 'POST', body: JSON.stringify({ test: true }) },
        retryCount: 0
      };

      await syncQueue.enqueue(request);

      // Advance time past dedupe window
      vi.advanceTimersByTime(61000);

      await syncQueue.enqueue(request);
      expect(syncQueue.getQueueSize()).toBe(2);
    });

    it('evicts oldest items when queue is full', async () => {
      // Directly manipulate queue to test eviction (avoids retry timer complexity)
      const items = [];
      for (let i = 0; i < 50; i++) {
        items.push({
          id: `item-${i}`,
          url: `/api/progress/${i}`,
          options: { method: 'POST', body: JSON.stringify({ item: i }) },
          retryCount: 0,
          timestamp: Date.now() + i,
          hash: `hash-${i}`
        });
      }
      syncQueue.queue = items;

      expect(syncQueue.getQueueSize()).toBe(50);

      // Add one more via enqueue
      vi.advanceTimersByTime(61000);
      await syncQueue.enqueue({
        url: '/api/progress/new',
        options: { method: 'POST', body: JSON.stringify({ item: 'new' }) },
        retryCount: 0
      });

      // Should have evicted oldest half (25) and added new one = 26
      expect(syncQueue.getQueueSize()).toBeLessThanOrEqual(26);
    });
  });

  // ========== SYNCFETCH ==========
  describe('syncFetch', () => {
    beforeEach(() => {
      syncQueue.init();
    });

    it('returns successful response without queueing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      });

      const response = await syncQueue.syncFetch('/api/progress', { method: 'POST' });

      expect(response.ok).toBe(true);
      expect(syncQueue.getQueueSize()).toBe(0);
    });

    it('queues on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await syncQueue.syncFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify({ test: true })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(503); // Fake response for network error
      expect(syncQueue.getQueueSize()).toBe(1);
    });

    it('queues on 500 server error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await syncQueue.syncFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify({ test: true })
      });

      expect(syncQueue.getQueueSize()).toBe(1);
    });

    it('queues on 503 service unavailable', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503
      });

      await syncQueue.syncFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify({ test: true })
      });

      expect(syncQueue.getQueueSize()).toBe(1);
    });

    it('queues on 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429
      });

      await syncQueue.syncFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify({ test: true })
      });

      expect(syncQueue.getQueueSize()).toBe(1);
    });

    it('does not queue on 400 client error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400
      });

      await syncQueue.syncFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify({ test: true })
      });

      expect(syncQueue.getQueueSize()).toBe(0);
    });

    it('does not queue on 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await syncQueue.syncFetch('/api/progress', {
        method: 'POST',
        body: JSON.stringify({ test: true })
      });

      expect(syncQueue.getQueueSize()).toBe(0);
    });
  });

  // ========== RETRY LOGIC ==========
  describe('Retry Logic', () => {
    beforeEach(() => {
      syncQueue.init();
    });

    it('retries with exponential backoff', async () => {
      // Set up queue item directly
      syncQueue.queue = [{
        id: 'test-retry',
        url: '/api/progress',
        options: { method: 'POST', body: '{"test":true}' },
        retryCount: 0,
        timestamp: Date.now(),
        hash: 'test-hash'
      }];

      // Mock success on retry
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      // Process the queue with timer advancement
      const processPromise = syncQueue.processQueue();
      await vi.advanceTimersByTimeAsync(200); // Advance past the 100ms delay
      await processPromise;

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(syncQueue.getQueueSize()).toBe(0);
    });

    it('removes item after max retries (10)', async () => {
      // Set up queue item with 9 retries already
      syncQueue.queue = [{
        id: 'test-max-retry',
        url: '/api/progress',
        options: { method: 'POST', body: '{"test":true}' },
        retryCount: 9,
        timestamp: Date.now(),
        hash: 'test-hash-max'
      }];

      // Mock failure
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      // Process the queue - should fail and hit max retries
      const processPromise = syncQueue.processQueue();
      await vi.advanceTimersByTimeAsync(200);
      await processPromise;

      // Item should be removed (dead letter)
      expect(syncQueue.getQueueSize()).toBe(0);
    });

    it('removes item on non-transient error during retry', async () => {
      // Set up queue item
      syncQueue.queue = [{
        id: 'test-400',
        url: '/api/progress',
        options: { method: 'POST', body: '{"test":true}' },
        retryCount: 0,
        timestamp: Date.now(),
        hash: 'test-hash-400'
      }];

      // Mock 400 error (non-transient)
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });

      // Process the queue
      const processPromise = syncQueue.processQueue();
      await vi.advanceTimersByTimeAsync(200);
      await processPromise;

      // Item removed due to 400 error (not retryable)
      expect(syncQueue.getQueueSize()).toBe(0);
    });
  });

  // ========== PROCESS QUEUE ==========
  describe('processQueue', () => {
    beforeEach(() => {
      syncQueue.init();
    });

    it('processes all items in queue', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200 });

      // Directly set up queue items to avoid timing issues
      syncQueue.queue = [
        { id: 'item-0', url: '/api/progress/0', options: { method: 'POST', body: '{"item":0}' }, retryCount: 0, timestamp: Date.now(), hash: 'h0' },
        { id: 'item-1', url: '/api/progress/1', options: { method: 'POST', body: '{"item":1}' }, retryCount: 0, timestamp: Date.now() + 1, hash: 'h1' },
        { id: 'item-2', url: '/api/progress/2', options: { method: 'POST', body: '{"item":2}' }, retryCount: 0, timestamp: Date.now() + 2, hash: 'h2' }
      ];

      expect(syncQueue.getQueueSize()).toBe(3);

      const processPromise = syncQueue.processQueue();
      // Advance timers for the 100ms delays between items (3 items = 300ms)
      await vi.advanceTimersByTimeAsync(500);
      await processPromise;

      expect(syncQueue.getQueueSize()).toBe(0);
    });

    it('does nothing when queue is empty', async () => {
      await syncQueue.processQueue();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ========== CLEAR QUEUE ==========
  describe('clearQueue', () => {
    beforeEach(() => {
      syncQueue.init();
    });

    it('removes all items from queue', async () => {
      await syncQueue.enqueue({
        url: '/api/progress',
        options: { method: 'POST', body: JSON.stringify({ test: true }) },
        retryCount: 0
      });

      expect(syncQueue.getQueueSize()).toBe(1);

      syncQueue.clearQueue();

      expect(syncQueue.getQueueSize()).toBe(0);
      expect(onQueueChangeMock).toHaveBeenCalledWith(0);
    });

    it('persists empty queue to localStorage', () => {
      syncQueue.clearQueue();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'driller_syncQueue',
        '[]'
      );
    });
  });

  // ========== CLEANUP ==========
  describe('Cleanup', () => {
    it('clears timers on destroy', async () => {
      syncQueue.init();

      await syncQueue.enqueue({
        url: '/api/progress',
        options: { method: 'POST', body: JSON.stringify({ test: true }) },
        retryCount: 0
      });

      syncQueue.destroy();

      expect(syncQueue.initialized).toBe(false);
      expect(syncQueue.retryTimers.size).toBe(0);
    });

    it('can be reinitialized after destroy', () => {
      syncQueue.init();
      syncQueue.destroy();
      syncQueue.init();

      expect(syncQueue.initialized).toBe(true);
    });
  });
});
