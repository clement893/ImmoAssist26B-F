/**
 * Navigation Structure
 *
 * Centralized navigation configuration for the application sidebar.
 * Supports grouped navigation items with collapsible sections.
 */

import { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Shield,
  FileText,
  Image,
  Settings,
  User,
  Lock,
  Sliders,
  FileCheck,
  Palette,
  Cog,
  Network,
  Building2,
  MessageSquare,
  ClipboardList,
  Receipt,
  UserCheck,
  UserPlus,
  Mic,
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
}

export interface NavigationGroup {
  name: string;
  icon?: ReactNode;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface NavigationConfig {
  items: (NavigationItem | NavigationGroup)[];
}

/** Format attendu par le Sidebar UI (label, href, icon, children) */
export interface SidebarItemFormat {
  label: string;
  href?: string;
  icon?: ReactNode;
  children?: SidebarItemFormat[];
}

/**
 * Convertit la config de navigation en items pour le Sidebar UI (DashboardLayout).
 */
export function navigationConfigToSidebarItems(config: NavigationConfig): SidebarItemFormat[] {
  return config.items.map((item) => {
    if ('items' in item) {
      return {
        label: item.name,
        icon: item.icon,
        children: item.items.map((sub) => ({
          label: sub.name,
          href: sub.href,
          icon: sub.icon,
        })),
      };
    }
    return {
      label: item.name,
      href: item.href,
      icon: item.icon,
    };
  });
}

/**
 * Get default navigation structure
 * Can be customized based on user permissions.
 * Clients (is_client) see a reduced menu; courtiers see the full menu.
 */
export function getNavigationConfig(isAdmin?: boolean, isClient?: boolean): NavigationConfig {
  // Menu pour un client (portail client) : Dashboard, Léa, Formulaire, Profil
  if (isClient) {
    return {
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          name: 'Léa',
          icon: <MessageSquare className="w-5 h-5" />,
          items: [
            {
              name: 'Léa2',
              href: '/dashboard/lea2',
              icon: <Mic className="w-5 h-5" />,
            },
            {
              name: 'Paramètres Léa',
              href: '/dashboard/modules/admin/parametres-lea',
              icon: <Sliders className="w-5 h-5" />,
            },
          ],
          collapsible: true,
          defaultOpen: false,
        },
        {
          name: 'Mes transactions',
          href: '/dashboard/transactions',
          icon: <Receipt className="w-5 h-5" />,
        },
        {
          name: 'Mes contacts',
          href: '/dashboard/reseau/contacts',
          icon: <Users className="w-5 h-5" />,
        },
        {
          name: 'Formulaire',
          icon: <ClipboardList className="w-5 h-5" />,
          items: [
            {
              name: 'Vue d\'ensemble',
              href: '/dashboard/modules/formulaire',
              icon: <LayoutDashboard className="w-5 h-5" />,
            },
            {
              name: 'Formulaires OACIQ',
              href: '/dashboard/modules/formulaire/oaciq',
              icon: <FileText className="w-5 h-5" />,
            },
            {
              name: 'Mes formulaires OACIQ',
              href: '/dashboard/modules/formulaire/mes-formulaires-oaciq',
              icon: <FileText className="w-5 h-5" />,
            },
          ],
          collapsible: true,
          defaultOpen: false,
        },
        {
          name: 'Profil',
          icon: <User className="w-5 h-5" />,
          items: [
            {
              name: 'Mon profil',
              href: '/dashboard/modules/profil',
              icon: <User className="w-5 h-5" />,
            },
            {
              name: 'Paramètres',
              href: '/dashboard/modules/profil/settings',
              icon: <Settings className="w-5 h-5" />,
            },
            {
              name: 'Sécurité',
              href: '/dashboard/modules/profil/security',
              icon: <Lock className="w-5 h-5" />,
            },
            {
              name: 'Notifications',
              href: '/dashboard/modules/profil/notifications',
              icon: <MessageSquare className="w-5 h-5" />,
            },
          ],
          collapsible: true,
          defaultOpen: false,
        },
      ],
    };
  }

  const config: NavigationConfig = {
    items: [
      // Dashboard (non-grouped)
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
      // Léa - Assistant IA (groupe avec lien paramètres)
      {
        name: 'Léa',
        icon: <MessageSquare className="w-5 h-5" />,
        items: [
          {
            name: 'Léa2',
            href: '/dashboard/lea2',
            icon: <Mic className="w-5 h-5" />,
          },
          {
            name: 'Paramètres Léa',
            href: '/dashboard/modules/admin/parametres-lea',
            icon: <Sliders className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      // Mes transactions et Mes contacts - entrées visibles dans le menu
      {
        name: 'Mes transactions',
        href: '/dashboard/transactions',
        icon: <Receipt className="w-5 h-5" />,
      },
      {
        name: 'Étapes des transactions',
        href: '/dashboard/transactions/steps',
        icon: <FileCheck className="w-5 h-5" />,
      },
      {
        name: 'Mes contacts',
        href: '/dashboard/reseau/contacts',
        icon: <Users className="w-5 h-5" />,
      },
      // Module Réseau
      {
        name: 'Réseau',
        icon: <Network className="w-5 h-5" />,
        items: [
          {
            name: 'Entreprises',
            href: '/dashboard/reseau/entreprises',
            icon: <Building2 className="w-5 h-5" />,
          },
          {
            name: 'Contacts',
            href: '/dashboard/reseau/contacts',
            icon: <User className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      // Module Formulaire
      {
        name: 'Formulaire',
        icon: <ClipboardList className="w-5 h-5" />,
        items: [
          {
            name: 'Vue d\'ensemble',
            href: '/dashboard/modules/formulaire',
            icon: <LayoutDashboard className="w-5 h-5" />,
          },
          {
            name: 'Formulaires OACIQ',
            href: '/dashboard/modules/formulaire/oaciq',
            icon: <FileText className="w-5 h-5" />,
          },
          {
            name: 'Mes formulaires',
            href: '/dashboard/modules/formulaire/mes-formulaires',
            icon: <FileText className="w-5 h-5" />,
          },
          {
            name: 'Mes Clauses',
            href: '/dashboard/modules/formulaire/mes-clauses',
            icon: <ClipboardList className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      // Portail client
      {
        name: 'Portail client',
        icon: <Users className="w-5 h-5" />,
        items: [
          {
            name: 'Portails clients infos',
            href: '/dashboard/portail-client/infos',
            icon: <LayoutDashboard className="w-5 h-5" />,
          },
          {
            name: 'Liste des clients',
            href: '/dashboard/portail-client/courtier/clients',
            icon: <Users className="w-5 h-5" />,
          },
          {
            name: 'Inviter un client',
            href: '/dashboard/portail-client/courtier/clients/inviter',
            icon: <UserPlus className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
      // Module Profil
      {
        name: 'Profil',
        icon: <User className="w-5 h-5" />,
        items: [
          {
            name: 'Mon profil',
            href: '/dashboard/modules/profil',
            icon: <User className="w-5 h-5" />,
          },
          {
            name: 'Paramètres',
            href: '/dashboard/modules/profil/settings',
            icon: <Settings className="w-5 h-5" />,
          },
          {
            name: 'Sécurité',
            href: '/dashboard/modules/profil/security',
            icon: <Lock className="w-5 h-5" />,
          },
          {
            name: 'Activité',
            href: '/dashboard/modules/profil/activity',
            icon: <FileCheck className="w-5 h-5" />,
          },
          {
            name: 'Notifications',
            href: '/dashboard/modules/profil/notifications',
            icon: <MessageSquare className="w-5 h-5" />,
          },
        ],
        collapsible: true,
        defaultOpen: false,
      },
    ],
  };

  // Module Admin - visible uniquement pour les admins
  if (isAdmin) {
    config.items.push({
      name: 'Admin',
      icon: <Shield className="w-5 h-5" />,
      items: [
        {
          name: 'Vue d\'ensemble',
          href: '/dashboard/modules/admin',
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          name: 'Utilisateurs',
          href: '/dashboard/modules/admin/users',
          icon: <Users className="w-5 h-5" />,
        },
        {
          name: 'Équipes',
          href: '/dashboard/modules/admin/teams',
          icon: <UserCog className="w-5 h-5" />,
        },
        {
          name: 'Rôles et permissions',
          href: '/dashboard/modules/admin/rbac',
          icon: <Shield className="w-5 h-5" />,
        },
        {
          name: 'Organisations',
          href: '/dashboard/modules/admin/organizations',
          icon: <Building2 className="w-5 h-5" />,
        },
        {
          name: 'Invitations',
          href: '/dashboard/modules/admin/invitations',
          icon: <UserCheck className="w-5 h-5" />,
        },
        {
          name: 'Pages',
          href: '/dashboard/modules/admin/pages',
          icon: <FileText className="w-5 h-5" />,
        },
        {
          name: 'Articles',
          href: '/dashboard/modules/admin/articles',
          icon: <FileCheck className="w-5 h-5" />,
        },
        {
          name: 'Médias',
          href: '/dashboard/modules/admin/media',
          icon: <Image className="w-5 h-5" />,
        },
        {
          name: 'Thèmes',
          href: '/dashboard/modules/admin/themes',
          icon: <Palette className="w-5 h-5" />,
        },
        {
          name: 'Clés API',
          href: '/dashboard/modules/admin/api-keys',
          icon: <Lock className="w-5 h-5" />,
        },
        {
          name: 'Statistiques',
          href: '/dashboard/modules/admin/statistics',
          icon: <Sliders className="w-5 h-5" />,
        },
        {
          name: 'Configuration',
          href: '/dashboard/modules/admin/settings',
          icon: <Cog className="w-5 h-5" />,
        },
        {
          name: 'Paramètres Léa',
          href: '/dashboard/modules/admin/parametres-lea',
          icon: <MessageSquare className="w-5 h-5" />,
        },
        {
          name: 'Tenancy',
          href: '/dashboard/modules/admin/tenancy',
          icon: <Building2 className="w-5 h-5" />,
        },
      ],
      collapsible: true,
      defaultOpen: false,
    });
  }

  return config;
}
