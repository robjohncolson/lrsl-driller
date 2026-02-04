/**
 * Graph Engine Wrapper
 * Wraps the existing GraphEngine for statistical visualizations
 */

// Import the original GraphEngine dynamically
let GraphEngineClass: typeof import('../../../platform/core/graph-engine.js').default | null = null;

export interface DataPoint {
	x: number;
	y: number;
	label?: string;
	highlight?: boolean;
}

export interface GraphConfig {
	width?: number;
	height?: number;
	margin?: { top: number; right: number; bottom: number; left: number };
	xLabel?: string;
	yLabel?: string;
	title?: string;
	showGrid?: boolean;
	showLSRL?: boolean;
	showResiduals?: boolean;
	showPoints?: boolean;
	interactive?: boolean;
}

interface GraphEngineInstance {
	setData(points: DataPoint[]): void;
	setConfig(config: GraphConfig): void;
	render(container: HTMLElement): void;
	clear(): void;
	showLSRL(show: boolean): void;
	showResiduals(show: boolean): void;
	highlightPoint(index: number): void;
	getStats(): {
		n: number;
		meanX: number;
		meanY: number;
		slope: number;
		intercept: number;
		r: number;
		rSquared: number;
	};
	destroy(): void;
}

let engineInstance: GraphEngineInstance | null = null;
let currentContainer: HTMLElement | null = null;

/**
 * Initialize the graph engine
 */
export async function initGraphEngine(): Promise<void> {
	if (typeof window === 'undefined') return;

	try {
		const module = await import('../../../platform/core/graph-engine.js');
		GraphEngineClass = module.default;
	} catch (err) {
		console.error('Failed to load GraphEngine:', err);
	}
}

/**
 * Create a new graph engine instance
 */
export function createGraphEngine(container: HTMLElement, config?: GraphConfig): GraphEngineInstance | null {
	if (!GraphEngineClass) {
		console.warn('GraphEngine not loaded');
		return null;
	}

	// Destroy existing instance if any
	if (engineInstance) {
		engineInstance.destroy();
	}

	currentContainer = container;
	engineInstance = new GraphEngineClass(container, config || {}) as unknown as GraphEngineInstance;

	return engineInstance;
}

/**
 * Get current graph engine instance
 */
export function getGraphEngine(): GraphEngineInstance | null {
	return engineInstance;
}

/**
 * Render data points to the graph
 */
export function renderGraph(points: DataPoint[], config?: Partial<GraphConfig>): void {
	if (!engineInstance) {
		console.warn('Graph engine not initialized');
		return;
	}

	if (config) {
		engineInstance.setConfig(config);
	}

	engineInstance.setData(points);

	if (currentContainer) {
		engineInstance.render(currentContainer);
	}
}

/**
 * Toggle LSRL line visibility
 */
export function toggleLSRL(show: boolean): void {
	engineInstance?.showLSRL(show);
}

/**
 * Toggle residuals visibility
 */
export function toggleResiduals(show: boolean): void {
	engineInstance?.showResiduals(show);
}

/**
 * Get statistics from current data
 */
export function getStats(): {
	n: number;
	meanX: number;
	meanY: number;
	slope: number;
	intercept: number;
	r: number;
	rSquared: number;
} | null {
	return engineInstance?.getStats() || null;
}

/**
 * Clear the graph
 */
export function clearGraph(): void {
	engineInstance?.clear();
}

/**
 * Destroy the graph engine
 */
export function destroyGraph(): void {
	if (engineInstance) {
		engineInstance.destroy();
		engineInstance = null;
		currentContainer = null;
	}
}

/**
 * Highlight a specific point
 */
export function highlightPoint(index: number): void {
	engineInstance?.highlightPoint(index);
}
