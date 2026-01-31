'use client';

import { useState, FormEvent } from 'react';
import { Button, Input } from '@/components/ui';
import {
  type Contact,
  type ContactCreate,
  type ContactUpdate,
} from '@/lib/api/reseau-contacts';

export interface ContactFormProps {
  contact?: Contact;
  initialData?: Partial<ContactCreate>;
  onSubmit: (data: ContactCreate | ContactUpdate) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
  companies?: Array<{ id: number; name: string }>;
  employees?: Array<{ id: number; name: string }>;
  circles?: string[];
}

export default function ContactForm({
  contact,
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = 'Enregistrer',
  loading = false,
  companies = [],
  employees = [],
  circles = [],
}: ContactFormProps) {
  const [formData, setFormData] = useState<Partial<ContactCreate>>({
    first_name: contact?.first_name || initialData.first_name || '',
    last_name: contact?.last_name || initialData.last_name || '',
    company_id: contact?.company_id || initialData.company_id || null,
    company_name: contact?.company_name || initialData.company_name || null,
    position: contact?.position || initialData.position || null,
    circle: contact?.circle || initialData.circle || null,
    linkedin: contact?.linkedin || initialData.linkedin || null,
    email: contact?.email || initialData.email || null,
    phone: contact?.phone || initialData.phone || null,
    city: contact?.city || initialData.city || null,
    country: contact?.country || initialData.country || null,
    birthday: contact?.birthday || initialData.birthday || null,
    language: contact?.language || initialData.language || null,
    employee_id: contact?.employee_id || initialData.employee_id || null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData as ContactCreate | ContactUpdate);
    } catch (error) {
      // Error handling is done by parent component
      console.error('Contact form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium mb-1">
            Prénom <span className="text-destructive">*</span>
          </label>
          <Input
            id="first_name"
            value={formData.first_name || ''}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            required
            disabled={isSubmitting || loading}
          />
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium mb-1">
            Nom <span className="text-destructive">*</span>
          </label>
          <Input
            id="last_name"
            value={formData.last_name || ''}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            required
            disabled={isSubmitting || loading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value || null })
            }
            disabled={isSubmitting || loading}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Téléphone
          </label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value || null })
            }
            disabled={isSubmitting || loading}
          />
        </div>

        {companies.length > 0 && (
          <div>
            <label
              htmlFor="company_id"
              className="block text-sm font-medium mb-1"
            >
              Entreprise
            </label>
            <select
              id="company_id"
              value={formData.company_id || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  company_id: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              disabled={isSubmitting || loading}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="">Aucune</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="position" className="block text-sm font-medium mb-1">
            Poste
          </label>
          <Input
            id="position"
            value={formData.position || ''}
            onChange={(e) =>
              setFormData({ ...formData, position: e.target.value || null })
            }
            disabled={isSubmitting || loading}
          />
        </div>

        {circles.length > 0 && (
          <div>
            <label htmlFor="circle" className="block text-sm font-medium mb-1">
              Cercle
            </label>
            <select
              id="circle"
              value={formData.circle || ''}
              onChange={(e) =>
                setFormData({ ...formData, circle: e.target.value || null })
              }
              disabled={isSubmitting || loading}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="">Aucun</option>
              {circles.map((circle) => (
                <option key={circle} value={circle}>
                  {circle}
                </option>
              ))}
            </select>
          </div>
        )}

        {employees.length > 0 && (
          <div>
            <label
              htmlFor="employee_id"
              className="block text-sm font-medium mb-1"
            >
              Employé assigné
            </label>
            <select
              id="employee_id"
              value={formData.employee_id || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  employee_id: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              disabled={isSubmitting || loading}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="">Aucun</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="linkedin" className="block text-sm font-medium mb-1">
            LinkedIn
          </label>
          <Input
            id="linkedin"
            value={formData.linkedin || ''}
            onChange={(e) =>
              setFormData({ ...formData, linkedin: e.target.value || null })
            }
            disabled={isSubmitting || loading}
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium mb-1">
            Ville
          </label>
          <Input
            id="city"
            value={formData.city || ''}
            onChange={(e) =>
              setFormData({ ...formData, city: e.target.value || null })
            }
            disabled={isSubmitting || loading}
          />
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-1">
            Pays
          </label>
          <Input
            id="country"
            value={formData.country || ''}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value || null })
            }
            disabled={isSubmitting || loading}
          />
        </div>

        <div>
          <label htmlFor="birthday" className="block text-sm font-medium mb-1">
            Date de naissance
          </label>
          <Input
            id="birthday"
            type="date"
            value={formData.birthday || ''}
            onChange={(e) =>
              setFormData({ ...formData, birthday: e.target.value || null })
            }
            disabled={isSubmitting || loading}
          />
        </div>

        <div>
          <label htmlFor="language" className="block text-sm font-medium mb-1">
            Langue
          </label>
          <Input
            id="language"
            value={formData.language || ''}
            onChange={(e) =>
              setFormData({ ...formData, language: e.target.value || null })
            }
            disabled={isSubmitting || loading}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting || loading}
          >
            Annuler
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isSubmitting || loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
