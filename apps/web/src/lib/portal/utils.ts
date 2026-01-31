/**
 * Portal Utilities
 *
 * Utility functions for portal detection, routing, and permissions
 */

// Portal type definitions
export type PortalType = 'client' | 'employee' | 'admin';

export type PortalRole =
  | 'client'
  | 'client_admin'
  | 'employee'
  | 'sales'
  | 'accounting'
  | 'inventory'
  | 'manager'
  | 'admin';

/**
 * Base User interface from auth store
 * This matches the User interface from apps/web/src/lib/store.ts
 */
export interface BaseUser {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Portal User interface extending base User
 * Includes portal-specific properties like roles and permissions
 */
export interface PortalUser extends BaseUser {
  roles?: PortalRole[];
  permissions?: string[];
  portalType?: PortalType;
}

export interface ClientPortalUser extends PortalUser {
  portalType: 'client';
  clientId?: string;
}

export interface EmployeePortalUser extends PortalUser {
  portalType: 'employee';
  employeeId?: string;
}

export interface PortalPermissionCheck {
  hasPermission: boolean;
  permission: string;
  reason?: string;
}

export interface PortalRouteMetadata {
  portalType: PortalType;
  isPublic: boolean;
  layout: string;
}
import { PORTAL_PATH_PATTERNS, PORTAL_DEFAULT_ROUTES } from '@/lib/constants/portal';

/**
 * Detect portal type from pathname
 */
export function detectPortalType(pathname: string): PortalType | null {
  if (PORTAL_PATH_PATTERNS.CLIENT.test(pathname)) {
    return 'client';
  }
  if (PORTAL_PATH_PATTERNS.EMPLOYEE.test(pathname)) {
    return 'employee';
  }
  if (PORTAL_PATH_PATTERNS.ADMIN.test(pathname)) {
    return 'admin';
  }
  return null;
}

/**
 * Get portal type from user roles
 */
export function getPortalTypeFromUser(user: PortalUser): PortalType {
  if (!user.roles) {
    return 'client'; // Default to client if no roles
  }

  // Check if user has client role
  const hasClientRole = user.roles.some(
    (role: PortalRole) => role === 'client' || role === 'client_admin'
  );

  if (
    hasClientRole &&
    !user.roles.some(
      (role: PortalRole) => role === 'employee' || role === 'admin' || role === 'manager'
    )
  ) {
    return 'client';
  }

  // Check if user has employee/admin role
  const hasEmployeeRole = user.roles.some(
    (role: PortalRole) =>
      role === 'employee' ||
      role === 'sales' ||
      role === 'accounting' ||
      role === 'inventory' ||
      role === 'manager' ||
      role === 'admin'
  );

  if (hasEmployeeRole) {
    return 'employee';
  }

  // Default to client if no specific role
  return 'client';
}

/**
 * Check if user has portal access
 */
export function hasPortalAccess(user: PortalUser, portalType: PortalType): boolean {
  const userPortalType = getPortalTypeFromUser(user);
  return userPortalType === portalType || userPortalType === 'admin';
}

/**
 * Check if user has permission
 */
export function hasPermission(user: PortalUser, permission: string): PortalPermissionCheck {
  if (!user.permissions) {
    return {
      hasPermission: false,
      permission,
    };
  }

  // Admin has all permissions
  if (user.permissions.includes('admin:*')) {
    return {
      hasPermission: true,
      permission,
    };
  }

  // Check exact permission
  if (user.permissions.includes(permission)) {
    return {
      hasPermission: true,
      permission,
    };
  }

  // Check wildcard permissions (e.g., "client:*" matches "client:view:orders")
  const permissionParts = permission.split(':');
  if (permissionParts.length >= 2) {
    const wildcardPermission = `${permissionParts[0]}:*`;
    if (user.permissions.includes(wildcardPermission)) {
      return {
        hasPermission: true,
        permission,
      };
    }
  }

  return {
    hasPermission: false,
    permission,
    reason: `User does not have permission: ${permission}`,
  };
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: PortalUser, permissions: string[]): PortalPermissionCheck {
  for (const permission of permissions) {
    const check = hasPermission(user, permission);
    if (check.hasPermission) {
      return check;
    }
  }

  return {
    hasPermission: false,
    permission: permissions.join(' | '),
    reason: `User does not have any of the required permissions`,
  };
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(user: PortalUser, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(user, permission).hasPermission);
}

/**
 * Check if user has role
 */
export function hasRole(user: PortalUser, role: PortalRole | PortalRole[]): boolean {
  if (!user.roles) {
    return false;
  }
  const rolesToCheck = Array.isArray(role) ? role : [role];
  const userRoles = user.roles;
  return rolesToCheck.some((r) => userRoles.includes(r));
}

/**
 * Get default route for portal type
 */
export function getDefaultRoute(portalType: PortalType): string {
  return (
    PORTAL_DEFAULT_ROUTES[portalType.toUpperCase() as keyof typeof PORTAL_DEFAULT_ROUTES] || '/'
  );
}

/**
 * Get portal route metadata
 */
export function getPortalRouteMetadata(pathname: string): PortalRouteMetadata {
  const portalType = detectPortalType(pathname);

  if (!portalType) {
    return {
      portalType: 'client',
      isPublic: true,
      layout: 'default',
    };
  }

  return {
    portalType,
    layout: portalType === 'client' ? 'client' : portalType === 'employee' ? 'employee' : 'default',
    isPublic: false,
  };
}

/**
 * Check if route requires authentication
 */
export function isRouteProtected(pathname: string): boolean {
  const metadata = getPortalRouteMetadata(pathname);
  return !metadata.isPublic;
}

/**
 * Check if user can access route
 */
export function canAccessRoute(
  user: PortalUser | null,
  pathname: string,
  requiredPermission?: string,
  requiredRole?: PortalRole | PortalRole[]
): boolean {
  if (!user) {
    return !isRouteProtected(pathname);
  }

  const portalType = detectPortalType(pathname);
  if (portalType && !hasPortalAccess(user, portalType)) {
    return false;
  }

  if (requiredPermission && !hasPermission(user, requiredPermission).hasPermission) {
    return false;
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    return false;
  }

  return true;
}

/**
 * Type guard: Check if user is ClientPortalUser
 */
export function isClientPortalUser(user: PortalUser): user is ClientPortalUser {
  return user.portalType === 'client';
}

/**
 * Type guard: Check if user is EmployeePortalUser
 */
export function isEmployeePortalUser(user: PortalUser): user is EmployeePortalUser {
  return user.portalType === 'employee';
}

/**
 * Get user's primary portal
 */
export function getUserPrimaryPortal(user: PortalUser): PortalType {
  return getPortalTypeFromUser(user);
}

/**
 * Check if user should be redirected to portal
 */
export function shouldRedirectToPortal(
  user: PortalUser,
  currentPath: string
): {
  shouldRedirect: boolean;
  redirectTo?: string;
} {
  const userPortal = getUserPrimaryPortal(user);
  const currentPortal = detectPortalType(currentPath);

  // If user is on wrong portal, redirect
  if (currentPortal && currentPortal !== userPortal && userPortal !== 'admin') {
    return {
      shouldRedirect: true,
      redirectTo: getDefaultRoute(userPortal),
    };
  }

  // If user is on root and has portal access, redirect to portal
  if (currentPath === '/' && userPortal !== 'admin') {
    return {
      shouldRedirect: true,
      redirectTo: getDefaultRoute(userPortal),
    };
  }

  return {
    shouldRedirect: false,
  };
}
