/**
 * Mock for $app/stores in tests
 */

import { writable, readable } from 'svelte/store';

export const page = readable({
	url: new URL('http://localhost:5173'),
	params: {},
	route: { id: null },
	status: 200,
	error: null,
	data: {},
	state: {},
	form: null
});

export const navigating = readable(null);

export const updated = {
	subscribe: readable(false).subscribe,
	check: async () => false
};
