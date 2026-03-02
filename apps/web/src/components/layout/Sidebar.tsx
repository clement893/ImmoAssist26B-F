'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ThemeToggleWithIcon } from '@/components/ui/ThemeToggle';
import { getNavigationConfig, type NavigationItem, type NavigationGroup } from '@/lib/navigation';
import { useSuperAdminStatus } from '@/hooks/useSuperAdminStatus';
import { clsx } from 'clsx';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen: controlledIsOpen, onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use controlled or internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleClose = onClose || (() => setInternalIsOpen(false));

  // Check if user is admin or courtier vs client (portail client) ; superadmin pour Base de connaissance Léa
  const isAdmin = user?.is_admin || false;
  const isClient = user?.is_client ?? false;
  const isSuperAdmin = useSuperAdminStatus();

  // Get navigation configuration (menu différent pour client vs courtier)
  const navigationConfig = useMemo(
    () => getNavigationConfig(isAdmin, isClient, isSuperAdmin),
    [isAdmin, isClient, isSuperAdmin]
  );

  // Toggle group open/closed
  const toggleGroup = (groupName: string) => {
    setOpenGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Check if item is active
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  // Filter navigation based on search query
  const filteredNavigation = useMemo(() => {
    if (!searchQuery.trim()) {
      return navigationConfig.items;
    }

    const query = searchQuery.toLowerCase();

    return navigationConfig.items
      .map((item) => {
        if ('items' in item) {
          // It's a group
          const filteredItems = item.items.filter(
            (subItem) =>
              subItem.name.toLowerCase().includes(query) || subItem.href.toLowerCase().includes(query)
          );

          if (filteredItems.length > 0) {
            return { ...item, items: filteredItems };
          }
          return null;
        } else {
          // It's a single item
          if (item.name.toLowerCase().includes(query) || item.href.toLowerCase().includes(query)) {
            return item;
          }
          return null;
        }
      })
      .filter((item): item is NavigationItem | NavigationGroup => item !== null);
  }, [navigationConfig.items, searchQuery]);

  // Render navigation item - Dashboard V2 Style (Menu Demo)
  const renderNavItem = (item: NavigationItem) => {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={clsx(
          'flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm transition-all duration-200', // Dashboard V2 Style - gap-4 px-5 py-3.5 rounded-xl
          active
            ? 'bg-blue-500 text-white font-medium shadow-md shadow-blue-500/30' // Dashboard V2 Style - bg-blue-500 avec shadow
            : 'text-gray-600 font-light hover:bg-gray-50' // Dashboard V2 Style - font-light pour inactif
        )}
      >
        <span className={clsx(
          'w-5 h-5 flex-shrink-0',
          active ? 'text-white' : 'text-gray-400' // Dashboard V2 Style - Icons
        )}>
          {item.icon}
        </span>
        <span>{item.name}</span>
        {item.badge && (
          <span className={clsx(
            'ml-auto px-2 py-0.5 text-xs font-medium rounded-full',
            active
              ? 'bg-white/20 text-white' // Dashboard V2 Style - Badge pour actif
              : 'bg-gray-100 text-gray-600' // Dashboard V2 Style - Badge pour inactif
          )}>
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  // Render navigation group
  const renderNavGroup = (group: NavigationGroup) => {
    const isOpen = openGroups.has(group.name);
    const hasActiveItem = group.items.some((item) => isActive(item.href));

    // Auto-open group if it has an active item
    if (hasActiveItem && !isOpen && group.collapsible) {
      setOpenGroups((prev) => new Set(prev).add(group.name));
    }

    return (
      <div key={group.name} className="space-y-2">
        {group.collapsible ? (
          <button
            onClick={() => toggleGroup(group.name)}
            className={clsx(
              'w-full flex items-center justify-between gap-4 px-5 py-3.5 rounded-xl text-sm transition-all duration-200', // Dashboard V2 Style
              hasActiveItem
                ? 'bg-blue-500 text-white font-medium shadow-md shadow-blue-500/30' // Dashboard V2 Style
                : 'text-gray-600 font-light hover:bg-gray-50' // Dashboard V2 Style
            )}
            aria-expanded={isOpen}
            aria-label={`Toggle ${group.name} group`}
          >
            <div className="flex items-center gap-4">
              <span className={clsx(
                'w-5 h-5 flex-shrink-0',
                hasActiveItem ? 'text-white' : 'text-gray-400'
              )}>
                {group.icon}
              </span>
              <span>{group.name}</span>
            </div>
            {isOpen ? (
              <ChevronDown className={clsx('w-4 h-4', hasActiveItem ? 'text-white' : 'text-gray-400')} />
            ) : (
              <ChevronRight className={clsx('w-4 h-4', hasActiveItem ? 'text-white' : 'text-gray-400')} />
            )}
          </button>
        ) : (
          <div className="flex items-center gap-4 px-5 py-3.5 text-sm font-semibold text-gray-500">
            <span className="w-5 h-5 text-gray-400">{group.icon}</span>
            <span>{group.name}</span>
          </div>
        )}

        {(!group.collapsible || isOpen) && (
          <div className="ml-4 space-y-2">
            {group.items.map((item) => {
              const itemActive = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm transition-all duration-200', // Dashboard V2 Style
                    itemActive
                      ? 'bg-blue-500 text-white font-medium shadow-md shadow-blue-500/30' // Dashboard V2 Style
                      : 'text-gray-600 font-light hover:bg-gray-50' // Dashboard V2 Style
                  )}
                >
                  <span className={clsx(
                    'w-5 h-5 flex-shrink-0',
                    itemActive ? 'text-white' : 'text-gray-400'
                  )}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className={clsx(
                      'ml-auto px-2 py-0.5 text-xs font-medium rounded-full',
                      itemActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/50 dark:bg-foreground/70 md:hidden animate-fade-in"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Dashboard V2 Style */}
      <aside
        className={clsx(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-white rounded-xl shadow-sm flex flex-col', // Dashboard V2 Style - rounded-xl shadow-sm
          'transition-transform duration-normal ease-smooth',
          // Mobile: slide in/out from left
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Header with Hamburger Menu - Dashboard V2 Style */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-semibold text-gray-900">ImmoAssist</span>
          </Link>

          {/* Hamburger Menu Button (Mobile only) */}
          <button
            onClick={handleClose}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-foreground hover:bg-muted transition-modern min-h-[44px] min-w-[44px]" // UI Revamp - Transition moderne
            aria-label="Fermer le menu"
            aria-expanded={isOpen}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar - Dashboard V2 Style */}
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10"
              aria-label="Rechercher dans la navigation"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation - Dashboard V2 Style */}
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {filteredNavigation.length === 0 ? (
            <div className="px-6 py-4 text-sm text-gray-500 text-center">
              Aucun résultat trouvé
            </div>
          ) : (
            filteredNavigation.map((item) => ('items' in item ? renderNavGroup(item) : renderNavItem(item)))
          )}
        </nav>

        {/* Footer - Dashboard V2 Style */}
        <div className="border-t border-gray-100 p-6 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <ThemeToggleWithIcon />
            <Button size="sm" variant="ghost" onClick={logout} className="flex-1">
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
