<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fly, fade, scale } from 'svelte/transition';
	import { user, connection } from '$lib/stores';
	import { getAvatarForUsername } from '$lib/stores/user';
	import { wsSend, addMessageHandler, removeMessageHandler } from '$lib/network';

	interface Props {
		open: boolean;
		onClose: () => void;
		onMatchStart?: (matchData: MatchData) => void;
	}

	interface Player {
		id: string;
		username: string;
		avatar: string;
		isHost: boolean;
		isReady: boolean;
	}

	interface MatchData {
		roomCode: string;
		players: Player[];
		mode: string;
	}

	type LobbyState = 'menu' | 'creating' | 'joining' | 'in_room' | 'countdown' | 'error';

	let { open = $bindable(false), onClose, onMatchStart }: Props = $props();

	let lobbyState: LobbyState = $state('menu');
	let currentRoomCode: string | null = $state(null);
	let joinCode = $state('');
	let playerList: Player[] = $state([]);
	let isHost = $state(false);
	let countdownValue = $state(0);
	let errorMessage: string | null = $state(null);
	let isMinimized = $state(false);
	let waitingPlayers = $state(0);
	let maxPlayers = $state(8);

	// Message handlers
	let handlers: Array<{ type: string; handler: (msg: unknown) => void }> = [];

	onMount(() => {
		// Set up WebSocket message handlers
		const roomCreatedHandler = (msg: unknown) => {
			const data = msg as { roomCode: string };
			currentRoomCode = data.roomCode;
			isHost = true;
			lobbyState = 'in_room';
			playerList = [{
				id: $user.username || 'player',
				username: $user.username || 'Player',
				avatar: getAvatarForUsername($user.username || ''),
				isHost: true,
				isReady: false
			}];
		};

		const roomJoinedHandler = (msg: unknown) => {
			const data = msg as { roomCode: string; players: Player[]; isHost: boolean };
			currentRoomCode = data.roomCode;
			playerList = data.players;
			isHost = data.isHost;
			lobbyState = 'in_room';
		};

		const playerJoinedHandler = (msg: unknown) => {
			const data = msg as { player: Player };
			playerList = [...playerList, data.player];
		};

		const playerLeftHandler = (msg: unknown) => {
			const data = msg as { playerId: string };
			playerList = playerList.filter((p: Player) => p.id !== data.playerId);
		};

		const playerReadyHandler = (msg: unknown) => {
			const data = msg as { playerId: string; isReady: boolean };
			playerList = playerList.map((p: Player) =>
				p.id === data.playerId ? { ...p, isReady: data.isReady } : p
			);
		};

		const countdownHandler = (msg: unknown) => {
			const data = msg as { seconds: number };
			countdownValue = data.seconds;
			if (data.seconds > 0) {
				lobbyState = 'countdown';
			}
		};

		const matchStartHandler = (msg: unknown) => {
			const data = msg as { roomCode: string; players: Player[]; mode: string };
			onMatchStart?.({
				roomCode: data.roomCode,
				players: data.players,
				mode: data.mode
			});
		};

		const lobbyErrorHandler = (msg: unknown) => {
			const data = msg as { message: string };
			errorMessage = data.message;
			lobbyState = 'error';
		};

		const lobbyStatusHandler = (msg: unknown) => {
			const data = msg as { waiting: number; maxPlayers: number };
			waitingPlayers = data.waiting;
			maxPlayers = data.maxPlayers;
		};

		// Register handlers
		handlers = [
			{ type: 'orbits_room_created', handler: roomCreatedHandler },
			{ type: 'orbits_room_joined', handler: roomJoinedHandler },
			{ type: 'orbits_player_joined', handler: playerJoinedHandler },
			{ type: 'orbits_player_left', handler: playerLeftHandler },
			{ type: 'orbits_player_ready', handler: playerReadyHandler },
			{ type: 'orbits_countdown', handler: countdownHandler },
			{ type: 'orbits_match_start', handler: matchStartHandler },
			{ type: 'orbits_error', handler: lobbyErrorHandler },
			{ type: 'orbits_lobby_status', handler: lobbyStatusHandler }
		];

		for (const { type, handler } of handlers) {
			addMessageHandler(type, handler);
		}
	});

	onDestroy(() => {
		// Clean up handlers
		for (const { type, handler } of handlers) {
			removeMessageHandler(type, handler);
		}

		// Leave room if in one
		if (currentRoomCode) {
			wsSend({ type: 'orbits_leave_room', roomCode: currentRoomCode });
		}
	});

	function handleCreateRoom() {
		lobbyState = 'creating';
		wsSend({
			type: 'orbits_create_room',
			username: $user.username
		});
	}

	function handleJoinRoom() {
		if (!joinCode.trim()) {
			errorMessage = 'Please enter a room code';
			return;
		}

		lobbyState = 'joining';
		wsSend({
			type: 'orbits_join_room',
			roomCode: joinCode.toUpperCase(),
			username: $user.username
		});
	}

	function handleQuickMatch() {
		lobbyState = 'joining';
		wsSend({
			type: 'orbits_quick_match',
			username: $user.username
		});
	}

	function handleToggleReady() {
		const currentPlayer = playerList.find((p: Player) => p.username === $user.username);
		const newReadyState = !currentPlayer?.isReady;

		wsSend({
			type: 'orbits_player_ready',
			roomCode: currentRoomCode,
			isReady: newReadyState
		});

		playerList = playerList.map((p: Player) =>
			p.username === $user.username ? { ...p, isReady: newReadyState } : p
		);
	}

	function handleStartGame() {
		if (!isHost) return;

		wsSend({
			type: 'orbits_start_game',
			roomCode: currentRoomCode
		});
	}

	function handleLeaveRoom() {
		if (currentRoomCode) {
			wsSend({ type: 'orbits_leave_room', roomCode: currentRoomCode });
		}
		resetState();
	}

	function handleCopyCode() {
		if (currentRoomCode) {
			navigator.clipboard.writeText(currentRoomCode);
		}
	}

	function resetState() {
		lobbyState = 'menu';
		currentRoomCode = null;
		joinCode = '';
		playerList = [];
		isHost = false;
		countdownValue = 0;
		errorMessage = null;
	}

	function handleClose() {
		handleLeaveRoom();
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (lobbyState === 'in_room' || lobbyState === 'countdown') {
				// Don't close, just minimize
				isMinimized = true;
			} else {
				handleClose();
			}
		}
	}

	// Check if game can start (all players ready, at least 2 players)
	let canStartGame = $derived(
		isHost &&
		playerList.length >= 2 &&
		playerList.every((p: Player) => p.isReady)
	);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	{#if !isMinimized}
		<!-- Full Lobby Modal -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
			transition:fade={{ duration: 200 }}
			onclick={handleClose}
		>
			<div
				class="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-purple-500/30"
				transition:scale={{ duration: 200, start: 0.95 }}
				onclick={(e) => e.stopPropagation()}
			>
				<!-- Header -->
				<div class="bg-black/30 px-6 py-4 flex items-center justify-between border-b border-purple-500/20">
					<div class="flex items-center gap-3">
						<span class="text-3xl">🌌</span>
						<div>
							<h2 class="text-xl font-bold text-white">Ghost Orbits</h2>
							<p class="text-sm text-purple-300">Multiplayer Arena</p>
						</div>
					</div>
					<div class="flex items-center gap-2">
						{#if lobbyState === 'in_room'}
							<button
								type="button"
								onclick={() => isMinimized = true}
								class="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
								title="Minimize"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
								</svg>
							</button>
						{/if}
						<button
							type="button"
							onclick={handleClose}
							class="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</button>
					</div>
				</div>

				<!-- Content -->
				<div class="p-6">
					{#if lobbyState === 'menu'}
						<!-- Main Menu -->
						<div class="space-y-4">
							<button
								type="button"
								onclick={handleQuickMatch}
								class="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
							>
								<span class="text-2xl">⚡</span>
								<span>Quick Match</span>
							</button>

							<div class="flex gap-4">
								<button
									type="button"
									onclick={handleCreateRoom}
									class="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
								>
									Create Room
								</button>
								<div class="flex-1 flex gap-2">
									<input
										type="text"
										bind:value={joinCode}
										placeholder="Code"
										class="flex-1 px-3 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 uppercase text-center font-mono"
										maxlength="6"
									/>
									<button
										type="button"
										onclick={handleJoinRoom}
										class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
									>
										Join
									</button>
								</div>
							</div>

							<!-- Lobby Status -->
							{#if waitingPlayers > 0}
								<div class="bg-white/5 rounded-xl p-4 text-center">
									<div class="text-sm text-purple-300">Players waiting for match</div>
									<div class="text-2xl font-bold text-white">{waitingPlayers}/{maxPlayers}</div>
								</div>
							{/if}
						</div>

					{:else if lobbyState === 'creating' || lobbyState === 'joining'}
						<!-- Loading State -->
						<div class="text-center py-8">
							<div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
							<p class="text-purple-300">
								{lobbyState === 'creating' ? 'Creating room...' : 'Joining room...'}
							</p>
						</div>

					{:else if lobbyState === 'in_room'}
						<!-- Room View -->
						<div class="space-y-4">
							<!-- Room Code -->
							<div class="bg-black/30 rounded-xl p-4 flex items-center justify-between">
								<div>
									<div class="text-sm text-purple-300">Room Code</div>
									<div class="text-2xl font-mono font-bold text-white tracking-wider">{currentRoomCode}</div>
								</div>
								<button
									type="button"
									onclick={handleCopyCode}
									class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
								>
									Copy
								</button>
							</div>

							<!-- Players List -->
							<div class="space-y-2">
								<div class="text-sm text-purple-300 flex items-center justify-between">
									<span>Players</span>
									<span>{playerList.length}/8</span>
								</div>
								<div class="grid grid-cols-2 gap-2">
									{#each playerList as player (player.id)}
										<div
											class="bg-white/5 rounded-lg p-3 flex items-center gap-3 {player.isReady ? 'ring-2 ring-green-500' : ''}"
											transition:fly={{ y: 10, duration: 200 }}
										>
											<span class="text-2xl">{player.avatar}</span>
											<div class="flex-1 min-w-0">
												<div class="font-medium text-white truncate flex items-center gap-2">
													{player.username}
													{#if player.isHost}
														<span class="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded">HOST</span>
													{/if}
												</div>
												<div class="text-xs {player.isReady ? 'text-green-400' : 'text-gray-400'}">
													{player.isReady ? 'Ready' : 'Not Ready'}
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- Actions -->
							<div class="flex gap-3">
								<button
									type="button"
									onclick={handleLeaveRoom}
									class="px-4 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-300 font-medium rounded-lg transition-colors"
								>
									Leave
								</button>
								<button
									type="button"
									onclick={handleToggleReady}
									class="flex-1 py-2 {playerList.find((p: Player) => p.username === $user.username)?.isReady ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white font-medium rounded-lg transition-colors"
								>
									{playerList.find((p: Player) => p.username === $user.username)?.isReady ? 'Unready' : 'Ready Up'}
								</button>
								{#if isHost}
									<button
										type="button"
										onclick={handleStartGame}
										disabled={!canStartGame}
										class="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all"
									>
										Start
									</button>
								{/if}
							</div>
						</div>

					{:else if lobbyState === 'countdown'}
						<!-- Countdown -->
						<div class="text-center py-8">
							<div class="text-8xl font-bold text-white mb-4" in:scale={{ duration: 300 }}>
								{countdownValue}
							</div>
							<p class="text-xl text-purple-300">Get Ready!</p>
						</div>

					{:else if lobbyState === 'error'}
						<!-- Error State -->
						<div class="text-center py-8">
							<div class="text-5xl mb-4">❌</div>
							<p class="text-red-400 mb-4">{errorMessage || 'Something went wrong'}</p>
							<button
								type="button"
								onclick={resetState}
								class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
							>
								Back to Menu
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<!-- Minimized Indicator -->
		<button
			type="button"
			onclick={() => isMinimized = false}
			class="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all"
			transition:fly={{ y: 50, duration: 200 }}
		>
			<span class="text-lg">🎮</span>
			<span class="font-medium">
				{#if countdownValue > 0}
					Starting in {countdownValue}s
				{:else if playerList.length < 2}
					Waiting...
				{:else}
					Ready!
				{/if}
			</span>
			<span class="bg-white/20 px-2 py-0.5 rounded-full text-sm">
				{playerList.length}/8
			</span>
		</button>
	{/if}
{/if}
