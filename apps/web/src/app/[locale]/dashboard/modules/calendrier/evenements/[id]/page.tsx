'use client';

import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Edit, Trash2, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { useState, useEffect } from 'react';

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

export default function EvenementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    // Ici vous récupéreriez l'événement depuis l'API
    // Pour l'instant, on simule avec des données
    setEvent({
      id: eventId,
      title: 'Réunion client - Transaction 123',
      date: new Date(),
      time: '10:00',
      description: 'Discussion sur les conditions de vente et les prochaines étapes de la transaction.',
      location: 'Bureau principal',
      attendees: ['Client A', 'Client B', 'Agent immobilier'],
      type: 'meeting',
    });
  }, [eventId]);

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

  if (!event) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/evenements`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <p className="text-muted-foreground mt-1">
                Détails de l'événement
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/evenements/${eventId}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
                  router.push(`/${locale}/dashboard/modules/calendrier/evenements`);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* Event Details */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <div className="p-6 space-y-6">
              <div>
                <Badge variant={getTypeColor(event.type) as any} className="mb-4">
                  {getTypeLabel(event.type)}
                </Badge>
                <h2 className="text-2xl font-semibold mb-2">{event.title}</h2>
                {event.description && (
                  <p className="text-muted-foreground">{event.description}</p>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Date</div>
                    <div className="text-muted-foreground">
                      {event.date.toLocaleDateString('fr-CA', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Heure</div>
                    <div className="text-muted-foreground">{event.time}</div>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Lieu</div>
                      <div className="text-muted-foreground">{event.location}</div>
                    </div>
                  </div>
                )}

                {event.attendees && event.attendees.length > 0 && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">Participants</div>
                      <div className="text-muted-foreground">
                        <ul className="list-disc list-inside mt-1">
                          {event.attendees.map((attendee, index) => (
                            <li key={index}>{attendee}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Actions Sidebar */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/evenements/${eventId}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier l'événement
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/${locale}/dashboard/modules/calendrier`)}
                >
                  Voir dans le calendrier
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}
