/**
 * Central export for all engine wrappers
 */

// Game Engine
export {
	initGameEngine,
	createGameEngine,
	getGameEngine,
	loadCartridge as loadGameCartridge,
	recordResult,
	useHint,
	useRetry,
	resetForNewProblem,
	getPotentialStar,
	setTier,
	isModeUnlocked,
	getModeGoldStars,
	getRequiredGold,
	resetProgress,
	restoreFromServer
} from './game-engine';

// Grading Engine
export {
	initGradingEngine,
	getGradingEngine,
	gradeAnswer,
	gradeAllWithDual,
	gradeAll
} from './grading-engine';

// Cartridge Loader
export {
	initCartridgeLoader,
	getCartridgeLoader,
	loadRegistry,
	getCartridgesBySubject,
	loadCartridge,
	getCurrentCartridge,
	getManifest,
	getMode,
	getModes,
	generateProblem,
	getHint,
	getAIPrompt,
	getGradingRule,
	getGradingRules
} from './cartridge-loader';
export type {
	CartridgeMeta,
	CartridgeMode,
	CartridgeManifest,
	LoadedCartridge
} from './cartridge-loader';

// Graph Engine
export {
	initGraphEngine,
	createGraphEngine,
	getGraphEngine,
	renderGraph,
	toggleLSRL,
	toggleResiduals,
	getStats,
	clearGraph,
	destroyGraph,
	highlightPoint
} from './graph-engine';
export type { DataPoint, GraphConfig } from './graph-engine';

// Ghost Engine (lazy loaded)
export {
	initGhostEngine,
	initGhost,
	recordGhostInteraction,
	getGhostProfile,
	getGhostPrediction,
	isGhostInitialized,
	isGhostReady,
	isTensorFlowLoaded,
	syncGhostToServer,
	loadGhostFromServer,
	resetGhost,
	calculateGhostColor,
	calculateGhostOpacity
} from './ghost-engine';
export type { GhostInteraction, GhostProfile, GhostPrediction } from './ghost-engine';
