/**
 * Billing Settings Page
 *
 * Page for managing billing settings and preferences.
 * Uses existing BillingSettings component.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { BillingSettings } from '@/components/billing';
import type { BillingSettingsData } from '@/components/billing';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';

export default function BillingSettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.billing');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingSettings, setBillingSettings] = useState({
    autoRenewal: true,
    emailNotifications: true,
    invoiceEmail: '',
    currency: 'USD',
    language: 'en',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadBillingSettings();
  }, [isAuthenticated, router]);

  const loadBillingSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // API integration - Load billing settings from API endpoint when available
      setIsLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load billing settings',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t('errors.loadFailed') || 'Failed to load billing settings. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSave = async (data: BillingSettingsData) => {
    try {
      setError(null);
      // API integration - Save billing settings to API endpoint when available
      setBillingSettings({
        autoRenewal: data.autoRenewal,
        emailNotifications: data.emailNotifications,
        invoiceEmail: data.invoiceEmail,
        currency: data.currency,
        language: data.language,
      });
      logger.info('Billing settings saved successfully');
    } catch (error: unknown) {
      logger.error(
        'Failed to save billing settings',
        error instanceof Error ? error : new Error(String(error))
      );
      const errorMessage =
        getErrorMessage(error) ||
        t('errors.saveFailed') ||
        'Failed to save billing settings. Please try again.';
      setError(errorMessage);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Billing Settings'}
          description={t('description') || 'Manage your billing settings and preferences'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
            { label: t('breadcrumbs.billing') || 'Billing' },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8">
          <BillingSettings settings={billingSettings} onSave={handleSave} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
