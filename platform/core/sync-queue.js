/**
 * SyncQueue - Retry queue for progress sync requests
 *
 * Queues failed sync requests in localStorage and retries with exponential backoff.
 * Prevents progress loss when network fails.
 *
 * @version 1.0.0
 */

const STORAGE_KEY = 'driller_syncQueue';
const MAX_QUEUE_SIZE = 50;
const MAX_RETRIES = 10;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 300000; // 5 minutes
const DEDUPE_WINDOW_MS = 60000; // 60 seconds
const PERIODIC_INTERVAL_MS = 30000; // 30 seconds

/**
 * Generate a simple hash of request content for deduplication
 * @param {string} url
 * @param {object} body
 * @returns {string}
 */
function hashRequest(url, body) {
  const str = url + JSON.stringify(body);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Calculate exponential backoff delay with jitter
 * @param {number} retryCount
 * @returns {number} delay in milliseconds
 */
function calculateBackoff(retryCount) {
  const exponentialDelay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
  // Add jitter: +/- 20% to prevent thundering herd
  const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
  return Math.floor(exponentialDelay + jitter);
}

/**
 * Check if an HTTP status code indicates a transient error worth retrying
 * @param {number} status
 * @returns {boolean}
 */
function isTransientError(status) {
  // 5xx server errors are transient
  // Also retry on 0 (network failure) and 429 (rate limit)
  return status === 0 || status === 429 || (status >= 500 && status < 600);
}

export class SyncQueue {
  /**
   * @param {object} config
   * @param {function} [config.onQueueChange] - Callback when queue size changes, receives count
   */
  constructor(config = {}) {
    this.onQueueChange = config.onQueueChange || (() => {});
    this.queue = [];
    this.processing = false;
    this.periodicTimer = null;
    this.retryTimers = new Map(); // requestId -> timerId
    this.recentHashes = new Map(); // hash -> timestamp
    this.initialized = false;
  }

  /**
   * Initialize the queue: load from storage, attach listeners, start periodic processing
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Load persisted queue
    this._loadFromStorage();

    // Listen for online events
    window.addEventListener('online', this._handleOnline);

    // Start periodic processing
    this.periodicTimer = setInterval(() => {
      this.processQueue();
    }, PERIODIC_INTERVAL_MS);

    // Process any existing queued items
    if (this.queue.length > 0) {
      console.log(`[SyncQueue] Loaded ${this.queue.length} pending sync requests from storage`);
      this._scheduleNextRetries();
    }
  }

  /**
   * Cleanup listeners and timers
   */
  destroy() {
    if (!this.initialized) return;
    this.initialized = false;

    window.removeEventListener('online', this._handleOnline);

    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }

    for (const timerId of this.retryTimers.values()) {
      clearTimeout(timerId);
    }
    this.retryTimers.clear();
  }

  /**
   * Handle online event - process queue when network is restored
   */
  _handleOnline = () => {
    console.log('[SyncQueue] Network online, processing queue...');
    this.processQueue();
  };

  /**
   * Load queue from localStorage
   */
  _loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
        }
      }
    } catch (err) {
      console.warn('[SyncQueue] Failed to load from storage:', err);
      this.queue = [];
    }
  }

  /**
   * Persist queue to localStorage
   */
  _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (err) {
      // localStorage might be full - try to evict oldest 50%
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        console.warn('[SyncQueue] Storage full, evicting oldest items');
        const keepCount = Math.floor(this.queue.length / 2);
        this.queue = this.queue.slice(-keepCount);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
        } catch (e) {
          console.error('[SyncQueue] Still cannot save after eviction:', e);
        }
      } else {
        console.warn('[SyncQueue] Failed to save to storage:', err);
      }
    }
  }

  /**
   * Notify listeners of queue size change
   */
  _notifyChange() {
    this.onQueueChange(this.queue.length);
  }

  /**
   * Add a failed request to the queue
   * @param {object} request - { url, options, retryCount, timestamp, id }
   * @returns {boolean} true if enqueued, false if duplicate
   */
  async enqueue(request) {
    // Generate hash for deduplication
    const body = request.options?.body ? JSON.parse(request.options.body) : {};
    const hash = hashRequest(request.url, body);

    // Check for recent duplicate
    const now = Date.now();
    const recentTimestamp = this.recentHashes.get(hash);
    if (recentTimestamp && (now - recentTimestamp) < DEDUPE_WINDOW_MS) {
      console.log('[SyncQueue] Skipping duplicate request');
      return false;
    }

    // Record this hash
    this.recentHashes.set(hash, now);

    // Clean old hashes
    for (const [h, ts] of this.recentHashes.entries()) {
      if (now - ts > DEDUPE_WINDOW_MS) {
        this.recentHashes.delete(h);
      }
    }

    // Check queue size limit
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      // Evict oldest half
      console.warn('[SyncQueue] Queue full, evicting oldest items');
      this.queue = this.queue.slice(Math.floor(MAX_QUEUE_SIZE / 2));
    }

    // Create queue item
    const item = {
      id: `${now}-${Math.random().toString(36).slice(2, 9)}`,
      url: request.url,
      options: request.options,
      retryCount: request.retryCount || 0,
      timestamp: now,
      hash
    };

    this.queue.push(item);
    this._saveToStorage();
    this._notifyChange();

    console.log(`[SyncQueue] Enqueued request (${this.queue.length} pending)`);

    // Schedule retry
    this._scheduleRetry(item);

    return true;
  }

  /**
   * Schedule a retry for a specific item
   * @param {object} item
   */
  _scheduleRetry(item) {
    const delay = calculateBackoff(item.retryCount);
    console.log(`[SyncQueue] Scheduling retry for ${item.id} in ${delay}ms (attempt ${item.retryCount + 1})`);

    const timerId = setTimeout(() => {
      this.retryTimers.delete(item.id);
      this._retryItem(item);
    }, delay);

    this.retryTimers.set(item.id, timerId);
  }

  /**
   * Schedule retries for all items in queue
   */
  _scheduleNextRetries() {
    for (const item of this.queue) {
      if (!this.retryTimers.has(item.id)) {
        this._scheduleRetry(item);
      }
    }
  }

  /**
   * Retry a single item
   * @param {object} item
   */
  async _retryItem(item) {
    // Check if still in queue (might have been removed)
    const index = this.queue.findIndex(q => q.id === item.id);
    if (index === -1) return;

    try {
      console.log(`[SyncQueue] Retrying ${item.url} (attempt ${item.retryCount + 1})`);
      const response = await fetch(item.url, item.options);

      if (response.ok) {
        // Success - remove from queue
        console.log(`[SyncQueue] Retry successful for ${item.id}`);
        this.queue.splice(index, 1);
        this._saveToStorage();
        this._notifyChange();
        return;
      }

      // Check if error is transient
      if (!isTransientError(response.status)) {
        // Non-transient error (4xx) - don't retry
        console.warn(`[SyncQueue] Non-transient error ${response.status}, removing ${item.id}`);
        this.queue.splice(index, 1);
        this._saveToStorage();
        this._notifyChange();
        return;
      }

      // Transient error - increment retry count
      this._handleRetryFailure(item, index);
    } catch (err) {
      // Network error - treat as transient
      console.warn(`[SyncQueue] Network error retrying ${item.id}:`, err.message);
      this._handleRetryFailure(item, index);
    }
  }

  /**
   * Handle a failed retry attempt
   * @param {object} item
   * @param {number} index
   */
  _handleRetryFailure(item, index) {
    item.retryCount++;

    if (item.retryCount >= MAX_RETRIES) {
      // Max retries exceeded - dead letter
      console.warn(`[SyncQueue] Max retries exceeded for ${item.id}, removing (dead letter)`);
      this.queue.splice(index, 1);
      this._saveToStorage();
      this._notifyChange();
      return;
    }

    // Update queue and schedule next retry
    this.queue[index] = item;
    this._saveToStorage();
    this._scheduleRetry(item);
  }

  /**
   * Process all items in the queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    console.log(`[SyncQueue] Processing ${this.queue.length} queued items`);

    // Cancel existing retry timers - we're processing now
    for (const timerId of this.retryTimers.values()) {
      clearTimeout(timerId);
    }
    this.retryTimers.clear();

    // Process items one by one (to avoid overwhelming server)
    const itemsToProcess = [...this.queue];
    for (const item of itemsToProcess) {
      await this._retryItem(item);
      // Small delay between requests to avoid rate limiting
      await new Promise(r => setTimeout(r, 100));
    }

    this.processing = false;

    // Schedule retries for any remaining items
    this._scheduleNextRetries();
  }

  /**
   * Wrapped fetch that auto-queues on failure
   * Use this instead of fetch() for sync requests
   *
   * @param {string} url
   * @param {object} options
   * @returns {Promise<Response>}
   */
  async syncFetch(url, options = {}) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response;
      }

      // Check if error is transient
      if (isTransientError(response.status)) {
        // Queue for retry
        await this.enqueue({ url, options, retryCount: 0 });
      }

      return response;
    } catch (err) {
      // Network error - queue for retry
      console.warn('[SyncQueue] Request failed, queuing for retry:', err.message);
      await this.enqueue({ url, options, retryCount: 0 });

      // Return a fake failed response (use 503 as status 0 is not valid)
      return new Response(null, {
        status: 503,
        statusText: 'Service Unavailable (Network Error)'
      });
    }
  }

  /**
   * Get current queue size
   * @returns {number}
   */
  getQueueSize() {
    return this.queue.length;
  }

  /**
   * Clear all queued items
   */
  clearQueue() {
    // Cancel all retry timers
    for (const timerId of this.retryTimers.values()) {
      clearTimeout(timerId);
    }
    this.retryTimers.clear();

    this.queue = [];
    this._saveToStorage();
    this._notifyChange();
    console.log('[SyncQueue] Queue cleared');
  }
}
