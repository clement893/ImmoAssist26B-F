'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';

// Note: Client Components are already dynamic by nature.
// Route segment config (export const dynamic) only works in Server Components.
// Since this page uses useSearchParams (which requires dynamic rendering),
// and it's a Client Component, it will be rendered dynamically automatically.

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [planName, setPlanName] = useState('');
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');

  const initializeData = useCallback(() => {
    const plan = searchParams.get('plan');
    const period = searchParams.get('period') as 'month' | 'year' | null;

    // Map plan IDs to names
    const planNames: Record<string, string> = {
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };

    setPlanName(planNames[plan || ''] || plan || '');
    setBillingPeriod(period || 'month');
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    initializeData();
  }, [isAuthenticated, router, initializeData]);

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <Card className="w-full max-w-2xl">
        <div className="p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 dark:bg-success-900 mb-6">
            <svg
              className="h-8 w-8 text-success-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-4">Abonnement confirmé !</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Merci pour votre confiance. Votre abonnement <strong>{planName}</strong> est maintenant
            actif.
          </p>

          {/* Subscription Details */}
          <div className="bg-muted rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Détails de votre abonnement
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium text-foreground">{planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Période:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {billingPeriod === 'month' ? 'Mensuel' : 'Annuel'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Statut:</span>
                <span className="font-medium text-success-600 dark:text-success-400">Actif</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">Prochaines étapes</h3>
            <ul className="text-left space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <span className="text-success-600 mr-2">✓</span>
                <span>
                  Vous pouvez maintenant accéder à toutes les fonctionnalités de votre plan
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-success-600 mr-2">✓</span>
                <span>Un email de confirmation a été envoyé à votre adresse</span>
              </li>
              <li className="flex items-start">
                <span className="text-success-600 mr-2">✓</span>
                <span>Vous pouvez gérer votre abonnement depuis la page Mes Abonnements</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button>Aller au tableau de bord</Button>
            </Link>
            <Link href="/subscriptions">
              <Button variant="outline">Gérer mon abonnement</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-success-50 to-success-100 dark:from-muted dark:to-muted flex items-center justify-center px-4">
          <Card className="w-full max-w-2xl">
            <div className="p-8 text-center">
              <Loading />
              <p className="mt-4 text-muted-foreground">Chargement...</p>
            </div>
          </Card>
        </div>
      }
    >
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
