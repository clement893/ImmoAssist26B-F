/** * Table Filters Component * Reusable filter controls for tables */ 'use client';
import Input from './Input';
import Button from './Button';
import type { Column } from '@/hooks/data/useTableData';
export interface TableFiltersProps<T> {
  columns: Column<T>[];
  filters: Record<string, unknown>;
  onFilterChange: (columnKey: string, value: unknown) => void;
  onClearFilters: () => void;
  className?: string;
}
export default function TableFilters<T extends Record<string, unknown>>({
  columns,
  filters,
  onFilterChange,
  onClearFilters,
  className,
}: TableFiltersProps<T>) {
  const filterableColumns = columns.filter((col) => col.filterable !== false);
  if (filterableColumns.length === 0) {
    return null;
  }
  return (
    <div className={className}>
      {' '}
      <div className="flex flex-wrap gap-2">
        {' '}
        {filterableColumns.map((column) => {
          if (column.filterType === 'select' && column.filterOptions) {
            return (
              <select
                key={column.key}
                value={String(filters[column.key] ?? '')}
                onChange={(e) => onFilterChange(column.key, e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
              >
                {' '}
                <option value="">Tous {column.label}</option>{' '}
                {column.filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {' '}
                    {option.label}{' '}
                  </option>
                ))}{' '}
              </select>
            );
          }
          return (
            <Input
              key={column.key}
              placeholder={`Filtrer ${column.label}`}
              value={String(filters[column.key] ?? '')}
              onChange={(e) => onFilterChange(column.key, e.target.value)}
              className="w-48"
            />
          );
        })}{' '}
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          {' '}
          Réinitialiser{' '}
        </Button>{' '}
      </div>{' '}
    </div>
  );
}
