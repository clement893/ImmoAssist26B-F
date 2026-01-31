'use client';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Flag, ToggleLeft, ToggleRight, Trash2, BarChart3 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rollout_percentage: number;
  is_ab_test: boolean;
  created_at: string;
}
interface FeatureFlagManagerProps {
  className?: string;
}
export function FeatureFlagManager({ className = '' }: FeatureFlagManagerProps) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  useEffect(() => {
    fetchFlags();
  }, []);
  const fetchFlags = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<FeatureFlag[]>('/api/v1/feature-flags/feature-flags');
      if (response.data) {
        setFlags(response.data);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch feature flags:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleToggle = async (flag: FeatureFlag) => {
    try {
      await apiClient.put(`/v1/feature-flags/${flag.id}`, { enabled: !flag.enabled });
      setFlags(flags.map((f) => (f.id === flag.id ? { ...f, enabled: !f.enabled } : f)));
      showToast({
        message: `Feature flag ${!flag.enabled ? 'enabled' : 'disabled'}`,
        type: 'success',
      });
    } catch (error: unknown) {
      showToast({
        message: getErrorMessage(error) || 'Failed to update feature flag',
        type: 'error',
      });
    }
  };
  const handleDelete = async (flagId: number) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return;
    try {
      await apiClient.delete(`/v1/feature-flags/${flagId}`);
      setFlags(flags.filter((f) => f.id !== flagId));
      showToast({ message: 'Feature flag deleted successfully', type: 'success' });
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Failed to delete feature flag';
      showToast({ message: errorMessage, type: 'error' });
    }
  };
  if (isLoading) {
    return (
      <Card className={className}>
        {' '}
        <div className="text-center py-8 text-muted-foreground">Loading feature flags...</div>{' '}
      </Card>
    );
  }
  return (
    <Card className={className}>
      {' '}
      <div className="flex items-center justify-between mb-4">
        {' '}
        <h3 className="text-lg font-semibold">Feature Flags</h3>{' '}
        <Button variant="primary" size="sm">
          {' '}
          <Flag className="h-4 w-4 mr-2" /> New Flag{' '}
        </Button>{' '}
      </div>{' '}
      {flags.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {' '}
          <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />{' '}
          <p>No feature flags</p>{' '}
        </div>
      ) : (
        <div className="space-y-3">
          {' '}
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg"
            >
              {' '}
              <div className="flex items-center gap-3 flex-1">
                {' '}
                <button onClick={() => handleToggle(flag)} className="flex-shrink-0">
                  {' '}
                  {flag.enabled ? (
                    <ToggleRight className="h-6 w-6 text-primary-500" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                  )}{' '}
                </button>{' '}
                <div className="flex-1">
                  {' '}
                  <div className="flex items-center gap-2 mb-1">
                    {' '}
                    <span className="font-medium text-sm">{flag.name}</span>{' '}
                    <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                      {' '}
                      {flag.key}{' '}
                    </span>{' '}
                    {flag.is_ab_test && (
                      <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded">
                        {' '}
                        A/B Test{' '}
                      </span>
                    )}{' '}
                  </div>{' '}
                  {flag.description && (
                    <p className="text-xs text-muted-foreground"> {flag.description} </p>
                  )}{' '}
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    {' '}
                    <span>{flag.rollout_percentage}% rollout</span>{' '}
                    {flag.enabled && (
                      <span className="text-success-600 dark:text-success-400">Active</span>
                    )}{' '}
                  </div>{' '}
                </div>{' '}
              </div>{' '}
              <div className="flex gap-1">
                {' '}
                <button
                  className="p-1 hover:bg-muted dark:hover:bg-muted rounded"
                  title="View stats"
                >
                  {' '}
                  <BarChart3 className="h-4 w-4" />{' '}
                </button>{' '}
                <button
                  onClick={() => handleDelete(flag.id)}
                  className="p-1 hover:bg-error-50 dark:hover:bg-error-900/20 rounded text-error-500"
                  title="Delete"
                >
                  {' '}
                  <Trash2 className="h-4 w-4" />{' '}
                </button>{' '}
              </div>{' '}
            </div>
          ))}{' '}
        </div>
      )}{' '}
    </Card>
  );
}
