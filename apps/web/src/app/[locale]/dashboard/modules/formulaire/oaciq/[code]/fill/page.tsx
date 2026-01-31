'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Card, Button, Input, Loading, Alert } from '@immoassist/ui';
import { oaciqFormsAPI, OACIQForm, FormSubmissionStatus } from '@/lib/api/oaciq-adapters';
import { FormSection, FormFieldConfig } from '@immoassist/formulaire/types';

export default function FillOACIQFormPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const locale = params.locale as string;
  
  const [form, setForm] = useState<OACIQForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (code) {
      loadForm();
    }
  }, [code]);

  const loadForm = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await oaciqFormsAPI.getByCode(code);
      setForm(data);
    } catch (err) {
      console.error('Erreur lors du chargement du formulaire:', err);
      setError('Erreur lors du chargement du formulaire');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (status: FormSubmissionStatus) => {
    if (!form || !form.code) return;
    
    try {
      setSaving(true);
      setError(null);
      await oaciqFormsAPI.createSubmission({
        formCode: form.code,
        data: formData,
        status,
      });
      
      router.push(`/${locale}/dashboard/modules/formulaire/oaciq`);
    } catch (err) {
      console.error('Erreur lors de la soumission:', err);
      setError('Erreur lors de la soumission du formulaire');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FormFieldConfig) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Input
            key={field.id}
            type={field.type}
            label={field.label}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            required={field.required}
            placeholder={field.placeholder}
          />
        );
      
      case 'textarea':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              required={field.required}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border rounded-lg bg-background resize-none"
              rows={4}
            />
            {field.helpText && (
              <p className="text-sm text-muted-foreground mt-1">{field.helpText}</p>
            )}
          </div>
        );
      
      case 'number':
        return (
          <Input
            key={field.id}
            type="number"
            label={field.label}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            required={field.required}
            placeholder={field.placeholder}
          />
        );
      
      case 'date':
        return (
          <Input
            key={field.id}
            type="date"
            label={field.label}
            value={value}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              required={field.required}
              className="w-full px-3 py-2 border rounded-lg bg-background"
            >
              <option value="">Sélectionner...</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {field.helpText && (
              <p className="text-sm text-muted-foreground mt-1">{field.helpText}</p>
            )}
          </div>
        );
      
      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );
      
      default:
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Input
              type="text"
              value={value}
              onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              required={field.required}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </Container>
    );
  }

  if (error || !form) {
    return (
      <Container>
        <Alert variant="error">
          {error || 'Formulaire introuvable'}
        </Alert>
      </Container>
    );
  }

  // Parser les champs depuis le JSON
  let fields: { sections: FormSection[] } | null = null;
  try {
    if (form.fields && typeof form.fields === 'object' && 'sections' in form.fields) {
      fields = form.fields as { sections: FormSection[] };
    }
  } catch (e) {
    console.error('Erreur lors du parsing des champs:', e);
  }

  if (!fields || !fields.sections || fields.sections.length === 0) {
    return (
      <Container>
        <Card>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">[{form.code}] {form.name}</h1>
            <Alert variant="warning">
              Ce formulaire n&apos;a pas encore de champs définis. Utilisez la fonction d&apos;extraction IA pour générer les champs depuis le PDF.
            </Alert>
            {form.pdfUrl && (
              <div className="mt-4">
                <Button
                  variant="primary"
                  onClick={async () => {
                    try {
                      await oaciqFormsAPI.extractFields(form.code!, form.pdfUrl!);
                      await loadForm();
                    } catch (err) {
                      console.error('Erreur lors de l\'extraction:', err);
                    }
                  }}
                >
                  Extraire les champs depuis le PDF
                </Button>
              </div>
            )}
          </div>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">[{form.code}] {form.name}</h1>
          {form.category && (
            <p className="text-muted-foreground mt-1 capitalize">{form.category}</p>
          )}
        </div>

        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        <form className="space-y-8">
          {fields.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <Card key={section.id}>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                  <div className="space-y-4">
                    {section.fields.map((field) => renderField(field))}
                  </div>
                </div>
              </Card>
            ))}

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(FormSubmissionStatus.DRAFT)}
              disabled={saving}
            >
              Sauvegarder brouillon
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleSubmit(FormSubmissionStatus.COMPLETED)}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Soumettre'}
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
}
