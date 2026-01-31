'use client';

import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Calendar from '@/components/ui/Calendar';
import { Calendar as CalendarIcon, Clock, Users, Plus } from 'lucide-react';
import { useState } from 'react';

export default function CalendrierModulePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [view, setView] = useState<'month' | 'day'>('month');

  // Exemple d'événements pour démonstration
  const [events] = useState([
    {
      id: '1',
      title: 'Réunion client',
      date: new Date(),
      time: '10:00',
      description: 'Discussion sur la transaction',
      color: 'bg-blue-500',
    },
    {
      id: '2',
      title: 'Visite de propriété',
      date: new Date(Date.now() + 86400000), // Demain
      time: '14:00',
      description: 'Visite avec les acheteurs',
      color: 'bg-green-500',
    },
  ]);

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendrier</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos rendez-vous, visites et événements immobiliers
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === 'month' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('month')}
            >
              Mois
            </Button>
            <Button
              variant={view === 'day' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('day')}
            >
              Jour
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/nouveau`)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvel événement
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <Card>
          <div className="p-6">
            <Calendar
              events={events}
              view={view}
              onDateClick={(date) => {
                setView('day');
                // Vous pouvez naviguer vers la vue jour avec cette date
              }}
              onEventClick={(event) => {
                router.push(`/${locale}/dashboard/modules/calendrier/evenements/${event.id}`);
              }}
            />
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card hover onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/nouveau`)}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Plus className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Nouvel événement</h2>
                  <p className="text-sm text-muted-foreground">
                    Créer un rendez-vous
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Ajoutez un nouveau rendez-vous, une visite ou un événement à votre calendrier.
              </p>
              <Button variant="primary" className="w-full">
                Créer un événement
              </Button>
            </div>
          </Card>

          <Card hover onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/agenda`)}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <CalendarIcon className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Agenda</h2>
                  <p className="text-sm text-muted-foreground">
                    Vue d'ensemble
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Consultez tous vos événements à venir dans une vue liste organisée.
              </p>
              <Button variant="primary" className="w-full">
                Voir l'agenda
              </Button>
            </div>
          </Card>

          <Card hover onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/evenements`)}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-info/10 rounded-lg">
                  <Clock className="w-8 h-8 text-info" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Événements</h2>
                  <p className="text-sm text-muted-foreground">
                    Gérer les événements
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Gérez tous vos événements : modifier, supprimer ou consulter les détails.
              </p>
              <Button variant="primary" className="w-full">
                Gérer les événements
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}
