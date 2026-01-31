/**
 * Pages Manager Component
 *
 * CRUD interface for managing content pages.
 *
 * @component
 */
'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, DataTable, Button, Modal, Input, Textarea, Badge, Alert } from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { Plus, Edit, Trash2, Eye, FileText } from 'lucide-react';

export interface Page extends Record<string, unknown> {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface PagesManagerProps {
  pages?: Page[];
  onPageCreate?: (page: Omit<Page, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onPageUpdate?: (id: number, page: Partial<Page>) => Promise<void>;
  onPageDelete?: (id: number) => Promise<void>;
  className?: string;
}

/**
 * Pages Manager Component
 *
 * Displays pages in a DataTable with CRUD operations.
 */
export default function PagesManager({
  pages = [],
  onPageCreate,
  onPageUpdate,
  onPageDelete,
  className,
}: PagesManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft' as Page['status'],
  });

  const columns: Column<Page>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (_value: unknown, page: Page) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{page.title}</span>
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      sortable: true,
      render: (_value: unknown, page: Page) => (
        <code className="text-sm text-muted-foreground">/{page.slug}</code>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_value: unknown, page: Page) => {
        const statusColors: Record<Page['status'], 'default' | 'success' | 'warning'> = {
          draft: 'default',
          published: 'success',
          archived: 'warning',
        };
        return (
          <Badge variant={statusColors[page.status]}>
            {page.status.charAt(0).toUpperCase() + page.status.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      sortable: true,
      render: (_value: unknown, page: Page) => (
        <span className="text-sm text-muted-foreground">
          {new Date(page.updated_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: unknown, page: Page) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleView(page)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(page)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(page.id)} title="Delete">
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
      content: '',
      status: 'draft',
    });
    setSelectedPage(null);
    setError(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (page: Page) => {
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      status: page.status,
    });
    setSelectedPage(page);
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleView = (page: Page) => {
    // Preview functionality - implement when page preview is needed
    logger.log('View page:', page);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this page?')) {
      return;
    }
    try {
      if (onPageDelete) {
        await onPageDelete(id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete page');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (selectedPage && onPageUpdate) {
        await onPageUpdate(selectedPage.id, formData);
        setIsEditModalOpen(false);
      } else if (onPageCreate) {
        await onPageCreate(formData);
        setIsCreateModalOpen(false);
      }
      setFormData({
        title: '',
        slug: '',
        content: '',
        status: 'draft',
      });
      setSelectedPage(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save page');
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
      <Card title="Pages">
        <div className="mb-4 flex justify-end">
          <Button onClick={handleCreate} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            New Page
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
          data={pages}
          columns={columns}
          pageSize={10}
          searchable
          searchPlaceholder="Search pages..."
        />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Page"
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
              {isSubmitting ? 'Creating...' : 'Create Page'}
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
              placeholder="Page title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Slug *</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="page-slug"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL-friendly identifier (e.g., about-us)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Page content..."
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
                  status: e.target.value as Page['status'],
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
        title="Edit Page"
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
              placeholder="Page title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Slug *</label>
            <Input
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="page-slug"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Page content..."
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
                  status: e.target.value as Page['status'],
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
