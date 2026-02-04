<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { user, connection, game } from '$lib/stores';
	import {
		initGhostEngine,
		getGhostProfile,
		isGhostReady,
		syncGhostToServer,
		resetGhost,
		type GhostProfile
	} from '$lib/engines';
	import { GhostMaze } from './index';
	import type { CartridgeManifest, LevelProgress } from '$lib/engines/ghost-maze-renderer';

	interface Props {
		open: boolean;
		onClose: () => void;
		cartridgeId?: string;
		manifest?: CartridgeManifest | null;
		onStartOrbits?: () => void;
	}

	let { open = $bindable(false), onClose, cartridgeId, manifest = null, onStartOrbits }: Props = $props();

	type TabId = 'my-ghost' | 'battle' | 'class-view';

	let activeTab = $state<TabId>('my-ghost');
	let ghostProfile = $state<GhostProfile | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Battle state
	let battleRating = $state<number>(1000);
	let battleHistory = $state<Array<{ opponent: string; result: 'win' | 'loss'; date: string }>>([]);

	// Class view state (teacher only)
	let classGhosts = $state<Array<{ username: string; level: number; color: string }>>([]);

	// Maze visualization state
	let showMaze = $state(false);
	let mazeRef: GhostMaze | null = null;

	// Get player progress from game store
	function getPlayerProgress(): Record<string, LevelProgress> {
		const progress: Record<string, LevelProgress> = {};
		const starsPerMode = $game.starsPerMode || {};

		for (const [modeId, stars] of Object.entries(starsPerMode)) {
			const totalStars = (stars.gold || 0) + (stars.silver || 0) + (stars.bronze || 0) + (stars.tin || 0);
			progress[modeId] = {
				unlocked: true,
				completed: totalStars > 0,
				stars: stars.gold || 0
			};
		}

		return progress;
	}

	let playerProgress = $derived(getPlayerProgress());

	$effect(() => {
		if (open) {
			loadGhostData();
		}
	});

	async function loadGhostData() {
		loading = true;
		error = null;

		try {
			await initGhostEngine();

			if (isGhostReady()) {
				ghostProfile = getGhostProfile();
			}

			// Load battle data if we have a server connection
			if ($user.serverUrl && $user.username) {
				await loadBattleData();
			}
		} catch (err) {
			error = 'Failed to load ghost data';
			console.error('Ghost panel error:', err);
		} finally {
			loading = false;
		}
	}

	async function loadBattleData() {
		try {
			const response = await fetch(`${$user.serverUrl}/api/ghost/battle-stats?username=${$user.username}`);
			if (response.ok) {
				const data = await response.json();
				battleRating = data.rating || 1000;
				battleHistory = data.history || [];
			}
		} catch (err) {
			console.warn('Failed to load battle data:', err);
		}
	}

	async function loadClassGhosts() {
		if (!$user.isTeacher || !$user.serverUrl) return;

		try {
			const response = await fetch(`${$user.serverUrl}/api/ghost/class-view`);
			if (response.ok) {
				classGhosts = await response.json();
			}
		} catch (err) {
			console.warn('Failed to load class ghosts:', err);
		}
	}

	async function handleSyncGhost() {
		if (!$user.serverUrl || !$user.username) return;

		loading = true;
		try {
			await syncGhostToServer();
			ghostProfile = getGhostProfile();
		} catch (err) {
			console.error('Failed to sync ghost:', err);
		} finally {
			loading = false;
		}
	}

	async function handleResetGhost() {
		if (!confirm('Reset your ghost? This will clear all training data.')) return;

		resetGhost();
		ghostProfile = getGhostProfile();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function switchTab(tab: TabId) {
		if (tab === 'class-view' && !$user.isTeacher) return;
		activeTab = tab;

		if (tab === 'class-view') {
			loadClassGhosts();
		}
	}

	function getRatingTier(rating: number): { name: string; color: string } {
		if (rating >= 2000) return { name: 'Master', color: 'text-purple-600' };
		if (rating >= 1600) return { name: 'Expert', color: 'text-blue-600' };
		if (rating >= 1400) return { name: 'Advanced', color: 'text-green-600' };
		if (rating >= 1200) return { name: 'Intermediate', color: 'text-yellow-600' };
		return { name: 'Beginner', color: 'text-gray-600' };
	}

	function getGhostLevel(profile: GhostProfile | null): number {
		if (!profile) return 0;
		return Math.min(10, Math.floor((profile.interactions || 0) / 50));
	}

	function getGhostColor(profile: GhostProfile | null): string {
		const level = getGhostLevel(profile);
		const colors = [
			'bg-gray-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-orange-400',
			'bg-red-400', 'bg-pink-400', 'bg-purple-400', 'bg-indigo-400', 'bg-cyan-400', 'bg-teal-400'
		];
		return colors[level] || colors[0];
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
			<div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-2xl">👻</span>
					<h2 class="text-xl font-bold text-white">Ghost Mode</h2>
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

			<!-- Tabs -->
			<div class="flex border-b bg-gray-50">
				<button
					type="button"
					onclick={() => switchTab('my-ghost')}
					class="flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'my-ghost' ? 'text-purple-600 border-b-2 border-purple-500 bg-white' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}"
				>
					My Ghost
				</button>
				<button
					type="button"
					onclick={() => switchTab('battle')}
					class="flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'battle' ? 'text-purple-600 border-b-2 border-purple-500 bg-white' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}"
				>
					Battle
				</button>
				{#if $user.isTeacher}
					<button
						type="button"
						onclick={() => switchTab('class-view')}
						class="flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab === 'class-view' ? 'text-purple-600 border-b-2 border-purple-500 bg-white' : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'}"
					>
						Class View
					</button>
				{/if}
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if loading}
					<div class="flex items-center justify-center h-32">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
					</div>
				{:else if error}
					<div class="text-center text-gray-500 py-8">
						<span class="text-4xl block mb-2">❌</span>
						<p>{error}</p>
					</div>
				{:else if activeTab === 'my-ghost'}
					<!-- My Ghost Tab -->
					<div class="space-y-6">
						<!-- Ghost Avatar -->
						<div class="flex flex-col items-center">
							<div class="w-24 h-24 {getGhostColor(ghostProfile)} rounded-full flex items-center justify-center text-5xl shadow-lg mb-4 transition-colors">
								👻
							</div>
							<div class="text-center">
								<h3 class="text-lg font-bold text-gray-800">
									{$user.username}'s Ghost
								</h3>
								<p class="text-sm text-gray-500">
									Level {getGhostLevel(ghostProfile)}
								</p>
							</div>
						</div>

						<!-- Ghost Stats -->
						{#if ghostProfile}
							<div class="grid grid-cols-2 gap-4">
								<div class="bg-gray-50 rounded-lg p-4 text-center">
									<div class="text-2xl font-bold text-purple-600">
										{ghostProfile.interactions || 0}
									</div>
									<div class="text-xs text-gray-500 uppercase">Interactions</div>
								</div>
								<div class="bg-gray-50 rounded-lg p-4 text-center">
									<div class="text-2xl font-bold text-green-600">
										{((ghostProfile.accuracy || 0) * 100).toFixed(0)}%
									</div>
									<div class="text-xs text-gray-500 uppercase">Accuracy</div>
								</div>
								<div class="bg-gray-50 rounded-lg p-4 text-center">
									<div class="text-2xl font-bold text-blue-600">
										{(ghostProfile.avgTime || 0).toFixed(1)}s
									</div>
									<div class="text-xs text-gray-500 uppercase">Avg Time</div>
								</div>
								<div class="bg-gray-50 rounded-lg p-4 text-center">
									<div class="text-2xl font-bold text-orange-600">
										{ghostProfile.streakMax || 0}
									</div>
									<div class="text-xs text-gray-500 uppercase">Best Streak</div>
								</div>
							</div>

							<!-- Personality Traits -->
							{#if ghostProfile.traits && Object.keys(ghostProfile.traits).length > 0}
								<div class="bg-purple-50 rounded-lg p-4">
									<h4 class="text-sm font-semibold text-purple-800 mb-2">Personality Traits</h4>
									<div class="flex flex-wrap gap-2">
										{#each Object.entries(ghostProfile.traits) as [trait, traitValue]}
											{#if typeof traitValue === 'number' && traitValue > 0.5}
												<span class="bg-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full">
													{trait}
												</span>
											{/if}
										{/each}
									</div>
								</div>
							{/if}
						{:else}
							<div class="bg-gray-50 rounded-lg p-6 text-center">
								<p class="text-gray-600 mb-2">No ghost data yet</p>
								<p class="text-sm text-gray-400">Complete problems to train your ghost!</p>
							</div>
						{/if}

						<!-- Actions -->
						<div class="flex gap-3">
							<button
								type="button"
								onclick={handleSyncGhost}
								disabled={loading || $connection.status !== 'connected'}
								class="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
							>
								Sync to Server
							</button>
							<button
								type="button"
								onclick={handleResetGhost}
								class="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
							>
								Reset
							</button>
						</div>

						<!-- 3D Maze Visualization -->
						{#if manifest}
							<div class="bg-gray-50 rounded-lg overflow-hidden">
								<button
									type="button"
									onclick={() => { showMaze = !showMaze; }}
									class="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
								>
									<span class="flex items-center gap-2">
										<span class="text-lg">🗺️</span>
										Progression Maze
									</span>
									<svg
										class="w-5 h-5 transition-transform {showMaze ? 'rotate-180' : ''}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
									</svg>
								</button>

								{#if showMaze}
									<div class="h-64 border-t border-gray-200">
										<GhostMaze
											bind:this={mazeRef}
											{manifest}
											{playerProgress}
											{ghostProfile}
											quality="medium"
											onNodeSelect={(nodeId) => console.log('Selected node:', nodeId)}
										/>
									</div>
								{/if}
							</div>
						{/if}

						<!-- Ghost Orbits Button -->
						{#if onStartOrbits}
							<button
								type="button"
								onclick={onStartOrbits}
								class="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
							>
								<span class="text-xl">🌌</span>
								Enter Ghost Orbits
							</button>
						{/if}
					</div>

				{:else if activeTab === 'battle'}
					<!-- Battle Tab -->
					<div class="space-y-6">
						<!-- Rating Display -->
						<div class="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl p-6 text-center text-white">
							<div class="text-4xl font-bold mb-1">{battleRating}</div>
							<div class="text-sm opacity-90">Battle Rating</div>
							<div class="mt-2 inline-block bg-white/20 px-3 py-1 rounded-full text-sm">
								{getRatingTier(battleRating).name}
							</div>
						</div>

						<!-- Battle History -->
						<div>
							<h4 class="text-sm font-semibold text-gray-600 uppercase mb-3">Recent Battles</h4>
							{#if battleHistory.length === 0}
								<div class="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
									<p>No battles yet</p>
									<p class="text-sm mt-1">Challenge other ghosts to start!</p>
								</div>
							{:else}
								<div class="space-y-2">
									{#each battleHistory as battle}
										<div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
											<div class="flex items-center gap-2">
												<span class="text-lg">{battle.result === 'win' ? '🏆' : '💀'}</span>
												<span class="font-medium text-gray-800">vs {battle.opponent}</span>
											</div>
											<div class="text-sm {battle.result === 'win' ? 'text-green-600' : 'text-red-600'}">
												{battle.result === 'win' ? '+Rating' : '-Rating'}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Find Battle Button -->
						<button
							type="button"
							class="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
						>
							<span class="text-xl">⚔️</span>
							Find Battle
						</button>
					</div>

				{:else if activeTab === 'class-view'}
					<!-- Class View Tab (Teacher Only) -->
					<div class="space-y-4">
						<div class="bg-blue-50 rounded-lg p-4">
							<h4 class="text-sm font-semibold text-blue-800 mb-2">Class Ghost Overview</h4>
							<p class="text-sm text-blue-600">View and compare student ghost profiles</p>
						</div>

						{#if classGhosts.length === 0}
							<div class="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
								<p>No ghost data available</p>
								<p class="text-sm mt-1">Students need to complete problems first</p>
							</div>
						{:else}
							<div class="space-y-2">
								{#each classGhosts as ghost}
									<div class="flex items-center justify-between bg-gray-50 rounded-lg p-3">
										<div class="flex items-center gap-3">
											<div class="w-8 h-8 {ghost.color} rounded-full flex items-center justify-center text-sm">
												👻
											</div>
											<span class="font-medium text-gray-800">{ghost.username}</span>
										</div>
										<div class="text-sm text-gray-500">
											Level {ghost.level}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
