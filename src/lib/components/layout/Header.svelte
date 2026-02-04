<script lang="ts">
	import { user, avatar, game, connection, connectionIndicator, onlineCount, settings } from '$lib/stores';

	// Props
	interface Props {
		cartridgeName?: string;
		onCartridgeClick?: () => void;
		onUserClick?: () => void;
		onSettingsClick?: () => void;
		onShareClick?: () => void;
		onGhostClick?: () => void;
		onLeaderboardClick?: () => void;
	}

	let {
		cartridgeName = 'Select Cartridge',
		onCartridgeClick,
		onUserClick,
		onSettingsClick,
		onShareClick,
		onGhostClick,
		onLeaderboardClick
	}: Props = $props();

	// Online dropdown state
	let showOnlineDropdown = $state(false);

	function toggleOnlineDropdown() {
		showOnlineDropdown = !showOnlineDropdown;
	}
</script>

<header class="bg-white shadow-md sticky top-0 z-40">
	<div class="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
		<!-- Left: Title + Cartridge Selector -->
		<div class="flex items-center gap-3">
			<h1 class="text-lg font-bold text-purple-700">Driller</h1>

			<!-- Cartridge Slot Button -->
			<button
				onclick={onCartridgeClick}
				class="flex items-center gap-2 bg-gradient-to-b from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 text-white pl-1 pr-3 py-1 rounded-lg border-2 border-gray-600 transition-all shadow-md"
				title="Change Cartridge"
			>
				<div class="w-6 h-8 bg-purple-500 rounded flex items-center justify-center border border-purple-400">
					<span class="text-[8px] font-bold">📦</span>
				</div>
				<div class="text-left">
					<div class="text-[10px] text-gray-400 leading-none">CARTRIDGE</div>
					<div class="text-xs font-bold leading-tight">{cartridgeName}</div>
				</div>
				<span class="text-gray-400 text-xs">▼</span>
			</button>
		</div>

		<!-- Center: Stars + Rank -->
		<div class="flex items-center gap-3">
			<!-- Compact Star Counts -->
			<div class="flex items-center gap-1 text-xs bg-gray-50 rounded-lg px-2 py-1">
				<span class="star-gold" title="Gold">★</span>
				<span class="font-bold text-yellow-600 mr-1">{$game.starCounts.gold}</span>
				<span class="star-silver" title="Silver">★</span>
				<span class="font-bold text-gray-500 mr-1">{$game.starCounts.silver}</span>
				<span class="star-bronze" title="Bronze">★</span>
				<span class="font-bold text-amber-700 mr-1">{$game.starCounts.bronze}</span>
				<span class="star-tin" title="Tin">★</span>
				<span class="font-bold text-stone-500">{$game.starCounts.tin}</span>
			</div>

			<!-- Potential Star Indicator -->
			{#if $game.currentTier}
				<div class="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1" title="Potential star for this problem">
					<span class="text-xs text-gray-500">Next:</span>
					<span class="text-base star-{$game.potentialStar}">★</span>
				</div>
			{/if}
		</div>

		<!-- Right: User + Actions -->
		<div class="flex items-center gap-2">
			<!-- Connection Status with Quality Indicator -->
			<div class="relative">
				<button
					onclick={toggleOnlineDropdown}
					class="flex items-center gap-1.5 px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
					title="{$connectionIndicator.label}"
				>
					<!-- Status Indicator -->
					<span class="text-sm">{$connectionIndicator.emoji}</span>

					<!-- Transport Type & Latency -->
					{#if $connection.status === 'connected'}
						<span class="text-[10px] font-medium {$connection.transportType === 'webrtc' ? 'text-green-600' : 'text-blue-600'}">
							{$connection.transportType === 'webrtc' ? 'P2P' : 'WS'}
						</span>
						{#if $connection.latency !== null && $connection.latency > 0}
							<span class="text-[10px] text-gray-400">
								{$connection.latency}ms
							</span>
						{/if}
					{/if}

					<!-- Online Count -->
					<span class="text-xs font-medium text-gray-600">{$onlineCount}</span>
				</button>

				{#if showOnlineDropdown}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
						onclick={(e) => e.stopPropagation()}
					>
						<!-- Connection Details -->
						<div class="px-3 py-2 border-b border-gray-100">
							<div class="flex items-center justify-between mb-1">
								<span class="text-xs font-medium text-gray-500 uppercase">Connection</span>
								<span class="text-xs {$connection.status === 'connected' ? 'text-green-600' : $connection.status === 'connecting' ? 'text-yellow-600' : 'text-red-600'}">
									{$connectionIndicator.label}
								</span>
							</div>
							{#if $connection.status === 'connected'}
								<div class="flex items-center gap-2 text-xs text-gray-600">
									<span class="inline-flex items-center gap-1 bg-gray-100 rounded px-1.5 py-0.5">
										{#if $connection.transportType === 'webrtc'}
											<span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
											<span>P2P Active</span>
										{:else}
											<span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
											<span>Server</span>
										{/if}
									</span>
									{#if $connection.latency !== null && $connection.latency > 0}
										<span class="text-gray-400">
											{$connection.latency}ms latency
										</span>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Online Users List -->
						<div class="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
							Online ({$onlineCount})
						</div>
						<div class="max-h-48 overflow-y-auto">
							{#each $connection.onlineUsers as onlineUser}
								<div class="px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50">
									<span>{onlineUser.avatar || '👤'}</span>
									<span class="truncate flex-1">{onlineUser.username}</span>
									{#if onlineUser.username === $user.username}
										<span class="text-[10px] bg-purple-100 text-purple-600 px-1.5 rounded">you</span>
									{/if}
								</div>
							{:else}
								<div class="px-3 py-2 text-sm text-gray-400">No users online</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Ghost Toggle -->
			<button
				onclick={onGhostClick}
				class="p-1.5 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors relative"
				title="Ghost Mode"
			>
				<span class="text-base">👻</span>
			</button>

			<!-- User Display -->
			<button
				onclick={onUserClick}
				class="flex items-center gap-1.5 bg-gray-50 rounded-full px-2 py-1 hover:bg-gray-100 transition-colors"
				title="Click to change username"
			>
				<span class="w-2 h-2 rounded-full" class:connection-online={$connection.status === 'connected'} class:connection-offline={$connection.status === 'disconnected'} class:connection-connecting={$connection.status === 'connecting' || $connection.status === 'reconnecting'}></span>
				<span class="text-xs font-medium text-gray-700 max-w-[80px] truncate">
					{$user.username || '...'}
				</span>
				{#if $user.isTeacher}
					<span class="text-xs bg-purple-600 text-white px-1 py-0.5 rounded text-[10px]">T</span>
				{/if}
			</button>

			<!-- Share Button -->
			<button
				onclick={onShareClick}
				class="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
				title="Share this app"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
				</svg>
			</button>

			<!-- Settings -->
			<button
				onclick={onSettingsClick}
				class="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
				title="Settings"
			>
				<svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
				</svg>
			</button>
		</div>
	</div>
</header>

<style>
	.connection-online { background-color: #22c55e; }
	.connection-offline { background-color: #ef4444; }
	.connection-connecting { background-color: #f59e0b; animation: pulse 1s infinite; }

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style>
