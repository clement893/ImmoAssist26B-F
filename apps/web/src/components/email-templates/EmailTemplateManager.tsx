'use client';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Mail, Edit2, Trash2, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
interface EmailTemplate {
  id: number;
  key: string;
  name: string;
  category?: string;
  subject: string;
  html_body: string;
  text_body?: string;
  variables?: string[];
  is_active: boolean;
  is_system: boolean;
  language: string;
  description?: string;
  created_at: string;
}
interface EmailTemplateManagerProps {
  className?: string;
}
export function EmailTemplateManager({ className = '' }: EmailTemplateManagerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});
  const { showToast } = useToast();
  useEffect(() => {
    fetchTemplates();
  }, []);
  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<EmailTemplate[]>(
        '/api/v1/email-templates/email-templates'
      );
      if (response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject,
      html_body: template.html_body,
      text_body: template.text_body,
      category: template.category,
      description: template.description,
      is_active: template.is_active,
    });
    setIsEditing(true);
  };
  const handleSave = async () => {
    if (!selectedTemplate) return;
    try {
      await apiClient.put(`/v1/email-templates/${selectedTemplate.id}`, editForm);
      showToast({ message: 'Template updated successfully', type: 'success' });
      setIsEditing(false);
      fetchTemplates();
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to update template', type: 'error' });
    }
  };
  const handleDelete = async (templateId: number, isSystem: boolean) => {
    if (isSystem) {
      showToast({ message: 'Cannot delete system templates', type: 'error' });
      return;
    }
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await apiClient.delete(`/v1/email-templates/${templateId}`);
      showToast({ message: 'Template deleted successfully', type: 'success' });
      fetchTemplates();
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setIsEditing(false);
      }
    } catch (error: unknown) {
      showToast({ message: getErrorMessage(error) || 'Failed to delete template', type: 'error' });
    }
  };
  if (isLoading) {
    return (
      <Card className={className}>
        {' '}
        <div className="text-center py-8 text-muted-foreground">Loading templates...</div>{' '}
      </Card>
    );
  }
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className}`}>
      {' '}
      <Card>
        {' '}
        <div className="flex items-center justify-between mb-4">
          {' '}
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {' '}
            <Mail className="h-5 w-5" /> Email Templates{' '}
          </h3>{' '}
          <Button variant="primary" size="sm">
            {' '}
            New Template{' '}
          </Button>{' '}
        </div>{' '}
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {' '}
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />{' '}
            <p>No templates found</p>{' '}
          </div>
        ) : (
          <div className="space-y-2">
            {' '}
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-3 border rounded-lg cursor-pointer transition-modern ${selectedTemplate?.id === template.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-border hover:border-border dark:hover:border-border'}`} // UI Revamp - Transition moderne
                onClick={() => {
                  setSelectedTemplate(template);
                  setIsEditing(false);
                }}
              >
                {' '}
                <div className="flex items-center justify-between">
                  {' '}
                  <div>
                    {' '}
                    <div className="flex items-center gap-2 mb-1">
                      {' '}
                      <span className="font-medium">{template.name}</span>{' '}
                      {template.is_system && (
                        <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-0.5 rounded">
                          {' '}
                          System{' '}
                        </span>
                      )}{' '}
                      {!template.is_active && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded"> Inactive </span>
                      )}{' '}
                    </div>{' '}
                    <p className="text-xs text-muted-foreground">{template.key}</p>{' '}
                    {template.category && (
                      <span className="text-xs text-muted-foreground">{template.category}</span>
                    )}{' '}
                  </div>{' '}
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {' '}
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-1 hover:bg-muted dark:hover:bg-muted rounded"
                      title="Edit"
                    >
                      {' '}
                      <Edit2 className="h-4 w-4" />{' '}
                    </button>{' '}
                    {!template.is_system && (
                      <button
                        onClick={() => handleDelete(template.id, template.is_system)}
                        className="p-1 hover:bg-error-50 dark:hover:bg-error-900/20 rounded text-error-500"
                        title="Delete"
                      >
                        {' '}
                        <Trash2 className="h-4 w-4" />{' '}
                      </button>
                    )}{' '}
                  </div>{' '}
                </div>{' '}
              </div>
            ))}{' '}
          </div>
        )}{' '}
      </Card>{' '}
      {selectedTemplate && (
        <Card>
          {' '}
          <div className="flex items-center justify-between mb-4">
            {' '}
            <h3 className="text-lg font-semibold">Template Details</h3>{' '}
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => handleEdit(selectedTemplate)}>
                {' '}
                <Edit2 className="h-4 w-4 mr-2" /> Edit{' '}
              </Button>
            )}{' '}
          </div>{' '}
          {isEditing ? (
            <div className="space-y-4">
              {' '}
              <div>
                {' '}
                <label className="block text-sm font-medium mb-2">Name</label>{' '}
                <Input
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />{' '}
              </div>{' '}
              <div>
                {' '}
                <label className="block text-sm font-medium mb-2">Subject</label>{' '}
                <Input
                  value={editForm.subject || ''}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                />{' '}
              </div>{' '}
              <div>
                {' '}
                <label className="block text-sm font-medium mb-2">HTML Body</label>{' '}
                <textarea
                  value={editForm.html_body || ''}
                  onChange={(e) => setEditForm({ ...editForm, html_body: e.target.value })}
                  rows={10}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                />{' '}
              </div>{' '}
              <div>
                {' '}
                <label className="block text-sm font-medium mb-2">Text Body</label>{' '}
                <textarea
                  value={editForm.text_body || ''}
                  onChange={(e) => setEditForm({ ...editForm, text_body: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />{' '}
              </div>{' '}
              <div className="flex gap-2">
                {' '}
                <Button variant="primary" onClick={handleSave}>
                  {' '}
                  <Save className="h-4 w-4 mr-2" /> Save{' '}
                </Button>{' '}
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  {' '}
                  Cancel{' '}
                </Button>{' '}
              </div>{' '}
            </div>
          ) : (
            <div className="space-y-4">
              {' '}
              <div>
                {' '}
                <label className="text-sm font-medium text-muted-foreground">Key</label>{' '}
                <p className="font-mono text-sm">{selectedTemplate.key}</p>{' '}
              </div>{' '}
              <div>
                {' '}
                <label className="text-sm font-medium text-muted-foreground">Subject</label>{' '}
                <p>{selectedTemplate.subject}</p>{' '}
              </div>{' '}
              <div>
                {' '}
                <label className="text-sm font-medium text-muted-foreground">HTML Body</label>{' '}
                <div className="p-3 bg-muted rounded border max-h-64 overflow-y-auto">
                  {' '}
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {' '}
                    {selectedTemplate.html_body}{' '}
                  </pre>{' '}
                </div>{' '}
              </div>{' '}
              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div>
                  {' '}
                  <label className="text-sm font-medium text-muted-foreground">
                    Variables
                  </label>{' '}
                  <div className="flex flex-wrap gap-2 mt-1">
                    {' '}
                    {selectedTemplate.variables.map((varName) => (
                      <span key={varName} className="px-2 py-1 bg-muted rounded text-sm font-mono">
                        {' '}
                        {`{{${varName}}}`}{' '}
                      </span>
                    ))}{' '}
                  </div>{' '}
                </div>
              )}{' '}
            </div>
          )}{' '}
        </Card>
      )}{' '}
    </div>
  );
}
