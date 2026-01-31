'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Shield, Download, AlertCircle, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { apiClient } from '@/lib/api';

interface AuditLog {
  id: number;
  timestamp: string;
  event_type: string;
  severity: string;
  user_id?: number;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  request_method?: string;
  request_path?: string;
  description: string;
  event_metadata?: Record<string, unknown>;
  success: string;
}

interface AuditTrailViewerProps {
  className?: string;
}

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  critical: AlertCircle,
};

const severityColors = {
  info: 'text-primary-600 dark:text-primary-400',
  warning: 'text-warning-600 dark:text-warning-400',
  error: 'text-error-600 dark:text-error-400',
  critical: 'text-error-800 dark:text-error-600',
};

const successIcons = {
  success: CheckCircle,
  failure: XCircle,
  unknown: Info,
};

const successColors = {
  success: 'text-success-600 dark:text-success-400',
  failure: 'text-error-600 dark:text-error-400',
  unknown: 'text-muted-foreground',
};

export function AuditTrailViewer({ className = '' }: AuditTrailViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    event_type: '',
    severity: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | boolean | undefined> = {};
      if (filters.event_type) params.event_type = filters.event_type;
      if (filters.severity) params.severity = filters.severity;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await apiClient.get<AuditLog[]>('/v1/audit-trail/audit-trail', { params });
      if (response.data) {
        setLogs(response.data);
      }
    } catch (error) {
      logger.error('', 'Failed to fetch audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    // Export logs as CSV
    const headers = ['Timestamp', 'Event Type', 'Severity', 'User', 'IP Address', 'Description', 'Success'];
    const rows = logs.map((log) => [
      log.timestamp,
      log.event_type,
      log.severity,
      log.user_email || 'N/A',
      log.ip_address || 'N/A',
      log.description,
      log.success,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <div className="text-center py-8 text-muted-foreground">Loading audit trail...</div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Audit Trail
        </h3>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-muted rounded-lg">
        <div>
          <label className="block text-xs font-medium mb-1">Event Type</label>
          <Input
            value={filters.event_type}
            onChange={(e) => setFilters({ ...filters, event_type: e.target.value })}
            placeholder="Filter by type"
            className="text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Severity</label>
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
          >
            <option value="">All</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Start Date</label>
          <Input
            type="date"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">End Date</label>
          <Input
            type="date"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="text-sm"
          />
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>No audit logs found</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logs.map((log) => {
            const SeverityIcon = severityIcons[log.severity as keyof typeof severityIcons] || Info;
            const severityColor =
              severityColors[log.severity as keyof typeof severityColors] || 'text-muted-foreground';
            const SuccessIcon = successIcons[log.success as keyof typeof successIcons] || Info;
            const successColor =
              successColors[log.success as keyof typeof successColors] || 'text-muted-foreground';

            return (
              <div
                key={log.id}
                className="p-3 border border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <SeverityIcon className={`h-4 w-4 ${severityColor}`} />
                    <span className="font-medium text-sm">{log.event_type}</span>
                    <SuccessIcon className={`h-4 w-4 ${successColor}`} />
                    <span className={`text-xs capitalize ${successColor}`}>{log.success}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-foreground mb-2">{log.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {log.user_email && <span>User: {log.user_email}</span>}
                  {log.ip_address && <span>IP: {log.ip_address}</span>}
                  {log.request_method && log.request_path && (
                    <span className="font-mono">
                      {log.request_method} {log.request_path}
                    </span>
                  )}
                </div>
                {log.event_metadata && Object.keys(log.event_metadata).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-muted-foreground cursor-pointer">
                      View metadata
                    </summary>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.event_metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
