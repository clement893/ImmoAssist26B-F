'use client';

import { useState, useRef, useMemo } from 'react';
import { clsx } from 'clsx';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './Table';

export interface VirtualTableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T] | undefined, row: T, index: number) => React.ReactNode;
  width?: number | string;
}

export interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  height?: number;
  rowHeight?: number;
  className?: string;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
}

export default function VirtualTable<T extends Record<string, unknown>>({
  data,
  columns,
  height = 400,
  rowHeight = 50,
  className,
  onRowClick,
  emptyMessage = 'No data available',
}: VirtualTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleStart = Math.floor(scrollTop / rowHeight);
  const visibleEnd = Math.min(visibleStart + Math.ceil(height / rowHeight) + 1, data.length);

  const visibleData = useMemo(() => {
    let sorted = [...data];
    if (sortColumn) {
      sorted.sort((a, b) => {
        const aVal = a[sortColumn as keyof T];
        const bVal = b[sortColumn as keyof T];
        if (aVal === bVal) return 0;
        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    return sorted.slice(visibleStart, visibleEnd);
  }, [data, sortColumn, sortDirection, visibleStart, visibleEnd]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const handleSort = (columnKey: keyof T | string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const totalHeight = data.length * rowHeight;
  const offsetY = visibleStart * rowHeight;

  return (
    <div
      ref={containerRef}
      className={clsx('border border-border rounded-lg overflow-hidden bg-background', className)}
      style={{ height: `${height}px`, overflowY: 'auto' }}
      onScroll={handleScroll}
    >
      <Table>
        <TableHead className="sticky top-0 z-10 bg-background">
          <TableRow>
            {columns.map((column) => (
              <TableHeader
                key={String(column.key)}
                sortable={column.sortable}
                sortDirection={sortColumn === column.key ? sortDirection : null}
                onSort={column.sortable ? () => handleSort(column.key) : undefined}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </TableHeader>
            ))}
          </TableRow>
        </TableHead>
        <TableBody style={{ height: `${totalHeight}px`, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              visibleData.map((row, index) => {
                const actualIndex = visibleStart + index;
                return (
                  <TableRow
                    key={actualIndex}
                    onClick={() => onRowClick?.(row, actualIndex)}
                    className={onRowClick ? 'cursor-pointer hover:bg-muted' : ''}
                    style={{ height: `${rowHeight}px` }}
                  >
                    {columns.map((column) => {
                      const value = row[column.key as keyof T];
                      return (
                        <TableCell
                          key={String(column.key)}
                          style={column.width ? { width: column.width } : undefined}
                        >
                          {column.render ? column.render(value, row, actualIndex) : String(value ?? '')}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </div>
        </TableBody>
      </Table>
    </div>
  );
}
