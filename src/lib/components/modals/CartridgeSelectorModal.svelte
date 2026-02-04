<script lang="ts">
	import { onMount } from 'svelte';
	import { loadRegistry, type CartridgeMeta } from '$lib/engines';

	interface Props {
		open?: boolean;
		currentCartridgeId?: string | null;
		onClose?: () => void;
		onSelect?: (cartridgeId: string) => void;
	}

	let { open = false, currentCartridgeId = null, onClose, onSelect }: Props = $props();

	let cartridges = $state<CartridgeMeta[]>([]);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');

	// Group cartridges by subject
	const groupedCartridges = $derived(() => {
		const filtered = searchQuery
			? cartridges.filter(c =>
					c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
					c.description?.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: cartridges;

		const grouped: Record<string, CartridgeMeta[]> = {};
		for (const cartridge of filtered) {
			const subject = cartridge.subject || 'Other';
			if (!grouped[subject]) {
				grouped[subject] = [];
			}
			grouped[subject].push(cartridge);
		}
		return grouped;
	});

	onMount(async () => {
		try {
			cartridges = await loadRegistry();
			isLoading = false;
		} catch (err) {
			error = 'Failed to load cartridges';
			isLoading = false;
		}
	});

	function handleSelect(cartridgeId: string) {
		onSelect?.(cartridgeId);
		onClose?.();
	}

	// Subject emoji mapping
	function getSubjectEmoji(subject: string): string {
		const map: Record<string, string> = {
			'AP Statistics': '📊',
			'Algebra 2': '🔢',
			'Computer Science / Python': '🐍',
			'Other': '📚'
		};
		return map[subject] || '📚';
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_interactive_supports_focus -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" onclick={onClose}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col" onclick={(e) => e.stopPropagation()}>
			<!-- Header -->
			<div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-bold">Select Cartridge</h2>
						<p class="text-sm text-white/80">Choose a topic to practice</p>
					</div>
					<button
						type="button"
						onclick={onClose}
						class="p-2 hover:bg-white/20 rounded-full transition-colors"
						aria-label="Close"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>

				<!-- Search -->
				<div class="mt-4">
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search cartridges..."
						class="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
					/>
				</div>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if isLoading}
					<div class="flex items-center justify-center py-12">
						<div class="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
					</div>
				{:else if error}
					<div class="text-center py-12 text-red-600">
						<p class="text-4xl mb-2">⚠️</p>
						<p>{error}</p>
					</div>
				{:else if Object.keys(groupedCartridges()).length === 0}
					<div class="text-center py-12 text-gray-500">
						<p class="text-4xl mb-2">🔍</p>
						<p>No cartridges found</p>
					</div>
				{:else}
					<div class="space-y-6">
						{#each Object.entries(groupedCartridges()) as [subject, subjectCartridges]}
							<div>
								<h3 class="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
									<span>{getSubjectEmoji(subject)}</span>
									<span>{subject}</span>
								</h3>
								<div class="grid gap-3">
									{#each subjectCartridges as cartridge}
										<button
											type="button"
											onclick={() => handleSelect(cartridge.id)}
											class="w-full text-left p-4 rounded-xl border-2 transition-all {currentCartridgeId === cartridge.id
												? 'border-purple-500 bg-purple-50'
												: 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'}"
										>
											<div class="flex items-center justify-between">
												<div>
													<div class="font-semibold text-gray-800">{cartridge.name}</div>
													{#if cartridge.description}
														<div class="text-sm text-gray-500 mt-1">{cartridge.description}</div>
													{/if}
												</div>
												<div class="flex items-center gap-2">
													{#if cartridge.shortCode}
														<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">
															{cartridge.shortCode}
														</span>
													{/if}
													{#if currentCartridgeId === cartridge.id}
														<span class="text-purple-600 text-lg">✓</span>
													{/if}
												</div>
											</div>
										</button>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="bg-gray-50 px-6 py-3 border-t border-gray-200">
				<p class="text-xs text-gray-500 text-center">
					{cartridges.length} cartridges available
				</p>
			</div>
		</div>
	</div>
{/if}
