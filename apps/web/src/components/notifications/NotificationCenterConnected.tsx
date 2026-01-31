/**
 * Notification Center Component (Connected)
 * Connected version that uses useNotifications hook
 */
'use client';

import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationCenter from './NotificationCenter';
import type { NotificationUI } from '@/types/notification';

export interface NotificationCenterConnectedProps {
  className?: string;
  /** Initial filters for notifications */
  initialFilters?: {
    read?: boolean;
    notification_type?: 'info' | 'success' | 'warning' | 'error';
    skip?: number;
    limit?: number;
  };
  /** Enable WebSocket for real-time updates */
  enableWebSocket?: boolean;
  /** Polling interval (ms) */
  pollInterval?: number;
}

/**
 * NotificationCenterConnected - Connected version with hook
 *
 * This component automatically fetches notifications and handles all interactions.
 * Use this in your notification pages for a fully functional notification center.
 */
export default function NotificationCenterConnected({
  className,
  initialFilters = { skip: 0, limit: 100 },
  enableWebSocket = true,
  pollInterval,
}: NotificationCenterConnectedProps) {
  const router = useRouter();

  const {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useNotifications({
    initialFilters,
    enableWebSocket,
    pollInterval,
    autoFetch: true,
  });

  // Convert notifications to NotificationUI format
  const notificationUIs: NotificationUI[] = notifications.map((notif) => ({
    ...notif,
    // Add UI-specific fields if needed
  }));

  const handleActionClick = (notification: NotificationUI) => {
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  // Show error state
  if (error) {
    return (
      <div className={className}>
        <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
          <p className="text-danger-600 dark:text-danger-400">Error: {error}</p>
          <button
            onClick={() => refresh()}
            className="mt-2 text-sm text-danger-600 dark:text-danger-400 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading && notifications.length === 0) {
    return (
      <div className={className}>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <NotificationCenter
      notifications={notificationUIs}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDelete={deleteNotification}
      onActionClick={handleActionClick}
      className={className}
    />
  );
}
