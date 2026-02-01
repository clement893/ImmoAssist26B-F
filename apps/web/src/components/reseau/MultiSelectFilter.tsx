'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui';
interface MultiSelectFilterOption {
  value: string;
  label: string;
}
interface MultiSelectFilterProps {
  label: string;
  options: MultiSelectFilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  className?: string;
}
export default function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onSelectionChange,
  className = '',
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter((v) => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };
  const removeValue = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedValues.filter((v) => v !== value));
  };
  const selectedLabels = options
    .filter((opt) => selectedValues.includes(opt.value))
    .map((opt) => opt.label);
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {' '}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between text-left"
      >
        {' '}
        <span className="truncate">
          {' '}
          {selectedValues.length === 0
            ? label
            : selectedValues.length === 1
              ? selectedLabels[0]
              : `${selectedValues.length} sélectionné(s)`}{' '}
        </span>{' '}
        <ChevronDown
          className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />{' '}
      </Button>{' '}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-standard-lg max-h-60 overflow-auto"> {/* UI Revamp - shadow-standard-lg */}
          {' '}
          <div className="p-2 space-y-1">
            {' '}
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                >
                  {' '}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOption(option.value)}
                    className="rounded border-border"
                  />{' '}
                  <span className="flex-1 text-sm">{option.label}</span>{' '}
                  {isSelected && (
                    <button
                      onClick={(e) => removeValue(option.value, e)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {' '}
                      <X className="w-3 h-3" />{' '}
                    </button>
                  )}{' '}
                </label>
              );
            })}{' '}
          </div>{' '}
        </div>
      )}{' '}
    </div>
  );
}
