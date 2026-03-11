/**
 * Form Renderer Component
 * Rendu dynamique des champs de formulaire
 */

'use client';

import { Input } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Checkbox } from '@/components/ui';
import { Select } from '@/components/ui';
import { Card } from '@/components/ui';

interface FormRendererProps {
  fields: any;
  data: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
}

export function FormRenderer({ fields, data, onChange }: FormRendererProps) {
  if (!fields || !fields.sections) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun champ défini pour ce formulaire
      </div>
    );
  }

  const sections = [...(fields.sections || [])].sort(
    (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
  );

  return (
    <div className="space-y-6">
      {sections.map((section: any) => (
        <Card key={section.id} className="p-6">
          <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
          {section.description && (
            <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
          )}

          <div className="space-y-4">
            {section.fields?.map((field: any) => {
              // Vérifier les conditions d'affichage
              if (field.conditional && !evaluateCondition(field.conditional, data)) {
                return null;
              }

              return (
                <FieldRenderer
                  key={field.id || field.name}
                  field={field}
                  value={data[field.name || field.id]}
                  onChange={(value: any) => onChange(field.name || field.id, value)}
                />
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}

/** Normalize value for HTML date input (yyyy-mm-dd). */
function toDateInputValue(val: unknown): string {
  if (val == null || val === '') return '';
  const s = String(val).trim();
  if (!s) return '';
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : s.slice(0, 10);
}

/** Normalize value for HTML datetime-local input (yyyy-mm-ddThh:mm). */
function toDatetimeLocalInputValue(val: unknown): string {
  if (val == null || val === '') return '';
  const s = String(val).trim();
  if (!s) return '';
  const iso = s.replace(' ', 'T').replace(/\.\d{3}Z?$/, '');
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})T?(\d{1,2}:\d{2})?/);
  if (match) {
    const datePart = match[1];
    const timePart = match[2] || '12:00';
    return `${datePart}T${timePart}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T12:00`;
  return s.slice(0, 16);
}

function FieldRenderer({ field, value, onChange }: any) {
  const commonProps = {
    id: field.id || field.name,
    required: field.required,
    placeholder: field.placeholder,
  };

  return (
    <div>
      <label htmlFor={field.id || field.name} className="block text-xs font-medium text-foreground mb-1.5">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {field.helpText && (
        <p className="text-xs text-muted-foreground mt-1 mb-2">{field.helpText}</p>
      )}

      {field.type === 'text' && (
        <Input
          {...commonProps}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={field.validation?.maxLength}
        />
      )}

      {field.type === 'textarea' && (
        <Textarea
          {...commonProps}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={field.rows || 4}
          maxLength={field.validation?.maxLength}
        />
      )}

      {field.type === 'number' && (
        <Input
          {...commonProps}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={field.validation?.min}
          max={field.validation?.max}
        />
      )}

      {field.type === 'email' && (
        <Input
          {...commonProps}
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'tel' && (
        <Input
          {...commonProps}
          type="tel"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'date' && (
        <Input
          {...commonProps}
          type="date"
          value={toDateInputValue(value)}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      )}

      {field.type === 'datetime-local' && (
        <Input
          {...commonProps}
          type="datetime-local"
          value={toDatetimeLocalInputValue(value)}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
      )}

      {field.type === 'select' && (
        <Select
          options={
            field.options?.map((option: any) => ({
              label: option.label,
              value: option.value,
            })) || []
          }
          value={value || ''}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}

      {field.type === 'checkbox' && (
        <div className="flex items-center gap-2">
          <Checkbox
            id={field.id || field.name}
            checked={value || false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
          />
          <label htmlFor={field.id || field.name} className="font-normal text-xs">
            {field.label}
          </label>
        </div>
      )}
    </div>
  );
}

function evaluateCondition(conditional: any, data: Record<string, any>): boolean {
  const fieldValue = data[conditional.field];

  switch (conditional.operator) {
    case 'equals':
      return fieldValue === conditional.value;
    case 'not_equals':
      return fieldValue !== conditional.value;
    case 'contains':
      return String(fieldValue).includes(conditional.value);
    default:
      return true;
  }
}
