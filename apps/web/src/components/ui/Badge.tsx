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
    default: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300', // Revamp UI - Neutres améliorés
    success: 'bg-success-100 dark:bg-success-900/50 text-success-700 dark:text-success-300 border-success-200 dark:border-success-700', // Revamp UI - Avec bordure
    warning: 'bg-warning-100 dark:bg-warning-900/50 text-warning-700 dark:text-warning-300 border-warning-200 dark:border-warning-700', // Revamp UI - Avec bordure
    error: 'bg-error-100 dark:bg-error-900/50 text-error-700 dark:text-error-300 border-error-200 dark:border-error-700', // Revamp UI - Avec bordure
    info: 'bg-info-100 dark:bg-info-900/50 text-info-700 dark:text-info-300 border-info-200 dark:border-info-700', // Revamp UI - Avec bordure
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
        'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold', // Revamp UI - Padding et taille augmentés
        'shadow-sm backdrop-blur-sm',
        'transition-all duration-200 ease-natural',
        'border', // Revamp UI - Bordure visible pour variants colorés
        'hover:shadow-md', // Revamp UI - Hover effect
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
