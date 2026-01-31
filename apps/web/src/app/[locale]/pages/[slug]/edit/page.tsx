/**
 * Page Editor Page
 *
 * Visual page builder for editing pages.
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageEditor } from '@/components/page-builder';
import type { PageSection } from '@/components/page-builder';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { pagesAPI, type Page } from '@/lib/api/pages';
import { handleApiError } from '@/lib/errors';

export default function PageEditPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('pages.edit');
  const slug = params.slug as string;

  const [sections, setSections] = useState<PageSection[]>([]);
  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current || !slug) return;
    loadingRef.current = true;
    try {
      setIsLoading(true);
      setError(null);

      const loadedPage = await pagesAPI.get(slug);
      setPage(loadedPage);

      // If page has sections data, use it; otherwise use empty array
      // Note: The API returns content as HTML/text, but PageEditor expects sections
      // For now, we'll use empty sections and let the editor work with content separately
      setSections([]);
      setIsLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load page',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load page. Please try again.'
      );
      setIsLoading(false);
    } finally {
      loadingRef.current = false;
    }
  }, [slug, t]);

  useEffect(() => {
    if (slug) {
      loadPage();
    }
  }, [slug, loadPage]);

  const handleSave = async (updatedSections: PageSection[]) => {
    try {
      if (!page) {
        throw new Error('Page not loaded');
      }

      // Save sections (for now, we'll store them as JSON in content or a separate field)
      // Note: This is a simplified approach - in production, you might want to store sections separately
      await pagesAPI.update(page.id, {
        content: JSON.stringify(updatedSections), // Store sections as JSON for now
      });

      logger.info('Page saved successfully', { slug, sections: updatedSections });
      setSections(updatedSections);
    } catch (error) {
      logger.error(
        'Failed to save page',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to save page. Please try again.');
      throw error;
    }
  };

  const handlePreview = () => {
    router.push(`/pages/${slug}/preview`);
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
          title={t('title') || `Edit Page: ${slug}`}
          description={t('description') || 'Build your page with drag-and-drop sections'}
          breadcrumbs={[
            { label: t('breadcrumbs.home') || 'Home', href: '/' },
            { label: t('breadcrumbs.pages') || 'Pages', href: '/content/pages' },
            { label: slug },
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
          <PageEditor initialSections={sections} onSave={handleSave} onPreview={handlePreview} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
