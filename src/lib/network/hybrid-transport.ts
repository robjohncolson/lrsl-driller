/**
 * Hybrid Transport - Unified API for WebSocket + WebRTC
 * Automatically uses WebRTC when available, falls back to WebSocket
 * Includes quality-based transport selection
 */

import { connection, settings } from '$lib/stores';
import { get } from 'svelte/store';
import * as ws from './websocket-client';
import * as rtc from './webrtc-manager';
import { initQualityMonitor, destroyQualityMonitor, shouldPreferP2P } from './connection-quality';

export interface TransportConfig {
	serverUrl: string;
	username: string;
	enableP2P?: boolean;
	onStarEarned?: ws.WebSocketConfig['onStarEarned'];
	onClassTimeStart?: ws.WebSocketConfig['onClassTimeStart'];
	onClassTimeEnd?: ws.WebSocketConfig['onClassTimeEnd'];
	onLeaderboardUpdate?: ws.WebSocketConfig['onLeaderboardUpdate'];
	onTeacherReviewSubmitted?: ws.WebSocketConfig['onTeacherReviewSubmitted'];
	onTeacherReviewCompleted?: ws.WebSocketConfig['onTeacherReviewCompleted'];
	onProgressionOverride?: ws.WebSocketConfig['onProgressionOverride'];
	onP2PMessage?: (peerId: string, data: unknown) => void;
}

let config: TransportConfig | null = null;
let initialized = false;

/**
 * Initialize hybrid transport
 */
export function init(transportConfig: TransportConfig): void {
	config = transportConfig;

	// Always connect WebSocket first
	ws.connect({
		serverUrl: transportConfig.serverUrl,
		username: transportConfig.username,
		onStarEarned: transportConfig.onStarEarned,
		onClassTimeStart: transportConfig.onClassTimeStart,
		onClassTimeEnd: transportConfig.onClassTimeEnd,
		onLeaderboardUpdate: transportConfig.onLeaderboardUpdate,
		onTeacherReviewSubmitted: transportConfig.onTeacherReviewSubmitted,
		onTeacherReviewCompleted: transportConfig.onTeacherReviewCompleted,
		onProgressionOverride: transportConfig.onProgressionOverride
	});

	// Initialize WebRTC if P2P is enabled
	const settingsState = get(settings);
	if (transportConfig.enableP2P !== false && settingsState.p2pEnabled) {
		rtc.init();

		// Set up P2P message handler
		if (transportConfig.onP2PMessage) {
			rtc.onMessage(transportConfig.onP2PMessage);
		}
	}

	// Initialize quality monitoring
	initQualityMonitor();

	initialized = true;
}

/**
 * Destroy hybrid transport
 */
export function destroy(): void {
	destroyQualityMonitor();
	rtc.destroy();
	ws.disconnect();
	initialized = false;
	config = null;
}

/**
 * Send game state message
 * Uses WebRTC if available, quality is good, and message is for a specific peer
 * Falls back to WebSocket otherwise
 */
export function sendGameState(data: unknown, targetPeerId?: string): boolean {
	// Check if P2P should be preferred based on quality metrics
	const preferP2P = shouldPreferP2P() && rtc.isP2PConnected();

	// If we have a target peer and P2P is preferred, use WebRTC
	if (targetPeerId && preferP2P) {
		const sent = rtc.sendToPeer(targetPeerId, data);
		if (sent) return true;
		// Fall through to WebSocket if P2P send failed
	}

	// If P2P is preferred and connected, broadcast to all peers
	if (preferP2P) {
		rtc.broadcast(data);
		return true;
	}

	// Fall back to WebSocket (server will relay)
	ws.send({ type: 'game_state', data });
	return true;
}

/**
 * Send message via WebSocket only (for server operations like AI grading)
 */
export function sendToServer(data: unknown): void {
	ws.send(data);
}

/**
 * Connect to a peer for P2P communication
 */
export async function connectToPeer(peerId: string): Promise<boolean> {
	const settingsState = get(settings);
	if (!settingsState.p2pEnabled) {
		console.warn('[Transport] P2P is disabled in settings');
		return false;
	}

	if (!rtc.getLocalPeerId()) {
		rtc.init();
	}

	return rtc.connectToPeer(peerId);
}

/**
 * Disconnect from a peer
 */
export function disconnectFromPeer(peerId: string): void {
	rtc.disconnectFromPeer(peerId);
}

/**
 * Check transport status
 */
export function getStatus(): {
	wsConnected: boolean;
	p2pConnected: boolean;
	p2pEnabled: boolean;
	connectedPeers: string[];
	localPeerId: string | null;
} {
	const settingsState = get(settings);
	return {
		wsConnected: ws.isConnected(),
		p2pConnected: rtc.isP2PConnected(),
		p2pEnabled: settingsState.p2pEnabled,
		connectedPeers: rtc.getConnectedPeers(),
		localPeerId: rtc.getLocalPeerId()
	};
}

/**
 * Enable P2P (will initialize WebRTC if not already)
 */
export function enableP2P(): void {
	settings.updateSetting('p2pEnabled', true);
	if (!rtc.getLocalPeerId()) {
		rtc.init();
	}
}

/**
 * Disable P2P (will disconnect all peers)
 */
export function disableP2P(): void {
	settings.updateSetting('p2pEnabled', false);
	rtc.destroy();
}

/**
 * Toggle P2P state
 */
export function toggleP2P(): void {
	const settingsState = get(settings);
	if (settingsState.p2pEnabled) {
		disableP2P();
	} else {
		enableP2P();
	}
}

// Re-export WebSocket-specific functions for server communication
export { notifyStarEarned, notifyClassTimeStart, notifyClassTimeEnd } from './websocket-client';
