/**
 * WebRTC Manager - P2P connections for multiplayer
 * Uses WebSocket for signaling, DataChannel for game state
 */

import { connection } from '$lib/stores';
import { send as wsSend, addMessageHandler, removeMessageHandler } from './websocket-client';

export interface RTCConfig {
	iceServers?: RTCIceServer[];
}

interface PeerConnection {
	pc: RTCPeerConnection;
	dataChannel: RTCDataChannel | null;
	peerId: string;
	connected: boolean;
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
	{ urls: 'stun:stun.l.google.com:19302' },
	{ urls: 'stun:stun1.l.google.com:19302' }
];

let localPeerId: string | null = null;
let peers = new Map<string, PeerConnection>();
let config: RTCConfig = {};
let messageCallbacks: ((peerId: string, data: unknown) => void)[] = [];

/**
 * Initialize WebRTC manager
 */
export function init(rtcConfig?: RTCConfig): void {
	config = rtcConfig || {};

	// Generate local peer ID
	localPeerId = `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

	// Listen for WebRTC signaling messages via WebSocket
	addMessageHandler('webrtc_offer', (msg) => handleOffer(msg as { fromId: string; targetId: string; sdp: string }));
	addMessageHandler('webrtc_answer', (msg) => handleAnswer(msg as { fromId: string; targetId: string; sdp: string }));
	addMessageHandler('webrtc_ice', (msg) => handleIceCandidate(msg as { fromId: string; targetId: string; candidate: RTCIceCandidateInit }));

	console.log('[WebRTC] Initialized with peerId:', localPeerId);
}

/**
 * Clean up WebRTC manager
 */
export function destroy(): void {
	// Close all peer connections
	for (const [peerId, peer] of peers) {
		peer.pc.close();
	}
	peers.clear();

	// Remove WebSocket handlers
	// Note: These handlers won't match exactly due to wrapper functions,
	// but we clear all state anyway in destroy()
	// For proper cleanup, we'd need to store the wrapped handlers

	localPeerId = null;
	connection.setWebRTCConnected(false);
}

/**
 * Create a peer connection and send offer
 */
export async function connectToPeer(targetPeerId: string): Promise<boolean> {
	if (!localPeerId) {
		console.warn('[WebRTC] Not initialized');
		return false;
	}

	if (peers.has(targetPeerId)) {
		console.warn('[WebRTC] Already connected to peer:', targetPeerId);
		return true;
	}

	try {
		const pc = createPeerConnection(targetPeerId);
		const dataChannel = pc.createDataChannel('game', { ordered: true });

		setupDataChannel(targetPeerId, dataChannel);

		peers.set(targetPeerId, {
			pc,
			dataChannel,
			peerId: targetPeerId,
			connected: false
		});

		// Create and send offer
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);

		wsSend({
			type: 'webrtc_offer',
			targetId: targetPeerId,
			fromId: localPeerId,
			sdp: offer.sdp
		});

		return true;
	} catch (err) {
		console.error('[WebRTC] Failed to connect to peer:', err);
		return false;
	}
}

/**
 * Disconnect from a peer
 */
export function disconnectFromPeer(peerId: string): void {
	const peer = peers.get(peerId);
	if (peer) {
		peer.pc.close();
		peers.delete(peerId);
	}

	// Update connection state if no peers left
	if (peers.size === 0) {
		connection.setWebRTCConnected(false);
	}
}

/**
 * Send data to a specific peer
 */
export function sendToPeer(peerId: string, data: unknown): boolean {
	const peer = peers.get(peerId);
	if (!peer?.dataChannel || peer.dataChannel.readyState !== 'open') {
		console.warn('[WebRTC] Cannot send - peer not connected:', peerId);
		return false;
	}

	peer.dataChannel.send(JSON.stringify(data));
	return true;
}

/**
 * Broadcast data to all connected peers
 */
export function broadcast(data: unknown): void {
	const message = JSON.stringify(data);
	for (const [peerId, peer] of peers) {
		if (peer.dataChannel?.readyState === 'open') {
			peer.dataChannel.send(message);
		}
	}
}

/**
 * Add message callback
 */
export function onMessage(callback: (peerId: string, data: unknown) => void): void {
	messageCallbacks.push(callback);
}

/**
 * Remove message callback
 */
export function offMessage(callback: (peerId: string, data: unknown) => void): void {
	const index = messageCallbacks.indexOf(callback);
	if (index >= 0) {
		messageCallbacks.splice(index, 1);
	}
}

/**
 * Get local peer ID
 */
export function getLocalPeerId(): string | null {
	return localPeerId;
}

/**
 * Get connected peer IDs
 */
export function getConnectedPeers(): string[] {
	const connected: string[] = [];
	for (const [peerId, peer] of peers) {
		if (peer.connected) {
			connected.push(peerId);
		}
	}
	return connected;
}

/**
 * Check if connected to any peer
 */
export function isP2PConnected(): boolean {
	return getConnectedPeers().length > 0;
}

// =============== INTERNAL HELPERS ===============

/**
 * Create a new RTCPeerConnection
 */
function createPeerConnection(peerId: string): RTCPeerConnection {
	const pc = new RTCPeerConnection({
		iceServers: config.iceServers || DEFAULT_ICE_SERVERS
	});

	// Handle ICE candidates
	pc.onicecandidate = (event) => {
		if (event.candidate) {
			wsSend({
				type: 'webrtc_ice',
				targetId: peerId,
				fromId: localPeerId,
				candidate: event.candidate.toJSON()
			});
		}
	};

	// Handle connection state changes
	pc.onconnectionstatechange = () => {
		console.log('[WebRTC] Connection state:', pc.connectionState);

		const peer = peers.get(peerId);
		if (peer) {
			peer.connected = pc.connectionState === 'connected';

			if (peer.connected) {
				connection.setWebRTCConnected(true, localPeerId);
			} else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
				disconnectFromPeer(peerId);
			}
		}
	};

	// Handle data channel from remote peer (for incoming connections)
	pc.ondatachannel = (event) => {
		const peer = peers.get(peerId);
		if (peer) {
			peer.dataChannel = event.channel;
			setupDataChannel(peerId, event.channel);
		}
	};

	return pc;
}

/**
 * Set up data channel event handlers
 */
function setupDataChannel(peerId: string, channel: RTCDataChannel): void {
	channel.onopen = () => {
		console.log('[WebRTC] Data channel open with:', peerId);
		const peer = peers.get(peerId);
		if (peer) {
			peer.connected = true;
			connection.setWebRTCConnected(true, localPeerId);
		}
	};

	channel.onclose = () => {
		console.log('[WebRTC] Data channel closed with:', peerId);
		disconnectFromPeer(peerId);
	};

	channel.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data);
			// Notify all callbacks
			for (const callback of messageCallbacks) {
				callback(peerId, data);
			}
		} catch (err) {
			console.warn('[WebRTC] Failed to parse message:', err);
		}
	};
}

/**
 * Handle incoming WebRTC offer
 */
async function handleOffer(message: { fromId: string; targetId: string; sdp: string }): Promise<void> {
	if (message.targetId !== localPeerId) return;

	console.log('[WebRTC] Received offer from:', message.fromId);

	const pc = createPeerConnection(message.fromId);

	peers.set(message.fromId, {
		pc,
		dataChannel: null,
		peerId: message.fromId,
		connected: false
	});

	await pc.setRemoteDescription({
		type: 'offer',
		sdp: message.sdp
	});

	const answer = await pc.createAnswer();
	await pc.setLocalDescription(answer);

	wsSend({
		type: 'webrtc_answer',
		targetId: message.fromId,
		fromId: localPeerId,
		sdp: answer.sdp
	});
}

/**
 * Handle incoming WebRTC answer
 */
async function handleAnswer(message: { fromId: string; targetId: string; sdp: string }): Promise<void> {
	if (message.targetId !== localPeerId) return;

	console.log('[WebRTC] Received answer from:', message.fromId);

	const peer = peers.get(message.fromId);
	if (peer) {
		await peer.pc.setRemoteDescription({
			type: 'answer',
			sdp: message.sdp
		});
	}
}

/**
 * Handle incoming ICE candidate
 */
async function handleIceCandidate(message: { fromId: string; targetId: string; candidate: RTCIceCandidateInit }): Promise<void> {
	if (message.targetId !== localPeerId) return;

	const peer = peers.get(message.fromId);
	if (peer) {
		await peer.pc.addIceCandidate(new RTCIceCandidate(message.candidate));
	}
}
