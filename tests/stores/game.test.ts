/**
 * Unit tests for Game Store
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
import { game } from '$lib/stores/game';

// Sample manifest for testing
const sampleManifest = {
	meta: { id: 'test-cartridge' },
	modes: [
		{ id: 'mode1', unlockedBy: { gold: 0 } },
		{ id: 'mode2', unlockedBy: { gold: 1 } },
		{ id: 'mode3', unlockedBy: { gold: 2 } }
	],
	progression: {
		tiers: [
			{ id: 'tier1' },
			{ id: 'tier2' }
		]
	}
};

describe('Game Store', () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	describe('loadCartridge', () => {
		it('should set cartridgeId', () => {
			game.loadCartridge(sampleManifest);
			const state = get(game);
			expect(state.cartridgeId).toBe('test-cartridge');
		});

		it('should set modeOrder from manifest', () => {
			game.loadCartridge(sampleManifest);
			const state = get(game);
			expect(state.modeOrder).toEqual(['mode1', 'mode2', 'mode3']);
		});

		it('should initialize starsPerMode for each mode', () => {
			game.loadCartridge(sampleManifest);
			const state = get(game);
			expect(state.starsPerMode['mode1']).toEqual({ gold: 0, silver: 0, bronze: 0, tin: 0 });
			expect(state.starsPerMode['mode2']).toEqual({ gold: 0, silver: 0, bronze: 0, tin: 0 });
		});

		it('should initialize streaks for each mode', () => {
			game.loadCartridge(sampleManifest);
			const state = get(game);
			expect(state.streaks['mode1']).toBe(0);
			expect(state.streaks['mode2']).toBe(0);
		});
	});

	describe('awardStar', () => {
		beforeEach(() => {
			game.loadCartridge(sampleManifest);
		});

		it('should increment gold star count', () => {
			game.awardStar('gold', 'mode1');
			const state = get(game);
			expect(state.starCounts.gold).toBe(1);
		});

		it('should increment per-mode gold star count', () => {
			game.awardStar('gold', 'mode1');
			const state = get(game);
			expect(state.starsPerMode['mode1'].gold).toBe(1);
		});

		it('should increment silver star count', () => {
			game.awardStar('silver', 'mode1');
			const state = get(game);
			expect(state.starCounts.silver).toBe(1);
		});

		it('should increment bronze star count', () => {
			game.awardStar('bronze', 'mode1');
			const state = get(game);
			expect(state.starCounts.bronze).toBe(1);
		});

		it('should increment tin star count', () => {
			game.awardStar('tin', 'mode1');
			const state = get(game);
			expect(state.starCounts.tin).toBe(1);
		});
	});

	describe('useHint', () => {
		beforeEach(() => {
			game.loadCartridge(sampleManifest);
		});

		it('should increment hintsUsedThisProblem', () => {
			game.useHint();
			const state = get(game);
			expect(state.hintsUsedThisProblem).toBe(1);
		});

		it('should downgrade potential star after hints', () => {
			game.useHint(); // gold -> silver
			let state = get(game);
			expect(state.potentialStar).toBe('silver');

			game.useHint(); // silver -> bronze
			state = get(game);
			expect(state.potentialStar).toBe('bronze');

			game.useHint(); // bronze -> tin
			state = get(game);
			expect(state.potentialStar).toBe('tin');
		});
	});

	describe('useRetry', () => {
		beforeEach(() => {
			game.loadCartridge(sampleManifest);
		});

		it('should increment retriesThisProblem', () => {
			game.useRetry();
			const state = get(game);
			expect(state.retriesThisProblem).toBe(1);
		});

		it('should downgrade potential star after retries', () => {
			game.useRetry();
			const state = get(game);
			expect(state.potentialStar).toBe('silver');
		});
	});

	describe('resetForNewProblem', () => {
		beforeEach(() => {
			game.loadCartridge(sampleManifest);
		});

		it('should reset hints and retries', () => {
			game.useHint();
			game.useHint();
			game.useRetry();
			game.resetForNewProblem();

			const state = get(game);
			expect(state.hintsUsedThisProblem).toBe(0);
			expect(state.retriesThisProblem).toBe(0);
		});

		it('should reset potential star to gold', () => {
			game.useHint();
			game.useRetry();
			game.resetForNewProblem();

			const state = get(game);
			expect(state.potentialStar).toBe('gold');
		});
	});

	describe('Star Type Calculation', () => {
		beforeEach(() => {
			game.loadCartridge(sampleManifest);
		});

		it('should return gold with no penalties', () => {
			const state = get(game);
			expect(state.potentialStar).toBe('gold');
		});

		it('should return silver with 1 penalty', () => {
			game.useHint();
			const state = get(game);
			expect(state.potentialStar).toBe('silver');
		});

		it('should return bronze with 2 penalties', () => {
			game.useHint();
			game.useRetry();
			const state = get(game);
			expect(state.potentialStar).toBe('bronze');
		});

		it('should return tin with 3+ penalties', () => {
			game.useHint();
			game.useHint();
			game.useRetry();
			const state = get(game);
			expect(state.potentialStar).toBe('tin');
		});
	});

	describe('Persistence', () => {
		it('should save state to localStorage on awardStar', () => {
			game.loadCartridge(sampleManifest);
			game.awardStar('gold', 'mode1');

			const saved = localStorageMock.getItem('driller_test-cartridge_gameState');
			expect(saved).not.toBeNull();

			const parsed = JSON.parse(saved!);
			expect(parsed.starCounts.gold).toBe(1);
		});
	});
});
