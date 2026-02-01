/** * Select Component * * Dropdown select component with label, error handling, helper text, and accessibility support. * Supports options array, placeholder text, disabled state, and full width layout. * * @component * @example * ```tsx * // Basic select * <Select * label="Country" * options={[ * { label:'France', value:'fr' }, * { label:'United States', value:'us' }, * ]} * placeholder="Select a country" * /> * ``` * * @example * ```tsx * // Select with error state * <Select * label="Country" * options={countryOptions} * error="Please select a country" * required * /> * ``` * * @example * ```tsx * // Controlled select with onChange * const [value, setValue] = useState(''); * * <Select * label="Country" * options={countryOptions} * value={value} * onChange={(e) => setValue(e.target.value)} * helperText="Select your country of residence" * /> * ``` * * @example * ```tsx * // Select with disabled options * <Select * label="Plan" * options={[ * { label:'Free', value:'free' }, * { label:'Pro', value:'pro' }, * { label:'Enterprise', value:'enterprise', disabled: true }, * ]} * /> * ``` * * @param {SelectProps} props - Component props * @param {SelectOption[]} props.options - Array of select options (required) * @param {string} [props.label] - Select label text * @param {string} [props.error] - Error message to display below select * @param {string} [props.helperText] - Helper text displayed below select (hidden when error is present) * @param {string} [props.placeholder] - Placeholder text for select * @param {boolean} [props.fullWidth=false] - Make select full width * @param {boolean} [props.required] - Mark select as required (adds asterisk to label) * @param {boolean} [props.disabled] - Disable select * @param {string} [props.value] - Controlled value * @param {(e: ChangeEvent<HTMLSelectElement>) => void} [props.onChange] - Change handler * @param {string} [props.className] - Additional CSS classes * @param {string} [props.id] - Select element ID (auto-generated if not provided) * * @returns {JSX.Element} Select component * * @see {@link SelectOption} SelectOption interface for option structure */ 'use client';
import { forwardRef, type SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { useComponentConfig } from '@/lib/theme/use-component-config';
import Text from './Text';
/** * Select option definition */ export interface SelectOption {
  /** Option display label */ label: string;
  /** Option value */ value: string;
  /** Disable this option */ disabled?: boolean;
}
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Select label text */ label?: string;
  /** Error message to display */ error?: string;
  /** Helper text displayed below select */ helperText?: string;
  /** Make select full width */ fullWidth?: boolean;
  /** Select options array */ options: SelectOption[];
  /** Placeholder text */ placeholder?: string;
}
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, helperText, className, fullWidth = false, options, placeholder, id, ...props },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substring(7)}`;
    const { getSize } = useComponentConfig('select');
    const sizeConfig = getSize('md');
    const paddingX = sizeConfig?.paddingX || '0.75rem';
    const paddingY = sizeConfig?.paddingY || '0.5rem';
    const fontSize = sizeConfig?.fontSize || '0.875rem';
    const borderRadius = sizeConfig?.borderRadius || '0.375rem';
    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        {' '}
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-foreground mb-2">
            {' '}
            {label}{' '}
            {props.required && (
              <span className="text-error-500 dark:text-error-400 ml-1" aria-label="required">
                *
              </span>
            )}{' '}
          </label>
        )}{' '}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'block w-full rounded-xl transition-all duration-200 ease-natural', // Revamp UI - Border radius moderne
            'bg-[var(--color-input)]',
            'text-foreground',
            'border border-border/60',
            'min-h-[48px]', // Revamp UI - Height augmentée
            'shadow-sm hover:shadow-md', // Revamp UI - Hover effect
            'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2',
            'focus:border-primary-500 dark:focus:border-primary-400',
            'focus:shadow-primary', // Revamp UI - Ombre colorée au focus
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error &&
              'border-error-500 dark:border-error-400 focus:border-error-500 dark:focus:border-error-400 focus:ring-error-500 dark:focus:ring-error-400',
            className
          )}
          style={{
            paddingLeft: '1rem', // Revamp UI - Padding généreux
            paddingRight: '1rem',
            paddingTop: '0.75rem', // Revamp UI - Padding généreux
            paddingBottom: '0.75rem',
            fontSize: fontSize,
            borderRadius: '0.75rem', // Revamp UI - Border radius 12px
            minHeight: '48px', // Revamp UI - Height par défaut
          }}
          {...props}
        >
          {' '}
          {placeholder && (
            <option value="" disabled>
              {' '}
              {placeholder}{' '}
            </option>
          )}{' '}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {' '}
              {option.label}{' '}
            </option>
          ))}{' '}
        </select>{' '}
        {error && (
          <Text variant="small" className="mt-2 text-error-600 dark:text-error-400" role="alert">
            {' '}
            {error}{' '}
          </Text>
        )}{' '}
        {helperText && !error && (
          <Text variant="small" className="mt-2 text-muted-foreground">
            {' '}
            {helperText}{' '}
          </Text>
        )}{' '}
      </div>
    );
  }
);
Select.displayName = 'Select';
export default Select;
