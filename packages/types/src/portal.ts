/**
 * Portal Types
 *
 * Type definitions for Client Portal and Employee/ERP Portal
 */

/**
 * Portal type enumeration
 */
export type PortalType = "client" | "employee" | "admin";

/**
 * Portal user roles
 */
export type ClientRole = "client" | "client_admin";
export type EmployeeRole =
  | "employee"
  | "sales"
  | "accounting"
  | "inventory"
  | "manager"
  | "admin";
export type PortalRole = ClientRole | EmployeeRole;

/**
 * Portal user interface
 */
export interface PortalUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  portalType: PortalType;
  roles: PortalRole[];
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Client portal user (extends PortalUser)
 */
export interface ClientPortalUser extends PortalUser {
  portalType: "client";
  roles: ClientRole[];
  clientId?: string;
  companyName?: string;
}

/**
 * Employee portal user (extends PortalUser)
 */
export interface EmployeePortalUser extends PortalUser {
  portalType: "employee";
  roles: EmployeeRole[];
  department?: "sales" | "accounting" | "inventory" | "management";
  employeeId?: string;
}

/**
 * Portal route configuration
 */
export interface PortalRoute {
  path: string;
  label: string;
  icon?: string;
  permission?: string;
  children?: PortalRoute[];
}

/**
 * Portal navigation item
 */
export interface PortalNavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  permission?: string;
  badge?: number | string;
  children?: PortalNavigationItem[];
}

/**
 * Client portal navigation items
 */
export interface ClientPortalNavigation extends PortalNavigationItem {
  children?: ClientPortalNavigation[];
}

/**
 * Employee portal navigation items
 */
export interface EmployeePortalNavigation extends PortalNavigationItem {
  module?:
    | "crm"
    | "orders"
    | "inventory"
    | "accounting"
    | "reports"
    | "settings";
  children?: EmployeePortalNavigation[];
}

/**
 * Portal context
 */
export interface PortalContext {
  type: PortalType;
  user: PortalUser;
  routes: PortalRoute[];
  navigation: PortalNavigationItem[];
  permissions: string[];
}

/**
 * Portal guard configuration
 */
export interface PortalGuardConfig {
  requiredPermission?: string;
  requiredRole?: PortalRole | PortalRole[];
  redirectTo?: string;
}

/**
 * Portal dashboard widget
 */
export interface PortalDashboardWidget {
  id: string;
  type: "stat" | "chart" | "table" | "list" | "custom";
  title: string;
  data?: unknown;
  config?: Record<string, unknown>;
  permission?: string;
  position?: {
    row: number;
    col: number;
    width?: number;
    height?: number;
  };
}

/**
 * Portal dashboard configuration
 */
export interface PortalDashboard {
  id: string;
  portalType: PortalType;
  widgets: PortalDashboardWidget[];
  layout?: "grid" | "list" | "custom";
  config?: Record<string, unknown>;
}

/**
 * Portal permission check result
 */
export interface PortalPermissionCheck {
  hasPermission: boolean;
  permission: string;
  reason?: string;
}

/**
 * Portal route metadata
 */
export interface PortalRouteMetadata {
  portalType: PortalType;
  requiredPermission?: string;
  requiredRole?: PortalRole | PortalRole[];
  isPublic?: boolean;
  layout?: "client" | "employee" | "default";
}
