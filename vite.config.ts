import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync, existsSync } from 'fs';

// Plugin to copy runtime assets (cartridges) to dist for legacy app
function copyRuntimeAssets() {
	return {
		name: 'copy-runtime-assets',
		closeBundle() {
			const assetsToCopy = ['cartridges', 'audio'];
			for (const dir of assetsToCopy) {
				if (existsSync(dir)) {
					cpSync(dir, `build/client/${dir}`, { recursive: true });
					console.log(`Copied ${dir}/ to build/client/${dir}/`);
				}
			}
		}
	};
}

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		copyRuntimeAssets()
	],
	resolve: {
		alias: {
			$engines: resolve('./src/lib/engines'),
			$stores: resolve('./src/lib/stores'),
			$components: resolve('./src/lib/components'),
			$network: resolve('./src/lib/network')
		}
	},
	build: {
		// Generate source maps for debugging (disable in CI for smaller bundles)
		sourcemap: process.env.CI ? false : true,

		// Target modern browsers for smaller bundles
		target: 'es2020',

		// Chunk size warning at 500KB
		chunkSizeWarningLimit: 500
	},
	optimizeDeps: {
		// Pre-bundle these dependencies for faster dev startup
		include: ['svelte/store', 'svelte/transition']
	}
});
