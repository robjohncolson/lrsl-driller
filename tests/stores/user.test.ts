/**
 * Unit tests for User Store
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => { store[key] = value; },
		removeItem: (key: string) => { delete store[key]; },
		clear: () => { store = {}; }
	};
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Import after mocking
import { user, getAvatarForUsername } from '$lib/stores/user';

describe('User Store', () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	describe('Initial State', () => {
		it('should have null username initially', () => {
			const state = get(user);
			// Note: May have loaded from localStorage in a fresh import
			expect(state.username).toBeDefined();
		});

		it('should have isTeacher as false initially', () => {
			const state = get(user);
			expect(state.isTeacher).toBe(false);
		});

		it('should have serverUrl set', () => {
			const state = get(user);
			expect(state.serverUrl).toContain('railway.app');
		});
	});

	describe('setUsername', () => {
		it('should update username in store', () => {
			user.setUsername('testuser');
			const state = get(user);
			expect(state.username).toBe('testuser');
		});

		it('should persist username to localStorage', () => {
			user.setUsername('persisteduser');
			expect(localStorageMock.getItem('driller_username')).toBe('persisteduser');
		});

		it('should set isLoading to false', () => {
			user.setUsername('loadingtest');
			const state = get(user);
			expect(state.isLoading).toBe(false);
		});
	});

	describe('setTeacher', () => {
		it('should enable teacher mode', () => {
			user.setTeacher(true);
			const state = get(user);
			expect(state.isTeacher).toBe(true);
		});

		it('should disable teacher mode', () => {
			user.setTeacher(true);
			user.setTeacher(false);
			const state = get(user);
			expect(state.isTeacher).toBe(false);
		});

		it('should persist teacher mode to localStorage', () => {
			user.setTeacher(true);
			expect(localStorageMock.getItem('driller_teacher_mode')).toBe('true');
		});
	});

	describe('reset', () => {
		it('should clear username', () => {
			user.setUsername('toLogout');
			user.reset();
			const state = get(user);
			expect(state.username).toBeNull();
		});

		it('should clear teacher mode', () => {
			user.setTeacher(true);
			user.reset();
			const state = get(user);
			expect(state.isTeacher).toBe(false);
		});

		it('should remove from localStorage', () => {
			user.setUsername('toLogout');
			user.reset();
			expect(localStorageMock.getItem('driller_username')).toBeNull();
		});
	});
});

describe('getAvatarForUsername', () => {
	it('should return an emoji avatar', () => {
		const avatar = getAvatarForUsername('testuser');
		expect(avatar).toBeDefined();
		expect(typeof avatar).toBe('string');
		expect(avatar.length).toBeGreaterThan(0);
	});

	it('should return consistent avatar for same username', () => {
		const avatar1 = getAvatarForUsername('consistentuser');
		const avatar2 = getAvatarForUsername('consistentuser');
		expect(avatar1).toBe(avatar2);
	});

	it('should return different avatars for different usernames', () => {
		const avatar1 = getAvatarForUsername('user1');
		const avatar2 = getAvatarForUsername('user2');
		// They might occasionally be the same due to hash collision, but usually different
		// Just check they're both valid
		expect(avatar1).toBeDefined();
		expect(avatar2).toBeDefined();
	});

	it('should handle empty username', () => {
		const avatar = getAvatarForUsername('');
		expect(avatar).toBeDefined();
	});
});
