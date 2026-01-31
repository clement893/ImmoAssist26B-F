/**
 * Shared Dashboard Layout Component
 *
 * Best Practice: Use a shared layout component to ensure consistency
 * across all internal pages (dashboard, settings, profile, etc.)
 *
 * Benefits:
 * - Single source of truth for navigation
 * - Consistent UI/UX across pages
 * - Easier maintenance (one place to update)
 * - Prevents layout drift between pages
 */
'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/ui/Sidebar';
import { ThemeToggleWithIcon } from '@/components/ui/ThemeToggle';
import LeaWidget from '@/components/lea/LeaWidget';
import DashboardHeader from './DashboardHeader';
import {
  LayoutDashboard,
  Shield,
  User,
  Settings,
  Network,
  Building2,
  MessageSquare,
  UserCheck,
  FileText,
  ClipboardList,
  Receipt,
  FileCheck,
  Lock,
  Image,
  Palette,
  Cog,
  Sliders,
  UserCog,
  Users,
  Calendar,
  Clock,
} from 'lucide-react';
import { clsx } from 'clsx';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Memoize sidebar items to prevent recreation on every render
// This ensures the sidebar doesn't re-render unnecessarily during navigation
const createSidebarItems = (isAdmin: boolean) => [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Léa',
    href: '/dashboard/agents',
    icon: <UserCheck className="w-5 h-5" />,
  },
  // Module Transactions
  {
    label: 'Transactions',
    icon: <Receipt className="w-5 h-5" />,
    children: [
      {
        label: 'Liste des transactions',
        href: '/dashboard/transactions',
        icon: <FileText className="w-5 h-5" />,
      },
      {
        label: 'Étapes des transactions',
        href: '/dashboard/transactions/steps',
        icon: <FileCheck className="w-5 h-5" />,
      },
    ],
  },
  // Module Réseau
  {
    label: 'Réseau',
    icon: <Network className="w-5 h-5" />,
    children: [
      {
        label: 'Entreprises',
        href: '/dashboard/reseau/entreprises',
        icon: <Building2 className="w-5 h-5" />,
      },
      {
        label: 'Contacts',
        href: '/dashboard/reseau/contacts',
        icon: <User className="w-5 h-5" />,
      },
    ],
  },
  // Module Formulaire
  {
    label: 'Formulaire',
    icon: <ClipboardList className="w-5 h-5" />,
    children: [
      {
        label: 'Vue d\'ensemble',
        href: '/dashboard/modules/formulaire',
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
      {
        label: 'Formulaires OACIQ',
        href: '/dashboard/modules/formulaire/oaciq',
        icon: <FileText className="w-5 h-5" />,
      },
      {
        label: 'Mes Clauses',
        href: '/dashboard/modules/formulaire/mes-clauses',
        icon: <ClipboardList className="w-5 h-5" />,
      },
    ],
  },
  // Module Calendrier
  {
    label: 'Calendrier',
    icon: <Calendar className="w-5 h-5" />,
    children: [
      {
        label: 'Vue d\'ensemble',
        href: '/dashboard/modules/calendrier',
        icon: <LayoutDashboard className="w-5 h-5" />,
      },
      {
        label: 'Agenda',
        href: '/dashboard/modules/calendrier/agenda',
        icon: <Calendar className="w-5 h-5" />,
      },
      {
        label: 'Événements',
        href: '/dashboard/modules/calendrier/evenements',
        icon: <Clock className="w-5 h-5" />,
      },
    ],
  },
  // Module Profil
  {
    label: 'Profil',
    icon: <User className="w-5 h-5" />,
    children: [
      {
        label: 'Mon profil',
        href: '/dashboard/modules/profil',
        icon: <User className="w-5 h-5" />,
      },
      {
        label: 'Paramètres',
        href: '/dashboard/modules/profil/settings',
        icon: <Settings className="w-5 h-5" />,
      },
      {
        label: 'Sécurité',
        href: '/dashboard/modules/profil/security',
        icon: <Lock className="w-5 h-5" />,
      },
      {
        label: 'Activité',
        href: '/dashboard/modules/profil/activity',
        icon: <FileCheck className="w-5 h-5" />,
      },
      {
        label: 'Notifications',
        href: '/dashboard/modules/profil/notifications',
        icon: <MessageSquare className="w-5 h-5" />,
      },
    ],
  },
  {
    label: 'Super Admin',
    href: '/dashboard/become-superadmin',
    icon: <Shield className="w-5 h-5" />,
  },
  // Module Admin - only visible to admins and superadmins
  ...(isAdmin
    ? [
        {
          label: 'Admin',
          icon: <Shield className="w-5 h-5" />,
          children: [
            {
              label: 'Vue d\'ensemble',
              href: '/dashboard/modules/admin',
              icon: <LayoutDashboard className="w-5 h-5" />,
            },
            {
              label: 'Utilisateurs',
              href: '/dashboard/modules/admin/users',
              icon: <Users className="w-5 h-5" />,
            },
            {
              label: 'Équipes',
              href: '/dashboard/modules/admin/teams',
              icon: <UserCog className="w-5 h-5" />,
            },
            {
              label: 'Rôles et permissions',
              href: '/dashboard/modules/admin/rbac',
              icon: <Shield className="w-5 h-5" />,
            },
            {
              label: 'Organisations',
              href: '/dashboard/modules/admin/organizations',
              icon: <Building2 className="w-5 h-5" />,
            },
            {
              label: 'Invitations',
              href: '/dashboard/modules/admin/invitations',
              icon: <UserCheck className="w-5 h-5" />,
            },
            {
              label: 'Pages',
              href: '/dashboard/modules/admin/pages',
              icon: <FileText className="w-5 h-5" />,
            },
            {
              label: 'Articles',
              href: '/dashboard/modules/admin/articles',
              icon: <FileCheck className="w-5 h-5" />,
            },
            {
              label: 'Médias',
              href: '/dashboard/modules/admin/media',
              icon: <Image className="w-5 h-5" />,
            },
            {
              label: 'Thèmes',
              href: '/dashboard/modules/admin/themes',
              icon: <Palette className="w-5 h-5" />,
            },
            {
              label: 'Clés API',
              href: '/dashboard/modules/admin/api-keys',
              icon: <Lock className="w-5 h-5" />,
            },
            {
              label: 'Statistiques',
              href: '/dashboard/modules/admin/statistics',
              icon: <Sliders className="w-5 h-5" />,
            },
            {
              label: 'Configuration',
              href: '/dashboard/modules/admin/settings',
              icon: <Cog className="w-5 h-5" />,
            },
            {
              label: 'Tenancy',
              href: '/dashboard/modules/admin/tenancy',
              icon: <Building2 className="w-5 h-5" />,
            },
          ],
        },
      ]
    : []),
];

