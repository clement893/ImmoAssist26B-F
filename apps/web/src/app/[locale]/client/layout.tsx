/**
 * Client Portal Layout
 *
 * Layout wrapper for all client portal pages.
 * Provides client-specific navigation and structure.
 *
 * @module ClientPortalLayout
 */

import { ClientNavigation } from '@/components/client';
import { Container } from '@/components/ui';
import { ErrorBoundary } from '@/components/errors';

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-muted">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-background border-r border-border p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Client Portal</h2>
            <p className="text-sm text-muted-foreground">
              Manage your orders, invoices, and projects
            </p>
          </div>
          <ErrorBoundary>
            <ClientNavigation />
          </ErrorBoundary>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Container>
            <ErrorBoundary>{children}</ErrorBoundary>
          </Container>
        </main>
      </div>
    </ErrorBoundary>
  );
}
