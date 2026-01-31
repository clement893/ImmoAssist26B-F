'use client';

import { useState, useCallback } from 'react';
import Button from './Button';
import Dropdown from './Dropdown';
import type { DropdownItem } from './Dropdown';
import { logger } from '@/lib/logger';

export interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
  onExport?: (format: 'csv' | 'excel', data: Record<string, unknown>[]) => void;
}

export default function ExportButton({ data, filename = 'export', onExport }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const convertToCSV = useCallback((data: Record<string, unknown>[]): string => {
    if (data.length === 0) return '';
    const firstRow = data[0];
    if (!firstRow) return '';
    const headers = Object.keys(firstRow);
    const csvHeaders = headers.join(',');
    const csvRows = data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value).replace(/"/g, '""');
        })
        .join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  }, []);

  const downloadCSV = useCallback(async () => {
    setLoading(true);
    try {
      if (onExport) {
        onExport('csv', data);
      } else {
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Clean up object URL to prevent memory leak
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      logger.error('Error exporting CSV', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  }, [data, filename, onExport, convertToCSV]);

  const downloadExcel = useCallback(async () => {
    setLoading(true);
    try {
      if (onExport) {
        onExport('excel', data);
      } else {
        // For Excel, we'll create a CSV with Excel-compatible format
        // In a real implementation, you'd use a library like xlsx or exceljs
        const csv = convertToCSV(data);
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.xlsx`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Clean up object URL to prevent memory leak
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      logger.error('Error exporting Excel', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  }, [data, filename, onExport, convertToCSV]);

  const items: DropdownItem[] = [
    {
      label: 'Exporter en CSV',
      onClick: downloadCSV,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      label: 'Exporter en Excel',
      onClick: downloadExcel,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <Dropdown
      trigger={
        <Button variant="outline" size="sm" disabled={loading || data.length === 0}>
          {loading ? 'Export...' : 'Exporter'}
        </Button>
      }
      items={items}
    />
  );
}
