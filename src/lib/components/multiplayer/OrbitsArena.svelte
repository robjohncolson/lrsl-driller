<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { user, connection } from '$lib/stores';
	import { getAvatarForUsername } from '$lib/stores/user';
	import { sendGameState, wsSend, addMessageHandler, removeMessageHandler } from '$lib/network';

	interface Props {
		open: boolean;
		roomCode: string;
		players: Player[];
		onExit: () => void;
	}

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

	interface Dot {
		id: string;
		x: number;
		y: number;
		ownerId: string | null;
		color: string;
	}

	type GameState = 'countdown' | 'playing' | 'paused' | 'ended';

	let { open = $bindable(false), roomCode, players: initialPlayers, onExit }: Props = $props();

	// Game state
	let gameState = $state<GameState>('countdown');
	let countdownValue = $state(3);
	let timeRemaining = $state(120);
	let localPlayer = $state<Player | null>(null);
	let players = $state<Player[]>([]);
	let dots = $state<Dot[]>([]);
	let winner = $state<string | null>(null);

	// Canvas refs
	let canvasEl: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;

	// Game loop
	let animationFrame: number | null = null;
	let lastTime = 0;

	// Input state
	let keys = new Set<string>();

	// Arena dimensions
	const ARENA_WIDTH = 800;
	const ARENA_HEIGHT = 600;
	const PLAYER_RADIUS = 20;
	const DOT_RADIUS = 8;
	const PLAYER_SPEED = 200; // pixels per second

	// Message handlers
	let handlers: Array<{ type: string; handler: (msg: unknown) => void }> = [];

	onMount(() => {
		// Initialize canvas
		if (canvasEl) {
			ctx = canvasEl.getContext('2d');
		}

		// Find local player
		localPlayer = players.find(p => p.username === $user.username) || null;

		// Initialize game
		initializeDots();
		startCountdown();

		// Set up input handlers
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		// Set up network handlers
		const stateUpdateHandler = (msg: unknown) => {
			const data = msg as { players: Player[]; dots: Dot[]; timeRemaining: number };
			players = data.players;
			dots = data.dots;
			timeRemaining = data.timeRemaining;

			// Update local player reference
			localPlayer = players.find(p => p.username === $user.username) || null;
		};

		const gameEndHandler = (msg: unknown) => {
			const data = msg as { winner: string };
			winner = data.winner;
			gameState = 'ended';
			stopGameLoop();
		};

		handlers = [
			{ type: 'orbits_state_update', handler: stateUpdateHandler },
			{ type: 'orbits_game_end', handler: gameEndHandler }
		];

		for (const { type, handler } of handlers) {
			addMessageHandler(type, handler);
		}
	});

	onDestroy(() => {
		// Clean up
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('keyup', handleKeyUp);

		for (const { type, handler } of handlers) {
			removeMessageHandler(type, handler);
		}

		stopGameLoop();
	});

	function initializeDots() {
		// Create initial dot grid
		const gridSize = 8;
		const dotSpacingX = ARENA_WIDTH / (gridSize + 1);
		const dotSpacingY = ARENA_HEIGHT / (gridSize + 1);

		dots = [];
		for (let i = 1; i <= gridSize; i++) {
			for (let j = 1; j <= gridSize; j++) {
				dots.push({
					id: `dot_${i}_${j}`,
					x: dotSpacingX * i,
					y: dotSpacingY * j,
					ownerId: null,
					color: '#555'
				});
			}
		}
	}

	function startCountdown() {
		gameState = 'countdown';
		countdownValue = 3;

		const countdownInterval = setInterval(() => {
			countdownValue--;
			if (countdownValue <= 0) {
				clearInterval(countdownInterval);
				startGame();
			}
		}, 1000);
	}

	function startGame() {
		gameState = 'playing';
		timeRemaining = 120;
		lastTime = performance.now();
		startGameLoop();

		// Start game timer
		const timerInterval = setInterval(() => {
			if (gameState !== 'playing') {
				clearInterval(timerInterval);
				return;
			}
			timeRemaining--;
			if (timeRemaining <= 0) {
				clearInterval(timerInterval);
				endGame();
			}
		}, 1000);
	}

	function startGameLoop() {
		function loop(time: number) {
			if (gameState !== 'playing') return;

			const delta = (time - lastTime) / 1000;
			lastTime = time;

			update(delta);
			render();

			animationFrame = requestAnimationFrame(loop);
		}

		animationFrame = requestAnimationFrame(loop);
	}

	function stopGameLoop() {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
			animationFrame = null;
		}
	}

	function update(delta: number) {
		if (!localPlayer) return;

		// Handle movement
		let dx = 0;
		let dy = 0;

		if (keys.has('ArrowUp') || keys.has('KeyW')) dy -= 1;
		if (keys.has('ArrowDown') || keys.has('KeyS')) dy += 1;
		if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1;
		if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;

		// Normalize diagonal movement
		if (dx !== 0 && dy !== 0) {
			const mag = Math.sqrt(dx * dx + dy * dy);
			dx /= mag;
			dy /= mag;
		}

		// Apply movement
		const newX = Math.max(PLAYER_RADIUS, Math.min(ARENA_WIDTH - PLAYER_RADIUS, localPlayer.x + dx * PLAYER_SPEED * delta));
		const newY = Math.max(PLAYER_RADIUS, Math.min(ARENA_HEIGHT - PLAYER_RADIUS, localPlayer.y + dy * PLAYER_SPEED * delta));

		if (newX !== localPlayer.x || newY !== localPlayer.y) {
			localPlayer.x = newX;
			localPlayer.y = newY;

			// Update players array
			players = players.map(p =>
				p.username === localPlayer!.username ? localPlayer! : p
			);

			// Send position update
			sendGameState({
				type: 'player_move',
				roomCode,
				x: newX,
				y: newY
			});
		}

		// Check dot collisions
		checkDotCollisions();
	}

	function checkDotCollisions() {
		if (!localPlayer) return;

		let changed = false;
		dots = dots.map(dot => {
			if (dot.ownerId === localPlayer!.username) return dot;

			const dx = localPlayer!.x - dot.x;
			const dy = localPlayer!.y - dot.y;
			const dist = Math.sqrt(dx * dx + dy * dy);

			if (dist < PLAYER_RADIUS + DOT_RADIUS) {
				changed = true;
				return {
					...dot,
					ownerId: localPlayer!.username,
					color: localPlayer!.color || '#8b5cf6'
				};
			}
			return dot;
		});

		if (changed) {
			// Send dot claim
			sendGameState({
				type: 'dots_update',
				roomCode,
				dots
			});

			// Update score
			localPlayer.score = dots.filter(d => d.ownerId === localPlayer!.username).length;
		}
	}

	function render() {
		if (!ctx) return;

		// Clear canvas
		ctx.fillStyle = '#1a1a2e';
		ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

		// Draw grid lines
		ctx.strokeStyle = '#2a2a4e';
		ctx.lineWidth = 1;
		for (let i = 0; i <= ARENA_WIDTH; i += 50) {
			ctx.beginPath();
			ctx.moveTo(i, 0);
			ctx.lineTo(i, ARENA_HEIGHT);
			ctx.stroke();
		}
		for (let i = 0; i <= ARENA_HEIGHT; i += 50) {
			ctx.beginPath();
			ctx.moveTo(0, i);
			ctx.lineTo(ARENA_WIDTH, i);
			ctx.stroke();
		}

		// Draw dots
		for (const dot of dots) {
			ctx.beginPath();
			ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
			ctx.fillStyle = dot.color;
			ctx.fill();
		}

		// Draw players
		for (const player of players) {
			// Player circle
			ctx.beginPath();
			ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
			ctx.fillStyle = player.color || '#8b5cf6';
			ctx.fill();

			// Player border
			ctx.strokeStyle = player.username === $user.username ? '#fff' : '#333';
			ctx.lineWidth = 3;
			ctx.stroke();

			// Username label
			ctx.fillStyle = '#fff';
			ctx.font = '12px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(player.username, player.x, player.y - PLAYER_RADIUS - 5);

			// Lives indicator
			const livesText = '❤'.repeat(player.lives);
			ctx.fillStyle = '#ef4444';
			ctx.fillText(livesText, player.x, player.y + PLAYER_RADIUS + 15);
		}
	}

	function endGame() {
		gameState = 'ended';
		stopGameLoop();

		// Determine winner (most dots)
		let maxScore = 0;
		let gameWinner = '';
		for (const player of players) {
			const score = dots.filter(d => d.ownerId === player.username).length;
			if (score > maxScore) {
				maxScore = score;
				gameWinner = player.username;
			}
		}
		winner = gameWinner;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (gameState !== 'playing') return;

		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) {
			e.preventDefault();
			keys.add(e.code);
		}

		// Escape to pause
		if (e.code === 'Escape') {
			handleExit();
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		keys.delete(e.code);
	}

	function handleExit() {
		wsSend({ type: 'orbits_leave_game', roomCode });
		onExit();
	}

	function handlePlayAgain() {
		// Reset and restart
		initializeDots();
		players = players.map(p => ({ ...p, score: 0, lives: 3 }));
		winner = null;
		startCountdown();
	}

	// Calculate territory percentage
	let territoryPercent = $derived(() => {
		const player = localPlayer;
		if (!player || dots.length === 0) return 0;
		const owned = dots.filter(d => d.ownerId === player.username).length;
		return Math.round((owned / dots.length) * 100);
	});

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 bg-black flex flex-col"
		transition:fade={{ duration: 200 }}
	>
		<!-- HUD -->
		<div class="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-3 bg-black/50 z-10">
			<!-- Left: Exit button + Room code -->
			<div class="flex items-center gap-4">
				<button
					type="button"
					onclick={handleExit}
					class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
				>
					Exit
				</button>
				<div class="text-gray-400 text-sm">
					Room: <span class="text-white font-mono">{roomCode}</span>
				</div>
			</div>

			<!-- Center: Timer -->
			<div class="text-3xl font-bold text-white font-mono">
				{formatTime(timeRemaining)}
			</div>

			<!-- Right: Score -->
			<div class="flex items-center gap-4">
				<div class="text-white">
					Territory: <span class="font-bold text-purple-400">{territoryPercent()}%</span>
				</div>
				<div class="text-white">
					Lives: <span class="text-red-400">{'❤'.repeat(localPlayer?.lives || 0)}</span>
				</div>
			</div>
		</div>

		<!-- Game Canvas -->
		<div class="flex-1 flex items-center justify-center">
			<canvas
				bind:this={canvasEl}
				width={ARENA_WIDTH}
				height={ARENA_HEIGHT}
				class="border-2 border-purple-500/30 rounded-lg shadow-2xl"
			></canvas>
		</div>

		<!-- Player List -->
		<div class="absolute bottom-4 left-4 bg-black/70 rounded-lg p-3">
			<div class="text-xs text-gray-400 uppercase mb-2">Players</div>
			<div class="space-y-1">
				{#each players as player}
					<div class="flex items-center gap-2 text-sm">
						<span>{player.avatar}</span>
						<span class="text-white {player.username === $user.username ? 'font-bold' : ''}">{player.username}</span>
						<span class="text-purple-400 ml-auto">{dots.filter(d => d.ownerId === player.username).length}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Controls hint -->
		<div class="absolute bottom-4 right-4 bg-black/70 rounded-lg p-3 text-xs text-gray-400">
			<div class="font-medium text-white mb-1">Controls</div>
			<div>WASD or Arrow Keys - Move</div>
			<div>Space - Boost (coming soon)</div>
			<div>ESC - Exit</div>
		</div>

		<!-- Countdown Overlay -->
		{#if gameState === 'countdown'}
			<div
				class="absolute inset-0 flex items-center justify-center bg-black/70 z-20"
				transition:fade={{ duration: 200 }}
			>
				<div class="text-9xl font-bold text-white" in:fly={{ y: -50, duration: 300 }}>
					{countdownValue > 0 ? countdownValue : 'GO!'}
				</div>
			</div>
		{/if}

		<!-- Game Over Overlay -->
		{#if gameState === 'ended' && winner}
			<div
				class="absolute inset-0 flex items-center justify-center bg-black/80 z-20"
				transition:fade={{ duration: 200 }}
			>
				<div class="text-center" in:fly={{ y: 50, duration: 300 }}>
					<div class="text-6xl mb-4">🏆</div>
					<h2 class="text-4xl font-bold text-white mb-2">
						{winner === $user.username ? 'You Win!' : `${winner} Wins!`}
					</h2>
					<div class="text-xl text-purple-300 mb-6">
						Territory: {territoryPercent()}%
					</div>
					<div class="flex gap-4 justify-center">
						<button
							type="button"
							onclick={handlePlayAgain}
							class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
						>
							Play Again
						</button>
						<button
							type="button"
							onclick={handleExit}
							class="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
						>
							Exit
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}
