<script lang="ts">
	import { game, grading } from '$lib/stores';

	interface Props {
		showGhostPanel?: boolean;
		onGhostPanelToggle?: () => void;
	}

	let { showGhostPanel = false, onGhostPanelToggle }: Props = $props();

	// Calculate total points
	const totalPoints = $derived(() => {
		const { gold, silver, bronze, tin } = $game.starCounts;
		return gold * 4 + silver * 3 + bronze * 2 + tin * 1;
	});
</script>

<aside class="w-72 bg-white border-l border-gray-200 overflow-y-auto">
	<div class="p-4 space-y-6">
		<!-- Current Problem Status -->
		{#if $game.currentTier}
			<section>
				<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Problem</h3>

				<div class="bg-gray-50 rounded-lg p-3 space-y-2">
					<!-- Potential Star -->
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-600">Potential Star:</span>
						<span class="text-xl star-{$game.potentialStar}">★</span>
					</div>

					<!-- Penalties -->
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-600">Hints Used:</span>
						<span class="font-medium">{$game.hintsUsedThisProblem}</span>
					</div>

					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-600">Retries:</span>
						<span class="font-medium">{$game.retriesThisProblem}</span>
					</div>

					<!-- Penalty Bar -->
					<div class="pt-2">
						<div class="flex gap-1">
							{#each Array(4) as _, i}
								<div
									class="flex-1 h-2 rounded {i < $game.totalPenalties
										? 'bg-red-400'
										: 'bg-gray-200'}"
								></div>
							{/each}
						</div>
						<div class="text-xs text-gray-500 text-center mt-1">
							{#if $game.totalPenalties === 0}
								Perfect so far!
							{:else if $game.totalPenalties < 3}
								{3 - $game.totalPenalties} more penalties = tin
							{:else}
								Tin star (3+ penalties)
							{/if}
						</div>
					</div>
				</div>
			</section>
		{/if}

		<!-- Session Stats -->
		<section>
			<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Session Stats</h3>

			<div class="bg-gray-50 rounded-lg p-3 space-y-3">
				<!-- Star Breakdown -->
				<div class="grid grid-cols-2 gap-2 text-sm">
					<div class="flex items-center justify-between">
						<span class="star-gold">★</span>
						<span class="font-medium">{$game.starCounts.gold}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="star-silver">★</span>
						<span class="font-medium">{$game.starCounts.silver}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="star-bronze">★</span>
						<span class="font-medium">{$game.starCounts.bronze}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="star-tin">★</span>
						<span class="font-medium">{$game.starCounts.tin}</span>
					</div>
				</div>

				<!-- Total Points -->
				<div class="pt-2 border-t border-gray-200">
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-600">Total Points:</span>
						<span class="font-bold text-purple-600">{totalPoints()}</span>
					</div>
				</div>
			</div>
		</section>

		<!-- Grading Status -->
		{#if $grading.isGrading || $grading.showFeedback}
			<section>
				<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Grading</h3>

				<div class="bg-gray-50 rounded-lg p-3">
					{#if $grading.isGrading}
						<div class="flex items-center gap-2">
							<div class="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
							<span class="text-sm text-gray-600">
								{$grading.aiPending ? 'Checking with AI...' : 'Grading...'}
							</span>
						</div>
					{:else if $grading.showFeedback}
						<div class="space-y-2">
							{#each Object.entries($grading.results) as [fieldId, result]}
								<div class="flex items-center gap-2">
									<span class="text-lg">
										{#if result.score === 'E'}
											✅
										{:else if result.score === 'P'}
											🟡
										{:else}
											❌
										{/if}
									</span>
									<span class="text-sm text-gray-700 truncate">{fieldId}</span>
									{#if result._aiGraded}
										<span class="text-xs text-purple-500 ml-auto">AI</span>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<!-- Ghost Panel Toggle -->
		<section>
			<button
				onclick={onGhostPanelToggle}
				class="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
			>
				<div class="flex items-center gap-2">
					<span class="text-xl">👻</span>
					<span class="font-medium text-purple-700">Ghost Panel</span>
				</div>
				<span class="text-purple-500">{showGhostPanel ? '▼' : '▶'}</span>
			</button>
		</section>
	</div>
</aside>
