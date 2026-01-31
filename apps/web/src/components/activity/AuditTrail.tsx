/** * Audit Trail Component * System audit trail with detailed change tracking */ 'use client';
import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { ColorVariant } from '@/components/ui/types';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { Shield, Filter } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
export interface AuditTrailEntry extends Record<string, unknown> {
  id: string;
  timestamp: string;
  user: { id: string; name: string; email: string; avatar?: string };
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout';
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  changes?: { field: string; oldValue: unknown; newValue: unknown }[];
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  reason?: string;
}
export interface AuditTrailProps {
  entries: AuditTrailEntry[];
  onFilterChange?: (filters: AuditFilters) => void;
  className?: string;
}
export interface AuditFilters {
  user?: string;
  action?: AuditTrailEntry['action'];
  resourceType?: string;
  status?: AuditTrailEntry['status'];
  dateRange?: { start: string; end: string };
}
const actionColors: Record<AuditTrailEntry['action'], ColorVariant> = {
  create: 'success',
  update: 'info',
  delete: 'error',
  view: 'default',
  export: 'info',
  login: 'success',
  logout: 'default',
};
export default function AuditTrail({ entries, onFilterChange, className }: AuditTrailProps) {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [selectedEntry, setSelectedEntry] = useState<AuditTrailEntry | null>(null);
  const filteredEntries = useMemo(() => {
    let filtered = entries;
    if (filters.user) {
      filtered = filtered.filter((e) => e.user.id === filters.user);
    }
    if (filters.action) {
      filtered = filtered.filter((e) => e.action === filters.action);
    }
    if (filters.resourceType) {
      filtered = filtered.filter((e) => e.resourceType === filters.resourceType);
    }
    if (filters.status) {
      filtered = filtered.filter((e) => e.status === filters.status);
    }
    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      filtered = filtered.filter((e) => {
        const date = new Date(e.timestamp);
        return date >= start && date <= end;
      });
    }
    return filtered;
  }, [entries, filters]);
  const uniqueActions = useMemo(() => {
    const actions = new Set(entries.map((e) => e.action));
    return Array.from(actions) as AuditTrailEntry['action'][];
  }, [entries]);
  const uniqueResourceTypes = useMemo(() => {
    const types = new Set(entries.map((e) => e.resourceType));
    return Array.from(types);
  }, [entries]);
  const columns: Column<AuditTrailEntry>[] = [
    {
      key: 'timestamp',
      label: 'Time',
      sortable: true,
      render: (value) => (
        <div className="text-foreground">
          {' '}
          <div className="font-medium text-sm">
            {' '}
            {new Date(value as string).toLocaleDateString()}{' '}
          </div>{' '}
          <div className="text-xs text-muted-foreground">
            {' '}
            {new Date(value as string).toLocaleTimeString()}{' '}
          </div>{' '}
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (_, entry) => (
        <div className="flex items-center gap-2">
          {' '}
          <Avatar src={entry.user.avatar} name={entry.user.name} size="sm" />{' '}
          <div>
            {' '}
            <div className="text-sm font-medium text-foreground"> {entry.user.name} </div>{' '}
            <div className="text-xs text-muted-foreground"> {entry.user.email} </div>{' '}
          </div>{' '}
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (value) => {
        const action = value as AuditTrailEntry['action'];
        const color = actionColors[action] || 'default';
        return <Badge variant={color}>{action}</Badge>;
      },
    },
    {
      key: 'resourceType',
      label: 'Resource',
      render: (value, entry) => (
        <div>
          {' '}
          <div className="text-sm font-medium text-foreground"> {value as string} </div>{' '}
          {entry.resourceName && (
            <div className="text-xs text-muted-foreground"> {entry.resourceName} </div>
          )}{' '}
          <div className="text-xs text-muted-foreground font-mono">
            {' '}
            ID: {entry.resourceId}{' '}
          </div>{' '}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const status = value as AuditTrailEntry['status'];
        const variants = {
          success: 'success' as const,
          failure: 'error' as const,
          warning: 'warning' as const,
        };
        return <Badge variant={variants[status]}>{status}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'Details',
      render: (_, entry) => (
        <button
          onClick={() => setSelectedEntry(entry)}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
        >
          {' '}
          View Details{' '}
        </button>
      ),
    },
  ];
  return (
    <>
      {' '}
      <Card className={clsx('bg-background', className)}>
        {' '}
        <div className="mb-6">
          {' '}
          <div className="flex items-center justify-between mb-4">
            {' '}
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              {' '}
              <Shield className="w-5 h-5" /> Audit Trail{' '}
            </h3>{' '}
            <div className="text-sm text-muted-foreground">
              {' '}
              {filteredEntries.length} of {entries.length} entries{' '}
            </div>{' '}
          </div>{' '}
          {/* Filters */}{' '}
          <div className="flex items-center gap-4 flex-wrap">
            {' '}
            <div className="flex items-center gap-2">
              {' '}
              <Filter className="w-4 h-4 text-muted-foreground" />{' '}
              <select
                value={filters.action || ''}
                onChange={(e) => {
                  const newFilters = {
                    ...filters,
                    action: e.target.value as AuditTrailEntry['action'] | undefined,
                  };
                  setFilters(newFilters);
                  onFilterChange?.(newFilters);
                }}
                className={clsx(
                  'px-3 py-2 border rounded-lg text-sm',
                  'bg-background',
                  'text-foreground',
                  'border-border',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
                )}
              >
                {' '}
                <option value="">All Actions</option>{' '}
                {uniqueActions.map((action) => (
                  <option key={action} value={action}>
                    {' '}
                    {action.charAt(0).toUpperCase() + action.slice(1)}{' '}
                  </option>
                ))}{' '}
              </select>{' '}
              <select
                value={filters.resourceType || ''}
                onChange={(e) => {
                  const newFilters = { ...filters, resourceType: e.target.value || undefined };
                  setFilters(newFilters);
                  onFilterChange?.(newFilters);
                }}
                className={clsx(
                  'px-3 py-2 border rounded-lg text-sm',
                  'bg-background',
                  'text-foreground',
                  'border-border',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
                )}
              >
                {' '}
                <option value="">All Resources</option>{' '}
                {uniqueResourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {' '}
                    {type}{' '}
                  </option>
                ))}{' '}
              </select>{' '}
              <select
                value={filters.status || ''}
                onChange={(e) => {
                  const newFilters = {
                    ...filters,
                    status: e.target.value as AuditTrailEntry['status'] | undefined,
                  };
                  setFilters(newFilters);
                  onFilterChange?.(newFilters);
                }}
                className={clsx(
                  'px-3 py-2 border rounded-lg text-sm',
                  'bg-background',
                  'text-foreground',
                  'border-border',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
                )}
              >
                {' '}
                <option value="">All Status</option> <option value="success">Success</option>{' '}
                <option value="failure">Failure</option>{' '}
                <option value="warning">Warning</option>{' '}
              </select>{' '}
            </div>{' '}
          </div>{' '}
        </div>{' '}
        <DataTable
          data={filteredEntries as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          pageSize={20}
          emptyMessage="No audit entries found"
        />{' '}
      </Card>{' '}
      {/* Details Modal */}{' '}
      {selectedEntry && (
        <Modal
          isOpen={!!selectedEntry}
          onClose={() => setSelectedEntry(null)}
          title="Audit Entry Details"
          size="lg"
        >
          {' '}
          <div className="space-y-4">
            {' '}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {' '}
              <div>
                {' '}
                <div className="text-muted-foreground">Timestamp</div>{' '}
                <div className="font-medium text-foreground">
                  {' '}
                  {new Date(selectedEntry.timestamp).toLocaleString()}{' '}
                </div>{' '}
              </div>{' '}
              <div>
                {' '}
                <div className="text-muted-foreground">User</div>{' '}
                <div className="font-medium text-foreground"> {selectedEntry.user.name} </div>{' '}
              </div>{' '}
              <div>
                {' '}
                <div className="text-muted-foreground">Action</div>{' '}
                <div className="font-medium text-foreground"> {selectedEntry.action} </div>{' '}
              </div>{' '}
              <div>
                {' '}
                <div className="text-muted-foreground">Resource</div>{' '}
                <div className="font-medium text-foreground">
                  {' '}
                  {selectedEntry.resourceType} ({selectedEntry.resourceId}){' '}
                </div>{' '}
              </div>{' '}
              {selectedEntry.ipAddress && (
                <div>
                  {' '}
                  <div className="text-muted-foreground">IP Address</div>{' '}
                  <div className="font-medium text-foreground font-mono">
                    {' '}
                    {selectedEntry.ipAddress}{' '}
                  </div>{' '}
                </div>
              )}{' '}
              {selectedEntry.userAgent && (
                <div>
                  {' '}
                  <div className="text-muted-foreground">User Agent</div>{' '}
                  <div className="font-medium text-foreground text-xs">
                    {' '}
                    {selectedEntry.userAgent}{' '}
                  </div>{' '}
                </div>
              )}{' '}
            </div>{' '}
            {selectedEntry.changes && selectedEntry.changes.length > 0 && (
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground mb-2"> Changes </div>{' '}
                <div className="space-y-2">
                  {' '}
                  {selectedEntry.changes.map((change, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg border border-border">
                      {' '}
                      <div className="font-medium text-sm text-foreground mb-1">
                        {' '}
                        {change.field}{' '}
                      </div>{' '}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {' '}
                        <div>
                          {' '}
                          <div className="text-muted-foreground">Old Value</div>{' '}
                          <div className="text-foreground font-mono">
                            {' '}
                            {JSON.stringify(change.oldValue)}{' '}
                          </div>{' '}
                        </div>{' '}
                        <div>
                          {' '}
                          <div className="text-muted-foreground">New Value</div>{' '}
                          <div className="text-foreground font-mono">
                            {' '}
                            {JSON.stringify(change.newValue)}{' '}
                          </div>{' '}
                        </div>{' '}
                      </div>{' '}
                    </div>
                  ))}{' '}
                </div>{' '}
              </div>
            )}{' '}
            {selectedEntry.reason && (
              <div>
                {' '}
                <div className="text-sm font-medium text-foreground mb-2"> Reason </div>{' '}
                <div className="text-sm text-foreground"> {selectedEntry.reason} </div>{' '}
              </div>
            )}{' '}
          </div>{' '}
        </Modal>
      )}{' '}
    </>
  );
}
