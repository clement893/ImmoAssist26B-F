/**
 * Tags Management Page
 *
 * Page for managing content tags with CRUD operations.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { TagsManager } from '@/components/content';
import type { TagItem } from '@/components/content';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api';

export default function TagsManagementPage() {
  const router = useRouter();
  const t = useTranslations('content.tags');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<TagItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadTags();
  }, [isAuthenticated, router]);

  const loadTags = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Use existing tags API endpoint
      const response = await apiClient.get('/v1/tags/');
      const backendTags = response.data;

      // Map backend tags to component format
      interface BackendTag {
        id: number | string;
        name: string;
        slug: string;
        color?: string;
        description?: string;
        entity_type?: string;
        usage_count?: number;
      }

      const mappedTags: TagItem[] = (backendTags as BackendTag[]).map((tag) => ({
        id: typeof tag.id === 'string' ? parseInt(tag.id, 10) : tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        description: tag.description,
        entity_type: tag.entity_type || '',
        usage_count: tag.usage_count || 0,
        created_at:
          (tag as unknown as { created_at?: string }).created_at || new Date().toISOString(),
      }));

      setTags(mappedTags);
      setIsLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load tags',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t('errors.loadFailed') || 'Failed to load tags. Please try again.');
      setIsLoading(false);
    }
  };

  const handleTagCreate = async (
    tagData: Omit<TagItem, 'id' | 'slug' | 'created_at' | 'usage_count'>
  ) => {
    try {
      // Note: Tags API requires entity_id, but we'll create a generic tag
      // For now, we'll need to adapt this when backend supports tag creation without entity
      await apiClient.post('/v1/tags', {
        ...tagData,
        entity_id: 0, // Placeholder - backend may need adjustment
      });
      await loadTags();
    } catch (error) {
      logger.error(
        'Failed to create tag',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  };

  const handleTagUpdate = async (id: number, tagData: Partial<TagItem>) => {
    try {
      await apiClient.put(`/v1/tags/${id}`, tagData);
      await loadTags();
    } catch (error) {
      logger.error(
        'Failed to update tag',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  };

  const handleTagDelete = async (id: number) => {
    try {
      await apiClient.delete(`/v1/tags/${id}`);
      await loadTags();
    } catch (error) {
      logger.error(
        'Failed to delete tag',
        error instanceof Error ? error : new Error(String(error))
      );
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
          title={t('title') || 'Tags Management'}
          description={t('description') || 'Create and manage content tags'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.content') || 'Content', href: '/content' },
            { label: t('breadcrumbs.tags') || 'Tags' },
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
          <TagsManager
            tags={tags}
            onTagCreate={handleTagCreate}
            onTagUpdate={handleTagUpdate}
            onTagDelete={handleTagDelete}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
