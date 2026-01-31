/**
 * Text Component
 *
 * Reusable text component with standardized variants for body text, small text, and captions.
 * Uses standardized typography classes from Tailwind config.
 *
 * @component
 * @example
 * ```tsx
 * // Body text (default)
 * <Text>Regular paragraph text</Text>
 *
 * // Small text
 * <Text variant="small">Small text content</Text>
 *
 * // Caption text
 * <Text variant="caption">Caption or legend text</Text>
 *
 * // Custom element with variant
 * <Text variant="body" as="span" className="text-primary-600">
 *   Inline text
 * </Text>
 * ```
 *
 * @param {TextProps} props - Component props
 * @param {'body' | 'small' | 'caption'} [props.variant='body'] - Text variant
 * @param {ReactNode} props.children - Text content (required)
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ElementType} [props.as='p'] - Custom HTML element (default: p)
 *
 * @returns {JSX.Element} Text component
 *
 * @see {@link https://tailwindcss.com/docs/font-size} Tailwind typography utilities
 */
'use client';

import { type ReactNode, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface TextProps extends Omit<HTMLAttributes<HTMLParagraphElement>, 'className'> {
  /** Text variant */
  variant?: 'body' | 'small' | 'caption';
  /** Text content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Custom HTML element (default: p) */
  as?: React.ElementType;
}

/**
 * Map text variants to Tailwind typography classes
 */
const variantToClass = {
  body: 'text-body',
  small: 'text-small',
  caption: 'text-caption',
} as const;

/**
 * Text Component
 *
 * Renders text with the appropriate typography class based on the variant prop.
 * Supports custom element via `as` prop.
 */
export default function Text({
  variant = 'body',
  children,
  className,
  as: Tag = 'p',
  ...props
}: TextProps) {
  // Get the typography class for this variant
  const typographyClass = variantToClass[variant];

  return (
    <Tag className={clsx(typographyClass, className)} {...props}>
      {children}
    </Tag>
  );
}
