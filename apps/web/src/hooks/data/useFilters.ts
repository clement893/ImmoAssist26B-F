/**
 * useFilters Hook
 * Système de filtres réutilisable pour listes de données
 */

import { useState, useMemo, useCallback } from 'react';

export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'in'
  | 'between';

export interface FilterConfig<T> {
  field: keyof T;
  operator: FilterOperator;
  value: unknown;
  label?: string;
}

export interface UseFiltersOptions<T> {
  data: T[];
  filters?: FilterConfig<T>[];
  onFilterChange?: (filteredData: T[]) => void;
}

export interface UseFiltersReturn<T> {
  filters: FilterConfig<T>[];
  filteredData: T[];
  addFilter: (filter: FilterConfig<T>) => void;
  removeFilter: (field: keyof T) => void;
  updateFilter: (field: keyof T, filter: Partial<FilterConfig<T>>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  getFilterValue: (field: keyof T) => unknown;
  setFilterValue: (field: keyof T, value: unknown, operator?: FilterOperator) => void;
}

function applyFilter<T>(item: T, filter: FilterConfig<T>): boolean {
  const fieldValue = item[filter.field];
  const filterValue = filter.value;

  if (fieldValue === undefined || fieldValue === null) {
    return filterValue === null || filterValue === undefined;
  }

  switch (filter.operator) {
    case 'equals':
      return fieldValue === filterValue;

    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());

    case 'startsWith':
      return String(fieldValue).toLowerCase().startsWith(String(filterValue).toLowerCase());

    case 'endsWith':
      return String(fieldValue).toLowerCase().endsWith(String(filterValue).toLowerCase());

    case 'greaterThan':
      return Number(fieldValue) > Number(filterValue);

    case 'lessThan':
      return Number(fieldValue) < Number(filterValue);

    case 'in':
      if (Array.isArray(filterValue)) {
        return filterValue.includes(fieldValue);
      }
      return false;

    case 'between':
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        const [min, max] = filterValue;
        return Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max);
      }
      return false;

    default:
      return true;
  }
}

export function useFilters<T extends Record<string, unknown>>(
  options: UseFiltersOptions<T>
): UseFiltersReturn<T> {
  const { data, filters: initialFilters = [], onFilterChange } = options;

  const [filters, setFilters] = useState<FilterConfig<T>[]>(initialFilters);

  const filteredData = useMemo(() => {
    if (filters.length === 0) {
      return data;
    }

    return data.filter((item) => {
      return filters.every((filter) => {
        if (filter.value === null || filter.value === undefined || filter.value === '') {
          return true; // Skip empty filters
        }
        return applyFilter(item, filter);
      });
    });
  }, [data, filters]);

  // Notify parent of filter changes
  useMemo(() => {
    onFilterChange?.(filteredData);
  }, [filteredData, onFilterChange]);

  const addFilter = useCallback((filter: FilterConfig<T>) => {
    setFilters((prev) => {
      // Remove existing filter for the same field
      const filtered = prev.filter((f) => f.field !== filter.field);
      return [...filtered, filter];
    });
  }, []);

  const removeFilter = useCallback((field: keyof T) => {
    setFilters((prev) => prev.filter((f) => f.field !== field));
  }, []);

  const updateFilter = useCallback((field: keyof T, updates: Partial<FilterConfig<T>>) => {
    setFilters((prev) => prev.map((f) => (f.field === field ? { ...f, ...updates } : f)));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filters.some((f) => f.value !== null && f.value !== undefined && f.value !== '');
  }, [filters]);

  const getFilterValue = useCallback(
    (field: keyof T): unknown => {
      const filter = filters.find((f) => f.field === field);
      return filter?.value;
    },
    [filters]
  );

  const setFilterValue = useCallback(
    (field: keyof T, value: unknown, operator: FilterOperator = 'contains') => {
      const existingFilter = filters.find((f) => f.field === field);

      if (value === null || value === undefined || value === '') {
        // Remove filter if value is empty
        if (existingFilter) {
          removeFilter(field);
        }
      } else if (existingFilter) {
        // Update existing filter
        updateFilter(field, { value, operator });
      } else {
        // Add new filter
        addFilter({ field, operator, value });
      }
    },
    [filters, addFilter, updateFilter, removeFilter]
  );

  return {
    filters,
    filteredData,
    addFilter,
    removeFilter,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    getFilterValue,
    setFilterValue,
  };
}
