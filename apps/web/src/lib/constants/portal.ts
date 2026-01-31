/**
 * Portal Constants
 *
 * Constants for Client Portal and Employee/ERP Portal
 */

// Portal type definitions
export interface PortalRoute {
  path: string;
  label: string;
  icon: string;
  permission?: string;
  children?: PortalRoute[];
}

export interface PortalNavigationItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  permission?: string;
  module?: string;
  badge?: string | number;
  children?: PortalNavigationItem[];
}

export interface ClientPortalNavigation extends PortalNavigationItem {
  // Client-specific navigation properties
}

export interface EmployeePortalNavigation extends PortalNavigationItem {
  module: string;
}

/**
 * Portal route prefixes
 */
export const PORTAL_ROUTES = {
  CLIENT: '/client',
  EMPLOYEE: '/erp',
  ADMIN: '/admin',
} as const;

/**
 * Client portal routes
 */
export const CLIENT_PORTAL_ROUTES: PortalRoute[] = [
  {
    path: '/client/dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
  },
  {
    path: '/client/orders',
    label: 'Orders',
    icon: 'ShoppingCart',
    permission: 'client:view:orders',
  },
  {
    path: '/client/invoices',
    label: 'Invoices',
    icon: 'FileText',
    permission: 'client:view:invoices',
  },
  {
    path: '/client/projects',
    label: 'Projects',
    icon: 'Folder',
    permission: 'client:view:projects',
  },
  {
    path: '/client/tickets',
    label: 'Support Tickets',
    icon: 'MessageSquare',
    permission: 'client:view:tickets',
  },
  {
    path: '/client/profile',
    label: 'Profile',
    icon: 'User',
    permission: 'client:view:profile',
  },
];

/**
 * Employee/ERP portal routes
 */
export const EMPLOYEE_PORTAL_ROUTES: PortalRoute[] = [
  {
    path: '/erp/dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
  },
  {
    path: '/erp/orders',
    label: 'Orders',
    icon: 'ShoppingCart',
    permission: 'erp:view:all:orders',
    children: [
      {
        path: '/erp/orders/all',
        label: 'All Orders',
        icon: 'List',
        permission: 'erp:view:all:orders',
      },
      {
        path: '/erp/orders/pending',
        label: 'Pending',
        icon: 'Clock',
        permission: 'erp:view:all:orders',
      },
      {
        path: '/erp/orders/completed',
        label: 'Completed',
        icon: 'CheckCircle',
        permission: 'erp:view:all:orders',
      },
    ],
  },
  {
    path: '/erp/inventory',
    label: 'Inventory',
    icon: 'Package',
    permission: 'erp:view:inventory',
    children: [
      {
        path: '/erp/inventory/products',
        label: 'Products',
        icon: 'Package',
        permission: 'erp:view:inventory',
      },
      {
        path: '/erp/inventory/stock',
        label: 'Stock Levels',
        icon: 'TrendingUp',
        permission: 'inventory:view:stock',
      },
      {
        path: '/erp/inventory/movements',
        label: 'Movements',
        icon: 'ArrowRightLeft',
        permission: 'inventory:view:stock',
      },
    ],
  },
  {
    path: '/erp/clients',
    label: 'Clients',
    icon: 'Users',
    permission: 'erp:view:clients',
  },
  {
    path: '/erp/invoices',
    label: 'Invoices',
    icon: 'FileText',
    permission: 'erp:view:invoices',
    children: [
      {
        path: '/erp/invoices/all',
        label: 'All Invoices',
        icon: 'FileText',
        permission: 'erp:view:invoices',
      },
      {
        path: '/erp/invoices/pending',
        label: 'Pending Payment',
        icon: 'Clock',
        permission: 'accounting:view:invoices',
      },
      {
        path: '/erp/invoices/paid',
        label: 'Paid',
        icon: 'CheckCircle',
        permission: 'accounting:view:invoices',
      },
    ],
  },
  {
    path: '/erp/reports',
    label: 'Reports',
    icon: 'BarChart',
    permission: 'erp:view:reports',
  },
  {
    path: '/erp/settings',
    label: 'Settings',
    icon: 'Settings',
    permission: 'admin:*',
  },
];

