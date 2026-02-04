/**
 * Mock for $app/navigation in tests
 */

export async function goto(url: string, opts?: { replaceState?: boolean; noScroll?: boolean; keepFocus?: boolean; invalidateAll?: boolean; state?: Record<string, unknown> }) {
	console.log('[Mock] goto:', url, opts);
	return;
}

export async function invalidate(url: string | URL | ((url: URL) => boolean)) {
	console.log('[Mock] invalidate:', url);
	return;
}

export async function invalidateAll() {
	console.log('[Mock] invalidateAll');
	return;
}

export async function preloadData(url: string) {
	console.log('[Mock] preloadData:', url);
	return {};
}

export async function preloadCode(...urls: string[]) {
	console.log('[Mock] preloadCode:', urls);
	return;
}

export function beforeNavigate(callback: (navigation: { from: URL | null; to: URL | null; cancel: () => void }) => void) {
	// No-op in tests
	return () => {};
}

export function afterNavigate(callback: (navigation: { from: URL | null; to: URL; type: string }) => void) {
	// No-op in tests
	return () => {};
}

export function onNavigate(callback: (navigation: { from: URL | null; to: URL; type: string }) => void) {
	// No-op in tests
	return () => {};
}

export function disableScrollHandling() {
	// No-op in tests
}

export function pushState(url: string | URL, state: Record<string, unknown>) {
	console.log('[Mock] pushState:', url, state);
}

export function replaceState(url: string | URL, state: Record<string, unknown>) {
	console.log('[Mock] replaceState:', url, state);
}
