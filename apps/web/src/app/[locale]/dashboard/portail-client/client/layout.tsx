'use client';

import { PortailClientNavigation } from '@/components/portail-client/PortailClientNavigation';

export default function PortailClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 p-6 flex-shrink-0">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Mon portail</h2>
          <p className="text-xs text-gray-500 mt-1">Votre espace client</p>
        </div>
        <PortailClientNavigation />
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
