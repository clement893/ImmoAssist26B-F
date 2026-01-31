/**
 * ERP Portal Layout
 *
 * Layout wrapper for all ERP/Employee portal pages.
 * Provides ERP-specific navigation and structure with module organization.
 *
 * @module ERPPortalLayout
 */

import { ERPNavigation } from '@/components/erp';
import { Container } from '@/components/ui';
import { ErrorBoundary } from '@/components/errors';

export default function ERPPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-muted">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-background border-r border-border p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">ERP Portal</h2>
            <p className="text-sm text-muted-foreground">
              Manage orders, inventory, clients, and more
            </p>
          </div>
          <ErrorBoundary>
            <ERPNavigation />
          </ErrorBoundary>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Container>
            <ErrorBoundary>{children}</ErrorBoundary>
          </Container>
        </main>
      </div>
    </ErrorBoundary>
  );
}
