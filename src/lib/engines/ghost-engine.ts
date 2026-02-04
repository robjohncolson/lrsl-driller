/**
 * Ghost Engine Wrapper
 * Wraps the existing GhostEngine (TensorFlow.js neural networks)
 * Lazy loads TensorFlow only when needed
 *
 * The original ghost-engine.js uses named exports, not a class,
 * so we wrap those functions here.
 */

// Ghost engine module (uses named exports)
type GhostEngineModule = {
	init: (tfInstance: unknown, baseUrl?: string) => void;
	initGhost: (username: string, cartridgeId: string) => Promise<void>;
	recordInteraction: (data: GhostInteraction) => Promise<void>;
	getGhostProfile: () => GhostProfile | null;
	getGhostPrediction: (inputs: number[]) => GhostPrediction | null;
	isInitialized: () => boolean;
	isFullyReady: () => boolean;
	isTensorFlowLoaded: () => boolean;
	ensureTensorFlowLoaded: () => Promise<void>;
	syncToServer: () => Promise<void>;
	loadFromServer: () => Promise<void>;
	resetGhost: () => Promise<void>;
	calculateColor: (proficiency: number) => string;
	calculateOpacity: (interactions: number) => number;
};

let ghostModule: GhostEngineModule | null = null;
let tensorFlowLoaded = false;
let initialized = false;

export interface GhostInteraction {
	questionId: string;
	responseTime: number;
	isCorrect: boolean;
	hintsUsed: number;
	attemptNumber: number;
}

export interface GhostProfile {
	username: string;
	cartridgeId: string;
	interactions: number;
	proficiency: number;
	color: string;
	opacity: number;
	// Extended stats
	accuracy?: number;
	avgTime?: number;
	streakMax?: number;
	traits?: Record<string, number>;
}

export interface GhostPrediction {
	confidence: number;
	predictedCorrect: boolean;
	suggestedDifficulty: number;
}

/**
 * Load TensorFlow.js (lazy load to reduce initial bundle size)
 */
async function loadTensorFlow(): Promise<unknown> {
	if (tensorFlowLoaded) return null;
	if (typeof window === 'undefined') return null;

	try {
		// TensorFlow is loaded via npm, so this should work
		const tf = await import('@tensorflow/tfjs');
		tensorFlowLoaded = true;
		return tf;
	} catch (err) {
		console.error('Failed to load TensorFlow.js:', err);
		throw err;
	}
}

/**
 * Initialize the ghost engine (lazy loads TensorFlow)
 */
export async function initGhostEngine(serverUrl?: string): Promise<void> {
	if (typeof window === 'undefined') return;
	if (initialized) return;

	try {
		// Load TensorFlow first
		const tf = await loadTensorFlow();

		// Then load the ghost engine module
		ghostModule = await import('../../../platform/core/ghost-engine.js') as unknown as GhostEngineModule;

		// Initialize with TensorFlow instance
		ghostModule.init(tf, serverUrl || '');
		initialized = true;
	} catch (err) {
		console.error('Failed to load GhostEngine:', err);
	}
}

/**
 * Initialize ghost for a specific user and cartridge
 */
export async function initGhost(username: string, cartridgeId: string): Promise<void> {
	if (!ghostModule) {
		console.warn('Ghost module not loaded');
		return;
	}

	await ghostModule.initGhost(username, cartridgeId);
}

/**
 * Record a student interaction for ghost learning
 */
export async function recordGhostInteraction(interaction: GhostInteraction): Promise<void> {
	if (!ghostModule) {
		console.warn('Ghost module not loaded');
		return;
	}

	await ghostModule.recordInteraction(interaction);
}

/**
 * Get the current ghost profile
 */
export function getGhostProfile(): GhostProfile | null {
	return ghostModule?.getGhostProfile() || null;
}

/**
 * Get ghost prediction for given inputs
 */
export function getGhostPrediction(inputs: number[]): GhostPrediction | null {
	return ghostModule?.getGhostPrediction(inputs) || null;
}

/**
 * Check if ghost is initialized
 */
export function isGhostInitialized(): boolean {
	return ghostModule?.isInitialized() || false;
}

/**
 * Check if ghost is fully ready (TF loaded + model trained)
 */
export function isGhostReady(): boolean {
	return ghostModule?.isFullyReady() || false;
}

/**
 * Check if TensorFlow is loaded
 */
export function isTensorFlowLoaded(): boolean {
	return tensorFlowLoaded;
}

/**
 * Sync ghost to server
 */
export async function syncGhostToServer(): Promise<void> {
	await ghostModule?.syncToServer();
}

/**
 * Load ghost from server
 */
export async function loadGhostFromServer(): Promise<void> {
	await ghostModule?.loadFromServer();
}

/**
 * Reset ghost state
 */
export async function resetGhost(): Promise<void> {
	await ghostModule?.resetGhost();
}

/**
 * Calculate ghost color based on proficiency
 */
export function calculateGhostColor(proficiency: number): string {
	return ghostModule?.calculateColor(proficiency) || '#9333ea';
}

/**
 * Calculate ghost opacity based on interactions
 */
export function calculateGhostOpacity(interactions: number): number {
	return ghostModule?.calculateOpacity(interactions) || 0.3;
}
