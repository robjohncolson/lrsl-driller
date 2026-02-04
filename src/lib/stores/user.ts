/**
 * User Store - Authentication and user profile
 * Manages username, teacher status, and avatar
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Constants
const TEACHER_KEY = 'driller_teacher_mode';
const USERNAME_KEY = 'driller_username';
const AVATAR_ANIMALS = ['🐻', '🦊', '🐰', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🦄', '🐶', '🐱'];

export interface UserState {
	username: string | null;
	isTeacher: boolean;
	isLoading: boolean;
	serverUrl: string;
}

// Get initial state from localStorage
function getInitialState(): UserState {
	if (!browser) {
		return {
			username: null,
			isTeacher: false,
			isLoading: true,
			serverUrl: 'https://lrsl-driller-production.up.railway.app'
		};
	}

	const savedUsername = localStorage.getItem(USERNAME_KEY);
	const savedTeacher = localStorage.getItem(TEACHER_KEY) === 'true';

	return {
		username: savedUsername,
		isTeacher: savedTeacher,
		isLoading: false,
		serverUrl: 'https://lrsl-driller-production.up.railway.app'
	};
}

// Create the store
function createUserStore() {
	const { subscribe, set, update } = writable<UserState>(getInitialState());

	return {
		subscribe,

		/**
		 * Set the username (persists to localStorage)
		 */
		setUsername: (username: string) => {
			if (browser) {
				localStorage.setItem(USERNAME_KEY, username);
			}
			update(state => ({ ...state, username, isLoading: false }));
		},

		/**
		 * Clear the username
		 */
		clearUsername: () => {
			if (browser) {
				localStorage.removeItem(USERNAME_KEY);
			}
			update(state => ({ ...state, username: null }));
		},

		/**
		 * Toggle teacher mode (persists to localStorage)
		 */
		toggleTeacher: () => {
			update(state => {
				const newTeacherState = !state.isTeacher;
				if (browser) {
					localStorage.setItem(TEACHER_KEY, String(newTeacherState));
				}
				return { ...state, isTeacher: newTeacherState };
			});
		},

		/**
		 * Set teacher mode explicitly
		 */
		setTeacher: (isTeacher: boolean) => {
			if (browser) {
				localStorage.setItem(TEACHER_KEY, String(isTeacher));
			}
			update(state => ({ ...state, isTeacher }));
		},

		/**
		 * Set the server URL
		 */
		setServerUrl: (serverUrl: string) => {
			update(state => ({ ...state, serverUrl }));
		},

		/**
		 * Initialize from localStorage (call on mount)
		 */
		init: () => {
			if (browser) {
				const state = getInitialState();
				set(state);
			}
		},

		/**
		 * Reset to initial state
		 */
		reset: () => {
			if (browser) {
				localStorage.removeItem(USERNAME_KEY);
				localStorage.removeItem(TEACHER_KEY);
			}
			set({
				username: null,
				isTeacher: false,
				isLoading: false,
				serverUrl: 'https://lrsl-driller-production.up.railway.app'
			});
		}
	};
}

export const user = createUserStore();

/**
 * Derive avatar from username using consistent hashing
 */
export const avatar = derived(user, ($user) => {
	if (!$user.username) return '👤';

	// Simple hash function for consistent avatar
	let hash = 0;
	for (let i = 0; i < $user.username.length; i++) {
		hash = ((hash << 5) - hash) + $user.username.charCodeAt(i);
		hash = hash & hash;
	}

	const index = Math.abs(hash) % AVATAR_ANIMALS.length;
	return AVATAR_ANIMALS[index];
});

/**
 * Get avatar for any username
 */
export function getAvatarForUsername(username: string): string {
	let hash = 0;
	for (let i = 0; i < username.length; i++) {
		hash = ((hash << 5) - hash) + username.charCodeAt(i);
		hash = hash & hash;
	}
	const index = Math.abs(hash) % AVATAR_ANIMALS.length;
	return AVATAR_ANIMALS[index];
}
