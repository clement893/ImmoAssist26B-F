/**
 * ActivityChart Component
 * 
 * Interactive bar chart component inspired by Mentorly dashboard.
 * Displays activity data with tooltips on hover.
 * 
 * @example
 * ```tsx
 * <ActivityChart
 *   data={[
 *     { day: 'Mon', value: 4.2 },
 *     { day: 'Tue', value: 3.5 },
 *     { day: 'Wed', value: 5.1 },
 *   ]}
 *   maxValue={8}
 * />
 * ```
 */

'use client';

import { useState } from 'react';
import { clsx } from 'clsx';

export interface ActivityDataPoint {
  day: string;
  value: number;
  label?: string;
}

export interface ActivityChartProps {
  /** Chart data */
  data: ActivityDataPoint[];
  /** Maximum value for scaling (optional, auto-calculated if not provided) */
  maxValue?: number;
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  /** Chart height */
  height?: number;
  /** Show tooltips */
  showTooltips?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const variantColors = {
  primary: {
    bar: 'bg-primary-500',
    hover: 'bg-primary-600',
    text: 'text-primary-600 dark:text-primary-400',
  },
  success: {
    bar: 'bg-success-500',
    hover: 'bg-success-600',
    text: 'text-success-600 dark:text-success-400',
  },
  warning: {
    bar: 'bg-warning-500',
    hover: 'bg-warning-600',
    text: 'text-warning-600 dark:text-warning-400',
  },
  error: {
    bar: 'bg-error-500',
    hover: 'bg-error-600',
    text: 'text-error-600 dark:text-error-400',
  },
  info: {
    bar: 'bg-info-500',
    hover: 'bg-info-600',
    text: 'text-info-600 dark:text-info-400',
  },
};

export default function ActivityChart({
  data,
  maxValue,
  variant = 'primary',
  height = 200,
  showTooltips = true,
  className,
}: ActivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const colors = variantColors[variant];

  // Calculate max value if not provided
  const calculatedMax = maxValue || Math.max(...data.map((d) => d.value), 1);
  const maxHeight = height - 60; // Reserve space for labels

  return (
    <div className={clsx('w-full overflow-x-auto', className)}>
      <div className="relative min-w-[320px]" style={{ height: `${height}px` }}>
        {/* Chart bars */}
        <div className="flex items-end justify-between gap-1 sm:gap-2 h-full pb-12">
          {data.map((point, index) => {
            const barHeight = (point.value / calculatedMax) * maxHeight;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center group relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Tooltip */}
                {showTooltips && isHovered && (
                  <div className="absolute bottom-full mb-2 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-800 text-white text-xs font-medium rounded-lg shadow-lg z-10 whitespace-nowrap">
                    {point.label || `${point.value} ${point.value === 1 ? 'hour' : 'hours'}`}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900 dark:border-t-neutral-800" />
                  </div>
                )}

                {/* Bar */}
                <div
                  className={clsx(
                    'w-full rounded-t-lg transition-all duration-200 cursor-pointer',
                    colors.bar,
                    isHovered ? colors.hover : '',
                    isHovered ? 'shadow-lg' : 'shadow-sm'
                  )}
                  style={{
                    height: `${Math.max(barHeight, 4)}px`, // Minimum 4px height
                    minHeight: '4px',
                  }}
                  title={point.label || `${point.value} hours`}
                />

                {/* Day label */}
                <div className="mt-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {point.day}
                </div>
              </div>
            );
          })}
        </div>

        {/* Y-axis labels (optional) */}
        <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>{calculatedMax}</span>
          <span>{Math.round(calculatedMax / 2)}</span>
          <span>0</span>
        </div>
      </div>
    </div>
  );
}
