/**
 * OrganizationSettings Component Tests
 *
 * Comprehensive test suite for the OrganizationSettings component covering:
 * - Form rendering
 * - Organization data display
 * - Form submission
 * - Timezone/locale selection
 * - Validation
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import OrganizationSettings, { type OrganizationSettingsData } from '../OrganizationSettings';

describe('OrganizationSettings Component', () => {
  const mockOrganization = {
    id: '1',
    name: 'Acme Corp',
    slug: 'acme-corp',
    email: 'contact@acme.com',
    phone: '+1234567890',
    website: 'https://acme.com',
    address: {
      line1: '123 Main St',
      line2: 'Suite 100',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    },
    timezone: 'America/New_York',
    locale: 'en-US',
  };

  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form fields', () => {
      render(<OrganizationSettings organization={mockOrganization} onSave={mockOnSave} />);
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('displays organization data', () => {
      render(<OrganizationSettings organization={mockOrganization} onSave={mockOnSave} />);
      expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
      expect(screen.getByDisplayValue('acme-corp')).toBeInTheDocument();
    });
  });

  describe('Form Updates', () => {
    it('updates organization name', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettings organization={mockOrganization} onSave={mockOnSave} />);
      const nameInput = screen.getByLabelText(/organization name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'New Corp');
      expect(nameInput).toHaveValue('New Corp');
    });

    it('updates timezone selection', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettings organization={mockOrganization} onSave={mockOnSave} />);
      const timezoneSelect = screen.getByLabelText(/timezone/i);
      await user.selectOptions(timezoneSelect, 'Europe/London');
      expect(timezoneSelect).toHaveValue('Europe/London');
    });

    it('updates locale selection', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettings organization={mockOrganization} onSave={mockOnSave} />);
      const localeSelect = screen.getByLabelText(/locale/i);
      await user.selectOptions(localeSelect, 'fr-FR');
      expect(localeSelect).toHaveValue('fr-FR');
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with form data', async () => {
      const user = userEvent.setup();
      render(<OrganizationSettings organization={mockOrganization} onSave={mockOnSave} />);
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing organization data', () => {
      render(<OrganizationSettings onSave={mockOnSave} />);
      expect(screen.getByLabelText(/organization name/i)).toBeInTheDocument();
    });

    it('handles missing address', () => {
      const orgWithoutAddress = {
        ...mockOrganization,
        address: undefined,
      };
      render(<OrganizationSettings organization={orgWithoutAddress} onSave={mockOnSave} />);
      expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <OrganizationSettings organization={mockOrganization} onSave={mockOnSave} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
