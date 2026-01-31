/**
 * useNotificationCount Hook
 *
 * Lightweight React hook for fetching unread notification count.
 * Optimized for frequent updates (e.g., badge in navbar).
 *
 * @example
 * ```typescript
 * import { useNotificationCount } from '@/hooks/useNotificationCount';
 *
 * function NotificationBadge() {
 *   const { count, loading, refresh } = useNotificationCount({ pollInterval: 30000 });
 *
 *   return (
 *     <Badge>
 *       {loading ? '...' : count}
 *     </Badge>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '@/lib/api/notifications';
import { logger } from '@/lib/logger';

interface UseNotificationCountOptions {
  /** Enable automatic polling (in milliseconds) */
  pollInterval?: number;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

interface UseNotificationCountReturn {
  /** Unread notification count */
  count: number;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Refresh count */
  refresh: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

export function useNotificationCount(
  options: UseNotificationCountOptions = {}
): UseNotificationCountReturn {
  const { pollInterval, autoFetch = true } = options;

  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const unreadCount = await notificationsAPI.getUnreadCount();
      setCount(unreadCount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch unread count';
      setError(errorMessage);
      logger.error(
        'Error fetching unread count',
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    return fetchCount();
  }, [fetchCount]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchCount();
    }
  }, [autoFetch]); // Only run on mount

  // Polling
  useEffect(() => {
    if (!pollInterval || !autoFetch) return;

    const interval = setInterval(() => {
      fetchCount();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, autoFetch, fetchCount]);

  return {
    count,
    loading,
    error,
    refresh,
    clearError,
  };
}
