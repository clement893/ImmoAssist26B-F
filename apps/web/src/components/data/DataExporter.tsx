'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import Button from '@/components/ui/Button';
import { FileSpreadsheet, FileText, FileJson, FileType } from 'lucide-react';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';

interface DataExporterProps {
  data: Record<string, unknown>[];
  filename?: string;
  headers?: string[];
  title?: string;
  className?: string;
}

export function DataExporter({
  data,
  filename,
  headers,
  title,
  className = '',
}: DataExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const handleExport = async (format: 'csv' | 'excel' | 'json' | 'pdf') => {
    if (!data || data.length === 0) {
      showToast({
        message: 'There is no data to export.',
        type: 'error',
      });
      return;
    }

    setIsExporting(true);

    try {
      // Use apiClient for authenticated requests (httpOnly cookies)
      const { apiClient } = await import('@/lib/api/client');

      const response = await apiClient.post(
        '/v1/exports/export',
        {
          format,
          data,
          headers,
          filename,
          title,
        },
        {
          responseType: 'blob',
        }
      );

      // Determine content type based on format
      const contentTypeMap: Record<string, string> = {
        csv: 'text/csv',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        json: 'application/json',
        pdf: 'application/pdf',
      };

      const contentType = contentTypeMap[format] || 'application/octet-stream';

      // Create download link
      const blob = new Blob([response.data as BlobPart], {
        type: contentType,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename based on format
      let downloadFilename = filename || `export_${new Date().toISOString().split('T')[0]}`;
      const extension = format === 'excel' ? 'xlsx' : format;
      downloadFilename = `${downloadFilename}.${extension}`;

      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast({
        message: `Data exported as ${format.toUpperCase()} successfully.`,
        type: 'success',
      });
    } catch (error: unknown) {
      logger.error('', 'Export error:', error);
      showToast({
        message: getErrorMessage(error) || 'Failed to export data.',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        onClick={() => handleExport('csv')}
        disabled={isExporting || !data || data.length === 0}
        variant="outline"
        size="sm"
      >
        <FileText className="h-4 w-4 mr-2" />
        CSV
      </Button>
      <Button
        onClick={() => handleExport('excel')}
        disabled={isExporting || !data || data.length === 0}
        variant="outline"
        size="sm"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Excel
      </Button>
      <Button
        onClick={() => handleExport('json')}
        disabled={isExporting || !data || data.length === 0}
        variant="outline"
        size="sm"
      >
        <FileJson className="h-4 w-4 mr-2" />
        JSON
      </Button>
      <Button
        onClick={() => handleExport('pdf')}
        disabled={isExporting || !data || data.length === 0}
        variant="outline"
        size="sm"
      >
        <FileType className="h-4 w-4 mr-2" />
        PDF
      </Button>
    </div>
  );
}
