'use client';
import { ReactNode, useEffect } from 'react';
import { clsx } from 'clsx';
import Text from './Text';
export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
  icon?: ReactNode;
}
export default function Toast({
  id,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  icon,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [id, duration, onClose]);
  const variants = {
    success: {
      bg: 'bg-secondary-50 dark:bg-secondary-900',
      border: 'border-secondary-200 dark:border-secondary-800',
      text: 'text-secondary-800 dark:text-secondary-200',
      icon: 'text-secondary-400',
    },
    error: {
      bg: 'bg-error-50 dark:bg-error-900',
      border: 'border-error-200 dark:border-error-800',
      text: 'text-error-800 dark:text-error-200',
      icon: 'text-error-400',
    },
    warning: {
      bg: 'bg-warning-50 dark:bg-warning-900',
      border: 'border-warning-200 dark:border-warning-800',
      text: 'text-warning-800 dark:text-warning-200',
      icon: 'text-warning-400',
    },
    info: {
      bg: 'bg-primary-50 dark:bg-primary-900',
      border: 'border-primary-200 dark:border-primary-800',
      text: 'text-primary-800 dark:text-primary-200',
      icon: 'text-primary-400',
    },
  };
  const styles = variants[type];
  return (
    <div
      className={clsx(
        'rounded-lg border p-lg shadow-lg min-w-[300px] max-w-md',
        'animate-slide-in-right',
        styles.bg,
        styles.border
      )}
    >
      {' '}
      <div className="flex items-start">
        {' '}
        {icon && <div className={clsx('flex-shrink-0 mr-4', styles.icon)}> {icon} </div>}{' '}
        <Text variant="small" className={clsx('flex-1 font-medium', styles.text)}>
          {' '}
          {message}{' '}
        </Text>{' '}
        <button
          onClick={() => onClose(id)}
          className={clsx(
            'ml-4 flex-shrink-0 p-1 rounded-md hover:bg-opacity-20 transition-colors',
            styles.text
          )}
          aria-label="Close toast"
        >
          {' '}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {' '}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />{' '}
          </svg>{' '}
        </button>{' '}
      </div>{' '}
    </div>
  );
}
