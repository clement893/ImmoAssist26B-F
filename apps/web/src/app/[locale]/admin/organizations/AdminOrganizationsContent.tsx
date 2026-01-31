'use client';

import { useEffect, useState, useMemo } from 'react';
import { PageHeader, PageContainer } from '@/components/layout';
import { getErrorMessage, getErrorDetail } from '@/lib/errors';
import { Button, Card, Badge, Alert, Input, Loading, Modal, DataTable } from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { Edit2, Trash2, Eye, Plus } from 'lucide-react';
import OrganizationSettings, {
  type OrganizationSettingsData,
} from '@/components/settings/OrganizationSettings';
import type { TeamSettings } from '@/lib/api/teams';

interface Team extends Record<string, unknown> {
  id: number | string;
  name: string;
  slug: string;
  description?: string;
  member_count?: number;
  members?: Array<{ id: number; user_id: number }>;
  organization_id?: string;
  created_at: string;
  updated_at?: string;
  settings?: TeamSettings | string;
  owner?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export default function AdminOrganizationsContent() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState<OrganizationSettingsData>({
    name: '',
    slug: '',
    email: '',
    phone: '',
    website: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    timezone: 'UTC',
    locale: 'fr-FR',
  });

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const { teamsAPI } = await import('@/lib/api/teams');
      const response = await teamsAPI.list();

