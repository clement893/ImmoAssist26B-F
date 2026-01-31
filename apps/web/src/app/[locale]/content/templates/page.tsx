/**
 * Templates Management Page
 *
 * Page for managing content templates with CRUD operations.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { TemplatesManager } from '@/components/content';
import type { ContentTemplate } from '@/components/content';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api';
import { handleApiError } from '@/lib/errors';

export default function TemplatesManagementPage() {
  const router = useRouter();
  const t = useTranslations('content.templates');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadTemplates();
  }, [isAuthenticated, router]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/v1/templates');
      const backendTemplates = response.data;

      interface BackendTemplate {
        id: number | string;
        name: string;
        content?: string;
        content_html?: string;
        entity_type?: string;
        category?: string;
        description?: string;
        variables?: Record<string, unknown>;
        is_public?: boolean;
      }

      const mappedTemplates: ContentTemplate[] = (backendTemplates as BackendTemplate[]).map(
        (tpl) => ({
          id: typeof tpl.id === 'string' ? parseInt(tpl.id, 10) : tpl.id,
          name: tpl.name,
          content: tpl.content || '',
          content_html: tpl.content_html,
          entity_type: tpl.entity_type || '',
          category: tpl.category,
          description: tpl.description,
          variables: tpl.variables,
          is_public: tpl.is_public || false,
          created_at:
            (tpl as unknown as { created_at?: string }).created_at || new Date().toISOString(),
          updated_at:
            (tpl as unknown as { updated_at?: string }).updated_at || new Date().toISOString(),
        })
      );

      setTemplates(mappedTemplates);
      setIsLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load templates',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load templates. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const handleTemplateCreate = async (
    templateData: Omit<ContentTemplate, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      await apiClient.post('/v1/templates', templateData);
      await loadTemplates();
    } catch (error) {
      logger.error(
        'Failed to create template',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to create template. Please try again.');
      throw error;
    }
  };

  const handleTemplateUpdate = async (id: number, templateData: Partial<ContentTemplate>) => {
    try {
      await apiClient.put(`/v1/templates/${id}`, templateData);
      await loadTemplates();
    } catch (error) {
      logger.error(
        'Failed to update template',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to update template. Please try again.');
      throw error;
    }
  };

  const handleTemplateDelete = async (id: number) => {
    try {
      await apiClient.delete(`/v1/templates/${id}`);
      await loadTemplates();
    } catch (error) {
      logger.error(
        'Failed to delete template',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to delete template. Please try again.');
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
          title={t('title') || 'Templates Management'}
          description={t('description') || 'Create and manage content templates'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.content') || 'Content', href: '/content' },
            { label: t('breadcrumbs.templates') || 'Templates' },
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
          <TemplatesManager
            templates={templates}
            onTemplateCreate={handleTemplateCreate}
            onTemplateUpdate={handleTemplateUpdate}
            onTemplateDelete={handleTemplateDelete}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
