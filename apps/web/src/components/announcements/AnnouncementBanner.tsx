'use client';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, Gift } from 'lucide-react';
import Button from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';
interface Announcement {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_dismissible: boolean;
  action_label?: string;
  action_url?: string;
}
interface AnnouncementBannerProps {
  className?: string;
  showOnLogin?: boolean;
}
const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  promotion: Gift,
};
const typeStyles = {
  info: 'bg-primary-50 dark:bg-primary-900 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200',
  success:
    'bg-success-50 dark:bg-success-900 border-success-200 dark:border-success-800 text-success-800 dark:text-success-200',
  warning:
    'bg-warning-50 dark:bg-warning-900 border-warning-200 dark:border-warning-800 text-warning-800 dark:text-warning-200',
  error:
    'bg-error-50 dark:bg-error-900 border-error-200 dark:border-error-800 text-error-800 dark:text-error-200',
  promotion:
    'bg-primary-50 dark:bg-primary-900 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200',
};
export function AnnouncementBanner({
  className = '',
  showOnLogin = false,
}: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  useEffect(() => {
    fetchAnnouncements();
  }, [showOnLogin]);
  const fetchAnnouncements = async () => {
    try {
      const response = await apiClient.get<Announcement[]>('/v1/announcements', {
        params: { show_on_login: showOnLogin || undefined },
      });
      if (response.data) {
        setAnnouncements(response.data);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch announcements:', error);
    }
  };
  const handleDismiss = async (announcementId: number) => {
    try {
      await apiClient.post(`/v1/announcements/${announcementId}/dismiss`);
      setDismissedIds(new Set([...dismissedIds, announcementId]));
    } catch (error) {
      logger.error('', 'Failed to dismiss announcement:', error);
    }
  };
  const visibleAnnouncements = announcements.filter((ann) => !dismissedIds.has(ann.id));
  if (visibleAnnouncements.length === 0) {
    return null;
  }
  return (
    <div className={`space-y-2 ${className}`}>
      {' '}
      {visibleAnnouncements.map((announcement) => {
        const Icon = typeIcons[announcement.type];
        const styles = typeStyles[announcement.type];
        return (
          <div
            key={announcement.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${styles}`}
          >
            {' '}
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />{' '}
            <div className="flex-1 min-w-0">
              {' '}
              <h4 className="font-semibold text-sm mb-1">{announcement.title}</h4>{' '}
              <p className="text-sm">{announcement.message}</p>{' '}
              {announcement.action_label && announcement.action_url && (
                <div className="mt-2">
                  {' '}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (announcement.action_url?.startsWith('http')) {
                        window.open(announcement.action_url, '_blank');
                      } else {
                        window.location.href = announcement.action_url || '#';
                      }
                    }}
                  >
                    {' '}
                    {announcement.action_label}{' '}
                  </Button>{' '}
                </div>
              )}{' '}
            </div>{' '}
            {announcement.is_dismissible && (
              <button
                onClick={() => handleDismiss(announcement.id)}
                className="flex-shrink-0 p-1 hover:bg-foreground/10 dark:hover:bg-background/10 rounded"
                aria-label="Dismiss"
              >
                {' '}
                <X className="h-4 w-4" />{' '}
              </button>
            )}{' '}
          </div>
        );
      })}{' '}
    </div>
  );
}
