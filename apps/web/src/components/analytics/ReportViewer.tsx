/**
 * Report Viewer Component
 * Display generated reports with charts and tables
 */
'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { Chart } from '@/components/ui';
import type { ChartDataPoint } from '@/components/ui';
import { Download, Share2, RefreshCw, Calendar, BarChart3 } from 'lucide-react';

export interface ReportData {
  id: string;
  name: string;
  description?: string;
  dateRange: {
    start: string;
    end: string;
  };
  format: 'table' | 'chart' | 'both';
  data: {
    table?: Array<Record<string, unknown>>;
    chart?: ChartDataPoint[];
    chartType?: 'line' | 'bar' | 'pie' | 'area';
  };
  generatedAt: string;
}

export interface ReportViewerProps {
  report: ReportData;
  onRefresh?: () => void | Promise<void>;
  onExport?: (format: 'csv' | 'pdf' | 'excel') => void | Promise<void>;
  onShare?: () => void;
  className?: string;
}

export default function ReportViewer({
  report,
  onRefresh,
  onExport,
  onShare,
  className,
}: ReportViewerProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      await onExport?.(exportFormat);
    } finally {
      setLoading(false);
    }
  };

  // Generate table columns from data
  const columns: Column<Record<string, unknown>>[] = report.data.table
    ? Object.keys(report.data.table[0] || {}).map((key) => ({
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        sortable: true,
        render: (value) => (
          <span className="text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : String(value)}
          </span>
        ),
      }))
    : [];

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <Card className="bg-background">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-bold text-foreground">{report.name}</h2>
            </div>
            {report.description && (
              <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(report.dateRange.start).toLocaleDateString()} -{' '}
                {new Date(report.dateRange.end).toLocaleDateString()}
              </div>
              <div>Generated: {new Date(report.generatedAt).toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </span>
              </Button>
            )}
            {onShare && (
              <Button variant="ghost" size="sm" onClick={onShare}>
                <span className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </span>
              </Button>
            )}
            {onExport && (
              <div className="flex items-center gap-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf' | 'excel')}
                  className={clsx(
                    'px-2 py-1 border rounded text-xs',
                    'bg-background',
                    'text-foreground',
                    'border-border'
                  )}
                >
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
                <Button variant="primary" size="sm" onClick={handleExport} loading={loading}>
                  <span className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Chart */}
      {(report.format === 'chart' || report.format === 'both') && report.data.chart && (
        <Card title="Chart Visualization" className="bg-background">
          <Chart type={report.data.chartType || 'line'} data={report.data.chart} height={300} />
        </Card>
      )}

      {/* Table */}
      {(report.format === 'table' || report.format === 'both') && report.data.table && (
        <Card title="Data Table" className="bg-background">
          <DataTable
            data={report.data.table}
            columns={columns}
            pageSize={10}
            emptyMessage="No data available"
          />
        </Card>
      )}
    </div>
  );
}
