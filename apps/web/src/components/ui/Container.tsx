'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { useLayout } from '@/lib/theme/use-layout';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: boolean;
}

export default function Container({ children, className, maxWidth = 'xl', padding = true }: ContainerProps) {
  const { getContainerWidth } = useLayout();

  // Default max widths (fallback if theme not available)
  const defaultMaxWidths = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  // Use theme container width if available and size matches theme sizes
  const useThemeWidth = ['sm', 'md', 'lg', 'xl'].includes(maxWidth);
  const containerStyle = useThemeWidth ? { maxWidth: getContainerWidth(maxWidth as 'sm' | 'md' | 'lg' | 'xl') } : undefined;
  const maxWidthClass = useThemeWidth ? undefined : defaultMaxWidths[maxWidth];

  return (
    <div
      className={clsx('mx-auto', maxWidthClass, padding && 'px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12', className)}
      style={containerStyle}
    >
      {children}
    </div>
  );
}
