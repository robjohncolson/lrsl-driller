/**
 * Game Store - Stars, streaks, and progression
 * Wraps GameEngine state in reactive Svelte stores
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface StarCounts {
	gold: number;
	silver: number;
	bronze: number;
	tin: number;
}

export interface StarsPerMode {
	[modeId: string]: StarCounts;
}

export interface GameState {
	cartridgeId: string | null;
	currentTier: string | null;
	unlockedTiers: string[];
	modeOrder: string[];
	starCounts: StarCounts;
	starsPerMode: StarsPerMode;
	streaks: { [fieldId: string]: number };
	goldToUnlock: number;
	hintsUsedThisProblem: number;
	retriesThisProblem: number;
	totalPenalties: number;
	potentialStar: 'gold' | 'silver' | 'bronze' | 'tin';
	progressionOverrides: { [modeId: string]: number };
	stateUpdatedAt: string | null;
}

const initialState: GameState = {
	cartridgeId: null,
	currentTier: null,
	unlockedTiers: [],
	modeOrder: [],
	starCounts: { gold: 0, silver: 0, bronze: 0, tin: 0 },
	starsPerMode: {},
	streaks: {},
	goldToUnlock: 1,
	hintsUsedThisProblem: 0,
	retriesThisProblem: 0,
	totalPenalties: 0,
	potentialStar: 'gold',
	progressionOverrides: {},
	stateUpdatedAt: null
};

function getStorageKey(cartridgeId: string): string {
	return `driller_${cartridgeId}_gameState`;
}

function getStarType(hintsUsed: number, retries: number): 'gold' | 'silver' | 'bronze' | 'tin' {
	const totalPenalties = hintsUsed + retries;
	if (totalPenalties === 0) return 'gold';
	if (totalPenalties === 1) return 'silver';
	if (totalPenalties === 2) return 'bronze';
	return 'tin';
}

function createGameStore() {
	const { subscribe, set, update } = writable<GameState>(initialState);

	return {
		subscribe,

		/**
		 * Load a cartridge and initialize game state
		 */
		loadCartridge: (manifest: {
			meta: { id: string };
			modes?: Array<{ id: string; unlockedBy?: { gold?: number } | string }>;
			progression?: { tiers?: Array<{ id: string }> };
		}) => {
			const cartridgeId = manifest.meta.id;
			const modes = manifest.modes || [];
			const modeOrder = modes.map(m => m.id);

			// Initialize state
			let state: GameState = {
				...initialState,
				cartridgeId,
				modeOrder,
				starsPerMode: {},
				streaks: {}
			};

			// Initialize starsPerMode for each mode
			for (const modeId of modeOrder) {
				state.starsPerMode[modeId] = { gold: 0, silver: 0, bronze: 0, tin: 0 };
			}

			// Initialize streaks
			for (const modeId of modeOrder) {
				state.streaks[modeId] = 0;
			}

			// Load saved state from localStorage
			if (browser) {
				const saved = localStorage.getItem(getStorageKey(cartridgeId));
				if (saved) {
					try {
						const savedState = JSON.parse(saved);
						state = {
							...state,
							starCounts: savedState.starCounts || state.starCounts,
							starsPerMode: { ...state.starsPerMode, ...savedState.starsPerMode },
							streaks: { ...state.streaks, ...savedState.streaks },
							currentTier: savedState.currentTier || null,
							unlockedTiers: savedState.unlockedTiers || [],
							stateUpdatedAt: savedState.updated_at || null
						};
					} catch (e) {
						console.warn('Failed to load game state:', e);
					}
				}
			}

			// Check unlocks
			state.unlockedTiers = checkUnlocks(modes, state.starsPerMode, modeOrder, state.goldToUnlock, state.progressionOverrides);
			if (!state.currentTier && state.unlockedTiers.length > 0) {
				state.currentTier = state.unlockedTiers[0];
			}

			set(state);
		},

		/**
		 * Award a star for completing a problem
		 */
		awardStar: (starType: 'gold' | 'silver' | 'bronze' | 'tin', modeId: string | null = null) => {
			update(state => {
				const newState = { ...state };

				// Update total star counts
				newState.starCounts = { ...state.starCounts };
				newState.starCounts[starType]++;

				// Update per-mode stars
				if (modeId && newState.starsPerMode[modeId]) {
					newState.starsPerMode = { ...state.starsPerMode };
					newState.starsPerMode[modeId] = { ...newState.starsPerMode[modeId] };
					newState.starsPerMode[modeId][starType]++;
				}

				// Update timestamp
				newState.stateUpdatedAt = new Date().toISOString();

				// Re-check unlocks
				// We need mode definitions but don't have them here - skip for now
				// The unlocks will be rechecked when loadCartridge is called again

				// Save to localStorage
				if (browser && state.cartridgeId) {
					localStorage.setItem(getStorageKey(state.cartridgeId), JSON.stringify({
						starCounts: newState.starCounts,
						starsPerMode: newState.starsPerMode,
						streaks: newState.streaks,
						currentTier: newState.currentTier,
						unlockedTiers: newState.unlockedTiers,
						updated_at: newState.stateUpdatedAt
					}));
				}

				return newState;
			});
		},

		/**
		 * Use a hint (increases penalty)
		 */
		useHint: () => {
			update(state => {
				const hintsUsed = state.hintsUsedThisProblem + 1;
				const totalPenalties = hintsUsed + state.retriesThisProblem;
				return {
					...state,
					hintsUsedThisProblem: hintsUsed,
					totalPenalties,
					potentialStar: getStarType(hintsUsed, state.retriesThisProblem)
				};
			});
		},

		/**
		 * Use a retry (increases penalty)
		 */
		useRetry: () => {
			update(state => {
				const retries = state.retriesThisProblem + 1;
				const totalPenalties = state.hintsUsedThisProblem + retries;
				return {
					...state,
					retriesThisProblem: retries,
					totalPenalties,
					potentialStar: getStarType(state.hintsUsedThisProblem, retries)
				};
			});
		},

		/**
		 * Reset hints and retries for a new problem
		 */
		resetForNewProblem: () => {
			update(state => ({
				...state,
				hintsUsedThisProblem: 0,
				retriesThisProblem: 0,
				totalPenalties: 0,
				potentialStar: 'gold'
			}));
		},

		/**
		 * Update streak for a field
		 */
		updateStreak: (fieldId: string, correct: boolean) => {
			update(state => {
				const newStreaks = { ...state.streaks };
				if (correct) {
					newStreaks[fieldId] = (newStreaks[fieldId] || 0) + 1;
				} else {
					newStreaks[fieldId] = 0;
				}
				return { ...state, streaks: newStreaks };
			});
		},

		/**
		 * Set current tier/mode
		 */
		setTier: (tierId: string) => {
			update(state => {
				if (state.unlockedTiers.includes(tierId)) {
					const newState = { ...state, currentTier: tierId };

					// Save to localStorage
					if (browser && state.cartridgeId) {
						localStorage.setItem(getStorageKey(state.cartridgeId), JSON.stringify({
							starCounts: newState.starCounts,
							starsPerMode: newState.starsPerMode,
							streaks: newState.streaks,
							currentTier: newState.currentTier,
							unlockedTiers: newState.unlockedTiers,
							updated_at: newState.stateUpdatedAt
						}));
					}

					return newState;
				}
				return state;
			});
		},

		/**
		 * Set progression overrides (from teacher)
		 */
		setOverrides: (overrides: { [modeId: string]: number }) => {
			update(state => ({
				...state,
				progressionOverrides: overrides
			}));
		},

		/**
		 * Reset all progress
		 */
		resetProgress: () => {
			update(state => {
				const newState = {
					...state,
					starCounts: { gold: 0, silver: 0, bronze: 0, tin: 0 },
					starsPerMode: {} as StarsPerMode,
					streaks: {} as { [fieldId: string]: number },
					currentTier: state.modeOrder[0] || null,
					unlockedTiers: state.modeOrder[0] ? [state.modeOrder[0]] : [],
					stateUpdatedAt: new Date().toISOString()
				};

				// Re-initialize starsPerMode
				for (const modeId of state.modeOrder) {
					(newState.starsPerMode as StarsPerMode)[modeId] = { gold: 0, silver: 0, bronze: 0, tin: 0 };
					(newState.streaks as { [fieldId: string]: number })[modeId] = 0;
				}

				// Save to localStorage
				if (browser && state.cartridgeId) {
					localStorage.setItem(getStorageKey(state.cartridgeId), JSON.stringify({
						starCounts: newState.starCounts,
						starsPerMode: newState.starsPerMode,
						streaks: newState.streaks,
						currentTier: newState.currentTier,
						unlockedTiers: newState.unlockedTiers,
						updated_at: newState.stateUpdatedAt
					}));
				}

				return newState;
			});
		},

		/**
		 * Get current state (for sync)
		 */
		getState: () => {
			return get({ subscribe });
		}
	};
}

