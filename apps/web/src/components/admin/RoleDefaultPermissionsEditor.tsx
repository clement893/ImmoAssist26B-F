'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Checkbox, Input, Alert, Badge, Loading, Card } from '@/components/ui';
import Tabs, { TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { useRoles, usePermissions } from '@/hooks/useRBAC';
import { useTranslations } from 'next-intl';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { rbacAPI, type Permission } from '@/lib/api/rbac';

interface RoleDefaultPermissionsEditorProps {
  onUpdate?: () => void;
}

export default function RoleDefaultPermissionsEditor({ onUpdate }: RoleDefaultPermissionsEditorProps) {
  const t = useTranslations('admin.Users.RoleDefaultPermissions');
  const { roles, loading: loadingRoles, error: rolesError, loadRoles } = useRoles();
  const { permissions, loading: loadingPermissions, error: permissionsError } = usePermissions();

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Map<number, Set<number>>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'admin' | 'users' | 'roles' | 'permissions'>('admin');

  useEffect(() => {
    if (rolesError) setError(rolesError);
    if (permissionsError) setError(permissionsError);
  }, [rolesError, permissionsError]);

  // Load permissions for each role
  useEffect(() => {
    const loadRolePermissions = async () => {
      if (roles.length === 0) return;

      const newRolePermissions = new Map<number, Set<number>>();
      for (const role of roles) {
        try {
          const perms = await rbacAPI.getRole(role.id);
          newRolePermissions.set(role.id, new Set(perms.permissions.map((p) => p.id)));
        } catch (err: unknown) {
          logger.error(`Failed to load permissions for role ${role.id}`, err instanceof Error ? err : new Error(String(err)));
        }
      }
      setRolePermissions(newRolePermissions);
    };

    loadRolePermissions();
  }, [roles]);

  // Filter permissions by category
  const adminPermissions = useMemo(() => {
    return permissions.filter((p) => p.resource === 'admin');
  }, [permissions]);

  const userPermissions = useMemo(() => {
    return permissions.filter((p) => p.resource === 'users');
  }, [permissions]);

  const rolePermissionsList = useMemo(() => {
    return permissions.filter((p) => p.resource === 'roles');
  }, [permissions]);

  const permissionPermissions = useMemo(() => {
    return permissions.filter((p) => p.resource === 'permissions');
  }, [permissions]);

  const selectedRole = useMemo(() => {
    return roles.find((r) => r.id === selectedRoleId) || null;
  }, [roles, selectedRoleId]);

  const selectedRolePermissionIds = useMemo(() => {
    if (!selectedRoleId) return new Set<number>();
    return rolePermissions.get(selectedRoleId) || new Set<number>();
  }, [selectedRoleId, rolePermissions]);

  const handlePermissionToggle = useCallback(
    (permissionId: number, checked: boolean) => {
      if (!selectedRoleId) return;

      setRolePermissions((prev) => {
        const newMap = new Map(prev);
        const currentPerms = new Set(newMap.get(selectedRoleId) || []);
        if (checked) {
          currentPerms.add(permissionId);
        } else {
          currentPerms.delete(permissionId);
        }
        newMap.set(selectedRoleId, currentPerms);
        return newMap;
      });
    },
    [selectedRoleId]
  );

  const handleSave = async () => {
    if (!selectedRoleId) return;

    setIsSaving(true);
    setError(null);

    try {
      const permissionIds = Array.from(selectedRolePermissionIds);
      await rbacAPI.updateRolePermissions(selectedRoleId, permissionIds);

      // Refresh roles to get updated permissions
      await loadRoles();

      // Reload permissions for this role
      const updatedRole = await rbacAPI.getRole(selectedRoleId);
      setRolePermissions((prev) => {
        const newMap = new Map(prev);
        newMap.set(selectedRoleId, new Set(updatedRole.permissions.map((p) => p.id)));
        return newMap;
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (err: unknown) {
      logger.error('Failed to update role permissions', err instanceof Error ? err : new Error(String(err)));
      setError(getErrorMessage(err, t('errors.saveFailed')));
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = useMemo(() => {
    if (!selectedRoleId || !selectedRole) return false;

    const currentPerms = selectedRolePermissionIds;
    const originalPerms = new Set(selectedRole.permissions.map((p) => p.id));

    if (currentPerms.size !== originalPerms.size) return true;

    for (const permId of currentPerms) {
      if (!originalPerms.has(permId)) return true;
    }

    return false;
  }, [selectedRoleId, selectedRole, selectedRolePermissionIds]);

  // Helper function to render permissions list for a tab
  const renderPermissionsList = useCallback(
    (permsToShow: Permission[]) => {
      const filtered = permsToShow.filter((perm) => {
        const matchesSearch =
          perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
      });

      return (
        <>
          <Input placeholder={t('searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={isSaving} />

          <div className="max-h-96 overflow-y-auto border rounded-md p-4 space-y-3 bg-muted/20">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t('noPermissionsFound')}</p>
            ) : (
              filtered.map((perm) => {
                const isChecked = selectedRolePermissionIds.has(perm.id);
                const isAdminWildcard = perm.name === 'admin:*';

                return (
                  <div key={perm.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={`perm-${perm.id}`}
                      checked={isChecked}
                      onChange={(e) => {
                        const checked = e.target.checked;

                        if (isAdminWildcard && checked) {
                          // If admin:* is checked, uncheck all other permissions
                          setRolePermissions((prev) => {
                            const newMap = new Map(prev);
                            newMap.set(selectedRoleId!, new Set([perm.id]));
                            return newMap;
                          });
                        } else if (isAdminWildcard && !checked) {
                          handlePermissionToggle(perm.id, false);
                        } else if (checked && selectedRolePermissionIds.has(permissions.find((p) => p.name === 'admin:*')?.id || -1)) {
                          // If checking a specific permission but admin:* is active, uncheck admin:*
                          const adminWildcardPerm = permissions.find((p) => p.name === 'admin:*');
                          if (adminWildcardPerm) {
                            handlePermissionToggle(adminWildcardPerm.id, false);
                          }
                          handlePermissionToggle(perm.id, true);
                        } else {
                          handlePermissionToggle(perm.id, checked);
                        }
                      }}
                      disabled={isSaving || (selectedRole?.is_system && selectedRole?.slug === 'superadmin')}
                    />
                    <label
                      htmlFor={`perm-${perm.id}`}
                      className={`text-sm font-medium leading-none flex-1 ${
                        selectedRole?.is_system && selectedRole?.slug === 'superadmin' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-foreground">{perm.name}</span>
                          {perm.description && <p className="text-muted-foreground text-xs mt-1">{perm.description}</p>}
                        </div>
                        {isAdminWildcard && (
                          <Badge variant="info" className="ml-2 text-xs">
                            {t('allPermissions')}
                          </Badge>
                        )}
                        <Badge variant="default" className="ml-2 text-xs">
                          {perm.resource}:{perm.action}
                        </Badge>
                      </div>
                    </label>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!hasChanges || (selectedRole?.is_system && selectedRole?.slug === 'superadmin')}
            >
              {t('saveChangesButton')}
            </Button>
          </div>
        </>
      );
    },
    [searchTerm, selectedRolePermissionIds, selectedRole, selectedRoleId, isSaving, hasChanges, handlePermissionToggle, permissions, t]
  );

  if (loadingRoles || loadingPermissions) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('title')}</h3>
          <p className="text-sm text-muted-foreground mb-6">{t('description')}</p>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">{t('selectRole')}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {roles.map((role) => (
                <Button
                  key={role.id}
                  variant={selectedRoleId === role.id ? 'primary' : 'outline'}
                  onClick={() => setSelectedRoleId(role.id)}
                  className="justify-start"
                  disabled={isSaving}
                >
                  <div className="text-left">
                    <div className="font-medium">{role.name}</div>
                    {role.is_system && (
                      <Badge variant="info" className="text-xs mt-1">
                        {t('systemRole')}
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {selectedRole && (
            <>
              {/* Permission Categories Tabs */}
              <Tabs defaultTab={activeTab} onChange={(tabId) => setActiveTab(tabId as typeof activeTab)}>
                <TabList className="mb-4 flex-nowrap">
                  <Tab value="admin">
                    {t('tabs.admin')} ({adminPermissions.length})
                  </Tab>
                  <Tab value="users">
                    {t('tabs.users')} ({userPermissions.length})
                  </Tab>
                  <Tab value="roles">
                    {t('tabs.roles')} ({rolePermissionsList.length})
                  </Tab>
                  <Tab value="permissions">
                    {t('tabs.permissions')} ({permissionPermissions.length})
                  </Tab>
                </TabList>

                <TabPanels>
                  <TabPanel value="admin" className="space-y-4">
                    {renderPermissionsList(adminPermissions)}
                  </TabPanel>
                  <TabPanel value="users" className="space-y-4">
                    {renderPermissionsList(userPermissions)}
                  </TabPanel>
                  <TabPanel value="roles" className="space-y-4">
                    {renderPermissionsList(rolePermissionsList)}
                  </TabPanel>
                  <TabPanel value="permissions" className="space-y-4">
                    {renderPermissionsList(permissionPermissions)}
                  </TabPanel>
                </TabPanels>
              </Tabs>

              {selectedRole.is_system && selectedRole.slug === 'superadmin' && (
                <Alert variant="info" className="mt-4">
                  {t('superadminWarning')}
                </Alert>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
