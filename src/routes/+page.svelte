<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { Header, LeftPane, RightPane } from '$lib/components/layout';
	import { ScenarioCard, InputContainer, ActionButtons } from '$lib/components/drill';
	import { UsernameModal, SettingsModal, CartridgeSelectorModal, ShareModal } from '$lib/components/modals';
	import Toast from '$lib/components/Toast.svelte';
	import {
		user,
		game,
		problem,
		grading,
		settings,
		toasts
	} from '$lib/stores';
	import {
		initCartridgeLoader,
		loadCartridge,
		generateProblem,
		getModes,
		getGradingRules,
		initGameEngine,
		createGameEngine,
		loadGameCartridge,
		resetForNewProblem,
		initGradingEngine,
		gradeAllWithDual
	} from '$lib/engines';
	import {
		initTransport,
		destroyTransport,
		notifyStarEarned
	} from '$lib/network';
	import type { CartridgeMode } from '$lib/engines';

	// Component state
	let showUsernameModal = $state(false);
	let showSettingsModal = $state(false);
	let showCartridgeModal = $state(false);
	let showShareModal = $state(false);
	let showGhostPanel = $state(false);
	let isInitialized = $state(false);
	let currentCartridgeId = $state<string | null>(null);
	let cartridgeName = $state('Select Cartridge');
	let modes = $state<CartridgeMode[]>([]);

	// Initialize on mount
	onMount(async () => {
		if (!browser) return;

		// Initialize stores from localStorage
		user.init();
		settings.init();

		// Show username modal if no username set
		if (!$user.username) {
			showUsernameModal = true;
		}

		// Initialize engines
		await Promise.all([
			initCartridgeLoader('/cartridges'),
			initGameEngine(),
			initGradingEngine()
		]);

		// Create game engine instance
		createGameEngine({
			onStarEarned: (starType, counts, modeId) => {
				console.log(`Star earned: ${starType} on ${modeId}`);
				// Notify server
				if ($user.username && currentCartridgeId) {
					notifyStarEarned($user.username, starType, cartridgeName);
				}
			},
			onTierUnlocked: (tier) => {
				console.log(`Tier unlocked: ${tier.id}`);
				toasts.success(`Level unlocked: ${tier.name || tier.id}`);
			}
		});

		isInitialized = true;

		// Connect to WebSocket if we have a username
		if ($user.username) {
			connectToServer();
		}

		// Auto-load cartridge from URL or localStorage
		const urlParams = new URLSearchParams(window.location.search);
		const cartridgeParam = urlParams.get('cartridge');
		const savedCartridge = localStorage.getItem('driller_lastCartridge');

		if (cartridgeParam) {
			await handleCartridgeLoad(cartridgeParam);
		} else if (savedCartridge) {
			await handleCartridgeLoad(savedCartridge);
		}
	});

	onDestroy(() => {
		if (browser) {
			destroyTransport();
		}
	});

	// Connect to Railway WebSocket server
	function connectToServer() {
		if (!$user.username) return;

		initTransport({
			serverUrl: $user.serverUrl,
			username: $user.username,
			enableP2P: $settings.p2pEnabled,
			onStarEarned: (data) => {
				if ($settings.showNotifications) {
					toasts.star(data.username, data.star_type, data.scenario_topic);
				}
			},
			onLeaderboardUpdate: () => {
				console.log('Leaderboard updated');
			},
			onTeacherReviewSubmitted: (data) => {
				if ($user.isTeacher) {
					toasts.info(`${data.username} requested review`);
				}
			},
			onTeacherReviewCompleted: (data) => {
				if (data.username === $user.username) {
					toasts.success('Your teacher reviewed your work!');
				}
			}
		});
	}

	// Load a cartridge
	async function handleCartridgeLoad(cartridgeId: string) {
		try {
			problem.setLoading(true);
			const loaded = await loadCartridge(cartridgeId);
			if (!loaded) {
				toasts.error('Failed to load cartridge');
				return;
			}

			currentCartridgeId = cartridgeId;
			cartridgeName = loaded.manifest.meta.name;

			// Save last used cartridge
			localStorage.setItem('driller_lastCartridge', cartridgeId);

			// Load into game engine
			loadGameCartridge(loaded.manifest);

			// Update modes
			modes = getModes();

			// Auto-select first unlocked mode if available
			if ($game.unlockedTiers.length > 0 && !$game.currentTier) {
				game.setTier($game.unlockedTiers[0]);
			}

			// Generate first problem
			if ($game.currentTier) {
				await handleGenerateProblem($game.currentTier);
			}

			toasts.success(`Loaded: ${cartridgeName}`);
		} catch (err) {
			console.error('Failed to load cartridge:', err);
			toasts.error('Failed to load cartridge');
		}
	}

	// Generate a new problem
	async function handleGenerateProblem(modeId: string) {
		grading.clear();
		resetForNewProblem();
		await generateProblem(modeId);
	}

	// Handle mode selection
	async function handleModeSelect(modeId: string) {
		game.setTier(modeId);
		await handleGenerateProblem(modeId);
	}

	// Handle submit
	async function handleSubmit() {
		if (!$problem.problem || !currentCartridgeId) return;

		const answers = $problem.answers;
		const rules = getGradingRules();

		if (!rules) {
			toasts.error('Grading rules not available');
			return;
		}

		// Create context for grading
		const context = {
			...$problem.problem.context,
			scenario: $problem.problem.scenario,
			cartridgeId: currentCartridgeId
		};

		try {
			// Grade with dual grading
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await gradeAllWithDual(answers, rules as any, context);

			// Award star if all correct
			if ($grading.allCorrect) {
				const starType = $game.potentialStar;
				game.awardStar(starType, $game.currentTier);
				toasts.success(`Correct! Earned a ${starType} star!`);
			} else {
				// Count as retry for next attempt
				game.useRetry();
			}
		} catch (err) {
			console.error('Grading failed:', err);
			toasts.error('Grading failed. Please try again.');
		}
	}

	// Handle next problem
	async function handleNextProblem() {
		if ($game.currentTier) {
			await handleGenerateProblem($game.currentTier);
		}
	}

	// Handle hint
	function handleHint() {
		game.useHint();
		toasts.info('Hint used - star level decreased');
	}

	// Handle skip
	async function handleSkip() {
		if ($game.currentTier) {
			await handleGenerateProblem($game.currentTier);
		}
	}

	// Handle username save
	function handleUsernameSave(username: string) {
		showUsernameModal = false;
		connectToServer();
		toasts.success(`Welcome, ${username}!`);
	}
