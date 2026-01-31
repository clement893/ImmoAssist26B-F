'use client';

import { ReactNode, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { ChevronRight, ChevronDown, Search, X, Home, LogOut } from 'lucide-react';
import Input from './Input';

interface SidebarItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  onClick?: () => void;
  badge?: string | number;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  currentPath?: string;
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  user?: { name?: string; email?: string } | null;
  showSearch?: boolean; // New prop for search bar (UX/UI improvements - Batch 8)
  // New props for header and footer actions
  notificationsComponent?: ReactNode;
  onHomeClick?: () => void;
  themeToggleComponent?: ReactNode;
  onLogoutClick?: () => void;
  onClose?: () => void; // For mobile menu close button
  isMobile?: boolean; // To hide text labels in mobile mode
}

export default function Sidebar({
  items,
  currentPath,
  className,
  collapsed = false,
  onToggleCollapse,
  user,
  showSearch = false, // Search bar disabled by default for backward compatibility
  notificationsComponent,
  onHomeClick,
  themeToggleComponent,
  onLogoutClick,
  onClose,
  isMobile = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const activePath = currentPath || pathname;

  // Filter items based on search query (UX/UI improvements - Batch 8)
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim() || !showSearch) {
      return items;
    }

    const query = searchQuery.toLowerCase();

    return items
      .filter((item) => {
        const matchesLabel = item.label.toLowerCase().includes(query);
        const matchesChildren = item.children?.some(
          (child) => child.label.toLowerCase().includes(query) || child.href?.toLowerCase().includes(query)
        );
        return matchesLabel || matchesChildren;
      })
      .map((item) => {
        if (item.children) {
          const filteredChildren = item.children.filter(
            (child) => child.label.toLowerCase().includes(query) || child.href?.toLowerCase().includes(query)
          );
          return { ...item, children: filteredChildren };
        }
        return item;
      });
  }, [items, searchQuery, showSearch]);

  const toggleItem = (label: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const renderItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const isActive = activePath === item.href || (item.href && activePath?.startsWith(item.href));

    return (
      <div key={item.label}>
        <div
          className={clsx(
            'flex items-center justify-between px-lg py-md rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-[44px]',
            // Improved spacing and touch target (UX/UI improvements - Batch 8, 17)
            isActive ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-900 dark:text-primary-100 font-medium' : 'text-foreground hover:bg-muted',
            level > 0 && 'ml-lg' // Increased indentation for nested items
          )}
        >
          {item.href ? (
            <Link href={item.href} className="flex items-center flex-1 space-x-3 min-w-0">
              {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}
              {!collapsed && <span className="flex-1 truncate text-sm font-medium">{item.label}</span>}
            </Link>
          ) : (
            <button
              onClick={item.onClick || (hasChildren ? () => toggleItem(item.label) : undefined)}
              className="flex items-center flex-1 space-x-3 text-left min-w-0"
              aria-expanded={hasChildren ? isExpanded : undefined}
              aria-label={hasChildren ? `Toggle ${item.label}` : item.label}
            >
              {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}
              {!collapsed && <span className="flex-1 truncate text-sm font-medium">{item.label}</span>}
            </button>
          )}

          {!collapsed && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 rounded-full">
                  {item.badge}
                </span>
              )}
              {hasChildren &&
                (isExpanded ? (
                  <ChevronDown className="w-4 h-4 transition-transform text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 transition-transform text-muted-foreground" />
                ))}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1">{item.children!.map((child) => renderItem(child, level + 1))}</div>
        )}
      </div>
    );
  };

  // Auto-expand groups that contain active items (UX/UI improvements - Batch 8)
  useEffect(() => {
    items.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => activePath === child.href || (child.href && activePath?.startsWith(child.href))
        );
        if (hasActiveChild && !expandedItems.has(item.label)) {
          setExpandedItems((prev) => new Set(prev).add(item.label));
        }
      }
    });
  }, [items, activePath, expandedItems]);

  return (
    <aside
      className={clsx(
        'bg-background border-r border-border h-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col',
        collapsed ? 'w-16' : 'w-64 md:w-72 lg:w-80',
        className
      )}
    >
      {/* Header: User info + Notifications (top left) */}
      {user && (
        <div className="p-lg border-b border-border flex-shrink-0">
          <div className={clsx('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0 min-w-[44px] min-h-[44px]">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.name || 'Utilisateur'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                {notificationsComponent && <div className="flex-shrink-0">{notificationsComponent}</div>}
              </div>
            )}
            {collapsed && notificationsComponent && <div className="flex-shrink-0">{notificationsComponent}</div>}
          </div>
        </div>
      )}

      {/* Search Bar (UX/UI improvements - Batch 8) */}
      {showSearch && !collapsed && (
        <div className="px-lg py-md border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10 text-sm"
              aria-label="Rechercher dans la navigation"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <nav className="p-lg space-y-1 flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="px-lg py-md text-sm text-muted-foreground text-center">Aucun résultat trouvé</div>
        ) : (
          filteredItems.map((item) => renderItem(item))
        )}
      </nav>

      {/* Footer: Collapse, Close button (mobile), Home, Theme Toggle, Logout (bottom) */}
      {(onToggleCollapse || onClose || onHomeClick || themeToggleComponent || onLogoutClick) && (
        <div className="p-lg border-t border-border flex-shrink-0">
          <div className={clsx('flex items-center gap-2', collapsed || isMobile ? 'justify-center flex-wrap' : 'justify-start')}>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-lg hover:bg-muted dark:hover:bg-muted text-foreground transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronRight
                  className={clsx(
                    'w-5 h-5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                    collapsed && 'rotate-180'
                  )}
                />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted dark:hover:bg-muted text-foreground transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Fermer le menu"
                title="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {onHomeClick && (
              <button
                onClick={onHomeClick}
                className="p-2 rounded-lg hover:bg-muted dark:hover:bg-muted text-foreground transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Retour à l'accueil"
                title="Retour à l'accueil"
              >
                <Home className="w-5 h-5" />
              </button>
            )}
            {themeToggleComponent && (
              <div className="flex-shrink-0 flex items-center justify-center">{themeToggleComponent}</div>
            )}
            {onLogoutClick && (
              <button
                onClick={onLogoutClick}
                className="p-2 rounded-lg hover:bg-error-100 dark:hover:bg-error-900/40 text-error-600 dark:text-error-400 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Déconnexion"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
