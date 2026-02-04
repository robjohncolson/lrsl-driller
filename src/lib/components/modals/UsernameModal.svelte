<script lang="ts">
	import { user, getAvatarForUsername } from '$lib/stores';

	interface Props {
		open?: boolean;
		onClose?: () => void;
		onSave?: (username: string) => void;
	}

	let { open = false, onClose, onSave }: Props = $props();

	let inputValue = $state($user.username || '');
	let errorMessage = $state('');

	function handleSubmit(e: Event) {
		e.preventDefault();

		const trimmed = inputValue.trim();
		if (!trimmed) {
			errorMessage = 'Please enter a username';
			return;
		}

		if (trimmed.length < 2) {
			errorMessage = 'Username must be at least 2 characters';
			return;
		}

		if (trimmed.length > 20) {
			errorMessage = 'Username must be less than 20 characters';
			return;
		}

		user.setUsername(trimmed);
		onSave?.(trimmed);
		onClose?.();
	}

	// Preview avatar based on input
	const previewAvatar = $derived(inputValue.trim() ? getAvatarForUsername(inputValue.trim()) : '👤');
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_interactive_supports_focus -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" onclick={onClose}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onclick={(e) => e.stopPropagation()}>
			<!-- Header -->
			<div class="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-bold">Welcome to Driller!</h2>
						<p class="text-sm text-white/80">Enter your name to get started</p>
					</div>
					<button
						type="button"
						onclick={onClose}
						class="p-2 hover:bg-white/20 rounded-full transition-colors"
						aria-label="Close dialog"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
			</div>

			<!-- Form -->
			<form onsubmit={handleSubmit} class="p-6">
				<div class="flex items-center gap-4 mb-6">
					<!-- Avatar Preview -->
					<div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl">
						{previewAvatar}
					</div>

					<!-- Username Input -->
					<div class="flex-1">
						<label for="username" class="block text-sm font-medium text-gray-700 mb-1">
							Your Name
						</label>
						<input
							type="text"
							id="username"
							bind:value={inputValue}
							placeholder="Enter your name..."
							class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
							autocomplete="off"
						/>
					</div>
				</div>

				{#if errorMessage}
					<div class="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
						{errorMessage}
					</div>
				{/if}

				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={onClose}
						class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
					>
						Save
					</button>
				</div>
			</form>

			<!-- Teacher Mode Toggle -->
			<div class="bg-gray-50 px-6 py-3 border-t border-gray-200">
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						checked={$user.isTeacher}
						onchange={() => user.toggleTeacher()}
						class="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
					/>
					<span class="text-sm text-gray-600">Enable Teacher Mode</span>
				</label>
			</div>
		</div>
	</div>
{/if}
