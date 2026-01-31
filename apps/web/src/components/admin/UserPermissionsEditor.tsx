/**
 * User Permissions Editor Component
 * Editor for managing custom permissions assigned to a user
 */
'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Input from '@/components/ui/Input';
import { useUserPermissions, usePermissions } from '@/hooks/useRBAC';
import { logger } from '@/lib/logger';

export interface UserPermissionsEditorProps {
  userId: number;
  onUpdate?: () => void;
}

export default function UserPermissionsEditor({ userId, onUpdate }: UserPermissionsEditorProps) {
  const {
    permissions: allPermissions,
    customPermissions,
    loading: permissionsLoading,
    addCustomPermission,
    removeCustomPermission,
    loadPermissions,
  } = useUserPermissions(userId);

  const { permissions: availablePermissions, loading: availableLoading } = usePermissions();

  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, [userId, loadPermissions]);

  const handleAddPermission = async (permissionId: number) => {
    try {
      setAdding(true);
      setError(null);
      await addCustomPermission(permissionId);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      logger.error(
        'Failed to add custom permission',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout de la permission");
    } finally {
      setAdding(false);
    }
  };

  const handleRemovePermission = async (permissionId: number) => {
    try {
      setError(null);
      await removeCustomPermission(permissionId);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      logger.error(
        'Failed to remove custom permission',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la suppression de la permission'
      );
    }
  };

  const customPermissionIds = new Set(customPermissions.map((p) => p.permission_id));

  // Create a set of permission names from roles (allPermissions contains permission names as strings)
  const rolePermissionNames = new Set(allPermissions);

  const filteredPermissions = availablePermissions.filter((perm) => {
    const matchesSearch =
      searchTerm === '' ||
      perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResource = resourceFilter === '' || perm.resource === resourceFilter;

    // Show permissions that are:
    // 1. Already custom (to allow removal)
    // 2. Not already granted via roles (to allow adding as custom)
    const isCustom = customPermissionIds.has(perm.id);
    const isFromRole = rolePermissionNames.has(perm.name);
    return matchesSearch && matchesResource && (isCustom || !isFromRole);
  });

  const resources = Array.from(new Set(availablePermissions.map((p) => p.resource))).sort();

  if (permissionsLoading || availableLoading) {
    return (
      <div className="text-center py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {/* Info about permissions */}
      <Alert variant="info">
        <p className="text-sm">
          Les permissions custom permettent d'ajouter des permissions spécifiques à cet utilisateur
          au-delà de celles de ses rôles. Les permissions déjà accordées via les rôles ne sont pas
          affichées ici.
        </p>
      </Alert>
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une permission..."
            fullWidth
          />
        </div>
        <div className="w-48">
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
          >
            <option value="">Toutes les ressources</option>
            {resources.map((resource) => (
              <option key={resource} value={resource}>
                {resource}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Custom Permissions */}
      {customPermissions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Permissions Custom Actuelles
          </h4>
          <div className="space-y-2">
            {customPermissions.map((userPerm) => {
              const perm = availablePermissions.find((p) => p.id === userPerm.permission_id);
              if (!perm) return null;
              return (
                <div
                  key={userPerm.id}
                  className="p-3 rounded-lg border-2 bg-primary/10 border-primary flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-foreground">{perm.name}</div>
                    {perm.description && (
                      <div className="text-sm text-muted-foreground mt-1">{perm.description}</div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemovePermission(perm.id)}
                    disabled={adding}
                  >
                    Retirer
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Available Permissions */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Ajouter une Permission Custom
        </h4>
        {filteredPermissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune permission disponible à ajouter
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPermissions.map((perm) => {
              const isCustom = customPermissionIds.has(perm.id);
              return (
                <div
                  key={perm.id}
                  className={`p-3 rounded-lg border-2 flex items-center justify-between ${
                    isCustom ? 'bg-primary/10 border-primary' : 'bg-muted border-border'
                  }`}
                >
                  <div>
                    <div className="font-medium text-foreground">{perm.name}</div>
                    {perm.description && (
                      <div className="text-sm text-muted-foreground mt-1">{perm.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1 capitalize">
                      {perm.resource} • {perm.action}
                    </div>
                  </div>
                  {isCustom ? (
                    <Badge variant="success">Déjà ajoutée</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddPermission(perm.id)}
                      disabled={adding}
                    >
                      Ajouter
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
