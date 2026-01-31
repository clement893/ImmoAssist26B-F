import { ButtonHTMLAttributes, ReactNode, memo } from 'react';
import { clsx } from 'clsx';
import { ButtonVariant, Size } from './types';
import { useComponentConfig } from '@/lib/theme/use-component-config';
import { mergeVariantConfig, applyVariantConfigAsStyles } from '@/lib/theme/variant-helpers';

/**
 * Button Component
 *
 * A versatile button component with multiple variants, sizes, and states.
 * Supports loading state, full width, and all standard button HTML attributes.
 *
 * @example
 * ```tsx
 * // Primary button
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 *
 * // Loading state
 * <Button variant="primary" loading>
 *   Processing...
 * </Button>
 *
 * // Full width button
 * <Button variant="primary" fullWidth>
 *   Submit
 * </Button>
 * ```
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: Size;
  /** Show loading spinner and disable button */
  loading?: boolean;
  /** Make button full width */
  fullWidth?: boolean;
  /** Button content */
  children: ReactNode;
  /** Render as child element (for use with Link) */
  asChild?: boolean;
}

// Base styles - Modern and clean
const baseStyles = [
  'font-medium',
  'rounded-lg',
  'transition-all',
  'duration-300',
  'ease-out',
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-offset-2',
  'disabled:opacity-50',
  'disabled:cursor-not-allowed',
  'shadow-sm',
  'hover:shadow-md',
  'active:scale-[0.98]',
  'backdrop-blur-sm',
].join(' ');

// Variant styles - Split into arrays for better readability
// Use string concatenation instead of template literals to avoid Turbopack parsing issues
const createVariantStyles = (base: string[], hover: string[], focus: string[], cssVar: string) =>
  [...base, ...hover, ...focus, '[background-color:var(--' + cssVar + ')]'].join(' ');

const variants = {
  primary: createVariantStyles(
    ['bg-gradient-to-r', 'from-primary-600', 'to-primary-500', 'dark:from-primary-500', 'dark:to-primary-400', 'text-background', 'shadow-lg', 'shadow-primary-500/25'],
    ['hover:from-primary-700', 'hover:to-primary-600', 'dark:hover:from-primary-600', 'dark:hover:to-primary-500', 'hover:shadow-xl', 'hover:shadow-primary-500/30'],
    ['focus:ring-primary-500', 'dark:focus:ring-primary-400', 'focus:ring-offset-2'],
    'color-primary-500'
  ),
  secondary: createVariantStyles(
    ['bg-gradient-to-r', 'from-secondary-600', 'to-secondary-500', 'dark:from-secondary-500', 'dark:to-secondary-400', 'text-background', 'shadow-lg', 'shadow-secondary-500/25'],
    ['hover:from-secondary-700', 'hover:to-secondary-600', 'dark:hover:from-secondary-600', 'dark:hover:to-secondary-500', 'hover:shadow-xl', 'hover:shadow-secondary-500/30'],
    ['focus:ring-secondary-500', 'dark:focus:ring-secondary-400', 'focus:ring-offset-2'],
    'color-secondary-500'
  ),
  outline: [
    'border-2',
    'border-primary-600/60',
    'dark:border-primary-400/60',
    'text-primary-600',
    'dark:text-primary-400',
    'bg-transparent',
    'backdrop-blur-sm',
    'hover:bg-primary-50/80',
    'dark:hover:bg-primary-900/20',
    'hover:border-primary-600',
    'dark:hover:border-primary-400',
    'focus:ring-primary-500',
    'dark:focus:ring-primary-400',
    'focus:ring-offset-2',
    'shadow-sm',
    'hover:shadow-md',
    '[border-color:var(--color-primary-500)]',
    '[color:var(--color-primary-500)]',
  ].join(' '),
  ghost: [
    'text-foreground',
    'bg-transparent',
    'hover:bg-muted/80',
    'hover:shadow-sm',
    'focus:ring-primary-500',
    'dark:focus:ring-primary-400',
    'focus:ring-offset-2',
  ].join(' '),
  danger: createVariantStyles(
    ['bg-gradient-to-r', 'from-error-600', 'to-error-500', 'dark:from-error-500', 'dark:to-error-400', 'text-background', 'shadow-lg', 'shadow-error-500/25'],
    ['hover:from-error-700', 'hover:to-error-600', 'dark:hover:from-error-600', 'dark:hover:to-error-500', 'hover:shadow-xl', 'hover:shadow-error-500/30'],
    ['focus:ring-error-500', 'dark:focus:ring-error-400', 'focus:ring-offset-2'],
    'color-error-500'
  ),
  error: createVariantStyles(
    ['bg-gradient-to-r', 'from-error-600', 'to-error-500', 'dark:from-error-500', 'dark:to-error-400', 'text-background', 'shadow-lg', 'shadow-error-500/25'],
    ['hover:from-error-700', 'hover:to-error-600', 'dark:hover:from-error-600', 'dark:hover:to-error-500', 'hover:shadow-xl', 'hover:shadow-error-500/30'],
    ['focus:ring-error-500', 'dark:focus:ring-error-400', 'focus:ring-offset-2'],
    'color-error-500'
  ),
};

