/**
 * Notifications API
 * API client for notification endpoints
 */

import { apiClient } from '@/lib/api';
import type {
  Notification,
  NotificationCreate,
  NotificationListResponse,
  NotificationUnreadCountResponse,
  NotificationFilters,
} from '@/types/notification';

/**
 * Notifications API client
 */
export const notificationsAPI = {
  /**
   * Get user's notifications with pagination and filtering
   */
  getNotifications: async (filters?: NotificationFilters): Promise<NotificationListResponse> => {
    const params: Record<string, string | number | boolean> = {};

    if (filters?.skip !== undefined) {
      params.skip = filters.skip;
    }
    if (filters?.limit !== undefined) {
      params.limit = filters.limit;
    }
    if (filters?.read !== undefined) {
      params.read = filters.read;
    }
    if (filters?.notification_type) {
      params.notification_type = filters.notification_type;
    }

    const response = await apiClient.get<NotificationListResponse>('/v1/notifications', { params });

    if (!response.data) {
      throw new Error('Failed to fetch notifications: no data returned');
    }

    return response.data;
  },

  /**
   * Get count of unread notifications
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<NotificationUnreadCountResponse>(
      '/v1/notifications/unread-count'
    );

    if (!response.data) {
      throw new Error('Failed to fetch unread count: no data returned');
    }

    return response.data.unread_count;
  },

  /**
   * Get a specific notification by ID
   */
  getNotification: async (notificationId: number): Promise<Notification> => {
    const response = await apiClient.get<Notification>(`/v1/notifications/${notificationId}`);

    if (!response.data) {
      throw new Error('Failed to fetch notification: no data returned');
    }

    return response.data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: number): Promise<Notification> => {
    const response = await apiClient.patch<Notification>(
      `/v1/notifications/${notificationId}/read`
    );

    if (!response.data) {
      throw new Error('Failed to mark notification as read: no data returned');
    }

    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ message: string; count: number }> => {
    const response = await apiClient.patch<{ message: string; count: number }>(
      '/v1/notifications/read-all'
    );

    if (!response.data) {
      throw new Error('Failed to mark all notifications as read: no data returned');
    }

    return response.data;
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (notificationId: number): Promise<void> => {
    await apiClient.delete(`/v1/notifications/${notificationId}`);
  },

  /**
   * Create a new notification
   * Note: Users can only create notifications for themselves
   */
  createNotification: async (notification: NotificationCreate): Promise<Notification> => {
    const response = await apiClient.post<Notification>('/v1/notifications', notification);

    if (!response.data) {
      throw new Error('Failed to create notification: no data returned');
    }

    return response.data;
  },
};
