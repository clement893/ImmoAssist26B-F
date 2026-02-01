'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Textarea from '@/components/ui/Textarea';
import DatePicker from '@/components/ui/DatePicker';
import type { AppointmentResponse, AppointmentAttendeeCreate } from '@/lib/api/appointments';

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface AppointmentFormValues {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  transaction_id: string;
  attendees: AppointmentAttendeeCreate[];
}

const defaultValues: AppointmentFormValues = {
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  transaction_id: '',
  attendees: [],
};

export interface AppointmentSubmitPayload {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  transaction_id?: number;
  attendees?: AppointmentAttendeeCreate[];
}

interface AppointmentFormProps {
  initial?: AppointmentResponse | null;
  onSubmit: (values: AppointmentSubmitPayload) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function AppointmentForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Enregistrer',
}: AppointmentFormProps) {
  const [values, setValues] = useState<AppointmentFormValues>(() =>
    initial
      ? {
          title: initial.title,
          description: initial.description ?? '',
          start_time: toDatetimeLocal(initial.start_time),
          end_time: toDatetimeLocal(initial.end_time),
          transaction_id: initial.transaction_id ? String(initial.transaction_id) : '',
          attendees: initial.attendees.map((a) => ({
            email: a.email,
            name: a.name ?? undefined,
            contact_id: a.contact_id ?? undefined,
            status: a.status,
          })),
        }
      : { ...defaultValues }
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const start = new Date(values.start_time).toISOString();
      const end = new Date(values.end_time).toISOString();
      if (end <= start) {
        setError('L\'heure de fin doit être après l\'heure de début.');
        setSubmitting(false);
        return;
      }
      await onSubmit({
        title: values.title,
        description: values.description || undefined,
        start_time: start,
        end_time: end,
        transaction_id: values.transaction_id ? parseInt(values.transaction_id, 10) : undefined,
        attendees: values.attendees.filter((a) => a.email?.trim()),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const addAttendee = () => {
    setValues((v) => ({
      ...v,
      attendees: [...v.attendees, { email: '', name: '', status: 'needs_action' }],
    }));
  };

  const updateAttendee = (index: number, field: keyof AppointmentAttendeeCreate, value: string | number | undefined) => {
    setValues((v) => ({
      ...v,
      attendees: v.attendees.map((a, i) =>
        i === index ? { ...a, [field]: value } : a
      ),
    }));
  };

  const removeAttendee = (index: number) => {
    setValues((v) => ({
      ...v,
      attendees: v.attendees.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <Input
          label="Titre"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          required
          placeholder="Ex: Visite propriété, Signature..."
        />
        <Textarea
          label="Description"
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          placeholder="Notes optionnelles"
          rows={3}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label="Début"
            type="datetime-local"
            value={values.start_time}
            onChange={(e) => setValues((v) => ({ ...v, start_time: e.target.value }))}
            required
          />
          <DatePicker
            label="Fin"
            type="datetime-local"
            value={values.end_time}
            onChange={(e) => setValues((v) => ({ ...v, end_time: e.target.value }))}
            required
          />
        </div>
        <Input
          label="Transaction (ID optionnel)"
          type="number"
          value={values.transaction_id}
          onChange={(e) => setValues((v) => ({ ...v, transaction_id: e.target.value }))}
          placeholder="ID de la transaction"
        />
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Participants</label>
            <Button type="button" variant="outline" size="sm" onClick={addAttendee}>
              Ajouter
            </Button>
          </div>
          <div className="space-y-2">
            {values.attendees.map((a, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  type="email"
                  placeholder="Email"
                  value={a.email}
                  onChange={(e) => updateAttendee(i, 'email', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Nom"
                  value={a.name ?? ''}
                  onChange={(e) => updateAttendee(i, 'name', e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => removeAttendee(i)}>
                  Retirer
                </Button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button type="submit" variant="primary" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </Card>
    </form>
  );
}
