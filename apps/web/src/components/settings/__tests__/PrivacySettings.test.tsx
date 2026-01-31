/**
 * PrivacySettings Component Tests
 *
 * Comprehensive test suite for the PrivacySettings component covering:
 * - Form rendering
 * - Privacy preferences
 * - Profile visibility
 * - Data export
 * - Account deletion
 * - Form submission
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import PrivacySettings, { type PrivacySettingsData } from '../PrivacySettings';

describe('PrivacySettings Component', () => {
  const mockSettings: PrivacySettingsData = {
    profileVisibility: 'private',
    showEmail: false,
    showPhone: false,
    allowDataCollection: true,
    allowAnalytics: true,
    allowMarketing: false,
  };

  const mockOnSave = vi.fn();
  const mockOnExportData = vi.fn();
  const mockOnDeleteAccount = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    window.confirm = vi.fn(() => true);
  });

  describe('Rendering', () => {
    it('renders profile visibility settings', () => {
      render(<PrivacySettings settings={mockSettings} onSave={mockOnSave} />);
      expect(screen.getByText(/profile visibility/i)).toBeInTheDocument();
    });

    it('renders privacy toggles', () => {
      render(<PrivacySettings settings={mockSettings} onSave={mockOnSave} />);
      expect(screen.getByText(/show email/i)).toBeInTheDocument();
      expect(screen.getByText(/show phone/i)).toBeInTheDocument();
    });
  });

  describe('Form Updates', () => {
    it('updates profile visibility', async () => {
      const user = userEvent.setup();
      render(<PrivacySettings settings={mockSettings} onSave={mockOnSave} />);
      const visibilitySelect = screen.getByLabelText(/who can see your profile/i);
      await user.selectOptions(visibilitySelect, 'public');
      expect(visibilitySelect).toHaveValue('public');
    });

    it('toggles show email', async () => {
      const user = userEvent.setup();
      render(<PrivacySettings settings={mockSettings} onSave={mockOnSave} />);
      const toggle = screen.getByLabelText(/show email/i);
      await user.click(toggle);
      expect(toggle).toBeChecked();
    });
  });

  describe('Data Export', () => {
    it('calls onExportData when export button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PrivacySettings
          settings={mockSettings}
          onSave={mockOnSave}
          onExportData={mockOnExportData}
        />
      );
      const exportButton = screen.getByText(/export data/i);
      await user.click(exportButton);
      await waitFor(() => {
        expect(mockOnExportData).toHaveBeenCalled();
      });
    });
  });

  describe('Account Deletion', () => {
    it('opens delete modal when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PrivacySettings
          settings={mockSettings}
          onSave={mockOnSave}
          onDeleteAccount={mockOnDeleteAccount}
        />
      );
      const deleteButton = screen.getByText(/delete account/i);
      await user.click(deleteButton);
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    it('calls onDeleteAccount when confirmed', async () => {
      const user = userEvent.setup();
      render(
        <PrivacySettings
          settings={mockSettings}
          onSave={mockOnSave}
          onDeleteAccount={mockOnDeleteAccount}
        />
      );
      const deleteButton = screen.getByText(/delete account/i);
      await user.click(deleteButton);
      const confirmButton = screen.getByRole('button', { name: /delete/i });
      await user.click(confirmButton);
      await waitFor(() => {
        expect(mockOnDeleteAccount).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with form data', async () => {
      const user = userEvent.setup();
      render(<PrivacySettings settings={mockSettings} onSave={mockOnSave} />);
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<PrivacySettings settings={mockSettings} onSave={mockOnSave} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
