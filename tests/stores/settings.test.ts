/**
 * Unit tests for Settings Store
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
import { settings } from '$lib/stores/settings';

describe('Settings Store', () => {
	beforeEach(() => {
		localStorageMock.clear();
		settings.reset();
	});

	describe('Initial State', () => {
		it('should have soundEnabled as true by default', () => {
			const state = get(settings);
			expect(state.soundEnabled).toBe(true);
		});

		it('should have p2pEnabled as false by default', () => {
			const state = get(settings);
			expect(state.p2pEnabled).toBe(false);
		});

		it('should have showNotifications as true by default', () => {
			const state = get(settings);
			expect(state.showNotifications).toBe(true);
		});

		it('should have reducedMotion as false by default', () => {
			const state = get(settings);
			expect(state.reducedMotion).toBe(false);
		});

		it('should have autoAdvance as false by default', () => {
			const state = get(settings);
			expect(state.autoAdvance).toBe(false);
		});

		it('should have darkMode as false by default', () => {
			const state = get(settings);
			expect(state.darkMode).toBe(false);
		});
	});

	describe('toggleSound', () => {
		it('should toggle sound off', () => {
			settings.toggleSound();
			expect(get(settings).soundEnabled).toBe(false);
		});

		it('should toggle sound back on', () => {
			settings.toggleSound();
			settings.toggleSound();
			expect(get(settings).soundEnabled).toBe(true);
		});
	});

	describe('toggleP2P', () => {
		it('should toggle P2P on', () => {
			settings.toggleP2P();
			expect(get(settings).p2pEnabled).toBe(true);
		});

		it('should toggle P2P back off', () => {
			settings.toggleP2P();
			settings.toggleP2P();
			expect(get(settings).p2pEnabled).toBe(false);
		});
	});

	describe('toggle (generic)', () => {
		it('should toggle any boolean setting', () => {
			settings.toggle('reducedMotion');
			expect(get(settings).reducedMotion).toBe(true);

			settings.toggle('reducedMotion');
			expect(get(settings).reducedMotion).toBe(false);
		});

		it('should toggle autoAdvance', () => {
			settings.toggle('autoAdvance');
			expect(get(settings).autoAdvance).toBe(true);
		});

		it('should toggle darkMode', () => {
			settings.toggle('darkMode');
			expect(get(settings).darkMode).toBe(true);
		});
	});

	describe('updateSetting', () => {
		it('should update soundEnabled', () => {
			settings.updateSetting('soundEnabled', false);
			expect(get(settings).soundEnabled).toBe(false);
		});

		it('should update p2pEnabled', () => {
			settings.updateSetting('p2pEnabled', true);
			expect(get(settings).p2pEnabled).toBe(true);
		});

		it('should update showNotifications', () => {
			settings.updateSetting('showNotifications', false);
			expect(get(settings).showNotifications).toBe(false);
		});

		it('should update reducedMotion', () => {
			settings.updateSetting('reducedMotion', true);
			expect(get(settings).reducedMotion).toBe(true);
		});
	});

	describe('Persistence', () => {
		it('should persist settings to localStorage', () => {
			settings.toggleSound();
			settings.toggleP2P();

			const saved = localStorageMock.getItem('driller_settings');
			expect(saved).not.toBeNull();

			const parsed = JSON.parse(saved!);
			expect(parsed.soundEnabled).toBe(false);
			expect(parsed.p2pEnabled).toBe(true);
		});

		it('should load settings from localStorage on init', () => {
			const savedSettings = {
				soundEnabled: false,
				p2pEnabled: true,
				showNotifications: false,
				reducedMotion: true,
				autoAdvance: true,
				darkMode: true
			};
			localStorageMock.setItem('driller_settings', JSON.stringify(savedSettings));

			settings.init();

			const state = get(settings);
			expect(state.soundEnabled).toBe(false);
			expect(state.p2pEnabled).toBe(true);
			expect(state.showNotifications).toBe(false);
			expect(state.reducedMotion).toBe(true);
			expect(state.autoAdvance).toBe(true);
			expect(state.darkMode).toBe(true);
		});
	});

	describe('Reset', () => {
		it('should reset all settings to defaults', () => {
			settings.toggleSound();
			settings.toggleP2P();
			settings.toggle('reducedMotion');
			settings.toggle('darkMode');

			settings.reset();

			const state = get(settings);
			expect(state.soundEnabled).toBe(true);
			expect(state.p2pEnabled).toBe(false);
			expect(state.showNotifications).toBe(true);
			expect(state.reducedMotion).toBe(false);
			expect(state.autoAdvance).toBe(false);
			expect(state.darkMode).toBe(false);
		});
	});
});
