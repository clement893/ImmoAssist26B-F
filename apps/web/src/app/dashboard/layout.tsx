'use client';

// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/ui/Sidebar';
import Button from '@/components/ui/Button';
import { ThemeToggleWithIcon } from '@/components/ui/ThemeToggle';
import NotificationBellConnected from '@/components/notifications/NotificationBellConnected';
import { LayoutDashboard, FolderKanban, LogOut, Menu, Shield, Home } from 'lucide-react';
import { clsx } from 'clsx';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Check if user is admin or superadmin
  const isAdmin = user?.is_admin;

  const sidebarItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Projets',
      href: '/dashboard/projects',
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      label: 'Super Admin',
      href: '/dashboard/become-superadmin',
      icon: <Shield className="w-5 h-5" />,
    },
    // Admin link - only visible to admins and superadmins
    ...(isAdmin
      ? [
          {
            label: 'Administration',
            href: '/admin',
            icon: <Shield className="w-5 h-5" />,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-muted dark:to-muted">
      {/* Mobile Header */}
      <header className="lg:hidden bg-background shadow border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">
            {pathname === '/dashboard' && 'Dashboard'}
            {pathname === '/dashboard/projects' && 'Projets'}
            {pathname === '/dashboard/become-superadmin' && 'Super Admin'}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          'lg:hidden fixed top-0 left-0 h-full z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar
          items={sidebarItems}
          currentPath={pathname}
          className="h-full"
          user={user}
          isMobile={true}
          onClose={() => setMobileMenuOpen(false)}
          onHomeClick={() => {
            router.push('/');
            setMobileMenuOpen(false);
          }}
          themeToggleComponent={<ThemeToggleWithIcon />}
          onLogoutClick={() => {
            handleLogout();
            setMobileMenuOpen(false);
          }}
        />
      </aside>

      {/* Desktop Layout */}
      <div className="flex h-screen pt-0 lg:pt-0">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block">
          <Sidebar
            items={sidebarItems}
            currentPath={pathname}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-screen sticky top-0"
            user={user}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop Header */}
          <header className="hidden lg:block bg-background shadow border-b border-border">
            <div className="px-6 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">
                {pathname === '/dashboard' && 'Dashboard'}
                {pathname === '/dashboard/projects' && 'Projets'}
                {pathname === '/dashboard/become-superadmin' && 'Super Admin'}
              </h1>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/')}
                  aria-label="Retour à l'accueil"
                  title="Retour à l'accueil"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Accueil
                </Button>
                <NotificationBellConnected />
                <ThemeToggleWithIcon />
                <Button variant="danger" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main
            key={pathname}
            className="flex-1 overflow-y-auto"
            style={{
              animation: 'fadeInSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ProtectedRoute>
  );
}
