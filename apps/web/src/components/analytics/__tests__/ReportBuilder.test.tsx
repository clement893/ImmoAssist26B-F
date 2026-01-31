/**
 * ReportBuilder Component Tests
 *
 * Comprehensive test suite for the ReportBuilder component covering:
 * - Form rendering
 * - Field selection
 * - Date range selection
 * - Format selection
 * - Save/preview actions
 * - Validation
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import ReportBuilder, { type ReportField, type ReportConfig } from '../ReportBuilder';

describe('ReportBuilder Component', () => {
  const mockFields: ReportField[] = [
    { id: 'revenue', name: 'Revenue', type: 'metric', selected: false },
    { id: 'users', name: 'Active Users', type: 'metric', selected: false },
    { id: 'date', name: 'Date', type: 'date', selected: false },
  ];

  const mockOnSave = vi.fn();
  const mockOnPreview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form fields', () => {
      render(
        <ReportBuilder availableFields={mockFields} onSave={mockOnSave} onPreview={mockOnPreview} />
      );
      expect(screen.getByLabelText(/report name/i)).toBeInTheDocument();
      expect(screen.getByText(/revenue/i)).toBeInTheDocument();
      expect(screen.getByText(/active users/i)).toBeInTheDocument();
    });

    it('renders date range inputs', () => {
      render(<ReportBuilder availableFields={mockFields} onSave={mockOnSave} />);
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    });

    it('renders format selector', () => {
      render(<ReportBuilder availableFields={mockFields} onSave={mockOnSave} />);
      expect(screen.getByLabelText(/format/i)).toBeInTheDocument();
    });
  });

  describe('Field Selection', () => {
    it('toggles field selection', async () => {
      const user = userEvent.setup();
      render(<ReportBuilder availableFields={mockFields} onSave={mockOnSave} />);
      const revenueCheckbox = screen.getByLabelText(/revenue/i);
      await user.click(revenueCheckbox);
      expect(revenueCheckbox).toBeChecked();
    });

    it('allows multiple field selection', async () => {
      const user = userEvent.setup();
      render(<ReportBuilder availableFields={mockFields} onSave={mockOnSave} />);
      const revenueCheckbox = screen.getByLabelText(/revenue/i);
      const usersCheckbox = screen.getByLabelText(/active users/i);
      await user.click(revenueCheckbox);
      await user.click(usersCheckbox);
      expect(revenueCheckbox).toBeChecked();
      expect(usersCheckbox).toBeChecked();
    });
  });

  describe('Form Submission', () => {
    it('calls onSave with report config', async () => {
      const user = userEvent.setup();
      render(<ReportBuilder availableFields={mockFields} onSave={mockOnSave} />);
      const nameInput = screen.getByLabelText(/report name/i);
      await user.type(nameInput, 'My Report');

      const revenueCheckbox = screen.getByLabelText(/revenue/i);
      await user.click(revenueCheckbox);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('calls onPreview with report config', async () => {
      const user = userEvent.setup();
      render(<ReportBuilder availableFields={mockFields} onPreview={mockOnPreview} />);
      const nameInput = screen.getByLabelText(/report name/i);
      await user.type(nameInput, 'My Report');

      const revenueCheckbox = screen.getByLabelText(/revenue/i);
      await user.click(revenueCheckbox);

      const previewButton = screen.getByRole('button', { name: /preview/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(mockOnPreview).toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    it('prevents save without report name', async () => {
      const user = userEvent.setup();
      render(<ReportBuilder availableFields={mockFields} onSave={mockOnSave} />);
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      // Should not call onSave
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('prevents save without selected fields', async () => {
      const user = userEvent.setup();
      render(<ReportBuilder availableFields={mockFields} onSave={mockOnSave} />);
      const nameInput = screen.getByLabelText(/report name/i);
      await user.type(nameInput, 'My Report');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);
      // Should not call onSave
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <ReportBuilder availableFields={mockFields} onSave={mockOnSave} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
