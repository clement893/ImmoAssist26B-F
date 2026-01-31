/**
 * Profile Notifications List Page
 *
 * Page to view and manage user notifications.
 * Displays all notifications with filtering and management options.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { NotificationCenterConnected } from '@/components/notifications';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { NotificationType } from '@/types/notification';

export default function ProfileNotificationsListPage() {
  const t = useTranslations('profile.notifications');
  const searchParams = useSearchParams();

  // Get filter from URL params
  const filterParam = searchParams.get('filter') as 'all' | 'unread' | 'read' | null;
  const typeParam = searchParams.get('type') as NotificationType | null;

  // Determine initial filters based on URL params
  const initialFilters = {
    skip: 0,
    limit: 100,
    read: filterParam === 'unread' ? false : filterParam === 'read' ? true : undefined,
    notification_type: typeParam || undefined,
  };

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('list.title') || 'My Notifications'}
          description={t('list.description') || 'View and manage your notifications'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.profile') || 'Profile', href: '/profile' },
            {
              label: t('breadcrumbs.notifications') || 'Notifications',
              href: '/profile/notifications',
            },
            { label: t('list.title') || 'My Notifications' },
          ]}
        />

        <div className="mt-8">
          <Section title={t('list.title') || 'My Notifications'} className="mt-6">
            <NotificationCenterConnected initialFilters={initialFilters} enableWebSocket={true} />
          </Section>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
