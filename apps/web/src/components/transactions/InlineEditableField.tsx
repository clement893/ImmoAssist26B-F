'use client';

import { useState, useRef, useEffect } from 'react';
import { Input, Textarea, Select } from '@/components/ui';
import { Check, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface InlineEditableFieldProps {
  label: string;
  value: string | number | undefined;
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select';
  options?: Array<{ label: string; value: string }>;
  onSave: (value: string | number) => Promise<void>;
  formatValue?: (value: string | number | undefined) => string;
  className?: string;
  placeholder?: string;
}

export default function InlineEditableField({
  label,
  value,
  type = 'text',
  options = [],
  onSave,
  formatValue,
  className = '',
  placeholder,
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>(String(value || ''));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(String(value || ''));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'number') {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing, type]);

  const handleStartEdit = () => {
    setEditValue(String(value || ''));
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditValue(String(value || ''));
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const finalValue = type === 'number' ? parseFloat(editValue) || 0 : editValue;
      await onSave(finalValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const displayValue = formatValue ? formatValue(value) : String(value || '-');

  if (isEditing) {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            {type === 'textarea' ? (
              <Textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="min-h-[80px]"
              />
            ) : type === 'select' ? (
              <Select
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                options={options}
              />
            ) : (
              <Input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={type}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
              />
            )}
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
          </div>
          <div className="flex gap-1 pt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 w-8 p-0"
            >
              <Check className="w-4 h-4 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={isSaving}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <label className="text-sm font-medium text-muted-foreground mb-1 block">{label}</label>
          <p className="text-base text-foreground min-h-[24px]">{displayValue}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleStartEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 ml-2"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
