/**
 * MultiSelect Component with Tags
 * Multi-select dropdown with tag display for SaaS applications
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

export interface MultiSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  group?: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  maxSelected?: number;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export default function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Sélectionnez des options...',
  label,
  error,
  helperText,
  maxSelected,
  searchable = true,
  clearable = true,
  disabled = false,
  className,
  fullWidth = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter((option) => {
    if (disabled || option.disabled) return false;
    if (!searchable || !search) return true;
    return option.label.toLowerCase().includes(search.toLowerCase());
  });

  // Group options
  const groupedOptions = filteredOptions.reduce(
    (acc, option) => {
      const group = option.group || 'Autres';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(option);
      return acc;
    },
    {} as Record<string, MultiSelectOption[]>
  );

  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      if (maxSelected && value.length >= maxSelected) return;
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const selectedOptions = options.filter((option) => value.includes(option.value));

  return (
    <div ref={containerRef} className={clsx('relative', fullWidth && 'w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      )}

      <div
        className={clsx(
          'min-h-[42px] w-full px-3 py-2 border rounded-lg',
          'bg-background',
          'text-foreground',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500 dark:focus-within:ring-primary-400 focus-within:border-transparent',
          error
            ? 'border-error-500 dark:border-error-400 focus-within:ring-error-500 dark:focus-within:ring-error-400'
            : 'border-border',
          disabled && 'bg-muted cursor-not-allowed opacity-60',
          'cursor-text'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5 items-center">
          {/* Selected Tags */}
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded-md text-sm"
            >
              {option.label}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemove(option.value, e)}
                  className="hover:text-primary-900 dark:hover:text-primary-100 focus:outline-none"
                  aria-label={`Remove ${option.label}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}

          {/* Input */}
          {searchable && (!maxSelected || value.length < maxSelected) && (
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder={value.length === 0 ? placeholder : ''}
              disabled={disabled}
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm"
              aria-label="Search options"
            />
          )}

          {/* Clear Button */}
          {clearable && value.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground focus:outline-none"
              aria-label="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Dropdown Icon */}
          <svg
            className={clsx('w-5 h-5 text-muted-foreground transition-transform', isOpen && 'transform rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={clsx(
            'absolute z-50 w-full mt-1 bg-background',
            'border border-border rounded-lg shadow-standard-lg', // UI Revamp - Nouveau système d'ombres
            'max-h-60 overflow-y-auto'
          )}
          role="listbox"
        >
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground text-center">Aucune option trouvée</div>
          ) : (
            <div className="py-1">
              {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <div key={group}>
                  {Object.keys(groupedOptions).length > 1 && (
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group}
                    </div>
                  )}
                  {groupOptions.map((option) => {
                    const isSelected = value.includes(option.value);
                    const isDisabled = !!(option.disabled || (maxSelected && !isSelected && value.length >= maxSelected));

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => !isDisabled && handleToggle(option.value)}
                        disabled={isDisabled}
                        className={clsx(
                          'w-full text-left px-3 py-2 text-sm transition-modern', // UI Revamp - Transition moderne
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
                            : 'text-foreground hover:bg-muted dark:hover:bg-muted',
                          isDisabled && 'opacity-50 cursor-not-allowed'
                        )}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={clsx(
                              'w-4 h-4 border rounded flex items-center justify-center',
                              isSelected
                                ? 'bg-primary-600 dark:bg-primary-500 border-primary-600 dark:border-primary-500'
                                : 'border-border'
                            )}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span>{option.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error/Helper Text */}
      {error && (
        <p className="mt-1 text-sm text-error-600 dark:text-error-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>}
    </div>
  );
}
