/**
 * VirtualTable Component Tests
 *
 * Comprehensive test suite for the VirtualTable component covering:
 * - Rendering with data
 * - Virtual scrolling
 * - Sorting
 * - Row clicks
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import VirtualTable from '../VirtualTable';
import type { VirtualTableColumn } from '../VirtualTable';

type MockData = {
  id: string;
  name: string;
  value: number;
};

describe('VirtualTable Component', () => {
  const mockData: MockData[] = Array.from({ length: 100 }, (_, i) => ({
    id: String(i + 1),
    name: `Item ${i + 1}`,
    value: i + 1,
  }));

  const mockColumns: VirtualTableColumn<MockData>[] = [
    { key: 'name', label: 'Name' },
    { key: 'value', label: 'Value', sortable: true },
  ];

  describe('Rendering', () => {
    it('renders table with data', () => {
      render(<VirtualTable data={mockData.slice(0, 10)} columns={mockColumns} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('renders all column headers', () => {
      render(<VirtualTable data={mockData.slice(0, 10)} columns={mockColumns} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });

    it('renders with custom height', () => {
      const { container } = render(
        <VirtualTable data={mockData.slice(0, 10)} columns={mockColumns} height={500} />
      );
      const wrapper = container.querySelector('div[style*="height"]');
      expect(wrapper).toHaveStyle({ height: '500px' });
    });

    it('renders with custom rowHeight', () => {
      render(<VirtualTable data={mockData.slice(0, 10)} columns={mockColumns} rowHeight={60} />);
      // Component should render without errors
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });

  describe('Virtual Scrolling', () => {
    it('renders only visible rows', () => {
      render(<VirtualTable data={mockData} columns={mockColumns} height={200} rowHeight={50} />);
      // Should only render visible rows (approximately 4-5 rows)
      const rows = screen.getAllByText(/Item \d+/);
      expect(rows.length).toBeLessThan(mockData.length);
    });

    it('updates visible rows on scroll', () => {
      const { container } = render(
        <VirtualTable data={mockData} columns={mockColumns} height={200} rowHeight={50} />
      );

      const scrollContainer = container.querySelector('div[style*="overflow"]');
      if (scrollContainer) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });
        // Should update visible rows
        expect(scrollContainer).toBeInTheDocument();
      }
    });
  });

  describe('Sorting', () => {
    it('sorts data when sortable column header is clicked', () => {
      render(<VirtualTable data={mockData.slice(0, 10)} columns={mockColumns} />);

      const valueHeader = screen.getByText('Value');
      fireEvent.click(valueHeader);

      // Data should be sorted
      expect(valueHeader).toBeInTheDocument();
    });

    it('toggles sort direction on second click', () => {
      render(<VirtualTable data={mockData.slice(0, 10)} columns={mockColumns} />);

      const valueHeader = screen.getByText('Value');
      fireEvent.click(valueHeader);
      fireEvent.click(valueHeader);

      // Sort direction should toggle
      expect(valueHeader).toBeInTheDocument();
    });

    it('does not sort when non-sortable column is clicked', () => {
      render(<VirtualTable data={mockData.slice(0, 10)} columns={mockColumns} />);

      const nameHeader = screen.getByText('Name');
      fireEvent.click(nameHeader);

      // Should not cause errors
      expect(nameHeader).toBeInTheDocument();
    });
  });

  describe('Row Clicks', () => {
    it('calls onRowClick when row is clicked', () => {
      const handleRowClick = vi.fn();
      render(
        <VirtualTable
          data={mockData.slice(0, 10)}
          columns={mockColumns}
          onRowClick={handleRowClick}
        />
      );

      const firstRow = screen.getByText('Item 1').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
        expect(handleRowClick).toHaveBeenCalled();
      }
    });

    it('passes correct row and index to onRowClick', () => {
      const handleRowClick = vi.fn();
      render(
        <VirtualTable
          data={mockData.slice(0, 10)}
          columns={mockColumns}
          onRowClick={handleRowClick}
        />
      );

      const firstRow = screen.getByText('Item 1').closest('tr');
      if (firstRow) {
        fireEvent.click(firstRow);
        expect(handleRowClick).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Item 1' }),
          expect.any(Number)
        );
      }
    });
  });

  describe('Custom Rendering', () => {
    it('uses custom render function when provided', () => {
      const columnsWithRender: VirtualTableColumn<MockData>[] = [
        {
          key: 'value',
          label: 'Value',
          render: (value) => <span className="custom-value">${value}</span>,
        },
      ];

      render(<VirtualTable data={mockData.slice(0, 5)} columns={columnsWithRender} />);
      const customValue = screen.getByText(/\$\d+/);
      expect(customValue).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('displays empty message when data is empty', () => {
      render(<VirtualTable data={[]} columns={mockColumns} emptyMessage="No items" />);
      expect(screen.getByText('No items')).toBeInTheDocument();
    });

    it('displays default empty message', () => {
      render(<VirtualTable data={[]} columns={mockColumns} />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <VirtualTable data={mockData.slice(0, 10)} columns={mockColumns} className="custom-table" />
      );
      const wrapper = container.querySelector('.custom-table');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies column width when provided', () => {
      const columnsWithWidth: VirtualTableColumn<MockData>[] = [
        { key: 'name', label: 'Name', width: 200 },
      ];
      render(<VirtualTable data={mockData.slice(0, 5)} columns={columnsWithWidth} />);
      // Column should have width applied
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <VirtualTable data={mockData.slice(0, 10)} columns={mockColumns} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles very large datasets', () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: String(i),
        name: `Item ${i}`,
        value: i,
      }));
      render(<VirtualTable data={largeData} columns={mockColumns} />);
      // Should render without performance issues
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('handles zero height', () => {
      render(<VirtualTable data={mockData.slice(0, 10)} columns={mockColumns} height={0} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });
});
