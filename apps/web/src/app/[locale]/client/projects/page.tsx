/**
 * Client Portal - Projects Page
 *
 * Displays list of client projects with filtering and pagination.
 *
 * @module ClientProjectsPage
 */

'use client';

import { useApi } from '@/hooks/useApi';
import { ClientProjectListResponse } from '@/lib/api/client-portal';
import { DataTable } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { Column } from '@/components/ui';

/**
 * Client Projects Page
 *
 * Shows paginated list of projects with:
 * - Project name and description
 * - Status
 * - Progress
 * - Dates
 *
 * @requires CLIENT_VIEW_PROJECTS permission
 */
function ClientProjectsContent() {
  const pageSize = 10;

  const { data, isLoading, error } = useApi<ClientProjectListResponse>({
    url: '/v1/client/projects',
    params: {
      skip: 0,
      limit: pageSize,
    },
  });

  const columns: Column<ClientProjectListResponse['items'][0]>[] = [
    {
      key: 'name',
      label: 'Project Name',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            value === 'active'
              ? 'bg-success-100 text-success-800'
              : value === 'completed'
                ? 'bg-info-100 text-info-800'
                : 'bg-muted text-foreground'
          }`}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: 'progress',
      label: 'Progress',
      sortable: true,
      render: (value) => {
        const progress =
          typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2">
              <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
        );
      },
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
          Failed to load projects. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">My Projects</h1>
        <p className="text-muted-foreground">Track your project progress and status</p>
      </div>

      <DataTable
        data={(data?.items || []) as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        loading={isLoading}
        pageSize={pageSize}
        emptyMessage="No projects found"
      />
    </div>
  );
}

export default function ClientProjectsPage() {
  return (
    <ProtectedRoute>
      <ClientProjectsContent />
    </ProtectedRoute>
  );
}
