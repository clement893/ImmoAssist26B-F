import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { useComponentConfig } from '@/lib/theme/use-component-config';
import Text from './Text';

/**
 * Input Component
 *
 * Text input component with label, error handling, helper text, and icon support.
 * Fully accessible with ARIA attributes and keyboard navigation.
 *
 * @example
 * ```tsx
 * // Basic input
 * <Input label="Email" type="email" placeholder="your@email.com" />
 *
 * // With error
 * <Input label="Email" error="Invalid email address" />
 *
 * // With icons
 * <Input
 *   label="Search"
 *   leftIcon={<SearchIcon />}
 *   rightIcon={<ClearIcon />}
 * />
 * ```
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Input label text */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text displayed below input */
  helperText?: string;
  /** Icon displayed on the left side */
  leftIcon?: React.ReactNode;
  /** Icon displayed on the right side */
  rightIcon?: React.ReactNode;
  /** Make input full width */
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, leftIcon, rightIcon, className, fullWidth = false, ...props },
    ref
  ) => {
    const { getSize } = useComponentConfig('input');
    // Use 'md' as default size for input
    const sizeConfig = getSize('md');

    const inputId = props.id || `input-${Math.random().toString(36).substring(7)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText && !error ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join('') || undefined;

    // Build input style - Dashboard V2 Style - Padding et border radius
    const inputStyle: React.CSSProperties = {};
    let paddingClasses = 'px-6 py-4'; // Dashboard V2 Style - px-6 py-4 (24px horizontal, 16px vertical)

    if (sizeConfig) {
      if (sizeConfig.paddingX || sizeConfig.paddingY) {
        paddingClasses = '';
        if (sizeConfig.paddingX) {
          inputStyle.paddingLeft = sizeConfig.paddingX;
          inputStyle.paddingRight = sizeConfig.paddingX;
        }
        if (sizeConfig.paddingY) {
          inputStyle.paddingTop = sizeConfig.paddingY;
          inputStyle.paddingBottom = sizeConfig.paddingY;
        }
      }
      if (sizeConfig.fontSize) {
        inputStyle.fontSize = sizeConfig.fontSize;
      }
      if (sizeConfig.minHeight) {
        inputStyle.minHeight = sizeConfig.minHeight;
      }
    }

    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-light text-gray-600 mb-2">
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
            <div
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none z-10" // Revamp UI - Position ajustée
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full border-0 rounded-2xl transition-all duration-200', // Dashboard V2 Style - rounded-2xl (16px)
              paddingClasses,
              'bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-neutral-100', // Dashboard V2 Style - bg-gray-50
              'min-h-[48px]',
              'text-sm font-medium', // Dashboard V2 Style - font-medium
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0', // Dashboard V2 Style - Focus ring bleu
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100',
              'placeholder:text-gray-400 placeholder:font-normal', // Dashboard V2 Style - Placeholder normal
              error
                ? 'border-2 border-error-500 focus:ring-error-500'
                : '',
              leftIcon && 'pl-12', // Espace pour icône gauche
              rightIcon && 'pr-12', // Espace pour icône droite
              className
            )}
            style={{ 
              ...inputStyle, 
              minHeight: sizeConfig?.minHeight || '48px', // Revamp UI - Height par défaut
              ...props.style 
            }}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            aria-required={props.required}
            {...props}
          />

          {rightIcon && (
            <div
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none z-10" // Revamp UI - Position ajustée
              aria-hidden="true"
            >
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <Text
            id={errorId}
            variant="small"
            className="mt-2 text-error-600 dark:text-error-400"
            role="alert"
            aria-live="polite"
          >
            {error}
          </Text>
        )}

        {helperText && !error && (
          <Text id={helperId} variant="small" className="mt-2 text-muted-foreground">
            {helperText}
          </Text>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
