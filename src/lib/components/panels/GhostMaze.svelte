<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import type {
		CartridgeManifest,
		LevelProgress,
		GhostProfile,
		QualityLevel
	} from '$lib/engines/ghost-maze-renderer';

	interface Props {
		manifest: CartridgeManifest | null;
		playerProgress: Record<string, LevelProgress>;
		ghostProfile: GhostProfile | null;
		classGhosts?: GhostProfile[];
		showClassView?: boolean;
		quality?: QualityLevel;
		onNodeSelect?: (nodeId: string) => void;
	}

	let {
		manifest,
		playerProgress,
		ghostProfile,
		classGhosts = [],
		showClassView = false,
		quality = 'medium',
		onNodeSelect
	}: Props = $props();

	// Container ref
	let containerEl: HTMLDivElement;

	// Renderer instance (dynamically imported)
	let renderer: import('$lib/engines/ghost-maze-renderer').MazeRenderer | null = null;
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let webGLSupported = $state(true);

	// Dynamic import of Three.js and MazeRenderer
	async function initializeRenderer() {
		if (!containerEl || !manifest) return;

		isLoading = true;
		error = null;

		try {
			// Dynamically import the maze renderer module
			const mazeModule = await import('$lib/engines/ghost-maze-renderer');
			const { MazeRenderer } = mazeModule;

			// Create renderer instance
			renderer = new MazeRenderer(containerEl, manifest, playerProgress);

			// Listen for events
			containerEl.addEventListener('maze-ready', handleMazeReady);
			containerEl.addEventListener('maze-error', handleMazeError);
			containerEl.addEventListener('maze-node-selected', handleNodeSelected);

			// Initialize
			await renderer.init();

			// Set initial quality
			renderer.setQuality(quality);

			// Set up ghost or class view
			if (showClassView && classGhosts.length > 0) {
				renderer.showAllGhosts(classGhosts, { showLabels: true, heatmap: true });
			} else if (ghostProfile) {
				renderer.updateGhost(ghostProfile);
			}

			isLoading = false;
		} catch (err) {
			console.error('[GhostMaze] Failed to initialize:', err);
			error = err instanceof Error ? err.message : 'Failed to initialize 3D maze';
			isLoading = false;

			if (err instanceof Error && err.message.includes('WebGL')) {
				webGLSupported = false;
			}
		}
	}

	function handleMazeReady() {
		console.log('[GhostMaze] Maze ready');
		isLoading = false;
	}

	function handleMazeError(e: Event) {
		const customEvent = e as CustomEvent<{ error: Error }>;
		console.error('[GhostMaze] Maze error:', customEvent.detail.error);
		error = customEvent.detail.error.message;

		if (customEvent.detail.error.message.includes('WebGL')) {
			webGLSupported = false;
		}
	}

	function handleNodeSelected(e: Event) {
		const customEvent = e as CustomEvent<{ nodeId: string }>;
		onNodeSelect?.(customEvent.detail.nodeId);
	}

	// Watch for manifest changes
	$effect(() => {
		if (manifest && containerEl && !renderer) {
			initializeRenderer();
		}
	});

	// Watch for progress changes
	$effect(() => {
		if (renderer && playerProgress) {
			renderer.updateProgress(playerProgress);
		}
	});

	// Watch for ghost profile changes
	$effect(() => {
		if (renderer && ghostProfile && !showClassView) {
			renderer.updateGhost(ghostProfile);
		}
	});

	// Watch for class view changes
	$effect(() => {
		if (renderer) {
			if (showClassView && classGhosts.length > 0) {
				renderer.showAllGhosts(classGhosts, { showLabels: true, heatmap: true });
			} else {
				renderer.setClassViewMode(false);
			}
		}
	});

	// Watch for quality changes
	$effect(() => {
		if (renderer) {
			renderer.setQuality(quality);
		}
	});

	onMount(() => {
		if (manifest) {
			initializeRenderer();
		}
	});

	onDestroy(() => {
		if (containerEl) {
			containerEl.removeEventListener('maze-ready', handleMazeReady);
			containerEl.removeEventListener('maze-error', handleMazeError);
			containerEl.removeEventListener('maze-node-selected', handleNodeSelected);
		}

		if (renderer) {
			renderer.dispose();
			renderer = null;
		}
	});

	// Exposed methods for parent component
	export function focusOnNode(nodeId: string, duration = 1000) {
		renderer?.focusOnNode(nodeId, duration);
	}

	export function focusOnGhost(username: string, duration = 1000): GhostProfile | null {
		return renderer?.focusOnGhost(username, duration) ?? null;
	}

	export async function animateGhostTo(toNodeId: string, fromNodeId?: string | null, duration = 2000) {
		await renderer?.animateGhostTo(toNodeId, fromNodeId, duration);
	}

	export function celebrateGhost(type: 'gold' | 'silver' | 'bronze' | 'tin' = 'gold') {
		renderer?.celebrateGhost(type);
	}

	export function getGhostPosition() {
		return renderer?.getGhostPosition() ?? null;
	}

	export function getGhostNodeId(): string | null {
		return renderer?.getGhostNodeId() ?? null;
	}

	export function isGhostAnimating(): boolean {
		return renderer?.isGhostAnimating() ?? false;
	}
</script>

<div class="ghost-maze-container" bind:this={containerEl}>
	{#if isLoading}
		<div class="loading-overlay" transition:fade={{ duration: 200 }}>
			<div class="loading-spinner"></div>
			<p>Loading 3D Maze...</p>
		</div>
	{/if}

	{#if error}
		<div class="error-overlay" transition:fade={{ duration: 200 }}>
			{#if !webGLSupported}
				<div class="webgl-fallback">
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
						<line x1="3" y1="9" x2="21" y2="9"></line>
						<line x1="9" y1="21" x2="9" y2="9"></line>
					</svg>
					<h3>3D View Unavailable</h3>
					<p>Your browser doesn't support WebGL, which is required for the 3D maze visualization.</p>
					<p class="hint">Try using Chrome, Firefox, or Edge for the full experience.</p>
				</div>
			{:else}
				<div class="error-content">
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
					<h3>Error Loading Maze</h3>
					<p>{error}</p>
					<button type="button" onclick={() => initializeRenderer()}>
						Retry
					</button>
				</div>
			{/if}
		</div>
	{/if}

	{#if !manifest && !isLoading}
		<div class="no-manifest" transition:fade={{ duration: 200 }}>
			<p>No cartridge loaded</p>
			<p class="hint">Select a cartridge to view its progression maze.</p>
		</div>
	{/if}
</div>

<style>
	.ghost-maze-container {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 300px;
		background: #0a0a12;
		border-radius: 8px;
		overflow: hidden;
	}

	.ghost-maze-container :global(canvas) {
		display: block;
		width: 100% !important;
		height: 100% !important;
	}

	.loading-overlay,
	.error-overlay,
	.no-manifest {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(10, 10, 18, 0.95);
		color: #888;
		text-align: center;
		padding: 2rem;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #333;
		border-top-color: #4488ff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.webgl-fallback,
	.error-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.webgl-fallback svg,
	.error-content svg {
		color: #666;
		margin-bottom: 0.5rem;
	}

	.error-content svg {
		color: #ef4444;
	}

	h3 {
		margin: 0;
		font-size: 1.25rem;
		color: #ccc;
	}

	p {
		margin: 0;
		font-size: 0.875rem;
		max-width: 300px;
	}

	.hint {
		color: #666;
		font-size: 0.75rem;
		margin-top: 0.5rem;
	}

	button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #4488ff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	button:hover {
		background: #3377ee;
	}
</style>
