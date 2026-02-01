'use client';

import { ReactNode, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { ChevronRight, ChevronDown, Search, X, Home, LogOut, Sparkles } from 'lucide-react';
import Input from './Input';

interface SidebarItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  onClick?: () => void;
  badge?: string | number;
  children?: SidebarItem[];
}

export type SidebarVariant = 'modern' | 'colored' | 'minimal' | 'floating';

interface SidebarProps {
  items: SidebarItem[];
  currentPath?: string;
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  user?: { name?: string; email?: string } | null;
  showSearch?: boolean;
  variant?: SidebarVariant;
  collapsedWidth?: number;
  expandedWidth?: number;
  accentColor?: string;
  showNotifications?: boolean;
  notificationsComponent?: ReactNode;
  onHomeClick?: () => void;
  themeToggleComponent?: ReactNode;
  onLogoutClick?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({
  items,
  currentPath,
  className,
  collapsed = false,
  onToggleCollapse,
  user,
  showSearch = false,
  variant: _variant = 'modern',
  collapsedWidth,
  expandedWidth,
  accentColor: _accentColor,
  showNotifications: _showNotifications = false,
  notificationsComponent: _notificationsComponent,
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

  // Filter items based on search query
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

  const isItemActive = (item: SidebarItem): boolean => {
    if (item.href) {
      if (item.href === '/dashboard') {
        return activePath === '/dashboard';
      }
      return activePath?.startsWith(item.href) || false;
    }
    // Check if any child is active
    if (item.children) {
      return item.children.some((child) => isItemActive(child));
    }
    return false;
  };

  const renderItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const isActive = isItemActive(item);

    // Ultra-minimalist design inspired by Video Buddy
    const itemClasses = clsx(
      'flex items-center transition-all duration-200 rounded-xl',
      collapsed
        ? 'justify-center p-2'
        : 'px-5 py-3.5 gap-4', // Generous spacing: gap-4, py-3.5
      isActive && !collapsed
        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' // Vibrant blue background with shadow
        : !collapsed
          ? 'text-gray-600 hover:bg-gray-50' // Light gray text, subtle hover
          : 'hover:bg-gray-100',
      level > 0 && !collapsed && 'ml-4' // Indentation for nested items
    );

    const iconClasses = clsx(
      'w-5 h-5 flex-shrink-0 transition-all duration-200',
      isActive && !collapsed
        ? 'text-white'
        : 'text-gray-400'
    );

    const textClasses = clsx(
      'text-sm transition-all duration-200',
      isActive && !collapsed
        ? 'font-medium text-white' // font-medium for active
        : 'font-light text-gray-600' // font-light for inactive
    );

    return (
      <div key={item.label}>
        <div className={itemClasses}>
          {item.href ? (
            <Link
              href={item.href}
              className={clsx(
                'flex items-center min-w-0 flex-1',
                collapsed && 'justify-center'
              )}
            >
              {item.icon && <span className={iconClasses}>{item.icon}</span>}
              {!collapsed && (
                <>
                  <span className={textClasses}>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          ) : (
            <button
              onClick={item.onClick || (hasChildren ? () => toggleItem(item.label) : undefined)}
              className={clsx(
                'flex items-center min-w-0 flex-1 text-left',
                collapsed && 'justify-center'
              )}
              aria-expanded={hasChildren ? isExpanded : undefined}
              aria-label={hasChildren ? `Toggle ${item.label}` : item.label}
            >
              {item.icon && <span className={iconClasses}>{item.icon}</span>}
              {!collapsed && (
                <>
                  <span className={textClasses}>{item.label}</span>
                  {item.badge && (
                    <span className={clsx(
                      'ml-auto px-2 py-0.5 text-xs font-medium rounded-full',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {item.badge}
                    </span>
                  )}
                  {hasChildren && (
                    <ChevronDown
                      className={clsx(
                        'ml-auto w-4 h-4 transition-transform duration-200',
                        isExpanded ? 'rotate-180' : '',
                        isActive ? 'text-white' : 'text-gray-400'
                      )}
                    />
                  )}
                </>
              )}
            </button>
          )}
        </div>

        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-2 space-y-2 ml-4 pl-4 border-l-2 border-gray-100">
            {item.children!.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Auto-expand groups that contain active items
  useEffect(() => {
    items.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => isItemActive(child));
        if (hasActiveChild && !expandedItems.has(item.label)) {
          setExpandedItems((prev) => new Set(prev).add(item.label));
        }
      }
    });
  }, [items, activePath, expandedItems]);

  // Determine widths
  const finalCollapsedWidth = collapsedWidth || (collapsed ? 80 : 0);
  const finalExpandedWidth = expandedWidth || (collapsed ? 0 : 320);

  // Determine container width
  const containerWidth = collapsed
    ? (finalCollapsedWidth ? `${finalCollapsedWidth}px` : 'w-20')
    : (finalExpandedWidth ? `${finalExpandedWidth}px` : 'w-72 md:w-80');

  return (
    <aside
      className={clsx(
        'h-screen sticky top-0 flex flex-col bg-white shadow-sm', // Clean white background with subtle shadow
        containerWidth,
        className
      )}
      style={
        finalCollapsedWidth || finalExpandedWidth
          ? {
              width: collapsed ? finalCollapsedWidth : finalExpandedWidth,
            }
          : undefined
      }
    >
      {/* Header: Logo/Brand Section */}
      {!collapsed && (
        <div className="flex-shrink-0 p-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">ImmoAssist</h1>
              <p className="text-xs font-light text-gray-400">Dashboard</p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed: Just show icon */}
      {collapsed && (
        <div className="flex-shrink-0 p-8 pb-6 border-b border-gray-100 flex justify-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      {/* Search Bar */}
      {showSearch && !collapsed && (
        <div className="px-4 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10 text-sm bg-gray-50 border-0 rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500"
              aria-label="Rechercher dans la navigation"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={clsx(
        'flex-1 overflow-y-auto',
        collapsed ? 'p-2 space-y-1' : 'px-4 py-2 space-y-2' // space-y-2 between menu items
      )}>
        {filteredItems.length === 0 ? (
          <div className={clsx('text-sm text-gray-400 text-center', collapsed ? 'px-2 py-4' : 'px-4 py-8')}>
            Aucun résultat trouvé
          </div>
        ) : (
          filteredItems.map((item) => renderItem(item))
        )}
      </nav>

      {/* Pro Badge - Gradient card with upgrade call-to-action */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-5 h-5 text-white" />
              <div>
                <p className="text-sm font-medium text-white">Upgrade to Pro</p>
                <p className="text-xs font-light text-white/80">Unlock all features</p>
              </div>
            </div>
            <button className="w-full mt-2 px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all duration-200">
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Footer: User Section */}
      {user && !collapsed && (
        <div className="border-t border-gray-100 flex-shrink-0 p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name || 'Utilisateur'}</p>
              <p className="text-xs font-light text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer: Actions */}
      {(onToggleCollapse || onClose || onHomeClick || themeToggleComponent || onLogoutClick) && (
        <div className="border-t border-gray-100 flex-shrink-0 p-4">
          <div className={clsx('flex items-center gap-2', collapsed || isMobile ? 'justify-center flex-wrap' : 'justify-start')}>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className={clsx(
                  'rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all duration-200 flex items-center justify-center',
                  collapsed ? 'w-10 h-10' : 'p-2'
                )}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronRight
                  className={clsx(
                    'w-5 h-5 transition-transform duration-200',
                    collapsed && 'rotate-180'
                  )}
                />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className={clsx(
                  'rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all duration-200 flex items-center justify-center',
                  collapsed ? 'w-10 h-10' : 'p-2'
                )}
                aria-label="Fermer le menu"
                title="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            {onHomeClick && (
              <button
                onClick={onHomeClick}
                className={clsx(
                  'rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-all duration-200 flex items-center justify-center',
                  collapsed ? 'w-10 h-10' : 'p-2'
                )}
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
                className={clsx(
                  'rounded-xl transition-all duration-200 flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600',
                  collapsed ? 'w-10 h-10' : 'px-5 py-3 w-full gap-3'
                )}
                aria-label="Déconnexion"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
                {!collapsed && <span className="text-sm font-light">Log out</span>}
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
