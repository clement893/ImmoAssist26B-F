/**
 * useNotifications Hook
 *
 * React hook for managing user notifications.
 * Provides convenient methods for fetching, marking as read, and deleting notifications
 * with loading states and error handling.
 *
 * @example
 * ```typescript
 * import { useNotifications } from '@/hooks/useNotifications';
 *
 * function MyComponent() {
 *   const { notifications, loading, error, markAsRead, refresh } = useNotifications();
 *
 *   return (
 *     <div>
 *       {loading && <p>Loading...</p>}
 *       {error && <p>Error: {error}</p>}
 *       {notifications.map(notif => (
 *         <div key={notif.id}>
 *           {notif.title}
 *           <button onClick={() => markAsRead(notif.id)}>Mark as read</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsAPI } from '@/lib/api/notifications';
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
} from '@/lib/websocket/notificationSocket';
import { logger } from '@/lib/logger';
import type {
  Notification,
  NotificationFilters,
  NotificationListResponse,
} from '@/types/notification';

interface UseNotificationsOptions {
  /** Initial filters for fetching notifications */
  initialFilters?: NotificationFilters;
  /** Enable automatic polling (in milliseconds) */
  pollInterval?: number;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
  /** Enable WebSocket for real-time updates */
  enableWebSocket?: boolean;
}

interface UseNotificationsReturn {
  /** List of notifications */
  notifications: Notification[];
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Total count of notifications */
  total: number;
  /** Unread count */
  unreadCount: number;
  /** Pagination info */
  pagination: {
    skip: number;
    limit: number;
  };
  /** Fetch notifications with optional filters */
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  /** Mark a notification as read */
  markAsRead: (id: number) => Promise<void>;
  /** Mark all notifications as read */
  markAllAsRead: () => Promise<void>;
  /** Delete a notification */
  deleteNotification: (id: number) => Promise<void>;
  /** Refresh notifications (re-fetch with current filters) */
  refresh: () => Promise<void>;
  /** Clear error */
  clearError: () => void;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    initialFilters = { skip: 0, limit: 100 },
    pollInterval,
    autoFetch = true,
    enableWebSocket = true,
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filters, setFilters] = useState<NotificationFilters>(initialFilters);
  const wsConnectedRef = useRef<boolean>(false);

  const fetchNotifications = useCallback(
    async (newFilters?: NotificationFilters) => {
      setLoading(true);
      setError(null);

      try {
        const currentFilters = newFilters || filters;
        const response: NotificationListResponse =
          await notificationsAPI.getNotifications(currentFilters);

        setNotifications(response.notifications);
        setTotal(response.total);
        setUnreadCount(response.unread_count);
        setFilters(currentFilters);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
        setError(errorMessage);
        logger.error(
          'Error fetching notifications',
          err instanceof Error ? err : new Error(String(err))
        );
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await notificationsAPI.markAsRead(id);
        // Update local state optimistically
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id ? { ...notif, read: true, read_at: new Date().toISOString() } : notif
          )
        );
        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to mark notification as read';
        setError(errorMessage);
        // Refresh to get correct state
        await fetchNotifications();
      }
    },
    [fetchNotifications]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      // Update local state optimistically
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          read: true,
          read_at: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to mark all notifications as read';
      setError(errorMessage);
      // Refresh to get correct state
      await fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(
    async (id: number) => {
      try {
        await notificationsAPI.deleteNotification(id);
        // Update local state optimistically
        const deleted = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        // Update unread count if deleted notification was unread
        if (deleted && !deleted.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        // Update total
        setTotal((prev) => Math.max(0, prev - 1));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete notification';
        setError(errorMessage);
        // Refresh to get correct state
        await fetchNotifications();
      }
    },
    [notifications, fetchNotifications]
  );

  const refresh = useCallback(() => {
    return fetchNotifications();
  }, [fetchNotifications]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle WebSocket connection for real-time updates
  useEffect(() => {
    if (!enableWebSocket || typeof window === 'undefined') {
      return;
    }

    const handleNotification = (notification: Notification) => {
      // Add new notification to the list if it matches current filters
      setNotifications((prev) => {
        // Check if notification matches current filters
        const matchesReadFilter = filters.read === undefined || filters.read === notification.read;
        const matchesTypeFilter =
          !filters.notification_type ||
          filters.notification_type === notification.notification_type;

        if (matchesReadFilter && matchesTypeFilter) {
          // Add to beginning of list (most recent first)
          return [notification, ...prev];
        }
        return prev;
      });

      // Update unread count if notification is unread
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
        setTotal((prev) => prev + 1);
      }
    };

    const handleConnected = () => {
      wsConnectedRef.current = true;
      logger.debug('[useNotifications] WebSocket connected');
    };

    const handleDisconnected = () => {
      wsConnectedRef.current = false;
      logger.debug('[useNotifications] WebSocket disconnected');
    };

    const handleError = (error: Error) => {
      logger.error('[useNotifications] WebSocket error', error);
      setError(error.message);
    };

    // Connect to WebSocket
    connectNotificationSocket({
      onNotification: handleNotification,
      onConnected: handleConnected,
      onDisconnected: handleDisconnected,
      onError: handleError,
    });

    // Cleanup on unmount
    return () => {
      disconnectNotificationSocket();
      wsConnectedRef.current = false;
    };
  }, [enableWebSocket, filters.read, filters.notification_type]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
    }
  }, [autoFetch]); // Only run on mount

  // Polling
  useEffect(() => {
    if (!pollInterval || !autoFetch) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, autoFetch, fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    total,
    unreadCount,
    pagination: {
      skip: filters.skip || 0,
      limit: filters.limit || 100,
    },
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    clearError,
  };
}
