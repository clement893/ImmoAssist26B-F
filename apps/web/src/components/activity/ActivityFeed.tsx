/**
 * Activity Feed Component
 * Real-time activity feed with live updates
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Activity, RefreshCw, Bell } from 'lucide-react';
import Timeline from '@/components/ui/Timeline';
import type { TimelineItem } from '@/components/ui/Timeline';

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  action: string;
  resource: string;
  resourceId?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: React.ReactNode;
}

export interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  onLoadMore?: () => Promise<ActivityFeedItem[]>;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

export default function ActivityFeed({
  activities: initialActivities,
  onLoadMore,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
  className,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityFeedItem[]>(initialActivities);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!autoRefresh || !onLoadMore) {
      return;
    }

    intervalRef.current = setInterval(async () => {
      try {
        const newActivities = await onLoadMore();
        if (newActivities.length > 0) {
          setActivities((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const unique = newActivities.filter((a) => !existingIds.has(a.id));
            return [...unique, ...prev].slice(0, 50); // Keep last 50
          });
        }
      } catch (error) {
        logger.error('', 'Failed to refresh activities', error);
      }
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, onLoadMore]);

  const handleLoadMore = async () => {
    if (!onLoadMore || loading || !hasMore) return;

    setLoading(true);
    try {
      const newActivities = await onLoadMore();
      if (newActivities.length === 0) {
        setHasMore(false);
      } else {
        setActivities((prev) => [...prev, ...newActivities]);
      }
    } catch (error) {
      logger.error('', 'Failed to load more activities', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: ActivityFeedItem['type']): TimelineItem['color'] => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'primary';
    }
  };

  const timelineItems: TimelineItem[] = activities.map((activity) => ({
    id: activity.id,
    title: `${activity.user.name} ${activity.action} ${activity.resource}`,
    description: activity.resourceId ? `ID: ${activity.resourceId}` : undefined,
    timestamp: new Date(activity.timestamp).toLocaleString(),
    status: 'completed' as const,
    color: getTypeColor(activity.type),
    icon: activity.icon,
  }));

  return (
    <Card className={clsx('bg-background', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Feed
          {autoRefresh && (
            <Badge variant="info">
              <Bell className="w-3 h-3 mr-1" />
              Live
            </Badge>
          )}
        </h3>
        {onLoadMore && (
          <button
            onClick={handleLoadMore}
            disabled={loading || !hasMore}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-modern', // UI Revamp - Transition moderne
              'text-foreground',
              'hover:bg-muted dark:hover:bg-muted',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
            {loading ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No activity yet</p>
        </div>
      ) : (
        <Timeline items={timelineItems} orientation="vertical" />
      )}
    </Card>
  );
}
