'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import Input from './Input';
import Textarea from './Textarea';
import Select from './Select';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Button from './Button';
import DatePicker from './DatePicker';

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
  defaultValue?: unknown;
  helperText?: string;
}

export interface FormBuilderProps {
  fields: FormField[];
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
  className?: string;
  loading?: boolean;
}

export default function FormBuilder({ fields, onSubmit, submitLabel = 'Soumettre', className, loading = false }: FormBuilderProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    fields.forEach((field) => {
      initial[field.name] = field.defaultValue || (field.type === 'checkbox' ? false : '');
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: FormField, value: unknown): string | null => {
    if (field.required && (!value || value === '')) {
      return `${field.label} est requis`;
    }

    if (field.validation) {
      if (field.validation.min !== undefined && Number(value) < field.validation.min) {
        return `${field.label} doit être au moins ${field.validation.min}`;
      }
      if (field.validation.max !== undefined && Number(value) > field.validation.max) {
        return `${field.label} doit être au plus ${field.validation.max}`;
      }
      if (field.validation.pattern && !field.validation.pattern.test(String(value))) {
        return field.validation.message || `${field.label} n'est pas valide`;
      }
    }

    if (field.type === 'email' && value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(String(value))) {
        return 'Email invalide';
      }
    }

    return null;
  };

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate on change if field has been touched
    if (touched[name]) {
      const field = fields.find((f) => f.name === name);
      if (field) {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [name]: error || '' }));
      }
    }
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));

    const field = fields.find((f) => f.name === name);
    if (field) {
      const error = validateField(field, formData[name]);
      setErrors((prev) => ({ ...prev, [name]: error || '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    const allErrors: Record<string, string> = {};

    fields.forEach((field) => {
      allTouched[field.name] = true;
      const error = validateField(field, formData[field.name]);
      if (error) {
        allErrors[field.name] = error;
      }
    });

    setTouched(allTouched);
    setErrors(allErrors);

    // If no errors, submit
    if (Object.keys(allErrors).length === 0) {
      await onSubmit(formData);
    }
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      name: field.name,
      label: field.label,
      required: field.required,
      error: errors[field.name],
      helperText: field.helperText,
      onBlur: () => handleBlur(field.name),
    };

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            value={String(formData[field.name] ?? '')}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'select':
        return (
          <Select
            {...commonProps}
            value={String(formData[field.name] ?? '')}
            onChange={(e) => handleChange(field.name, e.target.value)}
            options={field.options || []}
          />
        );

      case 'checkbox':
        return (
          <Checkbox
            {...commonProps}
            checked={Boolean(formData[field.name] ?? false)}
            onChange={(checked) => handleChange(field.name, checked)}
          />
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.label && (
              <label className="block text-sm font-medium text-foreground">
                {field.label}
                {field.required && <span className="text-error-500 dark:text-error-400 ml-1">*</span>}
              </label>
            )}
            {field.options?.map((option) => (
              <Radio
                key={option.value}
                name={field.name}
                id={`${field.name}-${option.value}`}
                value={option.value}
                checked={formData[field.name] === option.value}
                onChange={(e) => handleChange(field.name, e.target.value)}
                label={option.label}
                error={errors[field.name]}
                onBlur={() => handleBlur(field.name)}
              />
            ))}
            {errors[field.name] && <p className="text-sm text-error-600 dark:text-error-400">{errors[field.name]}</p>}
            {field.helperText && !errors[field.name] && <p className="text-sm text-muted-foreground">{field.helperText}</p>}
          </div>
        );

      case 'date':
        return (
          <DatePicker
            {...commonProps}
            value={String(formData[field.name] ?? '')}
            onChange={(value) => handleChange(field.name, value)}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            type={field.type}
            value={String(formData[field.name] ?? '')}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('space-y-6', className)}>
      {fields.map((field) => (
        <div key={field.name}>{renderField(field)}</div>
      ))}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Chargement...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
