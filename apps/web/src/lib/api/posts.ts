/**
 * Posts API
 * API client for blog posts endpoints
 */

import { apiClient } from './client';
import type { BlogPost } from '@/components/content';
import { extractApiData } from './utils';

// Re-export BlogPost type for convenience
export type { BlogPost };

export interface PostListResponse {
  items: BlogPost[];
  total: number;
  skip: number;
  limit: number;
}

export interface PostCreate {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  content_html?: string;
  status?: 'draft' | 'published' | 'archived';
  category_id?: number;
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

export interface PostUpdate {
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
}

/**
 * Posts API client
 */
export const postsAPI = {
  /**
   * Get list of posts with pagination
   */
  list: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
    category_id?: number;
    category_slug?: string;
    tag?: string;
    author_id?: number;
    author_slug?: string;
    year?: number;
  }): Promise<BlogPost[]> => {
    const response = await apiClient.get<BlogPost[] | PostListResponse>('/v1/posts', {
      params: { skip: 0, limit: 100, ...params },
    });

    // Handle both array and paginated response formats
    const data = extractApiData(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as PostListResponse).items;
    }
    return [];
  },

  /**
   * Get a post by slug
   */
  getBySlug: async (slug: string): Promise<BlogPost> => {
    const response = await apiClient.get<BlogPost>(`/v1/posts/${slug}`);
    const data = extractApiData(response);
    if (!data) {
      throw new Error(`Post not found: ${slug}`);
    }
    return data;
  },

  /**
   * Get a post by ID
   */
  get: async (id: number): Promise<BlogPost> => {
    // First get by ID - if backend supports it, otherwise get all and filter
    const posts = await postsAPI.list();
    const post = posts.find((p) => p.id === id);
    if (!post) {
      throw new Error(`Post not found: ${id}`);
    }
    return post;
  },

  /**
   * Create a new post
   */
  create: async (data: PostCreate): Promise<BlogPost> => {
    const response = await apiClient.post<BlogPost>('/v1/posts', data);
    const result = extractApiData(response);
    if (!result) {
      throw new Error('Failed to create post: no data returned');
    }
    return result;
  },

  /**
   * Update an existing post
   */
  update: async (id: number, data: PostUpdate): Promise<BlogPost> => {
    const response = await apiClient.put<BlogPost>(`/v1/posts/${id}`, data);
    const result = extractApiData(response);
    if (!result) {
      throw new Error('Failed to update post: no data returned');
    }
    return result;
  },

  /**
   * Delete a post
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/posts/${id}`);
  },
};