</script>

<svelte:head>
	<title>Driller - {cartridgeName}</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 flex flex-col">
	<!-- Header -->
	<Header
		{cartridgeName}
		onCartridgeClick={() => showCartridgeModal = true}
		onUserClick={() => showUsernameModal = true}
		onSettingsClick={() => showSettingsModal = true}
		onShareClick={() => showShareModal = true}
		onGhostClick={() => showGhostPanel = !showGhostPanel}
	/>

	<!-- Main Content -->
	<div class="flex-1 flex overflow-hidden">
		<!-- Left Pane: Level Selector -->
		<LeftPane
			{modes}
			currentMode={$game.currentTier}
			onModeSelect={handleModeSelect}
		/>

		<!-- Center: Main Drill Area -->
		<main class="flex-1 overflow-y-auto p-6">
			<div class="max-w-3xl mx-auto space-y-6">
				<!-- Loading State -->
				{#if !isInitialized}
					<div class="bg-white rounded-xl shadow-lg p-12 text-center">
						<div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
						<p class="text-gray-600">Loading Driller...</p>
					</div>
				{:else if !currentCartridgeId}
					<!-- No Cartridge Selected -->
					<div class="bg-white rounded-xl shadow-lg p-12 text-center">
						<div class="text-6xl mb-4">📦</div>
						<h2 class="text-xl font-bold text-gray-800 mb-2">Welcome to Driller!</h2>
						<p class="text-gray-600 mb-6">Select a cartridge to start practicing.</p>
						<button
							onclick={() => showCartridgeModal = true}
							class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
						>
							Choose Cartridge
						</button>
					</div>
				{:else}
					<!-- Scenario Card -->
					<ScenarioCard
						scenario={$problem.problem?.scenario}
						modeName={$problem.modeName || ''}
						animation={$problem.problem?.animation}
					/>

					<!-- Input Fields -->
					{#if $problem.problem?.inputFields}
						<div class="bg-white rounded-xl shadow-lg p-6">
							<h3 class="text-lg font-semibold text-gray-800 mb-4">Your Answer</h3>
							<InputContainer
								fields={$problem.problem.inputFields}
								disabled={$grading.isGrading}
							/>
						</div>
					{/if}

					<!-- Action Buttons -->
					<div class="bg-white rounded-xl shadow-lg p-4">
						<ActionButtons
							onSubmit={handleSubmit}
							onSkip={handleSkip}
							onHint={handleHint}
							onNextProblem={handleNextProblem}
						/>
					</div>
				{/if}
			</div>
		</main>

		<!-- Right Pane: Stats and Ghost -->
		<RightPane
			{showGhostPanel}
			onGhostPanelToggle={() => showGhostPanel = !showGhostPanel}
		/>
	</div>
</div>

<!-- Modals -->
<UsernameModal
	open={showUsernameModal}
	onClose={() => showUsernameModal = false}
	onSave={handleUsernameSave}
/>

<SettingsModal
	open={showSettingsModal}
	onClose={() => showSettingsModal = false}
/>

<CartridgeSelectorModal
	open={showCartridgeModal}
	{currentCartridgeId}
	onClose={() => showCartridgeModal = false}
	onSelect={handleCartridgeLoad}
/>

<ShareModal
	open={showShareModal}
	onClose={() => showShareModal = false}
/>

<!-- Toast Notifications -->
<Toast />
