'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { useLayout } from '@/lib/theme/use-layout';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'; // Revamp UI - Tailles étendues
  padding?: boolean;
  paddingX?: boolean; // Revamp UI - Contrôle séparé du padding horizontal
  paddingY?: boolean; // Revamp UI - Contrôle séparé du padding vertical
}

export default function Container({ 
  children, 
  className, 
  maxWidth = 'xl', 
  padding = true,
  paddingX,
  paddingY 
}: ContainerProps) {
  const { getContainerWidth } = useLayout();

  // Default max widths (fallback if theme not available) - Revamp UI - Tailles étendues
  const defaultMaxWidths = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    '3xl': 'max-w-7xl', // Revamp UI - Nouvelles tailles
    '4xl': 'max-w-[56rem]',
    '5xl': 'max-w-[64rem]',
    '6xl': 'max-w-[72rem]',
    '7xl': 'max-w-[80rem]',
    full: 'max-w-full',
  };

  // Use theme container width if available and size matches theme sizes
  const useThemeWidth = ['sm', 'md', 'lg', 'xl'].includes(maxWidth);
  const containerStyle = useThemeWidth ? { maxWidth: getContainerWidth(maxWidth as 'sm' | 'md' | 'lg' | 'xl') } : undefined;
  const maxWidthClass = useThemeWidth ? undefined : defaultMaxWidths[maxWidth];

  // Revamp UI - Padding responsive amélioré
  const paddingClasses = clsx(
    padding && paddingX !== false && 'px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12', // Padding horizontal généreux
    padding && paddingY !== false && 'py-6 sm:py-8 lg:py-10', // Padding vertical généreux
    paddingX && 'px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12',
    paddingY && 'py-6 sm:py-8 lg:py-10',
  );

  return (
    <div
      className={clsx(
        'mx-auto', 
        maxWidthClass, 
        paddingClasses,
        className
      )}
      style={containerStyle}
    >
      {children}
    </div>
  );
}
