/**
 * Team Settings Page
 *
 * Page for managing team members and permissions.
 * Uses existing TeamManagement component.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { TeamManagement } from '@/components/admin';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useState } from 'react';

export default function TeamSettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.team');
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
          title={t('title') || 'Team Settings'}
          description={t('description') || 'Manage your team members and permissions'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
            { label: t('breadcrumbs.team') || 'Team' },
          ]}
        />

        <div className="mt-8">
          <TeamManagement />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
