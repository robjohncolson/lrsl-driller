<script lang="ts">
	import { grading, game, isComplete } from '$lib/stores';

	interface Props {
		canSubmit?: boolean;
		canSkip?: boolean;
		canHint?: boolean;
		onSubmit?: () => void;
		onSkip?: () => void;
		onHint?: () => void;
		onNextProblem?: () => void;
	}

	let {
		canSubmit = true,
		canSkip = true,
		canHint = true,
		onSubmit,
		onSkip,
		onHint,
		onNextProblem
	}: Props = $props();

	const isGrading = $derived($grading.isGrading);
	const showNextButton = $derived($grading.showFeedback && $grading.allCorrect);
	const canSubmitForm = $derived(canSubmit && $isComplete && !isGrading);
</script>

<div class="flex items-center justify-between gap-4">
	<!-- Left side: Hint and Skip -->
	<div class="flex items-center gap-2">
		{#if canHint && !$grading.showFeedback}
			<button
				type="button"
				onclick={onHint}
				disabled={isGrading}
				class="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<span>💡</span>
				<span class="text-sm font-medium">Hint</span>
				{#if $game.hintsUsedThisProblem > 0}
					<span class="text-xs bg-yellow-200 px-1.5 py-0.5 rounded">
						{$game.hintsUsedThisProblem}
					</span>
				{/if}
			</button>
		{/if}

		{#if canSkip && !$grading.showFeedback}
			<button
				type="button"
				onclick={onSkip}
				disabled={isGrading}
				class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<span>⏭️</span>
				<span class="text-sm font-medium">Skip</span>
			</button>
		{/if}
	</div>

	<!-- Right side: Submit or Next -->
	<div class="flex items-center gap-2">
		{#if showNextButton}
			<button
				type="button"
				onclick={onNextProblem}
				class="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md"
			>
				<span>Next Problem</span>
				<span>→</span>
			</button>
		{:else}
			<button
				type="button"
				onclick={onSubmit}
				disabled={!canSubmitForm}
				class="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if isGrading}
					<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
					<span>Grading...</span>
				{:else}
					<span>Submit</span>
					<span>✓</span>
				{/if}
			</button>
		{/if}
	</div>
</div>

<!-- Star preview -->
<div class="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
	<span>Potential star:</span>
	<span class="text-xl star-{$game.potentialStar}">★</span>
	<span class="capitalize">{$game.potentialStar}</span>
	{#if $game.totalPenalties > 0}
		<span class="text-xs text-gray-400">
			({$game.totalPenalties} {$game.totalPenalties === 1 ? 'penalty' : 'penalties'})
		</span>
	{/if}
</div>
