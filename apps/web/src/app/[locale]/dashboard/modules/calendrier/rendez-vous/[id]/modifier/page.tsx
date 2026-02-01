'use client';

import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import { useAppointment, useAppointmentsMutations } from '@/hooks/useAppointments';
import type { AppointmentUpdate, AppointmentAttendeeCreate } from '@/lib/api/appointments';

export default function ModifierRendezVousPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';
  const id = params?.id ? parseInt(String(params.id), 10) : null;
  const { appointment, isLoading, error } = useAppointment(id);
  const { updateAppointment } = useAppointmentsMutations();

  const handleSubmit = async (values: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    transaction_id?: number;
    attendees?: AppointmentAttendeeCreate[];
  }) => {
    if (!id) return;
    const payload: AppointmentUpdate = {
      title: values.title,
      description: values.description || null,
      start_time: values.start_time,
      end_time: values.end_time,
      transaction_id: values.transaction_id ?? null,
      attendees: (values.attendees ?? []).filter((a) => a.email?.trim()),
    };
    await updateAppointment(id, payload);
    router.push(`/${locale}/dashboard/modules/calendrier/rendez-vous/${id}`);
  };

  if (id == null || isNaN(id)) {
    return (
      <Container>
        <div className="p-4 text-destructive">ID invalide.</div>
      </Container>
    );
  }

  if (error || (!isLoading && !appointment)) {
    return (
      <Container>
        <p className="text-destructive">Rendez-vous introuvable.</p>
        <button type="button" onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/rendez-vous`)}>
          Retour
        </button>
      </Container>
    );
  }

  if (isLoading || !appointment) {
    return (
      <Container>
        <div className="p-8 text-center text-muted-foreground">Chargement...</div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Modifier le rendez-vous</h1>
          <p className="text-muted-foreground mt-1">
            {appointment.title}
          </p>
        </div>
        <AppointmentForm
          initial={appointment}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/${locale}/dashboard/modules/calendrier/rendez-vous/${id}`)}
          submitLabel="Enregistrer"
        />
      </div>
    </Container>
  );
}
