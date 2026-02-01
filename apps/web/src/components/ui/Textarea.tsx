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

    const paddingX = sizeConfig?.paddingX || '0.75rem';
    const paddingY = sizeConfig?.paddingY || '0.5rem';
    const fontSize = sizeConfig?.fontSize || '0.875rem';
    const borderRadius = sizeConfig?.borderRadius || '0.375rem';

    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-foreground mb-2">
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
              'block w-full rounded-xl transition-all duration-200 ease-natural', // Revamp UI - Border radius moderne
              'bg-[var(--color-input)]',
              'text-[var(--color-foreground)]',
              'placeholder:text-[var(--color-muted-foreground)]',
              'border border-border/60',
              'min-h-[120px]', // Revamp UI - Height minimale augmentée
              'shadow-sm hover:shadow-md', // Revamp UI - Hover effect
              'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2',
              'focus:border-primary-500 dark:focus:border-primary-400',
              'focus:shadow-primary', // Revamp UI - Ombre colorée au focus
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'resize-y',
              error &&
                'border-error-500 dark:border-error-400 focus:border-error-500 dark:focus:border-error-400 focus:ring-error-500 dark:focus:ring-error-400',
              leftIcon && 'pl-12', // Revamp UI - Espacement icône augmenté
              rightIcon && 'pr-12', // Revamp UI - Espacement icône augmenté
              className
            )}
            style={{
              paddingLeft: '1rem', // Revamp UI - Padding généreux
              paddingRight: '1rem',
              paddingTop: '0.75rem', // Revamp UI - Padding généreux
              paddingBottom: '0.75rem',
              fontSize: fontSize,
              borderRadius: '0.75rem', // Revamp UI - Border radius 12px
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
