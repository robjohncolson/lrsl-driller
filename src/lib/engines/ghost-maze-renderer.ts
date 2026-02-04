/**
 * Ghost Maze Renderer TypeScript Wrapper
 * Re-exports the vanilla JS MazeRenderer with proper types
 */

export interface GhostProfile {
	username: string;
	cartridgeId?: string;
	currentLevel?: string;
	proficiency?: number;
	proficiency_score?: number;
	total_interactions?: number;
	interactions?: number;
	color?: string;
	opacity?: number;
	updated_at?: string;
}

export interface NodePosition {
	x: number;
	y: number;
	z: number;
}

export interface MazeNode {
	id: string;
	name: string;
	tier: number;
	position?: NodePosition;
}

export interface MazeEdge {
	from: string;
	to: string;
	goldRequired?: boolean;
}

export interface LevelProgress {
	unlocked?: boolean;
	completed?: boolean;
	stars?: number;
}

export interface CartridgeManifest {
	id: string;
	name: string;
	levels: Record<string, LevelConfig>;
	progression?: ProgressionConfig;
}

export interface LevelConfig {
	id: string;
	name: string;
	modes?: string[];
}

export interface ProgressionConfig {
	tiers?: TierConfig[];
}

export interface TierConfig {
	name: string;
	levels: string[];
}

export interface ShowGhostsOptions {
	showLabels?: boolean;
	heatmap?: boolean;
}

export type QualityLevel = 'low' | 'medium' | 'high';
export type CelebrationType = 'gold' | 'silver' | 'bronze' | 'tin';

// Tron color palette (re-exported for use in components)
export const TRON_COLORS = {
	background: 0x0a0a12,
	grid: 0x112244,
	gridSecondary: 0x0a1133,
	nodeLocked: 0x333344,
	nodeUnlocked: 0x4488ff,
	nodeCompleted: 0x00ff88,
	nodeCurrent: 0x00ffff,
	edgeDefault: 0x00ffff,
	edgeGold: 0xffdd00,
	ghostWhite: 0xffffff,
	ghostYellow: 0xffff44,
	ghostOrange: 0xff8844,
	ghostRed: 0xff4444,
	ghostIndigo: 0x8844ff
};

// Constants
export const CLUSTER_RADIUS = 1.2;
export const VERTICAL_SPACING = 0.4;
export const GHOSTS_PER_RING = 6;
export const CLASS_VIEW_GHOST_SCALE = 0.625;
export const CLASS_VIEW_OPACITY_FACTOR = 0.8;
export const MAX_DISPLAYED_GHOSTS = 50;
export const GHOST_HEIGHT_OFFSET = 2;

/**
 * Get the hex color code for a ghost based on proficiency color name
 */
export function getGhostColorHex(colorName: string): number {
	const colorKey = `ghost${colorName.charAt(0).toUpperCase() + colorName.slice(1)}` as keyof typeof TRON_COLORS;
	return (TRON_COLORS[colorKey] as number) || TRON_COLORS.ghostWhite;
}

/**
 * Calculate ghost color from proficiency score
 */
export function calculateGhostColor(proficiency: number): string {
	if (proficiency < 0.2) return 'white';
	if (proficiency < 0.4) return 'yellow';
	if (proficiency < 0.6) return 'orange';
	if (proficiency < 0.8) return 'red';
	return 'indigo';
}

/**
 * Calculate ghost opacity from interaction count
 */
export function calculateGhostOpacity(interactions: number): number {
	const OPACITY_THRESHOLD = 100;
	return Math.min(0.1 + (interactions / OPACITY_THRESHOLD) * 0.9, 1.0);
}

/**
 * Ease-in-out cubic easing function
 */
