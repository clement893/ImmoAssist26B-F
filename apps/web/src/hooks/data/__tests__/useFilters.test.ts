import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilters, FilterConfig } from '../useFilters';

interface TestItem {
  id: number;
  name: string;
  age: number;
  status: string;
}

const mockData: TestItem[] = [
  { id: 1, name: 'Alice', age: 25, status: 'active' },
  { id: 2, name: 'Bob', age: 30, status: 'inactive' },
  { id: 3, name: 'Charlie', age: 35, status: 'active' },
  { id: 4, name: 'David', age: 28, status: 'pending' },
];

describe('useFilters', () => {
  describe('Initialization', () => {
    it('initializes with empty filters', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      expect(result.current.filters).toEqual([]);
      expect(result.current.filteredData).toEqual(mockData);
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it('initializes with initial filters', () => {
      const initialFilters: FilterConfig<TestItem>[] = [
        { field: 'status', operator: 'equals', value: 'active' },
      ];

      const { result } = renderHook(() => useFilters({ data: mockData, filters: initialFilters }));

      expect(result.current.filters).toHaveLength(1);
      expect(result.current.filteredData).toHaveLength(2);
    });
  });

  describe('Filter Operations', () => {
    it('adds a filter', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.addFilter({
          field: 'status',
          operator: 'equals',
          value: 'active',
        });
      });

      expect(result.current.filters).toHaveLength(1);
      expect(result.current.filteredData).toHaveLength(2);
      expect(result.current.hasActiveFilters).toBe(true);
    });

    it('replaces existing filter for same field', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.addFilter({
          field: 'status',
          operator: 'equals',
          value: 'active',
        });
      });

      act(() => {
        result.current.addFilter({
          field: 'status',
          operator: 'equals',
          value: 'inactive',
        });
      });

      expect(result.current.filters).toHaveLength(1);
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filters[0].value).toBe('inactive');
    });

    it('removes a filter', () => {
      const { result } = renderHook(() =>
        useFilters({
          data: mockData,
          filters: [{ field: 'status', operator: 'equals', value: 'active' }],
        })
      );

      act(() => {
        result.current.removeFilter('status');
      });

      expect(result.current.filters).toHaveLength(0);
      expect(result.current.filteredData).toEqual(mockData);
    });

    it('updates a filter', () => {
      const { result } = renderHook(() =>
        useFilters({
          data: mockData,
          filters: [{ field: 'status', operator: 'equals', value: 'active' }],
        })
      );

      act(() => {
        result.current.updateFilter('status', { value: 'inactive' });
      });

      expect(result.current.filters[0].value).toBe('inactive');
      expect(result.current.filteredData).toHaveLength(1);
    });

    it('clears all filters', () => {
      const { result } = renderHook(() =>
        useFilters({
          data: mockData,
          filters: [
            { field: 'status', operator: 'equals', value: 'active' },
            { field: 'age', operator: 'greaterThan', value: 30 },
          ],
        })
      );

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toHaveLength(0);
      expect(result.current.filteredData).toEqual(mockData);
    });
  });

  describe('Filter Operators', () => {
    it('filters with equals operator', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.addFilter({
          field: 'status',
          operator: 'equals',
          value: 'active',
        });
      });

      expect(result.current.filteredData).toEqual([
        { id: 1, name: 'Alice', age: 25, status: 'active' },
        { id: 3, name: 'Charlie', age: 35, status: 'active' },
      ]);
    });

    it('filters with contains operator', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.addFilter({
          field: 'name',
          operator: 'contains',
          value: 'li',
        });
      });

      expect(result.current.filteredData).toEqual([
        { id: 1, name: 'Alice', age: 25, status: 'active' },
        { id: 3, name: 'Charlie', age: 35, status: 'active' },
      ]);
    });

    it('filters with startsWith operator', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.addFilter({
          field: 'name',
          operator: 'startsWith',
          value: 'A',
        });
      });

      expect(result.current.filteredData).toEqual([
        { id: 1, name: 'Alice', age: 25, status: 'active' },
      ]);
    });

    it('filters with endsWith operator', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.addFilter({
          field: 'name',
          operator: 'endsWith',
          value: 'e',
        });
      });

      expect(result.current.filteredData).toEqual([
        { id: 1, name: 'Alice', age: 25, status: 'active' },
        { id: 3, name: 'Charlie', age: 35, status: 'active' },
      ]);
    });

    it('filters with greaterThan operator', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.addFilter({
          field: 'age',
          operator: 'greaterThan',
          value: 30,
        });
      });

      expect(result.current.filteredData).toEqual([
        { id: 3, name: 'Charlie', age: 35, status: 'active' },
      ]);
    });

    it('filters with lessThan operator', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.addFilter({
          field: 'age',
          operator: 'lessThan',
          value: 30,
        });
      });

      expect(result.current.filteredData).toEqual([
        { id: 1, name: 'Alice', age: 25, status: 'active' },
        { id: 4, name: 'David', age: 28, status: 'pending' },
      ]);
    });

    it('filters with in operator', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.addFilter({
          field: 'status',
          operator: 'in',
          value: ['active', 'pending'],
        });
      });

      expect(result.current.filteredData).toEqual([
        { id: 1, name: 'Alice', age: 25, status: 'active' },
        { id: 3, name: 'Charlie', age: 35, status: 'active' },
        { id: 4, name: 'David', age: 28, status: 'pending' },
      ]);
    });

    it('filters with between operator', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.addFilter({
          field: 'age',
          operator: 'between',
          value: [28, 32],
        });
      });

      expect(result.current.filteredData).toEqual([
        { id: 2, name: 'Bob', age: 30, status: 'inactive' },
        { id: 4, name: 'David', age: 28, status: 'pending' },
      ]);
    });
  });

  describe('Multiple Filters', () => {
    it('applies multiple filters with AND logic', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.addFilter({
          field: 'status',
          operator: 'equals',
          value: 'active',
        });
        result.current.addFilter({
          field: 'age',
          operator: 'greaterThan',
          value: 30,
        });
      });

      expect(result.current.filteredData).toEqual([
        { id: 3, name: 'Charlie', age: 35, status: 'active' },
      ]);
    });

    it('ignores empty filter values', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.addFilter({
          field: 'status',
          operator: 'equals',
          value: '',
        });
        result.current.addFilter({
          field: 'age',
          operator: 'greaterThan',
          value: null,
        });
      });

      expect(result.current.filteredData).toEqual(mockData);
    });
  });

  describe('Filter Value Management', () => {
    it('gets filter value', () => {
      const { result } = renderHook(() =>
        useFilters({
          data: mockData,
          filters: [{ field: 'status', operator: 'equals', value: 'active' }],
        })
      );

      expect(result.current.getFilterValue('status')).toBe('active');
      expect(result.current.getFilterValue('age')).toBeUndefined();
    });

    it('sets filter value (adds new filter)', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.setFilterValue('status', 'active');
      });

      expect(result.current.filters).toHaveLength(1);
      expect(result.current.filteredData).toHaveLength(2);
    });

    it('sets filter value (updates existing filter)', () => {
      const { result } = renderHook(() =>
        useFilters({
          data: mockData,
          filters: [{ field: 'status', operator: 'equals', value: 'active' }],
        })
      );

      act(() => {
        result.current.setFilterValue('status', 'inactive');
      });

      expect(result.current.filters[0].value).toBe('inactive');
    });

    it('removes filter when value is empty', () => {
      const { result } = renderHook(() =>
        useFilters({
          data: mockData,
          filters: [{ field: 'status', operator: 'equals', value: 'active' }],
        })
      );

      act(() => {
        result.current.setFilterValue('status', '');
      });

      expect(result.current.filters).toHaveLength(0);
    });

    it('sets filter value with custom operator', () => {
      const { result } = renderHook(() => useFilters({ data: mockData }));

      act(() => {
        result.current.setFilterValue('age', 30, 'greaterThan');
      });

      expect(result.current.filters[0].operator).toBe('greaterThan');
    });
  });

  describe('onFilterChange Callback', () => {
    it('calls onFilterChange when filters change', () => {
      const onFilterChange = vi.fn();
      const { result } = renderHook(() => useFilters({ data: mockData, onFilterChange }));

      act(() => {
        result.current.addFilter({
          field: 'status',
          operator: 'equals',
          value: 'active',
        });
      });

      expect(onFilterChange).toHaveBeenCalled();
      expect(onFilterChange).toHaveBeenCalledWith([
        { id: 1, name: 'Alice', age: 25, status: 'active' },
        { id: 3, name: 'Charlie', age: 35, status: 'active' },
      ]);
    });
  });

  describe('Null/Undefined Handling', () => {
    const dataWithNulls: TestItem[] = [
      { id: 1, name: 'Alice', age: 25, status: 'active' },
      { id: 2, name: 'Bob', age: 30, status: null as unknown as string },
    ];

    it('handles null field values', () => {
      const { result } = renderHook(() => useFilters({ data: dataWithNulls }));

      act(() => {
        result.current.addFilter({
          field: 'status',
          operator: 'equals',
          value: null,
        });
      });

      expect(result.current.filteredData).toHaveLength(1);
    });
  });
});
