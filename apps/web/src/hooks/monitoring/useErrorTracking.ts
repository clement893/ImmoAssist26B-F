/**
 * Error Tracking Hook
 * Custom hook for fetching and managing error tracking data
 * Separates data fetching logic from UI components
 */

import { useState, useEffect, useMemo } from 'react';
import {
  ErrorStatisticsService,
  type Error,
  type ErrorStats,
} from '@/services/errorStatisticsService';

export interface UseErrorTrackingReturn {
  errors: Error[];
  stats: ErrorStats;
  isLoading: boolean;
  error: globalThis.Error | null;
  refresh: () => void;
}

/**
 * Custom hook for error tracking
 * Handles data fetching and statistics calculation
 */
export function useErrorTracking(): UseErrorTrackingReturn {
  const [errors, setErrors] = useState<Error[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<globalThis.Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchErrorData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // API integration - Replace with actual API call to fetch error data when backend endpoint is available
        // For now, we'll use localStorage to track client-side errors
        const storedErrors = localStorage.getItem('error_tracking');
        const fetchedErrors: Error[] = storedErrors ? JSON.parse(storedErrors) : [];

        setErrors(fetchedErrors);
      } catch (err) {
        setError(
          err instanceof globalThis.Error ? err : new globalThis.Error('Failed to fetch error data')
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchErrorData();
  }, [refreshKey]);

  // Calculate statistics using the service
  const stats = useMemo(() => ErrorStatisticsService.calculateStats(errors), [errors]);

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return {
    errors,
    stats,
    isLoading,
    error,
    refresh,
  };
}
