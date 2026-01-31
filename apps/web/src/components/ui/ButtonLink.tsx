/**
 * ButtonLink Component
 *
 * A Button component that acts as a Link for navigation.
 * Combines Button styling with Link functionality from next-intl.
 *
 * This component solves the issue where Button inside Link doesn't work correctly
 * by rendering the Link directly with Button styles.
 *
 * @example
 * ```tsx
 * <ButtonLink href="/dashboard" variant="primary">
 *   Go to Dashboard
 * </ButtonLink>
 * ```
 */
'use client';

import type { ReactNode } from 'react';
import { Link } from '@/i18n/routing';
import { clsx } from 'clsx';
import type { ButtonVariant, Size } from './types';

// Base styles - same as Button component (compact design)
const baseStyles = [
  'font-medium',
  'rounded-lg',
  'transition-all',
  'duration-150',
  'focus:outline-none',
  'focus:ring-2',
  'focus:ring-offset-1',
  'inline-flex',
  'items-center',
  'justify-center',
  'shadow-sm',
  'hover:shadow',
  'active:scale-[0.98]',
].join(' ');

// Variant styles - same as Button component
const createVariantStyles = (base: string[], hover: string[], focus: string[], cssVar: string) =>
  [...base, ...hover, ...focus, '[background-color:var(--' + cssVar + ')]'].join(' ');

const variants: Record<string, string> = {
  primary: createVariantStyles(
    ['bg-primary-600', 'dark:bg-primary-500', 'text-background', 'shadow-sm'],
    ['hover:bg-primary-700', 'dark:hover:bg-primary-600', 'hover:shadow'],
    ['focus:ring-primary-500', 'dark:focus:ring-primary-400', 'focus:ring-offset-1'],
    'color-primary-500'
  ),
  secondary: createVariantStyles(
    ['bg-secondary-600', 'dark:bg-secondary-500', 'text-background', 'shadow-sm'],
    ['hover:bg-secondary-700', 'dark:hover:bg-secondary-600', 'hover:shadow'],
    ['focus:ring-secondary-500', 'dark:focus:ring-secondary-400', 'focus:ring-offset-1'],
    'color-secondary-500'
  ),
  outline: [
    'border',
    'border-primary-500/50',
    'dark:border-primary-400/50',
    'text-primary-600',
    'dark:text-primary-400',
    'hover:bg-primary-50/50',
    'dark:hover:bg-primary-900/20',
    'focus:ring-primary-500',
    'dark:focus:ring-primary-400',
    'focus:ring-offset-1',
    'shadow-sm',
    'hover:shadow',
    '[border-color:var(--color-primary-500)]',
    '[color:var(--color-primary-500)]',
  ].join(' '),
  ghost: ['text-foreground', 'hover:bg-muted', 'focus:ring-primary-500', 'dark:focus:ring-primary-400', 'focus:ring-offset-1'].join(' '),
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

// Size styles - same as Button component (compact design)
const sizes: Record<string, string> = {
  sm: 'px-2.5 py-1 text-xs min-h-[28px]',
  md: 'px-3 py-1.5 text-sm min-h-[32px]',
  lg: 'px-4 py-2 text-sm min-h-[36px]',
};

export interface ButtonLinkProps {
  /** Link href */
  href: string;
  /** Button style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: Size;
  /** Show loading spinner */
  loading?: boolean;
  /** Make button full width */
  fullWidth?: boolean;
  /** Open in new tab */
  target?: '_blank' | '_self';
  /** Link rel attribute */
  rel?: string;
  /** Additional CSS classes */
  className?: string;
  /** Button content */
  children: ReactNode;
}

/**
 * ButtonLink - A Button that acts as a Link
 *
 * This component combines Button styling with Link navigation.
 * It prevents the common issue of Button inside Link not working correctly.
 */
export default function ButtonLink({
  href,
  target,
  rel,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
}: ButtonLinkProps) {
  // If target is _blank, add rel="noopener noreferrer" for security
  const linkRel = target === '_blank' ? rel || 'noopener noreferrer' : rel;

  // For external links, use regular anchor tag
  const isExternal =
    href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//');

  const buttonClasses = clsx(
    baseStyles,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  );

  const content = loading ? (
    <span className="flex items-center gap-2">
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
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
  );

  // Use regular anchor for external links
  if (isExternal) {
    return (
      <a href={href} target={target} rel={linkRel} className={buttonClasses}>
        {content}
      </a>
    );
  }

  // Use next-intl Link for internal links
  return (
    <Link href={href} className={buttonClasses}>
      {content}
    </Link>
  );
}
