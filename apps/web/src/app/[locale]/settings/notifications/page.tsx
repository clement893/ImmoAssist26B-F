/**
 * Notification Settings Page
 *
 * Page for managing notification preferences.
 * Uses existing NotificationSettings component.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { NotificationSettings } from '@/components/settings';
import type { NotificationSettingsData } from '@/components/settings';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.notifications');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      enabled: true,
      frequency: 'instant' as 'instant' | 'daily' | 'weekly',
      types: {
        marketing: true,
        product: true,
        security: true,
        billing: true,
        system: true,
      },
    },
    push: {
      enabled: false,
      types: {
        marketing: false,
        product: true,
        security: true,
        billing: false,
        system: true,
      },
    },
    inApp: {
      enabled: true,
      types: {
        marketing: true,
        product: true,
        security: true,
        billing: true,
        system: true,
      },
    },
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadNotificationSettings();
  }, [isAuthenticated, router]);

  const loadNotificationSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // API integration - Load notification settings from API endpoint when available
      setIsLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load notification settings',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t('errors.loadFailed') || 'Failed to load notification settings. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSave = async (data: NotificationSettingsData) => {
    try {
      setError(null);
      // API integration - Save notification settings to API endpoint when available
      setNotificationSettings(data);
      logger.info('Notification settings saved successfully');
    } catch (error: unknown) {
      logger.error(
        'Failed to save notification settings',
        error instanceof Error ? error : new Error(String(error))
      );
      const errorMessage =
        getErrorMessage(error) ||
        t('errors.saveFailed') ||
        'Failed to save notification settings. Please try again.';
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
          title={t('title') || 'Notification Settings'}
          description={t('description') || 'Manage your notification preferences'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
            { label: t('breadcrumbs.notifications') || 'Notifications' },
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
          <NotificationSettings settings={notificationSettings} onSave={handleSave} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