/**
 * Client portal navigation items
 */
export const CLIENT_PORTAL_NAVIGATION: ClientPortalNavigation[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/client/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    id: 'orders',
    label: 'My Orders',
    path: '/client/orders',
    icon: 'ShoppingCart',
    permission: 'client:view:orders',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    path: '/client/invoices',
    icon: 'FileText',
    permission: 'client:view:invoices',
  },
  {
    id: 'projects',
    label: 'Projects',
    path: '/client/projects',
    icon: 'Folder',
    permission: 'client:view:projects',
  },
  {
    id: 'tickets',
    label: 'Support',
    path: '/client/tickets',
    icon: 'MessageSquare',
    permission: 'client:view:tickets',
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/client/profile',
    icon: 'User',
    permission: 'client:view:profile',
  },
];

/**
 * Employee/ERP portal navigation items
 */
export const EMPLOYEE_PORTAL_NAVIGATION: EmployeePortalNavigation[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/erp/dashboard',
    icon: 'LayoutDashboard',
    module: 'crm',
  },
  {
    id: 'orders',
    label: 'Orders',
    path: '/erp/orders',
    icon: 'ShoppingCart',
    permission: 'erp:view:all:orders',
    module: 'orders',
    children: [
      {
        id: 'orders-all',
        label: 'All Orders',
        path: '/erp/orders/all',
        icon: 'List',
        permission: 'erp:view:all:orders',
      },
      {
        id: 'orders-pending',
        label: 'Pending',
        path: '/erp/orders/pending',
        icon: 'Clock',
        permission: 'erp:view:all:orders',
      },
      {
        id: 'orders-completed',
        label: 'Completed',
        path: '/erp/orders/completed',
        icon: 'CheckCircle',
        permission: 'erp:view:all:orders',
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    path: '/erp/inventory',
    icon: 'Package',
    permission: 'erp:view:inventory',
    module: 'inventory',
    children: [
      {
        id: 'inventory-products',
        label: 'Products',
        path: '/erp/inventory/products',
        icon: 'Package',
        permission: 'erp:view:inventory',
      },
      {
        id: 'inventory-stock',
        label: 'Stock Levels',
        path: '/erp/inventory/stock',
        icon: 'TrendingUp',
        permission: 'inventory:view:stock',
      },
      {
        id: 'inventory-movements',
        label: 'Movements',
        path: '/erp/inventory/movements',
        icon: 'ArrowRightLeft',
        permission: 'inventory:view:stock',
      },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    path: '/erp/clients',
    icon: 'Users',
    permission: 'erp:view:clients',
    module: 'crm',
  },
  {
    id: 'invoices',
    label: 'Invoices',
    path: '/erp/invoices',
    icon: 'FileText',
    permission: 'erp:view:invoices',
    module: 'accounting',
    children: [
      {
        id: 'invoices-all',
        label: 'All Invoices',
        path: '/erp/invoices/all',
        icon: 'FileText',
        permission: 'erp:view:invoices',
      },
      {
        id: 'invoices-pending',
        label: 'Pending Payment',
        path: '/erp/invoices/pending',
        icon: 'Clock',
        permission: 'accounting:view:invoices',
      },
      {
        id: 'invoices-paid',
        label: 'Paid',
        path: '/erp/invoices/paid',
        icon: 'CheckCircle',
        permission: 'accounting:view:invoices',
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    path: '/erp/reports',
    icon: 'BarChart',
    permission: 'erp:view:reports',
    module: 'reports',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/erp/settings',
    icon: 'Settings',
    permission: 'admin:*',
    module: 'settings',
  },
];

/**
 * Portal type detection patterns
 */
export const PORTAL_PATH_PATTERNS = {
  CLIENT: /^\/client/,
  EMPLOYEE: /^\/erp/,
  ADMIN: /^\/admin/,
} as const;

/**
 * Default portal redirects
 */
export const PORTAL_DEFAULT_ROUTES = {
  CLIENT: '/client/dashboard',
  EMPLOYEE: '/erp/dashboard',
  ADMIN: '/admin/dashboard',
} as const;
