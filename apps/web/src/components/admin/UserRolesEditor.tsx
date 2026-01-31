/**
 * User Roles Editor Component
 * Editor for managing roles assigned to a user
 */
'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import { useUserRoles, useRoles } from '@/hooks/useRBAC';
import { logger } from '@/lib/logger';

export interface UserRolesEditorProps {
  userId: number;
  onUpdate?: () => void;
}

export default function UserRolesEditor({ userId, onUpdate }: UserRolesEditorProps) {
  const { roles: userRoles, loading: userRolesLoading, updateRoles } = useUserRoles(userId);
  const { roles: allRoles, loading: allRolesLoading } = useRoles();
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize selected roles from user roles
    if (userRoles) {
      setSelectedRoleIds(new Set(userRoles.map((r) => r.id)));
    }
  }, [userRoles]);

  const handleRoleToggle = (roleId: number) => {
    const newSelected = new Set(selectedRoleIds);
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId);
    } else {
      newSelected.add(roleId);
    }
    setSelectedRoleIds(newSelected);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await updateRoles(Array.from(selectedRoleIds));
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      logger.error(
        'Failed to update user roles',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour des rôles');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!userRoles) return selectedRoleIds.size > 0;
    const currentIds = new Set(userRoles.map((r) => r.id));
    if (currentIds.size !== selectedRoleIds.size) return true;
    for (const id of selectedRoleIds) {
      if (!currentIds.has(id)) return true;
    }
    return false;
  };

  if (userRolesLoading || allRolesLoading) {
    return (
      <div className="text-center py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="space-y-2">
        {allRoles.map((role) => {
          const isSelected = selectedRoleIds.has(role.id);
          return (
            <label
              key={role.id}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors flex items-center justify-between ${
                isSelected
                  ? 'bg-primary/10 border-primary'
                  : 'bg-muted border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleRoleToggle(role.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-foreground">{role.name}</div>
                    {role.is_system && (
                      <Badge variant="info" className="text-xs">
                        Système
                      </Badge>
                    )}
                    {!role.is_active && (
                      <Badge variant="warning" className="text-xs">
                        Inactif
                      </Badge>
                    )}
                  </div>
                  {role.description && (
                    <div className="text-sm text-muted-foreground mt-1">{role.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {role.permissions?.length || 0} permission
                    {role.permissions?.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              {isSelected && (
                <Badge variant="success" className="ml-2">
                  ✓
                </Badge>
              )}
            </label>
          );
        })}
      </div>
      {allRoles.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">Aucun rôle disponible</div>
      )}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving || !hasChanges()}>
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </div>
  );
}
