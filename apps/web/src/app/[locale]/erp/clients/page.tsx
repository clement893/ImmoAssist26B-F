/**
 * ERP Portal - Clients Page
 *
 * Displays list of all clients with filtering and pagination.
 *
 * @module ERPClientsPage
 */

'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { ERPClientListResponse } from '@/lib/api/erp-portal';
import { DataTable } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { Column } from '@/components/ui';

/**
 * ERP Clients Page
 *
 * Shows paginated list of all clients with:
 * - Client name and email
 * - Company information
 * - Total orders and spending
 * - Active status
 *
 * @requires ERP_VIEW_CLIENTS permission
 */
function ERPClientsContent() {
  const pageSize = 10;
  const [activeFilter, setActiveFilter] = useState<boolean | null>(null);

  const { data, isLoading, error } = useApi<ERPClientListResponse>({
    url: '/v1/erp/clients',
    params: {
      skip: 0,
      limit: pageSize,
      ...(activeFilter !== null && { is_active: activeFilter }),
    },
  });

  const columns: Column<ERPClientListResponse['items'][0]>[] = [
    {
      key: 'name',
      label: 'Client Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-foreground">{value as string}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'company_name',
      label: 'Company',
      sortable: true,
      render: (value) => (value ? String(value) : '-'),
    },
    {
      key: 'total_orders',
      label: 'Orders',
      sortable: true,
      render: (value) => (value as number).toString(),
    },
    {
      key: 'total_spent',
      label: 'Total Spent',
      sortable: true,
      render: (value) => `$${parseFloat(value as string).toFixed(2)}`,
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            value
              ? 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-300'
              : 'bg-muted text-foreground'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
  ];

  if (error) {
    return (
      <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
        <p className="text-error-600 dark:text-error-400">
          Failed to load clients. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">All Clients</h1>
          <p className="text-muted-foreground">View and manage all clients in the system</p>
        </div>
        <div className="flex gap-2">
          <select
            value={activeFilter === null ? '' : activeFilter.toString()}
            onChange={(e) => {
              const val = e.target.value;
              setActiveFilter(val === '' ? null : val === 'true');
            }}
            className="px-3 py-2 border border-border rounded-lg bg-background"
          >
            <option value="">All Clients</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      <DataTable
        data={(data?.items || []) as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        loading={isLoading}
        pageSize={pageSize}
        emptyMessage="No clients found"
      />
    </div>
  );
}

export default function ERPClientsPage() {
  return (
    <ProtectedRoute>
      <ERPClientsContent />
    </ProtectedRoute>
  );
}
