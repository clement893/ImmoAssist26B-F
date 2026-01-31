/**
 * TableFilters Component Tests
 *
 * Comprehensive test suite for the TableFilters component covering:
 * - Rendering with different filter types
 * - Filter changes
 * - Clear filters
 * - Filterable columns
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import TableFilters from '../TableFilters';

type MockData = {
  id: string;
  name: string;
  status: string;
  category: string;
};

describe('TableFilters Component', () => {
  const mockColumns = [
    { key: 'name', label: 'Name', filterable: true },
    {
      key: 'status',
      label: 'Status',
      filterable: true,
      filterType: 'select' as const,
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
    { key: 'category', label: 'Category', filterable: false },
  ];

  const defaultProps = {
    columns: mockColumns,
    filters: {},
    onFilterChange: vi.fn(),
    onClearFilters: vi.fn(),
  };

  describe('Rendering', () => {
    it('renders filter inputs for filterable columns', () => {
      render(<TableFilters {...defaultProps} />);
      expect(screen.getByPlaceholderText('Filtrer Name')).toBeInTheDocument();
    });

    it('renders select dropdown for select filter type', () => {
      render(<TableFilters {...defaultProps} />);
      const select = screen.getByDisplayValue('Tous Status');
      expect(select).toBeInTheDocument();
    });

    it('does not render filters for non-filterable columns', () => {
      render(<TableFilters {...defaultProps} />);
      expect(screen.queryByPlaceholderText('Filtrer Category')).not.toBeInTheDocument();
    });

    it('returns null when no filterable columns', () => {
      const { container } = render(
        <TableFilters
          columns={[{ key: 'name', label: 'Name', filterable: false }]}
          filters={{}}
          onFilterChange={vi.fn()}
          onClearFilters={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders clear filters button', () => {
      render(<TableFilters {...defaultProps} />);
      expect(screen.getByText('Réinitialiser')).toBeInTheDocument();
    });
  });

  describe('Filter Changes', () => {
    it('calls onFilterChange when text input changes', () => {
      const handleFilterChange = vi.fn();
      render(<TableFilters {...defaultProps} onFilterChange={handleFilterChange} />);

      const input = screen.getByPlaceholderText('Filtrer Name');
      fireEvent.change(input, { target: { value: 'test' } });

      expect(handleFilterChange).toHaveBeenCalledWith('name', 'test');
    });

    it('calls onFilterChange when select changes', () => {
      const handleFilterChange = vi.fn();
      render(<TableFilters {...defaultProps} onFilterChange={handleFilterChange} />);

      const select = screen.getByDisplayValue('Tous Status');
      fireEvent.change(select, { target: { value: 'active' } });

      expect(handleFilterChange).toHaveBeenCalledWith('status', 'active');
    });

    it('displays current filter values', () => {
      render(<TableFilters {...defaultProps} filters={{ name: 'test', status: 'active' }} />);

      expect(screen.getByDisplayValue('test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('active')).toBeInTheDocument();
    });
  });

  describe('Clear Filters', () => {
    it('calls onClearFilters when clear button is clicked', () => {
      const handleClearFilters = vi.fn();
      render(<TableFilters {...defaultProps} onClearFilters={handleClearFilters} />);

      const clearButton = screen.getByText('Réinitialiser');
      fireEvent.click(clearButton);

      expect(handleClearFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe('Select Filter Options', () => {
    it('renders all filter options', () => {
      render(<TableFilters {...defaultProps} />);
      const select = screen.getByDisplayValue('Tous Status');

      expect(select.querySelector('option[value="active"]')).toBeInTheDocument();
      expect(select.querySelector('option[value="inactive"]')).toBeInTheDocument();
    });

    it('renders default "Tous" option', () => {
      render(<TableFilters {...defaultProps} />);
      const select = screen.getByDisplayValue('Tous Status');
      expect(select.querySelector('option[value=""]')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(<TableFilters {...defaultProps} className="custom-filters" />);
      const wrapper = container.querySelector('.custom-filters');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TableFilters {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty filters object', () => {
      render(<TableFilters {...defaultProps} filters={{}} />);
      expect(screen.getByPlaceholderText('Filtrer Name')).toBeInTheDocument();
    });

    it('handles filters with undefined values', () => {
      render(<TableFilters {...defaultProps} filters={{ name: undefined }} />);
      const input = screen.getByPlaceholderText('Filtrer Name');
      expect(input).toHaveValue('');
    });
  });
});
