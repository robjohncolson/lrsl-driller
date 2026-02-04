<script lang="ts">
	import { user } from '$lib/stores';
	import { getAvatarForUsername } from '$lib/stores/user';
	import { fly, fade } from 'svelte/transition';

	interface LeaderboardEntry {
		username: string;
		real_name?: string;
		class_period?: string;
		weighted_score: number;
		territories?: number;
		cluster?: number;
	}

	let { open = $bindable(false), onClose }: { open: boolean; onClose: () => void } = $props();

	let period = $state<'all' | '1h'>('all');
	let loading = $state(true);
	let data = $state<LeaderboardEntry[]>([]);
	let error = $state<string | null>(null);

	$effect(() => {
		if (open) {
			fetchLeaderboard();
		}
	});

	$effect(() => {
		// Re-fetch when period changes
		if (open) {
			fetchLeaderboard();
		}
	});

	async function fetchLeaderboard() {
		if (!$user.serverUrl) {
			error = 'Not connected to server';
			loading = false;
			return;
		}

		loading = true;
		error = null;

		try {
			const url = new URL(`${$user.serverUrl}/api/leaderboard/unified`);
			url.searchParams.set('limit', '20');
			if (period !== 'all') {
				url.searchParams.set('period', period);
			}

			const response = await fetch(url);
			if (!response.ok) throw new Error('Failed to fetch');

			data = await response.json();
		} catch (err) {
			error = 'Failed to load leaderboard';
			console.error('Leaderboard error:', err);
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function getRankIcon(rank: number): string {
		if (rank === 1) return '🥇';
		if (rank === 2) return '🥈';
		if (rank === 3) return '🥉';
		return `#${rank}`;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 z-40"
		transition:fade={{ duration: 200 }}
		onclick={onClose}
	></div>

	<div
		class="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50"
		transition:fly={{ x: 400, duration: 300 }}
	>
		<div class="h-full flex flex-col">
			<!-- Header -->
			<div class="bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-2xl">🏆</span>
					<h2 class="text-xl font-bold text-white">Class Leaderboard</h2>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="p-2 hover:bg-white/20 rounded-full transition-colors"
				>
					<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<!-- Period Tabs -->
			<div class="flex border-b bg-gray-50">
				<button
					type="button"
					onclick={() => period = 'all'}
					class="flex-1 px-4 py-3 text-sm font-medium transition-colors {period === 'all' ? 'text-yellow-600 border-b-2 border-yellow-500 bg-white' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}"
				>
					All Time
				</button>
				<button
					type="button"
					onclick={() => period = '1h'}
					class="flex-1 px-4 py-3 text-sm font-medium transition-colors {period === '1h' ? 'text-yellow-600 border-b-2 border-yellow-500 bg-white' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}"
				>
					Last Hour
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if loading}
					<div class="flex items-center justify-center h-32">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
					</div>
				{:else if error}
					<div class="text-center text-gray-500 py-8">
						<span class="text-4xl block mb-2">📡</span>
						<p>{error}</p>
					</div>
				{:else if data.length === 0}
					<div class="text-center text-gray-500 py-8">
						<span class="text-4xl block mb-2">📊</span>
						<p>No data yet. Be the first to earn a star!</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each data as entry, index}
							{@const rank = index + 1}
							{@const isCurrentUser = entry.username === $user.username}
							{@const avatar = getAvatarForUsername(entry.username)}
							<div
								class="p-4 rounded-xl {isCurrentUser ? 'bg-purple-50 border-2 border-purple-300' : 'bg-gray-50'} {rank <= 3 ? 'shadow-md' : ''}"
								in:fly={{ y: 20, delay: index * 50, duration: 200 }}
							>
								<div class="flex items-center gap-3">
									<div class="{rank <= 3 ? 'text-2xl' : 'text-lg font-bold text-gray-400'} w-10 text-center">
										{getRankIcon(rank)}
									</div>
									<div class="text-2xl">{avatar}</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2">
											{#if entry.class_period}
												<span class="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
													{entry.class_period}
												</span>
											{/if}
											<span class="font-semibold text-gray-800 truncate">{entry.username}</span>
											{#if isCurrentUser}
												<span class="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">YOU</span>
											{/if}
										</div>
										{#if entry.real_name}
											<div class="text-xs text-gray-500">{entry.real_name}</div>
										{/if}
									</div>
									<div class="text-right">
										<div class="text-lg font-bold text-yellow-600">{entry.weighted_score || 0} pts</div>
										<div class="text-xs text-gray-500 flex gap-1 justify-end">
											{#if entry.territories && entry.territories > 0}
												<span class="text-green-600">◼{entry.territories}</span>
											{/if}
											{#if entry.cluster && entry.cluster > 0}
												<span class="text-purple-600">◆{entry.cluster}</span>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Legend -->
			<div class="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500">
				<div class="flex items-center gap-4 justify-center">
					<span title="Points balance (earn - spend)">⚡ = Points</span>
					<span title="Territories owned" class="text-green-600">◼ = Cells</span>
					<span title="Largest cluster" class="text-purple-600">◆ = Cluster</span>
				</div>
			</div>
		</div>
	</div>
{/if}
