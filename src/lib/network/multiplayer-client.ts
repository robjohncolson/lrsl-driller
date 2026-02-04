/**
 * Multiplayer Game Client
 * Handles game state synchronization using P2P (preferred) or WebSocket fallback
 */

import { writable, get } from 'svelte/store';
import { sendGameState, connectToPeer, wsSend, addMessageHandler, removeMessageHandler, shouldPreferP2P } from './index';
import { connection } from '$lib/stores';

export interface GamePlayer {
	id: string;
	peerId?: string;
	username: string;
	x: number;
	y: number;
	lives: number;
	score: number;
	color: string;
	isLocal: boolean;
	lastUpdate: number;
}

export interface GameDot {
	id: string;
	x: number;
	y: number;
	ownerId: string | null;
	color: string;
}

export interface GameStateSnapshot {
	players: GamePlayer[];
	dots: GameDot[];
	timeRemaining: number;
	roundNumber: number;
}

interface MultiplayerClientConfig {
	roomCode: string;
	username: string;
	onStateUpdate?: (state: GameStateSnapshot) => void;
	onPlayerJoined?: (player: GamePlayer) => void;
	onPlayerLeft?: (playerId: string) => void;
	onGameStart?: () => void;
	onGameEnd?: (winner: string) => void;
	onError?: (error: string) => void;
}

type MessageHandler = (msg: unknown) => void;

// Client state store
export const multiplayerState = writable<{
	connected: boolean;
	roomCode: string | null;
	players: GamePlayer[];
	isHost: boolean;
	gameActive: boolean;
	transportType: 'p2p' | 'websocket';
}>({
	connected: false,
	roomCode: null,
	players: [],
	isHost: false,
	gameActive: false,
	transportType: 'websocket'
});

// Internal state
let config: MultiplayerClientConfig | null = null;
let handlers: Array<{ type: string; handler: MessageHandler }> = [];
let syncInterval: ReturnType<typeof setInterval> | null = null;
let localState: GameStateSnapshot | null = null;
let peerConnections = new Map<string, boolean>(); // peerId -> connected

// Sync rate (how often to broadcast state updates)
const SYNC_RATE_MS = 50; // 20 updates per second
const STATE_INTERPOLATION_MS = 100; // Interpolation buffer

/**
 * Initialize multiplayer client
 */
export function initMultiplayerClient(clientConfig: MultiplayerClientConfig): void {
	config = clientConfig;

	// Set up message handlers
	const playerJoinedHandler: MessageHandler = (msg) => {
		const data = msg as { player: GamePlayer };
		addPlayer(data.player);
		config?.onPlayerJoined?.(data.player);

		// Try to establish P2P connection with new player
		if (data.player.peerId && shouldPreferP2P()) {
			attemptP2PConnection(data.player.peerId);
		}
	};

	const playerLeftHandler: MessageHandler = (msg) => {
		const data = msg as { playerId: string };
		removePlayer(data.playerId);
		config?.onPlayerLeft?.(data.playerId);
	};

	const stateUpdateHandler: MessageHandler = (msg) => {
		const data = msg as { state: GameStateSnapshot; fromPeerId?: string };
		handleRemoteStateUpdate(data.state);
	};

	const gameStartHandler: MessageHandler = () => {
		multiplayerState.update(s => ({ ...s, gameActive: true }));
		config?.onGameStart?.();
		startSyncLoop();
	};

	const gameEndHandler: MessageHandler = (msg) => {
		const data = msg as { winner: string };
		multiplayerState.update(s => ({ ...s, gameActive: false }));
		config?.onGameEnd?.(data.winner);
		stopSyncLoop();
	};

	const p2pOfferHandler: MessageHandler = async (msg) => {
		const data = msg as { fromPeerId: string };
		// Automatically accept P2P connections in the same game room
		await attemptP2PConnection(data.fromPeerId);
	};

	handlers = [
		{ type: 'mp_player_joined', handler: playerJoinedHandler },
		{ type: 'mp_player_left', handler: playerLeftHandler },
		{ type: 'mp_state_update', handler: stateUpdateHandler },
		{ type: 'mp_game_start', handler: gameStartHandler },
		{ type: 'mp_game_end', handler: gameEndHandler },
		{ type: 'webrtc_offer', handler: p2pOfferHandler }
	];

	for (const { type, handler } of handlers) {
		addMessageHandler(type, handler);
	}

	// Join room via WebSocket
	wsSend({
		type: 'mp_join_room',
		roomCode: clientConfig.roomCode,
		username: clientConfig.username
	});

	multiplayerState.update(s => ({
		...s,
		connected: true,
		roomCode: clientConfig.roomCode
	}));

	console.log('[MultiplayerClient] Initialized for room:', clientConfig.roomCode);
}

/**
 * Destroy multiplayer client
 */
