'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, MessageSquare, CheckSquare } from 'lucide-react';
import { clsx } from 'clsx';

const items = [
  { label: 'Dashboard', href: '/dashboard/portail-client/client', icon: LayoutDashboard },
  { label: 'Documents', href: '/dashboard/portail-client/client/documents', icon: FileText },
  { label: 'Messagerie', href: '/dashboard/portail-client/client/messages', icon: MessageSquare },
  { label: 'Tâches', href: '/dashboard/portail-client/client/taches', icon: CheckSquare },
];

export function PortailClientNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href || (item.href !== '/dashboard/portail-client/client' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
