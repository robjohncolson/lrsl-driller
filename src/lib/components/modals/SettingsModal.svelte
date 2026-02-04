<script lang="ts">
	import { settings, user } from '$lib/stores';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = false, onClose }: Props = $props();

	function handleResetProgress() {
		if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
			// Clear all localStorage data for this user
			const keys = Object.keys(localStorage);
			for (const key of keys) {
				if (key.startsWith('driller_')) {
					localStorage.removeItem(key);
				}
			}
			window.location.reload();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_interactive_supports_focus -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" onclick={onClose}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onclick={(e) => e.stopPropagation()}>
			<!-- Header -->
			<div class="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-6 py-4">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-bold">Settings</h2>
						<p class="text-sm text-white/80">Customize your experience</p>
					</div>
					<button
						type="button"
						onclick={onClose}
						class="p-2 hover:bg-white/20 rounded-full transition-colors"
						aria-label="Close settings"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
			</div>

			<!-- Settings List -->
			<div class="p-6 space-y-4">
				<!-- Sound -->
				<label class="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
					<div class="flex items-center gap-3">
						<span class="text-2xl">🔊</span>
						<div>
							<div class="font-medium text-gray-800">Sound Effects</div>
							<div class="text-sm text-gray-500">Play sounds for stars and notifications</div>
						</div>
					</div>
					<input
						type="checkbox"
						checked={$settings.soundEnabled}
						onchange={() => settings.toggle('soundEnabled')}
						class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
					/>
				</label>

				<!-- Notifications -->
				<label class="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
					<div class="flex items-center gap-3">
						<span class="text-2xl">🔔</span>
						<div>
							<div class="font-medium text-gray-800">Notifications</div>
							<div class="text-sm text-gray-500">Show when others earn stars</div>
						</div>
					</div>
					<input
						type="checkbox"
						checked={$settings.showNotifications}
						onchange={() => settings.toggle('showNotifications')}
						class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
					/>
				</label>

				<!-- P2P / WebRTC -->
				<label class="flex items-center justify-between p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors border border-purple-200">
					<div class="flex items-center gap-3">
						<span class="text-2xl">🌐</span>
						<div>
							<div class="font-medium text-purple-800">Peer-to-Peer Mode</div>
							<div class="text-sm text-purple-600">
								Experimental! Direct connections for multiplayer.
								<br />
								<span class="text-xs text-purple-500">Falls back to server if unavailable.</span>
							</div>
						</div>
					</div>
					<input
						type="checkbox"
						checked={$settings.p2pEnabled}
						onchange={() => settings.toggle('p2pEnabled')}
						class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
					/>
				</label>

				<!-- Reduced Motion -->
				<label class="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
					<div class="flex items-center gap-3">
						<span class="text-2xl">✨</span>
						<div>
							<div class="font-medium text-gray-800">Reduced Motion</div>
							<div class="text-sm text-gray-500">Minimize animations</div>
						</div>
					</div>
					<input
						type="checkbox"
						checked={$settings.reducedMotion}
						onchange={() => settings.toggle('reducedMotion')}
						class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
					/>
				</label>

				<!-- Teacher Mode -->
				<label class="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
					<div class="flex items-center gap-3">
						<span class="text-2xl">👨‍🏫</span>
						<div>
							<div class="font-medium text-gray-800">Teacher Mode</div>
							<div class="text-sm text-gray-500">Access teacher controls and analytics</div>
						</div>
					</div>
					<input
						type="checkbox"
						checked={$user.isTeacher}
						onchange={() => user.toggleTeacher()}
						class="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
					/>
				</label>
			</div>

			<!-- Danger Zone -->
			<div class="px-6 pb-6">
				<div class="border border-red-200 rounded-lg p-4 bg-red-50">
					<h3 class="text-sm font-semibold text-red-700 mb-2">Danger Zone</h3>
					<button
						type="button"
						onclick={handleResetProgress}
						class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
					>
						Reset All Progress
					</button>
				</div>
			</div>

			<!-- Footer -->
			<div class="bg-gray-100 px-6 py-3 text-center text-xs text-gray-500">
				Driller v5.0.0 • Svelte Edition
			</div>
		</div>
	</div>
{/if}
