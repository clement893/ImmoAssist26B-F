/**
 * ERP Portal - Orders Page
 *
 * Placeholder page for order management (will be implemented when Order model exists).
 *
 * @module ERPOrdersPage
 */

'use client';

import { Card } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

/**
 * ERP Orders Page
 *
 * Placeholder page for order management.
 * Will be fully implemented when Order model is created.
 *
 * @requires ERP_VIEW_ALL_ORDERS permission
 */
function ERPOrdersContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Order Management</h1>
        <p className="text-muted-foreground">Manage all orders in the system</p>
      </div>

      <Card title="Coming Soon">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Order management will be available once the Order model is implemented.
          </p>
          <p className="text-sm text-muted-foreground">
            This feature is planned for a future update.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function ERPOrdersPage() {
  return (
    <ProtectedRoute>
      <ERPOrdersContent />
    </ProtectedRoute>
  );
}
