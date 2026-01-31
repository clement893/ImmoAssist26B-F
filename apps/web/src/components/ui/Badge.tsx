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
    default: 'bg-muted text-foreground',
    success: 'bg-success-50 dark:bg-success-900 text-success-900 dark:text-success-300',
    warning: 'bg-warning-50 dark:bg-warning-900 text-warning-900 dark:text-warning-300',
    error: 'bg-error-50 dark:bg-error-900 text-error-900 dark:text-error-300',
    info: 'bg-info-50 dark:bg-info-900 text-info-900 dark:text-info-300',
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
        'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold',
        'shadow-sm backdrop-blur-sm',
        'transition-all duration-200',
        'border border-transparent',
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
