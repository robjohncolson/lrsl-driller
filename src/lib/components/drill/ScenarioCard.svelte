<script lang="ts">
	import { onMount } from 'svelte';
	import { problem } from '$lib/stores';

	interface Props {
		scenario?: string;
		modeName?: string;
		animation?: string;
	}

	let { scenario = '', modeName = '', animation }: Props = $props();

	let scenarioEl: HTMLElement | null = $state(null);

	// Render KaTeX math on mount and when scenario changes
	onMount(() => {
		if (typeof window !== 'undefined' && window.renderMathInElement && scenarioEl) {
			window.renderMathInElement(scenarioEl, {
				delimiters: [
					{ left: '$$', right: '$$', display: true },
					{ left: '$', right: '$', display: false },
					{ left: '\\[', right: '\\]', display: true },
					{ left: '\\(', right: '\\)', display: false }
				]
			});
		}
	});

	$effect(() => {
		if (scenario && scenarioEl && typeof window !== 'undefined' && window.renderMathInElement) {
			// Re-render math when scenario changes
			setTimeout(() => {
				window.renderMathInElement(scenarioEl!, {
					delimiters: [
						{ left: '$$', right: '$$', display: true },
						{ left: '$', right: '$', display: false },
						{ left: '\\[', right: '\\]', display: true },
						{ left: '\\(', right: '\\)', display: false }
					]
				});
			}, 0);
		}
	});
</script>

<div class="bg-white rounded-xl shadow-lg overflow-hidden">
	<!-- Header -->
	<div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold">{modeName || 'Problem'}</h2>
			{#if $problem.isLoading}
				<div class="flex items-center gap-2">
					<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
					<span class="text-sm">Loading...</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Scenario Content -->
	<div class="p-6">
		{#if $problem.error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
				<p class="font-medium">Error loading problem</p>
				<p class="text-sm mt-1">{$problem.error}</p>
			</div>
		{:else if scenario}
			<div
				bind:this={scenarioEl}
				class="prose prose-purple max-w-none text-gray-700 leading-relaxed"
			>
				{@html scenario.replace(/\n/g, '<br>')}
			</div>
		{:else if !$problem.isLoading}
			<div class="text-center text-gray-400 py-8">
				<p class="text-4xl mb-2">📝</p>
				<p>Select a level to start practicing</p>
			</div>
		{/if}

		<!-- Animation Video -->
		{#if animation}
			<div class="mt-4 rounded-lg overflow-hidden bg-gray-900">
				<video
					src={animation}
					controls
					class="w-full"
					preload="metadata"
				>
					<track kind="captions" />
				</video>
			</div>
		{/if}
	</div>
</div>
