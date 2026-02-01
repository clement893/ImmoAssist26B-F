/** * Settings Navigation Component * * Navigation component for settings pages with links to different settings sections. * Displays a grid of setting cards that link to respective settings pages. * * @component * @example * ```tsx * <SettingsNavigation /> * ``` */ 'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import {
  Settings,
  Building2,
  Users,
  CreditCard,
  Puzzle,
  Key,
  Shield,
  Bell,
  UserCog,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
export interface SettingsNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  badge?: string | number;
}
export interface SettingsNavigationProps {
  className?: string;
}
/** * Settings Navigation Component * * Displays a grid of setting cards for navigation to different settings pages. */ export default function SettingsNavigation({
  className,
}: SettingsNavigationProps) {
  const pathname = usePathname();
  const t = useTranslations('settings');
  const navItems: SettingsNavItem[] = [
    {
      id: 'general',
      label: t('navigation.general') || 'General',
      href: '/settings/general',
      icon: <Settings className="w-6 h-6" />,
      description:
        t('navigation.generalDescription') || 'Basic application settings and preferences',
    },
    {
      id: 'organization',
      label: t('navigation.organization') || 'Organization',
      href: '/settings/organization',
      icon: <Building2 className="w-6 h-6" />,
      description:
        t('navigation.organizationDescription') || 'Organization name, logo, and domain settings',
    },
    {
      id: 'team',
      label: t('navigation.team') || 'Team',
      href: '/settings/team',
      icon: <Users className="w-6 h-6" />,
      description: t('navigation.teamDescription') || 'Manage team members and permissions',
    },
    {
      id: 'billing',
      label: t('navigation.billing') || 'Billing',
      href: '/settings/billing',
      icon: <CreditCard className="w-6 h-6" />,
      description: t('navigation.billingDescription') || 'Billing and subscription management',
    },
    {
      id: 'integrations',
      label: t('navigation.integrations') || 'Integrations',
      href: '/settings/integrations',
      icon: <Puzzle className="w-6 h-6" />,
      description:
        t('navigation.integrationsDescription') || 'Third-party integrations and connections',
    },
    {
      id: 'api',
      label: t('navigation.api') || 'API',
      href: '/settings/api',
      icon: <Key className="w-6 h-6" />,
      description: t('navigation.apiDescription') || 'API configuration and settings',
    },
    {
      id: 'security',
      label: t('navigation.security') || 'Security',
      href: '/settings/security',
      icon: <Shield className="w-6 h-6" />,
      description: t('navigation.securityDescription') || 'Security settings, 2FA, and sessions',
    },
    {
      id: 'notifications',
      label: t('navigation.notifications') || 'Notifications',
      href: '/settings/notifications',
      icon: <Bell className="w-6 h-6" />,
      description:
        t('navigation.notificationsDescription') || 'Notification preferences and settings',
    },
    {
      id: 'preferences',
      label: t('navigation.preferences') || 'Preferences',
      href: '/settings/preferences',
      icon: <UserCog className="w-6 h-6" />,
      description: t('navigation.preferencesDescription') || 'User preferences and personalization',
    },
    {
      id: 'logs',
      label: t('navigation.logs') || 'Logs',
      href: '/admin-logs/testing',
      icon: <FileText className="w-6 h-6" />,
      description: t('navigation.logsDescription') || 'View system logs and audit trail',
    },
  ];
  const isActive = (href: string) => {
    if (href === '/settings') {
      return pathname === '/settings';
    }
    return pathname?.startsWith(href);
  };
  return (
    <div className={clsx('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {' '}
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link key={item.id} href={item.href}>
            {' '}
            <Card
              className={clsx(
                'h-full transition-modern', // UI Revamp - Transition moderne
                active
                  ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:shadow-standard-lg hover:border-primary-300 dark:hover:border-primary-700', // UI Revamp - Nouveau système d'ombres
                'cursor-pointer'
              )}
              hover
            >
              {' '}
              <div className="flex items-start space-x-4">
                {' '}
                <div
                  className={clsx(
                    'flex-shrink-0 p-3 rounded-lg',
                    active
                      ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {' '}
                  {item.icon}{' '}
                </div>{' '}
                <div className="flex-1 min-w-0">
                  {' '}
                  <div className="flex items-center justify-between">
                    {' '}
                    <h3
                      className={clsx(
                        'text-lg font-semibold',
                        active ? 'text-primary-900 dark:text-primary-100' : 'text-foreground'
                      )}
                    >
                      {' '}
                      {item.label}{' '}
                    </h3>{' '}
                    {item.badge && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
                        {' '}
                        {item.badge}{' '}
                      </span>
                    )}{' '}
                  </div>{' '}
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {' '}
                    {item.description}{' '}
                  </p>{' '}
                </div>{' '}
              </div>{' '}
            </Card>{' '}
          </Link>
        );
      })}{' '}
    </div>
  );
}
