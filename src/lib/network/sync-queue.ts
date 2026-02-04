/**
 * SyncQueue - Retry queue for progress sync with Svelte store integration
 * Wraps the existing SyncQueue class
 */

import { writable, get } from 'svelte/store';

const STORAGE_KEY = 'driller_syncQueue';
const MAX_QUEUE_SIZE = 50;
const MAX_RETRIES = 10;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 300000; // 5 minutes
const DEDUPE_WINDOW_MS = 60000; // 60 seconds
const PERIODIC_INTERVAL_MS = 30000; // 30 seconds

interface QueueItem {
	id: string;
	url: string;
	options: RequestInit;
	retryCount: number;
	timestamp: number;
	hash: string;
}

interface SyncQueueState {
	queueSize: number;
	processing: boolean;
	lastSync: number | null;
	error: string | null;
}

// Store for queue state
export const syncQueueState = writable<SyncQueueState>({
	queueSize: 0,
	processing: false,
	lastSync: null,
	error: null
});

// Internal state
let queue: QueueItem[] = [];
let processing = false;
let periodicTimer: ReturnType<typeof setInterval> | null = null;
let retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
let recentHashes = new Map<string, number>();
let initialized = false;

/**
 * Generate a simple hash of request content for deduplication
 */
function hashRequest(url: string, body: unknown): string {
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
 */
function calculateBackoff(retryCount: number): number {
	const exponentialDelay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
	// Add jitter: +/- 20% to prevent thundering herd
	const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
	return Math.floor(exponentialDelay + jitter);
}

/**
 * Check if an HTTP status code indicates a transient error worth retrying
 */
function isTransientError(status: number): boolean {
	return status === 0 || status === 429 || (status >= 500 && status < 600);
}

/**
 * Load queue from localStorage
 */
function loadFromStorage(): void {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed)) {
				queue = parsed;
			}
		}
	} catch (err) {
		console.warn('[SyncQueue] Failed to load from storage:', err);
		queue = [];
	}
}

/**
 * Persist queue to localStorage
 */
function saveToStorage(): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
	} catch (err) {
		if ((err as Error).name === 'QuotaExceededError') {
			console.warn('[SyncQueue] Storage full, evicting oldest items');
			const keepCount = Math.floor(queue.length / 2);
			queue = queue.slice(-keepCount);
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
			} catch (e) {
				console.error('[SyncQueue] Still cannot save after eviction:', e);
			}
		} else {
			console.warn('[SyncQueue] Failed to save to storage:', err);
		}
	}
}

/**
 * Update store with current state
 */
function updateStore(): void {
	syncQueueState.update(state => ({
		...state,
		queueSize: queue.length,
		processing
	}));
}

/**
 * Handle online event - process queue when network is restored
 */
function handleOnline(): void {
	console.log('[SyncQueue] Network online, processing queue...');
	processQueue();
}

/**
 * Schedule a retry for a specific item
 */
function scheduleRetry(item: QueueItem): void {
	const delay = calculateBackoff(item.retryCount);
	console.log(`[SyncQueue] Scheduling retry for ${item.id} in ${delay}ms (attempt ${item.retryCount + 1})`);

	const timerId = setTimeout(() => {
		retryTimers.delete(item.id);
		retryItem(item);
	}, delay);

	retryTimers.set(item.id, timerId);
}

/**
 * Schedule retries for all items in queue
 */
function scheduleNextRetries(): void {
	for (const item of queue) {
		if (!retryTimers.has(item.id)) {
			scheduleRetry(item);
		}
	}
}

/**
 * Handle a failed retry attempt
 */
function handleRetryFailure(item: QueueItem, index: number): void {
	item.retryCount++;

	if (item.retryCount >= MAX_RETRIES) {
		console.warn(`[SyncQueue] Max retries exceeded for ${item.id}, removing (dead letter)`);
		queue.splice(index, 1);
		saveToStorage();
		updateStore();
		return;
	}

	queue[index] = item;
	saveToStorage();
	scheduleRetry(item);
}

/**
 * Retry a single item
 */
async function retryItem(item: QueueItem): Promise<void> {
	const index = queue.findIndex(q => q.id === item.id);
	if (index === -1) return;

	try {
		console.log(`[SyncQueue] Retrying ${item.url} (attempt ${item.retryCount + 1})`);
		const response = await fetch(item.url, item.options);

		if (response.ok) {
			console.log(`[SyncQueue] Retry successful for ${item.id}`);
			queue.splice(index, 1);
			saveToStorage();
			updateStore();
			syncQueueState.update(state => ({ ...state, lastSync: Date.now() }));
			return;
		}

		if (!isTransientError(response.status)) {
			console.warn(`[SyncQueue] Non-transient error ${response.status}, removing ${item.id}`);
			queue.splice(index, 1);
			saveToStorage();
			updateStore();
			return;
		}

		handleRetryFailure(item, index);
	} catch (err) {
		console.warn(`[SyncQueue] Network error retrying ${item.id}:`, (err as Error).message);
		handleRetryFailure(item, index);
	}
}

