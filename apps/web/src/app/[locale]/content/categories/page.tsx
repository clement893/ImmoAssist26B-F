/**
 * Categories Management Page
 *
 * Page for managing content categories with CRUD operations.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { CategoriesManager } from '@/components/content';
import type { Category } from '@/components/content';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api';

export default function CategoriesManagementPage() {
  const router = useRouter();
  const t = useTranslations('content.categories');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadCategories();
  }, [isAuthenticated, router]);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Use existing categories API endpoint
      const response = await apiClient.get('/v1/tags/categories/tree');
      const backendCategories = response.data;

      // Map backend categories to component format
      interface BackendCategory {
        id: number | string;
        name: string;
        slug: string;
        description?: string;
        parent_id?: number | string;
        color?: string;
        icon?: string;
      }

      const mappedCategories: Category[] = (backendCategories as BackendCategory[]).map((cat) => ({
        id: typeof cat.id === 'string' ? parseInt(cat.id, 10) : cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        parent_id: typeof cat.parent_id === 'string' ? parseInt(cat.parent_id, 10) : cat.parent_id,
        parent_name: (cat as unknown as { parent_name?: string }).parent_name || undefined,
        entity_type: (cat as unknown as { entity_type?: string }).entity_type || '',
        sort_order: (cat as unknown as { sort_order?: number }).sort_order || 0,
        created_at:
          (cat as unknown as { created_at?: string }).created_at || new Date().toISOString(),
      }));

      setCategories(mappedCategories);
      setIsLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load categories',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t('errors.loadFailed') || 'Failed to load categories. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCategoryCreate = async (
    categoryData: Omit<Category, 'id' | 'slug' | 'created_at' | 'sort_order'>
  ) => {
    try {
      await apiClient.post('/v1/tags/categories', categoryData);
      await loadCategories();
    } catch (error) {
      logger.error(
        'Failed to create category',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  };

  const handleCategoryUpdate = async (id: number, categoryData: Partial<Category>) => {
    try {
      await apiClient.put(`/v1/tags/categories/${id}`, categoryData);
      await loadCategories();
    } catch (error) {
      logger.error(
        'Failed to update category',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  };

  const handleCategoryDelete = async (id: number) => {
    try {
      await apiClient.delete(`/v1/tags/categories/${id}`);
      await loadCategories();
    } catch (error) {
      logger.error(
        'Failed to delete category',
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
          title={t('title') || 'Categories Management'}
          description={t('description') || 'Create and manage content categories'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.content') || 'Content', href: '/content' },
            { label: t('breadcrumbs.categories') || 'Categories' },
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
          <CategoriesManager
            categories={categories}
            onCategoryCreate={handleCategoryCreate}
            onCategoryUpdate={handleCategoryUpdate}
            onCategoryDelete={handleCategoryDelete}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
