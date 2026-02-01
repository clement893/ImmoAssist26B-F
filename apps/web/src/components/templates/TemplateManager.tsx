'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Copy } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface Template {
  id: number;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  entity_type: string;
  usage_count: number;
  is_public: boolean;
  created_at: string;
}

interface TemplateManagerProps {
  entityType?: string;
  category?: string;
  className?: string;
  onSelect?: (template: Template) => void;
}

export function TemplateManager({
  entityType,
  category,
  className = '',
  onSelect,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, [entityType, category]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<Template[]>('/api/v1/templates/templates', {
        params: {
          entity_type: entityType,
          category,
          limit: 50,
        },
      });

      // Edge case: Handle null/undefined response
      if (response?.data && Array.isArray(response.data)) {
        setTemplates(response.data);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      // Edge case: Better error handling
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch templates';
      logger.error('Failed to fetch templates', error instanceof Error ? error : new Error(errorMessage));
      setTemplates([]); // Set empty array on error to prevent undefined state
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      await apiClient.post(`/v1/templates/${template.id}/duplicate`);
      showToast({ message: 'Template duplicated successfully', type: 'success' });
      fetchTemplates();
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to duplicate template', type: 'error' });
    }
  };

  const handleDelete = async (templateId: number) => {
    // Edge case: Validate templateId
    if (!templateId || typeof templateId !== 'number' || templateId <= 0) {
      showToast({ message: 'Invalid template ID', type: 'error' });
      return;
    }

    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await apiClient.delete(`/v1/templates/${templateId}`);

      // Edge case: Handle concurrent deletions
      setTemplates((prevTemplates) => {
        const filtered = prevTemplates.filter((t) => t.id !== templateId);
        // Verify deletion was successful
        if (filtered.length === prevTemplates.length) {
          logger.warn('Template not found in list during deletion', { templateId });
        }
        return filtered;
      });

      showToast({ message: 'Template deleted successfully', type: 'success' });
    } catch (error: unknown) {
      // Edge case: Better error handling
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { detail?: string } })?.data?.detail || 'Failed to delete template'
          : error instanceof Error
            ? error.message
            : 'Failed to delete template';

      showToast({ message: errorMessage, type: 'error' });
      logger.error('Failed to delete template', error instanceof Error ? error : new Error(String(error)));
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="text-center py-8 text-muted-foreground">Loading templates...</div>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Templates</h3>
        <Button variant="primary" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p>No templates found</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="p-4 hover:shadow-standard-lg transition-modern cursor-pointer" // UI Revamp - Transition moderne, shadow-standard-lg
              onClick={() => onSelect?.(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-500" />
                  <h4 className="font-semibold text-foreground">{template.name}</h4>
                </div>
                {template.is_public && (
                  <span className="text-xs bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200 px-2 py-1 rounded">
                    Public
                  </span>
                )}
              </div>

              {template.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{template.description}</p>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {template.category && <span className="capitalize">{template.category}</span>}
                  <span>Used {template.usage_count} times</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(template);
                    }}
                    className="p-1 hover:bg-muted dark:hover:bg-muted rounded"
                    title="Duplicate"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(template.id);
                    }}
                    className="p-1 hover:bg-error-50 dark:hover:bg-error-900/20 rounded text-error-500"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
