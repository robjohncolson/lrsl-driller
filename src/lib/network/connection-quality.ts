/**
 * Connection Quality Monitor
 * Tracks latency, packet loss, and connection health for WebSocket and WebRTC
 */

import { writable, derived, get } from 'svelte/store';
import { connection } from '$lib/stores';
import * as ws from './websocket-client';
import * as rtc from './webrtc-manager';

export interface QualityMetrics {
	wsLatency: number | null;
	p2pLatency: number | null;
	wsPacketLoss: number;
	p2pPacketLoss: number;
	lastWsPing: number | null;
	lastP2PPing: number | null;
	wsQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
	p2pQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';
	preferredTransport: 'p2p' | 'websocket';
}

interface PingRecord {
	id: string;
	sentAt: number;
	receivedAt?: number;
}

const PING_INTERVAL = 5000; // 5 seconds
const PING_TIMEOUT = 3000; // 3 seconds
const LATENCY_HISTORY_SIZE = 10;
const QUALITY_THRESHOLDS = {
	excellent: 50,
	good: 100,
	fair: 200,
	poor: 500
};

// Latency history for averaging
let wsLatencyHistory: number[] = [];
let p2pLatencyHistory: number[] = [];

// Pending pings
let wsPingRecords = new Map<string, PingRecord>();
let p2pPingRecords = new Map<string, Map<string, PingRecord>>();

// Timers
let pingInterval: ReturnType<typeof setInterval> | null = null;
let initialized = false;

// Store for quality metrics
const initialMetrics: QualityMetrics = {
	wsLatency: null,
	p2pLatency: null,
	wsPacketLoss: 0,
	p2pPacketLoss: 0,
	lastWsPing: null,
	lastP2PPing: null,
	wsQuality: 'disconnected',
	p2pQuality: 'disconnected',
	preferredTransport: 'websocket'
};

export const qualityMetrics = writable<QualityMetrics>(initialMetrics);

// Derived store for recommended transport
export const recommendedTransport = derived(qualityMetrics, ($metrics) => {
	if ($metrics.p2pQuality !== 'disconnected' && $metrics.p2pLatency !== null) {
		// If P2P is connected and has good quality, prefer it
		if ($metrics.p2pQuality === 'excellent' || $metrics.p2pQuality === 'good') {
			return 'p2p' as const;
		}
		// If P2P is fair but WS is worse, still prefer P2P
		if (
			$metrics.p2pQuality === 'fair' &&
			($metrics.wsQuality === 'poor' || $metrics.wsQuality === 'disconnected')
		) {
			return 'p2p' as const;
		}
	}
	return 'websocket' as const;
});

/**
 * Calculate quality rating from latency
 */
function getQualityFromLatency(
	latency: number | null
): 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected' {
	if (latency === null) return 'disconnected';
	if (latency <= QUALITY_THRESHOLDS.excellent) return 'excellent';
	if (latency <= QUALITY_THRESHOLDS.good) return 'good';
	if (latency <= QUALITY_THRESHOLDS.fair) return 'fair';
	return 'poor';
}

/**
 * Calculate average latency from history
 */
function calculateAverageLatency(history: number[]): number | null {
	if (history.length === 0) return null;
	return Math.round(history.reduce((a, b) => a + b, 0) / history.length);
}

/**
 * Add latency to history, maintaining max size
 */
function addToHistory(history: number[], latency: number): void {
	history.push(latency);
	if (history.length > LATENCY_HISTORY_SIZE) {
		history.shift();
	}
}

/**
 * Generate unique ping ID
 */
