/**
 * Tags Manager Component
 *
 * CRUD interface for managing content tags.
 *
 * @component
 */
'use client';

import { useState } from 'react';
import { Card, DataTable, Button, Modal, Input, Textarea, Badge, Alert } from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { Plus, Edit, Trash2, Tag as TagIcon } from 'lucide-react';

export interface TagItem extends Record<string, unknown> {
  id: number;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  entity_type: string;
  usage_count: number;
  created_at: string;
}

export interface TagsManagerProps {
  tags?: TagItem[];
  onTagCreate?: (tag: Omit<TagItem, 'id' | 'slug' | 'created_at' | 'usage_count'>) => Promise<void>;
  onTagUpdate?: (id: number, tag: Partial<TagItem>) => Promise<void>;
  onTagDelete?: (id: number) => Promise<void>;
  className?: string;
}

/**
 * Tags Manager Component
 *
 * Displays tags in a DataTable with CRUD operations.
 */
export default function TagsManager({
  tags = [],
  onTagCreate,
  onTagUpdate,
  onTagDelete,
  className,
}: TagsManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    entity_type: 'post',
    color: '',
  });

  const columns: Column<TagItem>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_value: unknown, tag: TagItem) => (
        <div className="flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-muted-foreground" />
          <Badge variant="default" style={tag.color ? { backgroundColor: tag.color } : undefined}>
            {tag.name}
          </Badge>
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      sortable: true,
      render: (_value: unknown, tag: TagItem) => (
        <code className="text-sm text-muted-foreground">{tag.slug}</code>
      ),
    },
    {
      key: 'entity_type',
      label: 'Type',
      sortable: true,
      render: (_value: unknown, tag: TagItem) => <Badge variant="default">{tag.entity_type}</Badge>,
    },
    {
      key: 'usage_count',
      label: 'Usage',
      sortable: true,
      render: (_value: unknown, tag: TagItem) => (
        <span className="text-sm text-muted-foreground">
          {tag.usage_count} {tag.usage_count === 1 ? 'time' : 'times'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: unknown, tag: TagItem) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(tag)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(tag.id)} title="Delete">
            <Trash2 className="w-4 h-4 text-danger-600 dark:text-danger-400" />
          </Button>
        </div>
      ),
    },
  ];

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      entity_type: 'post',
      color: '',
    });
    setSelectedTag(null);
    setError(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (tag: TagItem) => {
    setFormData({
      name: tag.name,
      description: tag.description || '',
      entity_type: tag.entity_type,
      color: tag.color || '',
    });
    setSelectedTag(tag);
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) {
      return;
    }
    try {
      if (onTagDelete) {
        await onTagDelete(id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete tag');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (selectedTag && onTagUpdate) {
        await onTagUpdate(selectedTag.id, formData);
        setIsEditModalOpen(false);
      } else if (onTagCreate) {
        await onTagCreate(formData);
        setIsCreateModalOpen(false);
      }
      setFormData({
        name: '',
        description: '',
        entity_type: 'post',
        color: '',
      });
      setSelectedTag(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <Card title="Tags">
        <div className="mb-4 flex justify-end">
          <Button onClick={handleCreate} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            New Tag
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
          data={tags}
          columns={columns}
          pageSize={10}
          searchable
          searchPlaceholder="Search tags..."
        />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Tag"
        size="md"
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
              {isSubmitting ? 'Creating...' : 'Create Tag'}
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
              placeholder="Tag name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Entity Type *</label>
            <select
              value={formData.entity_type}
              onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              required
            >
              <option value="post">Post</option>
              <option value="page">Page</option>
              <option value="media">Media</option>
              <option value="project">Project</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tag description..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Color</label>
            <Input
              type="color"
              value={formData.color || '#3b82f6'}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="h-10"
            />
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Tag"
        size="md"
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
              placeholder="Tag name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Entity Type *</label>
            <select
              value={formData.entity_type}
              onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              required
            >
              <option value="post">Post</option>
              <option value="page">Page</option>
              <option value="media">Media</option>
              <option value="project">Project</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tag description..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Color</label>
            <Input
              type="color"
              value={formData.color || '#3b82f6'}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="h-10"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
