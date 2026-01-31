import { ReactNode, memo } from 'react';
import { clsx } from 'clsx';
import { ColorVariant } from './types';

export interface BadgeProps {
  children: ReactNode;
  variant?: ColorVariant;
  className?: string;
}

function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-muted text-foreground',
    success: 'bg-success-50 dark:bg-success-900 text-success-900 dark:text-success-300',
    warning: 'bg-warning-50 dark:bg-warning-900 text-warning-900 dark:text-warning-300',
    error: 'bg-error-50 dark:bg-error-900 text-error-900 dark:text-error-300',
    info: 'bg-info-50 dark:bg-info-900 text-info-900 dark:text-info-300',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium',
        variants[variant] || variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}

export default memo(Badge);
