'use client';

import { useState, useRef } from 'react';
import { logger } from '@/lib/logger';
import Button from '@/components/ui/Button';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';

interface DataImporterProps {
  onImportComplete?: (result: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    errors: Array<{ row: number; data: unknown; error: string }>;
    data: Record<string, unknown>[];
  }) => void;
  acceptedFormats?: string[];
  className?: string;
}

export function DataImporter({
  onImportComplete,
  acceptedFormats = ['.csv', '.xlsx', '.xls', '.json'],
  className = '',
}: DataImporterProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    errors: Array<{ row: number; data: unknown; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!acceptedFormats.some((format) => file.name.toLowerCase().endsWith(format.toLowerCase()))) {
      showToast({
        message: `Please select a file with one of these formats: ${acceptedFormats.join(',')}`,
        type: 'error',
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', 'auto');
      formData.append('has_headers', 'true');

      const response = await apiClient.post<{
        total_rows: number;
        valid_rows: number;
        invalid_rows: number;
        errors: Array<{ row: number; data: unknown; error: string }>;
        warnings: unknown[];
        data: Record<string, unknown>[];
      }>('/api/v1/imports/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data) {
        throw new Error('No data received from import');
      }

      setImportResult({
        total_rows: response.data.total_rows,
        valid_rows: response.data.valid_rows,
        invalid_rows: response.data.invalid_rows,
        errors: response.data.errors,
      });

      if (response.data.invalid_rows > 0) {
        showToast({
          message: `${response.data.valid_rows} rows imported successfully, ${response.data.invalid_rows} rows had errors.`,
          type: 'warning',
        });
      } else {
        showToast({
          message: `Successfully imported ${response.data.valid_rows} rows.`,
          type: 'success',
        });
      }

      onImportComplete?.(response.data);
    } catch (error: unknown) {
      logger.error('', 'Import error:', error);
      const errorMessage =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'detail' in error.response.data
          ? String(error.response.data.detail)
          : 'Failed to import data.';

      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-import"
        />
        <label htmlFor="file-import" className="cursor-pointer">
          <Button
            variant="outline"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import Data'}
          </Button>
        </label>
      </div>

      {importResult && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-3">
            {importResult.invalid_rows === 0 ? (
              <CheckCircle className="h-5 w-5 text-success-500 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-warning-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">
                Imported {importResult.valid_rows} of {importResult.total_rows} rows
              </p>
              {importResult.invalid_rows > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {importResult.invalid_rows} rows had errors
                </p>
              )}
              {importResult.errors.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {importResult.errors.slice(0, 5).map((error, idx) => (
                    <div key={idx} className="text-xs text-error-600 dark:text-error-400">
                      Row {error.row}: {error.error}
                    </div>
                  ))}
                  {importResult.errors.length > 5 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      ... and {importResult.errors.length - 5} more errors
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
