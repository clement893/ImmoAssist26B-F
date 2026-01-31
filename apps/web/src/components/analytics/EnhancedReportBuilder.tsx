'use client';
import { useState } from 'react';
import { Plus, Trash2, Save, BarChart3, PieChart, LineChart, Table } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { DataExporter } from '@/components/data';
import { useToast } from '@/components/ui';
interface ReportConfig {
  name: string;
  description?: string;
  dataSource: string;
  filters: Array<{ field: string; operator: string; value: unknown }>;
  groupBy?: string[];
  aggregations: Array<{
    field: string;
    function: 'sum' | 'avg' | 'count' | 'min' | 'max';
    alias?: string;
  }>;
  chartType?: 'bar' | 'line' | 'pie' | 'table';
  sortBy?: { field: string; direction: 'asc' | 'desc' };
}
interface EnhancedReportBuilderProps {
  onSave?: (config: ReportConfig) => void;
  initialConfig?: ReportConfig;
  className?: string;
}
export function EnhancedReportBuilder({
  onSave,
  initialConfig,
  className = '',
}: EnhancedReportBuilderProps) {
  const [config, setConfig] = useState<ReportConfig>(
    initialConfig || { name: '', dataSource: '', filters: [], aggregations: [] }
  );
  const [reportData] = useState<Record<string, unknown>[]>([]);
  const { showToast } = useToast();
  const addFilter = () => {
    setConfig({
      ...config,
      filters: [...config.filters, { field: '', operator: 'equals', value: '' }],
    });
  };
  const removeFilter = (index: number) => {
    setConfig({ ...config, filters: config.filters.filter((_, i) => i !== index) });
  };
  const updateFilter = (index: number, updates: Partial<ReportConfig['filters'][0]>) => {
    const updatedFilters = config.filters.map((f, i) => (i === index ? { ...f, ...updates } : f));
    setConfig({ ...config, filters: updatedFilters });
  };
  const addAggregation = () => {
    setConfig({
      ...config,
      aggregations: [...config.aggregations, { field: '', function: 'sum', alias: '' }],
    });
  };
  const removeAggregation = (index: number) => {
    setConfig({ ...config, aggregations: config.aggregations.filter((_, i) => i !== index) });
  };
  const updateAggregation = (index: number, updates: Partial<ReportConfig['aggregations'][0]>) => {
    const updatedAggregations = config.aggregations.map((a, i) =>
      i === index ? { ...a, ...updates } : a
    );
    setConfig({ ...config, aggregations: updatedAggregations });
  };
  const handleSave = () => {
    if (!config.name.trim() || !config.dataSource.trim()) {
      showToast({ message: 'Name and data source are required', type: 'error' });
      return;
    }
    onSave?.(config);
    showToast({ message: 'Report configuration saved', type: 'success' });
  };
  return (
    <div className={`space-y-6 ${className}`}>
      {' '}
      {/* Basic Info */}{' '}
      <Card>
        {' '}
        <h3 className="text-lg font-semibold mb-4">Report Configuration</h3>{' '}
        <div className="space-y-4">
          {' '}
          <Input
            label="Report Name"
            value={config.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfig({ ...config, name: e.target.value })
            }
            placeholder="e.g., Monthly Sales Report"
            required
          />{' '}
          <div>
            {' '}
            <label className="block text-sm font-medium text-foreground mb-1">
              {' '}
              Description{' '}
            </label>{' '}
            <textarea
              value={config.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setConfig({ ...config, description: e.target.value })
              }
              placeholder="Describe what this report shows..."
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            />{' '}
          </div>{' '}
          <Input
            label="Data Source"
            value={config.dataSource}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfig({ ...config, dataSource: e.target.value })
            }
            placeholder="e.g., /api/v1/projects"
            required
          />{' '}
        </div>{' '}
      </Card>{' '}
      {/* Filters */}{' '}
      <Card>
        {' '}
        <div className="flex items-center justify-between mb-4">
          {' '}
          <h3 className="text-lg font-semibold">Filters</h3>{' '}
          <Button variant="outline" size="sm" onClick={addFilter}>
            {' '}
            <Plus className="h-4 w-4 mr-2" /> Add Filter{' '}
          </Button>{' '}
        </div>{' '}
        <div className="space-y-3">
          {' '}
          {config.filters.map((filter, index) => (
            <div key={index} className="flex gap-2 items-end">
              {' '}
              <Input
                label="Field"
                value={filter.field}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFilter(index, { field: e.target.value })
                }
                placeholder="Field name"
                className="flex-1"
              />{' '}
              <div className="flex-1">
                {' '}
                <label className="block text-sm font-medium text-foreground mb-1">
                  {' '}
                  Operator{' '}
                </label>{' '}
                <select
                  value={filter.operator}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    updateFilter(index, { operator: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  {' '}
                  <option value="equals">Equals</option> <option value="contains">Contains</option>{' '}
                  <option value="gte">Greater than or equal</option>{' '}
                  <option value="lte">Less than or equal</option>{' '}
                  <option value="in">In list</option>{' '}
                </select>{' '}
              </div>{' '}
              <Input
                label="Value"
                value={String(filter.value || '')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateFilter(index, { value: e.target.value })
                }
                placeholder="Filter value"
                className="flex-1"
              />{' '}
              <button
                onClick={() => removeFilter(index)}
                className="p-2 hover:bg-error-50 dark:hover:bg-error-900/20 rounded text-error-500"
              >
                {' '}
                <Trash2 className="h-4 w-4" />{' '}
              </button>{' '}
            </div>
          ))}{' '}
          {config.filters.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No filters added</p>
          )}{' '}
        </div>{' '}
      </Card>{' '}
      {/* Aggregations */}{' '}
      <Card>
        {' '}
        <div className="flex items-center justify-between mb-4">
          {' '}
          <h3 className="text-lg font-semibold">Aggregations</h3>{' '}
          <Button variant="outline" size="sm" onClick={addAggregation}>
            {' '}
            <Plus className="h-4 w-4 mr-2" /> Add Aggregation{' '}
          </Button>{' '}
        </div>{' '}
        <div className="space-y-3">
          {' '}
          {config.aggregations.map((agg, index) => (
            <div key={index} className="flex gap-2 items-end">
              {' '}
              <Input
                label="Field"
                value={agg.field}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateAggregation(index, { field: e.target.value })
                }
                placeholder="Field name"
                className="flex-1"
              />{' '}
              <div className="flex-1">
                {' '}
                <label className="block text-sm font-medium text-foreground mb-1">
                  {' '}
                  Function{' '}
                </label>{' '}
                <select
                  value={agg.function}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    updateAggregation(index, {
                      function: e.target.value as ReportConfig['aggregations'][0]['function'],
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  {' '}
                  <option value="sum">Sum</option> <option value="avg">Average</option>{' '}
                  <option value="count">Count</option> <option value="min">Min</option>{' '}
                  <option value="max">Max</option>{' '}
                </select>{' '}
              </div>{' '}
              <Input
                label="Alias (optional)"
                value={agg.alias || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateAggregation(index, { alias: e.target.value })
                }
                placeholder="Display name"
                className="flex-1"
              />{' '}
              <button
                onClick={() => removeAggregation(index)}
                className="p-2 hover:bg-error-50 dark:hover:bg-error-900/20 rounded text-error-500"
              >
                {' '}
                <Trash2 className="h-4 w-4" />{' '}
              </button>{' '}
            </div>
          ))}{' '}
          {config.aggregations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No aggregations added</p>
          )}{' '}
        </div>{' '}
      </Card>{' '}
      {/* Chart Type */}{' '}
      <Card>
        {' '}
        <h3 className="text-lg font-semibold mb-4">Visualization</h3>{' '}
        <div className="grid grid-cols-4 gap-2">
          {' '}
          {(['bar', 'line', 'pie', 'table'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setConfig({ ...config, chartType: type })}
              className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${config.chartType === type ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-border'}`}
            >
              {' '}
              {type === 'bar' && <BarChart3 className="h-6 w-6" />}{' '}
              {type === 'line' && <LineChart className="h-6 w-6" />}{' '}
              {type === 'pie' && <PieChart className="h-6 w-6" />}{' '}
              {type === 'table' && <Table className="h-6 w-6" />}{' '}
              <span className="text-xs capitalize">{type}</span>{' '}
            </button>
          ))}{' '}
        </div>{' '}
      </Card>{' '}
      {/* Export */}{' '}
      {reportData.length > 0 && (
        <Card>
          {' '}
          <div className="flex items-center justify-between">
            {' '}
            <h3 className="text-lg font-semibold">Export Report</h3>{' '}
            <DataExporter data={reportData} filename={config.name} />{' '}
          </div>{' '}
        </Card>
      )}{' '}
      {/* Save Button */}{' '}
      <div className="flex justify-end">
        {' '}
        <Button variant="primary" onClick={handleSave}>
          {' '}
          <Save className="h-4 w-4 mr-2" /> Save Report Configuration{' '}
        </Button>{' '}
      </div>{' '}
    </div>
  );
}
