'use client';

import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useState } from 'react';

interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  description?: string;
  location?: string;
  attendees?: string[];
  type: 'meeting' | 'visit' | 'deadline' | 'other';
}

export default function AgendaPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // Exemple d'événements
  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'Réunion client - Transaction 123',
      date: new Date(),
      time: '10:00',
      description: 'Discussion sur les conditions de vente',
      location: 'Bureau principal',
      attendees: ['Client A', 'Client B'],
      type: 'meeting',
    },
    {
      id: '2',
      title: 'Visite de propriété',
      date: new Date(Date.now() + 86400000),
      time: '14:00',
      description: 'Visite avec les acheteurs potentiels',
      location: '123 Rue Principale, Montréal',
      attendees: ['Acheteur 1', 'Acheteur 2'],
      type: 'visit',
    },
    {
      id: '3',
      title: 'Échéance - Promesse d\'achat',
      date: new Date(Date.now() + 172800000),
      time: '17:00',
      description: 'Date limite pour la signature',
      type: 'deadline',
    },
  ]);

  const getTypeColor = (type: Event['type']) => {
    const colors = {
      meeting: 'primary',
      visit: 'success',
      deadline: 'warning',
      other: 'default',
    };
    return colors[type] || 'default';
  };

  const getTypeLabel = (type: Event['type']) => {
    const labels = {
      meeting: 'Réunion',
      visit: 'Visite',
      deadline: 'Échéance',
      other: 'Autre',
    };
    return labels[type] || 'Autre';
  };

  // Grouper les événements par date
  const groupedEvents = events.reduce((acc, event) => {
    const dateKey = event.date.toLocaleDateString('fr-CA');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${locale}/dashboard/modules/calendrier`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Agenda</h1>
              <p className="text-muted-foreground mt-1">
                Vue d'ensemble de tous vos événements
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/nouveau`)}
          >
            Nouvel événement
          </Button>
        </div>

        {/* Events List */}
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <Card key={date}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    {new Date(date).toLocaleDateString('fr-CA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h2>
                  <Badge variant="default">{dayEvents.length} événement{dayEvents.length > 1 ? 's' : ''}</Badge>
                </div>

                <div className="space-y-4">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-modern cursor-pointer" // UI Revamp - Transition moderne
                      onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/evenements/${event.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={getTypeColor(event.type) as any}>
                              {getTypeLabel(event.type)}
                            </Badge>
                            <h3 className="text-lg font-semibold">{event.title}</h3>
                          </div>
                          {event.description && (
                            <p className="text-muted-foreground mb-3">{event.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {event.time}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                              </div>
                            )}
                            {event.attendees && event.attendees.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {event.attendees.length} participant{event.attendees.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}

          {Object.keys(groupedEvents).length === 0 && (
            <Card>
              <div className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Aucun événement</h3>
                <p className="text-muted-foreground mb-6">
                  Vous n'avez aucun événement planifié pour le moment.
                </p>
                <Button
                  variant="primary"
                  onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/nouveau`)}
                >
                  Créer un événement
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}
