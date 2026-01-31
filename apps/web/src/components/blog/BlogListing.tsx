/** * Blog Listing Component * * Displays blog posts in a grid/card layout with pagination. * * @component */ 'use client';
import { Card, Pagination, Badge, Loading } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { Calendar, User, ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/components/content';
export interface BlogListingProps {
  posts?: BlogPost[];
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}
/** * Blog Listing Component * * Displays blog posts in a responsive grid layout with pagination. */ export default function BlogListing({
  posts = [],
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  isLoading = false,
  className,
}: BlogListingProps) {
  if (isLoading) {
    return (
      <div className={className}>
        {' '}
        <div className="flex items-center justify-center min-h-[400px]">
          {' '}
          <Loading />{' '}
        </div>{' '}
      </div>
    );
  }
  if (posts.length === 0) {
    return (
      <div className={className}>
        {' '}
        <div className="text-center py-12">
          {' '}
          <p className="text-muted-foreground text-lg"> No blog posts found. </p>{' '}
        </div>{' '}
      </div>
    );
  }
  return (
    <div className={className}>
      {' '}
      {/* Blog Posts Grid */}{' '}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {' '}
        {posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            {' '}
            <Card hover className="h-full flex flex-col">
              {' '}
              {/* Featured Image Placeholder */}{' '}
              <div className="aspect-video bg-muted rounded-t-lg mb-4" /> {/* Post Content */}{' '}
              <div className="flex-1 flex flex-col">
                {' '}
                <div className="mb-2">
                  {' '}
                  <Badge variant="default">{post.status}</Badge>{' '}
                </div>{' '}
                <h3 className="text-xl font-semibold text-foreground mb-2 line-clamp-2">
                  {' '}
                  {post.title}{' '}
                </h3>{' '}
                {post.excerpt && (
                  <p className="text-muted-foreground mb-4 line-clamp-3 flex-1"> {post.excerpt} </p>
                )}{' '}
                {/* Post Meta */}{' '}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto pt-4 border-t border-border">
                  {' '}
                  {post.author_name && (
                    <div className="flex items-center gap-1">
                      {' '}
                      <User className="w-4 h-4" /> <span>{post.author_name}</span>{' '}
                    </div>
                  )}{' '}
                  {post.published_at && (
                    <div className="flex items-center gap-1">
                      {' '}
                      <Calendar className="w-4 h-4" />{' '}
                      <span>{new Date(post.published_at).toLocaleDateString()}</span>{' '}
                    </div>
                  )}{' '}
                </div>{' '}
                {/* Read More */}{' '}
                <div className="mt-4 flex items-center text-primary-600 dark:text-primary-400 font-medium">
                  {' '}
                  Read more <ArrowRight className="w-4 h-4 ml-1" />{' '}
                </div>{' '}
              </div>{' '}
            </Card>{' '}
          </Link>
        ))}{' '}
      </div>{' '}
      {/* Pagination */}{' '}
      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center">
          {' '}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />{' '}
        </div>
      )}{' '}
    </div>
  );
}
