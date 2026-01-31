'use client';

import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Plus, Edit, Trash2, Calendar, Clock, MapPin, Users } from 'lucide-react';
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

export default function EvenementsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [events, setEvents] = useState<Event[]>([
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

  const handleDelete = (eventId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      setEvents(events.filter((e) => e.id !== eventId));
    }
  };

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
              <h1 className="text-3xl font-bold">Événements</h1>
              <p className="text-muted-foreground mt-1">
                Gérez tous vos événements et rendez-vous
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/nouveau`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvel événement
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} hover>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Badge variant={getTypeColor(event.type) as any}>
                    {getTypeLabel(event.type)}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/evenements/${event.id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2">{event.title}</h3>
                {event.description && (
                  <p className="text-muted-foreground mb-4 text-sm">{event.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {event.date.toLocaleDateString('fr-CA', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {event.time}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {event.attendees.length} participant{event.attendees.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/evenements/${event.id}`)}
                  >
                    Voir les détails
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {events.length === 0 && (
          <Card>
            <div className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Aucun événement</h3>
              <p className="text-muted-foreground mb-6">
                Vous n'avez créé aucun événement pour le moment.
              </p>
              <Button
                variant="primary"
                onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/nouveau`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un événement
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Container>
  );
}
