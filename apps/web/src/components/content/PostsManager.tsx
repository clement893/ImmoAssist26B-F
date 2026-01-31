/**
 * Posts Manager Component
 *
 * CRUD interface for managing blog posts.
 *
 * @component
 */
'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, DataTable, Button, Modal, Input, Textarea, Badge, Alert } from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { Plus, Edit, Trash2, Eye, BookOpen, Calendar, User } from 'lucide-react';

export interface BlogPost extends Record<string, unknown> {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author_id: number;
  author_name?: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
  updated_at: string;
  category_id?: number;
  category_name?: string;
  tags?: string[];
}

export interface PostsManagerProps {
  posts?: BlogPost[];
  onPostCreate?: (post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onPostUpdate?: (id: number, post: Partial<BlogPost>) => Promise<void>;
  onPostDelete?: (id: number) => Promise<void>;
  className?: string;
}

/**
 * Posts Manager Component
 *
 * Displays blog posts in a DataTable with CRUD operations.
 */
export default function PostsManager({
  posts = [],
  onPostCreate,
  onPostUpdate,
  onPostDelete,
  className,
}: PostsManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft' as BlogPost['status'],
  });

  const columns: Column<BlogPost>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (_value: unknown, post: BlogPost) => (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{post.title}</span>
        </div>
      ),
    },
    {
      key: 'author_name',
      label: 'Author',
      sortable: true,
      render: (_value: unknown, post: BlogPost) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{post.author_name || 'Unknown'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_value: unknown, post: BlogPost) => {
        const statusColors: Record<BlogPost['status'], 'default' | 'success' | 'warning'> = {
          draft: 'default',
          published: 'success',
          archived: 'warning',
        };
        return (
          <Badge variant={statusColors[post.status]}>
            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'published_at',
      label: 'Published',
      sortable: true,
      render: (_value: unknown, post: BlogPost) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Not published'}
          </span>
        </div>
      ),
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      sortable: true,
      render: (_value: unknown, post: BlogPost) => (
        <span className="text-sm text-muted-foreground">
          {new Date(post.updated_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: unknown, post: BlogPost) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleView(post)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(post)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} title="Delete">
            <Trash2 className="w-4 h-4 text-danger-600 dark:text-danger-400" />
          </Button>
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      status: 'draft',
    });
    setSelectedPost(null);
    setError(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content,
      status: post.status,
    });
    setSelectedPost(post);
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleView = (post: BlogPost) => {
    // Preview functionality - implement when post preview is needed
    logger.log('View post:', post);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }
    try {
      if (onPostDelete) {
        await onPostDelete(id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete post');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (selectedPost && onPostUpdate) {
        await onPostUpdate(selectedPost.id, formData);
        setIsEditModalOpen(false);
      } else if (onPostCreate) {
        await onPostCreate(formData);
        setIsCreateModalOpen(false);
      }
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        status: 'draft',
      });
      setSelectedPost(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setFormData({
      ...formData,
      title: value,
      slug: formData.slug || generateSlug(value),
    });
  };

  return (
    <div className={className}>
      <Card title="Blog Posts">
        <div className="mb-4 flex justify-end">
          <Button onClick={handleCreate} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <DataTable
          data={posts}
          columns={columns}
          pageSize={10}
          searchable
          searchPlaceholder="Search posts..."
        />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Post"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Slug *</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="post-slug"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL-friendly identifier (e.g., my-first-post)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Excerpt</label>
            <Textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Short excerpt..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Brief summary displayed in post listings
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Post content..."
              rows={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as BlogPost['status'],
                })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Post"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Post title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Slug *</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="post-slug"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Excerpt</label>
            <Textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Short excerpt..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Post content..."
              rows={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as BlogPost['status'],
                })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
