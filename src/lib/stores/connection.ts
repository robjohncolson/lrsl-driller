/**
 * Connection Store - WebSocket and WebRTC state
 * Manages real-time connection status and online users
 */

import { writable, derived } from 'svelte/store';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
export type TransportType = 'websocket' | 'webrtc' | 'hybrid';

export interface OnlineUser {
	username: string;
	avatar?: string;
	lastSeen?: string;
}

export interface ConnectionState {
	status: ConnectionStatus;
	transportType: TransportType;
	latency: number | null;
	onlineUsers: OnlineUser[];
	webrtcConnected: boolean;
	webrtcPeerId: string | null;
	error: string | null;
	reconnectAttempts: number;
}

const initialState: ConnectionState = {
	status: 'disconnected',
	transportType: 'websocket',
	latency: null,
	onlineUsers: [],
	webrtcConnected: false,
	webrtcPeerId: null,
	error: null,
	reconnectAttempts: 0
};

function createConnectionStore() {
	const { subscribe, set, update } = writable<ConnectionState>(initialState);

	return {
		subscribe,

		/**
		 * Set connection status
		 */
		setStatus: (status: ConnectionStatus) => {
			update(state => ({ ...state, status, error: null }));
		},

		/**
		 * Set connecting state
		 */
		connecting: () => {
			update(state => ({ ...state, status: 'connecting' }));
		},

		/**
		 * Set connected state
		 */
		connected: () => {
			update(state => ({
				...state,
				status: 'connected',
				error: null,
				reconnectAttempts: 0
			}));
		},

		/**
		 * Set disconnected state
		 */
		disconnected: () => {
			update(state => ({
				...state,
				status: 'disconnected',
				webrtcConnected: false,
				webrtcPeerId: null
			}));
		},

		/**
		 * Set reconnecting state
		 */
		reconnecting: () => {
			update(state => ({
				...state,
				status: 'reconnecting',
				reconnectAttempts: state.reconnectAttempts + 1
			}));
		},

		/**
		 * Update latency
		 */
		setLatency: (latency: number) => {
			update(state => ({ ...state, latency }));
		},

		/**
		 * Update online users list
		 */
		setOnlineUsers: (users: OnlineUser[]) => {
			update(state => ({ ...state, onlineUsers: users }));
		},

		/**
		 * Add a user to online list
		 */
		addOnlineUser: (user: OnlineUser) => {
			update(state => {
				if (state.onlineUsers.some(u => u.username === user.username)) {
					return state;
				}
				return { ...state, onlineUsers: [...state.onlineUsers, user] };
			});
		},

		/**
		 * Remove a user from online list
		 */
		removeOnlineUser: (username: string) => {
			update(state => ({
				...state,
				onlineUsers: state.onlineUsers.filter(u => u.username !== username)
			}));
		},

		/**
		 * Set WebRTC connection state
		 */
		setWebRTCConnected: (connected: boolean, peerId: string | null = null) => {
			update(state => ({
				...state,
				webrtcConnected: connected,
				webrtcPeerId: peerId,
				transportType: connected ? 'webrtc' : 'websocket'
			}));
		},

		/**
		 * Set transport type
		 */
		setTransportType: (type: TransportType) => {
			update(state => ({ ...state, transportType: type }));
		},

		/**
		 * Set error
		 */
		setError: (error: string | null) => {
			update(state => ({ ...state, error }));
		},

		/**
		 * Reset to initial state
		 */
		reset: () => {
			set(initialState);
		}
	};
}

export const connection = createConnectionStore();

// Derived stores
export const isOnline = derived(connection, ($conn) => $conn.status === 'connected');
export const onlineCount = derived(connection, ($conn) => $conn.onlineUsers.length);
export const connectionIndicator = derived(connection, ($conn) => {
	if ($conn.webrtcConnected) {
		return {
			color: 'green',
			label: `P2P (${$conn.latency || '?'}ms)`,
			emoji: '🟢'
		};
	}
	if ($conn.status === 'connected') {
		return {
			color: 'yellow',
			label: `Server (${$conn.latency || '?'}ms)`,
			emoji: '🟡'
		};
	}
	if ($conn.status === 'connecting' || $conn.status === 'reconnecting') {
		return {
			color: 'yellow',
			label: 'Connecting...',
			emoji: '🟡'
		};
	}
	return {
		color: 'red',
		label: 'Offline',
		emoji: '🔴'
	};
});