// =============== PUBLIC API ===============

/**
 * Initialize the sync queue
 */
export function init(): void {
	if (initialized) return;
	initialized = true;

	loadFromStorage();

	window.addEventListener('online', handleOnline);

	periodicTimer = setInterval(() => {
		processQueue();
	}, PERIODIC_INTERVAL_MS);

	if (queue.length > 0) {
		console.log(`[SyncQueue] Loaded ${queue.length} pending sync requests from storage`);
		scheduleNextRetries();
	}

	updateStore();
}

/**
 * Cleanup listeners and timers
 */
export function destroy(): void {
	if (!initialized) return;
	initialized = false;

	window.removeEventListener('online', handleOnline);

	if (periodicTimer) {
		clearInterval(periodicTimer);
		periodicTimer = null;
	}

	for (const timerId of retryTimers.values()) {
		clearTimeout(timerId);
	}
	retryTimers.clear();
}

/**
 * Add a failed request to the queue
 */
export async function enqueue(request: { url: string; options: RequestInit; retryCount?: number }): Promise<boolean> {
	const body = request.options?.body ? JSON.parse(request.options.body as string) : {};
	const hash = hashRequest(request.url, body);

	const now = Date.now();
	const recentTimestamp = recentHashes.get(hash);
	if (recentTimestamp && (now - recentTimestamp) < DEDUPE_WINDOW_MS) {
		console.log('[SyncQueue] Skipping duplicate request');
		return false;
	}

	recentHashes.set(hash, now);

	// Clean old hashes
	for (const [h, ts] of recentHashes.entries()) {
		if (now - ts > DEDUPE_WINDOW_MS) {
			recentHashes.delete(h);
		}
	}

	if (queue.length >= MAX_QUEUE_SIZE) {
		console.warn('[SyncQueue] Queue full, evicting oldest items');
		queue = queue.slice(Math.floor(MAX_QUEUE_SIZE / 2));
	}

	const item: QueueItem = {
		id: `${now}-${Math.random().toString(36).slice(2, 9)}`,
		url: request.url,
		options: request.options,
		retryCount: request.retryCount || 0,
		timestamp: now,
		hash
	};

	queue.push(item);
	saveToStorage();
	updateStore();

	console.log(`[SyncQueue] Enqueued request (${queue.length} pending)`);

	scheduleRetry(item);
	return true;
}

/**
 * Process all items in the queue
 */
export async function processQueue(): Promise<void> {
	if (processing || queue.length === 0) return;

	processing = true;
	updateStore();
	console.log(`[SyncQueue] Processing ${queue.length} queued items`);

	for (const timerId of retryTimers.values()) {
		clearTimeout(timerId);
	}
	retryTimers.clear();

	const itemsToProcess = [...queue];
	for (const item of itemsToProcess) {
		await retryItem(item);
		await new Promise(r => setTimeout(r, 100));
	}

	processing = false;
	updateStore();

	scheduleNextRetries();
}

/**
 * Wrapped fetch that auto-queues on failure
 */
export async function syncFetch(url: string, options: RequestInit = {}): Promise<Response> {
	try {
		const response = await fetch(url, options);

		if (response.ok) {
			syncQueueState.update(state => ({ ...state, lastSync: Date.now(), error: null }));
			return response;
		}

		if (isTransientError(response.status)) {
			await enqueue({ url, options, retryCount: 0 });
		}

		return response;
	} catch (err) {
		console.warn('[SyncQueue] Request failed, queuing for retry:', (err as Error).message);
		await enqueue({ url, options, retryCount: 0 });
		syncQueueState.update(state => ({ ...state, error: (err as Error).message }));

		return new Response(null, {
			status: 503,
			statusText: 'Service Unavailable (Network Error)'
		});
	}
}

/**
 * Get current queue size
 */
export function getQueueSize(): number {
	return queue.length;
}

/**
 * Clear all queued items
 */
export function clearQueue(): void {
	for (const timerId of retryTimers.values()) {
		clearTimeout(timerId);
	}
	retryTimers.clear();

	queue = [];
	saveToStorage();
	updateStore();
	console.log('[SyncQueue] Queue cleared');
}

/**
 * Sync progress to server with automatic retry
 */
export async function syncProgress(serverUrl: string, username: string, cartridgeId: string, progress: unknown): Promise<boolean> {
	const url = `${serverUrl}/api/progress/cartridge-sync`;
	const options: RequestInit = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			username,
			cartridge_id: cartridgeId,
			progress
		})
	};

	const response = await syncFetch(url, options);
	return response.ok;
}
