/**
 * Enhanced DataTable Component
 * Advanced DataTable with ERP features: bulk actions, export, column visibility, etc.
 */
'use client';

import { useState, useMemo, type ReactNode, type ChangeEvent } from 'react';
import { clsx } from 'clsx';
import DataTable from './DataTable';
import type { Column } from './DataTable';
import Button from './Button';
import Checkbox from './Checkbox';
import Dropdown from './Dropdown';
import type { DropdownItem } from './Dropdown';

// Re-export Column type for convenience
export type { Column };

export interface BulkAction<T> {
  label: string;
  icon?: ReactNode;
  onClick: (selectedRows: T[]) => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger';
  requireConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface ExportOption {
  label: string;
  format: 'csv' | 'xlsx' | 'json';
  onClick: (data: unknown[]) => void;
}

export interface DataTableEnhancedProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  sortable?: boolean;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => DropdownItem[];
  bulkActions?: BulkAction<T>[];
  exportOptions?: ExportOption[];
  selectable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  rowKey?: (row: T) => string | number;
}

export default function DataTableEnhanced<T extends Record<string, unknown>>({
  data,
  columns,
  selectable = false,
  bulkActions = [],
  exportOptions = [],
  onSelectionChange,
  columnVisibility,
  onColumnVisibilityChange,
  rowKey,
  ...props
}: DataTableEnhancedProps<T>) {
  // Note: DataTableEnhanced wraps DataTable, which uses useTableData internally
  // So we don't need to call useTableData here - DataTable handles it
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());

  const getRowKey = (row: T, index: number): string | number => {
    if (rowKey) return rowKey(row);
    return (row.id as string | number) ?? index;
  };

  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    if (checked) {
      const allKeys = new Set(data.map((row, index) => getRowKey(row, index)));
      setSelectedRows(allKeys);
      onSelectionChange?.(data);
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (row: T, index: number, checked: boolean) => {
    const key = getRowKey(row, index);
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(key);
    } else {
      newSelected.delete(key);
    }
    setSelectedRows(newSelected);
    const selectedData = data.filter((r, i) => newSelected.has(getRowKey(r, i)));
    onSelectionChange?.(selectedData);
  };

  const visibleColumns = useMemo(() => {
    if (!columnVisibility) return columns;
    return columns.filter((col) => columnVisibility[col.key] !== false);
  }, [columns, columnVisibility]);

  const selectedData = useMemo(() => {
    return data.filter((row, index) => selectedRows.has(getRowKey(row, index)));
  }, [data, selectedRows, rowKey]);

  const allSelected = selectedRows.size === data.length && data.length > 0;
  const someSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  return (
    <div className={clsx('space-y-4', props.className)}>
      {/* Toolbar */}
      {(bulkActions.length > 0 || exportOptions.length > 0 || onColumnVisibilityChange) && (
        <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-muted/30 rounded-lg border border-border shadow-subtle-sm transition-modern"> {/* UI Revamp - Ombre subtile et transition moderne */}
          <div className="flex items-center gap-2">
            {selectable && selectedRows.size > 0 && (
              <span className="text-sm text-muted-foreground">{selectedRows.size} selected</span>
            )}
            {bulkActions.length > 0 && selectedRows.size > 0 && (
              <div className="flex gap-2">
                {bulkActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant ?? 'secondary'}
                    size="sm"
                    onClick={() => {
                      if (action.requireConfirmation) {
                        if (
                          confirm(
                            action.confirmationMessage ??
                              `Are you sure you want to ${action.label.toLowerCase()}?`
                          )
                        ) {
                          void action.onClick(selectedData);
                        }
                      } else {
                        void action.onClick(selectedData);
                      }
                    }}
                  >
                    {action.icon && <span className="mr-1">{action.icon}</span>}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {exportOptions.length > 0 && (
              <Dropdown
                trigger={<Button variant="secondary" size="sm">Export</Button>}
                items={exportOptions.map((option) => ({
                  label: option.label,
                  onClick: () => option.onClick(data),
                }))}
              />
            )}
            {onColumnVisibilityChange && (
              <Dropdown
                trigger={<Button variant="secondary" size="sm">Columns</Button>}
                items={columns.map((col) => ({
                  label: col.label,
                  onClick: () => {
                    const newVisibility = {
                      ...columnVisibility,
                      [col.key]: !(columnVisibility?.[col.key] ?? true),
                    };
                    onColumnVisibilityChange(newVisibility);
                  },
                  icon: (
                    <input
                      type="checkbox"
                      checked={columnVisibility?.[col.key] !== false}
                      onChange={() => {}}
                      className="mr-2"
                    />
                  ),
                }))}
              />
            )}
          </div>
        </div>
      )}

      {/* Enhanced DataTable */}
      <div className="relative">
        {selectable && (
          <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r border-border bg-muted/50 z-10">
            <Checkbox checked={allSelected} indeterminate={someSelected} onChange={handleSelectAll} />
          </div>
        )}
        <div className={clsx(selectable && 'ml-12')}>
          <DataTable
            {...props}
            data={data}
            columns={visibleColumns.map((col) => ({
              ...col,
              render: (value: unknown, row: T) => {
                const originalRender = col.render;
                const content = originalRender ? originalRender(value, row) : String(value ?? '');

                // Find the index of the row in the data array
                const rowIndex = rowKey
                  ? data.findIndex((r) => rowKey(r) === rowKey(row as T))
                  : data.findIndex((r) => {
                      const rId = (r as Record<string, unknown>).id;
                      const rowId = (row as Record<string, unknown>).id;
                      return rId !== undefined && rowId !== undefined && rId === rowId;
                    });
                const actualIndex = rowIndex >= 0 ? rowIndex : data.indexOf(row as T);

                if (selectable && col.key === columns[0]?.key) {
                  return (
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedRows.has(getRowKey(row as T, actualIndex))}
                        onChange={(e) => handleSelectRow(row as T, actualIndex, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      {content}
                    </div>
                  );
                }
                return content;
              },
            }))}
          />
        </div>
      </div>
    </div>
  );
}
