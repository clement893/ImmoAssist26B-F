'use client';

import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { ArrowLeft, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function EditEvenementPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const eventId = params.id as string;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'meeting',
    attendees: '',
  });

  useEffect(() => {
    // Ici vous récupéreriez l'événement depuis l'API
    // Pour l'instant, on simule avec des données
    setFormData({
      title: 'Réunion client - Transaction 123',
      description: 'Discussion sur les conditions de vente',
      date: new Date().toISOString().split('T')[0] || new Date().toISOString(),
      time: '10:00',
      location: 'Bureau principal',
      type: 'meeting',
      attendees: 'Client A, Client B, Agent immobilier',
    });
  }, [eventId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ici vous ajouteriez la logique pour mettre à jour l'événement
    console.log('Événement modifié:', formData);
    router.push(`/${locale}/dashboard/modules/calendrier/evenements/${eventId}`);
  };

  const typeOptions = [
    { label: 'Réunion', value: 'meeting' },
    { label: 'Visite', value: 'visit' },
    { label: 'Échéance', value: 'deadline' },
    { label: 'Autre', value: 'other' },
  ];

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/evenements/${eventId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Modifier l'événement</h1>
            <p className="text-muted-foreground mt-1">
              Modifiez les informations de l'événement
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Titre <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Réunion client"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Type <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  options={typeOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Date <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Heure <span className="text-destructive">*</span>
                </label>
                <Input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Lieu</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Bureau principal, 123 Rue Principale"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails de l'événement..."
                  rows={4}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Participants</label>
                <Input
                  value={formData.attendees}
                  onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                  placeholder="Séparez les noms par des virgules"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ex: Client A, Client B, Agent immobilier
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/${locale}/dashboard/modules/calendrier/evenements/${eventId}`)}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary">
                <Save className="w-4 h-4 mr-2" />
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
}
