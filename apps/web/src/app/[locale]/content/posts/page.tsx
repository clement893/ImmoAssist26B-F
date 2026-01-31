/**
 * Blog Posts Management Page
 *
 * Page for managing blog posts with CRUD operations.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { PostsManager } from '@/components/content';
import type { BlogPost } from '@/components/content';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { postsAPI } from '@/lib/api/posts';

export default function PostsManagementPage() {
  const router = useRouter();
  const t = useTranslations('content.posts');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadPosts();
  }, [isAuthenticated, router]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const postsList = await postsAPI.list();
      setPosts(postsList);
    } catch (error: unknown) {
      logger.error(
        'Failed to load posts',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load posts. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreate = async (postData: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      await postsAPI.create({
        title: String(postData.title || ''),
        slug: String(postData.slug || ''),
        excerpt: postData.excerpt ? String(postData.excerpt) : undefined,
        content: String(postData.content || ''),
        content_html: postData.content_html ? String(postData.content_html) : undefined,
        status: (postData.status || 'draft') as 'draft' | 'published' | 'archived',
        category_id: typeof postData.category_id === 'number' ? postData.category_id : undefined,
        tags: Array.isArray(postData.tags) ? postData.tags.map((t) => String(t)) : undefined,
        meta_title: postData.meta_title ? String(postData.meta_title) : undefined,
        meta_description: postData.meta_description ? String(postData.meta_description) : undefined,
        meta_keywords: postData.meta_keywords ? String(postData.meta_keywords) : undefined,
      });
      await loadPosts();
    } catch (error: unknown) {
      logger.error(
        'Failed to create post',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to create post. Please try again.');
      throw error;
    }
  };

  const handlePostUpdate = async (id: number, postData: Partial<BlogPost>) => {
    try {
      setError(null);
      const updateData: {
        title?: string;
        slug?: string;
        excerpt?: string;
        content?: string;
        content_html?: string;
        status?: 'draft' | 'published' | 'archived';
        category_id?: number;
        tags?: string[];
        meta_title?: string;
        meta_description?: string;
        meta_keywords?: string;
      } = {};

      if (postData.title !== undefined) updateData.title = String(postData.title);
      if (postData.slug !== undefined) updateData.slug = String(postData.slug);
      if (postData.excerpt !== undefined)
        updateData.excerpt = postData.excerpt ? String(postData.excerpt) : undefined;
      if (postData.content !== undefined) updateData.content = String(postData.content);
      if (postData.content_html !== undefined)
        updateData.content_html = postData.content_html ? String(postData.content_html) : undefined;
      if (postData.status !== undefined)
        updateData.status = postData.status as 'draft' | 'published' | 'archived';
      if (postData.category_id !== undefined)
        updateData.category_id =
          typeof postData.category_id === 'number' ? postData.category_id : undefined;
      if (postData.tags !== undefined)
        updateData.tags = Array.isArray(postData.tags)
          ? postData.tags.map((t) => String(t))
          : undefined;
      if (postData.meta_title !== undefined)
        updateData.meta_title = postData.meta_title ? String(postData.meta_title) : undefined;
      if (postData.meta_description !== undefined)
        updateData.meta_description = postData.meta_description
          ? String(postData.meta_description)
          : undefined;
      if (postData.meta_keywords !== undefined)
        updateData.meta_keywords = postData.meta_keywords
          ? String(postData.meta_keywords)
          : undefined;

      await postsAPI.update(id, updateData);
      await loadPosts();
    } catch (error: unknown) {
      logger.error(
        'Failed to update post',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to update post. Please try again.');
      throw error;
    }
  };

  const handlePostDelete = async (id: number) => {
    try {
      setError(null);
      await postsAPI.delete(id);
      await loadPosts();
    } catch (error: unknown) {
      logger.error(
        'Failed to delete post',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to delete post. Please try again.');
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
          title={t('title') || 'Blog Posts Management'}
          description={t('description') || 'Create and manage your blog posts'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.content') || 'Content', href: '/content' },
            { label: t('breadcrumbs.posts') || 'Posts' },
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
          <PostsManager
            posts={posts}
            onPostCreate={handlePostCreate}
            onPostUpdate={handlePostUpdate}
            onPostDelete={handlePostDelete}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
