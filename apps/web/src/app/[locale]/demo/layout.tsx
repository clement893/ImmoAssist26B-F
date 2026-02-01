'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Calendar,
  FileText,
  Home,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';

interface DemoLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/demo/dashboard', icon: LayoutDashboard },
  { name: 'Transactions', href: '/demo/transactions', icon: Receipt },
  { name: 'Calendar', href: '/demo/calendar', icon: Calendar },
  { name: 'Documents', href: '/demo/documents', icon: FileText },
];

export default function DemoLayout({ children }: DemoLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white shadow-sm">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-md">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">ImmoAssist</h1>
            <p className="text-xs text-slate-500">Demo Pages</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname?.includes(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="h-4 w-4 text-indigo-600" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-slate-50 p-4">
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
            <Settings className="h-5 w-5 text-slate-400" />
            <span>Settings</span>
          </button>
          <button className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
            <LogOut className="h-5 w-5 text-slate-400" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="mx-auto max-w-7xl p-8">{children}</div>
      </main>
    </div>
  );
}
