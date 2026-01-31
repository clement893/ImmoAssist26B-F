/**
 * ERP Portal - Inventory Page
 *
 * Placeholder page for inventory management (will be implemented when Inventory model exists).
 *
 * @module ERPInventoryPage
 */

'use client';

import { Card } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

/**
 * ERP Inventory Page
 *
 * Placeholder page for inventory management.
 * Will be fully implemented when Product/Inventory models are created.
 *
 * @requires ERP_VIEW_INVENTORY permission
 */
function ERPInventoryContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Inventory Management</h1>
        <p className="text-muted-foreground">Manage products and stock levels</p>
      </div>

      <Card title="Coming Soon">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Inventory management will be available once the Product and Inventory models are
            implemented.
          </p>
          <p className="text-sm text-muted-foreground">
            This feature is planned for a future update.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function ERPInventoryPage() {
  return (
    <ProtectedRoute>
      <ERPInventoryContent />
    </ProtectedRoute>
  );
}
