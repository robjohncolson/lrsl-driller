/**
 * Settings Store - User preferences
 * Manages sound, P2P, and other user settings
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const SETTINGS_KEY = 'driller_settings';

export interface SettingsState {
	soundEnabled: boolean;
	p2pEnabled: boolean;
	showNotifications: boolean;
	reducedMotion: boolean;
	autoAdvance: boolean;
	darkMode: boolean;
}

const defaultSettings: SettingsState = {
	soundEnabled: true,
	p2pEnabled: false, // WebRTC P2P disabled by default
	showNotifications: true,
	reducedMotion: false,
	autoAdvance: false,
	darkMode: false
};

function getInitialSettings(): SettingsState {
	if (!browser) {
		return defaultSettings;
	}

	try {
		const saved = localStorage.getItem(SETTINGS_KEY);
		if (saved) {
			return { ...defaultSettings, ...JSON.parse(saved) };
		}
	} catch (e) {
		console.warn('Failed to load settings:', e);
	}

	return defaultSettings;
}

function createSettingsStore() {
	const { subscribe, set, update } = writable<SettingsState>(getInitialSettings());

	const persist = (settings: SettingsState) => {
		if (browser) {
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
		}
	};

	return {
		subscribe,

		/**
		 * Update a single setting
		 */
		updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
			update(state => {
				const newState = { ...state, [key]: value };
				persist(newState);
				return newState;
			});
		},

		/**
		 * Toggle a boolean setting
		 */
		toggle: (key: keyof SettingsState) => {
			update(state => {
				const currentValue = state[key];
				if (typeof currentValue !== 'boolean') return state;

				const newState = { ...state, [key]: !currentValue };
				persist(newState);
				return newState;
			});
		},

		/**
		 * Toggle sound
		 */
		toggleSound: () => {
			update(state => {
				const newState = { ...state, soundEnabled: !state.soundEnabled };
				persist(newState);
				return newState;
			});
		},

		/**
		 * Toggle P2P mode
		 */
		toggleP2P: () => {
			update(state => {
				const newState = { ...state, p2pEnabled: !state.p2pEnabled };
				persist(newState);
				return newState;
			});
		},

		/**
		 * Reset to defaults
		 */
		reset: () => {
			set(defaultSettings);
			persist(defaultSettings);
		},

		/**
		 * Initialize from localStorage
		 */
		init: () => {
			if (browser) {
				set(getInitialSettings());
			}
		}
	};
}

export const settings = createSettingsStore();
