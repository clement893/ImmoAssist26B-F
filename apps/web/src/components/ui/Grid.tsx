/**
 * Grid Component
 *
 * A flexible grid layout component with themeable gap spacing.
 * Supports responsive columns and custom gap values.
 *
 * @example
 * ```tsx
 * // Basic grid with 3 columns
 * <Grid columns={3} gap="normal">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Grid>
 *
 * // Responsive grid
 * <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="loose">
 *   {items.map(item => <Card key={item.id}>{item.content}</Card>)}
 * </Grid>
 * ```
 */
'use client';

import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { useLayout } from '@/lib/theme/use-layout';

export interface GridProps {
  /** Grid content */
  children: ReactNode;
  /** Number of columns (number or responsive object) */
  columns?: number | { mobile?: number; tablet?: number; desktop?: number };
  /** Gap size from theme (tight, normal, loose) */
  gap?: 'tight' | 'normal' | 'loose';
  /** Custom gap value (overrides theme gap) */
  gapValue?: string;
  /** Additional CSS classes */
  className?: string;
}

export default function Grid({ children, columns = 3, gap = 'normal', gapValue, className }: GridProps) {
  const { getGap } = useLayout();

  // Get gap value from theme or use custom value
  const gapValueToUse = gapValue || getGap(gap);

  // Build grid template columns
  const getGridColumns = () => {
    if (typeof columns === 'number') {
      return `repeat(${columns}, minmax(0, 1fr))`;
    }

    // Responsive columns
    const mobile = columns.mobile || 1;
    const tablet = columns.tablet || mobile;
    const desktop = columns.desktop || tablet;

    // Use CSS Grid with responsive breakpoints
    return {
      '--grid-cols-mobile': mobile,
      '--grid-cols-tablet': tablet,
      '--grid-cols-desktop': desktop,
    } as React.CSSProperties;
  };

  const gridColumns = typeof columns === 'number' ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : getGridColumns();

  // Build responsive classes if using responsive columns
  const responsiveClasses =
    typeof columns === 'object'
      ? clsx(
          'grid-cols-[var(--grid-cols-mobile)]',
          'sm:grid-cols-[var(--grid-cols-tablet)]',
          'lg:grid-cols-[var(--grid-cols-desktop)]'
        )
      : undefined;

  return (
    <div
      className={clsx('grid', typeof columns === 'number' && `grid-cols-${columns}`, responsiveClasses, className)}
      style={{
        ...(gridColumns && typeof gridColumns === 'object' ? gridColumns : {}),
        gap: gapValueToUse,
      }}
    >
      {children}
    </div>
  );
}
