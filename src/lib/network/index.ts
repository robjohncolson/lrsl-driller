/**
 * Network module exports
 */

// WebSocket client
export {
	connect as wsConnect,
	disconnect as wsDisconnect,
	send as wsSend,
	isConnected as wsIsConnected,
	notifyStarEarned,
	notifyClassTimeStart,
	notifyClassTimeEnd,
	addMessageHandler,
	removeMessageHandler
} from './websocket-client';
export type {
	WebSocketConfig,
	StarEarnedMessage,
	TeacherReviewMessage,
	ProgressionOverrideMessage
} from './websocket-client';

// WebRTC manager
export {
	init as rtcInit,
	destroy as rtcDestroy,
	connectToPeer,
	disconnectFromPeer,
	sendToPeer,
	broadcast,
	onMessage as onP2PMessage,
	offMessage as offP2PMessage,
	getLocalPeerId,
	getConnectedPeers,
	isP2PConnected
} from './webrtc-manager';

// Hybrid transport (recommended for most use cases)
export {
	init as initTransport,
	destroy as destroyTransport,
	sendGameState,
	sendToServer,
	getStatus as getTransportStatus,
	enableP2P,
	disableP2P,
	toggleP2P
} from './hybrid-transport';
export type { TransportConfig } from './hybrid-transport';

// Sync queue for offline-first progress sync
export {
	init as initSyncQueue,
	destroy as destroySyncQueue,
	syncFetch,
	syncProgress,
	enqueue as enqueueSyncRequest,
	processQueue as processSyncQueue,
	getQueueSize,
	clearQueue as clearSyncQueue,
	syncQueueState
} from './sync-queue';

// Connection quality monitoring
export {
	initQualityMonitor,
	destroyQualityMonitor,
	qualityMetrics,
	recommendedTransport,
	getQualitySnapshot,
	measureNow,
	shouldPreferP2P,
	getQualityIndicator
} from './connection-quality';
export type { QualityMetrics } from './connection-quality';

// Multiplayer game client
export {
	initMultiplayerClient,
	destroyMultiplayerClient,
	updateLocalPlayer,
	updateDots,
	getGameState,
	sendGameAction,
	sendChatMessage,
	initializeGameState,
	isUsingP2P,
	getConnectedPeerCount,
	multiplayerState
} from './multiplayer-client';
export type { GamePlayer, GameDot, GameStateSnapshot } from './multiplayer-client';
