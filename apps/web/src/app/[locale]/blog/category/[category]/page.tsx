/**
 * Blog Category Archive Page
 *
 * Public page displaying blog posts filtered by category.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BlogListing } from '@/components/blog';
import { PageHeader, PageContainer } from '@/components/layout';
import { Alert } from '@/components/ui';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { postsAPI } from '@/lib/api/posts';
import type { BlogPost } from '@/components/content';

export default function BlogCategoryArchivePage() {
  const t = useTranslations('blog.category');
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categorySlug = params?.category as string;
  const categoryName =
    categorySlug?.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || '';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(page);
    loadPosts();
  }, [searchParams, categorySlug]);

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const pageSize = 12;
      const skip = (currentPage - 1) * pageSize;

      const postsList = await postsAPI.list({
        skip,
        limit: pageSize,
        status: 'published',
        category_slug: categorySlug,
      });

      setPosts(postsList);
      setTotalPages(Math.max(1, Math.ceil(postsList.length / pageSize)));
    } catch (error: unknown) {
      logger.error(
        'Failed to load blog posts by category',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load blog posts. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [categorySlug, currentPage, t]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(`/blog/category/${categorySlug}?page=${page}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={`${t('title') || 'Category'}: ${categoryName}`}
        description={
          t('description', { category: categoryName }) || `Blog posts in category: ${categoryName}`
        }
        breadcrumbs={[
          { label: t('breadcrumbs.home') || 'Home', href: '/' },
          { label: t('breadcrumbs.blog') || 'Blog', href: '/blog' },
          { label: categoryName },
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
