'use client';

import { useState } from 'react';
import { Save, Eye, Code } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';

interface TemplateEditorProps {
  entityType: string;
  onSave?: (template: { id: number; name: string }) => void;
  templateId?: number;
  className?: string;
}

export function TemplateEditor({ entityType, onSave, templateId, className = '' }: TemplateEditorProps) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) {
      showToast({ message: 'Name and content are required', type: 'error' });
      return;
    }

    setIsSaving(true);

    try {
      if (templateId) {
        // Update existing template
        await apiClient.put(`/v1/templates/${templateId}`, {
          name,
          content,
          description,
          category,
          is_public: isPublic,
        });
        showToast({ message: 'Template updated successfully', type: 'success' });
      } else {
        // Create new template
        const response = await apiClient.post<{ id: number; name: string }>('/api/v1/templates/templates', {
          name,
          content,
          description,
          category,
          entity_type: entityType,
          is_public: isPublic,
        });

        if (response.data) {
          onSave?.(response.data);
          showToast({ message: 'Template created successfully', type: 'success' });
        }
      }
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to save template', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{templateId ? 'Edit Template' : 'Create Template'}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? <Code className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Template Name"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="e.g., Welcome Email"
            required
          />
          <Input
            label="Category"
            value={category}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategory(e.target.value)}
            placeholder="e.g., email, document"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Describe what this template is for..."
            rows={2}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          />
        </div>

        {previewMode ? (
          <div className="p-4 bg-muted rounded-lg border border-border">
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-sm">{content}</pre>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Template Content <span className="text-error-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              placeholder="Enter template content. Use {{variable}} for variables..."
              rows={10}
              required
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPublic(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="isPublic" className="text-sm text-foreground">
            Make this template public
          </label>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>
            Use variables in your template with <code>{'{{variable_name}}'}</code> syntax.
          </p>
          <p className="mt-1">
            Example: <code>Hello {'{{user_name}}'}, welcome to {'{{project_name}}'}!</code>
          </p>
        </div>
      </div>
    </Card>
  );
}
