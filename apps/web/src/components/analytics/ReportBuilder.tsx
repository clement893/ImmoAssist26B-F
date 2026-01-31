/** * Report Builder Component * Custom report generation and configuration */ 'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';
import Checkbox from '@/components/ui/Checkbox';
import Badge from '@/components/ui/Badge';
import { Save, FileText, Calendar } from 'lucide-react';
export interface ReportField {
  id: string;
  name: string;
  type: 'metric' | 'dimension' | 'date';
  selected: boolean;
}
export interface ReportConfig {
  name: string;
  description?: string;
  dateRange: { start: string; end: string };
  fields: ReportField[];
  groupBy?: string;
  sortBy?: string;
  format: 'table' | 'chart' | 'both';
}
export interface ReportBuilderProps {
  availableFields?: ReportField[];
  onSave?: (config: ReportConfig) => void | Promise<void>;
  onPreview?: (config: ReportConfig) => void;
  className?: string;
}
const defaultFields: ReportField[] = [
  { id: 'revenue', name: 'Revenue', type: 'metric', selected: false },
  { id: 'users', name: 'Active Users', type: 'metric', selected: false },
  { id: 'conversions', name: 'Conversions', type: 'metric', selected: false },
  { id: 'date', name: 'Date', type: 'date', selected: false },
  { id: 'country', name: 'Country', type: 'dimension', selected: false },
  { id: 'source', name: 'Traffic Source', type: 'dimension', selected: false },
  { id: 'device', name: 'Device Type', type: 'dimension', selected: false },
];
const formatOptions: SelectOption[] = [
  { label: 'Table', value: 'table' },
  { label: 'Chart', value: 'chart' },
  { label: 'Both', value: 'both' },
];
export default function ReportBuilder({
  availableFields = defaultFields,
  onSave,
  onPreview,
  className,
}: ReportBuilderProps) {
  const [config, setConfig] = useState<ReportConfig>({
    name: '',
    description: '',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
      end: new Date().toISOString().split('T')[0]!,
    },
    fields: availableFields.map((f) => ({ ...f, selected: false })),
    format: 'both',
  });
  const [loading, setLoading] = useState(false);
  const handleFieldToggle = (fieldId: string) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, selected: !f.selected } : f)),
    }));
  };
  const handleSave = async () => {
    if (!config.name.trim()) return;
    if (config.fields.filter((f) => f.selected).length === 0) return;
    setLoading(true);
    try {
      await onSave?.(config);
    } finally {
      setLoading(false);
    }
  };
  const selectedFields = config.fields.filter((f) => f.selected);
  return (
    <Card className={clsx('bg-background', className)}>
      {' '}
      <div className="space-y-6">
        {' '}
        {/* Report Info */}{' '}
        <div className="space-y-4">
          {' '}
          <div className="flex items-center gap-2 mb-4">
            {' '}
            <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />{' '}
            <h3 className="text-lg font-semibold text-foreground"> Report Builder </h3>{' '}
          </div>{' '}
          <Input
            label="Report Name"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            placeholder="My Custom Report"
            required
          />{' '}
          <Input
            label="Description (Optional)"
            value={config.description || ''}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            placeholder="Describe what this report shows"
          />{' '}
        </div>{' '}
        {/* Date Range */}{' '}
        <div className="space-y-4">
          {' '}
          <div className="flex items-center gap-2 mb-2">
            {' '}
            <Calendar className="w-4 h-4 text-muted-foreground" />{' '}
            <label className="text-sm font-medium text-foreground"> Date Range </label>{' '}
          </div>{' '}
          <div className="grid grid-cols-2 gap-4">
            {' '}
            <Input
              type="date"
              value={config.dateRange.start}
              onChange={(e) =>
                setConfig({ ...config, dateRange: { ...config.dateRange, start: e.target.value } })
              }
            />{' '}
            <Input
              type="date"
              value={config.dateRange.end}
              onChange={(e) =>
                setConfig({ ...config, dateRange: { ...config.dateRange, end: e.target.value } })
              }
            />{' '}
          </div>{' '}
        </div>{' '}
        {/* Fields Selection */}{' '}
        <div className="space-y-4">
          {' '}
          <label className="block text-sm font-medium text-foreground"> Select Fields </label>{' '}
          <div className="space-y-3 max-h-64 overflow-y-auto border border-border rounded-lg p-4">
            {' '}
            {config.fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between p-2 hover:bg-muted dark:hover:bg-background rounded-lg"
              >
                {' '}
                <div className="flex items-center gap-3">
                  {' '}
                  <Checkbox
                    checked={field.selected}
                    onChange={() => handleFieldToggle(field.id)}
                  />{' '}
                  <div>
                    {' '}
                    <div className="text-sm font-medium text-foreground"> {field.name} </div>{' '}
                    <div className="text-xs text-muted-foreground"> {field.type} </div>{' '}
                  </div>{' '}
                </div>{' '}
                <Badge
                  variant={
                    field.type === 'metric' ? 'info' : field.type === 'date' ? 'warning' : 'default'
                  }
                >
                  {' '}
                  {field.type}{' '}
                </Badge>{' '}
              </div>
            ))}{' '}
          </div>{' '}
          {selectedFields.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {' '}
              {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected{' '}
            </div>
          )}{' '}
        </div>{' '}
        {/* Grouping & Sorting */}{' '}
        {selectedFields.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {' '}
            <Select
              label="Group By"
              options={[
                { label: 'None', value: '' },
                ...selectedFields
                  .filter((f) => f.type === 'dimension')
                  .map((f) => ({ label: f.name, value: f.id })),
              ]}
              value={config.groupBy || ''}
              onChange={(e) => setConfig({ ...config, groupBy: e.target.value })}
            />{' '}
            <Select
              label="Sort By"
              options={[
                { label: 'None', value: '' },
                ...selectedFields.map((f) => ({ label: f.name, value: f.id })),
              ]}
              value={config.sortBy || ''}
              onChange={(e) => setConfig({ ...config, sortBy: e.target.value })}
            />{' '}
          </div>
        )}{' '}
        {/* Format */}{' '}
        <Select
          label="Report Format"
          options={formatOptions}
          value={config.format}
          onChange={(e) =>
            setConfig({ ...config, format: e.target.value as 'table' | 'chart' | 'both' })
          }
        />{' '}
        {/* Actions */}{' '}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          {' '}
          {onPreview && (
            <Button
              variant="outline"
              onClick={() => onPreview(config)}
              disabled={!config.name.trim() || selectedFields.length === 0}
            >
              {' '}
              Preview{' '}
            </Button>
          )}{' '}
          <Button
            variant="primary"
            onClick={handleSave}
            loading={loading}
            disabled={!config.name.trim() || selectedFields.length === 0}
          >
            {' '}
            <span className="flex items-center gap-2">
              {' '}
              <Save className="w-4 h-4" /> Save Report{' '}
            </span>{' '}
          </Button>{' '}
        </div>{' '}
      </div>{' '}
    </Card>
  );
}
