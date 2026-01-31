/**
 * NotificationSettings Component Tests
 *
 * Comprehensive test suite for the NotificationSettings component covering:
 * - Form rendering
 * - Notification types
 * - Email/push/in-app settings
 * - Frequency selection
 * - Form submission
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import NotificationSettings, { type NotificationSettingsData } from '../NotificationSettings';

describe('NotificationSettings Component', () => {
  const mockSettings: NotificationSettingsData = {
    email: {
      enabled: true,
      frequency: 'instant',
      types: {
        marketing: true,
        product: true,
        security: true,
        billing: true,
        system: true,
      },
    },
    push: {
      enabled: true,
      types: {
        marketing: false,
        product: true,
        security: true,
        billing: false,
        system: true,
      },
    },
    inApp: {
      enabled: true,
      types: {
        marketing: false,
        product: true,
        security: true,
        billing: true,
        system: true,
      },
    },
  };

  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders email notification settings', () => {
      render(<NotificationSettings settings={mockSettings} onSave={mockOnSave} />);
      expect(screen.getByText(/email notifications/i)).toBeInTheDocument();
    });

    it('renders push notification settings', () => {
      render(<NotificationSettings settings={mockSettings} onSave={mockOnSave} />);
      expect(screen.getByText(/push notifications/i)).toBeInTheDocument();
    });

    it('renders in-app notification settings', () => {
      render(<NotificationSettings settings={mockSettings} onSave={mockOnSave} />);
      expect(screen.getByText(/in-app notifications/i)).toBeInTheDocument();
    });
  });

  describe('Toggle Switches', () => {
    it('toggles email notifications', async () => {
      const user = userEvent.setup();
      render(<NotificationSettings settings={mockSettings} onSave={mockOnSave} />);
      const toggle = screen.getByLabelText(/enable email notifications/i);
      await user.click(toggle);
      expect(toggle).not.toBeChecked();
    });

    it('toggles push notifications', async () => {
      const user = userEvent.setup();
      render(<NotificationSettings settings={mockSettings} onSave={mockOnSave} />);
      const toggle = screen.getByLabelText(/enable push notifications/i);
      await user.click(toggle);
      expect(toggle).not.toBeChecked();
    });
  });

  describe('Frequency Selection', () => {
    it('updates email frequency', async () => {
      const user = userEvent.setup();
      render(<NotificationSettings settings={mockSettings} onSave={mockOnSave} />);
      const frequencySelect = screen.getByLabelText(/email frequency/i);
      await user.selectOptions(frequencySelect, 'daily');
      expect(frequencySelect).toHaveValue('daily');
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with form data', async () => {
      const user = userEvent.setup();
      render(<NotificationSettings settings={mockSettings} onSave={mockOnSave} />);
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing settings', () => {
      render(<NotificationSettings onSave={mockOnSave} />);
      expect(screen.getByText(/email notifications/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <NotificationSettings settings={mockSettings} onSave={mockOnSave} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
