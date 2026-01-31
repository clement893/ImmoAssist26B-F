/**
 * Notification Bell Component (Connected)
 * Connected version that uses useNotifications hook
 */
'use client';

import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationBell from './NotificationBell';
import type { NotificationUI } from '@/types/notification';

export interface NotificationBellConnectedProps {
  className?: string;
  /** Enable WebSocket for real-time updates */
  enableWebSocket?: boolean;
  /** Polling interval for notification count (ms) */
  pollInterval?: number;
}

/**
 * NotificationBellConnected - Connected version with hooks
 *
 * This component automatically fetches notifications and handles all interactions.
 * Use this in your layout/navbar for a fully functional notification bell.
 */
export default function NotificationBellConnected({
  className,
  enableWebSocket = true,
  pollInterval = 60000, // Poll every minute
}: NotificationBellConnectedProps) {
  const router = useRouter();

  // Get notifications (limited to recent 5 for dropdown)
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    initialFilters: {
      skip: 0,
      limit: 5,
    },
    enableWebSocket,
    pollInterval,
    autoFetch: true,
  });

  // Convert notifications to NotificationUI format
  const notificationUIs: NotificationUI[] = notifications.map((notif) => ({
    ...notif,
    // Add UI-specific fields if needed
  }));

  const handleViewAll = () => {
    router.push('/profile/notifications-list');
  };

  const handleActionClick = (notification: NotificationUI) => {
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  // Show loading state
  if (notificationsLoading) {
    return (
      <div className={className}>
        <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <NotificationBell
      notifications={notificationUIs}
      unreadCount={unreadCount}
      onMarkAsRead={markAsRead}
      onMarkAllAsRead={markAllAsRead}
      onDelete={deleteNotification}
      onActionClick={handleActionClick}
      onViewAll={handleViewAll}
      className={className}
    />
  );
}
