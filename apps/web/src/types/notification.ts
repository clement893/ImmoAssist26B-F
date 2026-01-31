/**
 * Notification Types
 * TypeScript types aligned with backend Pydantic schemas
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationBase {
  title: string;
  message: string;
  notification_type: NotificationType;
  action_url?: string | null;
  action_label?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationCreate extends NotificationBase {
  user_id: number;
}

export interface NotificationUpdate {
  read?: boolean;
  action_url?: string | null;
  action_label?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface Notification extends NotificationBase {
  id: number;
  user_id: number;
  read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  skip: number;
  limit: number;
}

export interface NotificationUnreadCountResponse {
  unread_count: number;
  user_id: number;
}

// Extended notification for UI components (includes UI-specific fields)
export interface NotificationUI extends Notification {
  // UI-specific fields (not from backend)
  icon?: React.ReactNode;
  avatar?: string;
  sender?: {
    name: string;
    avatar?: string;
  };
}

// Helper type for notification filters
export interface NotificationFilters {
  read?: boolean;
  notification_type?: NotificationType;
  skip?: number;
  limit?: number;
}
