/**
 * Cartridge Loader Wrapper
 * Wraps the existing CartridgeLoader class with Svelte store integration
 */

import { problem, type Problem, type InputField } from '$lib/stores';

// Import the original CartridgeLoader dynamically
let CartridgeLoaderClass: typeof import('../../../platform/core/cartridge-loader.js').CartridgeLoader | null = null;

export interface CartridgeMeta {
	id: string;
	name: string;
	subject?: string;
	description?: string;
	shortCode?: string;
}

export interface CartridgeMode {
	id: string;
	name: string;
	description?: string;
	inputFields?: InputField[];
	unlockedBy?: { gold?: number } | string;
	hints?: string[];
	animation?: string;
}

export interface CartridgeManifest {
	meta: CartridgeMeta;
	modes?: CartridgeMode[];
	grading?: {
		rubricFile?: string;
		aiPromptFile?: string;
	};
	config?: {
		contextsFile?: string;
		sharedContexts?: string;
	};
	hints?: {
		perField?: Record<string, string>;
	};
	progression?: {
		tiers?: Array<{ id: string }>;
		streakFields?: string[];
	};
}

export interface LoadedCartridge {
	id: string;
	manifest: CartridgeManifest;
	contexts: { contexts: unknown[] } | null;
	generator: { generateProblem: (modeId: string, context: unknown, mode: CartridgeMode) => Problem } | null;
	gradingRules: unknown;
	aiPrompt: string | null;
}

interface CartridgeLoaderInstance {
	loadRegistry(): Promise<CartridgeMeta[]>;
	getCartridgesBySubject(): Promise<Record<string, CartridgeMeta[]>>;
	load(cartridgeId: string, onProgress?: (step: string, filename: string, status: string) => void): Promise<LoadedCartridge>;
	getCartridge(): LoadedCartridge | null;
	getManifest(): CartridgeManifest | null;
	getMode(modeId: string): CartridgeMode | undefined;
	getModes(): CartridgeMode[];
	getRandomContext(): unknown;
	generateProblem(modeId: string, context?: unknown): Promise<Problem>;
	getGradingRule(fieldId: string): unknown;
	getAIPrompt(): string | null;
	getHint(fieldId: string, context?: Record<string, unknown>): string | null;
}

let loaderInstance: CartridgeLoaderInstance | null = null;
let currentCartridge: LoadedCartridge | null = null;

/**
 * Initialize the cartridge loader
 */
export async function initCartridgeLoader(basePath?: string): Promise<void> {
	if (typeof window === 'undefined') return;

	try {
		const module = await import('../../../platform/core/cartridge-loader.js');
		CartridgeLoaderClass = module.CartridgeLoader;

		loaderInstance = new CartridgeLoaderClass({
			basePath: basePath || '/cartridges',
			sharedPath: '/shared'
		}) as unknown as CartridgeLoaderInstance;
	} catch (err) {
		console.error('Failed to load CartridgeLoader:', err);
	}
}

/**
 * Get the loader instance
 */
export function getCartridgeLoader(): CartridgeLoaderInstance | null {
	return loaderInstance;
}

/**
 * Load the cartridge registry
 */
export async function loadRegistry(): Promise<CartridgeMeta[]> {
	if (!loaderInstance) {
		console.warn('CartridgeLoader not initialized');
		return [];
	}
	return loaderInstance.loadRegistry();
}

/**
 * Get cartridges grouped by subject
 */
export async function getCartridgesBySubject(): Promise<Record<string, CartridgeMeta[]>> {
	if (!loaderInstance) {
		console.warn('CartridgeLoader not initialized');
		return {};
	}
	return loaderInstance.getCartridgesBySubject();
}

/**
 * Load a cartridge by ID
 */
export async function loadCartridge(
	cartridgeId: string,
	onProgress?: (step: string, filename: string, status: string) => void
): Promise<LoadedCartridge | null> {
	if (!loaderInstance) {
		console.warn('CartridgeLoader not initialized');
		return null;
	}

	try {
		currentCartridge = await loaderInstance.load(cartridgeId, onProgress);
		return currentCartridge;
	} catch (err) {
		console.error('Failed to load cartridge:', err);
		return null;
	}
}

/**
 * Get current loaded cartridge
 */
export function getCurrentCartridge(): LoadedCartridge | null {
	return currentCartridge;
}

/**
 * Get manifest of current cartridge
 */
export function getManifest(): CartridgeManifest | null {
	return currentCartridge?.manifest || null;
}

/**
 * Get a specific mode from current cartridge
 */
export function getMode(modeId: string): CartridgeMode | undefined {
	return loaderInstance?.getMode(modeId);
}

/**
 * Get all modes from current cartridge
 */
export function getModes(): CartridgeMode[] {
	return loaderInstance?.getModes() || [];
}

/**
 * Generate a new problem and update the store
 */
export async function generateProblem(modeId: string): Promise<Problem | null> {
	if (!loaderInstance || !currentCartridge) {
		console.warn('Cartridge not loaded');
		return null;
	}

	problem.setLoading(true);

	try {
		const mode = loaderInstance.getMode(modeId);
		const generatedProblem = await loaderInstance.generateProblem(modeId);

		// Update the problem store
		problem.setProblem(
			generatedProblem,
			modeId,
			mode?.name || modeId
		);

		return generatedProblem;
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		problem.setError(errorMsg);
		return null;
	}
}

/**
 * Get hint for a field
 */
export function getHint(fieldId: string, context?: Record<string, unknown>): string | null {
	return loaderInstance?.getHint(fieldId, context) || null;
}

/**
 * Get AI prompt template
 */
export function getAIPrompt(): string | null {
	return loaderInstance?.getAIPrompt() || null;
}

/**
 * Get grading rule for a field
 */
export function getGradingRule(fieldId: string): unknown {
	return loaderInstance?.getGradingRule(fieldId);
}

/**
 * Get grading rules from current cartridge
 */
export function getGradingRules(): unknown {
	return currentCartridge?.gradingRules;
}
