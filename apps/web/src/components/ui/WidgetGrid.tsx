/**
 * WidgetGrid Component
 * 
 * Flexible grid layout for widgets inspired by Outstaff dashboard.
 * Supports responsive layouts with customizable widget sizes.
 * 
 * @example
 * ```tsx
 * <WidgetGrid
 *   columns={{ sm: 1, md: 2, lg: 3 }}
 *   gap={6}
 * >
 *   <WidgetGrid.Item size="md">Widget 1</WidgetGrid.Item>
 *   <WidgetGrid.Item size="lg">Widget 2</WidgetGrid.Item>
 * </WidgetGrid>
 * ```
 */

'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';

export interface WidgetGridProps {
  /** Grid children */
  children: ReactNode;
  /** Number of columns per breakpoint */
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Gap between widgets */
  gap?: 4 | 6 | 8;
  /** Additional CSS classes */
  className?: string;
}

export interface WidgetGridItemProps {
  /** Item content */
  children: ReactNode;
  /** Item size (spans) */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'col-span-1',
  md: 'col-span-1 md:col-span-2',
  lg: 'col-span-1 md:col-span-2 lg:col-span-3',
  xl: 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4',
  full: 'col-span-full',
};

function WidgetGridItem({ children, size = 'md', className }: WidgetGridItemProps) {
  return (
    <div className={clsx(sizeClasses[size], className)}>
      {children}
    </div>
  );
}

export default function WidgetGrid({
  children,
  columns = { sm: 1, md: 2, lg: 3 },
  gap = 6,
  className,
}: WidgetGridProps) {

  return (
    <div
      className={clsx(
        'grid',
        `grid-cols-${columns.sm || 1}`,
        columns.md && `md:grid-cols-${columns.md}`,
        columns.lg && `lg:grid-cols-${columns.lg}`,
        columns.xl && `xl:grid-cols-${columns.xl}`,
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
}

// Attach Item as a sub-component
WidgetGrid.Item = WidgetGridItem;
