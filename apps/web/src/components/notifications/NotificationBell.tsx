/**
 * Notification Bell Component
 * Notification indicator with dropdown
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Bell } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Dropdown from '@/components/ui/Dropdown';
import type { DropdownItem } from '@/components/ui/Dropdown';
import NotificationCenter from './NotificationCenter';
import type { NotificationUI } from '@/types/notification';

export interface NotificationBellProps {
  notifications: NotificationUI[];
  /** Total unread count (if provided, used instead of calculating from notifications) */
  unreadCount?: number;
  onMarkAsRead?: (id: number) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onActionClick?: (notification: NotificationUI) => void;
  onViewAll?: () => void;
  className?: string;
}

export default function NotificationBell({
  notifications,
  unreadCount: providedUnreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onActionClick,
  onViewAll,
  className,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Use provided unreadCount if available, otherwise calculate from notifications
  const unreadCount =
    providedUnreadCount ?? notifications.filter((n) => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const dropdownItems: DropdownItem[] = [
    {
      label: 'View All Notifications',
      onClick: () => {
        setIsOpen(false);
        onViewAll?.();
      },
    },
    ...(unreadCount > 0 && onMarkAllAsRead
      ? [
          {
            label: 'Mark All as Read',
            onClick: async () => {
              await onMarkAllAsRead();
            },
          },
        ]
      : []),
  ];

  return (
    <div ref={bellRef} className={clsx('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'relative p-2 rounded-lg transition-colors',
          'text-foreground',
          'hover:bg-muted dark:hover:bg-muted',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1">
            <Badge variant="error" className="text-xs px-1.5 py-0.5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 z-50">
          <div className="bg-background rounded-lg shadow-xl border border-border max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Notifications
              </h3>
              <Dropdown
                trigger={<button className="p-1">⋯</button>}
                items={dropdownItems}
              />
            </div>

            {/* Notifications */}
            <div className="overflow-y-auto flex-1">
              <NotificationCenter
                notifications={recentNotifications}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                onDelete={onDelete}
                onActionClick={(notification) => {
                  setIsOpen(false);
                  onActionClick?.(notification);
                }}
              />
            </div>

            {/* Footer */}
            {notifications.length > 5 && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onViewAll?.();
                  }}
                  className="w-full text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  View All Notifications ({notifications.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
