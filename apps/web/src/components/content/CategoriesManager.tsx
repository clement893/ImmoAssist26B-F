/**
 * Categories Manager Component
 *
 * CRUD interface for managing content categories.
 *
 * @component
 */
'use client';

import { useState } from 'react';
import { Card, DataTable, Button, Modal, Input, Textarea, Badge, Alert } from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { Plus, Edit, Trash2, Folder } from 'lucide-react';

export interface Category extends Record<string, unknown> {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_id?: number;
  parent_name?: string;
  entity_type: string;
  sort_order: number;
  created_at: string;
}

export interface CategoriesManagerProps {
  categories?: Category[];
  onCategoryCreate?: (
    category: Omit<Category, 'id' | 'slug' | 'created_at' | 'sort_order'>
  ) => Promise<void>;
  onCategoryUpdate?: (id: number, category: Partial<Category>) => Promise<void>;
  onCategoryDelete?: (id: number) => Promise<void>;
  className?: string;
}

/**
 * Categories Manager Component
 *
 * Displays categories in a DataTable with CRUD operations.
 */
export default function CategoriesManager({
  categories = [],
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
  className,
}: CategoriesManagerProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    entity_type: 'post',
    parent_id: undefined as number | undefined,
    icon: '',
    color: '',
  });

  const columns: Column<Category>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_value: unknown, category: Category) => (
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{category.name}</span>
          {category.color && (
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
          )}
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      sortable: true,
      render: (_value: unknown, category: Category) => (
        <code className="text-sm text-muted-foreground">{category.slug}</code>
      ),
    },
    {
      key: 'entity_type',
      label: 'Type',
      sortable: true,
      render: (_value: unknown, category: Category) => (
        <Badge variant="default">{category.entity_type}</Badge>
      ),
    },
    {
      key: 'parent_name',
      label: 'Parent',
      sortable: true,
      render: (_value: unknown, category: Category) => (
        <span className="text-sm text-muted-foreground">{category.parent_name || '—'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: unknown, category: Category) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(category)} title="Edit">
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(category.id)}
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
      description: '',
      entity_type: 'post',
      parent_id: undefined,
      icon: '',
      color: '',
    });
    setSelectedCategory(null);
    setError(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      entity_type: category.entity_type,
      parent_id: category.parent_id,
      icon: category.icon || '',
      color: category.color || '',
    });
    setSelectedCategory(category);
    setError(null);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }
    try {
      if (onCategoryDelete) {
        await onCategoryDelete(id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (selectedCategory && onCategoryUpdate) {
        await onCategoryUpdate(selectedCategory.id, formData);
        setIsEditModalOpen(false);
      } else if (onCategoryCreate) {
        await onCategoryCreate(formData);
        setIsCreateModalOpen(false);
      }
      setFormData({
        name: '',
        description: '',
        entity_type: 'post',
        parent_id: undefined,
        icon: '',
        color: '',
      });
      setSelectedCategory(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parentCategories = categories.filter((cat) => !cat.parent_id);

  return (
    <div className={className}>
      <Card title="Categories">
        <div className="mb-4 flex justify-end">
          <Button onClick={handleCreate} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            New Category
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
          data={categories}
          columns={columns}
          pageSize={10}
          searchable
          searchPlaceholder="Search categories..."
        />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Category"
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
              {isSubmitting ? 'Creating...' : 'Create Category'}
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
              placeholder="Category name"
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
            <label className="block text-sm font-medium text-foreground mb-2">
              Parent Category
            </label>
            <select
              value={formData.parent_id || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parent_id: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">None (Top Level)</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Category description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Icon</label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Icon name or emoji"
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
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Category"
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
            <label className="block text-sm font-medium text-foreground mb-2">Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Category name"
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
            <label className="block text-sm font-medium text-foreground mb-2">
              Parent Category
            </label>
            <select
              value={formData.parent_id || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  parent_id: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">None (Top Level)</option>
              {parentCategories
                .filter((cat) => cat.id !== selectedCategory?.id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Category description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Icon</label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Icon name or emoji"
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
          </div>
        </form>
      </Modal>
    </div>
  );
}
