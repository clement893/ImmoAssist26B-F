'use client';

import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Calendar, Edit, Trash2, Mail, User } from 'lucide-react';
import { useAppointment, useAppointmentsMutations } from '@/hooks/useAppointments';
import type { AppointmentAttendeeResponse } from '@/lib/api/appointments';

export default function RendezVousDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';
  const id = params?.id ? parseInt(String(params.id), 10) : null;
  const { appointment, isLoading, error } = useAppointment(id);
  const { deleteAppointment } = useAppointmentsMutations();

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('fr-CA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusLabel: Record<string, string> = {
    confirmed: 'Confirmé',
    pending: 'En attente',
    cancelled: 'Annulé',
  };

  const handleDelete = async () => {
    if (!id || !confirm('Supprimer ce rendez-vous ?')) return;
    await deleteAppointment(id);
    router.push(`/${locale}/dashboard/modules/calendrier/rendez-vous`);
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
        <Card className="p-6">
          <p className="text-destructive">Rendez-vous introuvable.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/rendez-vous`)}>
            Retour à la liste
          </Button>
        </Card>
      </Container>
    );
  }

  if (isLoading || !appointment) {
    return (
      <Container>
        <Card className="p-8 text-center text-muted-foreground">Chargement...</Card>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{appointment.title}</h1>
            <p className="text-muted-foreground mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-sm">
                {statusLabel[appointment.status] ?? appointment.status}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/rendez-vous/${id}/modifier`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Début</p>
              <p className="font-medium">{formatDate(appointment.start_time)}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fin</p>
              <p className="font-medium">{formatDate(appointment.end_time)}</p>
            </div>
          </div>
          {appointment.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="whitespace-pre-wrap">{appointment.description}</p>
            </div>
          )}
          {appointment.transaction_id && (
            <div>
              <p className="text-sm text-muted-foreground">Transaction</p>
              <p className="font-medium">#{appointment.transaction_id}</p>
            </div>
          )}
        </Card>

        {appointment.attendees && appointment.attendees.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Participants</h2>
            <ul className="space-y-2">
              {appointment.attendees.map((a: AppointmentAttendeeResponse) => (
                <li key={a.id} className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{a.name || a.email}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {a.email}
                    </p>
                  </div>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded bg-muted">
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Button variant="outline" onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/rendez-vous`)}>
          Retour à la liste
        </Button>
      </div>
    </Container>
  );
}
