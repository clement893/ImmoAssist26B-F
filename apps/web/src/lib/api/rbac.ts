/**
 * RBAC API
 * API client for role-based access control endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

// Types
export interface Permission {
  id: number;
  resource: string;
  action: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions: Permission[];
}

export interface RoleCreate {
  name: string;
  slug: string;
  description?: string;
  is_system?: boolean;
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface RoleListResponse {
  roles: Role[];
  total: number;
}

export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  role: Role;
  created_at: string;
}

export interface UserPermission {
  id: number;
  user_id: number;
  permission_id: number;
  permission: Permission;
  created_at: string;
}

export interface PermissionCheckRequest {
  permission: string;
  require_all?: boolean;
}

export interface PermissionCheckResponse {
  has_permission: boolean;
  user_id: number;
  permission: string;
  roles: string[];
}

export interface UserPermissionCreate {
  permission_id: number;
}

export interface BulkRoleUpdate {
  role_ids: number[];
}

export interface BulkPermissionUpdate {
  permission_ids: number[];
}

/**
 * RBAC API client
 */
export const rbacAPI = {
  // Roles
  /**
   * List all roles with pagination
   */
  listRoles: async (skip = 0, limit = 100): Promise<RoleListResponse> => {
    const response = await apiClient.get<RoleListResponse>('/v1/rbac/roles', {
      params: { skip, limit },
    });
    return extractApiData<RoleListResponse>(response);
  },

  /**
   * Get a role by ID
   */
  getRole: async (roleId: number): Promise<Role> => {
    const response = await apiClient.get<Role>(`/v1/rbac/roles/${roleId}`);
    return extractApiData<Role>(response);
  },

  /**
   * Create a new role
   */
  createRole: async (data: RoleCreate): Promise<Role> => {
    const response = await apiClient.post<Role>('/v1/rbac/roles', data);
    return extractApiData<Role>(response);
  },

  /**
   * Update a role
   */
  updateRole: async (roleId: number, data: RoleUpdate): Promise<Role> => {
    const response = await apiClient.put<Role>(`/v1/rbac/roles/${roleId}`, data);
    return extractApiData<Role>(response);
  },

  /**
   * Delete a role (sets is_active to false)
   */
  deleteRole: async (roleId: number): Promise<void> => {
    await apiClient.delete(`/v1/rbac/roles/${roleId}`);
  },

  // Permissions
  /**
   * List all permissions
   */
  listPermissions: async (): Promise<Permission[]> => {
    const response = await apiClient.get<Permission[]>('/v1/rbac/permissions');
    const data = extractApiData<Permission[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Create a new permission
   */
  createPermission: async (data: {
    resource: string;
    action: string;
    description?: string;
  }): Promise<Permission> => {
    const response = await apiClient.post<Permission>('/v1/rbac/permissions', data);
    return extractApiData<Permission>(response);
  },

  // Role Permissions
  /**
   * Assign a permission to a role
   */
  assignPermissionToRole: async (roleId: number, permissionId: number): Promise<Role> => {
    const response = await apiClient.post<Role>(`/v1/rbac/roles/${roleId}/permissions`, {
      permission_id: permissionId,
    });
    return extractApiData<Role>(response);
  },

  /**
   * Remove a permission from a role
   */
  removePermissionFromRole: async (roleId: number, permissionId: number): Promise<void> => {
    await apiClient.delete(`/v1/rbac/roles/${roleId}/permissions/${permissionId}`);
  },

  /**
   * Update all permissions for a role (bulk operation)
   */
  updateRolePermissions: async (roleId: number, permissionIds: number[]): Promise<Role> => {
    const response = await apiClient.put<Role>(`/v1/rbac/roles/${roleId}/permissions`, {
      permission_ids: permissionIds,
    });
    return extractApiData<Role>(response);
  },

  // User Roles
  /**
   * Get all roles for a user
   */
  getUserRoles: async (userId: number): Promise<Role[]> => {
    const response = await apiClient.get<Role[]>(`/v1/rbac/users/${userId}/roles`);
    const data = extractApiData<Role[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Assign a role to a user
   */
  assignRoleToUser: async (userId: number, roleId: number): Promise<UserRole> => {
    const response = await apiClient.post<UserRole>(`/v1/rbac/users/${userId}/roles`, {
      role_id: roleId,
    });
    return extractApiData<UserRole>(response);
  },

  /**
   * Remove a role from a user
   */
  removeRoleFromUser: async (userId: number, roleId: number): Promise<void> => {
    await apiClient.delete(`/v1/rbac/users/${userId}/roles/${roleId}`);
  },

  /**
   * Update all roles for a user (bulk operation)
   */
  updateUserRoles: async (userId: number, roleIds: number[]): Promise<Role[]> => {
    const response = await apiClient.put<Role[]>(`/v1/rbac/users/${userId}/roles`, {
      role_ids: roleIds,
    });
    const data = extractApiData<Role[]>(response);
    return Array.isArray(data) ? data : [];
  },

  // User Permissions
  /**
   * Get all permissions for a user (from roles + custom permissions)
   */
  getUserPermissions: async (userId: number): Promise<string[]> => {
    const response = await apiClient.get<string[]>(`/v1/rbac/users/${userId}/permissions`);
    const data = extractApiData<string[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get all custom permissions for a user
   */
  getUserCustomPermissions: async (userId: number): Promise<UserPermission[]> => {
    const response = await apiClient.get<UserPermission[]>(
      `/v1/rbac/users/${userId}/permissions/custom`
    );
    const data = extractApiData<UserPermission[]>(response);
    return Array.isArray(data) ? data : [];
  },

  /**
   * Add a custom permission to a user
   */
  addCustomPermission: async (userId: number, permissionId: number): Promise<UserPermission> => {
    const response = await apiClient.post<UserPermission>(
      `/v1/rbac/users/${userId}/permissions/custom`,
      { permission_id: permissionId }
    );
    return extractApiData<UserPermission>(response);
  },

  /**
   * Remove a custom permission from a user
   */
  removeCustomPermission: async (userId: number, permissionId: number): Promise<void> => {
    await apiClient.delete(`/v1/rbac/users/${userId}/permissions/custom/${permissionId}`);
  },

  // Permission Check
  /**
   * Check if current user has a permission
   */
  checkPermission: async (
    permission: string,
    requireAll = false
  ): Promise<PermissionCheckResponse> => {
    const response = await apiClient.post<PermissionCheckResponse>('/v1/rbac/check', {
      permission,
      require_all: requireAll,
    });
    return extractApiData<PermissionCheckResponse>(response);
  },
};
