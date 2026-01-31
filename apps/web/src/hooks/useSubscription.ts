'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { isSubscriptionActive } from '@/utils/subscriptions';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors/api';

interface Subscription {
  id: number;
  plan_id: number;
  plan: {
    id: number;
    name: string;
    amount: number;
    currency: string;
    interval: string;
  };
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  hasActiveSubscription: boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { status: sessionStatus } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    if (sessionStatus !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/v1/subscriptions/me');
      setSubscription(response.data);
    } catch (err) {
      const appError = handleApiError(err);
      if (appError.statusCode === 404) {
        setSubscription(null);
        setError(null); // No subscription is not an error
      } else {
        setError('Failed to load subscription');
        logger.error('Failed to load subscription', appError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const hasActiveSubscription = subscription ? isSubscriptionActive(subscription.status) : false;

  return {
    subscription,
    isLoading,
    error,
    hasActiveSubscription,
    refresh: loadSubscription,
  };
}
