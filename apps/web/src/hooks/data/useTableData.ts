/**
 * Shared table data management hook
 * Handles search, filtering, sorting, and pagination logic
 * Can be reused across DataTable and DataTableEnhanced components
 */

import { useState, useMemo, useCallback, type ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  /** Custom render function for cell content */
  render?: (value: unknown, row: T) => ReactNode;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'date' | 'number';
  filterOptions?: { label: string; value: string }[];
}

export interface UseTableDataOptions {
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  pageSize?: number;
}

export interface UseTableDataReturn<T> {
  // Data
  filteredData: T[];
  paginatedData: T[];

  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Filters
  filters: Record<string, unknown>;
  setFilters: (filters: Record<string, unknown>) => void;
  handleFilterChange: (columnKey: string, value: unknown) => void;
  clearFilters: () => void;

  // Sorting
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  handleSort: (columnKey: string) => void;

  // Pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;

  // Utilities
  hasActiveFilters: boolean;
}

/**
 * Apply search to data
 */
function applySearch<T extends Record<string, unknown>>(
  data: T[],
  columns: Column<T>[],
  searchTerm: string
): T[] {
  if (!searchTerm) return data;

  const term = searchTerm.toLowerCase();
  return data.filter((row) =>
    columns.some((col) => {
      const value = row[col.key];
      return value?.toString().toLowerCase().includes(term);
    })
  );
}

/**
 * Apply filters to data
 */
function applyFilters<T extends Record<string, unknown>>(
  data: T[],
  columns: Column<T>[],
  filters: Record<string, unknown>
): T[] {
  let result = [...data];

  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    const column = columns.find((col) => col.key === key);
    if (!column) return;

    result = result.filter((row) => {
      const rowValue = row[key];

      if (column.filterType === 'select') {
        return rowValue === value;
      }

      if (column.filterType === 'number') {
        return Number(rowValue) === Number(value);
      }

      return rowValue?.toString().toLowerCase().includes(value.toString().toLowerCase());
    });
  });

  return result;
}

/**
 * Apply sorting to data
 */
function applySorting<T extends Record<string, unknown>>(
  data: T[],
  sortColumn: string,
  sortDirection: 'asc' | 'desc'
): T[] {
  return [...data].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Convert to comparable values
    const aComparable = typeof aValue === 'number' ? aValue : String(aValue);
    const bComparable = typeof bValue === 'number' ? bValue : String(bValue);

    const comparison = aComparable > bComparable ? 1 : aComparable < bComparable ? -1 : 0;
    return sortDirection === 'asc' ? comparison : -comparison;
  });
}

/**
 * Shared hook for table data management
 * Handles search, filtering, sorting, and pagination
 */
export function useTableData<T extends Record<string, unknown>>(
  data: T[],
  columns: Column<T>[],
  options: UseTableDataOptions = {}
): UseTableDataReturn<T> {
  const { searchable = true, filterable = true, sortable = true, pageSize = 10 } = options;

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Filter state
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  // Sort state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Apply search
  const searchedData = useMemo(() => {
    if (!searchable) return data;
    return applySearch(data, columns, searchTerm);
  }, [data, columns, searchTerm, searchable]);

  // Apply filters
  const filteredData = useMemo(() => {
    if (!filterable) return searchedData;
    return applyFilters(searchedData, columns, filters);
  }, [searchedData, columns, filters, filterable]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortable || !sortColumn) return filteredData;
    return applySorting(filteredData, sortColumn, sortDirection);
  }, [filteredData, sortColumn, sortDirection, sortable]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Sort handler
  const handleSort = useCallback(
    (columnKey: string) => {
      if (sortColumn === columnKey) {
        setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(columnKey);
        setSortDirection('asc');
      }
      setCurrentPage(1); // Reset to first page on sort
    },
    [sortColumn]
  );

  // Filter handler
  const handleFilterChange = useCallback((columnKey: string, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: value,
    }));
    setCurrentPage(1); // Reset to first page on filter
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== '' ||
      Object.values(filters).some((value) => value !== null && value !== undefined && value !== '')
    );
  }, [searchTerm, filters]);

  return {
    filteredData: sortedData,
    paginatedData,
    searchTerm,
    setSearchTerm: useCallback((term: string) => {
      setSearchTerm(term);
      setCurrentPage(1);
    }, []),
    filters,
    setFilters,
    handleFilterChange,
    clearFilters,
    sortColumn,
    sortDirection,
    handleSort,
    currentPage,
    setCurrentPage,
    totalPages,
    hasActiveFilters,
  };
}
