/**
 * SecuritySettings Component Tests
 *
 * Comprehensive test suite for the SecuritySettings component covering:
 * - Form rendering
 * - Settings display
 * - Toggle switches
 * - 2FA enable/disable
 * - Password change
 * - Form submission
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import SecuritySettings, { type SecuritySettingsData } from '../SecuritySettings';

describe('SecuritySettings Component', () => {
  const mockSettings: SecuritySettingsData = {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    requireStrongPassword: true,
    loginNotifications: true,
    suspiciousActivityAlerts: true,
  };

  const mockOnSave = vi.fn();
  const mockOnEnable2FA = vi.fn();
  const mockOnDisable2FA = vi.fn();
  const mockOnChangePassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form fields', () => {
      render(
        <SecuritySettings
          settings={mockSettings}
          onSave={mockOnSave}
          onEnable2FA={mockOnEnable2FA}
          onDisable2FA={mockOnDisable2FA}
          onChangePassword={mockOnChangePassword}
        />
      );
      expect(screen.getByText(/password/i)).toBeInTheDocument();
      expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
    });

    it('displays current settings', () => {
      render(<SecuritySettings settings={mockSettings} onSave={mockOnSave} />);
      expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument();
    });
  });

  describe('Toggle Switches', () => {
    it('toggles require strong password', async () => {
      const user = userEvent.setup();
      render(<SecuritySettings settings={mockSettings} onSave={mockOnSave} />);
      const toggle = screen.getByLabelText(/require strong password/i);
      await user.click(toggle);
      expect(toggle).not.toBeChecked();
    });

    it('toggles login notifications', async () => {
      const user = userEvent.setup();
      render(<SecuritySettings settings={mockSettings} onSave={mockOnSave} />);
      const toggle = screen.getByLabelText(/login notifications/i);
      await user.click(toggle);
      expect(toggle).not.toBeChecked();
    });
  });

  describe('2FA Actions', () => {
    it('calls onEnable2FA when enabling 2FA', async () => {
      const user = userEvent.setup();
      render(
        <SecuritySettings
          settings={mockSettings}
          onSave={mockOnSave}
          onEnable2FA={mockOnEnable2FA}
        />
      );
      const enableButton = screen.getByText(/enable/i);
      await user.click(enableButton);
      await waitFor(() => {
        expect(mockOnEnable2FA).toHaveBeenCalled();
      });
    });

    it('calls onDisable2FA when disabling 2FA', async () => {
      const user = userEvent.setup();
      const settingsWith2FA = { ...mockSettings, twoFactorEnabled: true };
      render(
        <SecuritySettings
          settings={settingsWith2FA}
          onSave={mockOnSave}
          onDisable2FA={mockOnDisable2FA}
        />
      );
      const disableButton = screen.getByText(/disable/i);
      await user.click(disableButton);
      await waitFor(() => {
        expect(mockOnDisable2FA).toHaveBeenCalled();
      });
    });
  });

  describe('Password Change', () => {
    it('calls onChangePassword when change password button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <SecuritySettings
          settings={mockSettings}
          onSave={mockOnSave}
          onChangePassword={mockOnChangePassword}
        />
      );
      const changePasswordButton = screen.getByText(/change password/i);
      await user.click(changePasswordButton);
      expect(mockOnChangePassword).toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with form data', async () => {
      const user = userEvent.setup();
      render(<SecuritySettings settings={mockSettings} onSave={mockOnSave} />);
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <SecuritySettings settings={mockSettings} onSave={mockOnSave} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
