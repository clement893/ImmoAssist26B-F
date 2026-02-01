/**
 * MetricCard Component
 * 
 * Metric display card inspired by Financial Dashboard.
 * Shows a primary metric with optional sub-metrics and trend indicators.
 * 
 * @example
 * ```tsx
 * <MetricCard
 *   title="Total Income"
 *   value="$23,194.80"
 *   subMetrics={[
 *     { label: 'Weekly', value: '+12%' },
 *   ]}
 *   trend="up"
 * />
 * ```
 */

'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export type MetricTrend = 'up' | 'down' | 'neutral';

export interface SubMetric {
  label: string;
  value: string | number;
  trend?: MetricTrend;
}

export interface MetricCardProps {
  /** Card title */
  title: string;
  /** Primary metric value */
  value: string | number;
  /** Optional subtitle */
  subtitle?: string;
  /** Sub-metrics to display */
  subMetrics?: SubMetric[];
  /** Trend indicator */
  trend?: MetricTrend;
  /** Optional icon */
  icon?: ReactNode;
  /** Optional action button */
  action?: ReactNode;
  /** Card variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  subMetrics,
  trend = 'neutral',
  icon,
  action,
  variant = 'default',
  className,
  onClick,
}: MetricCardProps) {
  const variantStyles = {
    default: 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800',
    primary: 'bg-primary-50 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800',
    success: 'bg-success-50 dark:bg-success-950/30 border-success-200 dark:border-success-800',
    warning: 'bg-warning-50 dark:bg-warning-950/30 border-warning-200 dark:border-warning-800',
    error: 'bg-error-50 dark:bg-error-950/30 border-error-200 dark:border-error-800',
  };

  const trendColors = {
    up: 'text-success-600 dark:text-success-400',
    down: 'text-error-600 dark:text-error-400',
    neutral: 'text-neutral-600 dark:text-neutral-400',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={clsx(
        'rounded-xl border p-4 sm:p-6 transition-modern shadow-standard-sm', // UI Revamp - Transition moderne, nouveau système d'ombres
        'w-full', // Full width on mobile
        variantStyles[variant],
        onClick && 'cursor-pointer hover:shadow-standard-lg hover:-translate-y-1 active:scale-[0.98]', // UI Revamp - Hover avec nouvelle ombre
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
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-500">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>

      <div className="space-y-3">
        {/* Primary value */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
          {trend !== 'neutral' && (
            <div className={clsx('flex items-center gap-1 text-sm font-semibold', trendColors[trend])}>
              <TrendIcon className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Sub-metrics */}
        {subMetrics && subMetrics.length > 0 && (
          <div className="flex flex-wrap gap-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            {subMetrics.map((subMetric, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-500">{subMetric.label}:</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {subMetric.value}
                </span>
                {subMetric.trend && subMetric.trend !== 'neutral' && (
                  <span className={clsx('text-xs', trendColors[subMetric.trend])}>
                    {subMetric.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
