/**
 * Client Portal Navigation Component
 *
 * Navigation sidebar for the client portal.
 * Displays navigation items based on client permissions.
 *
 * @module ClientNavigation
 * @see {@link ../../lib/constants/portal.ts CLIENT_PORTAL_NAVIGATION}
 */
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CLIENT_PORTAL_NAVIGATION } from '@/lib/constants/portal';
import { hasPermission, type PortalUser } from '@/lib/portal/utils';
import { useAuthStore } from '@/lib/store';
import { clsx } from 'clsx';

/**
 * Client Navigation Props
 */
interface ClientNavigationProps {
  className?: string;
}

/**
 * Client Portal Navigation Component
 *
 * Renders a navigation sidebar with client portal menu items.
 * Only shows items the user has permission to access.
 *
 * @example
 * ```tsx
 * <ClientNavigation />
 * ```
 */
export function ClientNavigation({ className }: ClientNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Filter navigation items based on permissions
  const visibleItems = CLIENT_PORTAL_NAVIGATION.filter((item) => {
    if (!item.permission || !user) return true;

    // Convert store User to PortalUser format
    const portalUser: PortalUser = {
      ...user,
      roles: user.is_admin ? ['admin'] : ['client'],
      permissions: [], // Permissions would come from API in production
    };

    return hasPermission(portalUser, item.permission).hasPermission;
  });

  return (
    <nav className={clsx('flex flex-col space-y-1', className)}>
      {visibleItems.map((item) => {
        const isActive =
          pathname === item.path || pathname?.startsWith(`${item.path}/`);

        return (
          <Link
            key={item.id}
            href={item.path}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-modern', // UI Revamp - Transition moderne
              isActive
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                : 'text-foreground hover:bg-muted'
            )}
          >
            {item.icon && (
              <span className="text-lg" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto bg-primary-500 text-background text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
