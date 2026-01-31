/**
 * Team Management Component
 * Manages teams and team members
 */
'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Modal, Alert, Loading, Badge } from '@/components/ui';
import {
  teamsAPI,
  type Team,
  type TeamMember,
  type TeamCreate,
  type TeamUpdate,
  type TeamMemberAdd,
  type TeamMemberUpdate,
} from '@/lib/api/teams';
import { usersAPI } from '@/lib/api';
import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { Plus, Edit, Trash2, Users, Save } from 'lucide-react';

export interface TeamManagementProps {
  className?: string;
}

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface Role {
  id: number;
  name: string;
  slug: string;
}

export default function TeamManagement({ className }: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Team form state
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamForm, setTeamForm] = useState<TeamCreate>({
    name: '',
    slug: '',
    description: '',
  });

  // Member management state
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Add member form state
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [memberForm, setMemberForm] = useState<TeamMemberAdd>({
    user_id: 0,
    role_id: 0,
  });

  // Delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMemberModalOpen, setDeleteMemberModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'team' | 'member';
    id: number;
    teamId?: number;
  } | null>(null);

  useEffect(() => {
    loadTeams();
    loadUsers();
    loadRoles();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await teamsAPI.list();
      // Handle ApiResponse wrapper: { data: T, success: boolean }
      const responseData = response.data || response;
      if (responseData && typeof responseData === 'object') {
        if ('teams' in responseData) {
          setTeams((responseData as { teams: Team[] }).teams);
        } else if (Array.isArray(responseData)) {
          setTeams(responseData);
        } else if (
          'items' in responseData &&
          Array.isArray((responseData as { items?: unknown }).items)
        ) {
          setTeams((responseData as { items: Team[] }).items);
        }
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      // Handle 422 validation errors (settings field issue)
      if (
        errorMessage?.includes('422') ||
        errorMessage?.includes('settings') ||
        errorMessage?.includes('dictionary') ||
        errorMessage?.includes('validation')
      ) {
        setError("Erreur de validation des données d'équipe. Veuillez contacter le support.");
      } else {
        setError(errorMessage || 'Erreur lors du chargement des équipes');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getUsers();
      // Handle paginated response
      if (response.data && typeof response.data === 'object') {
        if ('items' in response.data) {
          const items = (response.data as { items?: unknown }).items;
          if (Array.isArray(items)) {
            setUsers(items as User[]);
          }
        } else if (Array.isArray(response.data)) {
          setUsers(response.data as User[]);
        }
      }
    } catch (err) {
      logger.error('Error loading users', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const loadRoles = async () => {
    try {
      const response = await apiClient.get('/v1/rbac/roles?skip=0&limit=100');
      const responseData = response.data || response;
      if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
        if ('roles' in responseData) {
          setRoles((responseData as { roles: Role[] }).roles);
        }
      } else if (Array.isArray(responseData)) {
        setRoles(responseData as Role[]);
      }
    } catch (err) {
      logger.error('Error loading roles', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const loadTeamMembers = async (teamId: number) => {
    try {
      setMembersLoading(true);
      const response = await teamsAPI.getTeamMembers(teamId);
      // Handle ApiResponse wrapper: { data: T, success: boolean }
      const responseData = response.data || response;
      if (responseData) {
        if (Array.isArray(responseData)) {
          setTeamMembers(responseData);
        } else if (
          typeof responseData === 'object' &&
          'items' in responseData &&
          Array.isArray((responseData as { items?: unknown }).items)
        ) {
          setTeamMembers((responseData as { items: TeamMember[] }).items);
        } else if (
          typeof responseData === 'object' &&
          'members' in responseData &&
          Array.isArray((responseData as { members?: unknown }).members)
        ) {
          setTeamMembers((responseData as { members: TeamMember[] }).members);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors du chargement des membres'));
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCreateTeam = () => {
    setEditingTeam(null);
    setTeamForm({ name: '', slug: '', description: '' });
    setTeamModalOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      slug: team.slug,
      description: team.description || '',
    });
    setTeamModalOpen(true);
  };

  const handleSaveTeam = async () => {
    try {
      setError(null);
      setSuccess(null);
      // Generate slug from name if not provided
      const slug =
        teamForm.slug ||
        teamForm.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
      if (editingTeam) {
        const updateData: TeamUpdate = {
          name: teamForm.name,
          description: teamForm.description || undefined,
        };
        await teamsAPI.updateTeam(editingTeam.id, updateData);
        setSuccess('Équipe mise à jour avec succès');
      } else {
        await teamsAPI.create({ ...teamForm, slug });
        setSuccess('Équipe créée avec succès');
      }
      setTeamModalOpen(false);
      await loadTeams();
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors de la sauvegarde de l'équipe"));
    }
  };

  const handleDeleteTeam = async () => {
    if (!itemToDelete || itemToDelete.type !== 'team') return;
    try {
      setError(null);
      await teamsAPI.deleteTeam(itemToDelete.id);
      setSuccess('Équipe supprimée avec succès');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      await loadTeams();
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors de la suppression de l'équipe"));
    }
  };

  const handleViewMembers = async (team: Team) => {
    setSelectedTeam(team);
    await loadTeamMembers(team.id);
    setMembersModalOpen(true);
  };

  const handleAddMember = () => {
    if (!selectedTeam) return;
    setMemberForm({ user_id: 0, role_id: 0 });
    setAddMemberModalOpen(true);
  };

  const handleSaveMember = async () => {
    if (!selectedTeam || !memberForm.user_id || !memberForm.role_id) {
      setError('Veuillez sélectionner un utilisateur et un rôle');
      return;
    }
    try {
      setError(null);
      await teamsAPI.addTeamMember(selectedTeam.id, memberForm);
      setSuccess('Membre ajouté avec succès');
      setAddMemberModalOpen(false);
      await loadTeamMembers(selectedTeam.id);
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors de l'ajout du membre"));
    }
  };

  const handleUpdateMemberRole = async (member: TeamMember, roleId: number) => {
    if (!selectedTeam) return;
    try {
      setError(null);
      const updateData: TeamMemberUpdate = { role_id: roleId };
      await teamsAPI.updateTeamMember(selectedTeam.id, member.id, updateData);
      setSuccess('Rôle du membre mis à jour avec succès');
      await loadTeamMembers(selectedTeam.id);
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors de la mise à jour du rôle'));
    }
  };

  const handleDeleteMember = async () => {
    if (!itemToDelete || itemToDelete.type !== 'member' || !itemToDelete.teamId) return;
    try {
      setError(null);
      await teamsAPI.removeTeamMember(itemToDelete.teamId, itemToDelete.id);
      setSuccess('Membre retiré avec succès');
      setDeleteMemberModalOpen(false);
      setItemToDelete(null);
      if (selectedTeam) {
        await loadTeamMembers(selectedTeam.id);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors de la suppression du membre'));
    }
  };

  const getUserName = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return `User #${userId}`;
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  };

  if (loading) {
    return (
      <Card className={className}>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </Card>
    );
  }

  return (
    <div className={className}>
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Gestion des équipes</h2>
              <p className="text-muted-foreground">Gérez vos équipes et leurs membres</p>
            </div>
            <Button onClick={handleCreateTeam} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Créer une équipe
            </Button>
          </div>
          {teams.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Aucune équipe pour le moment</p>
              <Button onClick={handleCreateTeam} variant="primary">
                Créer votre première équipe
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <Card key={team.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{team.name}</h3>
                        {team.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="warning">Inactive</Badge>
                        )}
                      </div>
                      {team.description && (
                        <p className="text-muted-foreground mb-2">{team.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Slug: {team.slug}</span>
                        <span>Membres: {team.members?.length || 0}</span>
                        {team.owner && <span>Propriétaire: {getUserName(team.owner_id)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleViewMembers(team)}>
                        <Users className="w-4 h-4 mr-1" />
                        Membres
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEditTeam(team)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setItemToDelete({ type: 'team', id: team.id });
                          setDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Team Form Modal */}
      <Modal
        isOpen={teamModalOpen}
        onClose={() => setTeamModalOpen(false)}
        title={editingTeam ? "Modifier l'équipe" : 'Créer une équipe'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTeamModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSaveTeam}>
              <Save className="w-4 h-4 mr-2" />
              {editingTeam ? 'Enregistrer' : 'Créer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nom de l'équipe"
            value={teamForm.name}
            onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
            required
            placeholder="Ex: Équipe Marketing"
          />
          <Input
            label="Slug"
            value={teamForm.slug}
            onChange={(e) => setTeamForm({ ...teamForm, slug: e.target.value })}
            placeholder="Ex: equipe-marketing (généré automatiquement si vide)"
            helperText="Identifiant unique pour l'équipe (généré automatiquement à partir du nom si vide)"
          />
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              rows={3}
              value={teamForm.description}
              onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
              placeholder="Description de l'équipe..."
            />
          </div>
        </div>
      </Modal>

      {/* Members Modal */}
      <Modal
        isOpen={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
        title={`Membres de l'équipe: ${selectedTeam?.name || ''}`}
        size="lg"
        footer={
          <Button variant="primary" onClick={handleAddMember}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un membre
          </Button>
        }
      >
        {membersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loading />
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Aucun membre dans cette équipe</p>
            <Button onClick={handleAddMember} variant="primary">
              Ajouter le premier membre
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {member.user ? getUserName(member.user_id) : `User #${member.user_id}`}
                  </div>
                  <div className="text-sm text-muted-foreground">{member.user?.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={member.role_id.toString()}
                    onChange={(e) => handleUpdateMemberRole(member, parseInt(e.target.value))}
                    className="w-48"
                    options={roles.map((role) => ({
                      label: role.name,
                      value: role.id.toString(),
                    }))}
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setItemToDelete({ type: 'member', id: member.id, teamId: selectedTeam?.id });
                      setDeleteMemberModalOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        title="Ajouter un membre"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddMemberModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSaveMember}>
              <Save className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Utilisateur"
            value={memberForm.user_id.toString()}
            onChange={(e) => setMemberForm({ ...memberForm, user_id: parseInt(e.target.value) })}
            required
            placeholder="Sélectionner un utilisateur"
            options={[
              { label: 'Sélectionner un utilisateur', value: '0' },
              ...users.map((user) => ({
                label: `${getUserName(user.id)} (${user.email})`,
                value: user.id.toString(),
              })),
            ]}
          />
          <Select
            label="Rôle"
            value={memberForm.role_id.toString()}
            onChange={(e) => setMemberForm({ ...memberForm, role_id: parseInt(e.target.value) })}
            required
            placeholder="Sélectionner un rôle"
            options={[
              { label: 'Sélectionner un rôle', value: '0' },
              ...roles.map((role) => ({
                label: role.name,
                value: role.id.toString(),
              })),
            ]}
          />
        </div>
      </Modal>

      {/* Delete Team Confirmation */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        title="Supprimer l'équipe"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteModalOpen(false);
                setItemToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteTeam}>
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-muted-foreground">
          Êtes-vous sûr de vouloir supprimer cette équipe ? Cette action est irréversible.
        </p>
      </Modal>

      {/* Delete Member Confirmation */}
      <Modal
        isOpen={deleteMemberModalOpen}
        onClose={() => {
          setDeleteMemberModalOpen(false);
          setItemToDelete(null);
        }}
        title="Retirer le membre"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteMemberModalOpen(false);
                setItemToDelete(null);
              }}
            >
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteMember}>
              <Trash2 className="w-4 h-4 mr-2" />
              Retirer
            </Button>
          </>
        }
      >
        <p className="text-muted-foreground">
          Êtes-vous sûr de vouloir retirer ce membre de l'équipe ?
        </p>
      </Modal>
    </div>
  );
}
