/** * Notification Center Component * Centralized notification management and display */ 'use client';
import { useState, useMemo, useEffect } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Bell, Check, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { NotificationUI } from '@/types/notification';
export interface NotificationCenterProps {
  notifications: NotificationUI[];
  onMarkAsRead?: (id: number) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onActionClick?: (notification: NotificationUI) => void;
  className?: string;
}
export default function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onActionClick,
  className,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [localNotifications, setLocalNotifications] = useState<NotificationUI[]>(notifications);
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);
  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':
        return localNotifications.filter((n) => !n.read);
      case 'read':
        return localNotifications.filter((n) => n.read);
      default:
        return localNotifications;
    }
  }, [localNotifications, filter]);
  const unreadCount = useMemo(() => {
    return localNotifications.filter((n) => !n.read).length;
  }, [localNotifications]);
  const handleMarkAsRead = async (id: number) => {
    setLocalNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await onMarkAsRead?.(id);
  };
  const handleMarkAllAsRead = async () => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await onMarkAllAsRead?.();
  };
  const handleDelete = async (id: number) => {
    setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
    await onDelete?.(id);
  };
  const getTypeStyles = (type: NotificationUI['notification_type']) => {
    switch (type) {
      case 'success':
        return 'border-success-200 dark:border-success-800 bg-success-50 dark:bg-success-900/20';
      case 'warning':
        return 'border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20';
      case 'error':
        return 'border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20';
      default:
        return 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20';
    }
  };
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };
  return (
    <Card className={clsx('bg-background', className)}>
      {' '}
      <div className="mb-6">
        {' '}
        <div className="flex items-center justify-between mb-4">
          {' '}
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {' '}
            <Bell className="w-5 h-5" /> Notifications{' '}
            {unreadCount > 0 && <Badge variant="error">{unreadCount}</Badge>}{' '}
          </h3>{' '}
          {unreadCount > 0 && onMarkAllAsRead && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              {' '}
              <span className="flex items-center gap-2">
                {' '}
                <Check className="w-4 h-4" /> Mark All Read{' '}
              </span>{' '}
            </Button>
          )}{' '}
        </div>{' '}
        {/* Filter Tabs */}{' '}
        <div className="flex items-center gap-2 border-b border-border">
          {' '}
          {(['all', 'unread', 'read'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={clsx(
                'px-4 py-2 text-sm font-medium border-b-2 transition-modern', // UI Revamp - Transition moderne
                filter === filterType
                  ? 'border-primary-500 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground'
              )}
            >
              {' '}
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}{' '}
              {filterType === 'unread' && unreadCount > 0 && (
                <Badge variant="error" className="ml-2">
                  {' '}
                  {unreadCount}{' '}
                </Badge>
              )}{' '}
            </button>
          ))}{' '}
        </div>{' '}
      </div>{' '}
      {/* Notifications List */}{' '}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          {' '}
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />{' '}
          <p className="text-muted-foreground">
            {' '}
            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}{' '}
          </p>{' '}
        </div>
      ) : (
        <div className="space-y-2">
          {' '}
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={clsx(
                'p-4 rounded-lg border transition-modern', // UI Revamp - Transition moderne
                getTypeStyles(notification.notification_type),
                !notification.read && 'ring-2 ring-primary-500 dark:ring-primary-400'
              )}
            >
              {' '}
              <div className="flex items-start gap-3">
                {' '}
                {/* Avatar/Icon */}{' '}
                <div className="flex-shrink-0">
                  {' '}
                  {notification.sender?.avatar || notification.avatar ? (
                    <Avatar
                      src={notification.sender?.avatar || notification.avatar}
                      name={notification.sender?.name || notification.title}
                      size="sm"
                    />
                  ) : (
                    notification.icon || (
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        {' '}
                        <Bell className="w-4 h-4 text-primary-600 dark:text-primary-400" />{' '}
                      </div>
                    )
                  )}{' '}
                </div>{' '}
                {/* Content */}{' '}
                <div className="flex-1 min-w-0">
                  {' '}
                  <div className="flex items-start justify-between gap-2">
                    {' '}
                    <div className="flex-1">
                      {' '}
                      <div className="flex items-center gap-2 mb-1">
                        {' '}
                        <h4 className="text-sm font-semibold text-foreground">
                          {' '}
                          {notification.title}{' '}
                        </h4>{' '}
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />
                        )}{' '}
                      </div>{' '}
                      <p className="text-sm text-foreground mb-2"> {notification.message} </p>{' '}
                      <div className="flex items-center gap-3">
                        {' '}
                        <span className="text-xs text-muted-foreground">
                          {' '}
                          {formatTimestamp(notification.created_at)}{' '}
                        </span>{' '}
                        {notification.action_url && (
                          <button
                            onClick={() => onActionClick?.(notification)}
                            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                          >
                            {' '}
                            {notification.action_label || 'View'}{' '}
                          </button>
                        )}{' '}
                      </div>{' '}
                    </div>{' '}
                    {/* Actions */}{' '}
                    <div className="flex items-center gap-1">
                      {' '}
                      {!notification.read && onMarkAsRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-1 text-muted-foreground hover:text-success-600 dark:hover:text-success-400 transition-modern" // UI Revamp - Transition moderne
                          title="Mark as read"
                        >
                          {' '}
                          <Check className="w-4 h-4" />{' '}
                        </button>
                      )}{' '}
                      {onDelete && (
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-1 text-muted-foreground hover:text-danger-600 dark:hover:text-danger-400 transition-modern" // UI Revamp - Transition moderne
                          title="Delete"
                        >
                          {' '}
                          <X className="w-4 h-4" />{' '}
                        </button>
                      )}{' '}
                    </div>{' '}
                  </div>{' '}
                </div>{' '}
              </div>{' '}
            </div>
          ))}{' '}
        </div>
      )}{' '}
    </Card>
  );
}
