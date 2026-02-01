'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Repeat,
  Calendar,
  FileText,
  Menu as MenuIcon,
  LogOut,
  Home,
} from 'lucide-react';

interface DemoLayoutProps {
  children: ReactNode;
}

export default function DemoLayout({ children }: DemoLayoutProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Home',
      href: '/demo/dashboard',
      icon: Home,
    },
    {
      name: 'Dashboard',
      href: '/demo/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Transactions',
      href: '/demo/transactions',
      icon: Repeat,
    },
    {
      name: 'Calendar',
      href: '/demo/calendar',
      icon: Calendar,
    },
    {
      name: 'Documents',
      href: '/demo/documents',
      icon: FileText,
    },
    {
      name: 'Menu Demo',
      href: '/demo/menu-demo',
      icon: MenuIcon,
    },
  ];

  const isActive = (href: string) => {
    return pathname?.includes(href);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Sidebar - Ultra Minimalist like Video Buddy */}
      <aside className="w-64 bg-white shadow-sm flex flex-col fixed h-full">
        {/* Logo/Brand */}
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">ImmoAssist</h1>
              <p className="text-xs font-light text-gray-400">Demo Pages</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-2">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-4 px-5 py-3.5 rounded-xl
                      transition-all duration-200 ease-in-out
                      ${
                        active
                          ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon
                      className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`}
                    />
                    <span className={`text-sm ${active ? 'font-medium' : 'font-light'}`}>
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Pro Badge - like Video Buddy */}
        <div className="px-4 py-4">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-light opacity-90">Upgrade to</span>
              <span className="text-xl font-semibold">Pro</span>
            </div>
            <p className="text-xs font-light opacity-80 mb-3">
              Unlock all features and get unlimited access
            </p>
            <button className="w-full bg-white text-blue-600 rounded-xl py-2 text-sm font-medium hover:bg-blue-50 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button className="flex items-center gap-3 px-5 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-light">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
