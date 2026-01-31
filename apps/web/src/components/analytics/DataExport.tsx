/** * Data Export Component * Export data in various formats */ 'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { SelectOption } from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import { Download, FileText, FileSpreadsheet, File, Database } from 'lucide-react';
export interface ExportField {
  id: string;
  name: string;
  selected: boolean;
}
export interface DataExportProps {
  fields?: ExportField[];
  onExport?: (config: ExportConfig) => void | Promise<void>;
  className?: string;
}
export interface ExportConfig {
  format: 'csv' | 'json' | 'excel' | 'pdf';
  fields: string[];
  includeHeaders: boolean;
  dateRange?: { start: string; end: string };
}
const formatOptions: SelectOption[] = [
  { label: 'CSV', value: 'csv' },
  { label: 'JSON', value: 'json' },
  { label: 'Excel', value: 'excel' },
  { label: 'PDF', value: 'pdf' },
];
const defaultFields: ExportField[] = [
  { id: 'id', name: 'ID', selected: true },
  { id: 'name', name: 'Name', selected: true },
  { id: 'email', name: 'Email', selected: true },
  { id: 'created_at', name: 'Created At', selected: true },
  { id: 'updated_at', name: 'Updated At', selected: false },
  { id: 'status', name: 'Status', selected: true },
];
export default function DataExport({
  fields = defaultFields,
  onExport,
  className,
}: DataExportProps) {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'csv',
    fields: fields.filter((f) => f.selected).map((f) => f.id),
    includeHeaders: true,
  });
  const [localFields, setLocalFields] = useState<ExportField[]>(fields);
  const [loading, setLoading] = useState(false);
  const handleFieldToggle = (fieldId: string) => {
    setLocalFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, selected: !f.selected } : f))
    );
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.includes(fieldId)
        ? prev.fields.filter((id) => id !== fieldId)
        : [...prev.fields, fieldId],
    }));
  };
  const handleSelectAll = () => {
    const allSelected = localFields.every((f) => f.selected);
    const newFields = localFields.map((f) => ({ ...f, selected: !allSelected }));
    setLocalFields(newFields);
    setConfig((prev) => ({ ...prev, fields: !allSelected ? newFields.map((f) => f.id) : [] }));
  };
  const handleExport = async () => {
    if (config.fields.length === 0) return;
    setLoading(true);
    try {
      await onExport?.(config);
    } finally {
      setLoading(false);
    }
  };
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'json':
        return <Database className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };
  return (
    <Card className={clsx('bg-background', className)}>
      {' '}
      <div className="space-y-6">
        {' '}
        <div className="flex items-center gap-2 mb-4">
          {' '}
          <Download className="w-5 h-5 text-primary-600 dark:text-primary-400" />{' '}
          <h3 className="text-lg font-semibold text-foreground"> Export Data </h3>{' '}
        </div>{' '}
        {/* Format Selection */}{' '}
        <div>
          {' '}
          <label className="block text-sm font-medium text-foreground mb-2">
            {' '}
            Export Format{' '}
          </label>{' '}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {' '}
            {formatOptions.map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setConfig({ ...config, format: option.value as ExportConfig['format'] })
                }
                className={clsx(
                  'p-4 border-2 rounded-lg transition-all',
                  'flex flex-col items-center gap-2',
                  config.format === option.value
                    ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-border hover:border-border dark:hover:border-border',
                  'bg-background'
                )}
              >
                {' '}
                <div className="text-primary-600 dark:text-primary-400">
                  {' '}
                  {getFormatIcon(option.value)}{' '}
                </div>{' '}
                <span className="text-sm font-medium text-foreground"> {option.label} </span>{' '}
              </button>
            ))}{' '}
          </div>{' '}
        </div>{' '}
        {/* Field Selection */}{' '}
        <div>
          {' '}
          <div className="flex items-center justify-between mb-3">
            {' '}
            <label className="block text-sm font-medium text-foreground">
              {' '}
              Select Fields{' '}
            </label>{' '}
            <button
              onClick={handleSelectAll}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              {' '}
              {localFields.every((f) => f.selected) ? 'Deselect All' : 'Select All'}{' '}
            </button>{' '}
          </div>{' '}
          <div className="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-4">
            {' '}
            {localFields.map((field) => (
              <label
                key={field.id}
                className="flex items-center gap-3 p-2 hover:bg-muted dark:hover:bg-background rounded-lg cursor-pointer"
              >
                {' '}
                <Checkbox
                  checked={field.selected}
                  onChange={() => handleFieldToggle(field.id)}
                />{' '}
                <span className="text-sm text-foreground"> {field.name} </span>{' '}
              </label>
            ))}{' '}
          </div>{' '}
          <div className="text-xs text-muted-foreground mt-2">
            {' '}
            {config.fields.length} field{config.fields.length !== 1 ? 's' : ''} selected{' '}
          </div>{' '}
        </div>{' '}
        {/* Options */}{' '}
        <div className="space-y-3">
          {' '}
          <label className="flex items-center gap-3 cursor-pointer">
            {' '}
            <Checkbox
              checked={config.includeHeaders}
              onChange={(e) => setConfig({ ...config, includeHeaders: e.target.checked })}
            />{' '}
            <span className="text-sm text-foreground"> Include column headers </span>{' '}
          </label>{' '}
        </div>{' '}
        {/* Export Button */}{' '}
        <div className="pt-4 border-t border-border">
          {' '}
          <Button
            variant="primary"
            fullWidth
            onClick={handleExport}
            loading={loading}
            disabled={config.fields.length === 0}
          >
            {' '}
            <span className="flex items-center gap-2">
              {' '}
              <Download className="w-4 h-4" /> Export {config.format.toUpperCase()}{' '}
            </span>{' '}
          </Button>{' '}
        </div>{' '}
      </div>{' '}
    </Card>
  );
}