export function easeInOutCubic(t: number): number {
	return t < 0.5
		? 4 * t * t * t
		: 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Interpolate position along a movement path
 */
export function interpolateMovementPath(
	fromPos: NodePosition,
	toPos: NodePosition,
	t: number,
	sag = 1.5
): NodePosition {
	const midX = (fromPos.x + toPos.x) / 2;
	const midY = (fromPos.y + toPos.y) / 2 - sag;
	const midZ = (fromPos.z + toPos.z) / 2;

	const oneMinusT = 1 - t;
	const tSquared = t * t;
	const oneMinusTSquared = oneMinusT * oneMinusT;
	const twoTOneMinusT = 2 * t * oneMinusT;

	return {
		x: oneMinusTSquared * fromPos.x + twoTOneMinusT * midX + tSquared * toPos.x,
		y: oneMinusTSquared * fromPos.y + twoTOneMinusT * midY + tSquared * toPos.y,
		z: oneMinusTSquared * fromPos.z + twoTOneMinusT * midZ + tSquared * toPos.z
	};
}

/**
 * Calculate clustered positions for ghosts at same node
 */
export function calculateClusterPositions(
	ghosts: GhostProfile[],
	nodePosition: NodePosition
): NodePosition[] {
	const count = ghosts.length;
	const positions: NodePosition[] = [];

	for (let i = 0; i < count; i++) {
		const ring = Math.floor(i / GHOSTS_PER_RING);
		const indexInRing = i % GHOSTS_PER_RING;
		const ringCount = Math.min(count - ring * GHOSTS_PER_RING, GHOSTS_PER_RING);

		if (count === 1) {
			positions.push({
				x: nodePosition.x,
				y: nodePosition.y + GHOST_HEIGHT_OFFSET,
				z: nodePosition.z
			});
			continue;
		}

		const angle = (indexInRing / ringCount) * Math.PI * 2;
		const radius = CLUSTER_RADIUS * (1 + ring * 0.5);

		positions.push({
			x: nodePosition.x + Math.cos(angle) * radius,
			y: nodePosition.y + GHOST_HEIGHT_OFFSET + ring * VERTICAL_SPACING,
			z: nodePosition.z + Math.sin(angle) * radius
		});
	}

	return positions;
}

/**
 * Calculate node glow intensity based on ghost count
 */
export function calculateNodeGlowIntensity(ghostCount: number): number {
	if (ghostCount === 0) return 1.0;
	if (ghostCount <= 2) return 1.2;
	if (ghostCount <= 5) return 1.5;
	if (ghostCount <= 10) return 1.8;
	return 2.0;
}

/**
 * Calculate overview camera position to see entire maze
 */
export function calculateOverviewCamera(
	nodes: Map<string, MazeNode>
): { position: NodePosition; target: NodePosition } {
	if (!nodes || nodes.size === 0) {
		return {
			position: { x: 30, y: 25, z: 30 },
			target: { x: 0, y: 8, z: 0 }
		};
	}

	let minX = Infinity, maxX = -Infinity;
	let minY = Infinity, maxY = -Infinity;
	let minZ = Infinity, maxZ = -Infinity;

	for (const node of nodes.values()) {
		if (!node.position) continue;
		minX = Math.min(minX, node.position.x);
		maxX = Math.max(maxX, node.position.x);
		minY = Math.min(minY, node.position.y);
		maxY = Math.max(maxY, node.position.y);
		minZ = Math.min(minZ, node.position.z);
		maxZ = Math.max(maxZ, node.position.z);
	}

	if (minX === Infinity) {
		return {
			position: { x: 30, y: 25, z: 30 },
			target: { x: 0, y: 8, z: 0 }
		};
	}

	const centerX = (minX + maxX) / 2;
	const centerY = (minY + maxY) / 2;
	const centerZ = (minZ + maxZ) / 2;

	const spanX = maxX - minX;
	const spanY = maxY - minY;
	const spanZ = maxZ - minZ;
	const maxSpan = Math.max(spanX, spanY, spanZ, 20);

	const distance = maxSpan * 1.5;

	return {
		position: {
			x: centerX + distance * 0.7,
			y: centerY + distance * 0.5,
			z: centerZ + distance * 0.7
		},
		target: { x: centerX, y: centerY, z: centerZ }
	};
}

/**
 * Parse ghost leaderboard data and add currentLevel based on proficiency
 */
export function parseLeaderboardData(
	ghosts: GhostProfile[],
	nodes: Map<string, MazeNode>
): GhostProfile[] {
	if (!ghosts || !Array.isArray(ghosts)) return [];
	if (!nodes || nodes.size === 0) return ghosts;

	const nodeArray = Array.from(nodes.values())
		.filter(n => n.position)
		.sort((a, b) => a.tier - b.tier);

	return ghosts.map(ghost => {
		if (ghost.currentLevel && nodes.has(ghost.currentLevel)) {
			return ghost;
		}

		const proficiency = ghost.proficiency_score || 0;
		const estimatedIndex = Math.floor(proficiency * (nodeArray.length - 1));
		const clampedIndex = Math.max(0, Math.min(estimatedIndex, nodeArray.length - 1));

		return {
			...ghost,
			currentLevel: nodeArray[clampedIndex]?.id || nodeArray[0]?.id
		};
	});
}

// Internal renderer instance type
interface VanillaRendererInstance {
	init(): Promise<void>;
	dispose(): void;
	updateGhost(profile: GhostProfile): void;
	showAllGhosts(profiles: GhostProfile[], options?: ShowGhostsOptions): void;
	setClassViewMode(enabled: boolean): void;
	updateProgress(progress: Record<string, LevelProgress>): void;
	setQuality(level: QualityLevel): void;
	focusOnNode(nodeId: string, duration?: number): void;
	focusOnGhost(username: string, duration?: number): GhostProfile | null;
	animateGhostTo(toNodeId: string, fromNodeId?: string | null, duration?: number): Promise<void>;
	celebrateGhost(type?: CelebrationType): void;
	getGhostPosition(): NodePosition | null;
	getGhostNodeId(): string | null;
	isGhostAnimating(): boolean;
	render(): void;
	getGhostAtPosition(screenX: number, screenY: number): GhostProfile | null;
}

/**
 * MazeRenderer class - orchestrates the 3D maze visualization
 */
export class MazeRenderer {
	private renderer: VanillaRendererInstance | null = null;
	private container: HTMLElement;
	private manifest: CartridgeManifest;
	private playerProgress: Record<string, LevelProgress>;

	/**
	 * @param container - DOM element to render into
	 * @param manifest - Cartridge manifest
	 * @param playerProgress - Player progress data
	 */
	constructor(
		container: HTMLElement,
		manifest: CartridgeManifest,
		playerProgress: Record<string, LevelProgress>
	) {
		this.container = container;
		this.manifest = manifest;
		this.playerProgress = playerProgress;
	}

	/**
	 * Initialize the Three.js scene
	 */
	async init(): Promise<void> {
		// Dynamically import the vanilla JS module
		const module = await import('../../../platform/core/ghost-maze-renderer.js');
		const VanillaMazeRenderer = module.MazeRenderer;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.renderer = new VanillaMazeRenderer(this.container, this.manifest, this.playerProgress) as any;
		return this.renderer!.init();
	}

	/**
	 * Clean up all resources
	 */
	dispose(): void {
		this.renderer?.dispose();
		this.renderer = null;
	}

	/**
	 * Update ghost visualization
	 */
	updateGhost(ghostProfile: GhostProfile): void {
		this.renderer?.updateGhost(ghostProfile);
	}

	/**
	 * Show all ghosts for leaderboard/class view
	 */
	showAllGhosts(ghostProfiles: GhostProfile[], options?: ShowGhostsOptions): void {
		this.renderer?.showAllGhosts(ghostProfiles, options);
	}

	/**
	 * Toggle class view mode
	 */
	setClassViewMode(enabled: boolean): void {
		this.renderer?.setClassViewMode(enabled);
	}

	/**
	 * Update player progress and refresh node states
	 */
	updateProgress(playerProgress: Record<string, LevelProgress>): void {
		this.renderer?.updateProgress(playerProgress);
	}

	/**
	 * Set rendering quality
	 */
	setQuality(level: QualityLevel): void {
		this.renderer?.setQuality(level);
	}

	/**
	 * Focus camera on a specific node
	 */
	focusOnNode(nodeId: string, duration = 1000): void {
		this.renderer?.focusOnNode(nodeId, duration);
	}

	/**
	 * Focus camera on a specific ghost
	 * @returns Ghost profile if found
	 */
	focusOnGhost(username: string, duration = 1000): GhostProfile | null {
		return this.renderer?.focusOnGhost(username, duration) ?? null;
	}

	/**
	 * Animate ghost movement to a new node
	 */
	async animateGhostTo(toNodeId: string, fromNodeId: string | null = null, duration = 2000): Promise<void> {
		return this.renderer?.animateGhostTo(toNodeId, fromNodeId, duration);
	}

	/**
	 * Trigger celebration animation on ghost
	 */
	celebrateGhost(type: CelebrationType = 'gold'): void {
		this.renderer?.celebrateGhost(type);
	}

	/**
	 * Get current ghost position
	 */
	getGhostPosition(): NodePosition | null {
		return this.renderer?.getGhostPosition() ?? null;
	}

	/**
	 * Get the current node ID where the ghost is located
	 */
	getGhostNodeId(): string | null {
		return this.renderer?.getGhostNodeId() ?? null;
	}

	/**
	 * Check if ghost is currently animating
	 */
	isGhostAnimating(): boolean {
		return this.renderer?.isGhostAnimating() ?? false;
	}

	/**
	 * Render the scene (force single frame)
	 */
	render(): void {
		this.renderer?.render();
	}

	/**
	 * Get ghost at screen position (for click/hover handling)
	 */
	getGhostAtPosition(screenX: number, screenY: number): GhostProfile | null {
		return this.renderer?.getGhostAtPosition(screenX, screenY) ?? null;
	}
}
