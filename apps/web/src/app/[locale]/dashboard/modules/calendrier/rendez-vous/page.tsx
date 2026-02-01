'use client';

import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Plus, Calendar, ChevronRight } from 'lucide-react';
import { useAppointmentsList } from '@/hooks/useAppointments';

export default function RendezVousListPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fr';
  const { appointments, total, isLoading, error } = useAppointmentsList({ limit: 50 });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-CA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
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

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Rendez-vous</h1>
            <p className="text-muted-foreground mt-1">
              Liste de vos rendez-vous
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/rendez-vous/nouveau`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau rendez-vous
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
            Erreur lors du chargement des rendez-vous.
          </div>
        )}

        {isLoading ? (
          <Card className="p-8 text-center text-muted-foreground">
            Chargement...
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {appointments.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Aucun rendez-vous. Créez-en un depuis le calendrier ou le bouton ci-dessus.
                </div>
              ) : (
                appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/rendez-vous/${apt.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{apt.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(apt.start_time)} — {formatDate(apt.end_time)}
                        </p>
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-muted">
                          {statusLabel[apt.status] ?? apt.status}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))
              )}
            </div>
            {total > 0 && (
              <div className="p-3 text-sm text-muted-foreground border-t border-border">
                {total} rendez-vous au total
              </div>
            )}
          </Card>
        )}
      </div>
    </Container>
  );
}
