/**
 * DataExport Component Tests
 *
 * Comprehensive test suite for the DataExport component covering:
 * - Field selection
 * - Format selection
 * - Select all functionality
 * - Export action
 * - Validation
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import DataExport, { type ExportField, type ExportConfig } from '../DataExport';

describe('DataExport Component', () => {
  const mockFields: ExportField[] = [
    { id: 'id', name: 'ID', selected: true },
    { id: 'name', name: 'Name', selected: true },
    { id: 'email', name: 'Email', selected: false },
  ];

  const mockOnExport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders field checkboxes', () => {
      render(<DataExport fields={mockFields} onExport={mockOnExport} />);
      expect(screen.getByLabelText(/id/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('renders format selector', () => {
      render(<DataExport fields={mockFields} onExport={mockOnExport} />);
      expect(screen.getByLabelText(/format/i)).toBeInTheDocument();
    });

    it('renders include headers checkbox', () => {
      render(<DataExport fields={mockFields} onExport={mockOnExport} />);
      expect(screen.getByLabelText(/include headers/i)).toBeInTheDocument();
    });
  });

  describe('Field Selection', () => {
    it('toggles field selection', async () => {
      const user = userEvent.setup();
      render(<DataExport fields={mockFields} onExport={mockOnExport} />);
      const emailCheckbox = screen.getByLabelText(/email/i);
      await user.click(emailCheckbox);
      expect(emailCheckbox).toBeChecked();
    });

    it('selects all fields when select all is clicked', async () => {
      const user = userEvent.setup();
      render(<DataExport fields={mockFields} onExport={mockOnExport} />);
      const selectAllButton = screen.getByText(/select all/i);
      await user.click(selectAllButton);
      const emailCheckbox = screen.getByLabelText(/email/i);
      expect(emailCheckbox).toBeChecked();
    });
  });

  describe('Format Selection', () => {
    it('updates format selection', async () => {
      const user = userEvent.setup();
      render(<DataExport fields={mockFields} onExport={mockOnExport} />);
      const formatSelect = screen.getByLabelText(/format/i);
      await user.selectOptions(formatSelect, 'json');
      expect(formatSelect).toHaveValue('json');
    });
  });

  describe('Export Action', () => {
    it('calls onExport with export config', async () => {
      const user = userEvent.setup();
      render(<DataExport fields={mockFields} onExport={mockOnExport} />);
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalled();
      });
    });

    it('prevents export without selected fields', async () => {
      const user = userEvent.setup();
      const fieldsNoneSelected = mockFields.map((f) => ({ ...f, selected: false }));
      render(<DataExport fields={fieldsNoneSelected} onExport={mockOnExport} />);
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);
      // Should not call onExport
      expect(mockOnExport).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles default fields when none provided', () => {
      render(<DataExport onExport={mockOnExport} />);
      expect(screen.getByLabelText(/id/i)).toBeInTheDocument();
    });

    it('handles date range selection', async () => {
      const user = userEvent.setup();
      render(<DataExport fields={mockFields} onExport={mockOnExport} />);
      const startDateInput = screen.getByLabelText(/start date/i);
      if (startDateInput) {
        await user.type(startDateInput, '2024-01-01');
        expect(startDateInput).toHaveValue('2024-01-01');
      }
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<DataExport fields={mockFields} onExport={mockOnExport} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
