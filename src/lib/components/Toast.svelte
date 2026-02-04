<script lang="ts">
	import { toasts, toastList, type Toast } from '$lib/stores/toasts';
	import { getAvatarForUsername } from '$lib/stores/user';
	import { fly, fade } from 'svelte/transition';

	function getToastClasses(type: Toast['type']): string {
		switch (type) {
			case 'success':
				return 'bg-green-600 text-white';
			case 'error':
				return 'bg-red-600 text-white';
			case 'warning':
				return 'bg-yellow-500 text-white';
			case 'info':
				return 'bg-blue-600 text-white';
			case 'star':
				return 'bg-purple-600 text-white';
			default:
				return 'bg-gray-800 text-white';
		}
	}
</script>

{#if $toastList.length > 0}
	<div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
		{#each $toastList as toast (toast.id)}
			<div
				class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg {getToastClasses(toast.type)}"
				in:fly={{ x: 100, duration: 300 }}
				out:fade={{ duration: 200 }}
			>
				<!-- Icon / Avatar -->
				{#if toast.type === 'star' && toast.username}
					<span class="text-2xl">{getAvatarForUsername(toast.username)}</span>
				{:else if toast.icon}
					<span class="text-xl">{toast.icon}</span>
				{/if}

				<!-- Content -->
				<div class="flex-1 min-w-0">
					{#if toast.type === 'star' && toast.username}
						<div class="font-semibold text-sm truncate">{toast.username}</div>
						<div class="text-sm text-white/80">{toast.message}</div>
					{:else}
						<div class="text-sm">{toast.message}</div>
					{/if}
				</div>

				<!-- Dismiss button -->
				<button
					type="button"
					onclick={() => toasts.dismiss(toast.id)}
					class="p-1 hover:bg-white/20 rounded transition-colors"
					aria-label="Dismiss"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
		{/each}
	</div>
{/if}
