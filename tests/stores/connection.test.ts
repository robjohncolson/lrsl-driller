/**
 * Unit tests for Connection Store
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Import the store
import { connection } from '$lib/stores/connection';

describe('Connection Store', () => {
	beforeEach(() => {
		connection.reset();
	});

	describe('Initial State', () => {
		it('should have disconnected status initially', () => {
			const state = get(connection);
			expect(state.status).toBe('disconnected');
		});

		it('should have null latency initially', () => {
			const state = get(connection);
			expect(state.latency).toBeNull();
		});

		it('should have empty onlineUsers initially', () => {
			const state = get(connection);
			expect(state.onlineUsers).toEqual([]);
		});

		it('should have 0 reconnectAttempts initially', () => {
			const state = get(connection);
			expect(state.reconnectAttempts).toBe(0);
		});

		it('should have webrtcConnected as false initially', () => {
			const state = get(connection);
			expect(state.webrtcConnected).toBe(false);
		});

		it('should have transportType as websocket initially', () => {
			const state = get(connection);
			expect(state.transportType).toBe('websocket');
		});
	});

	describe('setStatus', () => {
		it('should update status', () => {
			connection.setStatus('connecting');
			const state = get(connection);
			expect(state.status).toBe('connecting');
		});

		it('should clear error when setting status', () => {
			connection.setError('Test error');
			connection.setStatus('connected');
			const state = get(connection);
			expect(state.error).toBeNull();
		});
	});

	describe('connecting', () => {
		it('should set status to connecting', () => {
			connection.connecting();
			const state = get(connection);
			expect(state.status).toBe('connecting');
		});
	});

	describe('connected', () => {
		it('should set status to connected', () => {
			connection.connected();
			const state = get(connection);
			expect(state.status).toBe('connected');
		});

		it('should reset reconnectAttempts', () => {
			connection.reconnecting();
			connection.reconnecting();
			connection.connected();
			const state = get(connection);
			expect(state.reconnectAttempts).toBe(0);
		});
	});

	describe('disconnected', () => {
		it('should set status to disconnected', () => {
			connection.connected();
			connection.disconnected();
			const state = get(connection);
			expect(state.status).toBe('disconnected');
		});

		it('should reset webrtcConnected', () => {
			connection.disconnected();
			const state = get(connection);
			expect(state.webrtcConnected).toBe(false);
		});
	});

	describe('reconnecting', () => {
		it('should set status to reconnecting', () => {
			connection.reconnecting();
			const state = get(connection);
			expect(state.status).toBe('reconnecting');
		});

		it('should increment reconnectAttempts', () => {
			connection.reconnecting();
			connection.reconnecting();
			const state = get(connection);
			expect(state.reconnectAttempts).toBe(2);
		});
	});

	describe('setLatency', () => {
		it('should update latency', () => {
			connection.setLatency(50);
			const state = get(connection);
			expect(state.latency).toBe(50);
		});
	});

	describe('setOnlineUsers', () => {
		it('should update online users list', () => {
			const users = [
				{ username: 'user1' },
				{ username: 'user2' }
			];
			connection.setOnlineUsers(users);
			const state = get(connection);
			expect(state.onlineUsers).toEqual(users);
		});
	});

	describe('setError', () => {
		it('should set error message', () => {
			connection.setError('Connection failed');
			const state = get(connection);
			expect(state.error).toBe('Connection failed');
		});
	});
});
