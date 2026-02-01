/** * Radio Component * Radio button component */ 'use client';
import { forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}
const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, error, className, fullWidth = false, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substring(7)}`;
    return (
      <div className={clsx('flex items-center', fullWidth && 'w-full')}>
        {' '}
        <input
          ref={ref}
          type="radio"
          id={radioId}
          className={clsx(
            'text-primary-600 dark:text-primary-400 border-2 border-border', // Revamp UI - Border épaisseur augmentée
            'transition-all duration-200 ease-natural', // Revamp UI - Transitions fluides
            'focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2', // Revamp UI - Ring offset augmenté
            'hover:border-primary-400 dark:hover:border-primary-500', // Revamp UI - Hover effect
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-error-500 dark:border-error-400',
            className
          )}
          style={{ width: '1.25rem', height: '1.25rem' }} // Revamp UI - Taille augmentée
          {...props}
        />{' '}
        {label && (
          <label
            htmlFor={radioId}
            className={clsx(
              'ml-2 text-sm font-medium text-foreground',
              error && 'text-error-600 dark:text-error-400',
              props.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {' '}
            {label}{' '}
          </label>
        )}{' '}
      </div>
    );
  }
);
Radio.displayName = 'Radio';
export default Radio;
