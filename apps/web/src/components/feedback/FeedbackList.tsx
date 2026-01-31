'use client';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  Bug,
  Lightbulb,
  HelpCircle,
  MessageSquare,
  ThumbsUp,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { apiClient } from '@/lib/api/client';
interface Feedback {
  id: number;
  type: string;
  subject: string;
  message: string;
  status: string;
  priority: number;
  response?: string;
  created_at: string;
}
interface FeedbackListProps {
  className?: string;
}
const typeIcons = {
  bug: Bug,
  feature_request: Lightbulb,
  question: HelpCircle,
  complaint: MessageSquare,
  praise: ThumbsUp,
  other: FileText,
};
const statusIcons = { open: Clock, in_progress: Clock, resolved: CheckCircle, closed: XCircle };
const statusColors = {
  open: 'text-primary-600 dark:text-primary-400',
  in_progress: 'text-warning-600 dark:text-warning-400',
  resolved: 'text-success-600 dark:text-success-400',
  closed: 'text-muted-foreground',
};
export function FeedbackList({ className = '' }: FeedbackListProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    fetchFeedback();
  }, []);
  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Feedback[]>('/api/v1/feedback/feedback');
      if (response.data) {
        setFeedback(response.data);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return (
      <Card className={className}>
        {' '}
        <div className="text-center py-8 text-muted-foreground">Loading feedback...</div>{' '}
      </Card>
    );
  }
  if (feedback.length === 0) {
    return (
      <Card className={className}>
        {' '}
        <div className="text-center py-8 text-muted-foreground">
          {' '}
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />{' '}
          <p>No feedback submitted yet</p>{' '}
        </div>{' '}
      </Card>
    );
  }
  return (
    <Card className={className}>
      {' '}
      <h3 className="text-lg font-semibold mb-4">My Feedback</h3>{' '}
      <div className="space-y-3">
        {' '}
        {feedback.map((item) => {
          const TypeIcon = typeIcons[item.type as keyof typeof typeIcons] || FileText;
          const StatusIcon = statusIcons[item.status as keyof typeof statusIcons] || Clock;
          const statusColor =
            statusColors[item.status as keyof typeof statusColors] || 'text-muted-foreground';
          return (
            <div key={item.id} className="p-4 border border-border rounded-lg">
              {' '}
              <div className="flex items-start justify-between mb-2">
                {' '}
                <div className="flex items-center gap-2">
                  {' '}
                  <TypeIcon className="h-4 w-4 text-muted-foreground" />{' '}
                  <span className="font-medium text-sm">{item.subject}</span>{' '}
                </div>{' '}
                <div className="flex items-center gap-2">
                  {' '}
                  <StatusIcon className={`h-4 w-4 ${statusColor}`} />{' '}
                  <span className={`text-xs capitalize ${statusColor}`}>{item.status}</span>{' '}
                </div>{' '}
              </div>{' '}
              <p className="text-sm text-muted-foreground mb-2">{item.message}</p>{' '}
              {item.response && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  {' '}
                  <strong>Response:</strong> {item.response}{' '}
                </div>
              )}{' '}
              <div className="mt-2 text-xs text-muted-foreground">
                {' '}
                {new Date(item.created_at).toLocaleDateString()}{' '}
              </div>{' '}
            </div>
          );
        })}{' '}
      </div>{' '}
    </Card>
  );
}
