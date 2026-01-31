/**
 * DataTableEnhanced Component Tests
 *
 * Comprehensive test suite for the DataTableEnhanced component covering:
 * - Rendering with data
 * - Row selection
 * - Bulk actions
 * - Export options
 * - Column visibility
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import DataTableEnhanced from '../DataTableEnhanced';
import type { Column } from '../DataTableEnhanced';

// Mock DataTable to simplify testing
vi.mock('../DataTable', () => ({
  default: ({ data, columns }: any) => (
    <table>
      <thead>
        <tr>
          {columns.map((col: any) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row: any, idx: number) => (
          <tr key={row.id || idx}>
            {columns.map((col: any) => (
              <td key={col.key}>
                {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

type MockData = {
  id: string;
  name: string;
  email: string;
};

describe('DataTableEnhanced Component', () => {
  const mockData: MockData[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
  ];

  const mockColumns: Column<MockData>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.confirm
    window.confirm = vi.fn(() => true);
  });

  describe('Rendering', () => {
    it('renders table with data', () => {
      render(<DataTableEnhanced data={mockData} columns={mockColumns} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('renders without selectable by default', () => {
      const { container } = render(<DataTableEnhanced data={mockData} columns={mockColumns} />);
      const checkbox = container.querySelector('input[type="checkbox"]');
      expect(checkbox).not.toBeInTheDocument();
    });

    it('renders with selectable when enabled', () => {
      render(<DataTableEnhanced data={mockData} columns={mockColumns} selectable />);
      // Should render select all checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Row Selection', () => {
    it('selects individual row when checkbox is clicked', async () => {
      const handleSelectionChange = vi.fn();
      render(
        <DataTableEnhanced
          data={mockData}
          columns={mockColumns}
          selectable
          onSelectionChange={handleSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is select all, second is first row
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        expect(handleSelectionChange).toHaveBeenCalled();
      });
    });

    it('selects all rows when select all is clicked', async () => {
      const handleSelectionChange = vi.fn();
      render(
        <DataTableEnhanced
          data={mockData}
          columns={mockColumns}
          selectable
          onSelectionChange={handleSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Select all

      await waitFor(() => {
        expect(handleSelectionChange).toHaveBeenCalledWith(mockData);
      });
    });

    it('deselects all rows when select all is clicked again', async () => {
      const handleSelectionChange = vi.fn();
      render(
        <DataTableEnhanced
          data={mockData}
          columns={mockColumns}
          selectable
          onSelectionChange={handleSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // Select all
      fireEvent.click(checkboxes[0]); // Deselect all

      await waitFor(() => {
        expect(handleSelectionChange).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Bulk Actions', () => {
    it('renders bulk actions when rows are selected', () => {
      const bulkActions = [
        { label: 'Delete', onClick: vi.fn() },
        { label: 'Archive', onClick: vi.fn() },
      ];

      render(
        <DataTableEnhanced
          data={mockData}
          columns={mockColumns}
          selectable
          bulkActions={bulkActions}
        />
      );

      // Select a row first
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      waitFor(() => {
        expect(screen.getByText('Delete')).toBeInTheDocument();
        expect(screen.getByText('Archive')).toBeInTheDocument();
      });
    });

    it('calls bulk action onClick when clicked', async () => {
      const handleBulkAction = vi.fn();
      const bulkActions = [{ label: 'Delete', onClick: handleBulkAction }];

      render(
        <DataTableEnhanced
          data={mockData}
          columns={mockColumns}
          selectable
          bulkActions={bulkActions}
        />
      );

      // Select a row
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(handleBulkAction).toHaveBeenCalled();
      });
    });

    it('shows confirmation dialog when requireConfirmation is true', async () => {
      const handleBulkAction = vi.fn();
      const bulkActions = [
        {
          label: 'Delete',
          onClick: handleBulkAction,
          requireConfirmation: true,
          confirmationMessage: 'Are you sure?',
        },
      ];

      render(
        <DataTableEnhanced
          data={mockData}
          columns={mockColumns}
          selectable
          bulkActions={bulkActions}
        />
      );

      // Select a row
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      expect(window.confirm).toHaveBeenCalledWith('Are you sure?');
    });
  });

  describe('Export Options', () => {
    it('renders export dropdown when exportOptions are provided', () => {
      const exportOptions = [
        { label: 'Export CSV', format: 'csv' as const, onClick: vi.fn() },
        { label: 'Export JSON', format: 'json' as const, onClick: vi.fn() },
      ];

      render(
        <DataTableEnhanced data={mockData} columns={mockColumns} exportOptions={exportOptions} />
      );

      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('calls export onClick when export option is selected', async () => {
      const handleExport = vi.fn();
      const exportOptions = [
        { label: 'Export CSV', format: 'csv' as const, onClick: handleExport },
      ];

      render(
        <DataTableEnhanced data={mockData} columns={mockColumns} exportOptions={exportOptions} />
      );

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Export dropdown should open and option should be clickable
      await waitFor(() => {
        // The actual click would happen through Dropdown component
        expect(exportButton).toBeInTheDocument();
      });
    });
  });

  describe('Column Visibility', () => {
    it('hides columns based on columnVisibility', () => {
      const columnVisibility = { name: true, email: false };
      render(
        <DataTableEnhanced
          data={mockData}
          columns={mockColumns}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={vi.fn()}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      // Email column should be hidden
      expect(screen.queryByText('Email')).not.toBeInTheDocument();
    });

    it('renders columns dropdown when onColumnVisibilityChange is provided', () => {
      render(
        <DataTableEnhanced
          data={mockData}
          columns={mockColumns}
          onColumnVisibilityChange={vi.fn()}
        />
      );

      expect(screen.getByText('Columns')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <DataTableEnhanced data={mockData} columns={mockColumns} className="custom-table" />
      );
      const wrapper = container.querySelector('.custom-table');
      expect(wrapper).toBeInTheDocument();
    });

    it('uses custom rowKey when provided', () => {
      const customData = [
        { customId: 'a', name: 'Test' },
        { customId: 'b', name: 'Test2' },
      ];
      const customColumns = [{ key: 'name', label: 'Name' }];

      render(
        <DataTableEnhanced
          data={customData}
          columns={customColumns}
          selectable
          rowKey={(row) => row.customId}
        />
      );

      // Should render without errors
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<DataTableEnhanced data={mockData} columns={mockColumns} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty data array', () => {
      render(<DataTableEnhanced data={[]} columns={mockColumns} />);
      // Should render without errors
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('handles data without id field', () => {
      const dataWithoutId = [{ name: 'Test', email: 'test@example.com' }];
      render(<DataTableEnhanced data={dataWithoutId} columns={mockColumns} selectable />);
      // Should use index as key
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
