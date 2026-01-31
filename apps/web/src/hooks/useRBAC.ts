/**
 * RBAC Hooks
 * React hooks for managing roles and permissions
 */

import { useState, useEffect, useCallback } from 'react';
import { rbacAPI, type Role, type Permission, type UserPermission } from '@/lib/api/rbac';
import { logger } from '@/lib/logger';

/**
 * Hook to manage roles
 */
export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await rbacAPI.listRoles();
      setRoles(response.roles);
    } catch (err: unknown) {
      logger.error('Failed to load roles', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const createRole = useCallback(
    async (data: { name: string; slug: string; description?: string; is_system?: boolean }) => {
      try {
        const newRole = await rbacAPI.createRole(data);
        await loadRoles();
        return newRole;
      } catch (err: unknown) {
        logger.error('Failed to create role', err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [loadRoles]
  );

  const updateRole = useCallback(
    async (roleId: number, data: { name?: string; description?: string; is_active?: boolean }) => {
      try {
        const updatedRole = await rbacAPI.updateRole(roleId, data);
        await loadRoles();
        return updatedRole;
      } catch (err: unknown) {
        logger.error('Failed to update role', err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [loadRoles]
  );

  const deleteRole = useCallback(
    async (roleId: number) => {
      try {
        await rbacAPI.deleteRole(roleId);
        await loadRoles();
      } catch (err: unknown) {
        logger.error('Failed to delete role', err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [loadRoles]
  );

  return {
    roles,
    loading,
    error,
    loadRoles,
    createRole,
    updateRole,
    deleteRole,
  };
}

/**
 * Hook to manage permissions
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const perms = await rbacAPI.listPermissions();
      setPermissions(perms);
    } catch (err: unknown) {
      logger.error(
        'Failed to load permissions',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const createPermission = useCallback(
    async (data: { resource: string; action: string; description?: string }) => {
      try {
        const newPermission = await rbacAPI.createPermission(data);
        await loadPermissions();
        return newPermission;
      } catch (err: unknown) {
        logger.error(
          'Failed to create permission',
          err instanceof Error ? err : new Error(String(err))
        );
        throw err;
      }
    },
    [loadPermissions]
  );

  return {
    permissions,
    loading,
    error,
    loadPermissions,
    createPermission,
  };
}

/**
 * Hook to manage user permissions
 */
export function useUserPermissions(userId: number) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [customPermissions, setCustomPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const [allPerms, customPerms] = await Promise.all([
        rbacAPI.getUserPermissions(userId),
        rbacAPI.getUserCustomPermissions(userId),
      ]);
      setPermissions(allPerms);
      setCustomPermissions(customPerms);
    } catch (err: unknown) {
      logger.error(
        'Failed to load user permissions',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to load user permissions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const addCustomPermission = useCallback(
    async (permissionId: number) => {
      try {
        const newPermission = await rbacAPI.addCustomPermission(userId, permissionId);
        await loadPermissions();
        return newPermission;
      } catch (err: unknown) {
        logger.error(
          'Failed to add custom permission',
          err instanceof Error ? err : new Error(String(err))
        );
        throw err;
      }
    },
    [userId, loadPermissions]
  );

  const removeCustomPermission = useCallback(
    async (permissionId: number) => {
      try {
        await rbacAPI.removeCustomPermission(userId, permissionId);
        await loadPermissions();
      } catch (err: unknown) {
        logger.error(
          'Failed to remove custom permission',
          err instanceof Error ? err : new Error(String(err))
        );
        throw err;
      }
    },
    [userId, loadPermissions]
  );

  return {
    permissions,
    customPermissions,
    loading,
    error,
    loadPermissions,
    addCustomPermission,
    removeCustomPermission,
  };
}

/**
 * Hook to manage user roles
 */
export function useUserRoles(userId: number) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const userRoles = await rbacAPI.getUserRoles(userId);
      setRoles(userRoles);
    } catch (err: unknown) {
      logger.error(
        'Failed to load user roles',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to load user roles');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const assignRole = useCallback(
    async (roleId: number) => {
      try {
        await rbacAPI.assignRoleToUser(userId, roleId);
        await loadRoles();
      } catch (err: unknown) {
        logger.error('Failed to assign role', err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [userId, loadRoles]
  );

  const removeRole = useCallback(
    async (roleId: number) => {
      try {
        await rbacAPI.removeRoleFromUser(userId, roleId);
        await loadRoles();
      } catch (err: unknown) {
        logger.error('Failed to remove role', err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    },
    [userId, loadRoles]
  );

  const updateRoles = useCallback(
    async (roleIds: number[]) => {
      try {
        const updatedRoles = await rbacAPI.updateUserRoles(userId, roleIds);
        setRoles(updatedRoles);
        return updatedRoles;
      } catch (err: unknown) {
        logger.error(
          'Failed to update user roles',
          err instanceof Error ? err : new Error(String(err))
        );
        throw err;
      }
    },
    [userId]
  );

  return {
    roles,
    loading,
    error,
    loadRoles,
    assignRole,
    removeRole,
    updateRoles,
  };
}

/**
 * Hook to check if current user has a permission
 */
export function usePermissionCheck(permission: string) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await rbacAPI.checkPermission(permission);
      setHasPermission(result.has_permission);
    } catch (err: unknown) {
      logger.error(
        'Failed to check permission',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err instanceof Error ? err.message : 'Failed to check permission');
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  }, [permission]);

  useEffect(() => {
    check();
  }, [check]);

  return {
    hasPermission,
    loading,
    error,
    check,
  };
}
