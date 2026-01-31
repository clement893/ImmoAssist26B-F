'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getErrorMessage, getErrorDetail } from '@/lib/errors';
import {
  useMySubscription,
  useSubscriptionPayments,
  useCreateCheckoutSession,
  useCancelSubscription,
} from '@/lib/query/queries';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Container from '@/components/ui/Container';
import Loading from '@/components/ui/Loading';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import SubscriptionCard from '@/components/subscriptions/SubscriptionCard';
import { PaymentHistory, type Payment } from '@/components/billing';

// Note: Client Components are already dynamic by nature.
// Route segment config (export const dynamic) only works in Server Components.
// Since this page uses useSearchParams (which requires dynamic rendering),
// and it's a Client Component, it will be rendered dynamically automatically.

interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  amount: number;
  currency: string;
  billing_period: 'month' | 'year';
}

function SubscriptionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use React Query hooks for data fetching
  const {
    data: subscriptionData,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useMySubscription();
  const { data: paymentsData, isLoading: paymentsLoading } = useSubscriptionPayments();
  const createCheckoutMutation = useCreateCheckoutSession();
  const cancelSubscriptionMutation = useCancelSubscription();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleSubscribe = useCallback(
    async (planId: string, period: 'month' | 'year') => {
      try {
        setError('');
        const response = await createCheckoutMutation.mutateAsync({
          plan_id: parseInt(planId, 10),
          success_url: `${window.location.origin}/subscriptions/success?plan=${planId}&period=${period}`,
          cancel_url: `${window.location.origin}/subscriptions`,
        });

        // Redirect to checkout URL if provided, otherwise to success page
        if (response.data.checkout_url) {
          window.location.href = response.data.checkout_url;
        } else {
          router.push(`/subscriptions/success?plan=${planId}&period=${period}`);
        }
      } catch (err: unknown) {
        setError(getErrorDetail(err) || getErrorMessage(err, 'Error subscribing to plan'));
      }
    },
    [router, createCheckoutMutation]
  );

  // Transform subscription data from React Query
  useEffect(() => {
    if (subscriptionData?.data) {
      const sub = subscriptionData.data;
      setSubscription({
        id: String(sub.id),
        plan_id: String(sub.plan_id),
        plan_name: sub.plan?.name || 'Unknown Plan',
        status: sub.status.toLowerCase() as 'active' | 'cancelled' | 'expired' | 'trial',
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end || false,
        amount: sub.plan?.amount ? sub.plan.amount / 100 : 0, // Convert from cents
        currency: sub.plan?.currency?.toUpperCase() || 'USD',
        billing_period: (sub.plan?.interval?.toLowerCase() === 'year' ? 'year' : 'month') as
          | 'month'
          | 'year',
      });
    } else if (!subscriptionLoading && !subscriptionData) {
      setSubscription(null);
    }
  }, [subscriptionData, subscriptionLoading]);

  // Transform payments data from React Query
  useEffect(() => {
    if (paymentsData?.data) {
      setPayments(
        paymentsData.data.map(
          (payment: {
            id: string | number;
            amount: number;
            currency: string;
            status: string;
            created_at: string;
            invoice_url?: string;
            description?: string;
            payment_method?: string;
          }): Payment => ({
            id: String(payment.id),
            amount: payment.amount / 100, // Convert from cents
            currency: payment.currency.toUpperCase(),
            status: (payment.status.toLowerCase() === 'paid'
              ? 'completed'
              : payment.status.toLowerCase()) as 'completed' | 'pending' | 'failed' | 'refunded',
            date: payment.created_at,
            description: payment.description || 'Subscription payment',
            paymentMethod: payment.payment_method || 'Card',
            transactionId: payment.invoice_url,
          })
        )
      );
    } else if (!paymentsLoading && !paymentsData) {
      setPayments([]);
    }
  }, [paymentsData, paymentsLoading]);

  // Update loading state based on React Query
  useEffect(() => {
    setLoading(subscriptionLoading || paymentsLoading);
  }, [subscriptionLoading, paymentsLoading]);

  // Handle errors from React Query
  useEffect(() => {
    if (subscriptionError) {
      setError(
        getErrorDetail(subscriptionError) ||
          getErrorMessage(subscriptionError, 'Error loading subscription')
      );
    }
  }, [subscriptionError]);

  useEffect(() => {
    // Check if coming from pricing page
    const planId = searchParams.get('plan');
    const period = searchParams.get('period') as 'month' | 'year' | null;

    if (planId && period) {
      // Redirect to subscription creation flow
      handleSubscribe(planId, period);
    }
  }, [router, searchParams, handleSubscribe]);

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        'Are you sure you want to cancel your subscription? It will remain active until the end of the current period.'
      )
    ) {
      return;
    }

    try {
      setError('');
      await cancelSubscriptionMutation.mutateAsync();
      // React Query will automatically refetch subscription data
    } catch (err: unknown) {
      setError(getErrorDetail(err) || getErrorMessage(err, 'Error canceling subscription'));
    }
  };

  const handleResumeSubscription = async () => {
    try {
      setLoading(true);
      setError('');
      // Note: Resume subscription may require creating a new checkout session
      // or calling a specific resume endpoint if available
      // If resume endpoint exists:
      // const { subscriptionsAPI } = await import('@/lib/api');
      // await subscriptionsAPI.resumeSubscription();
      // Otherwise, redirect to pricing to resubscribe
      router.push('/pricing');
    } catch (err: unknown) {
      setError(getErrorDetail(err) || getErrorMessage(err, 'Error resuming subscription'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12">
      <Container>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Subscriptions</h1>
          <p className="text-muted-foreground">Manage your subscription and payments</p>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <Card>
            <div className="py-12 text-center">
              <Loading />
            </div>
          </Card>
        ) : subscription ? (
          <>
            <SubscriptionCard
              subscription={subscription}
              onCancel={handleCancelSubscription}
              onResume={handleResumeSubscription}
            />
            <PaymentHistory payments={payments} />
          </>
        ) : (
          <Card>
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-6">You don't have an active subscription</p>
              <Link href="/pricing">
                <Button>View Plans</Button>
              </Link>
            </div>
          </Card>
        )}
      </Container>
    </div>
  );
}

function SubscriptionsPageContent() {
  return (
    <Suspense
      fallback={
        <div className="py-12">
          <Container>
            <Card>
              <div className="py-12 text-center">
                <Loading />
              </div>
            </Card>
          </Container>
        </div>
      }
    >
      <SubscriptionsContent />
    </Suspense>
  );
}

export default function SubscriptionsPage() {
  return (
    <ProtectedRoute>
      <SubscriptionsPageContent />
    </ProtectedRoute>
  );
}
