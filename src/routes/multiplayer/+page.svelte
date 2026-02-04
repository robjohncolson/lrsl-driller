<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { user, game, connection } from '$lib/stores';
	import { getAvatarForUsername } from '$lib/stores/user';
	import { initGhost, getGhostProfile as getGhostProfileLocal } from '$lib/engines/ghost-engine';
	import { OrbitsLobby, OrbitsArena } from '$lib/components/multiplayer';

	// Game states
	type ViewState = 'lobby' | 'arena' | 'loading' | 'error';

	// State
	let viewState = $state<ViewState>('loading');
	let errorMessage = $state<string | null>(null);
	let roomCode = $state<string | null>(null);
	let gameMode = $state<'arena' | 'trails'>('arena');

	// Players state from lobby
	let lobbyPlayers = $state<Player[]>([]);
	let isArenaOpen = $state(false);

	interface Player {
		id: string;
		username: string;
		avatar: string;
		x: number;
		y: number;
		lives: number;
		score: number;
		color: string;
	}

	// Ghost profile for the current user
	let ghostProfile = $state<GhostProfile | null>(null);

	interface GhostProfile {
		username: string;
		cartridgeId: string;
		proficiency: number;
		color: string;
		opacity: number;
	}

	// Initialize on mount
	onMount(async () => {
		// Check if user is logged in
		if (!$user.username) {
			goto('/?showLogin=true');
			return;
		}

		// Get room code from URL if present
		const urlRoomCode = $page.url.searchParams.get('room');
		if (urlRoomCode) {
			roomCode = urlRoomCode;
		}

		// Get game mode from URL
		const mode = $page.url.searchParams.get('mode');
		if (mode === 'trails') {
			gameMode = 'trails';
		}

		// Load ghost profile
		try {
			const currentCartridge = $game.cartridgeId || 'default';
			await initGhost($user.username, currentCartridge);
			ghostProfile = getGhostProfileLocal() as GhostProfile;
		} catch (err) {
			console.warn('[Multiplayer] Could not load ghost profile:', err);
			// Continue without ghost profile - will use default
		}

		viewState = 'lobby';
	});

	onDestroy(() => {
		// Clean up any resources
	});

	interface MatchData {
		roomCode: string;
		players: LobbyPlayer[];
		mode: string;
	}

	interface LobbyPlayer {
		id: string;
		username: string;
		avatar: string;
		isHost: boolean;
		isReady: boolean;
	}

	function handleMatchStart(matchData: MatchData) {
		roomCode = matchData.roomCode;
		// Convert lobby players to arena format
		lobbyPlayers = matchData.players.map(p => ({
			id: p.id,
			username: p.username,
			avatar: p.avatar,
			x: 400 + Math.random() * 100 - 50,
			y: 300 + Math.random() * 100 - 50,
			lives: 3,
			score: 0,
			color: '#8b5cf6'
		}));
		isArenaOpen = true;
		viewState = 'arena';
	}

	function handleLobbyClose() {
		goto('/');
	}

	function handleArenaExit() {
		isArenaOpen = false;
		viewState = 'lobby';
		roomCode = null;
		lobbyPlayers = [];
	}

	function handleBackToMain() {
		goto('/');
	}

	// Calculate player color from ghost profile
	function getPlayerColor(): string {
		if (!ghostProfile?.color) return '#8b5cf6'; // Default purple
		const colorMap: Record<string, string> = {
			white: '#ffffff',
			yellow: '#ffff44',
			orange: '#ff8844',
			red: '#ff4444',
			indigo: '#8b5cf6'
		};
		return colorMap[ghostProfile.color] || '#8b5cf6';
	}

	// Convert lobby players to arena format
	function computeArenaPlayers(): Player[] {
		if (!$user.username) return [];

		// Add local player if not already in list
		const hasLocalPlayer = lobbyPlayers.some(p => p.username === $user.username);
		if (!hasLocalPlayer) {
			return [
				{
					id: $user.username,
					username: $user.username,
					avatar: getAvatarForUsername($user.username),
					x: 400,
					y: 300,
					lives: 3,
					score: 0,
					color: getPlayerColor()
				},
				...lobbyPlayers
			];
		}
		return lobbyPlayers;
	}

	let arenaPlayers = $derived(computeArenaPlayers());
</script>

<svelte:head>
	<title>Ghost Orbits | LRSL Driller</title>
	<meta name="description" content="Battle your Shadow Self in the Ghost Orbits arena" />
</svelte:head>

<main class="multiplayer-page">
	{#if viewState === 'loading'}
		<div class="loading-screen">
			<div class="loading-spinner"></div>
			<p>Loading Ghost Orbits...</p>
		</div>
	{:else if viewState === 'error'}
		<div class="error-screen">
			<div class="error-icon">
				<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="12" cy="12" r="10"></circle>
					<line x1="12" y1="8" x2="12" y2="12"></line>
					<line x1="12" y1="16" x2="12.01" y2="16"></line>
				</svg>
			</div>
			<h2>Unable to Connect</h2>
			<p>{errorMessage || 'Something went wrong. Please try again.'}</p>
			<div class="error-actions">
				<button type="button" onclick={() => { viewState = 'lobby'; }}>
					Try Again
				</button>
				<button type="button" class="secondary" onclick={handleBackToMain}>
					Back to Main
				</button>
			</div>
		</div>
	{:else if viewState === 'lobby'}
		<OrbitsLobby
			open={true}
			onClose={handleLobbyClose}
			onMatchStart={handleMatchStart}
		/>
	{:else if viewState === 'arena' && roomCode}
		<OrbitsArena
			bind:open={isArenaOpen}
			{roomCode}
			players={arenaPlayers}
			onExit={handleArenaExit}
		/>
	{/if}

	<!-- Connection Status Indicator -->
	{#if $connection.status !== 'connected' && viewState !== 'loading'}
		<div class="connection-warning">
			<span class="warning-icon">⚠️</span>
			<span>
				{#if $connection.status === 'connecting'}
					Connecting to server...
				{:else if $connection.status === 'disconnected'}
					Disconnected - Reconnecting...
				{:else}
					Connection issue
				{/if}
			</span>
		</div>
	{/if}
</main>

<style>
	.multiplayer-page {
		position: fixed;
		inset: 0;
		background: #0a0a12;
		color: white;
		display: flex;
		flex-direction: column;
	}

	.loading-screen,
	.error-screen {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 2rem;
	}

	.loading-spinner {
		width: 48px;
		height: 48px;
		border: 3px solid #333;
		border-top-color: #8b5cf6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.error-icon {
		color: #ef4444;
		margin-bottom: 1rem;
	}

	.error-screen h2 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
	}

	.error-screen p {
		margin: 0 0 1.5rem;
		color: #888;
		max-width: 300px;
	}

	.error-actions {
		display: flex;
		gap: 1rem;
	}

	.error-actions button {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s, transform 0.1s;
	}

	.error-actions button:not(.secondary) {
		background: #8b5cf6;
		color: white;
	}

	.error-actions button:not(.secondary):hover {
		background: #7c3aed;
	}

	.error-actions button.secondary {
		background: #333;
		color: #ccc;
	}

	.error-actions button.secondary:hover {
		background: #444;
	}

	.error-actions button:active {
		transform: scale(0.98);
	}

	.connection-warning {
		position: fixed;
		bottom: 1rem;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(234, 179, 8, 0.9);
		color: #000;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		z-index: 100;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(1rem);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.warning-icon {
		font-size: 1rem;
	}
</style>
