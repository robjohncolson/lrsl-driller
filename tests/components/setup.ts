/**
 * Component test setup
 * Configures testing-library and jest-dom matchers
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: 'test'
}));

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(() => () => {}),
	afterNavigate: vi.fn(() => () => {}),
	onNavigate: vi.fn(() => () => {}),
	disableScrollHandling: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn()
}));

// Mock $app/stores
vi.mock('$app/stores', () => {
	const { readable, writable } = require('svelte/store');
	return {
		page: readable({
			url: new URL('http://localhost'),
			params: {},
			route: { id: '/' },
			status: 200,
			error: null,
			data: {},
			form: null
		}),
		navigating: readable(null),
		updated: {
			subscribe: readable(false).subscribe,
			check: vi.fn()
		}
	};
});

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => { store[key] = value; },
		removeItem: (key: string) => { delete store[key]; },
		clear: () => { store = {}; }
	};
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });
