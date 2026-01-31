'use client';

import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface StackProps {
  /** Stack content */
  children: ReactNode;
  /** Stack direction */
  direction?: 'vertical' | 'horizontal';
  /** Gap size */
  gap?: 'none' | 'sm' | 'md' | 'lg';
  /** Alignment of items */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** Justify content */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Wrap items */
  wrap?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const gapMap = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

export default function Stack({
  children,
  direction = 'vertical',
  gap = 'md',
  align,
  justify,
  wrap = false,
  className,
}: StackProps) {
  return (
    <div
      className={clsx(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row',
        gapMap[gap],
        align && `items-${align}`,
        justify && `justify-${justify}`,
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
}
