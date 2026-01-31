/**
 * Content Management Dashboard Page
 *
 * Main hub for content management with overview statistics and quick navigation.
 * Accessible via admin navigation and sitemap.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { ContentDashboard } from '@/components/content';
import type { ContentStats } from '@/components/content';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';

export default function ContentPage() {
  const router = useRouter();
  const t = useTranslations('content');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ContentStats>({
    totalPages: 0,
    totalPosts: 0,
    totalMedia: 0,
    totalCategories: 0,
    totalTags: 0,
    scheduledContent: 0,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadStats();
  }, [isAuthenticated, router]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Stats loading - implement when content stats API endpoint is available
      // For now, use default values
      setStats({
        totalPages: 0,
        totalPosts: 0,
        totalMedia: 0,
        totalCategories: 0,
        totalTags: 0,
        scheduledContent: 0,
      });
      setIsLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load content stats',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t('errors.loadFailed') || 'Failed to load content statistics. Please try again.');
      setIsLoading(false);
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
          title={t('title') || 'Content Management'}
          description={t('description') || 'Manage your content, pages, posts, and media'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.content') || 'Content' },
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
          <ContentDashboard stats={stats} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
