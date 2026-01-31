'use client';
import { useState, FormEvent } from 'react';
import { Button, Input, Textarea, Card } from '@/components/ui';
import { type Company, type CompanyCreate, type CompanyUpdate } from '@/lib/api/companies';
export interface CompanyFormData {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  city?: string;
  country?: string;
}
export interface CompanyFormProps {
  company?: Company;
  initialData?: Partial<CompanyFormData>;
  onSubmit: (data: CompanyCreate | CompanyUpdate) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
  parentCompanies?: Array<{ id: number; name: string }>;
}
export default function CompanyForm({
  company,
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = 'Enregistrer',
  loading = false,
}: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: company?.name || initialData.name || '',
    description: company?.description || initialData.description || '',
    website: company?.website || initialData.website || '',
    industry: company?.industry || initialData.industry || '',
    size: company?.size || initialData.size || '',
    city: company?.city || initialData.city || '',
    country: company?.country || initialData.country || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Card className="p-6">
      {' '}
      <form onSubmit={handleSubmit} className="space-y-4">
        {' '}
        <Input
          label="Nom de l'entreprise"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />{' '}
        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />{' '}
        <Input
          label="Site web"
          type="url"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />{' '}
        <div className="grid grid-cols-2 gap-4">
          {' '}
          <Input
            label="Secteur"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          />{' '}
          <Input
            label="Taille"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
          />{' '}
        </div>{' '}
        <div className="grid grid-cols-2 gap-4">
          {' '}
          <Input
            label="Ville"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />{' '}
          <Input
            label="Pays"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />{' '}
        </div>{' '}
        <div className="flex gap-2 justify-end">
          {' '}
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {' '}
              Annuler{' '}
            </Button>
          )}{' '}
          <Button type="submit" variant="primary" loading={isSubmitting || loading}>
            {' '}
            {submitLabel}{' '}
          </Button>{' '}
        </div>{' '}
      </form>{' '}
    </Card>
  );
}
