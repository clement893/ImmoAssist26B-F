/**
 * General Settings Page
 *
 * Page for managing general application settings including language, timezone, theme, etc.
 * Accessible via settings hub navigation.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { GeneralSettings } from '@/components/settings';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';
import { settingsAPI } from '@/lib/api/settings';

export default function GeneralSettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.general');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    language: 'en',
    timezone: 'UTC',
    theme: 'system' as 'light' | 'dark' | 'system',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h' as '12h' | '24h',
    weekStartsOn: 'monday' as 'monday' | 'sunday',
    enableNotifications: true,
    enableEmailNotifications: true,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadSettings();
  }, [isAuthenticated, router]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const apiSettings = await settingsAPI.getGeneralSettings();

      // Map API response to component format
      setSettings({
        language: apiSettings.language || 'en',
        timezone: apiSettings.timezone || 'UTC',
        theme: (apiSettings.theme || 'system') as 'light' | 'dark' | 'system',
        dateFormat: apiSettings.dateFormat || 'YYYY-MM-DD',
        timeFormat: (apiSettings.timeFormat || '24h') as '12h' | '24h',
        weekStartsOn: (apiSettings.weekStartsOn || 'monday') as 'monday' | 'sunday',
        enableNotifications: apiSettings.enableNotifications ?? true,
        enableEmailNotifications: apiSettings.enableEmailNotifications ?? true,
      });
      setIsLoading(false);
    } catch (error: unknown) {
      logger.error(
        'Failed to load general settings',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t('errors.loadFailed') || 'Failed to load settings. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSave = async (data: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
    dateFormat: string;
    timeFormat: '12h' | '24h';
    weekStartsOn: 'monday' | 'sunday';
    enableNotifications: boolean;
    enableEmailNotifications: boolean;
  }) => {
    try {
      setError(null);
      setSuccessMessage(null);

      // Map component format to API format
      const apiData = {
        language: data.language,
        timezone: data.timezone,
        theme: data.theme,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        weekStartsOn: data.weekStartsOn,
        enableNotifications: data.enableNotifications,
        enableEmailNotifications: data.enableEmailNotifications,
      };

      await settingsAPI.updateGeneralSettings(apiData);
      setSettings(data);
      setSuccessMessage(t('success.saved') || 'Settings saved successfully');
      logger.info('General settings saved successfully');
    } catch (error: unknown) {
      logger.error(
        'Failed to save general settings',
        error instanceof Error ? error : new Error(String(error))
      );
      const errorMessage =
        getErrorMessage(error) ||
        t('errors.saveFailed') ||
        'Failed to save settings. Please try again.';
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
          title={t('title') || 'General Settings'}
          description={t('description') || 'Manage general application settings and preferences'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
            { label: t('breadcrumbs.general') || 'General' },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {successMessage && (
          <div className="mt-6">
            <Alert variant="success" onClose={() => setSuccessMessage(null)}>
              {successMessage}
            </Alert>
          </div>
        )}

        <div className="mt-8">
          <ErrorBoundary>
            <GeneralSettings settings={settings} onSave={handleSave} />
          </ErrorBoundary>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
