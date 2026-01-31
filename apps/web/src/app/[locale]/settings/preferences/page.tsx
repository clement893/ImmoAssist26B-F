/**
 * Preferences Settings Page
 *
 * Page for managing user preferences and personalization.
 * Connected to the database via the preferences API.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { PreferencesManager } from '@/components/preferences';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function PreferencesSettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.preferences');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    setIsLoading(false);
  }, [isAuthenticated, router]);

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
          title={t('title') || 'Preferences Settings'}
          description={
            t('description') || 'Manage your user preferences and personalization settings'
          }
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
            { label: t('breadcrumbs.preferences') || 'Preferences' },
          ]}
        />

        <div className="mt-8">
          <PreferencesManager />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
