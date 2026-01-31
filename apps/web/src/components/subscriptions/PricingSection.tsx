'use client';

import { useEffect, useState, useCallback } from 'react';
import { PricingCard, Plan } from './PricingCard';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Alert } from '@/components/ui';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors/api';

export function PricingSection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<number | undefined>();

  const loadPlans = useCallback(async () => {
    try {
      const response = await api.get('/v1/subscriptions/plans');
      setPlans(response.data.plans || []);
    } catch (err) {
      const appError = handleApiError(err);
      setError('Failed to load plans');
      logger.error('Failed to load subscription plans', appError);
    }
  }, []);

  const loadCurrentSubscription = useCallback(async () => {
    try {
      const response = await api.get('/v1/subscriptions/me');
      setCurrentPlanId(response.data.plan_id);
    } catch (err) {
      // User may not have a subscription - this is expected for new users
      logger.debug('No subscription found', { error: err });
    }
  }, []);

  useEffect(() => {
    loadPlans();
    if (session) {
      loadCurrentSubscription();
    }
  }, [session, loadPlans, loadCurrentSubscription]);

  const handleSelectPlan = useCallback(
    async (planId: number) => {
      if (!session) {
        router.push('/auth/signin?redirect=/pricing');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const successUrl = `${window.location.origin}/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${window.location.origin}/pricing`;

        const response = await api.post('/v1/subscriptions/checkout', {
          plan_id: planId,
          success_url: successUrl,
          cancel_url: cancelUrl,
        });

        // Redirect to Stripe Checkout
        if (response.data?.url) {
          window.location.href = response.data.url;
        } else {
          throw new Error('No checkout URL received');
        }
      } catch (err) {
        const appError = handleApiError(err);
        const errorMessage = appError.message || 'Failed to create checkout session';
        setError(errorMessage);
        logger.error('Failed to create checkout session', appError, { planId });
        setIsLoading(false);
      }
    },
    [session, router]
  );

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-xl text-muted-foreground">Select the perfect plan for your needs</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            onSelect={handleSelectPlan}
            isLoading={isLoading}
            currentPlanId={currentPlanId}
          />
        ))}
      </div>
    </div>
  );
}
