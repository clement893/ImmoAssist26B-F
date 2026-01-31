/**
 * Pages Management Page
 *
 * Page for managing content pages with CRUD operations.
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { PagesManager } from '@/components/content';
import type { Page } from '@/components/content';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { pagesAPI } from '@/lib/api/pages';
import { handleApiError } from '@/lib/errors';

export default function PagesManagementPage() {
  const router = useRouter();
  const t = useTranslations('content.pages');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const loadingRef = useRef(false);

  const loadPages = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setIsLoading(true);
      setError(null);
      const loadedPages = await pagesAPI.list();
      // Convert API Page type to component Page type (they're compatible but TypeScript sees them as different)
      setPages(loadedPages as Page[]);
      setIsLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load pages',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load pages. Please try again.'
      );
      setIsLoading(false);
    } finally {
      loadingRef.current = false;
    }
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadPages();
  }, [isAuthenticated, router, loadPages]);

  const handlePageCreate = async (pageData: Omit<Page, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await pagesAPI.create({
        slug: String(pageData.slug),
        title: String(pageData.title),
        content: String(pageData.content),
        status: pageData.status as 'draft' | 'published' | 'archived' | undefined,
      });
      logger.info('Page created successfully', pageData);
      await loadPages();
    } catch (error) {
      logger.error(
        'Failed to create page',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to create page. Please try again.');
      throw error;
    }
  };

  const handlePageUpdate = async (id: number, pageData: Partial<Page>) => {
    try {
      await pagesAPI.update(id, {
        slug: pageData.slug ? String(pageData.slug) : undefined,
        title: pageData.title ? String(pageData.title) : undefined,
        content: pageData.content ? String(pageData.content) : undefined,
        status: pageData.status as 'draft' | 'published' | 'archived' | undefined,
      });
      logger.info('Page updated successfully', { id, pageData });
      await loadPages();
    } catch (error) {
      logger.error(
        'Failed to update page',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to update page. Please try again.');
      throw error;
    }
  };

  const handlePageDelete = async (id: number) => {
    try {
      await pagesAPI.delete(id);
      logger.info('Page deleted successfully', { id });
      await loadPages();
    } catch (error) {
      logger.error(
        'Failed to delete page',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to delete page. Please try again.');
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
          title={t('title') || 'Pages Management'}
          description={t('description') || 'Create and manage your content pages'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.content') || 'Content', href: '/content' },
            { label: t('breadcrumbs.pages') || 'Pages' },
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
          <PagesManager
            pages={pages}
            onPageCreate={handlePageCreate}
            onPageUpdate={handlePageUpdate}
            onPageDelete={handlePageDelete}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
