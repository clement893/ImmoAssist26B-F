/**
 * API Settings Page
 *
 * Page for managing API configuration and settings.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { APISettings } from '@/components/settings';
import type { APISettingsData } from '@/components/settings';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { apiSettingsAPI } from '@/lib/api';

export default function APISettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.api');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [apiSettings, setApiSettings] = useState<APISettingsData>({
    baseUrl: '',
    rateLimit: 1000,
    enableWebhooks: false,
    webhookUrl: '',
    enableLogging: true,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadAPISettings();
  }, [isAuthenticated, router]);

  const loadAPISettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiSettingsAPI.get();
      const backendSettings = response.data.settings;

      // Map backend settings to component format
      setApiSettings({
        baseUrl: backendSettings.base_url || '',
        rateLimit: backendSettings.rate_limit || 1000,
        enableWebhooks: backendSettings.enable_webhooks || false,
        webhookUrl: backendSettings.webhook_url || '',
        enableLogging: backendSettings.enable_logging ?? true,
      });
      setIsLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load API settings',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t('errors.loadFailed') || 'Failed to load API settings. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSave = async (data: APISettingsData) => {
    try {
      setError(null);
      setToastMessage(null);

      // Map component format to backend format
      const backendData = {
        base_url: data.baseUrl || undefined,
        rate_limit: data.rateLimit,
        enable_webhooks: data.enableWebhooks,
        webhook_url: data.webhookUrl || undefined,
        enable_logging: data.enableLogging,
      };

      await apiSettingsAPI.update(backendData);
      setApiSettings(data);
      setToastMessage(t('success.saved') || 'API settings saved successfully');
      logger.info('API settings saved successfully');
    } catch (error: unknown) {
      logger.error(
        'Failed to save API settings',
        error instanceof Error ? error : new Error(String(error))
      );
      const errorMessage =
        (error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'detail' in error.response.data
          ? String(error.response.data.detail)
          : error instanceof Error
            ? error.message
            : String(error)) ||
        t('errors.saveFailed') ||
        'Failed to save API settings. Please try again.';
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
          title={t('title') || 'API Settings'}
          description={t('description') || 'Manage API configuration and settings'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
            { label: t('breadcrumbs.api') || 'API' },
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
          <APISettings settings={apiSettings} onSave={handleSave} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
