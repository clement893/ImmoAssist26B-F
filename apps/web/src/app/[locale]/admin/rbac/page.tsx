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
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import RoleForm from '@/components/admin/RoleForm';
import RolePermissionsEditor from '@/components/admin/RolePermissionsEditor';
import { useRoles, usePermissions } from '@/hooks/useRBAC';
import { rbacAPI, type Role, type RoleCreate, type RoleUpdate } from '@/lib/api/rbac';
import { logger } from '@/lib/logger';

export default function RBACPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const {
    roles,
    loading: rolesLoading,
    createRole,
    updateRole,
    deleteRole,
    loadRoles,
  } = useRoles();
  const { loading: permissionsLoading } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    // Check if user has admin permission (superadmin check)
    if (!user?.is_admin) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleCreateRole = async (data: RoleCreate | RoleUpdate) => {
    try {
      setError(null);
      // Type guard to ensure we have RoleCreate (with slug) for creation
      if ('slug' in data) {
        await createRole(data as RoleCreate);
      } else {
        // This shouldn't happen in create mode, but handle it gracefully
        throw new Error('Slug is required for creating a role');
      }
      setShowCreateModal(false);
    } catch (err) {
      logger.error('Failed to create role', err instanceof Error ? err : new Error(String(err)));
      setError(getErrorDetail(err) || getErrorMessage(err, 'Erreur lors de la création du rôle'));
    }
  };

  const handleUpdateRole = async (data: RoleUpdate) => {
    if (!selectedRole) return;

    try {
      setError(null);
      await updateRole(selectedRole.id, data);
      setShowEditModal(false);
      // Reload roles to get updated data
      await loadRoles();
    } catch (err) {
      logger.error('Failed to update role', err instanceof Error ? err : new Error(String(err)));
      setError(
        getErrorDetail(err) || getErrorMessage(err, 'Erreur lors de la modification du rôle')
      );
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      setDeleting(true);
      setError(null);
      await deleteRole(selectedRole.id);
      setShowDeleteModal(false);
      setSelectedRole(null);
    } catch (err) {
      logger.error('Failed to delete role', err instanceof Error ? err : new Error(String(err)));
      setError(
        getErrorDetail(err) || getErrorMessage(err, 'Erreur lors de la suppression du rôle')
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleRoleSelect = async (roleId: number) => {
    try {
      const role = await rbacAPI.getRole(roleId);
      setSelectedRole(role);
    } catch (err) {
      logger.error('Failed to load role', err instanceof Error ? err : new Error(String(err)));
      setError(getErrorDetail(err) || getErrorMessage(err, 'Erreur lors du chargement du rôle'));
    }
  };

  const handlePermissionsUpdate = async () => {
    if (!selectedRole) return;
    // Reload role to get updated permissions
    await handleRoleSelect(selectedRole.id);
  };

  if (!isAuthenticated() || !user?.is_admin) {
    return null;
  }

  const loading = rolesLoading || permissionsLoading;

  return (
    <div className="py-12">
      <Container>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Gestion RBAC</h1>
            <p className="text-muted-foreground">Gestion des rôles et permissions</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>Créer un rôle</Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles List */}
          <div className="lg:col-span-1">
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Rôles</h2>
                {loading ? (
                  <div className="text-center py-8">
                    <Loading />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roles.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Aucun rôle trouvé</p>
                    ) : (
                      roles.map((role) => (
                        <Button
                          key={role.id}
                          onClick={() => handleRoleSelect(role.id)}
                          variant={selectedRole?.id === role.id ? 'primary' : 'ghost'}
                          className="w-full text-left justify-start h-auto p-3"
                        >
                          <div className="w-full">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-foreground">{role.name}</div>
                              {role.is_system && (
                                <Badge variant="info" className="ml-2 text-xs">
                                  Système
                                </Badge>
                              )}
                              {!role.is_active && (
                                <Badge variant="warning" className="ml-2 text-xs">
                                  Inactif
                                </Badge>
                              )}
                            </div>
                            {role.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {role.description}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              {role.permissions?.length || 0} permission
                              {role.permissions?.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </Button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Role Details */}
          <div className="lg:col-span-2">
            {selectedRole ? (
              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-foreground">{selectedRole.name}</h2>
                        {selectedRole.is_system && <Badge variant="info">Système</Badge>}
                        {!selectedRole.is_active && <Badge variant="warning">Inactif</Badge>}
                      </div>
                      {selectedRole.description && (
                        <p className="text-muted-foreground mt-2">{selectedRole.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Slug:{' '}
                        <code className="bg-muted px-1 py-0.5 rounded">{selectedRole.slug}</code>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!selectedRole.is_system && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowEditModal(true)}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteModal(true)}
                          >
                            Supprimer
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Permissions</h3>
                    <RolePermissionsEditor role={selectedRole} onUpdate={handlePermissionsUpdate} />
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Sélectionnez un rôle pour voir ses permissions
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Create Role Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setError(null);
          }}
          title="Créer un nouveau rôle"
          size="md"
        >
          <RoleForm
            onSubmit={handleCreateRole}
            onCancel={() => {
              setShowCreateModal(false);
              setError(null);
            }}
          />
        </Modal>

        {/* Edit Role Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setError(null);
          }}
          title="Modifier le rôle"
          size="md"
        >
          {selectedRole && (
            <RoleForm
              role={selectedRole}
              onSubmit={handleUpdateRole}
              onCancel={() => {
                setShowEditModal(false);
                setError(null);
              }}
            />
          )}
        </Modal>

        {/* Delete Role Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setError(null);
          }}
          title="Supprimer le rôle"
          size="sm"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setError(null);
                }}
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button variant="danger" onClick={handleDeleteRole} disabled={deleting}>
                {deleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </>
          }
        >
          <p className="text-foreground">
            Êtes-vous sûr de vouloir supprimer le rôle <strong>{selectedRole?.name}</strong> ?
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Cette action désactivera le rôle. Les utilisateurs ayant ce rôle perdront leurs
            permissions associées.
          </p>
        </Modal>
      </Container>
    </div>
  );
}
