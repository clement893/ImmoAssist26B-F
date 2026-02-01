import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import Text from './Text';

/**
 * Checkbox Component
 *
 * Checkbox input component with label, error handling, and indeterminate state support.
 * Fully accessible with proper ARIA attributes.
 *
 * @example
 * ```tsx
 * // Basic checkbox
 * <Checkbox label="Accept terms" checked={accepted} onChange={handleChange} />
 *
 * // With error
 * <Checkbox label="Subscribe" error="This field is required" />
 *
 * // Indeterminate state
 * <Checkbox label="Select all" indeterminate={isIndeterminate} />
 * ```
 */
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Checkbox label text */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Make checkbox full width */
  fullWidth?: boolean;
  /** Show indeterminate state (partially checked) */
  indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { label, error, className, fullWidth = false, indeterminate = false, checked, ...props },
    ref
  ) => {

    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        <label className="flex items-center cursor-pointer group">
          <input
            ref={(node) => {
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
              if (node) {
                node.indeterminate = indeterminate;
              }
            }}
            type="checkbox"
            checked={checked}
            className={clsx(
              'text-primary-600 dark:text-primary-400 border-2 border-border rounded-md', // Revamp UI - Border radius moderne
              'bg-background',
              'transition-all duration-200 ease-natural', // Revamp UI - Transitions fluides
              'focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2', // Revamp UI - Ring offset augmenté
              'hover:border-primary-400 dark:hover:border-primary-500', // Revamp UI - Hover effect
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-error-500 dark:border-error-400',
              className
            )}
            style={{
              width: '1.25rem', // Revamp UI - Taille augmentée
              height: '1.25rem',
              borderRadius: '0.375rem', // Revamp UI - Border radius 6px
            }}
            {...props}
          />
          {label && (
            <span
              className={clsx(
                'ml-2 text-sm font-medium',
                error ? 'text-error-600 dark:text-error-400' : 'text-foreground',
                props.disabled && 'opacity-50'
              )}
            >
              {label}
            </span>
          )}
        </label>
        {error && (
          <Text variant="small" className="mt-2 text-error-600 dark:text-error-400" role="alert">
            {error}
          </Text>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
