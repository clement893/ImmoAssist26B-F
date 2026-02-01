/** * Autocomplete Component * Searchable input with suggestions dropdown */ 'use client';
import { useState, useRef, useEffect, forwardRef } from 'react';
import { clsx } from 'clsx';
import Input from './Input';
export interface AutocompleteOption {
  label: string;
  value: string;
  disabled?: boolean;
  group?: string;
}
export interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  loading?: boolean;
  filterOptions?: (options: AutocompleteOption[], searchTerm: string) => AutocompleteOption[];
  renderOption?: (option: AutocompleteOption) => React.ReactNode;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  maxHeight?: string;
  minChars?: number;
  fullWidth?: boolean;
}
const defaultFilterOptions = (
  options: AutocompleteOption[],
  searchTerm: string
): AutocompleteOption[] => {
  if (!searchTerm) return options;
  const term = searchTerm.toLowerCase();
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(term) || option.value.toLowerCase().includes(term)
  );
};
const Autocomplete = forwardRef<HTMLInputElement, AutocompleteProps>(
  (
    {
      options,
      value = '',
      onChange,
      onSelect,
      placeholder,
      label,
      error,
      helperText,
      disabled,
      loading,
      filterOptions = defaultFilterOptions,
      renderOption,
      className,
      inputClassName,
      dropdownClassName,
      maxHeight = 'max-h-60',
      minChars = 0,
      fullWidth = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const filteredOptions = filterOptions(options, searchTerm);
    useEffect(() => {
      setSearchTerm(value);
    }, [value]);
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setSearchTerm(newValue);
      onChange?.(newValue);
      setIsOpen(newValue.length >= minChars);
      setHighlightedIndex(-1);
    };
    const handleSelect = (option: AutocompleteOption) => {
      if (option.disabled) return;
      setSearchTerm(option.label);
      onChange?.(option.value);
      onSelect?.(option);
      setIsOpen(false);
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || filteredOptions.length === 0) {
        if (e.key === 'Enter') {
          setIsOpen(true);
        }
        return;
      }
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };
    const handleFocus = () => {
      if (searchTerm.length >= minChars) {
        setIsOpen(true);
      }
    };
    return (
      <div ref={containerRef} className={clsx('relative', fullWidth && 'w-full', className)}>
        {' '}
        <Input
          ref={ref}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          label={label}
          error={error}
          helperText={helperText}
          disabled={disabled}
          className={inputClassName}
          rightIcon={
            loading ? (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                {' '}
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />{' '}
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />{' '}
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {' '}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />{' '}
              </svg>
            )
          }
        />{' '}
        {/* Dropdown */}{' '}
        {isOpen && filteredOptions.length > 0 && (
          <div
            ref={dropdownRef}
            className={clsx(
              'absolute z-50 w-full mt-1 bg-background',
              'border border-border rounded-lg shadow-standard-xl', // UI Revamp - Nouveau système d'ombres (shadow-strong → shadow-standard-xl)
              'overflow-y-auto',
              maxHeight,
              dropdownClassName
            )}
          >
            {' '}
            {filteredOptions.map((option, index) => {
              const isHighlighted = index === highlightedIndex;
              const isDisabled = option.disabled;
              return (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={clsx(
                    'px-4 py-2 cursor-pointer transition-modern', // UI Revamp - Transition moderne
                    isHighlighted && !isDisabled
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
                      : 'text-foreground',
                    isDisabled && 'opacity-50 cursor-not-allowed',
                    !isDisabled && 'hover:bg-muted dark:hover:bg-muted'
                  )}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {' '}
                  {renderOption ? (
                    renderOption(option)
                  ) : (
                    <div className="flex items-center justify-between">
                      {' '}
                      <span>{option.label}</span>{' '}
                      {option.group && (
                        <span className="text-xs text-muted-foreground"> {option.group} </span>
                      )}{' '}
                    </div>
                  )}{' '}
                </div>
              );
            })}{' '}
          </div>
        )}{' '}
        {/* No results */}{' '}
        {isOpen && searchTerm.length >= minChars && filteredOptions.length === 0 && !loading && (
          <div
            className={clsx(
              'absolute z-50 w-full mt-1 bg-background',
              'border border-border rounded-lg shadow-standard-xl', // UI Revamp - Nouveau système d'ombres (shadow-strong → shadow-standard-xl)
              'px-4 py-2 text-muted-foreground text-sm'
            )}
          >
            {' '}
            Aucun résultat trouvé{' '}
          </div>
        )}{' '}
      </div>
    );
  }
);
Autocomplete.displayName = 'Autocomplete';
export default Autocomplete;
