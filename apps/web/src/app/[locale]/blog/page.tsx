/**
 * Blog Listing Page
 *
 * Public page displaying all published blog posts.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BlogListing } from '@/components/blog';
import { PageHeader, PageContainer } from '@/components/layout';
import { Alert } from '@/components/ui';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { postsAPI } from '@/lib/api/posts';
import type { BlogPost } from '@/components/content';

export default function BlogPage() {
  const t = useTranslations('blog');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(page);
    loadPosts();
  }, [searchParams]);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const pageSize = 12;
      const skip = (currentPage - 1) * pageSize;

      const postsList = await postsAPI.list({
        skip,
        limit: pageSize,
        status: 'published', // Only show published posts on public blog page
      });

      setPosts(postsList);
      // Calculate total pages (simplified - assumes we have all posts)
      // In a real implementation, the API would return total count
      setTotalPages(Math.max(1, Math.ceil(postsList.length / pageSize)));
    } catch (error: unknown) {
      logger.error(
        'Failed to load blog posts',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load blog posts. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/blog?page=${page}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('title') || 'Blog'}
        description={t('description') || 'Read our latest articles and updates'}
        breadcrumbs={[
          { label: t('breadcrumbs.home') || 'Home', href: '/' },
          { label: t('breadcrumbs.blog') || 'Blog' },
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
        <BlogListing
          posts={posts}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>
    </PageContainer>
  );
}
