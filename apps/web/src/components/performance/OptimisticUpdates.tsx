/**
 * Optimistic Updates Component
 * Provides hooks and UI for optimistic update patterns
 */
'use client';

import { useState, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import { logger } from '@/lib/logger';

export interface OptimisticUpdateOptions<T> {
  onUpdate: (data: T) => Promise<T>;
  onError?: (error: Error, rollbackData: T) => void;
  onSuccess?: (data: T) => void;
  rollbackOnError?: boolean;
}

export interface OptimisticUpdatesProps {
  className?: string;
}

export function useOptimisticUpdate<T>({
  onUpdate,
  onError,
  onSuccess,
  rollbackOnError = true,
}: OptimisticUpdateOptions<T>) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const rollbackDataRef = useRef<T | null>(null);

  const update = useCallback(
    async (optimisticData: T, actualData?: T) => {
      setIsUpdating(true);
      setError(null);
      rollbackDataRef.current = optimisticData;

      try {
        const result = await onUpdate(actualData || optimisticData);
        setIsUpdating(false);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsUpdating(false);

        if (rollbackOnError && rollbackDataRef.current) {
          onError?.(error, rollbackDataRef.current);
        }

        throw error;
      }
    },
    [onUpdate, onError, onSuccess, rollbackOnError]
  );

  return { update, isUpdating, error };
}

export default function OptimisticUpdates({ className }: OptimisticUpdatesProps) {
  const [items, setItems] = useState([
    { id: '1', name: 'Item 1', count: 0 },
    { id: '2', name: 'Item 2', count: 0 },
    { id: '3', name: 'Item 3', count: 0 },
  ]);

  const { update: updateItem, isUpdating, error } = useOptimisticUpdate({
    onUpdate: async (updatedItem) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate random failure (10% chance)
      if (Math.random() < 0.1) {
        throw new Error('Network error occurred');
      }

      return updatedItem;
    },
    onError: (error, rollbackData) => {
      logger.error('Update failed, rolling back', error instanceof Error ? error : new Error(String(error)), {
        rollbackData,
      });
      // Rollback would happen automatically
    },
    onSuccess: (data) => {
      logger.info('Update successful', { data });
    },
    rollbackOnError: true,
  });

  const handleIncrement = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // Optimistic update
    const optimisticItem = { ...item, count: item.count + 1 };
    setItems((prev) => prev.map((i) => (i.id === itemId ? optimisticItem : i)));

    try {
      await updateItem(optimisticItem);
    } catch (err) {
      // Rollback on error
      setItems((prev) => prev.map((i) => (i.id === itemId ? item : i)));
    }
  };

  const handleDecrement = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || item.count === 0) return;

    // Optimistic update
    const optimisticItem = { ...item, count: item.count - 1 };
    setItems((prev) => prev.map((i) => (i.id === itemId ? optimisticItem : i)));

    try {
      await updateItem(optimisticItem);
    } catch (err) {
      // Rollback on error
      setItems((prev) => prev.map((i) => (i.id === itemId ? item : i)));
    }
  };

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Optimistic Updates</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Updates UI immediately, then syncs with server. Automatically rolls back on error.
          </p>
        </div>

        {error && (
          <Alert variant="error" onClose={() => {}}>
            Update failed: {error.message}. Changes have been rolled back.
          </Alert>
        )}

        {isUpdating && <Alert variant="info">Syncing changes with server...</Alert>}

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={clsx('p-4 rounded-lg border', 'bg-muted', 'border-border', 'flex items-center justify-between')}
            >
              <div>
                <div className="font-medium text-foreground">{item.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Count: <span className="font-semibold">{item.count}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecrement(item.id)}
                  disabled={item.count === 0 || isUpdating}
                >
                  -
                </Button>
                <Badge variant="default">{item.count}</Badge>
                <Button variant="primary" size="sm" onClick={() => handleIncrement(item.id)} disabled={isUpdating}>
                  +
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Try incrementing/decrementing items. The UI updates immediately, then syncs with the server. If the
            sync fails, changes are automatically rolled back.
          </p>
        </div>
      </div>
    </Card>
  );
}
