<script lang="ts">
	import { problem, grading } from '$lib/stores';
	import type { InputField, FieldResult } from '$lib/stores';

	interface Props {
		fields?: InputField[];
		disabled?: boolean;
		onAnswerChange?: (fieldId: string, value: string) => void;
	}

	let { fields = [], disabled = false, onAnswerChange }: Props = $props();

	function handleInput(fieldId: string, event: Event) {
		const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
		problem.setAnswer(fieldId, target.value);
		onAnswerChange?.(fieldId, target.value);
	}

	function getFieldResult(fieldId: string): FieldResult | null {
		return $grading.results[fieldId] || null;
	}

	function getFieldClass(fieldId: string): string {
		const result = getFieldResult(fieldId);
		if (!result || !$grading.showFeedback) return '';

		if (result.score === 'E') return 'border-green-500 bg-green-50';
		if (result.score === 'P') return 'border-yellow-500 bg-yellow-50';
		return 'border-red-500 bg-red-50';
	}
</script>

<div class="space-y-4">
	{#each fields as field}
		<div class="space-y-2">
			<!-- Label -->
			{#if field.label}
				<label for={field.id} class="block text-sm font-medium text-gray-700">
					{field.label}
				</label>
			{/if}

			<!-- Input based on type -->
			{#if field.type === 'textarea'}
				<textarea
					id={field.id}
					value={$problem.answers[field.id] || ''}
					oninput={(e) => handleInput(field.id, e)}
					{disabled}
					rows={field.rows || 4}
					placeholder={field.placeholder || 'Enter your answer...'}
					class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors {getFieldClass(field.id)}"
				></textarea>

			{:else if field.type === 'number'}
				<input
					type="number"
					id={field.id}
					value={$problem.answers[field.id] || ''}
					oninput={(e) => handleInput(field.id, e)}
					{disabled}
					step="any"
					placeholder={field.placeholder || 'Enter a number...'}
					class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors {getFieldClass(field.id)}"
				/>

			{:else if field.type === 'choice' && field.options}
				<div class="flex flex-wrap gap-2">
					{#each field.options as option}
						<button
							type="button"
							{disabled}
							onclick={() => {
								problem.setAnswer(field.id, option);
								onAnswerChange?.(field.id, option);
							}}
							class="px-4 py-2 rounded-lg border-2 transition-colors {$problem.answers[field.id] === option
								? 'bg-purple-600 text-white border-purple-600'
								: 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'} {getFieldClass(field.id)}"
						>
							{option}
						</button>
					{/each}
				</div>

			{:else if field.type === 'dropdown' && field.options}
				<select
					id={field.id}
					value={$problem.answers[field.id] || ''}
					onchange={(e) => handleInput(field.id, e)}
					{disabled}
					class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors bg-white {getFieldClass(field.id)}"
				>
					<option value="">Select an option...</option>
					{#each field.options as option}
						<option value={option}>{option}</option>
					{/each}
				</select>

			{:else}
				<!-- Default text input -->
				<input
					type="text"
					id={field.id}
					value={$problem.answers[field.id] || ''}
					oninput={(e) => handleInput(field.id, e)}
					{disabled}
					placeholder={field.placeholder || 'Enter your answer...'}
					class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors {getFieldClass(field.id)}"
				/>
			{/if}

			<!-- Feedback -->
			{#if $grading.showFeedback}
				{@const result = getFieldResult(field.id)}
				{#if result}
					<div class="text-sm {result.score === 'E'
						? 'text-green-700'
						: result.score === 'P'
							? 'text-yellow-700'
							: 'text-red-700'}">
						{#if result.score === 'E'}
							✅
						{:else if result.score === 'P'}
							🟡
						{:else}
							❌
						{/if}
						{result.feedback}
						{#if result._aiGraded}
							<span class="text-xs text-purple-500 ml-1">(AI graded)</span>
						{/if}
					</div>
				{/if}
			{/if}
		</div>
	{/each}

	{#if fields.length === 0}
		<div class="text-center text-gray-400 py-4">
			No input fields for this problem
		</div>
	{/if}
</div>
