/**
 * Blog Post Detail Page
 *
 * Public page displaying a single blog post by slug.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BlogPost } from '@/components/blog';
import { PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { postsAPI } from '@/lib/api/posts';
import type { BlogPost as BlogPostType } from '@/components/content';

export default function BlogPostPage() {
  const t = useTranslations('blog');
  const params = useParams();
  const slug = params?.slug as string;
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPost = useCallback(
    async (_postSlug: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const postData = await postsAPI.getBySlug(_postSlug);

        // Only show published posts on public blog page
        if (postData.status !== 'published') {
          setPost(null);
          setError('Post not found');
          return;
        }

        setPost(postData);
      } catch (error: unknown) {
        logger.error(
          'Failed to load blog post',
          error instanceof Error ? error : new Error(String(error))
        );
        const appError = handleApiError(error);
        setError(
          appError.message ||
            t('errors.loadFailed') ||
            'Failed to load blog post. Please try again.'
        );
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    }
  }, [slug, loadPost]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      </PageContainer>
    );
  }

  if (!post) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
          <p className="text-muted-foreground">The blog post you're looking for doesn't exist.</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <BlogPost post={post} />
      </div>
    </PageContainer>
  );
}
