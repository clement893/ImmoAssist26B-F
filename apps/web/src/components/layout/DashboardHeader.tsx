/**
 * DashboardHeader Component
 * 
 * Modern header component for dashboard pages.
 * Includes search, notifications, user profile, and breadcrumbs.
 * Inspired by Mentorly, Outstaff, and Financial Dashboard designs.
 */

'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { Search, Bell, Menu, X, ChevronDown } from 'lucide-react';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import type { DropdownItem } from '@/components/ui/Dropdown';
import Breadcrumb from '@/components/ui/Breadcrumb';
import type { BreadcrumbItem } from '@/components/ui/Breadcrumb';
import Avatar from '@/components/ui/Avatar';

export interface DashboardHeaderProps {
  /** Page title */
  title?: string;
  /** Breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** User information */
  user?: {
    name?: string;
    email?: string;
    avatar?: string;
  } | null;
  /** Notification count */
  notificationCount?: number;
  /** User menu items */
  userMenuItems?: DropdownItem[];
  /** Search placeholder */
  searchPlaceholder?: string;
  /** On search change handler */
  onSearchChange?: (value: string) => void;
  /** Additional actions */
  actions?: ReactNode;
  /** Show search bar */
  showSearch?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Mobile menu toggle handler */
  onMobileMenuToggle?: () => void;
  /** Mobile menu open state */
  mobileMenuOpen?: boolean;
  /** Logout handler for Déconnexion in user menu */
  onLogout?: () => void;
}

export default function DashboardHeader({
  title,
  breadcrumbs,
  user,
  notificationCount = 0,
  userMenuItems = [],
  searchPlaceholder = 'Rechercher...',
  onSearchChange,
  actions,
  showSearch = false,
  className,
  onMobileMenuToggle,
  mobileMenuOpen = false,
  onLogout,
}: DashboardHeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearchChange?.(value);
  };

  // Default user menu items (Déconnexion appelle onLogout)
  const defaultUserMenuItems: DropdownItem[] = [
    ...userMenuItems,
    { label: 'Mon profil', onClick: () => router.push('/dashboard/modules/profil') },
    { label: 'Paramètres', onClick: () => router.push('/dashboard/modules/profil/settings') },
    { divider: true },
    { label: 'Déconnexion', onClick: () => onLogout?.(), variant: 'danger' },
  ];

  return (
    <header
      className={clsx(
        'sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 shadow-sm', // Dashboard V2 Style - shadow-sm
        className
      )}
    >
      <div className="px-6 sm:px-8 lg:px-10"> {/* Revamp UI - Padding augmenté */}
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6"> {/* Revamp UI - Height et gap augmentés */}
          {/* Left Section: Mobile Menu + Title/Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {/* Mobile Menu Button - Dashboard V2 Style */}
            {onMobileMenuToggle && (
              <button
                onClick={onMobileMenuToggle}
                className="lg:hidden p-2.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors" // Dashboard V2 Style
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-4 h-4 text-gray-600" />
                ) : (
                  <Menu className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}

            {/* Title or Breadcrumbs - Dashboard V2 Style */}
            <div className="flex-1 min-w-0">
              {breadcrumbs && breadcrumbs.length > 0 ? (
                <Breadcrumb items={breadcrumbs} className="text-xs sm:text-sm" />
              ) : title ? (
                <div className="flex items-center gap-4">
                  {/* Logo - Dashboard V2 Style */}
                  <div className="bg-black rounded-full w-14 h-14 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">IA</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-neutral-100 truncate"> {/* Dashboard V2 Style */}
                      {title}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard</p> {/* Dashboard V2 Style - Sous-titre */}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Center Section: Search (if enabled) */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 pr-4 w-full"
                />
              </div>
            </div>
          )}

          {/* Right Section: Actions + Notifications + User */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Additional Actions */}
            {actions}

            {/* Notifications - Dashboard V2 Style */}
            <button
              className="relative p-2.5 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors" // Dashboard V2 Style
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-gray-600" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* User Profile */}
            {user && (
              <Dropdown
                trigger={
                  <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-modern"> {/* UI Revamp - Transition moderne */}
                    {user.avatar ? (
                      <Avatar src={user.avatar} alt={user.name || user.email || 'User'} className="w-8 h-8" />
                    ) : (
                      <Avatar
                        name={user.name || user.email || 'User'}
                        className="w-8 h-8"
                        fallback={user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      />
                    )}
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {user.name || 'Utilisateur'}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[120px]">
                        {user.email}
                      </p>
                    </div>
                    <ChevronDown className="hidden lg:block w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  </button>
                }
                items={defaultUserMenuItems}
                position="bottom-end"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
