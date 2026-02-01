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
            'flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
            // Modern circular icon design like in the image
            collapsed 
              ? 'justify-center p-2' 
              : 'px-4 py-2.5 rounded-xl', // Revamp UI - Padding augmenté, border radius moderne
            isActive 
              ? collapsed
                ? 'bg-primary-600/20' 
                : 'bg-primary-600/10 text-white border-l-2 border-primary-500'
              : collapsed
                ? 'hover:bg-neutral-700/50'
                : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-white',
            level > 0 && !collapsed && 'ml-4' // Indentation for nested items
          )}
        >
          {item.href ? (
            <Link 
              href={item.href} 
              className={clsx(
                'flex items-center min-w-0 transition-all',
                collapsed ? 'justify-center' : 'flex-1 space-x-3'
              )}
            >
              {item.icon && (
                <span className={clsx(
                  'flex-shrink-0 flex items-center justify-center transition-all rounded-full',
                  collapsed 
                    ? 'w-10 h-10' 
                    : 'w-9 h-9',
                  isActive 
                    ? 'bg-primary-500 text-white' 
                    : 'text-neutral-400 hover:text-white'
                )}>
                  {item.icon}
                </span>
              )}
              {!collapsed && <span className="flex-1 truncate text-sm font-medium">{item.label}</span>}
            </Link>
          ) : (
            <button
              onClick={item.onClick || (hasChildren ? () => toggleItem(item.label) : undefined)}
              className={clsx(
                'flex items-center min-w-0 text-left transition-all',
                collapsed ? 'justify-center' : 'flex-1 space-x-3'
              )}
              aria-expanded={hasChildren ? isExpanded : undefined}
              aria-label={hasChildren ? `Toggle ${item.label}` : item.label}
            >
              {item.icon && (
                <span className={clsx(
                  'flex-shrink-0 flex items-center justify-center transition-all rounded-full',
                  collapsed 
                    ? 'w-10 h-10' 
                    : 'w-9 h-9',
                  isActive 
                    ? 'bg-primary-500 text-white' 
                    : 'text-neutral-400 hover:text-white'
                )}>
                  {item.icon}
                </span>
              )}
              {!collapsed && <span className="flex-1 truncate text-sm font-medium">{item.label}</span>}
            </button>
          )}

          {!collapsed && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              {item.badge && (
                <span className={clsx(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {item.badge}
                </span>
              )}
              {hasChildren &&
                (isExpanded ? (
                  <ChevronDown className={clsx(
                    "w-4 h-4 transition-transform",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                ) : (
                  <ChevronRight className={clsx(
                    "w-4 h-4 transition-transform",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )} />
                ))}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1 space-y-1 ml-4 border-l-2 border-neutral-700/50 pl-3">
            {item.children!.map((child) => renderItem(child, level + 1))}
          </div>
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
        'bg-neutral-800 dark:bg-neutral-900 border-r border-neutral-700/50 h-full transition-all duration-300 ease-natural flex flex-col', // Revamp UI - Easing naturel
        'shadow-lg backdrop-blur-sm', // Revamp UI - Backdrop blur
        collapsed ? 'w-18' : 'w-72 md:w-80 lg:w-96', // Revamp UI - Largeurs augmentées
        className
      )}
    >
      {/* Header: AI Model Selector (like ChatGPT AI in image) */}
      {!collapsed && (
        <div className="p-3 border-b border-neutral-700/50 flex-shrink-0">
          <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-800/50 rounded-lg p-1.5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Léa AI</p>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          </div>
        </div>
      )}
      
      {/* Collapsed: Just show icon */}
      {collapsed && (
        <div className="p-3 border-b border-gray-800/50 flex-shrink-0 flex justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Search Bar (UX/UI improvements - Batch 8) */}
      {showSearch && !collapsed && (
        <div className="px-lg py-md border-b border-border/50 flex-shrink-0 bg-background/30 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-10 text-sm bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
              aria-label="Rechercher dans la navigation"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <nav className={clsx('flex-1 overflow-y-auto', collapsed ? 'p-1.5 space-y-1.5' : 'p-2.5 space-y-1')}>
        {filteredItems.length === 0 ? (
          <div className={clsx('text-sm text-neutral-400 text-center', collapsed ? 'px-2 py-4' : 'px-lg py-md')}>
            Aucun résultat trouvé
          </div>
        ) : (
          filteredItems.map((item) => renderItem(item))
        )}
      </nav>

      {/* Footer: User Avatar at bottom (like in image) */}
      {user && (
        <div className={clsx('border-t border-neutral-700/50 flex-shrink-0', collapsed ? 'p-1.5' : 'p-3')}>
          {collapsed ? (
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#171717] dark:border-[#0a0a0a]" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#171717] dark:border-[#0a0a0a]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name || 'Utilisateur'}</p>
                <p className="text-xs text-neutral-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer: Actions (Collapse, Close, Home, Theme, Logout) */}
      {(onToggleCollapse || onClose || onHomeClick || themeToggleComponent || onLogoutClick) && (
        <div className={clsx('border-t border-gray-800/50 flex-shrink-0', collapsed ? 'p-1.5' : 'p-2.5')}>
          <div className={clsx('flex items-center gap-2', collapsed || isMobile ? 'justify-center flex-wrap' : 'justify-start')}>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className={clsx(
                  'rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all duration-200 ease-out flex items-center justify-center',
                  collapsed ? 'w-10 h-10' : 'p-2 min-h-[44px] min-w-[44px]'
                )}
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
                className={clsx(
                  'rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all duration-200 ease-out flex items-center justify-center',
                  collapsed ? 'w-10 h-10' : 'p-2 min-h-[44px] min-w-[44px]'
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
                  'rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all duration-200 ease-out flex items-center justify-center',
                  collapsed ? 'w-10 h-10' : 'p-2 min-h-[44px] min-w-[44px]'
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
                  'rounded-lg hover:bg-red-600/20 text-red-400 hover:text-red-300 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-center',
                  collapsed ? 'w-10 h-10' : 'p-2 min-h-[44px] min-w-[44px]'
                )}
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
