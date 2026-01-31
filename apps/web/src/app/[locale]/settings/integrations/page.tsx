/**
 * Integrations Settings Page
 *
 * Page for managing third-party integrations.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { IntegrationsSettings } from '@/components/settings';
import type { Integration } from '@/components/settings';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { logger } from '@/lib/logger';
import { integrationsAPI } from '@/lib/api';

// Backend integration type
interface BackendIntegration {
  id: number;
  type: string;
  name: string;
  description: string | null;
  enabled: boolean;
  config: Record<string, unknown> | null;
  last_sync_at: string | null;
  last_error: string | null;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export default function IntegrationsSettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.integrations');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadIntegrations();
  }, [isAuthenticated, router]);

  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await integrationsAPI.list();
      const backendIntegrations: BackendIntegration[] = response.data;

      // Map backend integrations to component format
      const mappedIntegrations: Integration[] = backendIntegrations.map((integration) => ({
        id: integration.id.toString(),
        name: integration.name,
        description: integration.description || '',
        enabled: integration.enabled,
        category: getCategoryFromType(integration.type),
      }));

      setIntegrations(mappedIntegrations);
      setIsLoading(false);
    } catch (error: unknown) {
      logger.error(
        'Failed to load integrations',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t('errors.loadFailed') || 'Failed to load integrations. Please try again.');
      setIsLoading(false);
    }
  };

  const getCategoryFromType = (type: string): string => {
    const categoryMap: Record<string, string> = {
      slack: 'Communication',
      github: 'Development',
      stripe: 'Payment',
      sendgrid: 'Email',
      aws: 'Cloud',
    };
    return categoryMap[type.toLowerCase()] || 'Other';
  };

  const handleToggle = async (integrationId: string, enabled: boolean) => {
    try {
      // Check if integrationId is a valid number (only backend integrations can be toggled)
      const id = parseInt(integrationId, 10);
      if (isNaN(id)) {
        // This is a default integration (like 'slack', 'github'), cannot be toggled
        setError(
          t('errors.cannotToggleDefault') ||
            'Default integrations cannot be toggled. Please create an integration first.'
        );
        return;
      }

      await integrationsAPI.toggle(id);

      // Update local state
      setIntegrations((prev) =>
        prev.map((int) => (int.id === integrationId ? { ...int, enabled } : int))
      );

      setToastMessage(
        enabled
          ? t('success.enabled') || 'Integration enabled successfully'
          : t('success.disabled') || 'Integration disabled successfully'
      );

      logger.info(`Integration ${integrationId} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error: unknown) {
      logger.error(
        'Failed to toggle integration',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t('errors.toggleFailed') || 'Failed to toggle integration. Please try again.');
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
          title={t('title') || 'Integrations Settings'}
          description={t('description') || 'Manage third-party integrations and connections'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
            { label: t('breadcrumbs.integrations') || 'Integrations' },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {toastMessage && (
          <div className="mt-6">
            <Alert variant="success" onClose={() => setToastMessage(null)}>
              {toastMessage}
            </Alert>
          </div>
        )}

        <div className="mt-8">
          <ErrorBoundary>
            <IntegrationsSettings integrations={integrations} onToggle={handleToggle} />
          </ErrorBoundary>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
