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
  body: 'text-base',
  small: 'text-sm',
  caption: 'text-xs text-muted-foreground',
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
  const typographyClass = variantToClass[variant];

  return (
    <Tag className={clsx(typographyClass, className)} {...props}>
      {children}
    </Tag>
  );
}
