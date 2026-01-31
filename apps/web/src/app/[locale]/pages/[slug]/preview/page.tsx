/**
 * Page Preview Page
 *
 * Preview page for page builder pages.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PagePreview } from '@/components/page-builder';
import type { PageSection } from '@/components/page-builder';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { pagesAPI } from '@/lib/api/pages';
import { handleApiError } from '@/lib/errors';

export default function PagePreviewPage() {
  const params = useParams();
  const t = useTranslations('pages.preview');
  const slug = params.slug as string;

  const [sections, setSections] = useState<PageSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPage();
  }, [slug]);

  const loadPage = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const page = await pagesAPI.get(slug);

      // Try to parse sections from content if it's JSON, otherwise use empty array
      try {
        const parsedSections = JSON.parse(page.content) as PageSection[];
        if (Array.isArray(parsedSections)) {
          setSections(parsedSections);
        } else {
          setSections([]);
        }
      } catch {
        // Content is not JSON sections, use empty array
        setSections([]);
      }

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
          title={t('title') || `Preview: ${slug}`}
          description={t('description') || 'Preview your page'}
          breadcrumbs={[
            { label: t('breadcrumbs.home') || 'Home', href: '/' },
            { label: t('breadcrumbs.pages') || 'Pages', href: '/content/pages' },
            { label: slug, href: `/pages/${slug}/edit` },
            { label: t('breadcrumbs.preview') || 'Preview' },
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
          <PagePreview sections={sections} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
