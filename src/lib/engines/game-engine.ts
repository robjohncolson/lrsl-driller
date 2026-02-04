/**
 * Game Engine Wrapper
 * Wraps the existing GameEngine class with Svelte store integration
 */

import { game } from '$lib/stores';
import type { StarCounts } from '$lib/stores';

// Import the original GameEngine
// We'll dynamically import to avoid SSR issues
let GameEngineClass: typeof import('../../../platform/core/game-engine.js').GameEngine | null = null;

interface GameEngineInstance {
	loadCartridge(manifest: unknown): GameEngineInstance;
	recordResult(fieldId: string, score: string, allFieldsCorrect: boolean): { streak: number; isCorrect: boolean };
	useHint(hintId: string): number;
	useRetry(): number;
	resetHintsForNewProblem(): void;
	awardStar(starType: string, modeId: string | null): void;
	getStarType(hintsUsed: number): string;
	getPotentialStar(): string;
	getTotalPenalties(): number;
	setTier(tierId: string): boolean;
	isModeUnlocked(modeId: string): boolean;
	getModeGoldStars(modeId: string): number;
	getRequiredGold(modeId: string): number;
	setOverrides(overrides: Record<string, number>): void;
	getState(): GameState;
	resetProgress(): void;
	restoreFromServer(serverUrl: string, username: string): Promise<{ restored: boolean; source: string }>;
	cartridgeId: string | null;
	currentTier: string | null;
	unlockedTiers: string[];
	starCounts: StarCounts;
	starsPerMode: Record<string, StarCounts>;
}

interface GameState {
	streaks: Record<string, number>;
	starCounts: StarCounts;
	starsPerMode: Record<string, StarCounts>;
	currentTier: string | null;
	unlockedTiers: string[];
	modeOrder: string[];
	goldToUnlock: number;
	progressionOverrides: Record<string, number>;
	hintsUsed: number;
	retriesUsed: number;
	totalPenalties: number;
	potentialStar: string;
}

let engineInstance: GameEngineInstance | null = null;

/**
 * Initialize the game engine
 */
export async function initGameEngine(): Promise<void> {
	if (typeof window === 'undefined') return;

	try {
		const module = await import('../../../platform/core/game-engine.js');
		GameEngineClass = module.GameEngine;
	} catch (err) {
		console.error('Failed to load GameEngine:', err);
	}
}

/**
 * Create a new game engine instance for a cartridge
 */
export function createGameEngine(config: {
	onStreakUpdate?: (fieldId: string, streak: number) => void;
	onStarEarned?: (starType: string, counts: StarCounts, modeId: string | null) => void;
	onTierUnlocked?: (tier: { id: string; name?: string }) => void;
} = {}): GameEngineInstance | null {
	if (!GameEngineClass) {
		console.warn('GameEngine not loaded yet');
		return null;
	}

	engineInstance = new GameEngineClass({
		onStreakUpdate: (fieldId: string, streak: number) => {
			game.updateStreak(fieldId, streak > 0);
			config.onStreakUpdate?.(fieldId, streak);
		},
		onStarEarned: (starType: string, counts: StarCounts, modeId: string | null) => {
			game.awardStar(starType as 'gold' | 'silver' | 'bronze' | 'tin', modeId);
			config.onStarEarned?.(starType, counts, modeId);
		},
		onTierUnlocked: (tier: { id: string; name?: string }) => {
			config.onTierUnlocked?.(tier);
		}
	}) as GameEngineInstance;

	return engineInstance;
}

/**
 * Get the current engine instance
 */
export function getGameEngine(): GameEngineInstance | null {
	return engineInstance;
}

/**
 * Load a cartridge into the game engine and sync with store
 */
export function loadCartridge(manifest: {
	meta: { id: string };
	modes?: Array<{ id: string; unlockedBy?: { gold?: number } | string }>;
}): void {
	if (!engineInstance) {
		console.warn('Game engine not initialized');
		return;
	}

	engineInstance.loadCartridge(manifest);

	// Sync store with engine state
	game.loadCartridge(manifest);
}

/**
 * Record a grading result
 */
export function recordResult(fieldId: string, score: string, allFieldsCorrect: boolean): { streak: number; isCorrect: boolean } {
	if (!engineInstance) {
		return { streak: 0, isCorrect: false };
	}

	const result = engineInstance.recordResult(fieldId, score, allFieldsCorrect);

	// Sync with store
	if (result.isCorrect) {
		game.updateStreak(fieldId, true);
	} else {
		game.updateStreak(fieldId, false);
	}

	return result;
}

/**
 * Use a hint
 */
export function useHint(hintId: string): number {
	game.useHint();
	return engineInstance?.useHint(hintId) || 0;
}

/**
 * Use a retry (wrong answer)
 */
export function useRetry(): number {
	game.useRetry();
	return engineInstance?.useRetry() || 0;
}

/**
 * Reset for new problem
 */
export function resetForNewProblem(): void {
	game.resetForNewProblem();
	engineInstance?.resetHintsForNewProblem();
}

/**
 * Get potential star based on current penalties
 */
export function getPotentialStar(): string {
	return engineInstance?.getPotentialStar() || 'gold';
}

/**
 * Set current tier/mode
 */
export function setTier(tierId: string): boolean {
	const result = engineInstance?.setTier(tierId) || false;
	if (result) {
		game.setTier(tierId);
	}
	return result;
}

/**
 * Check if a mode is unlocked
 */
export function isModeUnlocked(modeId: string): boolean {
	return engineInstance?.isModeUnlocked(modeId) || false;
}

/**
 * Get gold stars for a specific mode
 */
export function getModeGoldStars(modeId: string): number {
	return engineInstance?.getModeGoldStars(modeId) || 0;
}

/**
 * Get required gold stars for a mode
 */
export function getRequiredGold(modeId: string): number {
	return engineInstance?.getRequiredGold(modeId) || 1;
}

/**
 * Reset all progress
 */
export function resetProgress(): void {
	game.resetProgress();
	engineInstance?.resetProgress();
}

/**
 * Restore progress from server
 */
export async function restoreFromServer(serverUrl: string, username: string): Promise<{ restored: boolean; source: string }> {
	if (!engineInstance) {
		return { restored: false, source: 'no-engine' };
	}
	return engineInstance.restoreFromServer(serverUrl, username);
}
