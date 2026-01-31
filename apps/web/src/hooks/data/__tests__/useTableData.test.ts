/**
 * useTableData Hook Tests
 *
 * Comprehensive test suite for the useTableData hook covering:
 * - Search functionality
 * - Filtering functionality
 * - Sorting functionality
 * - Pagination functionality
 * - Combined operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableData } from '../useTableData';
import type { Column } from '../useTableData';

interface TestData {
  id: number;
  name: string;
  status: string;
  value: number;
}

describe('useTableData Hook', () => {
  const mockData: TestData[] = [
    { id: 1, name: 'Item 1', status: 'active', value: 100 },
    { id: 2, name: 'Item 2', status: 'inactive', value: 200 },
    { id: 3, name: 'Item 3', status: 'active', value: 150 },
  ];

  const mockColumns: Column<TestData>[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true, filterable: true },
    { key: 'status', label: 'Status', filterable: true, filterType: 'select' },
    { key: 'value', label: 'Value', sortable: true, filterType: 'number' },
  ];

  describe('Search Functionality', () => {
    it('filters data by search term', () => {
      const { result } = renderHook(() =>
        useTableData({
          data: mockData,
          columns: mockColumns,
          searchable: true,
        })
      );

      act(() => {
        result.current.setSearchTerm('Item 1');
      });

      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0]?.name).toBe('Item 1');
    });

    it('returns all data when search term is empty', () => {
      const { result } = renderHook(() =>
        useTableData({
          data: mockData,
          columns: mockColumns,
          searchable: true,
        })
      );

      act(() => {
        result.current.setSearchTerm('');
      });

      expect(result.current.filteredData).toHaveLength(3);
    });
  });

  describe('Filtering Functionality', () => {
    it('filters data by column filter', () => {
      const { result } = renderHook(() =>
        useTableData({
          data: mockData,
          columns: mockColumns,
          filterable: true,
        })
      );

      act(() => {
        result.current.handleFilterChange('status', 'active');
      });

      expect(result.current.filteredData).toHaveLength(2);
      expect(result.current.filteredData.every((item) => item.status === 'active')).toBe(true);
    });

    it('clears filters when clearFilters is called', () => {
      const { result } = renderHook(() =>
        useTableData({
          data: mockData,
          columns: mockColumns,
          filterable: true,
        })
      );

      act(() => {
        result.current.handleFilterChange('status', 'active');
      });

      expect(result.current.hasActiveFilters).toBe(true);

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.hasActiveFilters).toBe(false);
      expect(result.current.filteredData).toHaveLength(3);
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts data ascending', () => {
      const { result } = renderHook(() =>
        useTableData({
          data: mockData,
          columns: mockColumns,
          sortable: true,
        })
      );

      act(() => {
        result.current.handleSort('value');
      });

      expect(result.current.sortColumn).toBe('value');
      expect(result.current.sortDirection).toBe('asc');
      expect(result.current.filteredData[0]?.value).toBe(100);
    });

    it('sorts data descending on second click', () => {
      const { result } = renderHook(() =>
        useTableData({
          data: mockData,
          columns: mockColumns,
          sortable: true,
        })
      );

      act(() => {
        result.current.handleSort('value');
        result.current.handleSort('value');
      });

      expect(result.current.sortDirection).toBe('desc');
      expect(result.current.filteredData[0]?.value).toBe(200);
    });
  });

  describe('Pagination Functionality', () => {
    it('paginates data correctly', () => {
      const { result } = renderHook(() =>
        useTableData({
          data: mockData,
          columns: mockColumns,
          pageSize: 2,
        })
      );

      expect(result.current.paginatedData).toHaveLength(2);
      expect(result.current.totalPages).toBe(2);
    });

    it('changes page when setCurrentPage is called', () => {
      const { result } = renderHook(() =>
        useTableData({
          data: mockData,
          columns: mockColumns,
          pageSize: 2,
        })
      );

      act(() => {
        result.current.setCurrentPage(2);
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.paginatedData).toHaveLength(1);
    });
  });

  describe('Combined Operations', () => {
    it('applies search, filter, sort, and pagination together', () => {
      const { result } = renderHook(() =>
        useTableData({
          data: mockData,
          columns: mockColumns,
          searchable: true,
          filterable: true,
          sortable: true,
          pageSize: 1,
        })
      );

      act(() => {
        result.current.setSearchTerm('Item');
        result.current.handleFilterChange('status', 'active');
        result.current.handleSort('value');
      });

      expect(result.current.filteredData.length).toBeGreaterThan(0);
      expect(result.current.paginatedData).toHaveLength(1);
    });
  });
});
