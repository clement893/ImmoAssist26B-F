/**
 * Client Portal Dashboard Page
 *
 * Main dashboard page for client portal.
 * Shows overview statistics and quick access to client resources.
 *
 * @module ClientDashboardPage
 */

'use client';

import { ClientDashboard } from '@/components/client';
import { Card } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

/**
 * Client Dashboard Page
 *
 * Displays:
 * - Dashboard statistics (orders, invoices, projects, tickets)
 * - Financial overview
 * - Quick actions
 *
 * @requires CLIENT_VIEW_PROFILE permission
 */
function ClientDashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Client Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your client portal. Here's an overview of your account.
        </p>
      </div>

      <ClientDashboard />

      <Card title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/client/invoices"
            className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <h3 className="font-semibold text-foreground mb-1">View Invoices</h3>
            <p className="text-sm text-muted-foreground">View and download your invoices</p>
          </a>
          <a
            href="/client/projects"
            className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <h3 className="font-semibold text-foreground mb-1">View Projects</h3>
            <p className="text-sm text-muted-foreground">Track your project progress</p>
          </a>
          <a
            href="/client/tickets"
            className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <h3 className="font-semibold text-foreground mb-1">Support Tickets</h3>
            <p className="text-sm text-muted-foreground">Get help from our support team</p>
          </a>
        </div>
      </Card>
    </div>
  );
}

export default function ClientDashboardPage() {
  return (
    <ProtectedRoute>
      <ClientDashboardContent />
    </ProtectedRoute>
  );
}
