/**
 * StatsCard Component
 * 
 * Modern statistics card component inspired by Mentorly and Outstaff dashboards.
 * Displays a metric with optional icon, trend indicator, and mini chart.
 * 
 * @example
 * ```tsx
 * <StatsCard
 *   title="Total Activity"
 *   value="64%"
 *   trend="+12%"
 *   trendDirection="up"
 *   icon={<Activity className="w-5 h-5" />}
 * />
 * ```
 */

'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface StatsCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Trend indicator (e.g., "+12%", "-5%") */
  trend?: string;
  /** Trend direction */
  trendDirection?: TrendDirection;
  /** Optional icon */
  icon?: ReactNode;
  /** Optional description */
  description?: string;
  /** Card variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export default function StatsCard({
  title,
  value,
  trend,
  trendDirection = 'neutral',
  icon,
  description,
  variant = 'default',
  className,
  onClick,
}: StatsCardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800',
    primary: 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800',
    success: 'bg-success-50 dark:bg-success-950/30 border-success-200 dark:border-success-800',
    warning: 'bg-warning-50 dark:bg-warning-950/30 border-warning-200 dark:border-warning-800',
    error: 'bg-error-50 dark:bg-error-950/30 border-error-200 dark:border-error-800',
  };

  const iconStyles = {
    default: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
    primary: 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400',
    success: 'bg-success-100 dark:bg-success-900/50 text-success-600 dark:text-success-400',
    warning: 'bg-warning-100 dark:bg-warning-900/50 text-warning-600 dark:text-warning-400',
    error: 'bg-error-100 dark:bg-error-900/50 text-error-600 dark:text-error-400',
  };

  const trendColors = {
    up: 'text-success-600 dark:text-success-400',
    down: 'text-error-600 dark:text-error-400',
    neutral: 'text-neutral-600 dark:text-neutral-400',
  };

  const TrendIcon = trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={clsx(
        'rounded-xl border p-6 transition-all duration-200',
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-lg hover:-translate-y-1',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className={clsx('p-2 rounded-lg', iconStyles[variant])}>
                {icon}
              </div>
            )}
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{title}</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
            {trend && (
              <div className={clsx('flex items-center gap-1 text-sm font-semibold', trendColors[trendDirection])}>
                <TrendIcon className="w-4 h-4" />
                <span>{trend}</span>
              </div>
            )}
          </div>
          {description && (
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
