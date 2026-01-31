/**
 * DashboardHeader Component
 * 
 * Modern header component for dashboard pages.
 * Includes search, notifications, user profile, and breadcrumbs.
 * Inspired by Mentorly, Outstaff, and Financial Dashboard designs.
 */

'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Search, Bell, Menu, X, ChevronDown } from 'lucide-react';
import Input from '@/components/ui/Input';
import Dropdown from '@/components/ui/Dropdown';
import type { DropdownItem } from '@/components/ui/Dropdown';
import Breadcrumb from '@/components/ui/Breadcrumb';
import type { BreadcrumbItem } from '@/components/ui/Breadcrumb';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar';

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
}: DashboardHeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const pathname = usePathname();

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearchChange?.(value);
  };

  // Default user menu items
  const defaultUserMenuItems: DropdownItem[] = [
    ...userMenuItems,
    { label: 'Mon profil', href: '/dashboard/modules/profil' },
    { label: 'Paramètres', href: '/dashboard/modules/profil/settings' },
    { type: 'divider' },
    { label: 'Déconnexion', onClick: () => {}, variant: 'danger' },
  ];

  return (
    <header
      className={clsx(
        'sticky top-0 z-30 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm',
        className
      )}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Left Section: Mobile Menu + Title/Breadcrumbs */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            {onMobileMenuToggle && (
              <button
                onClick={onMobileMenuToggle}
                className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                ) : (
                  <Menu className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                )}
              </button>
            )}

            {/* Title or Breadcrumbs */}
            <div className="flex-1 min-w-0">
              {breadcrumbs && breadcrumbs.length > 0 ? (
                <Breadcrumb items={breadcrumbs} className="text-xs sm:text-sm" />
              ) : title ? (
                <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {title}
                </h1>
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

            {/* Notifications */}
            <button
              className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white dark:ring-neutral-900" />
              )}
            </button>

            {/* User Profile */}
            {user && (
              <Dropdown
                trigger={
                  <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <Avatar className="w-8 h-8">
                      {user.avatar && <AvatarImage src={user.avatar} alt={user.name || user.email || 'User'} />}
                      <AvatarFallback>
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
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
                align="right"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