// Default sizes (fallback if theme config not available)
const defaultSizes = {
  sm: 'px-4 py-2.5 text-sm min-h-[44px]', // Ensure minimum touch target (44x44px) - Increased py for better breathing room
  md: 'px-6 py-3 text-base min-h-[44px]', // Standard size - py-3 (12px) provides good balance
  lg: 'px-8 py-4 text-lg min-h-[44px]', // Large size - py-4 (16px) for prominence
};

function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  asChild = false,
  ...props
}: ButtonProps) {
  const { getSize, getVariant } = useComponentConfig('button');
  const sizeConfig = getSize(size);
  const variantConfig = getVariant(variant);

  // Build size classes - use theme config if available, otherwise use defaults
  let sizeClasses = defaultSizes[size] || defaultSizes.md;
  const sizeStyle: React.CSSProperties = {};

  // Apply theme size config if available
  if (sizeConfig) {
    // Use theme padding if provided
    if (sizeConfig.paddingX || sizeConfig.paddingY) {
      // Remove padding classes and use inline styles instead
      sizeClasses = sizeClasses.replace(/px-\d+|py-\d+/g, '').trim();
      if (sizeConfig.paddingX) {
        sizeStyle.paddingLeft = sizeConfig.paddingX;
        sizeStyle.paddingRight = sizeConfig.paddingX;
      }
      if (sizeConfig.paddingY) {
        sizeStyle.paddingTop = sizeConfig.paddingY;
        sizeStyle.paddingBottom = sizeConfig.paddingY;
      }
    }

    // Use theme fontSize if provided
    if (sizeConfig.fontSize) {
      sizeClasses = sizeClasses.replace(/text-(xs|sm|base|lg|xl|2xl)/g, '').trim();
      sizeStyle.fontSize = sizeConfig.fontSize;
    }

    // Use theme minHeight if provided
    if (sizeConfig.minHeight) {
      sizeClasses = sizeClasses.replace(/min-h-\[.*?\]/g, '').trim();
      sizeStyle.minHeight = sizeConfig.minHeight;
    }

    // Use theme borderRadius if provided
    if (sizeConfig.borderRadius) {
      sizeStyle.borderRadius = sizeConfig.borderRadius;
    }
  }

  // Merge theme variant with default variant
  const variantClasses = variantConfig
    ? mergeVariantConfig(variants[variant] || variants.primary, variantConfig)
    : variants[variant] || variants.primary;

  // Get variant styles for inline application
  const variantStyles = variantConfig ? applyVariantConfigAsStyles(variantConfig) : {};

  const buttonClasses = clsx(
    baseStyles,
    variantClasses,
    sizeClasses,
    fullWidth && 'w-full',
    className
  );

  // If asChild is true, render children directly (for use with Link)
  if (asChild) {
    return <>{children}</>;
  }

  return (
    <button
      className={buttonClasses}
      style={{ ...sizeStyle, ...variantStyles, ...props.style }}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-3" aria-hidden="true">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default memo(Button);
