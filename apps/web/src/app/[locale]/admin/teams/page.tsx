'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { getErrorMessage, getErrorDetail } from '@/lib/errors';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';

interface Team {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  organization_id: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: string;
  joined_at: string;
}

export default function TeamsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    if (!user?.is_admin) {
      router.push('/dashboard');
      return;
    }

    loadTeams();
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError('');
      const { teamsAPI } = await import('@/lib/api');
      const response = await teamsAPI.list();

      if (response.data) {
        // Backend returns { teams: [...], total: ... }
        const teamsData = response.data.teams || response.data;
        setTeams(
          (Array.isArray(teamsData) ? teamsData : []).map(
            (team: {
              id: string | number;
              name: string;
              description?: string;
              member_count?: number;
              organization_id?: string;
              created_at: string;
              members?: Array<{
                id: number | string;
                user_id: number | string;
                role: string;
                [key: string]: unknown;
              }>;
            }) => ({
              id: String(team.id),
              name: team.name,
              description: team.description,
              member_count: team.members?.length || team.member_count || 0,
              organization_id: team.organization_id || '',
              created_at: team.created_at,
            })
          )
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
          "Erreur de validation des données d'équipe. Veuillez contacter le support. Détails: " +
            (errorDetail || errorMessage)
        );
      } else if (errorDetail?.includes('404') || errorDetail?.includes('not found')) {
        // If API returns 404 or endpoint doesn't exist yet, use empty array
        setTeams([]);
      } else {
        setError(errorDetail || errorMessage || 'Error loading teams');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const { teamsAPI } = await import('@/lib/api');
      const response = await teamsAPI.getMembers(teamId);

      if (response.data) {
        setTeamMembers(
          response.data.map(
            (member: {
              id: string | number;
              user_id: string | number;
              user_name?: string;
              user_email?: string;
              role: string;
              joined_at: string;
            }) => ({
              id: String(member.id),
              user_id: String(member.user_id),
              user_name: member.user_name || 'Unknown User',
              user_email: member.user_email || '',
              role: member.role,
              joined_at: member.joined_at,
            })
          )
        );
      }
    } catch (err: unknown) {
      const { logger } = require('@/lib/logger');
      // If API returns 404 or endpoint doesn't exist yet, use empty array
      if (getErrorDetail(err)?.includes('404') || getErrorDetail(err)?.includes('not found')) {
        setTeamMembers([]);
      } else {
        logger.error('Error loading team members', err as Error, { teamId });
      }
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      setLoading(true);
      const { teamsAPI } = await import('@/lib/api');
      await teamsAPI.create({
        name: newTeamName,
        description: newTeamDescription || undefined,
      });
      await loadTeams();
      setShowCreateModal(false);
      setNewTeamName('');
      setNewTeamDescription('');
    } catch (err: unknown) {
      setError(getErrorDetail(err) || getErrorMessage(err, 'Error creating team'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated() || !user?.is_admin) {
    return null;
  }

  return (
    <div className="py-12">
      <Container>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Gestion des Équipes</h1>
            <p className="text-muted-foreground">Administration des équipes</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>Créer une équipe</Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <Card>
            <div className="py-12 text-center">
              <Loading />
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Teams List */}
            <div className="lg:col-span-1">
              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Équipes</h2>
                  <div className="space-y-2">
                    {teams.map((team) => (
                      <Button
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        variant={selectedTeam?.id === team.id ? 'primary' : 'ghost'}
                        className="w-full text-left justify-start h-auto p-4"
                      >
                        <div className="w-full">
                          <div className="font-medium text-foreground">{team.name}</div>
                          {team.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {team.description}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-2">
                            {team.member_count} membre{team.member_count > 1 ? 's' : ''}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Team Details */}
            <div className="lg:col-span-2">
              {selectedTeam ? (
                <Card>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{selectedTeam.name}</h2>
                        {selectedTeam.description && (
                          <p className="text-muted-foreground mt-2">{selectedTeam.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-error-500 text-error-600 hover:bg-error-50"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Membres</h3>
                        <Button size="sm">Ajouter un membre</Button>
                      </div>
                      <div className="space-y-2">
                        {teamMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-foreground">{member.user_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {member.user_email}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={member.role === 'Manager' ? 'success' : 'default'}>
                                {member.role}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-error-600 hover:text-error-700"
                              >
                                Retirer
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">
                      Sélectionnez une équipe pour voir ses détails
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Create Team Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setNewTeamName('');
            setNewTeamDescription('');
          }}
          title="Créer une nouvelle équipe"
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTeamName('');
                  setNewTeamDescription('');
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleCreateTeam}>Créer</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <Input
                label="Nom de l'équipe *"
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Ex: Équipe Marketing"
                fullWidth
              />
            </div>
            <div>
              <Textarea
                label="Description"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                rows={3}
                placeholder="Description de l'équipe..."
                fullWidth
              />
            </div>
          </div>
        </Modal>
      </Container>
    </div>
  );
}
