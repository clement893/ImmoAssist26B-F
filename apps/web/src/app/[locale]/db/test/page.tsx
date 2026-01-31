'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button, Card, Alert, Badge, Container } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';

interface DatabaseHealthCheck {
  status: 'healthy' | 'warning' | 'error';
  timestamp: string;
  database_url?: string;
  checks?: {
    tables?: {
      status: string;
      expected: number;
      found: number;
      missing: string[];
      extra: string[];
      all_tables: string[];
    };
    structure?: Record<
      string,
      {
        status: string;
        column_count?: number;
        columns?: string[];
        error?: string;
      }
    >;
    integrity?: {
      duplicate_emails?: {
        status: string;
        count: number;
        details?: Array<{ email: string; count: number }>;
      };
      orphaned_subscriptions?: {
        status: string;
        count: number;
      };
      orphaned_team_members?: {
        status: string;
        count: number;
      };
      active_themes?: {
        status: string;
        count: number;
        message?: string;
      };
    };
    statistics?: Record<string, number | string>;
    indexes?: {
      status: string;
      count?: number;
      error?: string;
    };
  };
  issues?: string[];
  error?: string;
}

function DatabaseTestContent() {
  const [healthData, setHealthData] = useState<DatabaseHealthCheck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const checkDatabaseHealth = async () => {
    setIsLoading(true);
    setError('');
    setHealthData(null);

    try {
      const response = await apiClient.get<DatabaseHealthCheck>('/api/v1/db-health/');
      setHealthData(response.data ?? null);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err) || 'Failed to check database health';
      setError(errorMessage);
      setHealthData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Auto-check on mount
    checkDatabaseHealth();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'unhealthy':
        return 'error';
      default:
        return 'info';
    }
  };

  const getStatusBadge = (status: string) => {
    const color = getStatusColor(status);
    return <Badge variant={color}>{status.toUpperCase()}</Badge>;
  };

  return (
    <Container className="py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Database Health Check</h1>
          <p className="text-muted-foreground">
            Comprehensive database health monitoring and diagnostics
          </p>
        </div>

        {/* Control Card */}
        <Card title="Database Health Check">
          <div className="space-y-4">
            <Button
              onClick={checkDatabaseHealth}
              disabled={isLoading}
              loading={isLoading}
              variant="primary"
              size="lg"
            >
              {isLoading ? 'Checking...' : 'Check Database Health'}
            </Button>

            {error && (
              <Alert variant="error" title="Error">
                {error}
              </Alert>
            )}
          </div>
        </Card>

        {/* Health Status */}
        {healthData && (
          <>
            {/* Overall Status */}
            <Card title="Overall Status">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Status:</span>
                  {getStatusBadge(healthData.status)}
                </div>
                {healthData.timestamp && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Last Check:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(healthData.timestamp).toLocaleString()}
                    </span>
                  </div>
                )}
                {healthData.database_url && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Database:</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {healthData.database_url}
                    </span>
                  </div>
                )}
                {healthData.issues && healthData.issues.length > 0 && (
                  <Alert variant="warning" title="Issues Found">
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {healthData.issues.map((issue, idx) => (
                        <li key={idx} className="text-sm">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </Alert>
                )}
              </div>
            </Card>

            {/* Tables Check */}
            {healthData.checks?.tables && (
              <Card title="Tables Check">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Expected:</span>
                      <p className="text-lg font-semibold">{healthData.checks.tables.expected}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Found:</span>
                      <p className="text-lg font-semibold">{healthData.checks.tables.found}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Status:</span>
                    {getStatusBadge(healthData.checks.tables.status)}
                  </div>
                  {healthData.checks.tables.missing &&
                    healthData.checks.tables.missing.length > 0 && (
                      <Alert variant="error" title="Missing Tables">
                        <ul className="list-disc list-inside mt-2">
                          {healthData.checks.tables.missing.map((table) => (
                            <li key={table} className="text-sm font-mono">
                              {table}
                            </li>
                          ))}
                        </ul>
                      </Alert>
                    )}
                  {healthData.checks.tables.extra && healthData.checks.tables.extra.length > 0 && (
                    <Alert variant="info" title="Extra Tables">
                      <ul className="list-disc list-inside mt-2">
                        {healthData.checks.tables.extra.map((table) => (
                          <li key={table} className="text-sm font-mono">
                            {table}
                          </li>
                        ))}
                      </ul>
                    </Alert>
                  )}
                  {healthData.checks.tables.all_tables && (
                    <div>
                      <p className="text-sm font-semibold mb-2">All Tables:</p>
                      <div className="flex flex-wrap gap-2">
                        {healthData.checks.tables.all_tables.map((table) => (
                          <Badge key={table} variant="info" className="font-mono text-xs">
                            {table}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Integrity Checks */}
            {healthData.checks?.integrity && (
              <Card title="Data Integrity">
                <div className="space-y-4">
                  {healthData.checks.integrity.duplicate_emails && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Duplicate Emails</span>
                        {getStatusBadge(healthData.checks.integrity.duplicate_emails.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Count: {healthData.checks.integrity.duplicate_emails.count}
                      </p>
                      {healthData.checks.integrity.duplicate_emails.details &&
                        healthData.checks.integrity.duplicate_emails.details.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {healthData.checks.integrity.duplicate_emails.details.map(
                              (detail, idx) => (
                                <li key={idx} className="text-sm font-mono">
                                  {detail.email}: {detail.count} occurrences
                                </li>
                              )
                            )}
                          </ul>
                        )}
                    </div>
                  )}
                  {healthData.checks.integrity.orphaned_subscriptions && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Orphaned Subscriptions</span>
                        {getStatusBadge(healthData.checks.integrity.orphaned_subscriptions.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Count: {healthData.checks.integrity.orphaned_subscriptions.count}
                      </p>
                    </div>
                  )}
                  {healthData.checks.integrity.orphaned_team_members && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Orphaned Team Members</span>
                        {getStatusBadge(healthData.checks.integrity.orphaned_team_members.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Count: {healthData.checks.integrity.orphaned_team_members.count}
                      </p>
                    </div>
                  )}
                  {healthData.checks.integrity.active_themes && (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Active Themes</span>
                        {getStatusBadge(healthData.checks.integrity.active_themes.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Count: {healthData.checks.integrity.active_themes.count}
                        {healthData.checks.integrity.active_themes.message && (
                          <span className="ml-2">
                            ({healthData.checks.integrity.active_themes.message})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Statistics */}
            {healthData.checks?.statistics && (
              <Card title="Database Statistics">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(healthData.checks.statistics).map(([table, count]) => (
                    <div key={table} className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-mono">{table}</p>
                      <p className="text-lg font-semibold">
                        {typeof count === 'number' ? count.toLocaleString() : count}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Indexes */}
            {healthData.checks?.indexes && (
              <Card title="Indexes">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Indexes:</span>
                  <div className="flex items-center gap-2">
                    {healthData.checks.indexes.count !== undefined && (
                      <span className="text-lg font-semibold">
                        {healthData.checks.indexes.count}
                      </span>
                    )}
                    {getStatusBadge(healthData.checks.indexes.status)}
                  </div>
                </div>
                {healthData.checks.indexes.error && (
                  <Alert variant="error" title="Error" className="mt-4">
                    {healthData.checks.indexes.error}
                  </Alert>
                )}
              </Card>
            )}
          </>
        )}

        {/* Instructions */}
        <Card title="About Database Health Check">
          <div className="space-y-4 text-sm text-foreground">
            <p>This tool performs comprehensive health checks on your database including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Table existence verification</li>
              <li>Table structure validation</li>
              <li>Data integrity checks (duplicates, orphaned records)</li>
              <li>Database statistics</li>
              <li>Index verification</li>
            </ul>
            <p className="mt-4">
              <strong>Status Colors:</strong>
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="success">OK/HEALTHY</Badge>
              <Badge variant="warning">WARNING</Badge>
              <Badge variant="error">ERROR</Badge>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}

export default function DatabaseTestPage() {
  return (
    <ProtectedRoute>
      <DatabaseTestContent />
    </ProtectedRoute>
  );
}