// Memoize the sidebar component to prevent re-renders during navigation
const MemoizedSidebar = memo(Sidebar);

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is admin or superadmin
  const isAdmin = user?.is_admin ?? false;

  // Memoize sidebar items - only recreate if admin status changes
  // This prevents the sidebar from re-rendering on every navigation
  const sidebarItems = useMemo(() => createSidebarItems(isAdmin), [isAdmin]);

  // Memoize callbacks to prevent re-renders
  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleHomeClick = useCallback(() => {
    router.push('/');
    setMobileMenuOpen(false);
  }, [router]);

  const handleLogoutClick = useCallback(() => {
    logout();
    setMobileMenuOpen(false);
  }, [logout]);

  const handleDesktopHomeClick = useCallback(() => {
    router.push('/');
  }, [router]);

  const handleDesktopLogoutClick = useCallback(() => {
    logout();
  }, [logout]);

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <DashboardHeader
        user={user}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
        showSearch={true}
      />

      {/* Mobile/Tablet Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground bg-opacity-50 z-40 transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          onClick={handleMobileMenuClose}
        />
      )}

      {/* Mobile/Tablet Sidebar - Fixed position, persists during navigation */}
      <aside
        className={clsx(
          'lg:hidden fixed top-0 left-0 h-full z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] w-64 sm:w-72',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <MemoizedSidebar
          items={sidebarItems}
          currentPath={pathname}
          className="h-full"
          user={user}
          showSearch={true}
          isMobile={true}
          onClose={handleMobileMenuClose}
          onHomeClick={handleHomeClick}
          themeToggleComponent={<ThemeToggleWithIcon />}
          onLogoutClick={handleLogoutClick}
        />
      </aside>

      {/* Desktop Layout - Sidebar stays fixed, only content changes */}
      <div className="flex h-screen pt-0 lg:pt-0">
        {/* Desktop Sidebar - Fixed position, persists during navigation */}
        <aside className="hidden lg:block">
          <MemoizedSidebar
            items={sidebarItems}
            currentPath={pathname}
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
            className="h-screen sticky top-0"
            user={user}
            showSearch={true}
            onHomeClick={handleDesktopHomeClick}
            themeToggleComponent={<ThemeToggleWithIcon />}
            onLogoutClick={handleDesktopLogoutClick}
          />
        </aside>

        {/* Main Content - Only this part changes during navigation */}
        <div className="flex-1 flex flex-col min-w-0 w-full bg-neutral-50 dark:bg-neutral-950">
          {/* Page Content - This is the only part that updates on navigation */}
          <main
            key={pathname}
            className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 sm:py-8 2xl:py-10 bg-neutral-50 dark:bg-neutral-950"
            style={{
              animation: 'fadeInSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {children}
          </main>
        </div>
      </div>
      {/* Léa AI Widget - Available everywhere in dashboard */}
      <LeaWidget />
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Next.js App Router keeps layouts persistent by default
  // The layout component stays mounted, only {children} changes during navigation
  // This ensures the sidebar stays in place while only the content area updates
  return (
    <ProtectedRoute>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ProtectedRoute>
  );
}
