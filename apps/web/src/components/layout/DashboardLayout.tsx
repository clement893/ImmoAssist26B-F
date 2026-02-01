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
import { clsx } from 'clsx';
import { getNavigationConfig, navigationConfigToSidebarItems } from '@/lib/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Memoize the sidebar component to prevent re-renders during navigation
const MemoizedSidebar = memo(Sidebar);

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Menu selon le rôle : client (portail) vs courtier ; admin pour le bloc Admin
  const isAdmin = user?.is_admin ?? false;
  const isClient = user?.is_client ?? false;
  const sidebarItems = useMemo(
    () => navigationConfigToSidebarItems(getNavigationConfig(isAdmin, isClient)),
    [isAdmin, isClient]
  );

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
          className="lg:hidden fixed inset-0 bg-foreground bg-opacity-50 z-40 transition-modern" // UI Revamp - Transition moderne
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
          variant="modern" // UI Revamp - Utiliser le variant modern
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
            variant="modern" // UI Revamp - Utiliser le variant modern
            user={user}
            showSearch={true}
            onHomeClick={handleDesktopHomeClick}
            themeToggleComponent={<ThemeToggleWithIcon />}
            onLogoutClick={handleDesktopLogoutClick}
          />
        </aside>

        {/* Main Content - Only this part changes during navigation */}
        <div className="flex-1 flex flex-col min-w-0 w-full bg-background">
          {/* Page Content - This is the only part that updates on navigation */}
          <main
            key={pathname}
            className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 xl:px-10 2xl:px-12 py-6 sm:py-8 2xl:py-10 bg-background"
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
