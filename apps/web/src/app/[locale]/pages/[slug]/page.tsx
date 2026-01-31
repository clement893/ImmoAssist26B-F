/**
 * Dynamic Page Render
 *
 * Renders published pages dynamically based on slug.
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Loading, Alert } from '@/components/ui';
import { SafeHTML } from '@/components/ui/SafeHTML';
import { logger } from '@/lib/logger';
import { pagesAPI, type Page } from '@/lib/api/pages';
import { handleApiError } from '@/lib/errors';

export default function DynamicPage() {
  const params = useParams();
  const t = useTranslations('pages');
  const slug = params.slug as string;

  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFoundError, setNotFoundError] = useState(false);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current || !slug) return;
    loadingRef.current = true;
    try {
      setIsLoading(true);
      setError(null);
      setNotFoundError(false);

      const loadedPage = await pagesAPI.get(slug);

      // Only show published pages
      if (loadedPage.status !== 'published') {
        setNotFoundError(true);
        setIsLoading(false);
        return;
      }

      setPage(loadedPage);
      setIsLoading(false);
    } catch (error: unknown) {
      logger.error(
        'Failed to load page',
        error instanceof Error ? error : new Error(String(error))
      );

      // Check if it's a 404 error
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status?: number } };
        if (apiError.response?.status === 404) {
          setNotFoundError(true);
          setIsLoading(false);
          return;
        }
      }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading />
      </div>
    );
  }

  if (notFoundError || !page) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">{t('errors.notFound') || 'Page not found'}</Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
        {page.updated_at && (
          <p className="text-muted-foreground text-sm">
            {t('lastUpdated') || 'Last updated'}: {new Date(page.updated_at).toLocaleDateString()}
          </p>
        )}
      </header>

      <SafeHTML html={page.content} className="prose prose-lg max-w-none" />
    </article>
  );
}
