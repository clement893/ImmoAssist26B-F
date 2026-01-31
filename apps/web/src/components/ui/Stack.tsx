/**
 * Stack Component
 *
 * A flexible layout component that stacks children vertically or horizontally
 * with themeable gap spacing.
 *
 * @example
 * ```tsx
 * // Vertical stack with normal gap
 * <Stack gap="normal">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </Stack>
 *
 * // Horizontal stack with tight gap
 * <Stack direction="horizontal" gap="tight">
 *   <Button>Action 1</Button>
 *   <Button>Action 2</Button>
 * </Stack>
 * ```
 */
'use client';

import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { useLayout } from '@/lib/theme/use-layout';

export interface StackProps {
  /** Stack content */
  children: ReactNode;
  /** Stack direction */
  direction?: 'vertical' | 'horizontal';
  /** Gap size from theme (tight, normal, loose) */
  gap?: 'tight' | 'normal' | 'loose';
  /** Custom gap value (overrides theme gap) */
  gapValue?: string;
  /** Alignment of items */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justify content */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Wrap items */
  wrap?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export default function Stack({
  children,
  direction = 'vertical',
  gap = 'normal',
  gapValue,
  align,
  justify,
  wrap = false,
  className,
}: StackProps) {
  const { getGap } = useLayout();

  // Get gap value from theme or use custom value
  const gapValueToUse = gapValue || getGap(gap);

  return (
    <div
      className={clsx(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        align && `items-${align}`,
        justify && `justify-${justify}`,
        wrap && 'flex-wrap',
        className
      )}
      style={{
        gap: gapValueToUse,
      }}
    >
      {children}
    </div>
  );
}
