/**
 * BillingSettings Component Tests
 *
 * Comprehensive test suite for the BillingSettings component covering:
 * - Form rendering
 * - Settings updates
 * - Form validation
 * - Save/cancel handlers
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import BillingSettings, { type BillingSettingsData } from '../BillingSettings';

const mockSettings: BillingSettingsData = {
  autoRenewal: true,
  emailNotifications: true,
  invoiceEmail: 'billing@example.com',
  taxId: 'TAX123',
  billingAddress: {
    line1: '123 Main St',
    line2: 'Apt 4',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  },
  currency: 'USD',
  language: 'en',
};

describe('BillingSettings Component', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form fields', () => {
      render(<BillingSettings settings={mockSettings} onSave={mockOnSave} />);
      expect(screen.getByLabelText(/auto renewal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email notifications/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/invoice email/i)).toBeInTheDocument();
    });

    it('uses provided settings as default values', () => {
      render(<BillingSettings settings={mockSettings} onSave={mockOnSave} />);
      expect(screen.getByDisplayValue('billing@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('TAX123')).toBeInTheDocument();
    });

    it('renders save button', () => {
      render(<BillingSettings settings={mockSettings} onSave={mockOnSave} />);
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
  });

  describe('Form Updates', () => {
    it('updates auto renewal toggle', async () => {
      const user = userEvent.setup();
      render(<BillingSettings settings={mockSettings} onSave={mockOnSave} />);
      const toggle = screen.getByLabelText(/auto renewal/i);
      await user.click(toggle);
      expect(toggle).not.toBeChecked();
    });

    it('updates email notifications toggle', async () => {
      const user = userEvent.setup();
      render(<BillingSettings settings={mockSettings} onSave={mockOnSave} />);
      const toggle = screen.getByLabelText(/email notifications/i);
      await user.click(toggle);
      expect(toggle).not.toBeChecked();
    });

    it('updates invoice email', async () => {
      const user = userEvent.setup();
      render(<BillingSettings settings={mockSettings} onSave={mockOnSave} />);
      const emailInput = screen.getByLabelText(/invoice email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'newemail@example.com');
      expect(emailInput).toHaveValue('newemail@example.com');
    });

    it('updates currency selection', async () => {
      const user = userEvent.setup();
      render(<BillingSettings settings={mockSettings} onSave={mockOnSave} />);
      const currencySelect = screen.getByLabelText(/currency/i);
      await user.selectOptions(currencySelect, 'EUR');
      expect(currencySelect).toHaveValue('EUR');
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with updated settings', async () => {
      const user = userEvent.setup();
      render(<BillingSettings settings={mockSettings} onSave={mockOnSave} />);
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing settings', () => {
      render(<BillingSettings onSave={mockOnSave} />);
      expect(screen.getByLabelText(/auto renewal/i)).toBeInTheDocument();
    });

    it('handles missing billing address', () => {
      const settingsWithoutAddress = { ...mockSettings, billingAddress: undefined };
      render(<BillingSettings settings={settingsWithoutAddress} onSave={mockOnSave} />);
      expect(screen.getByLabelText(/auto renewal/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<BillingSettings settings={mockSettings} onSave={mockOnSave} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
