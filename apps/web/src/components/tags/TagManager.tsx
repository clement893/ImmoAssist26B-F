'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Tag as TagIcon, Trash2, Edit2, TrendingUp } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';

interface Tag {
  id: number;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  usage_count: number;
}

interface TagManagerProps {
  entityType: string;
  className?: string;
}

export function TagManager({ entityType, className = '' }: TagManagerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTag, setEditingTag] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    fetchPopularTags();
  }, [entityType]);

  const fetchPopularTags = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<Tag[]>('/api/v1/tags/popular', {
        params: {
          entity_type: entityType,
          limit: 50,
        },
      });

      if (response.data) {
        setTags(response.data);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      await apiClient.delete(`/v1/tags/${tagId}`);
      setTags(tags.filter((t) => t.id !== tagId));
      showToast({
        message: 'Tag deleted successfully',
        type: 'success',
      });
    } catch (error: unknown) {
      showToast({
        message: getErrorMessage(error) || 'Failed to delete tag',
        type: 'error',
      });
    }
  };

  const handleStartEdit = (tag: Tag) => {
    setEditingTag(tag.id);
    setEditName(tag.name);
  };

  const handleSaveEdit = async () => {
    try {
      // Note: Update endpoint would need to be added to backend
      // For now, just cancel edit
      setEditingTag(null);
      setEditName('');
      showToast({
        message: 'Tag update feature coming soon',
        type: 'info',
      });
    } catch (error: unknown) {
      showToast({
        message: getErrorMessage(error) || 'Failed to update tag',
        type: 'error',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditName('');
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Manage Tags</h3>
        <Button variant="outline" size="sm" onClick={fetchPopularTags}>
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading tags...
        </div>
      ) : tags.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No tags found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="p-3 border border-border rounded-lg bg-background"
            >
              {editingTag === tag.id ? (
                <div className="space-y-2">
                  <Input
                    value={editName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditName(e.target.value)
                    }
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={handleSaveEdit}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TagIcon
                        className="h-4 w-4"
                        style={{
                          color: tag.color || 'var(--color-muted-foreground)',
                        }}
                      />
                      <span className="font-medium">{tag.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(tag)}
                        className="p-1 hover:bg-muted dark:hover:bg-muted rounded"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-1 hover:bg-error-50 dark:hover:bg-error-900/20 rounded text-error-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {tag.description && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {tag.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>Used {tag.usage_count} times</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
