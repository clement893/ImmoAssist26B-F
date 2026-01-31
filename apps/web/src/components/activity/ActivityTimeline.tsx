'use client';

import { useState, useEffect } from 'react';
import { Clock, FileText, Settings, Shield, CreditCard, Users, Tag } from 'lucide-react';

// Simple date formatting function (date-fns alternative)
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let result = '';
  if (diffSecs < 60) {
    result = 'just now';
  } else if (diffMins < 60) {
    result = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    result = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    result = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    result = date.toLocaleDateString();
  }
  return result;
};

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ActivityTimelineProps {
  activities: ActivityItem[];
  className?: string;
  showUserInfo?: boolean;
  groupByDate?: boolean;
}

const getActivityIcon = (action: string) => {
  const iconClass = 'h-4 w-4';
  if (action.includes('create') || action.includes('add')) {
    return <FileText className={`${iconClass} text-success-500`} />;
  }
  if (action.includes('update') || action.includes('edit')) {
    return <Settings className={`${iconClass} text-primary-500`} />;
  }
  if (action.includes('delete') || action.includes('remove')) {
    return <FileText className={`${iconClass} text-error-500`} />;
  }
  if (action.includes('login') || action.includes('auth')) {
    return <Shield className={`${iconClass} text-primary-500`} />;
  }
  if (action.includes('payment') || action.includes('billing')) {
    return <CreditCard className={`${iconClass} text-warning-500`} />;
  }
  if (action.includes('team') || action.includes('user')) {
    return <Users className={`${iconClass} text-indigo-500`} />;
  }
  if (action.includes('tag')) {
    return <Tag className={`${iconClass} text-pink-500`} />;
  }
  return <Clock className={`${iconClass} text-muted-foreground`} />;
};

const formatActivityMessage = (activity: ActivityItem): string => {
  const { action, entity_type, user_name, user_email } = activity;
  const userName = user_name || user_email || 'Someone';

  // Format common actions
  const actionMap: Record<string, string> = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
    login: 'logged in',
    logout: 'logged out',
    register: 'registered',
    subscribe: 'subscribed',
    unsubscribe: 'unsubscribed',
    add: 'added',
    remove: 'removed',
    tag: 'tagged',
  };

  const formattedAction =
    Object.entries(actionMap).find(([key]) => action.toLowerCase().includes(key))?.[1] || action;

  return `${userName} ${formattedAction} ${entity_type}`;
};

const groupByDate = (activities: ActivityItem[]): Record<string, ActivityItem[]> => {
  const groups: Record<string, ActivityItem[]> = {};
  activities.forEach((activity) => {
    const date = new Date(activity.timestamp);
    const dateKey = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(activity);
  });
  return groups;
};

export function ActivityTimeline({
  activities,
  className = '',
  showUserInfo = true,
  groupByDate: shouldGroupByDate = true,
}: ActivityTimelineProps) {
  const [groupedActivities, setGroupedActivities] = useState<Record<string, ActivityItem[]>>({});
  const [flatActivities, setFlatActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (shouldGroupByDate) {
      const grouped = groupByDate(activities);
      setGroupedActivities(grouped);
    } else {
      setFlatActivities(
        [...activities].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      );
    }
  }, [activities, shouldGroupByDate]);

  if (shouldGroupByDate) {
    const dateKeys = Object.keys(groupedActivities).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    return (
      <div className={className}>
        {dateKeys.map((dateKey) => (
          <div key={dateKey} className="mb-8">
            <div className="sticky top-0 bg-background py-2 z-10 border-b border-border mb-4">
              <h3 className="text-sm font-semibold text-foreground">{dateKey}</h3>
            </div>
            <div className="relative pl-8">
              {/* Timeline line */}
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-muted" />
              {groupedActivities[dateKey]?.map((activity) => (
                <div key={activity.id} className="relative mb-6 last:mb-0">
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-background border-2 border-primary-500 flex items-center justify-center z-10">
                    {getActivityIcon(activity.action)}
                  </div>
                  {/* Activity content */}
                  <div className="ml-8">
                    <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {formatActivityMessage(activity)}
                          </p>
                          {showUserInfo && activity.user_name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.user_email}
                            </p>
                          )}
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <details className="cursor-pointer">
                                <summary>View details</summary>
                                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                  {JSON.stringify(activity.metadata, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                        <div className="ml-4 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.timestamp))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Flat timeline (no grouping)
  return (
    <div className={className}>
      <div className="relative pl-8">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-muted" />
        {flatActivities.map((activity) => (
          <div key={activity.id} className="relative mb-6 last:mb-0">
            {/* Timeline dot */}
            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-background border-2 border-primary-500 flex items-center justify-center z-10">
              {getActivityIcon(activity.action)}
            </div>
            {/* Activity content */}
            <div className="ml-8">
              <div className="bg-background border border-border rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {formatActivityMessage(activity)}
                    </p>
                    {showUserInfo && activity.user_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.user_email}
                      </p>
                    )}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <details className="cursor-pointer">
                          <summary>View details</summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
