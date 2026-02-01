'use client';

import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import AppointmentForm from '@/components/appointments/AppointmentForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAppointmentsMutations } from '@/hooks/useAppointments';
import type { AppointmentCreate, AppointmentAttendeeCreate } from '@/lib/api/appointments';

export default function NouveauRendezVousPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';
  const { createAppointment } = useAppointmentsMutations();

  const handleSubmit = async (values: {
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    transaction_id?: number;
    attendees?: AppointmentAttendeeCreate[];
  }) => {
    const payload: AppointmentCreate = {
      title: values.title,
      description: values.description || null,
      start_time: values.start_time,
      end_time: values.end_time,
      status: 'confirmed',
      transaction_id: values.transaction_id ?? null,
      attendees: (values.attendees ?? []).filter((a) => a.email?.trim()),
    };
    await createAppointment(payload);
    router.push(`/${locale}/dashboard/modules/calendrier/rendez-vous`);
  };

  return (
    <ProtectedRoute>
      <Container>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Nouveau rendez-vous</h1>
            <p className="text-muted-foreground mt-1">
              Créez un rendez-vous et ajoutez des participants.
            </p>
          </div>
          <AppointmentForm
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/${locale}/dashboard/modules/calendrier/rendez-vous`)}
            submitLabel="Créer le rendez-vous"
          />
        </div>
      </Container>
    </ProtectedRoute>
  );
}
