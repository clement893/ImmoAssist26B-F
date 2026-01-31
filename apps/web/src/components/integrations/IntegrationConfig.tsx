/** * Integration Configuration Component * Setup and configure integrations */ 'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { Save, X, CheckCircle, AlertCircle, Key } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
export interface IntegrationConfigField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'email' | 'number';
  value: string;
  required: boolean;
  placeholder?: string;
  helperText?: string;
  sensitive?: boolean;
}
export interface IntegrationConfigProps {
  integration: { id: string; name: string; description: string; icon?: string; category: string };
  fields?: IntegrationConfigField[];
  onSave?: (config: Record<string, string>) => void | Promise<void>;
  onCancel?: () => void;
  onTest?: () => void | Promise<boolean>;
  className?: string;
}
export default function IntegrationConfig({
  integration,
  fields = [],
  onSave,
  onCancel,
  onTest,
  className,
}: IntegrationConfigProps) {
  const [formData, setFormData] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field.id]: field.value || '' }), {})
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const handleChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => ({ ...prev, [fieldId]: '' }));
    }
    setTestResult(null);
  };
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required && !formData[field.id]?.trim()) {
        newErrors[field.id] = `${field.label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleTest = async () => {
    if (!validate()) return;
    setTestResult(null);
    try {
      const result = await onTest?.();
      setTestResult(result ? 'success' : 'error');
    } catch (_error) {
      setTestResult('error');
    }
  };
  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onSave?.(formData);
    } catch (_error) {
      setErrors({ submit: 'Failed to save configuration. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card className={clsx('bg-background', className)}>
      {' '}
      <div className="space-y-6">
        {' '}
        {/* Header */}{' '}
        <div className="flex items-start justify-between">
          {' '}
          <div className="flex items-center gap-3">
            {' '}
            {integration.icon ? (
              <Avatar src={integration.icon} name={integration.name} size="lg" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                {' '}
                <Key className="w-6 h-6 text-primary-600 dark:text-primary-400" />{' '}
              </div>
            )}{' '}
            <div>
              {' '}
              <h3 className="text-lg font-semibold text-foreground">
                {' '}
                Configure {integration.name}{' '}
              </h3>{' '}
              <p className="text-sm text-muted-foreground"> {integration.description} </p>{' '}
            </div>{' '}
          </div>{' '}
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              {' '}
              <span className="flex items-center gap-2">
                {' '}
                <X className="w-4 h-4" /> Cancel{' '}
              </span>{' '}
            </Button>
          )}{' '}
        </div>{' '}
        {/* Configuration Fields */}{' '}
        {fields.length > 0 ? (
          <div className="space-y-4">
            {' '}
            {fields.map((field) => (
              <div key={field.id}>
                {' '}
                <Input
                  label={field.label}
                  type={field.type === 'password' ? 'password' : field.type}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  helperText={field.helperText}
                  error={errors[field.id]}
                  required={field.required}
                />{' '}
              </div>
            ))}{' '}
          </div>
        ) : (
          <div className="p-4 bg-info-50 dark:bg-info-900/20 rounded-lg border border-info-200 dark:border-info-800">
            {' '}
            <div className="flex items-start gap-2">
              {' '}
              <AlertCircle className="w-5 h-5 text-info-600 dark:text-info-400 flex-shrink-0 mt-0.5" />{' '}
              <div className="text-sm text-info-900 dark:text-info-200">
                {' '}
                <div className="font-medium mb-1">No Configuration Required</div>{' '}
                <div>This integration doesn't require any additional configuration.</div>{' '}
              </div>{' '}
            </div>{' '}
          </div>
        )}{' '}
        {/* Test Connection */}{' '}
        {onTest && fields.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
            {' '}
            <div>
              {' '}
              <div className="text-sm font-medium text-foreground mb-1"> Test Connection </div>{' '}
              <div className="text-xs text-muted-foreground">
                {' '}
                Verify your configuration before saving{' '}
              </div>{' '}
            </div>{' '}
            <div className="flex items-center gap-3">
              {' '}
              {testResult === 'success' && (
                <Badge variant="success">
                  {' '}
                  <span className="flex items-center gap-1">
                    {' '}
                    <CheckCircle className="w-3 h-3" /> Connection Successful{' '}
                  </span>{' '}
                </Badge>
              )}{' '}
              {testResult === 'error' && (
                <Badge variant="error">
                  {' '}
                  <span className="flex items-center gap-1">
                    {' '}
                    <AlertCircle className="w-3 h-3" /> Connection Failed{' '}
                  </span>{' '}
                </Badge>
              )}{' '}
              <Button variant="outline" size="sm" onClick={handleTest}>
                {' '}
                Test{' '}
              </Button>{' '}
            </div>{' '}
          </div>
        )}{' '}
        {/* Error Message */}{' '}
        {errors.submit && (
          <div className="p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800 text-sm text-danger-800 dark:text-danger-200">
            {' '}
            {errors.submit}{' '}
          </div>
        )}{' '}
        {/* Actions */}{' '}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          {' '}
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={loading}>
              {' '}
              Cancel{' '}
            </Button>
          )}{' '}
          <Button variant="primary" onClick={handleSave} loading={loading}>
            {' '}
            <span className="flex items-center gap-2">
              {' '}
              <Save className="w-4 h-4" /> Save Configuration{' '}
            </span>{' '}
          </Button>{' '}
        </div>{' '}
      </div>{' '}
    </Card>
  );
}
