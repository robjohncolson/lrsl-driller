<script lang="ts">
	import { game } from '$lib/stores';
	import type { CartridgeMode } from '$lib/engines';

	interface Props {
		modes?: CartridgeMode[];
		currentMode?: string | null;
		onModeSelect?: (modeId: string) => void;
	}

	let { modes = [], currentMode = null, onModeSelect }: Props = $props();

	function handleModeClick(modeId: string) {
		if ($game.unlockedTiers.includes(modeId)) {
			onModeSelect?.(modeId);
		}
	}

	function getModeGoldStars(modeId: string): number {
		return $game.starsPerMode[modeId]?.gold || 0;
	}

	function getRequiredGold(modeId: string, modeIndex: number): number {
		// First level always unlocked
		if (modeIndex === 0) return 0;

		// Check progression overrides first
		if ($game.progressionOverrides[modeId] !== undefined) {
			return $game.progressionOverrides[modeId];
		}

		// Check mode's unlockedBy
		const mode = modes.find(m => m.id === modeId);
		if (mode?.unlockedBy && typeof mode.unlockedBy === 'object' && mode.unlockedBy.gold !== undefined) {
			return mode.unlockedBy.gold;
		}

		return $game.goldToUnlock;
	}
</script>

<aside class="w-64 bg-white border-r border-gray-200 overflow-y-auto">
	<div class="p-4">
		<h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Levels</h2>

		<div class="space-y-2">
			{#each modes as mode, index}
				{@const isUnlocked = $game.unlockedTiers.includes(mode.id)}
				{@const isCurrent = currentMode === mode.id}
				{@const goldStars = getModeGoldStars(mode.id)}
				{@const requiredGold = getRequiredGold(mode.id, index)}
				{@const prevModeId = index > 0 ? modes[index - 1].id : null}
				{@const prevGoldStars = prevModeId ? getModeGoldStars(prevModeId) : 0}

				<button
					onclick={() => handleModeClick(mode.id)}
					disabled={!isUnlocked}
					class="w-full text-left p-3 rounded-lg transition-all {isCurrent
						? 'bg-purple-100 border-2 border-purple-500'
						: isUnlocked
							? 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
							: 'bg-gray-100 border border-gray-200 opacity-60 cursor-not-allowed'}"
				>
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-lg">
								{#if !isUnlocked}
									🔒
								{:else if isCurrent}
									▶️
								{:else}
									{index + 1}.
								{/if}
							</span>
							<div>
								<div class="font-medium text-sm {!isUnlocked ? 'text-gray-400' : 'text-gray-800'}">
									{mode.name}
								</div>
								{#if mode.description}
									<div class="text-xs text-gray-500 truncate max-w-[140px]">
										{mode.description}
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Progress indicator -->
					<div class="mt-2 flex items-center gap-1">
						{#each Array(requiredGold || 1) as _, i}
							<span class="text-sm {i < goldStars ? 'star-gold' : 'text-gray-300'}">★</span>
						{/each}

						{#if isUnlocked && goldStars >= requiredGold}
							<span class="text-xs text-green-600 ml-auto">✓</span>
						{:else if !isUnlocked && index > 0}
							<span class="text-xs text-gray-400 ml-auto">
								Need {requiredGold - prevGoldStars} more ★
							</span>
						{/if}
					</div>
				</button>
			{/each}

			{#if modes.length === 0}
				<div class="text-center text-gray-400 py-8">
					<p>No levels loaded</p>
					<p class="text-xs mt-1">Select a cartridge to start</p>
				</div>
			{/if}
		</div>
	</div>
</aside>