/**
 * Check which tiers should be unlocked based on star progress
 */
function checkUnlocks(
	modes: Array<{ id: string; unlockedBy?: { gold?: number } | string }>,
	starsPerMode: StarsPerMode,
	modeOrder: string[],
	defaultGoldToUnlock: number,
	overrides: { [modeId: string]: number }
): string[] {
	const unlocked: string[] = [];

	for (let i = 0; i < modes.length; i++) {
		const mode = modes[i];

		// First level is always unlocked
		if (i === 0 || mode.unlockedBy === 'default') {
			unlocked.push(mode.id);
			continue;
		}

		// Check if previous level has enough gold stars
		const prevModeId = modeOrder[i - 1];
		const prevStars = starsPerMode[prevModeId] || { gold: 0 };

		// Get required gold: override > manifest > default
		let requiredGold = defaultGoldToUnlock;
		if (overrides[mode.id] !== undefined) {
			requiredGold = overrides[mode.id];
		} else if (typeof mode.unlockedBy === 'object' && mode.unlockedBy?.gold !== undefined) {
			requiredGold = mode.unlockedBy.gold;
		}

		if (unlocked.includes(prevModeId) && prevStars.gold >= requiredGold) {
			unlocked.push(mode.id);
		}
	}

	return unlocked;
}

export const game = createGameStore();

// Derived stores for convenience
export const currentMode = derived(game, ($game) => $game.currentTier);
export const totalStars = derived(game, ($game) => {
	const { gold, silver, bronze, tin } = $game.starCounts;
	return gold + silver + bronze + tin;
});
export const goldStars = derived(game, ($game) => $game.starCounts.gold);
