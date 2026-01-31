'use client';

import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button, Card, Alert, Badge, Container, Loading } from '@/components/ui';
import { subscriptionsAPI } from '@/lib/api';

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

interface Plan {
  id: number;
  name: string;
  description?: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
}

function StripeTestContent() {
  // Component state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  interface Subscription {
    id: string;
    status: string;
    [key: string]: unknown;
  }

  const [mySubscription, setMySubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    loadPlans();
    loadMySubscription();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await subscriptionsAPI.getPlans(true);
      if (response.data?.plans) {
        setPlans(response.data.plans);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.detail || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const loadMySubscription = async () => {
    try {
      const response = await subscriptionsAPI.getMySubscription();
      if (response.data) {
        setMySubscription(response.data);
      }
    } catch (err) {
      // Subscription might not exist, that's okay
      setMySubscription(null);
    }
  };

  const handleCreateCheckout = async (planId: number) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const baseUrl = window.location.origin;
      const response = await subscriptionsAPI.createCheckoutSession({
        plan_id: planId,
        success_url: `${baseUrl}/stripe/testing?success=true`,
        cancel_url: `${baseUrl}/stripe/testing?canceled=true`,
      });

      if (response.data?.url) {
        setSuccess('Checkout session created successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = response.data.url;
        }, 2000);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.detail || 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePortal = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const baseUrl = window.location.origin;
      const response = await subscriptionsAPI.createPortalSession(`${baseUrl}/stripe/testing`);

      if (response.data?.url) {
        setSuccess('Portal session created successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = response.data.url;
        }, 2000);
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.detail || 'Failed to create portal session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Stripe Test</h1>
        <p className="text-muted-foreground">
          Test Stripe integration for subscriptions and payments
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          {success}
        </Alert>
      )}

      {/* Current Subscription */}
      {mySubscription && (
        <Card className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan:</span>
              <Badge variant="default">
                {(mySubscription.plan as { name?: string })?.name || 'N/A'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={mySubscription.status === 'ACTIVE' ? 'success' : 'default'}>
                {String(mySubscription.status)}
              </Badge>
            </div>
            {mySubscription.current_period_end ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period End:</span>
                <span>
                  {new Date(
                    mySubscription.current_period_end as string | number | Date
                  ).toLocaleDateString()}
                </span>
              </div>
            ) : null}
            <div className="mt-4">
              <Button onClick={handleCreatePortal} disabled={loading}>
                Open Customer Portal
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Available Plans */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
        {loading && !plans.length ? (
          <div className="py-12 text-center">
            <Loading />
          </div>
        ) : plans.length === 0 ? (
          <Alert variant="info">No plans available. Please configure plans in the backend.</Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-4">
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                )}
                <div className="mb-4">
                  <span className="text-2xl font-bold">
                    {(plan.amount / 100).toFixed(2)} {plan.currency.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground"> / {plan.interval.toLowerCase()}</span>
                </div>
                <Button
                  onClick={() => handleCreateCheckout(plan.id)}
                  disabled={loading}
                  fullWidth
                  variant="primary"
                >
                  Subscribe
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <h2 className="text-xl font-semibold mb-4">How to Test</h2>
        <div className="space-y-4 text-sm text-foreground">
          <div>
            <h3 className="font-semibold mb-1 text-foreground">1. Check Configuration</h3>
            <p>Verify that Stripe API keys are configured in environment variables:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>STRIPE_SECRET_KEY</li>
              <li>STRIPE_PUBLISHABLE_KEY (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-1 text-foreground">2. Test Checkout</h3>
            <p>Click "Subscribe" on a plan to create a Stripe checkout session. Use test card:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>Card: 4242 4242 4242 4242</li>
              <li>Expiry: Any future date</li>
              <li>CVC: Any 3 digits</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-1 text-foreground">3. Customer Portal</h3>
            <p>
              If you have an active subscription, use "Open Customer Portal" to test the Stripe
              customer portal.
            </p>
          </div>
          <Alert variant="warning" title="⚠️ Important" className="mt-4">
            Make sure you're using Stripe test mode keys. Never use production keys in development.
          </Alert>
        </div>
      </Card>
    </Container>
  );
}

export default function StripeTestPage() {
  return (
    <ProtectedRoute>
      <StripeTestContent />
    </ProtectedRoute>
  );
}
