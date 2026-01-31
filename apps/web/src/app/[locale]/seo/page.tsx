/**
 * SEO Management Page
 *
 * Page for managing SEO settings.
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SEOManager } from '@/components/cms';
import type { SEOSettings } from '@/components/cms';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert, useToast } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { seoAPI } from '@/lib/api';
import { handleApiError } from '@/lib/errors/api';
import { logger } from '@/lib/logger';

export default function SEOPage() {
  const t = useTranslations('seo');
  const [settings, setSettings] = useState<SEOSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const { showToast } = useToast();

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await seoAPI.getSettings();
      const apiSettings = response.data.settings || {};

      setSettings({
        title: apiSettings.title,
        description: apiSettings.description,
        keywords: apiSettings.keywords,
        canonicalUrl: apiSettings.canonical_url,
        robots: apiSettings.robots,
        ogTitle: apiSettings.og_title,
        ogDescription: apiSettings.og_description,
        ogImage: apiSettings.og_image,
        ogType: apiSettings.og_type,
        twitterCard: apiSettings.twitter_card,
        twitterTitle: apiSettings.twitter_title,
        twitterDescription: apiSettings.twitter_description,
        twitterImage: apiSettings.twitter_image,
        schema: apiSettings.schema,
      });
      setIsLoading(false);
    } catch (error) {
      const appError = handleApiError(error);
      logger.error('Failed to load SEO settings', appError);
      setError(
        appError.message ||
          t('errors.loadFailed') ||
          'Failed to load SEO settings. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedSettings: SEOSettings) => {
    try {
      setIsLoading(true);
      setError(null);

      await seoAPI.updateSettings({
        title: updatedSettings.title,
        description: updatedSettings.description,
        keywords: updatedSettings.keywords,
        canonical_url: updatedSettings.canonicalUrl,
        robots: updatedSettings.robots,
        og_title: updatedSettings.ogTitle,
        og_description: updatedSettings.ogDescription,
        og_image: updatedSettings.ogImage,
        og_type: updatedSettings.ogType,
        twitter_card: updatedSettings.twitterCard,
        twitter_title: updatedSettings.twitterTitle,
        twitter_description: updatedSettings.twitterDescription,
        twitter_image: updatedSettings.twitterImage,
        schema: updatedSettings.schema,
      });

      showToast({ message: 'SEO settings saved successfully', type: 'success' });
      setSettings(updatedSettings);
      await loadSettings();
    } catch (error) {
      const appError = handleApiError(error);
      logger.error('Failed to save SEO settings', appError);
      setError(appError.message || 'Failed to save SEO settings. Please try again.');
      throw error;
    } finally {
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
          title={t('title') || 'SEO Management'}
          description={t('description') || 'Manage SEO meta tags and settings'}
          breadcrumbs={[
            { label: t('breadcrumbs.home') || 'Home', href: '/' },
            { label: t('breadcrumbs.seo') || 'SEO' },
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
          <SEOManager initialSettings={settings} onSave={handleSave} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
