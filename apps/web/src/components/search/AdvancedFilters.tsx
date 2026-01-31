'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Filter, X } from 'lucide-react';
export interface FilterConfig {
  field: string;
  operator: 'equals' | 'contains' | 'gte' | 'lte' | 'gt' | 'lt' | 'in' | 'ne';
  value: string | number | string[];
  label?: string;
}
interface AdvancedFiltersProps {
  filters: FilterConfig[];
  onFiltersChange: (filters: FilterConfig[]) => void;
  availableFields: Array<{ value: string; label: string; type: 'string' | 'number' | 'date' }>;
  className?: string;
}
export function AdvancedFilters({
  filters,
  onFiltersChange,
  availableFields,
  className = '',
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<FilterConfig>>({ operator: 'equals' });
  const addFilter = () => {
    if (newFilter.field && newFilter.value !== undefined && newFilter.value !== '') {
      const fieldConfig = availableFields.find((f) => f.value === newFilter.field);
      const filter: FilterConfig = {
        field: newFilter.field,
        operator: newFilter.operator || 'equals',
        value: newFilter.value,
        label: fieldConfig?.label || newFilter.field,
      };
      onFiltersChange([...filters, filter]);
      setNewFilter({ operator: 'equals' });
    }
  };
  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };
  return (
    <div className={className}>
      {' '}
      <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
        {' '}
        <Filter className="h-4 w-4 mr-2" /> Filters{' '}
        {filters.length > 0 && `(${filters.length})`}{' '}
      </Button>{' '}
      {isOpen && (
        <div className="mt-2 p-4 bg-background border border-border rounded-lg shadow-lg">
          {' '}
          <div className="space-y-4">
            {' '}
            {/* Active Filters */}{' '}
            {filters.length > 0 && (
              <div className="space-y-2">
                {' '}
                <h4 className="text-sm font-semibold">Active Filters</h4>{' '}
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    {' '}
                    <span className="text-sm flex-1">
                      {' '}
                      {filter.label || filter.field} {filter.operator} {String(filter.value)}{' '}
                    </span>{' '}
                    <button
                      onClick={() => removeFilter(index)}
                      className="text-error-500 hover:text-error-700"
                    >
                      {' '}
                      <X className="h-4 w-4" />{' '}
                    </button>{' '}
                  </div>
                ))}{' '}
              </div>
            )}{' '}
            {/* Add New Filter */}{' '}
            <div className="space-y-2">
              {' '}
              <h4 className="text-sm font-semibold">Add Filter</h4>{' '}
              <div className="grid grid-cols-3 gap-2">
                {' '}
                <select
                  value={newFilter.field || ''}
                  onChange={(e) => setNewFilter({ ...newFilter, field: e.target.value })}
                  className="px-3 py-2 border border-border rounded-lg bg-background"
                >
                  {' '}
                  <option value="">Select field</option>{' '}
                  {availableFields.map((field) => (
                    <option key={field.value} value={field.value}>
                      {' '}
                      {field.label}{' '}
                    </option>
                  ))}{' '}
                </select>{' '}
                <select
                  value={newFilter.operator || 'equals'}
                  onChange={(e) =>
                    setNewFilter({
                      ...newFilter,
                      operator: e.target.value as FilterConfig['operator'],
                    })
                  }
                  className="px-3 py-2 border border-border rounded-lg bg-background"
                >
                  {' '}
                  <option value="equals">Equals</option> <option value="contains">Contains</option>{' '}
                  <option value="gte">Greater than or equal</option>{' '}
                  <option value="lte">Less than or equal</option>{' '}
                  <option value="gt">Greater than</option> <option value="lt">Less than</option>{' '}
                  <option value="in">In list</option> <option value="ne">Not equal</option>{' '}
                </select>{' '}
                <div className="flex gap-2">
                  {' '}
                  <Input
                    type="text"
                    placeholder="Value"
                    value={String(newFilter.value || '')}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const fieldConfig = availableFields.find((f) => f.value === newFilter.field);
                      const value =
                        fieldConfig?.type === 'number'
                          ? parseFloat(e.target.value) || 0
                          : e.target.value;
                      setNewFilter({ ...newFilter, value });
                    }}
                    className="flex-1"
                  />{' '}
                  <Button onClick={addFilter} size="sm" variant="primary">
                    {' '}
                    Add{' '}
                  </Button>{' '}
                </div>{' '}
              </div>{' '}
            </div>{' '}
          </div>{' '}
        </div>
      )}{' '}
    </div>
  );
}
