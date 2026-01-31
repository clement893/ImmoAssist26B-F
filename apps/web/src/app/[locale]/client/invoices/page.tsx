/**
 * Client Portal - Invoices Page
 *
 * Displays list of client invoices with filtering and pagination.
 *
 * @module ClientInvoicesPage
 */

'use client';

import { useApi } from '@/hooks/useApi';
import { ClientInvoiceListResponse } from '@/lib/api/client-portal';
import { DataTable } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { Column } from '@/components/ui';

/**
 * Client Invoices Page
 *
 * Shows paginated list of invoices with:
 * - Invoice number
 * - Amount and status
 * - Due date
 * - Payment status
 *
 * @requires CLIENT_VIEW_INVOICES permission
 */
function ClientInvoicesContent() {
  const pageSize = 10;

  const { data, isLoading, error } = useApi<ClientInvoiceListResponse>({
    url: '/v1/client/invoices',
    params: {
      skip: 0,
      limit: pageSize,
    },
  });

  const columns: Column<ClientInvoiceListResponse['items'][0]>[] = [
    {
      key: 'invoice_number',
      label: 'Invoice #',
      sortable: true,
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => `$${parseFloat(value as string).toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            value === 'paid'
              ? 'bg-success-100 text-success-800'
              : value === 'pending'
                ? 'bg-warning-100 text-warning-800'
                : 'bg-muted text-foreground'
          }`}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: 'invoice_date',
      label: 'Date',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      render: (value) => (value ? new Date(value as string).toLocaleDateString() : '-'),
    },
  ];

  if (error) {
    return (
      <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
        <p className="text-error-600 dark:text-error-400">
          Failed to load invoices. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">My Invoices</h1>
        <p className="text-muted-foreground">View and download your invoices</p>
      </div>

      <DataTable
        data={(data?.items || []) as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        loading={isLoading}
        pageSize={pageSize}
        emptyMessage="No invoices found"
      />
    </div>
  );
}

export default function ClientInvoicesPage() {
  return (
    <ProtectedRoute>
      <ClientInvoicesContent />
    </ProtectedRoute>
  );
}
