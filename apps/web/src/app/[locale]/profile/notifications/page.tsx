/**
 * Profile Notifications Page
 *
 * User notification preferences page.
 * Allows users to manage their notification settings for email, push, and in-app notifications.
 * Accessible via profile navigation.
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
import { NotificationCenterConnected } from '@/components/notifications';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api';
import { getErrorMessage, getErrorStatus } from '@/lib/errors';

export default function ProfileNotificationsPage() {
  const router = useRouter();
  const t = useTranslations('profile.notifications');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<{
    email: {
      enabled: boolean;
      frequency: 'instant' | 'daily' | 'weekly';
      types: {
        marketing: boolean;
        product: boolean;
        security: boolean;
        billing: boolean;
        system: boolean;
      };
    };
    push: {
      enabled: boolean;
      types: {
        marketing: boolean;
        product: boolean;
        security: boolean;
        billing: boolean;
        system: boolean;
      };
    };
    inApp: {
      enabled: boolean;
      types: {
        marketing: boolean;
        product: boolean;
        security: boolean;
        billing: boolean;
        system: boolean;
      };
    };
  } | null>(null);

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

      // Load notification preferences from user preferences API
      const response = await apiClient.get('/v1/users/preferences/notifications');
      if (response.data?.value) {
        setNotificationSettings(response.data.value);
      } else {
        // Default settings if none exist
        setNotificationSettings({
          email: {
            enabled: true,
            frequency: 'instant',
            types: {
              marketing: false,
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
              system: false,
            },
          },
          inApp: {
            enabled: true,
            types: {
              marketing: false,
              product: true,
              security: true,
              billing: true,
              system: true,
            },
          },
        });
      }
    } catch (error: unknown) {
      // If preference doesn't exist, use defaults
      const statusCode = getErrorStatus(error);
      if (statusCode === 404) {
        setNotificationSettings({
          email: {
            enabled: true,
            frequency: 'instant',
            types: {
              marketing: false,
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
              system: false,
            },
          },
          inApp: {
            enabled: true,
            types: {
              marketing: false,
              product: true,
              security: true,
              billing: true,
              system: true,
            },
          },
        });
      } else {
        logger.error(
          'Failed to load notification settings',
          error instanceof Error ? error : new Error(String(error))
        );
        setError(
          t('errors.loadFailed') || 'Failed to load notification settings. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: {
    email: {
      enabled: boolean;
      frequency: 'instant' | 'daily' | 'weekly';
      types: {
        marketing: boolean;
        product: boolean;
        security: boolean;
        billing: boolean;
        system: boolean;
      };
    };
    push: {
      enabled: boolean;
      types: {
        marketing: boolean;
        product: boolean;
        security: boolean;
        billing: boolean;
        system: boolean;
      };
    };
    inApp: {
      enabled: boolean;
      types: {
        marketing: boolean;
        product: boolean;
        security: boolean;
        billing: boolean;
        system: boolean;
      };
    };
  }) => {
    try {
      setError(null);

      // Save notification preferences using user preferences API
      await apiClient.put('/v1/users/preferences/notifications', {
        value: data,
      });

      setNotificationSettings(data);
      logger.info('Notification settings saved successfully');
    } catch (error: unknown) {
      logger.error(
        'Failed to save notification settings',
        error instanceof Error ? error : new Error(String(error))
      );
      const errorMessage =
        getErrorMessage(error) ||
        t('errors.updateFailed') ||
        'Failed to update notification settings. Please try again.';
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
          title={t('title') || 'Notifications'}
          description={t('description') || 'Manage your notification preferences'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.profile') || 'Profile', href: '/profile' },
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

        <div className="mt-8 space-y-8">
          {/* Notification List Section */}
          <Section title={t('list.title') || 'My Notifications'} className="mt-6">
            <div className="mb-4">
              <a
                href="/profile/notifications-list"
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
              >
                View all notifications →
              </a>
            </div>
            <NotificationCenterConnected
              initialFilters={{ skip: 0, limit: 10 }}
              enableWebSocket={true}
            />
          </Section>

          {/* Notification Preferences Section */}
          <Section title={t('section.title') || 'Notification Preferences'} className="mt-6">
            {notificationSettings && (
              <NotificationSettings settings={notificationSettings} onSave={handleSave} />
            )}
          </Section>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
