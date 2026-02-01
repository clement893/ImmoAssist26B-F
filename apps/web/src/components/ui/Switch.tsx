/**
 * Switch Component
 * Toggle switch component
 */
'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, error, className, fullWidth = false, id, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substring(7)}`;

    return (
      <div className={clsx('flex items-center', fullWidth && 'w-full')}>
        <label htmlFor={switchId} className="relative inline-flex items-center cursor-pointer">
          <input ref={ref} type="checkbox" id={switchId} className="sr-only peer" {...props} />
          <div
            className={clsx(
              "bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 dark:peer-focus:ring-primary-400 peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-2 after:border-border after:rounded-full after:transition-all duration-200 ease-natural peer-checked:bg-primary-600 dark:peer-checked:bg-primary-500 shadow-sm peer-checked:shadow-primary", // Revamp UI - Ring amélioré, transitions fluides, ombre
              error && 'ring-2 ring-error-500 dark:ring-error-400',
              className
            )}
            style={{
              width: '2.75rem', // Revamp UI - Largeur augmentée
              height: '1.5rem', // Revamp UI - Hauteur augmentée
              borderRadius: '9999px',
            }}
          />
          {label && (
            <span
              className={clsx(
                'ml-3 text-sm font-medium text-foreground',
                error && 'text-error-600 dark:text-error-400',
                props.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {label}
            </span>
          )}
        </label>
        {error && (
          <p className="ml-2 text-sm text-error-600 dark:text-error-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
