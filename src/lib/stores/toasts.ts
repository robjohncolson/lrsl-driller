/**
 * Toast Notifications Store
 * Manages transient notification messages
 */

import { writable, derived } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'star';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
	icon?: string;
	username?: string; // For star notifications
}

interface ToastState {
	toasts: Toast[];
}

const initialState: ToastState = {
	toasts: []
};

function createToastStore() {
	const { subscribe, update } = writable<ToastState>(initialState);

	let idCounter = 0;

	function addToast(toast: Omit<Toast, 'id'>): string {
		const id = `toast_${++idCounter}_${Date.now()}`;

		update(state => ({
			toasts: [...state.toasts, { ...toast, id }]
		}));

		// Auto-remove after duration
		if (toast.duration > 0) {
			setTimeout(() => {
				removeToast(id);
			}, toast.duration);
		}

		return id;
	}

	function removeToast(id: string) {
		update(state => ({
			toasts: state.toasts.filter(t => t.id !== id)
		}));
	}

	return {
		subscribe,

		/**
		 * Show a success toast
		 */
		success: (message: string, duration = 3000) => {
			return addToast({ message, type: 'success', duration, icon: '✓' });
		},

		/**
		 * Show an error toast
		 */
		error: (message: string, duration = 5000) => {
			return addToast({ message, type: 'error', duration, icon: '✕' });
		},

		/**
		 * Show an info toast
		 */
		info: (message: string, duration = 3000) => {
			return addToast({ message, type: 'info', duration, icon: 'ℹ' });
		},

		/**
		 * Show a warning toast
		 */
		warning: (message: string, duration = 4000) => {
			return addToast({ message, type: 'warning', duration, icon: '⚠' });
		},

		/**
		 * Show a star earned notification
		 */
		star: (username: string, starType: string, topic?: string, duration = 4000) => {
			const starEmoji: Record<string, string> = {
				gold: '⭐',
				silver: '🥈',
				bronze: '🥉',
				tin: '○'
			};
			const emoji = starEmoji[starType] || '⭐';
			const message = topic
				? `earned a ${starType} star on "${topic}"`
				: `earned a ${starType} star`;

			return addToast({
				message,
				type: 'star',
				duration,
				icon: emoji,
				username
			});
		},

		/**
		 * Show a custom toast
		 */
		show: (toast: Omit<Toast, 'id'>) => {
			return addToast(toast);
		},

		/**
		 * Dismiss a toast by ID
		 */
		dismiss: (id: string) => {
			removeToast(id);
		},

		/**
		 * Clear all toasts
		 */
		clear: () => {
			update(() => ({ toasts: [] }));
		}
	};
}

export const toasts = createToastStore();

// Derived store for just the toasts array
export const toastList = derived(toasts, ($toasts) => $toasts.toasts);
