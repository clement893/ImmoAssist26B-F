'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import { ArrowLeft, Plus, Edit, Trash2, Clock, Calendar } from 'lucide-react';
import { calendarAvailabilityAPI, UserAvailability, UserAvailabilityCreate, UserAvailabilityUpdate, DayOfWeek } from '@/lib/api/calendar-availability';
import { useToast } from '@/lib/toast';

const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' },
];

export default function DisponibilitesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { success, error: showError } = useToast();

  const [availabilities, setAvailabilities] = useState<UserAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<UserAvailability | null>(null);
  const [formData, setFormData] = useState<UserAvailabilityCreate>({
    day_of_week: 'monday',
    start_time: '09:00',
    end_time: '17:00',
    is_active: true,
    label: '',
  });

  useEffect(() => {
    loadAvailabilities();
  }, []);

  const loadAvailabilities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await calendarAvailabilityAPI.getMyAvailabilities();
      setAvailabilities(response.availabilities || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      showError('Impossible de charger les disponibilités');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (availability?: UserAvailability) => {
    if (availability) {
      setEditingAvailability(availability);
      setFormData({
        day_of_week: availability.day_of_week,
        start_time: availability.start_time,
        end_time: availability.end_time,
        is_active: availability.is_active,
        label: availability.label || '',
      });
    } else {
      setEditingAvailability(null);
      setFormData({
        day_of_week: 'monday',
        start_time: '09:00',
        end_time: '17:00',
        is_active: true,
        label: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAvailability(null);
    setFormData({
      day_of_week: 'monday',
      start_time: '09:00',
      end_time: '17:00',
      is_active: true,
      label: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAvailability) {
        const updateData: UserAvailabilityUpdate = {
          day_of_week: formData.day_of_week,
          start_time: formData.start_time,
          end_time: formData.end_time,
          is_active: formData.is_active,
          label: formData.label || undefined,
        };
        await calendarAvailabilityAPI.update(editingAvailability.id, updateData);
        success('Disponibilité mise à jour avec succès');
      } else {
        await calendarAvailabilityAPI.create(formData);
        success('Disponibilité créée avec succès');
      }
      handleCloseModal();
      loadAvailabilities();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      showError(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
      return;
    }
    try {
      await calendarAvailabilityAPI.delete(id);
      success('Disponibilité supprimée avec succès');
      loadAvailabilities();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      showError(errorMessage);
    }
  };

  const toggleActive = async (availability: UserAvailability) => {
    try {
      await calendarAvailabilityAPI.update(availability.id, {
        is_active: !availability.is_active,
      });
      success(`Disponibilité ${!availability.is_active ? 'activée' : 'désactivée'}`);
      loadAvailabilities();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      showError(errorMessage);
    }
  };

  const getAvailabilitiesByDay = (day: DayOfWeek) => {
    return availabilities.filter((av) => av.day_of_week === day);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM format
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
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
              onClick={() => router.push(`/${locale}/dashboard/modules/calendrier`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Gestion des disponibilités</h1>
              <p className="text-muted-foreground mt-2 text-base">
                Définissez vos heures de disponibilité pour chaque jour de la semaine
              </p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une disponibilité
          </Button>
        </div>

        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        {/* Availability by Day */}
        <div className="space-y-6">
          {DAYS_OF_WEEK.map((day) => {
            const dayAvailabilities = getAvailabilitiesByDay(day.value);
            return (
              <Card key={day.value} leftBorder="primary">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {day.label}
                    </h2>
                    <Badge variant={dayAvailabilities.length > 0 ? 'success' : 'default'}>
                      {dayAvailabilities.length} disponibilité{dayAvailabilities.length > 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {dayAvailabilities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Aucune disponibilité définie pour ce jour</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dayAvailabilities.map((availability) => (
                        <div
                          key={availability.id}
                          className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                            availability.is_active
                              ? 'bg-primary/5 border-primary/20'
                              : 'bg-neutral-50 border-neutral-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {formatTime(availability.start_time)} - {formatTime(availability.end_time)}
                              </span>
                            </div>
                            {availability.label && (
                              <Badge variant="default" size="sm">
                                {availability.label}
                              </Badge>
                            )}
                            {!availability.is_active && (
                              <Badge variant="default" size="sm">
                                Inactif
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => toggleActive(availability)}
                            >
                              {availability.is_active ? 'Désactiver' : 'Activer'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleOpenModal(availability)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleDelete(availability.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Modal */}
        <Modal
          isOpen={showModal}
          onClose={handleCloseModal}
          title={editingAvailability ? 'Modifier la disponibilité' : 'Ajouter une disponibilité'}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Jour de la semaine <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value as DayOfWeek })}
                options={DAYS_OF_WEEK.map((d) => ({ label: d.label, value: d.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Heure de début <span className="text-destructive">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Heure de fin <span className="text-destructive">*</span>
                </label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Label (optionnel)</label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Ex: Matin, Après-midi, Soirée"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium">
                Disponibilité active
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" size="sm" onClick={handleCloseModal}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {editingAvailability ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Container>
  );
}
