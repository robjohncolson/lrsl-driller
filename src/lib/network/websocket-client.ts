/**
 * WebSocket Client - Real-time connection to Railway server
 * Wraps the existing WebSocketClient with Svelte store integration
 */

import { connection, type OnlineUser } from '$lib/stores';
import { getAvatarForUsername } from '$lib/stores/user';

export interface WebSocketConfig {
	serverUrl: string;
	username: string;
	onStarEarned?: (data: StarEarnedMessage) => void;
	onClassTimeStart?: (goal: string) => void;
	onClassTimeEnd?: () => void;
	onLeaderboardUpdate?: () => void;
	onTeacherReviewSubmitted?: (data: TeacherReviewMessage) => void;
	onTeacherReviewCompleted?: (data: TeacherReviewMessage) => void;
	onOrbitsLobbyStatus?: (payload: unknown) => void;
	onProgressionOverride?: (data: ProgressionOverrideMessage) => void;
}

export interface StarEarnedMessage {
	username: string;
	star_type: 'gold' | 'silver' | 'bronze' | 'tin';
	scenario_topic?: string;
}

export interface TeacherReviewMessage {
	username: string;
	topic?: string;
}

export interface ProgressionOverrideMessage {
	type: 'progression_override_changed' | 'progression_override_removed' | 'progression_overrides_cleared';
	modeId?: string;
	goldRequired?: number;
}

type MessageHandler = (message: unknown) => void;

let ws: WebSocket | null = null;
let config: WebSocketConfig | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Custom message handlers
const customHandlers = new Map<string, MessageHandler[]>();

/**
 * Get WebSocket URL from HTTP URL
 */
function getWsUrl(serverUrl: string): string {
	return serverUrl.replace('https://', 'wss://').replace('http://', 'ws://');
}

/**
 * Connect to WebSocket server
 */
export function connect(wsConfig: WebSocketConfig): void {
	if (ws) {
		console.warn('WebSocket already connected');
		return;
	}

	config = wsConfig;
	const wsUrl = getWsUrl(wsConfig.serverUrl);

	connection.connecting();

	try {
		ws = new WebSocket(wsUrl);

		ws.onopen = () => {
			console.log('[WS] Connected');
			connection.connected();
			reconnectAttempts = 0;

			// Identify ourselves
			send({ type: 'identify', username: wsConfig.username });

			// Start heartbeat
			heartbeatInterval = setInterval(() => {
				if (ws?.readyState === WebSocket.OPEN) {
					send({ type: 'heartbeat', username: wsConfig.username });
				}
			}, 30000);
		};

		ws.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);
				handleMessage(message);
			} catch (err) {
				console.warn('[WS] Message parse error:', err);
			}
		};

		ws.onclose = () => {
			console.log('[WS] Disconnected');
			cleanup();
			connection.disconnected();

			// Attempt reconnect
			if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && config) {
				reconnectAttempts++;
				connection.reconnecting();
				setTimeout(() => {
					if (config) connect(config);
				}, 5000 * reconnectAttempts);
			}
		};

		ws.onerror = (err) => {
			console.warn('[WS] Error:', err);
			connection.setError('WebSocket connection error');
		};
	} catch (err) {
		console.error('[WS] Connection failed:', err);
		connection.setError('Failed to connect');
	}
}

/**
 * Disconnect from WebSocket server
 */
export function disconnect(): void {
	cleanup();
	if (ws) {
		ws.close();
		ws = null;
	}
	connection.disconnected();
}

/**
 * Clean up resources
 */
function cleanup(): void {
	if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
		heartbeatInterval = null;
	}
}

/**
 * Send message to server
 */
export function send(message: unknown): void {
	if (ws?.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify(message));
	}
}

/**
 * Handle incoming WebSocket message
 */
function handleMessage(message: { type: string; [key: string]: unknown }): void {
	switch (message.type) {
		case 'presence_snapshot':
			handlePresenceSnapshot(message.users as string[]);
			break;

		case 'user_online':
			handleUserOnline(message.username as string);
			break;

		case 'user_offline':
			handleUserOffline(message.username as string);
			break;

		case 'star_earned':
			if (message.username !== config?.username) {
				config?.onStarEarned?.(message as unknown as StarEarnedMessage);
			}
			break;

		case 'leaderboard_update':
			config?.onLeaderboardUpdate?.();
			break;

		case 'class_time_start':
			config?.onClassTimeStart?.(message.goal as string);
			break;

		case 'class_time_end':
			config?.onClassTimeEnd?.();
			break;

		case 'teacher_review_submitted':
			config?.onTeacherReviewSubmitted?.(message as unknown as TeacherReviewMessage);
			break;

		case 'teacher_review_completed':
			config?.onTeacherReviewCompleted?.(message as unknown as TeacherReviewMessage);
			break;

		case 'orbits_lobby_status':
			config?.onOrbitsLobbyStatus?.(message.payload);
			break;

		case 'progression_override_changed':
		case 'progression_override_removed':
		case 'progression_overrides_cleared':
			config?.onProgressionOverride?.(message as unknown as ProgressionOverrideMessage);
			break;

		// WebRTC signaling messages (forward to custom handlers)
		case 'webrtc_offer':
		case 'webrtc_answer':
		case 'webrtc_ice':
			notifyHandlers(message.type, message);
			break;

		default:
			// Notify any custom handlers
			notifyHandlers(message.type, message);
	}
}

/**
 * Handle presence snapshot from server
 */
function handlePresenceSnapshot(usernames: string[]): void {
	const users: OnlineUser[] = usernames.map(username => ({
		username,
		avatar: getAvatarForUsername(username)
	}));
	connection.setOnlineUsers(users);
}

/**
 * Handle user coming online
 */
function handleUserOnline(username: string): void {
	connection.addOnlineUser({
		username,
		avatar: getAvatarForUsername(username)
	});
}

/**
 * Handle user going offline
 */
function handleUserOffline(username: string): void {
	connection.removeOnlineUser(username);
}

// =============== PUBLIC API ===============

/**
 * Notify server of star earned
 */
export function notifyStarEarned(username: string, starType: string, scenarioTopic?: string): void {
	send({
		type: 'star_earned',
		username,
		star_type: starType,
		scenario_topic: scenarioTopic
	});
}

/**
 * Notify server of class time start (teacher only)
 */
export function notifyClassTimeStart(goal: string): void {
	send({ type: 'class_time_start', goal });
}

/**
 * Notify server of class time end (teacher only)
 */
export function notifyClassTimeEnd(): void {
	send({ type: 'class_time_end' });
}

/**
 * Add custom message handler
 */
export function addMessageHandler(type: string, handler: MessageHandler): void {
	const handlers = customHandlers.get(type) || [];
	handlers.push(handler);
	customHandlers.set(type, handlers);
}

/**
 * Remove custom message handler
 */
export function removeMessageHandler(type: string, handler: MessageHandler): void {
	const handlers = customHandlers.get(type);
	if (handlers) {
		const index = handlers.indexOf(handler);
		if (index >= 0) {
			handlers.splice(index, 1);
		}
	}
}

/**
 * Notify custom handlers
 */
function notifyHandlers(type: string, message: unknown): void {
	const handlers = customHandlers.get(type);
	if (handlers) {
		for (const handler of handlers) {
			handler(message);
		}
	}
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
	return ws?.readyState === WebSocket.OPEN;
}

/**
 * Get current WebSocket instance (for advanced use)
 */
export function getWebSocket(): WebSocket | null {
	return ws;
}
