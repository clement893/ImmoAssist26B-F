import { ReactNode, memo } from 'react';
import { clsx } from 'clsx';
import { ColorVariant, BaseComponentProps, ColorVariantProps } from './types';
import { useComponentConfig } from '@/lib/theme/use-component-config';
import { mergeVariantConfig, applyVariantConfigAsStyles } from '@/lib/theme/variant-helpers';

interface BadgeProps extends BaseComponentProps, ColorVariantProps {
  children: ReactNode;
  variant?: ColorVariant;
}

function Badge({ children, variant = 'default', className }: BadgeProps) {
  const { getVariant } = useComponentConfig('badge');
  const variantConfig = getVariant(variant);

  const defaultVariants = {
    default: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300', // UI Revamp - Style démo pages
    success: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300', // UI Revamp - Style démo pages
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300', // UI Revamp - Style démo pages
    error: 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300', // UI Revamp - Style démo pages
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300', // UI Revamp - Style démo pages
  };

  // Merge theme variant with default variant
  const variantClasses = variantConfig
    ? mergeVariantConfig(defaultVariants[variant] || defaultVariants.default, variantConfig)
    : defaultVariants[variant] || defaultVariants.default;

  // Get variant styles for inline application
  const variantStyles = variantConfig ? applyVariantConfigAsStyles(variantConfig) : {};

  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-light', // UI Revamp - Style démo pages (font-light)
        variantClasses,
        className
      )}
      style={variantStyles}
    >
      {children}
    </span>
  );
}

export default memo(Badge);
