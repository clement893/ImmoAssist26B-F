'use client';

import { type ReactNode, memo } from 'react';
import { clsx } from 'clsx';
import { AlertVariant } from './types';
import Text from './Text';
import { X } from 'lucide-react';

export interface AlertProps {
  /** Alert variant style */
  variant?: AlertVariant;
  /** Alert title */
  title?: string;
  /** Alert content */
  children: ReactNode;
  /** Callback called when alert is closed */
  onClose?: () => void;
  /** Custom icon */
  icon?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const variantClasses = {
  info: {
    container: 'bg-primary-100 dark:bg-primary-900 border-primary-200 dark:border-primary-800',
    text: 'text-primary-900 dark:text-primary-100',
    title: 'text-primary-900 dark:text-primary-50 font-semibold',
    icon: 'text-primary-600 dark:text-primary-400',
  },
  success: {
    container: 'bg-secondary-100 dark:bg-secondary-900 border-secondary-200 dark:border-secondary-800',
    text: 'text-secondary-900 dark:text-secondary-100',
    title: 'text-secondary-900 dark:text-secondary-50 font-semibold',
    icon: 'text-secondary-600 dark:text-secondary-400',
  },
  warning: {
    container: 'bg-warning-100 dark:bg-warning-900 border-warning-200 dark:border-warning-800',
    text: 'text-warning-900 dark:text-warning-100',
    title: 'text-warning-900 dark:text-warning-50 font-semibold',
    icon: 'text-warning-600 dark:text-warning-400',
  },
  error: {
    container: 'bg-error-100 dark:bg-error-900 border-error-200 dark:border-error-800',
    text: 'text-error-900 dark:text-error-100',
    title: 'text-error-900 dark:text-error-50 font-semibold',
    icon: 'text-error-600 dark:text-error-400',
  },
};

const defaultIcons = {
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

function Alert({ variant = 'info', title, children, onClose, icon, className }: AlertProps) {
  const variantClass = variantClasses[variant] || variantClasses.info;
  const displayIcon = icon || defaultIcons[variant] || defaultIcons.info;

  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        variantClass.container,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={clsx('flex-shrink-0', variantClass.icon)}>{displayIcon}</div>
        <div className="flex-1 min-w-0">
          {title && (
            <Text variant="small" className={clsx('mb-1', variantClass.title)}>
              {title}
            </Text>
          )}
          <Text variant="small" className={variantClass.text}>
            {children}
          </Text>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={clsx(
              'flex-shrink-0 rounded-md p-1.5 transition-colors',
              'hover:bg-black/5 dark:hover:bg-white/5',
              variantClass.text
            )}
            aria-label="Close alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(Alert);