export function destroyMultiplayerClient(): void {
	stopSyncLoop();

	// Remove handlers
	for (const { type, handler } of handlers) {
		removeMessageHandler(type, handler);
	}
	handlers = [];

	// Leave room
	if (config?.roomCode) {
		wsSend({
			type: 'mp_leave_room',
			roomCode: config.roomCode
		});
	}

	// Reset state
	config = null;
	localState = null;
	peerConnections.clear();

	multiplayerState.set({
		connected: false,
		roomCode: null,
		players: [],
		isHost: false,
		gameActive: false,
		transportType: 'websocket'
	});

	console.log('[MultiplayerClient] Destroyed');
}

/**
 * Attempt P2P connection with a peer
 */
async function attemptP2PConnection(peerId: string): Promise<void> {
	if (peerConnections.has(peerId)) return;

	try {
		const connected = await connectToPeer(peerId);
		peerConnections.set(peerId, connected);

		if (connected) {
			console.log('[MultiplayerClient] P2P connected to:', peerId);
			multiplayerState.update(s => ({ ...s, transportType: 'p2p' }));
		}
	} catch (err) {
		console.warn('[MultiplayerClient] P2P connection failed:', err);
	}
}

/**
 * Add a player to the game
 */
function addPlayer(player: GamePlayer): void {
	multiplayerState.update(s => ({
		...s,
		players: [...s.players.filter(p => p.id !== player.id), player]
	}));
}

/**
 * Remove a player from the game
 */
function removePlayer(playerId: string): void {
	multiplayerState.update(s => ({
		...s,
		players: s.players.filter(p => p.id !== playerId)
	}));

	// Clean up P2P connection
	const state = get(multiplayerState);
	const player = state.players.find(p => p.id === playerId);
	if (player?.peerId) {
		peerConnections.delete(player.peerId);
	}
}

/**
 * Handle remote state update
 */
function handleRemoteStateUpdate(state: GameStateSnapshot): void {
	// Merge remote state with local state
	if (localState) {
		// Keep local player's position authoritative
		const localPlayer = localState.players.find(p => p.isLocal);
		if (localPlayer) {
			state.players = state.players.map(p =>
				p.id === localPlayer.id ? localPlayer : p
			);
		}
	}

	localState = state;
	config?.onStateUpdate?.(state);
}

/**
 * Update local player state
 */
export function updateLocalPlayer(update: Partial<GamePlayer>): void {
	if (!localState) return;

	const playerIndex = localState.players.findIndex(p => p.isLocal);
	if (playerIndex >= 0) {
		localState.players[playerIndex] = {
			...localState.players[playerIndex],
			...update,
			lastUpdate: Date.now()
		};
	}
}

/**
 * Update dots state
 */
export function updateDots(dots: GameDot[]): void {
	if (!localState) return;
	localState.dots = dots;
}

/**
 * Get current game state
 */
export function getGameState(): GameStateSnapshot | null {
	return localState;
}

/**
 * Start state sync loop
 */
function startSyncLoop(): void {
	if (syncInterval) return;

	syncInterval = setInterval(() => {
		if (!localState) return;

		// Create state update message
		const stateUpdate = {
			type: 'state_sync',
			state: {
				players: localState.players,
				dots: localState.dots,
				timeRemaining: localState.timeRemaining,
				roundNumber: localState.roundNumber
			}
		};

		// Send via preferred transport
		const preferP2P = shouldPreferP2P();
		if (preferP2P) {
			// Broadcast to all P2P peers
			sendGameState(stateUpdate);
			multiplayerState.update(s => ({ ...s, transportType: 'p2p' }));
		} else {
			// Fall back to WebSocket
			wsSend({
				type: 'mp_state_update',
				roomCode: config?.roomCode,
				state: stateUpdate.state
			});
			multiplayerState.update(s => ({ ...s, transportType: 'websocket' }));
		}
	}, SYNC_RATE_MS);

	console.log('[MultiplayerClient] Sync loop started');
}

/**
 * Stop state sync loop
 */
function stopSyncLoop(): void {
	if (syncInterval) {
		clearInterval(syncInterval);
		syncInterval = null;
	}

	console.log('[MultiplayerClient] Sync loop stopped');
}

/**
 * Send a game action (like claiming a dot, using ability, etc.)
 */
export function sendGameAction(action: {
	type: string;
	[key: string]: unknown;
}): void {
	const message = {
		type: 'game_action',
		roomCode: config?.roomCode,
		action
	};

	if (shouldPreferP2P()) {
		sendGameState(message);
	} else {
		wsSend(message);
	}
}

/**
 * Send chat message to room
 */
export function sendChatMessage(text: string): void {
	wsSend({
		type: 'mp_chat',
		roomCode: config?.roomCode,
		text,
		username: config?.username
	});
}

/**
 * Set local state for host initialization
 */
export function initializeGameState(state: GameStateSnapshot): void {
	localState = state;
	multiplayerState.update(s => ({ ...s, isHost: true }));
}

/**
 * Check if using P2P transport
 */
export function isUsingP2P(): boolean {
	const state = get(multiplayerState);
	return state.transportType === 'p2p';
}

/**
 * Get connected peer count
 */
export function getConnectedPeerCount(): number {
	let count = 0;
	for (const connected of peerConnections.values()) {
		if (connected) count++;
	}
	return count;
}
