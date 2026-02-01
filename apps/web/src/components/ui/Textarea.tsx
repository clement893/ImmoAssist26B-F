/**
 * Textarea Component
 *
 * Multi-line text input component
 */
'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { useComponentConfig } from '@/lib/theme/use-component-config';
import Text from './Text';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, helperText, className, fullWidth = false, leftIcon, rightIcon, id, ...props },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substring(7)}`;

    const { getSize } = useComponentConfig('textarea');
    const sizeConfig = getSize('md');

    const fontSize = sizeConfig?.fontSize || '0.875rem';

    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-light text-gray-600 mb-2">
            {label}
            {props.required && (
              <span className="text-error-500 dark:text-error-400 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-3 text-muted-foreground">{leftIcon}</div>
          )}

          <textarea
            ref={ref}
            id={textareaId}
            className={clsx(
              'block w-full border-0 rounded-xl transition-all duration-200', // UI Revamp - Style démo pages
              'bg-white dark:bg-neutral-900 text-gray-900 dark:text-neutral-100',
              'placeholder:text-gray-400 placeholder:font-light',
              'min-h-[120px]',
              'shadow-sm', // UI Revamp - Style démo pages
              'text-sm font-light', // UI Revamp - Typographie légère
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0', // UI Revamp - Focus ring bleu
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50',
              'resize-y',
              error &&
                'border-2 border-error-500 focus:ring-error-500',
              leftIcon && 'pl-12',
              rightIcon && 'pr-12',
              className
            )}
            style={{
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              fontSize: fontSize,
              borderRadius: '0.75rem',
            }}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-3 text-muted-foreground">{rightIcon}</div>
          )}
        </div>

        {error && (
          <Text variant="small" className="mt-2 text-error-600 dark:text-error-400" role="alert">
            {error}
          </Text>
        )}

        {helperText && !error && (
          <Text variant="small" className="mt-2 text-muted-foreground">
            {helperText}
          </Text>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
