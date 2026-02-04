<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		initGraphEngine,
		createGraphEngine,
		renderGraph,
		toggleLSRL,
		toggleResiduals,
		getStats,
		destroyGraph,
		type DataPoint,
		type GraphConfig
	} from '$lib/engines';

	interface Props {
		points?: DataPoint[];
		config?: GraphConfig;
		showControls?: boolean;
		interactive?: boolean;
		onPointClick?: (index: number, point: DataPoint) => void;
	}

	let {
		points = [],
		config = {},
		showControls = true,
		interactive = false,
		onPointClick
	}: Props = $props();

	let containerEl: HTMLElement;
	let initialized = $state(false);
	let showLSRL = $state(false);
	let showResidualsState = $state(false);
	let stats = $state<ReturnType<typeof getStats>>(null);

	onMount(async () => {
		await initGraphEngine();
		if (containerEl) {
			createGraphEngine(containerEl, {
				...config,
				interactive,
				showLSRL: false,
				showResiduals: false
			});
			initialized = true;

			if (points.length > 0) {
				updateGraph();
			}
		}
	});

	onDestroy(() => {
		destroyGraph();
	});

	$effect(() => {
		if (initialized && points.length > 0) {
			updateGraph();
		}
	});

	function updateGraph() {
		renderGraph(points, config);
		stats = getStats();
	}

	function handleToggleLSRL() {
		showLSRL = !showLSRL;
		toggleLSRL(showLSRL);
	}

	function handleToggleResiduals() {
		showResidualsState = !showResidualsState;
		toggleResiduals(showResidualsState);
	}
</script>

<div class="graph-container">
	{#if showControls && initialized}
		<div class="flex items-center gap-4 mb-4">
			<label class="flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					checked={showLSRL}
					onchange={handleToggleLSRL}
					class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
				/>
				<span class="text-sm text-gray-700">Show LSRL</span>
			</label>

			<label class="flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					checked={showResidualsState}
					onchange={handleToggleResiduals}
					class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
				/>
				<span class="text-sm text-gray-700">Show Residuals</span>
			</label>
		</div>
	{/if}

	<!-- Graph Container -->
	<div
		bind:this={containerEl}
		class="graph-area bg-white rounded-lg border border-gray-200 overflow-hidden"
		style="min-height: {config.height || 300}px;"
	>
		{#if !initialized}
			<div class="flex items-center justify-center h-full min-h-[300px]">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
			</div>
		{:else if points.length === 0}
			<div class="flex items-center justify-center h-full min-h-[300px] text-gray-400">
				<div class="text-center">
					<svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
					</svg>
					<p>No data to display</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Stats Display -->
	{#if showControls && stats && points.length > 1}
		<div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
			<div class="bg-gray-50 rounded-lg p-3 text-center">
				<div class="text-xs text-gray-500 uppercase">n</div>
				<div class="text-lg font-semibold text-gray-800">{stats.n}</div>
			</div>
			<div class="bg-gray-50 rounded-lg p-3 text-center">
				<div class="text-xs text-gray-500 uppercase">Slope</div>
				<div class="text-lg font-semibold text-gray-800">{stats.slope.toFixed(3)}</div>
			</div>
			<div class="bg-gray-50 rounded-lg p-3 text-center">
				<div class="text-xs text-gray-500 uppercase">Intercept</div>
				<div class="text-lg font-semibold text-gray-800">{stats.intercept.toFixed(3)}</div>
			</div>
			<div class="bg-gray-50 rounded-lg p-3 text-center">
				<div class="text-xs text-gray-500 uppercase">r</div>
				<div class="text-lg font-semibold text-gray-800">{stats.r.toFixed(3)}</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.graph-container :global(svg) {
		max-width: 100%;
		height: auto;
	}

	.graph-area :global(.point) {
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.graph-area :global(.point:hover) {
		transform: scale(1.2);
	}

	.graph-area :global(.lsrl-line) {
		stroke: #8b5cf6;
		stroke-width: 2;
	}

	.graph-area :global(.residual-line) {
		stroke: #f59e0b;
		stroke-width: 1.5;
		stroke-dasharray: 4 2;
	}
</style>