function generatePingId(): string {
	return `ping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Send WebSocket ping
 */
function sendWsPing(): void {
	if (!ws.isConnected()) return;

	const pingId = generatePingId();
	const record: PingRecord = {
		id: pingId,
		sentAt: performance.now()
	};

	wsPingRecords.set(pingId, record);

	ws.send({
		type: 'ping',
		id: pingId,
		timestamp: Date.now()
	});

	// Set timeout for this ping
	setTimeout(() => {
		const pending = wsPingRecords.get(pingId);
		if (pending && !pending.receivedAt) {
			// Ping timed out - count as packet loss
			wsPingRecords.delete(pingId);
			updatePacketLoss('ws');
		}
	}, PING_TIMEOUT);
}

/**
 * Send P2P ping to all connected peers
 */
function sendP2PPing(): void {
	const connectedPeers = rtc.getConnectedPeers();
	if (connectedPeers.length === 0) return;

	const pingId = generatePingId();

	for (const peerId of connectedPeers) {
		if (!p2pPingRecords.has(peerId)) {
			p2pPingRecords.set(peerId, new Map());
		}

		const peerPings = p2pPingRecords.get(peerId)!;
		const record: PingRecord = {
			id: pingId,
			sentAt: performance.now()
		};

		peerPings.set(pingId, record);

		rtc.sendToPeer(peerId, {
			type: 'ping',
			id: pingId,
			timestamp: Date.now()
		});

		// Set timeout for this ping
		setTimeout(() => {
			const pending = peerPings.get(pingId);
			if (pending && !pending.receivedAt) {
				peerPings.delete(pingId);
				updatePacketLoss('p2p');
			}
		}, PING_TIMEOUT);
	}
}

/**
 * Handle incoming pong response
 */
function handlePong(type: 'ws' | 'p2p', pingId: string, peerId?: string): void {
	const now = performance.now();

	if (type === 'ws') {
		const record = wsPingRecords.get(pingId);
		if (record) {
			const latency = Math.round(now - record.sentAt);
			record.receivedAt = now;
			wsPingRecords.delete(pingId);

			addToHistory(wsLatencyHistory, latency);
			updateMetrics();
		}
	} else if (type === 'p2p' && peerId) {
		const peerPings = p2pPingRecords.get(peerId);
		if (peerPings) {
			const record = peerPings.get(pingId);
			if (record) {
				const latency = Math.round(now - record.sentAt);
				record.receivedAt = now;
				peerPings.delete(pingId);

				addToHistory(p2pLatencyHistory, latency);
				updateMetrics();
			}
		}
	}
}

/**
 * Handle incoming ping request (respond with pong)
 */
function handlePing(type: 'ws' | 'p2p', pingId: string, peerId?: string): void {
	if (type === 'ws') {
		ws.send({
			type: 'pong',
			id: pingId,
			timestamp: Date.now()
		});
	} else if (type === 'p2p' && peerId) {
		rtc.sendToPeer(peerId, {
			type: 'pong',
			id: pingId,
			timestamp: Date.now()
		});
	}
}

/**
 * Update packet loss count
 */
function updatePacketLoss(type: 'ws' | 'p2p'): void {
	qualityMetrics.update((metrics) => {
		if (type === 'ws') {
			return { ...metrics, wsPacketLoss: metrics.wsPacketLoss + 1 };
		} else {
			return { ...metrics, p2pPacketLoss: metrics.p2pPacketLoss + 1 };
		}
	});
}

/**
 * Update quality metrics
 */
function updateMetrics(): void {
	const wsLatency = calculateAverageLatency(wsLatencyHistory);
	const p2pLatency = calculateAverageLatency(p2pLatencyHistory);

	qualityMetrics.update((metrics) => {
		const wsQuality = ws.isConnected() ? getQualityFromLatency(wsLatency) : 'disconnected';
		const p2pQuality = rtc.isP2PConnected() ? getQualityFromLatency(p2pLatency) : 'disconnected';

		// Determine preferred transport
		let preferredTransport: 'p2p' | 'websocket' = 'websocket';
		if (p2pQuality !== 'disconnected' && p2pLatency !== null) {
			if (wsLatency === null || p2pLatency < wsLatency * 0.8) {
				// P2P is at least 20% faster
				preferredTransport = 'p2p';
			}
		}

		return {
			...metrics,
			wsLatency,
			p2pLatency,
			wsQuality,
			p2pQuality,
			preferredTransport,
			lastWsPing: wsLatency !== null ? Date.now() : metrics.lastWsPing,
			lastP2PPing: p2pLatency !== null ? Date.now() : metrics.lastP2PPing
		};
	});

	// Update connection store with best latency
	const metrics = get(qualityMetrics);
	const bestLatency = metrics.preferredTransport === 'p2p' ? metrics.p2pLatency : metrics.wsLatency;
	if (bestLatency !== null) {
		connection.setLatency(bestLatency);
	}
}

/**
 * Initialize connection quality monitoring
 */
export function initQualityMonitor(): void {
	if (initialized) return;
	initialized = true;

	// Set up WebSocket pong handler
	ws.addMessageHandler('pong', (msg) => {
		const message = msg as { id: string };
		handlePong('ws', message.id);
	});

	// Set up WebSocket ping handler (respond to server pings)
	ws.addMessageHandler('ping', (msg) => {
		const message = msg as { id: string };
		handlePing('ws', message.id);
	});

	// Set up P2P message handlers for ping/pong
	rtc.onMessage((peerId, data) => {
		const message = data as { type: string; id?: string };
		if (message.type === 'ping' && message.id) {
			handlePing('p2p', message.id, peerId);
		} else if (message.type === 'pong' && message.id) {
			handlePong('p2p', message.id, peerId);
		}
	});

	// Start periodic ping
	pingInterval = setInterval(() => {
		sendWsPing();
		sendP2PPing();
	}, PING_INTERVAL);

	// Send initial pings
	setTimeout(() => {
		sendWsPing();
		sendP2PPing();
	}, 1000);

	console.log('[QualityMonitor] Initialized');
}

/**
 * Stop quality monitoring
 */
export function destroyQualityMonitor(): void {
	if (!initialized) return;

	if (pingInterval) {
		clearInterval(pingInterval);
		pingInterval = null;
	}

	wsPingRecords.clear();
	p2pPingRecords.clear();
	wsLatencyHistory = [];
	p2pLatencyHistory = [];

	qualityMetrics.set(initialMetrics);
	initialized = false;

	console.log('[QualityMonitor] Destroyed');
}

/**
 * Get current quality snapshot
 */
export function getQualitySnapshot(): QualityMetrics {
	return get(qualityMetrics);
}

/**
 * Force a ping measurement
 */
export function measureNow(): void {
	sendWsPing();
	sendP2PPing();
}

/**
 * Check if P2P should be preferred based on quality
 */
export function shouldPreferP2P(): boolean {
	const metrics = get(qualityMetrics);
	return metrics.preferredTransport === 'p2p';
}

/**
 * Get quality indicator for UI
 */
export function getQualityIndicator(): {
	color: string;
	label: string;
	latency: number | null;
	transport: 'p2p' | 'websocket';
} {
	const metrics = get(qualityMetrics);

	const quality = metrics.preferredTransport === 'p2p' ? metrics.p2pQuality : metrics.wsQuality;
	const latency = metrics.preferredTransport === 'p2p' ? metrics.p2pLatency : metrics.wsLatency;

	const colors: Record<string, string> = {
		excellent: '#22c55e', // green
		good: '#84cc16', // lime
		fair: '#eab308', // yellow
		poor: '#f97316', // orange
		disconnected: '#ef4444' // red
	};

	return {
		color: colors[quality],
		label: quality.charAt(0).toUpperCase() + quality.slice(1),
		latency,
		transport: metrics.preferredTransport
	};
}
