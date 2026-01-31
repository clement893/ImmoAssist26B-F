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

// Base styles - Modern, compact and clean design
const baseStyles = [
  'font-medium',
  'rounded-lg', // Moderate rounded (8px) for clean look
  'transition-all',
  'duration-150', // Faster transitions
  'ease-out',
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-offset-1',
  'disabled:opacity-50',
  'disabled:cursor-not-allowed',
  'shadow-sm',
  'hover:shadow',
  'active:scale-[0.98]',
].join(' ');

// Variant styles - Split into arrays for better readability
// Use string concatenation instead of template literals to avoid Turbopack parsing issues
const createVariantStyles = (base: string[], hover: string[], focus: string[], cssVar: string) =>
  [...base, ...hover, ...focus, '[background-color:var(--' + cssVar + ')]'].join(' ');

const variants = {
  primary: createVariantStyles(
    ['bg-primary-600', 'dark:bg-primary-500', 'text-white', 'shadow-sm'],
    ['hover:bg-primary-700', 'dark:hover:bg-primary-600', 'hover:shadow'],
    ['focus:ring-primary-500', 'dark:focus:ring-primary-400', 'focus:ring-offset-1'],
    'color-primary-500'
  ),
  secondary: createVariantStyles(
    ['bg-secondary-600', 'dark:bg-secondary-500', 'text-white', 'shadow-sm'],
    ['hover:bg-secondary-700', 'dark:hover:bg-secondary-600', 'hover:shadow'],
    ['focus:ring-secondary-500', 'dark:focus:ring-secondary-400', 'focus:ring-offset-1'],
    'color-secondary-500'
  ),
  gradient: [
    'bg-gradient-to-r',
    'from-primary-600',
    'to-secondary-500',
    'dark:from-primary-500',
    'dark:to-secondary-400',
    'text-white',
    'shadow-sm',
    'hover:from-primary-700',
    'hover:to-secondary-600',
    'dark:hover:from-primary-600',
    'dark:hover:to-secondary-500',
    'hover:shadow',
    'focus:ring-primary-500',
    'dark:focus:ring-primary-400',
  ].join(' '),
  soft: [
    'bg-primary-50',
    'dark:bg-primary-900/30',
    'text-primary-700',
    'dark:text-primary-300',
    'hover:bg-primary-100',
    'dark:hover:bg-primary-900/50',
    'shadow-sm',
    'hover:shadow',
    'focus:ring-primary-500',
    'dark:focus:ring-primary-400',
  ].join(' '),
  outline: [
    'border',
    'border-primary-500/50',
    'dark:border-primary-400/50',
    'text-primary-600',
    'dark:text-primary-400',
    'bg-transparent',
    'hover:bg-primary-50/50',
    'dark:hover:bg-primary-900/20',
    'hover:border-primary-600',
    'dark:hover:border-primary-400',
    'focus:ring-primary-500',
    'dark:focus:ring-primary-400',
    'focus:ring-offset-1',
    'shadow-sm',
    'hover:shadow',
    '[border-color:var(--color-primary-500)]',
    '[color:var(--color-primary-500)]',
  ].join(' '),
  ghost: [
    'text-neutral-700',
    'dark:text-neutral-300',
    'bg-transparent',
    'hover:bg-neutral-100',
    'dark:hover:bg-neutral-800',
    'focus:ring-primary-500',
    'dark:focus:ring-primary-400',
    'focus:ring-offset-1',
  ].join(' '),
  danger: createVariantStyles(
    ['bg-error-600', 'dark:bg-error-500', 'text-background', 'shadow-sm'],
    ['hover:bg-error-700', 'dark:hover:bg-error-600', 'hover:shadow'],
    ['focus:ring-error-500', 'dark:focus:ring-error-400', 'focus:ring-offset-1'],
    'color-error-500'
  ),
  error: createVariantStyles(
    ['bg-error-600', 'dark:bg-error-500', 'text-background', 'shadow-sm'],
    ['hover:bg-error-700', 'dark:hover:bg-error-600', 'hover:shadow'],
    ['focus:ring-error-500', 'dark:focus:ring-error-400', 'focus:ring-offset-1'],
    'color-error-500'
  ),
};

// Default sizes (fallback if theme config not available) - Compact and elegant design
const defaultSizes = {
  sm: 'px-2.5 py-1 text-xs min-h-[28px]', // Compact small - Minimal padding for density
  md: 'px-3 py-1.5 text-sm min-h-[32px]', // Standard size - Balanced and elegant
  lg: 'px-4 py-2 text-sm min-h-[36px]', // Large size - Slightly larger but still compact
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
