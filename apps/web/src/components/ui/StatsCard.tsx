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
        'bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200', // Dashboard V2 Style - rounded-3xl p-6
        'w-full',
        onClick && 'cursor-pointer',
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
      <div className="flex items-center justify-between mb-4">
        {icon && (
          <div className={clsx('rounded-full p-2', iconStyles[variant])}> {/* Dashboard V2 Style - rounded-full p-2 */}
            {icon}
          </div>
        )}
        {trend && (
          <div className={clsx('flex items-center gap-1 text-xs font-medium', trendColors[trendDirection])}>
            <TrendIcon className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 mb-2">{title}</p> {/* Dashboard V2 Style - text-xs */}
        <p className="text-2xl font-semibold text-gray-900 mb-4">{value}</p> {/* Dashboard V2 Style - text-2xl font-semibold */}
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
        {/* Dashboard V2 Style - Support pour séparateur avec border-t */}
      </div>
    </div>
  );
}
