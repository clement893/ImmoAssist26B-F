/**
 * DatePicker Component
 * Date input component
 */
'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import Input from './Input';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  format?: 'date' | 'datetime-local' | 'time' | 'month' | 'week';
  type?: 'date' | 'datetime-local' | 'time' | 'month' | 'week';
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, helperText, className, fullWidth = false, format, type, ...props }, ref) => {
    // Use format prop if provided, otherwise use type prop, otherwise default to 'date'
    const inputType = format || type || 'date';

    return (
      <Input
        ref={ref}
        type={inputType}
        label={label}
        error={error}
        helperText={helperText}
        fullWidth={fullWidth}
        className={className}
        {...props}
      />
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
