/** * FormField Component * * Shared wrapper component for form fields (Input, Select, Textarea, etc.) * Reduces code duplication by providing consistent label, error, and helper text handling. * * @example * ```tsx * <FormField label="Email" error={error} helperText="Enter your email" required> * <Input type="email" /> * </FormField> * ``` */ 'use client';
import { type ReactNode, cloneElement, isValidElement } from 'react';
import { clsx } from 'clsx';
import Text from './Text';
export interface FormFieldProps {
  /** Field name (for form submission) */ name?: string;
  /** Field label text */ label?: string;
  /** Error message to display */ error?: string;
  /** Helper text displayed below field (hidden when error is present) */ helperText?: string;
  /** Make field full width */ fullWidth?: boolean;
  /** Mark field as required (adds asterisk to label) */ required?: boolean;
  /** Field element ID (auto-generated if not provided) */ id?: string;
  /** Field element to wrap */ children: ReactNode;
  /** Additional CSS classes */ className?: string;
  /** Left icon */ leftIcon?: ReactNode;
  /** Right icon */ rightIcon?: ReactNode;
}
/** * FormField - Shared wrapper for form fields * Provides consistent label, error, and helper text rendering */ export function FormField({
  name,
  label,
  error,
  helperText,
  fullWidth = false,
  required = false,
  id,
  children,
  className,
  leftIcon,
  rightIcon,
}: FormFieldProps) {
  const fieldId = id || name || `field-${Math.random().toString(36).substring(7)}`;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helperId = helperText && !error ? `${fieldId}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join('') || undefined;
  return (
    <div className={clsx('flex flex-col', fullWidth && 'w-full', className)}>
      {' '}
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-foreground mb-2">
          {' '}
          {label}{' '}
          {required && (
            <span className="text-error-500 dark:text-error-400 ml-1" aria-label="required">
              {' '}
              *{' '}
            </span>
          )}{' '}
        </label>
      )}{' '}
      <div className="relative">
        {' '}
        {leftIcon && (
          <div
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
            aria-hidden="true"
          >
            {' '}
            {leftIcon}{' '}
          </div>
        )}{' '}
        {/* Clone children and inject id, name, and aria attributes */}{' '}
        {isValidElement(children)
          ? cloneElement(children as React.ReactElement, {
              id: fieldId,
              name: name || (children as React.ReactElement).props?.name,
              'aria-invalid': error ? 'true' : undefined,
              'aria-describedby': describedBy,
              'aria-required': required,
            })
          : children}{' '}
        {rightIcon && (
          <div
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
            aria-hidden="true"
          >
            {' '}
            {rightIcon}{' '}
          </div>
        )}{' '}
      </div>{' '}
      {error && (
        <Text
          id={errorId}
          variant="small"
          className="mt-2 text-error-600 dark:text-error-400"
          role="alert"
        >
          {' '}
          {error}{' '}
        </Text>
      )}{' '}
      {helperText && !error && (
        <Text id={helperId} variant="small" className="mt-2 text-muted-foreground">
          {' '}
          {helperText}{' '}
        </Text>
      )}{' '}
    </div>
  );
}
