<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = false, onClose }: Props = $props();

	const appUrl = browser ? window.location.origin : 'https://lrsl-driller.vercel.app';
	const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`;

	let copied = $state(false);

	async function copyUrl() {
		if (browser) {
			await navigator.clipboard.writeText(appUrl);
			copied = true;
			setTimeout(() => copied = false, 2000);
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_interactive_supports_focus -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" onclick={onClose}>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" onclick={(e) => e.stopPropagation()}>
			<!-- Header -->
			<div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4">
				<div class="flex items-center justify-between">
					<div>
						<h2 class="text-xl font-bold">Share Driller</h2>
						<p class="text-sm text-white/80">Scan the QR code to open the app</p>
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
			</div>

			<!-- QR Code Section -->
			<div class="p-6 text-center">
				<div class="bg-white p-4 rounded-xl inline-block shadow-inner border-2 border-gray-100">
					<img
						src={qrCodeUrl}
						alt="QR Code to Driller App"
						class="w-48 h-48"
					/>
				</div>
				<p class="mt-4 text-gray-600 text-sm">
					Point your phone camera at this QR code
				</p>

				<!-- URL with copy button -->
				<div class="mt-3 flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2">
					<span class="flex-1 text-xs text-gray-500 font-mono truncate">
						{appUrl}
					</span>
					<button
						type="button"
						onclick={copyUrl}
						class="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors"
					>
						{copied ? '✓ Copied!' : 'Copy'}
					</button>
				</div>
			</div>

			<!-- Share buttons -->
			<div class="px-6 pb-4">
				<div class="grid grid-cols-3 gap-2">
					<a
						href="https://twitter.com/intent/tweet?text=Practice%20math%20with%20Driller!&url={encodeURIComponent(appUrl)}"
						target="_blank"
						rel="noopener noreferrer"
						class="flex flex-col items-center gap-1 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
					>
						<span class="text-xl">🐦</span>
						<span class="text-xs text-blue-700">Twitter</span>
					</a>
					<a
						href="mailto:?subject=Check%20out%20Driller!&body=Practice%20math%20with%20this%20app:%20{encodeURIComponent(appUrl)}"
						class="flex flex-col items-center gap-1 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
					>
						<span class="text-xl">📧</span>
						<span class="text-xs text-gray-700">Email</span>
					</a>
					<button
						type="button"
						onclick={copyUrl}
						class="flex flex-col items-center gap-1 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
					>
						<span class="text-xl">📋</span>
						<span class="text-xs text-purple-700">Copy Link</span>
					</button>
				</div>
			</div>

			<!-- Developer Section -->
			<div class="bg-gray-900 text-white px-6 py-4">
				<div class="flex items-center gap-3">
					<div class="text-2xl">🧑‍💻</div>
					<div class="flex-1 min-w-0">
						<div class="text-xs text-gray-400 uppercase tracking-wide">For Developers</div>
						<div class="text-sm font-medium truncate">View source on GitHub</div>
					</div>
					<a
						href="https://github.com/robjohncolson/lrsl-driller"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors text-sm"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
						</svg>
						<span>GitHub</span>
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}
