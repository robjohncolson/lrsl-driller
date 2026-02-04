import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			$engines: 'src/lib/engines',
			$stores: 'src/lib/stores',
			$components: 'src/lib/components',
			$network: 'src/lib/network'
		}
	}
};

export default config;
