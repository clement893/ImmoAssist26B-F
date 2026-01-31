/**
 * Role Permissions Editor Component
 * Editor for managing permissions assigned to a role
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Input from '@/components/ui/Input';
import { type Role, type Permission } from '@/lib/api/rbac';
import { rbacAPI } from '@/lib/api/rbac';
import { logger } from '@/lib/logger';

export interface RolePermissionsEditorProps {
  role: Role;
  onUpdate?: () => void;
}

export default function RolePermissionsEditor({ role, onUpdate }: RolePermissionsEditorProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceFilter, setResourceFilter] = useState<string>('');

  useEffect(() => {
    loadPermissions();
  }, []);

  useEffect(() => {
    // Initialize selected permissions from role
    if (role.permissions) {
      setSelectedPermissionIds(new Set(role.permissions.map((p) => p.id)));
    }
  }, [role]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const allPermissions = await rbacAPI.listPermissions();
      setPermissions(allPermissions);
    } catch (err) {
      logger.error(
        'Failed to load permissions',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des permissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    if (role.is_system) {
      setError('Les permissions des rôles système ne peuvent pas être modifiées');
      return;
    }
    const newSelected = new Set(selectedPermissionIds);
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId);
    } else {
      newSelected.add(permissionId);
    }
    setSelectedPermissionIds(newSelected);
    setError(null);
  };

  const handleSave = async () => {
    if (role.is_system) {
      setError('Les permissions des rôles système ne peuvent pas être modifiées');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await rbacAPI.updateRolePermissions(role.id, Array.from(selectedPermissionIds));
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      logger.error(
        'Failed to update role permissions',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour des permissions'
      );
    } finally {
      setSaving(false);
    }
  };

  const permissionsByResource = useMemo(() => {
    const filtered = permissions.filter((perm) => {
      const matchesSearch =
        searchTerm === '' ||
        perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesResource = resourceFilter === '' || perm.resource === resourceFilter;
      return matchesSearch && matchesResource;
    });
    const grouped = filtered.reduce(
      (acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = [];
        }
        const resourceArray = acc[perm.resource];
        if (resourceArray) {
          resourceArray.push(perm);
        }
        return acc;
      },
      {} as Record<string, Permission[]>
    );
    return grouped;
  }, [permissions, searchTerm, resourceFilter]);

  const resources = useMemo(() => {
    return Array.from(new Set(permissions.map((p) => p.resource))).sort();
  }, [permissions]);

  const hasChanges = useMemo(() => {
    const currentIds = new Set(role.permissions?.map((p) => p.id) || []);
    if (currentIds.size !== selectedPermissionIds.size) return true;
    for (const id of selectedPermissionIds) {
      if (!currentIds.has(id)) return true;
    }
    return false;
  }, [role.permissions, selectedPermissionIds]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {role.is_system && (
        <Alert variant="info">
          Les permissions des rôles système ne peuvent pas être modifiées.
        </Alert>
      )}
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
      {/* Permissions by Resource */}
      <div className="space-y-6">
        {Object.entries(permissionsByResource).map(([resource, perms]) => (
          <div key={resource}>
            <h4 className="text-sm font-semibold text-foreground mb-3 capitalize">{resource}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {perms.map((perm) => {
                const isSelected = selectedPermissionIds.has(perm.id);
                return (
                  <label
                    key={perm.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-muted border-border hover:border-primary/50'
                    } ${role.is_system ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handlePermissionToggle(perm.id)}
                            disabled={role.is_system}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-foreground">{perm.name}</div>
                            {perm.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {perm.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="success" className="ml-2">
                          ✓
                        </Badge>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {Object.keys(permissionsByResource).length === 0 && (
        <div className="text-center py-8 text-muted-foreground">Aucune permission trouvée</div>
      )}
      {/* Save Button */}
      {!role.is_system && (
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      )}
    </div>
  );
}