      if (response.data) {
        const teamsData = response.data.teams || response.data;
        interface BackendTeam {
          id: number | string;
          name: string;
          slug?: string;
          description?: string;
          member_count?: number;
          members?: Array<{ id: number; user_id: number }>;
          organization_id?: string;
          created_at: string;
          updated_at?: string;
          settings?: TeamSettings | string;
          owner?: {
            id: number;
            email: string;
            first_name?: string;
            last_name?: string;
          };
        }

        setTeams(
          (Array.isArray(teamsData) ? teamsData : []).map((team: BackendTeam) => {
            let settings: TeamSettings | undefined;
            if (team.settings) {
              if (typeof team.settings === 'string') {
                try {
                  settings = JSON.parse(team.settings);
                } catch (e) {
                  // Ignore parse errors
                }
              } else {
                settings = team.settings as TeamSettings;
              }
            }

            return {
              id: team.id,
              name: team.name,
              slug: team.slug || '',
              description: team.description,
              member_count: team.member_count || (team.members ? team.members.length : 0),
              organization_id: team.organization_id || '',
              created_at: team.created_at,
              updated_at: team.updated_at,
              settings: settings,
              owner: team.owner,
            };
          })
        );
      }
    } catch (err: unknown) {
      const errorDetail = getErrorDetail(err);
      const errorMessage = getErrorMessage(err);

      // Handle 422 validation errors (settings field issue)
      if (
        errorMessage?.includes('422') ||
        errorMessage?.includes('settings') ||
        errorMessage?.includes('dictionary') ||
        errorMessage?.includes('validation')
      ) {
        setError(
          "Erreur de validation des données d'organisation. Veuillez contacter le support. Détails: " +
            (errorDetail || errorMessage)
        );
      } else if (errorDetail?.includes('404') || errorDetail?.includes('not found')) {
        setTeams([]);
      } else {
        setError(errorDetail || errorMessage || 'Erreur lors du chargement des organisations');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCreateTeam = async (data: OrganizationSettingsData) => {
    const slug = data.slug || generateSlug(data.name);

    try {
      setLoading(true);
      setError(null);

      if (!slug) {
        setError('Le nom doit contenir au moins un caractère alphanumérique');
        setLoading(false);
        return;
      }

      const { teamsAPI } = await import('@/lib/api/teams');

      // Prepare settings object
      const settings: Record<
        string,
        | string
        | undefined
        | {
            line1: string;
            line2?: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
          }
      > = {};
      if (data.email) settings.email = data.email;
      if (data.phone) settings.phone = data.phone;
      if (data.website) settings.website = data.website;
      if (data.address?.line1)
        settings.address = {
          line1: data.address.line1,
          line2: data.address.line2,
          city: data.address.city,
          state: data.address.state,
          postalCode: data.address.postalCode,
          country: data.address.country,
        };
      if (data.timezone) settings.timezone = data.timezone;
      if (data.locale) settings.locale = data.locale;

      await teamsAPI.create({
        name: data.name.trim(),
        slug: slug,
        description: data.description || undefined,
        settings:
          Object.keys(settings).length > 0 ? (settings as unknown as TeamSettings) : undefined,
      });

      // Always refresh the list to ensure UI is in sync with database
      await loadTeams();

      // Close modal and reset form on success
      setShowCreateModal(false);
      resetForm();
      setError(null);
    } catch (err: unknown) {
      const errorDetail = getErrorDetail(err);
      const errorMessage = getErrorMessage(err, "Erreur lors de la création de l'organisation");

      // Always refresh the list to show what's actually in the database
      // This helps if the team was created in a previous attempt
      // Note: Backend now returns existing team if it belongs to same user, so this shouldn't error in that case
      await loadTeams();

      if (errorDetail?.includes('slug') || errorDetail?.includes('already exists')) {
        const errorSlug = data.slug || generateSlug(data.name);
        setError(
          `Une organisation avec le slug "${errorSlug}" existe déjà dans la base de données. Si vous êtes le propriétaire, elle devrait apparaître dans la liste ci-dessous après rafraîchissement. Sinon, veuillez choisir un autre nom.`
        );
      } else {
        setError(errorDetail || errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async (data: OrganizationSettingsData) => {
    if (!editingTeam) return;

    try {
      setLoading(true);
      setError(null);

      const { teamsAPI } = await import('@/lib/api/teams');

      // Prepare settings object
      const settings: Record<
        string,
        | string
        | undefined
        | {
            line1: string;
            line2?: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
          }
      > = {};
      if (data.email) settings.email = data.email;
      if (data.phone) settings.phone = data.phone;
      if (data.website) settings.website = data.website;
      if (data.address?.line1)
        settings.address = {
          line1: data.address.line1,
          line2: data.address.line2,
          city: data.address.city,
          state: data.address.state,
          postalCode: data.address.postalCode,
          country: data.address.country,
        };
      if (data.timezone) settings.timezone = data.timezone;
      if (data.locale) settings.locale = data.locale;

      await teamsAPI.updateTeam(Number(editingTeam.id), {
        name: data.name.trim(),
        description: data.description || undefined,
        settings:
          Object.keys(settings).length > 0 ? (settings as unknown as TeamSettings) : undefined,
      });

      await loadTeams();
      setShowEditModal(false);
      setEditingTeam(null);
      resetForm();
    } catch (err: unknown) {
      const errorDetail = getErrorDetail(err);
      const errorMessage = getErrorMessage(err, "Erreur lors de la mise à jour de l'organisation");
      setError(errorDetail || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (team: Team) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'organisation "${team.name}" ?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { teamsAPI } = await import('@/lib/api/teams');
      await teamsAPI.deleteTeam(Number(team.id));
      await loadTeams();
    } catch (err: unknown) {
      const errorDetail = getErrorDetail(err);
      const errorMessage = getErrorMessage(err, "Erreur lors de la suppression de l'organisation");
      setError(errorDetail || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      email: '',
      phone: '',
      website: '',
      address: {
        line1: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      timezone: 'UTC',
      locale: 'fr-FR',
    });
  };

  const openEditModal = (team: Team) => {
    const settings =
      typeof team.settings === 'string'
        ? (() => {
            try {
              return JSON.parse(team.settings);
            } catch {
              return null;
            }
          })()
        : team.settings;

    setEditingTeam(team);
    setFormData({
      name: team.name,
      slug: team.slug,
      description: team.description || '',
      email: settings?.email || '',
      phone: settings?.phone || '',
      website: settings?.website || '',
      address: settings?.address || {
        line1: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      timezone: settings?.timezone || 'UTC',
      locale: settings?.locale || 'fr-FR',
    });
    setShowEditModal(true);
  };

  const openViewModal = (team: Team) => {
    setSelectedTeam(team);
    setShowViewModal(true);
  };

  const filteredTeams = useMemo(
    () =>
      teams.filter((team) => {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch = team.name.toLowerCase().includes(searchLower);
        const descMatch = team.description?.toLowerCase().includes(searchLower);
        let settingsMatch = false;
        if (typeof team.settings === 'object' && team.settings) {
          const email = team.settings.email;
          if (typeof email === 'string') {
            settingsMatch = email.toLowerCase().includes(searchLower);
          } else if (email != null) {
            // Handle number or boolean by converting to string
            settingsMatch = String(email).toLowerCase().includes(searchLower);
          }
        } else if (typeof team.settings === 'string') {
          settingsMatch = team.settings.toLowerCase().includes(searchLower);
        }
        return nameMatch || descMatch || settingsMatch;
      }),
    [teams, searchTerm]
  );

  const columns: Column<Team>[] = useMemo(
    () => [
      {
        key: 'name',
        label: 'Nom',
        render: (_value, team) => {
          const settings =
            typeof team.settings === 'string'
              ? (() => {
                  try {
                    return JSON.parse(team.settings);
                  } catch {
                    return null;
                  }
                })()
              : team.settings;

          return (
            <div>
              <div className="font-medium text-foreground">{team.name}</div>
              {team.description && (
                <div className="text-sm text-muted-foreground mt-1">{team.description}</div>
              )}
              {settings?.email && (
                <div className="text-xs text-muted-foreground mt-1">📧 {settings.email}</div>
              )}
              {settings?.phone && (
                <div className="text-xs text-muted-foreground">📞 {settings.phone}</div>
              )}
              {settings?.website && (
                <div className="text-xs text-muted-foreground">
                  🌐{' '}
                  <a
                    href={settings.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {settings.website}
                  </a>
                </div>
              )}
              {settings?.address && (
                <div className="text-xs text-muted-foreground mt-1">
                  📍 {settings.address.line1}, {settings.address.city}, {settings.address.country}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: 'owner',
        label: 'Propriétaire',
        render: (_value, team) => (
          <div className="text-sm">
            {team.owner ? (
              <div>
                <div className="font-medium">{team.owner.email}</div>
                {(team.owner.first_name || team.owner.last_name) && (
                  <div className="text-muted-foreground">
                    {[team.owner.first_name, team.owner.last_name].filter(Boolean).join(' ')}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        ),
      },
      {
        key: 'member_count',
        label: 'Membres',
        render: (_value, team) => <Badge variant="default">{team.member_count || 0}</Badge>,
      },
      {
        key: 'created_at',
        label: 'Créé le',
        render: (_value, team) => (
          <span className="text-sm text-muted-foreground">
            {new Date(team.created_at).toLocaleDateString('fr-FR')}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (_value, team) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openViewModal(team)}
              title="Voir les détails"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditModal(team)}
              title="Modifier"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteTeam(team)}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <PageContainer>
      <PageHeader
        title="Organisations"
        description="Gérer les organisations et leurs paramètres"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Administration', href: '/admin' },
          { label: 'Organisations' },
        ]}
      />

      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="mt-6 flex justify-between items-center mb-4">
        <Input
          type="text"
          placeholder="Rechercher une organisation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer une organisation
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : (
        <Card>
          <DataTable<Team>
            data={filteredTeams}
            columns={columns}
            emptyMessage="Aucune organisation trouvée"
          />
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Créer une nouvelle organisation"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={() => handleCreateTeam(formData)}
              disabled={loading || !formData.name.trim()}
            >
              Créer
            </Button>
          </>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <OrganizationSettings
            organization={{
              id: '',
              name: formData.name,
              slug: formData.slug,
              description: formData.description,
              email: formData.email,
              phone: formData.phone,
              website: formData.website,
              address: formData.address,
              timezone: formData.timezone,
              locale: formData.locale,
            }}
            onChange={(data) => {
              setFormData(data);
            }}
            onSave={async (data) => {
              setFormData(data);
              // Prevent default form submission
            }}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTeam(null);
          resetForm();
        }}
        title={`Modifier l'organisation: ${editingTeam?.name || ''}`}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingTeam(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={() => handleUpdateTeam(formData)}
              disabled={loading || !formData.name.trim()}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {editingTeam && (
            <OrganizationSettings
              organization={{
                id: String(editingTeam.id),
                name: formData.name,
                slug: editingTeam.slug,
                description: formData.description,
                email: formData.email,
                phone: formData.phone,
                website: formData.website,
                address: formData.address,
                timezone: formData.timezone,
                locale: formData.locale,
              }}
              onChange={(data) => {
                setFormData(data);
              }}
              onSave={async (data) => {
                setFormData(data);
                // Prevent default form submission
              }}
            />
          )}
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTeam(null);
        }}
        title={`Détails de l'organisation: ${selectedTeam?.name || ''}`}
        size="lg"
        footer={
          <Button
            variant="outline"
            onClick={() => {
              setShowViewModal(false);
              setSelectedTeam(null);
            }}
          >
            Fermer
          </Button>
        }
      >
        {selectedTeam && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nom</label>
                <p className="text-sm font-medium">{selectedTeam.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Slug</label>
                <p className="text-sm font-mono">{selectedTeam.slug}</p>
              </div>
              {selectedTeam.description && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{selectedTeam.description}</p>
                </div>
              )}
            </div>

            {(() => {
              const settings =
                typeof selectedTeam.settings === 'string'
                  ? (() => {
                      try {
                        return JSON.parse(selectedTeam.settings);
                      } catch {
                        return null;
                      }
                    })()
                  : selectedTeam.settings;

              if (!settings) return null;

              return (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold">Informations de contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {settings.email && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-sm">{settings.email}</p>
                      </div>
                    )}
                    {settings.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Téléphone
                        </label>
                        <p className="text-sm">{settings.phone}</p>
                      </div>
                    )}
                    {settings.website && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Site web
                        </label>
                        <p className="text-sm">
                          <a
                            href={settings.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {settings.website}
                          </a>
                        </p>
                      </div>
                    )}
                    {settings.address && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                        <p className="text-sm">
                          {settings.address.line1}
                          {settings.address.line2 && `, ${settings.address.line2}`}
                          <br />
                          {settings.address.city}, {settings.address.state}{' '}
                          {settings.address.postalCode}
                          <br />
                          {settings.address.country}
                        </p>
                      </div>
                    )}
                    {settings.timezone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Fuseau horaire
                        </label>
                        <p className="text-sm">{settings.timezone}</p>
                      </div>
                    )}
                    {settings.locale && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Locale</label>
                        <p className="text-sm">{settings.locale}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Propriétaire</h3>
              {selectedTeam.owner ? (
                <div>
                  <p className="text-sm font-medium">{selectedTeam.owner.email}</p>
                  {(selectedTeam.owner.first_name || selectedTeam.owner.last_name) && (
                    <p className="text-sm text-muted-foreground">
                      {[selectedTeam.owner.first_name, selectedTeam.owner.last_name]
                        .filter(Boolean)
                        .join(' ')}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Membres</label>
                  <p className="text-sm">
                    <Badge>{selectedTeam.member_count || 0}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Créé le</label>
                  <p className="text-sm">
                    {new Date(selectedTeam.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
