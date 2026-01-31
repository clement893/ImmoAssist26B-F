/**
 * Theme Component Helpers
 *
 * Provides convenient utilities for using theme CSS variables in components.
 * These helpers make it easier to use theme colors, spacing, and other design tokens
 * in a consistent way across the application.
 *
 * @example
 * ```tsx
 * import { themeColors } from '@/lib/theme/component-helpers';
 *
 * <button className={themeColors.bg.primary}>Click me</button>
 * <span className={themeColors.text.danger}>Error message</span>
 * ```
 */

/**
 * Theme color helpers - Provides Tailwind classes that use theme CSS variables
 * These classes work with the Tailwind configuration that maps to CSS variables
 */
export const themeColors = {
  bg: {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    danger: 'bg-danger-500',
    warning: 'bg-warning-500',
    info: 'bg-info-500',
    success: 'bg-success-500',
    error: 'bg-error-500',
    background: 'bg-[var(--color-background)]',
    muted: 'bg-[var(--color-muted)]',
  },
  text: {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    danger: 'text-danger-500',
    warning: 'text-warning-500',
    info: 'text-info-500',
    success: 'text-success-500',
    error: 'text-error-500',
    foreground: 'text-[var(--color-foreground)]',
    muted: 'text-[var(--color-muted-foreground)]',
  },
  border: {
    primary: 'border-primary-500',
    secondary: 'border-secondary-500',
    danger: 'border-danger-500',
    warning: 'border-warning-500',
    info: 'border-info-500',
    success: 'border-success-500',
    error: 'border-error-500',
    default: 'border-[var(--color-border)]',
  },
} as const;

/**
 * Theme spacing helpers - Provides CSS variable values for spacing
 * Use these when you need spacing values in inline styles or calculations
 */
export const themeSpacing = {
  xs: 'var(--spacing-xs, 4px)',
  sm: 'var(--spacing-sm, 8px)',
  md: 'var(--spacing-md, 16px)',
  lg: 'var(--spacing-lg, 24px)',
  xl: 'var(--spacing-xl, 32px)',
  '2xl': 'var(--spacing-2xl, 48px)',
  '3xl': 'var(--spacing-3xl, 64px)',
} as const;

/**
 * Theme typography helpers - Provides font family classes
 */
export const themeTypography = {
  font: {
    sans: 'font-sans',
    heading: 'font-heading',
    subheading: 'font-subheading',
  },
} as const;

/**
 * Theme border radius helpers
 */
export const themeBorderRadius = {
  default: 'rounded',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const;

/**
 * Get CSS variable value programmatically
 *
 * @param variableName - CSS variable name (e.g., '--color-primary-500')
 * @param fallback - Fallback value if variable is not set
 * @returns The CSS variable value or fallback
 *
 * @example
 * ```tsx
 * const primaryColor = getCSSVariable('--color-primary-500', '#2563eb');
 * ```
 */
export function getCSSVariable(variableName: string, fallback?: string): string {
  if (typeof window === 'undefined') {
    return fallback || '';
  }

  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(variableName).trim();

  return value || fallback || '';
}

/**
 * Set CSS variable value programmatically
 *
 * @param variableName - CSS variable name (e.g., '--color-primary-500')
 * @param value - Value to set
 *
 * @example
 * ```tsx
 * setCSSVariable('--color-primary-500', '#3b82f6');
 * ```
 */
export function setCSSVariable(variableName: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.style.setProperty(variableName, value);
}

/**
 * Get theme color value as RGB for opacity support
 *
 * @param colorName - Color name (e.g., 'primary', 'danger')
 * @returns RGB values as string (e.g., '37, 99, 235')
 *
 * @example
 * ```tsx
 * const rgb = getThemeColorRGB('primary');
 * // Returns: '37, 99, 235'
 * // Use with: rgba(${rgb}, 0.5)
 * ```
 */
export function getThemeColorRGB(
  colorName: 'primary' | 'secondary' | 'danger' | 'warning' | 'info' | 'success' | 'error'
): string {
  const rgbVariable = `--color-${colorName}-rgb`;
  return getCSSVariable(rgbVariable, '0, 0, 0');
}

/**
 * Get theme color with opacity
 *
 * @param colorName - Color name (e.g., 'primary', 'danger')
 * @param opacity - Opacity value (0-1)
 * @returns RGBA color string
 *
 * @example
 * ```tsx
 * const semiTransparent = getThemeColorWithOpacity('primary', 0.5);
 * // Returns: 'rgba(37, 99, 235, 0.5)'
 * ```
 */
export function getThemeColorWithOpacity(
  colorName: 'primary' | 'secondary' | 'danger' | 'warning' | 'info' | 'success' | 'error',
  opacity: number
): string {
  const rgb = getThemeColorRGB(colorName);
  return `rgba(${rgb}, ${opacity})`;
}

/**
 * Combine multiple theme color classes
 *
 * @param classes - Array of theme color classes
 * @returns Combined class string
 *
 * @example
 * ```tsx
 * const buttonClasses = combineThemeClasses(
 *   themeColors.bg.primary,
 *   themeColors.text.foreground,
 *   themeBorderRadius.default
 * );
 * ```
 */
export function combineThemeClasses(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Common theme-aware component patterns
 * Use these for consistent theming across components
 */
export const themePatterns = {
  // Button patterns
  button: {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white focus:ring-secondary-500',
    danger: 'bg-danger-500 hover:bg-danger-600 text-white focus:ring-danger-500',
    outline:
      'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost: 'text-foreground hover:bg-muted focus:ring-primary-500',
  },
  // Link patterns
  link: {
    default: 'text-primary-600 hover:text-primary-700',
    muted: 'text-muted-foreground hover:text-foreground',
    accent: 'text-primary-500 hover:text-primary-600 underline',
  },
  // Card patterns
  card: {
    default: 'bg-background border-border rounded-lg shadow-sm',
    elevated: 'bg-background border-border rounded-lg shadow-md',
    interactive:
      'bg-background border-border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer',
  },
  // Input patterns
  input: {
    default: 'bg-background border-border text-foreground focus:ring-primary-500',
    error: 'bg-background border-danger-500 text-foreground focus:ring-danger-500',
  },
  // Badge patterns
  badge: {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100',
    secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-100',
    danger: 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-100',
    success: 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-100',
  },
} as const;
