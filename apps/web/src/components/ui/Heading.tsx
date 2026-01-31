/**
 * Heading Component
 *
 * Reusable heading component with typography hierarchy support.
 * Uses standardized typography classes from Tailwind config.
 *
 * @component
 * @example
 * ```tsx
 * // H1 heading
 * <Heading level={1}>Page Title</Heading>
 *
 * // H2 heading with custom className
 * <Heading level={2} className="text-primary-600">
 *   Section Title
 * </Heading>
 *
 * // H3 heading with custom element
 * <Heading level={3} as="div">
 *   Custom Element
 * </Heading>
 * ```
 *
 * @param {HeadingProps} props - Component props
 * @param {1 | 2 | 3 | 4 | 5 | 6} props.level - Heading level (required)
 * @param {ReactNode} props.children - Heading content (required)
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ElementType} [props.as] - Custom HTML element (default: h{level})
 *
 * @returns {JSX.Element} Heading component
 *
 * @see {@link https://tailwindcss.com/docs/font-size} Tailwind typography utilities
 */
'use client';

import { type ReactNode, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface HeadingProps extends Omit<HTMLAttributes<HTMLHeadingElement>, 'className'> {
  /** Heading level (1-6) */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** Heading content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Custom HTML element (default: h{level}) */
  as?: React.ElementType;
}

/**
 * Map heading levels to Tailwind typography classes
 */
const levelToClass = {
  1: 'text-h1',
  2: 'text-h2',
  3: 'text-h3',
  4: 'text-subtitle',
  5: 'text-body',
  6: 'text-small',
} as const;

/**
 * Heading Component
 *
 * Renders a heading with the appropriate HTML tag and typography class
 * based on the level prop. Supports custom element via `as` prop.
 */
export default function Heading({ level, children, className, as, ...props }: HeadingProps) {
  // Determine the HTML tag to use
  const Tag = as || (`h${level}` as const);

  // Get the typography class for this level
  const typographyClass = levelToClass[level];

  return (
    <Tag className={clsx(typographyClass, className)} {...props}>
      {children}
    </Tag>
  );
}
