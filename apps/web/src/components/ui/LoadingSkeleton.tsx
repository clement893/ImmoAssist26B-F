/**
 * LoadingSkeleton Component
 *
 * Provides skeleton loading states for cards, lists, and other content areas.
 * Used to show loading placeholders while data is being fetched.
 *
 * @component
 * @example
 * ```tsx
 * // Card skeleton
 * <LoadingSkeleton variant="card" />
 *
 * // List skeleton
 * <LoadingSkeleton variant="list" count={3} />
 *
 * // Custom skeleton
 * <LoadingSkeleton variant="custom" className="h-20 w-full" />
 * ```
 */
'use client';

import Skeleton from './Skeleton';
import Card from './Card';
import { clsx } from 'clsx';

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'stats' | 'table' | 'custom';
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({ variant = 'card', count = 1, className }: LoadingSkeletonProps) {
  if (variant === 'card') {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className={clsx('animate-pulse', className)}>
            <div className="space-y-4">
              <Skeleton variant="rectangular" height={24} width="60%" />
              <Skeleton variant="rectangular" height={16} width="100%" />
              <Skeleton variant="rectangular" height={16} width="80%" />
            </div>
          </Card>
        ))}
      </>
    );
  }

  if (variant === 'list') {
    return (
      <div className={clsx('space-y-3', className)}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="rectangular" height={16} width="60%" />
              <Skeleton variant="rectangular" height={12} width="40%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className={clsx('grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6', className)}>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div className="space-y-3">
              <Skeleton variant="rectangular" height={14} width="50%" />
              <Skeleton variant="rectangular" height={32} width="70%" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={clsx('space-y-2', className)}>
        {/* Table header */}
        <div className="flex gap-4 pb-2 border-b">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} variant="rectangular" height={16} width="25%" />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: count }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 py-3">
            {Array.from({ length: 4 }).map((_, colIndex) => (
              <Skeleton key={colIndex} variant="rectangular" height={16} width="25%" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Custom variant
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} variant="rectangular" className={className} />
      ))}
    </>
  );
}
