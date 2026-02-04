/**
 * Component tests for SettingsModal
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';

// Import setup for mocks
import './setup';

// Import stores and component
import { settings, user } from '$lib/stores';
import SettingsModal from '$lib/components/modals/SettingsModal.svelte';

describe('SettingsModal Component', () => {
	beforeEach(() => {
		settings.reset();
		user.reset();
	});

	describe('Rendering', () => {
		it('should not render when closed', () => {
			render(SettingsModal, { props: { open: false } });
			expect(screen.queryByRole('dialog')).toBeNull();
		});

		it('should render when open', async () => {
			render(SettingsModal, { props: { open: true } });
			expect(await screen.findByRole('dialog')).toBeInTheDocument();
		});

		it('should display Settings title', async () => {
			render(SettingsModal, { props: { open: true } });
			expect(await screen.findByText('Settings')).toBeInTheDocument();
		});

		it('should show all setting options', async () => {
			render(SettingsModal, { props: { open: true } });

			expect(await screen.findByText('Sound Effects')).toBeInTheDocument();
			expect(screen.getByText('Notifications')).toBeInTheDocument();
			expect(screen.getByText('Peer-to-Peer Mode')).toBeInTheDocument();
			expect(screen.getByText('Reduced Motion')).toBeInTheDocument();
			expect(screen.getByText('Teacher Mode')).toBeInTheDocument();
		});

		it('should have close button', async () => {
			render(SettingsModal, { props: { open: true } });
			expect(await screen.findByRole('button', { name: /close settings/i })).toBeInTheDocument();
		});

		it('should have reset progress button', async () => {
			render(SettingsModal, { props: { open: true } });
			expect(await screen.findByRole('button', { name: /reset all progress/i })).toBeInTheDocument();
		});
	});

	describe('Settings Checkboxes', () => {
		it('should have sound enabled checkbox checked by default', async () => {
			render(SettingsModal, { props: { open: true } });

			const checkboxes = await screen.findAllByRole('checkbox');
			// Sound is first checkbox and enabled by default
			expect(checkboxes[0]).toBeChecked();
		});

		it('should have P2P checkbox unchecked by default', async () => {
			render(SettingsModal, { props: { open: true } });

			const checkboxes = await screen.findAllByRole('checkbox');
			// P2P is third checkbox (after Sound and Notifications)
			expect(checkboxes[2]).not.toBeChecked();
		});

		it('should toggle sound setting on click', async () => {
			render(SettingsModal, { props: { open: true } });

			const checkboxes = await screen.findAllByRole('checkbox');
			const soundCheckbox = checkboxes[0];

			expect(get(settings).soundEnabled).toBe(true);

			await fireEvent.click(soundCheckbox);

			expect(get(settings).soundEnabled).toBe(false);
		});

		it('should toggle notifications setting on click', async () => {
			render(SettingsModal, { props: { open: true } });

			const checkboxes = await screen.findAllByRole('checkbox');
			const notificationsCheckbox = checkboxes[1];

			expect(get(settings).showNotifications).toBe(true);

			await fireEvent.click(notificationsCheckbox);

			expect(get(settings).showNotifications).toBe(false);
		});

		it('should toggle P2P setting on click', async () => {
			render(SettingsModal, { props: { open: true } });

			const checkboxes = await screen.findAllByRole('checkbox');
			const p2pCheckbox = checkboxes[2];

			expect(get(settings).p2pEnabled).toBe(false);

			await fireEvent.click(p2pCheckbox);

			expect(get(settings).p2pEnabled).toBe(true);
		});

		it('should toggle teacher mode on click', async () => {
			render(SettingsModal, { props: { open: true } });

			const checkboxes = await screen.findAllByRole('checkbox');
			const teacherCheckbox = checkboxes[4]; // Last checkbox

			expect(get(user).isTeacher).toBe(false);

			await fireEvent.click(teacherCheckbox);

			expect(get(user).isTeacher).toBe(true);
		});
	});

	describe('Close Behavior', () => {
		it('should call onClose when close button clicked', async () => {
			const onClose = vi.fn();
			render(SettingsModal, { props: { open: true, onClose } });

			const closeButton = await screen.findByRole('button', { name: /close settings/i });
			await fireEvent.click(closeButton);

			expect(onClose).toHaveBeenCalled();
		});

		it('should call onClose when backdrop clicked', async () => {
			const onClose = vi.fn();
			render(SettingsModal, { props: { open: true, onClose } });

			const dialog = await screen.findByRole('dialog');
			await fireEvent.click(dialog);

			expect(onClose).toHaveBeenCalled();
		});
	});

	describe('Version Display', () => {
		it('should display version number', async () => {
			render(SettingsModal, { props: { open: true } });
			expect(await screen.findByText(/Driller v5\.0\.0/)).toBeInTheDocument();
		});
	});
});
