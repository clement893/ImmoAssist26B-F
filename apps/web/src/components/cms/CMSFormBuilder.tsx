/**
 * CMS Form Builder Component
 *
 * Advanced drag-and-drop form builder for creating dynamic forms.
 * Allows users to create custom forms with various field types and validation rules.
 *
 * @component
 * @example
 * ```tsx
 * <CMSFormBuilder
 *   form={formData}
 *   onSave={async (form) => {
 *     await formsAPI.update(form.id, form);
 *   }}
 * />
 * ```
 *
 * @features
 * - Drag-and-drop form field reordering
 * - Multiple field types (text, email, textarea, select, checkbox, radio, number, date, file)
 * - Field validation configuration
 * - Required field support
 * - Options for select/radio/checkbox fields
 * - Form submission handling
 *
 * @see {@link https://github.com/your-repo/docs/components/form-builder} Component Documentation
 */
'use client';

import { useState } from 'react';
import { Card, Button, Input, Select, Modal, Alert, Badge } from '@/components/ui';
import { DragDropList } from '@/components/ui';
import type { DragDropListItem } from '@/components/ui';
import { Plus, Save, Trash2, Settings } from 'lucide-react';

export interface FormFieldConfig {
  id: string;
  type:
    | 'text'
    | 'email'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'number'
    | 'date'
    | 'file';
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface CMSForm {
  id: string;
  name: string;
  description?: string;
  fields: FormFieldConfig[];
  submitButtonText?: string;
  successMessage?: string;
}

export interface CMSFormBuilderProps {
  form?: CMSForm;
  onSave?: (form: CMSForm) => Promise<void>;
  className?: string;
}

const fieldTypes = [
  { label: 'Text', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Select', value: 'select' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Radio', value: 'radio' },
  { label: 'Number', value: 'number' },
  { label: 'Date', value: 'date' },
  { label: 'File', value: 'file' },
];

/**
 * CMS Form Builder Component
 *
 * Visual form builder with drag-and-drop functionality.
 */
export default function CMSFormBuilder({ form, onSave, className }: CMSFormBuilderProps) {
  const [currentForm, setCurrentForm] = useState<CMSForm>(
    form || {
      id: '',
      name: '',
      description: '',
      fields: [],
      submitButtonText: 'Submit',
      successMessage: 'Thank you for your submission!',
    }
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FormFieldConfig | null>(null);
  const [newField, setNewField] = useState<Omit<FormFieldConfig, 'id'>>({
    type: 'text',
    label: '',
    name: '',
    placeholder: '',
    required: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReorder = (newOrder: DragDropListItem[]) => {
    const reorderedFields = newOrder.map(
      (item) => currentForm.fields.find((f) => f.id === item.id)!
    );
    setCurrentForm({
      ...currentForm,
      fields: reorderedFields,
    });
  };

  const handleAddField = () => {
    const field: FormFieldConfig = {
      id: `field-${Date.now()}`,
      ...newField,
      name: newField.name || newField.label.toLowerCase().replace(/\s+/g, '_'),
    };
    setCurrentForm({
      ...currentForm,
      fields: [...currentForm.fields, field],
    });
    setNewField({
      type: 'text',
      label: '',
      name: '',
      placeholder: '',
      required: false,
    });
    setIsAddModalOpen(false);
  };

  const handleDeleteField = (id: string) => {
    setCurrentForm({
      ...currentForm,
      fields: currentForm.fields.filter((field) => field.id !== id),
    });
  };

  const handleEditField = (field: FormFieldConfig) => {
    setEditingField(field);
    setNewField({
      type: field.type,
      label: field.label,
      name: field.name,
      placeholder: field.placeholder,
      required: field.required,
      options: field.options,
      validation: field.validation,
    });
    setIsAddModalOpen(true);
  };

  const handleUpdateField = () => {
    if (!editingField) return;
    setCurrentForm({
      ...currentForm,
      fields: currentForm.fields.map((field) =>
        field.id === editingField.id ? { ...editingField, ...newField, id: editingField.id } : field
      ),
    });
    setEditingField(null);
    setNewField({
      type: 'text',
      label: '',
      name: '',
      placeholder: '',
      required: false,
    });
    setIsAddModalOpen(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (onSave) {
        await onSave(currentForm);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save form');
    } finally {
      setIsSaving(false);
    }
  };

  const dragDropItems: DragDropListItem[] = currentForm.fields.map((field) => ({
    id: field.id,
    content: (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Badge variant="default">{field.type}</Badge>
          <span className="text-sm font-medium text-foreground">{field.label || field.name}</span>
          {field.required && <span className="text-xs text-error-500">*</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEditField(field)}>
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteField(field.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    ),
  }));

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Form Fields">
            {error && (
              <div className="mb-4">
                <Alert variant="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              </div>
            )}

            <div className="mb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Form Name *
                </label>
                <Input
                  value={currentForm.name}
                  onChange={(e) =>
                    setCurrentForm({
                      ...currentForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Contact Form"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={currentForm.description || ''}
                  onChange={(e) =>
                    setCurrentForm({
                      ...currentForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Form description"
                  rows={2}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingField(null);
                  setNewField({
                    type: 'text',
                    label: '',
                    name: '',
                    placeholder: '',
                    required: false,
                  });
                  setIsAddModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>

            {currentForm.fields.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No fields yet. Add a field to get started.</p>
              </div>
            ) : (
              <DragDropList items={dragDropItems} onReorder={handleReorder} />
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card title="Form Settings">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Submit Button Text
                </label>
                <Input
                  value={currentForm.submitButtonText || 'Submit'}
                  onChange={(e) =>
                    setCurrentForm({
                      ...currentForm,
                      submitButtonText: e.target.value,
                    })
                  }
                  placeholder="Submit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Success Message
                </label>
                <textarea
                  value={currentForm.successMessage || ''}
                  onChange={(e) =>
                    setCurrentForm({
                      ...currentForm,
                      successMessage: e.target.value,
                    })
                  }
                  placeholder="Thank you for your submission!"
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </Card>

          <Card title="Actions">
            <Button variant="primary" onClick={handleSave} disabled={isSaving} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Form'}
            </Button>
          </Card>
        </div>
      </div>

      {/* Add/Edit Field Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingField(null);
          setNewField({
            type: 'text',
            label: '',
            name: '',
            placeholder: '',
            required: false,
          });
        }}
        title={editingField ? 'Edit Field' : 'Add Field'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Field Type *</label>
            <Select
              options={fieldTypes}
              value={newField.type}
              onChange={(e) =>
                setNewField({
                  ...newField,
                  type: e.target.value as FormFieldConfig['type'],
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Label *</label>
            <Input
              value={newField.label}
              onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              placeholder="Field Label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Name (auto-generated from label)
            </label>
            <Input
              value={newField.name}
              onChange={(e) => setNewField({ ...newField, name: e.target.value })}
              placeholder="field_name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Placeholder</label>
            <Input
              value={newField.placeholder || ''}
              onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
              placeholder="Enter text..."
            />
          </div>

          {(newField.type === 'select' || newField.type === 'radio') && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Options (one per line)
              </label>
              <textarea
                value={
                  newField.options?.map((o) => `${o?.label || ''}:${o?.value || ''}`).join('\n') ||
                  ''
                }
                onChange={(e) => {
                  const options = e.target.value
                    .split('\n')
                    .filter((line) => line.trim())
                    .map((line) => {
                      const [label, value] = line.split(':');
                      const trimmedLabel = label?.trim() || '';
                      const trimmedValue = value?.trim() || trimmedLabel;
                      return { label: trimmedLabel, value: trimmedValue };
                    });
                  setNewField({ ...newField, options });
                }}
                placeholder="Option 1:value1\nOption 2:value2"
                rows={4}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={newField.required || false}
              onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500"
            />
            <label className="ml-2 text-sm text-foreground">Required field</label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingField(null);
                setNewField({
                  type: 'text',
                  label: '',
                  name: '',
                  placeholder: '',
                  required: false,
                });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={editingField ? handleUpdateField : handleAddField}
              disabled={!newField.label}
            >
              {editingField ? 'Update Field' : 'Add Field'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
