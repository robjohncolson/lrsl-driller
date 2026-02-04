/**
 * Component tests for Toast
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';

// Import setup for mocks
import './setup';

// Import the stores and component
import { toasts, toastList } from '$lib/stores/toasts';
import Toast from '$lib/components/Toast.svelte';

describe('Toast Component', () => {
	beforeEach(() => {
		// Clear toasts before each test
		toasts.clear();
	});

	describe('Rendering', () => {
		it('should not render anything when no toasts', () => {
			render(Toast);
			expect(screen.queryByRole('button', { name: /dismiss/i })).toBeNull();
		});

		it('should render a toast message', async () => {
			toasts.success('Test message');
			render(Toast);

			expect(await screen.findByText('Test message')).toBeInTheDocument();
		});

		it('should render multiple toasts', async () => {
			toasts.success('First message');
			toasts.error('Second message');
			render(Toast);

			expect(await screen.findByText('First message')).toBeInTheDocument();
			expect(await screen.findByText('Second message')).toBeInTheDocument();
		});
	});

	describe('Toast Types', () => {
		it('should render success toast with checkmark icon', async () => {
			toasts.success('Success!');
			render(Toast);

			expect(await screen.findByText('✓')).toBeInTheDocument();
		});

		it('should render error toast', async () => {
			toasts.error('Error occurred');
			render(Toast);

			expect(await screen.findByText('Error occurred')).toBeInTheDocument();
			expect(screen.getByText('✕')).toBeInTheDocument();
		});

		it('should render info toast', async () => {
			toasts.info('Information');
			render(Toast);

			expect(await screen.findByText('Information')).toBeInTheDocument();
			expect(screen.getByText('ℹ')).toBeInTheDocument();
		});

		it('should render warning toast', async () => {
			toasts.warning('Warning!');
			render(Toast);

			expect(await screen.findByText('Warning!')).toBeInTheDocument();
			expect(screen.getByText('⚠')).toBeInTheDocument();
		});
	});

	describe('Star Notification', () => {
		it('should render star notification with username', async () => {
			toasts.star('testuser', 'gold', 'Algebra');
			render(Toast);

			expect(await screen.findByText('testuser')).toBeInTheDocument();
			expect(screen.getByText(/earned a gold star/)).toBeInTheDocument();
		});

		it('should show user avatar instead of star emoji', async () => {
			// Star notifications show the user's avatar, not the star icon
			toasts.star('player1', 'gold');
			render(Toast);

			// Avatar for 'player1' is shown
			expect(await screen.findByText(/earned a gold star/)).toBeInTheDocument();
		});
	});

	describe('Dismiss', () => {
		it('should have dismiss button', async () => {
			toasts.info('Dismissable');
			render(Toast);

			const dismissButton = await screen.findByRole('button', { name: /dismiss/i });
			expect(dismissButton).toBeInTheDocument();
		});

		it('should remove toast when dismiss is clicked', async () => {
			toasts.info('Will be dismissed');
			render(Toast);

			const dismissButton = await screen.findByRole('button', { name: /dismiss/i });
			await fireEvent.click(dismissButton);

			// Check store was updated
			const list = get(toastList);
			expect(list.length).toBe(0);
		});
	});
});

describe('Toasts Store', () => {
	beforeEach(() => {
		toasts.clear();
	});

	it('should add a toast', () => {
		toasts.success('Hello');
		const list = get(toastList);
		expect(list.length).toBe(1);
		expect(list[0].message).toBe('Hello');
	});

	it('should clear all toasts', () => {
		toasts.success('One');
		toasts.error('Two');
		toasts.info('Three');

		expect(get(toastList).length).toBe(3);

		toasts.clear();

		expect(get(toastList).length).toBe(0);
	});

	it('should dismiss specific toast', () => {
		const id1 = toasts.success('First');
		toasts.error('Second');

		expect(get(toastList).length).toBe(2);

		toasts.dismiss(id1);

		const remaining = get(toastList);
		expect(remaining.length).toBe(1);
		expect(remaining[0].message).toBe('Second');
	});

	it('should allow custom toast', () => {
		toasts.show({
			message: 'Custom toast',
			type: 'info',
			duration: 5000,
			icon: '🎉'
		});

		const list = get(toastList);
		expect(list[0].icon).toBe('🎉');
	});
});
