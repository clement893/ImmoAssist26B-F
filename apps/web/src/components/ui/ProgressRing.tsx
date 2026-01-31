/**
 * ProgressRing Component
 * 
 * Circular progress indicator inspired by Outstaff dashboard.
 * Displays a percentage value in a circular progress ring.
 * 
 * @example
 * ```tsx
 * <ProgressRing
 *   value={64}
 *   size="lg"
 *   variant="primary"
 *   label="Weekly activity"
 * />
 * ```
 */

'use client';

import { clsx } from 'clsx';

export type ProgressRingSize = 'sm' | 'md' | 'lg';
export type ProgressRingVariant = 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface ProgressRingProps {
  /** Progress value (0-100) */
  value: number;
  /** Size variant */
  size?: ProgressRingSize;
  /** Color variant */
  variant?: ProgressRingVariant;
  /** Optional label */
  label?: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show percentage text */
  showPercentage?: boolean;
}

const sizeConfig = {
  sm: { size: 64, strokeWidth: 6, fontSize: 'text-sm' },
  md: { size: 80, strokeWidth: 8, fontSize: 'text-base' },
  lg: { size: 120, strokeWidth: 10, fontSize: 'text-2xl' },
};

const variantColors = {
  primary: {
    ring: 'stroke-primary-500',
    text: 'text-primary-600 dark:text-primary-400',
    bg: 'bg-primary-50 dark:bg-primary-950/30',
  },
  success: {
    ring: 'stroke-success-500',
    text: 'text-success-600 dark:text-success-400',
    bg: 'bg-success-50 dark:bg-success-950/30',
  },
  warning: {
    ring: 'stroke-warning-500',
    text: 'text-warning-600 dark:text-warning-400',
    bg: 'bg-warning-50 dark:bg-warning-950/30',
  },
  error: {
    ring: 'stroke-error-500',
    text: 'text-error-600 dark:text-error-400',
    bg: 'bg-error-50 dark:bg-error-950/30',
  },
  info: {
    ring: 'stroke-info-500',
    text: 'text-info-600 dark:text-info-400',
    bg: 'bg-info-50 dark:bg-info-950/30',
  },
};

export default function ProgressRing({
  value,
  size = 'md',
  variant = 'primary',
  label,
  subtitle,
  className,
  showPercentage = true,
}: ProgressRingProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const config = sizeConfig[size];
  const colors = variantColors[variant];
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={clsx('flex flex-col items-center', className)}>
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            className="text-neutral-200 dark:text-neutral-700"
          />
          {/* Progress circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={clsx('transition-all duration-500 ease-out', colors.ring)}
          />
        </svg>
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={clsx('font-bold', config.fontSize, colors.text)}>
              {Math.round(clampedValue)}%
            </span>
          </div>
        )}
      </div>
      {label && (
        <p className={clsx('mt-2 text-sm font-medium text-center', colors.text)}>
          {label}
        </p>
      )}
      {subtitle && (
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 text-center">
          {subtitle}
        </p>
      )}
    </div>
  );
}
