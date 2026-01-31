/**
 * Templates Manager Component
 *
 * CRUD interface for managing content templates.
 *
 * @component
 */
'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, DataTable, Button, Modal, Input, Textarea, Badge, Alert } from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { Plus, Edit, Trash2, FileText, Eye } from 'lucide-react';

export interface ContentTemplate extends Record<string, unknown> {
  id: number;
  name: string;
  content: string;
  content_html?: string;
  entity_type: string;
  category?: string;
  description?: string;
  variables?: Record<string, unknown>;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplatesManagerProps {
  templates?: ContentTemplate[];
  onTemplateCreate?: (
    template: Omit<ContentTemplate, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  onTemplateUpdate?: (id: number, template: Partial<ContentTemplate>) => Promise<void>;
  onTemplateDelete?: (id: number) => Promise<void>;
  className?: string;
}

/**
 * Templates Manager Component
 *
 * Displays templates in a DataTable with CRUD operations.
 */
export default function TemplatesManager({
  templates = [],
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  className,
}: TemplatesManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    content_html: '',
    entity_type: 'post',
    category: '',
    description: '',
    is_public: false,
  });

  const columns: Column<ContentTemplate>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_value: unknown, template: ContentTemplate) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{template.name}</span>
        </div>
      ),
    },
    {
      key: 'entity_type',
      label: 'Type',
      sortable: true,
      render: (_value: unknown, template: ContentTemplate) => (
        <Badge variant="default">{template.entity_type}</Badge>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (_value: unknown, template: ContentTemplate) => (
        <span className="text-sm text-muted-foreground">{template.category || '—'}</span>
      ),
    },
    {
      key: 'is_public',
      label: 'Public',
      sortable: true,
      render: (_value: unknown, template: ContentTemplate) => (
        <Badge variant={template.is_public ? 'success' : 'default'}>
          {template.is_public ? 'Public' : 'Private'}
        </Badge>
      ),
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      sortable: true,
      render: (_value: unknown, template: ContentTemplate) => (
        <span className="text-sm text-muted-foreground">
          {new Date(template.updated_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: unknown, template: ContentTemplate) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleView(template)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(template)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(template.id)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-danger-600 dark:text-danger-400" />
          </Button>
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    setFormData({
      name: '',
      content: '',
      content_html: '',
      entity_type: 'post',
      category: '',
      description: '',
      is_public: false,
    });
    setSelectedTemplate(null);
    setError(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (template: ContentTemplate) => {
    setFormData({
      name: template.name,
      content: template.content,
      content_html: template.content_html || '',
      entity_type: template.entity_type,
      category: template.category || '',
      description: template.description || '',
      is_public: template.is_public,
    });
    setSelectedTemplate(template);
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleView = (template: ContentTemplate) => {
    // Preview functionality - implement when template preview is needed
    logger.log('View template:', template);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    try {
      if (onTemplateDelete) {
        await onTemplateDelete(id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (selectedTemplate && onTemplateUpdate) {
        await onTemplateUpdate(selectedTemplate.id, formData);
        setIsEditModalOpen(false);
      } else if (onTemplateCreate) {
        await onTemplateCreate(formData);
        setIsCreateModalOpen(false);
      }
      setFormData({
        name: '',
        content: '',
        content_html: '',
        entity_type: 'post',
        category: '',
        description: '',
        is_public: false,
      });
      setSelectedTemplate(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <Card title="Templates">
        <div className="mb-4 flex justify-end">
          <Button onClick={handleCreate} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            New Template
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
          data={templates}
          columns={columns}
          pageSize={10}
          searchable
          searchPlaceholder="Search templates..."
        />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Template"
        size="xl"
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
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Template name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Entity Type *
              </label>
              <select
                value={formData.entity_type}
                onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                required
              >
                <option value="post">Post</option>
                <option value="page">Page</option>
                <option value="email">Email</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Category"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Template description..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content *</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Template content..."
              rows={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">HTML Content</label>
            <Textarea
              value={formData.content_html}
              onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
              placeholder="HTML content (optional)..."
              rows={5}
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">Make template publicly available</span>
            </label>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Template"
        size="xl"
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
            <label className="block text-sm font-medium text-foreground mb-2">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Template name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Entity Type *
              </label>
              <select
                value={formData.entity_type}
                onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                required
              >
                <option value="post">Post</option>
                <option value="page">Page</option>
                <option value="email">Email</option>
                <option value="document">Document</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Category"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Template description..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content *</label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Template content..."
              rows={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">HTML Content</label>
            <Textarea
              value={formData.content_html}
              onChange={(e) => setFormData({ ...formData, content_html: e.target.value })}
              placeholder="HTML content (optional)..."
              rows={5}
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">Make template publicly available</span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
}
