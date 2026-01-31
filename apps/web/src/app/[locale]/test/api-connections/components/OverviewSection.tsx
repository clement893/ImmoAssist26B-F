/**
 * OverviewSection Component
 * Displays quick status overview with health score and metrics
 */

import { Button, Card, Alert, Badge } from '@/components/ui';
import { RefreshCw, TrendingUp, Zap, Shield, Activity } from 'lucide-react';
import type {
  ConnectionStatus,
  HealthMetrics,
  CheckResult,
  EndpointTestResult,
  ComponentTestResult,
} from '../types/health.types';
import { calculateHealthMetrics } from '../services/healthChecker';

interface OverviewSectionProps {
  status: ConnectionStatus | null;
  frontendCheck?: CheckResult | null;
  backendCheck?: CheckResult | null;
  endpointTests?: EndpointTestResult[];
  componentTests?: ComponentTestResult[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function OverviewSection({
  status,
  frontendCheck,
  backendCheck,
  endpointTests = [],
  componentTests = [],
  isLoading,
  onRefresh,
}: OverviewSectionProps) {
  // Calculate health metrics
  const metrics: HealthMetrics = calculateHealthMetrics(
    status,
    frontendCheck || null,
    backendCheck || null,
    endpointTests,
    componentTests
  );

  // Determine health status color and label
  const getHealthStatus = (score: number) => {
    if (score >= 90)
      return {
        color: 'success',
        label: 'Excellent',
        bgColor: 'bg-success-50 dark:bg-success-900/20',
        textColor: 'text-success-600 dark:text-success-400',
      };
    if (score >= 75)
      return {
        color: 'info',
        label: 'Good',
        bgColor: 'bg-info-50 dark:bg-info-900/20',
        textColor: 'text-info-600 dark:text-info-400',
      };
    if (score >= 50)
      return {
        color: 'warning',
        label: 'Fair',
        bgColor: 'bg-warning-50 dark:bg-warning-900/20',
        textColor: 'text-warning-600 dark:text-warning-400',
      };
    return {
      color: 'error',
      label: 'Poor',
      bgColor: 'bg-error-50 dark:bg-error-900/20',
      textColor: 'text-error-600 dark:text-error-400',
    };
  };

  const healthStatus = getHealthStatus(metrics.healthScore);

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Template Health Overview</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label="Refresh connection status"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Health Score Section */}
      <div
        className={`${healthStatus.bgColor} p-6 rounded-lg border-2 mb-6`}
        style={{ borderColor: `var(--color-${healthStatus.color})` }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Overall Health Score</h3>
            <p className="text-sm text-muted-foreground">
              Based on connection, performance, and security metrics
            </p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${healthStatus.textColor}`}>
              {metrics.healthScore}%
            </div>
            <Badge
              variant={healthStatus.color as 'success' | 'info' | 'warning' | 'error'}
              className="mt-1"
            >
              {healthStatus.label}
            </Badge>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              metrics.healthScore >= 90
                ? 'bg-success-500'
                : metrics.healthScore >= 75
                  ? 'bg-info-500'
                  : metrics.healthScore >= 50
                    ? 'bg-warning-500'
                    : 'bg-error-500'
            }`}
            style={{ width: `${metrics.healthScore}%` }}
            role="progressbar"
            aria-valuenow={metrics.healthScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Health score: ${metrics.healthScore}%`}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-info-600 dark:text-info-400" />
              <h4 className="font-semibold">Connection Rate</h4>
            </div>
            <Badge
              variant={
                metrics.connectionRate >= 75
                  ? 'success'
                  : metrics.connectionRate >= 50
                    ? 'warning'
                    : 'error'
              }
            >
              {metrics.connectionRate}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Frontend and backend connectivity</p>
          <div className="mt-2 w-full bg-muted rounded-full h-2">
            <div
              className="bg-info-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${metrics.connectionRate}%` }}
            />
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning-600 dark:text-warning-400" />
              <h4 className="font-semibold">Performance Rate</h4>
            </div>
            <Badge
              variant={
                metrics.performanceRate >= 75
                  ? 'success'
                  : metrics.performanceRate >= 50
                    ? 'warning'
                    : 'error'
              }
            >
              {metrics.performanceRate}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">API response times and efficiency</p>
          <div className="mt-2 w-full bg-muted rounded-full h-2">
            <div
              className="bg-warning-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${metrics.performanceRate}%` }}
            />
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success-600 dark:text-success-400" />
              <h4 className="font-semibold">Security Rate</h4>
            </div>
            <Badge
              variant={
                metrics.securityRate >= 75
                  ? 'success'
                  : metrics.securityRate >= 50
                    ? 'warning'
                    : 'error'
              }
            >
              {metrics.securityRate}%
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Authentication and security endpoints</p>
          <div className="mt-2 w-full bg-muted rounded-full h-2">
            <div
              className="bg-success-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${metrics.securityRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Feature Status Summary */}
      {metrics.totalFeatures > 0 && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h4 className="font-semibold">Feature Status Summary</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Total Features</div>
              <div className="text-lg font-semibold">{metrics.totalFeatures}</div>
            </div>
            <div>
              <div className="text-success-600 dark:text-success-400">✅ Active</div>
              <div className="text-lg font-semibold">{metrics.activeFeatures}</div>
            </div>
            <div>
              <div className="text-warning-600 dark:text-warning-400">⏳ Partial</div>
              <div className="text-lg font-semibold">{metrics.partialFeatures}</div>
            </div>
            <div>
              <div className="text-error-600 dark:text-error-400">❌ Inactive</div>
              <div className="text-lg font-semibold">{metrics.inactiveFeatures}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Success Rate</div>
              <div className="text-lg font-semibold">
                {metrics.totalFeatures > 0
                  ? Math.round((metrics.activeFeatures / metrics.totalFeatures) * 100)
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Status Section */}
      {status && (
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">Quick Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {status.frontend && (
              <div>
                <h4 className="font-medium mb-2">Frontend Connections</h4>
                {status.frontend.error ? (
                  <Alert variant="warning" className="mt-2">
                    <p className="text-sm">{status.frontend.error}</p>
                    {status.frontend.message && (
                      <p className="text-xs mt-1 text-muted-foreground">
                        {status.frontend.message}
                      </p>
                    )}
                  </Alert>
                ) : status.frontend.message ? (
                  <Alert variant="info" className="mt-2">
                    <p className="text-sm">{status.frontend.message}</p>
                    {status.frontend.note && (
                      <p className="text-xs mt-1 text-muted-foreground">{status.frontend.note}</p>
                    )}
                  </Alert>
                ) : status.frontend.total !== undefined ? (
                  <div className="space-y-1 text-sm" role="list">
                    <div className="flex justify-between" role="listitem">
                      <span>Total:</span>
                      <span className="font-medium">{status.frontend.total}</span>
                    </div>
                    <div className="flex justify-between" role="listitem">
                      <span>✅ Connected:</span>
                      <Badge variant="success">{status.frontend.connected}</Badge>
                    </div>
                    <div className="flex justify-between" role="listitem">
                      <span>⚠️ Partial:</span>
                      <Badge variant="warning">{status.frontend.partial}</Badge>
                    </div>
                    <div className="flex justify-between" role="listitem">
                      <span>❌ Needs Integration:</span>
                      <Badge variant="error">{status.frontend.needsIntegration}</Badge>
                    </div>
                    <div className="flex justify-between" role="listitem">
                      <span>🟡 Static:</span>
                      <Badge variant="info">{status.frontend.static}</Badge>
                    </div>
                  </div>
                ) : (
                  <Alert variant="info" className="mt-2">
                    <p className="text-sm">No frontend data available</p>
                  </Alert>
                )}
              </div>
            )}

            {status.backend && (
              <div>
                <h4 className="font-medium mb-2">Backend Endpoints</h4>
                {status.backend.error ? (
                  <Alert variant="error" className="mt-2">
                    <p className="text-sm">{status.backend.error}</p>
                    {status.backend.message && (
                      <p className="text-xs mt-1 text-muted-foreground">{status.backend.message}</p>
                    )}
                  </Alert>
                ) : status.backend.message ? (
                  <Alert variant="info" className="mt-2">
                    <p className="text-sm">{status.backend.message}</p>
                  </Alert>
                ) : status.backend.registered !== undefined ? (
                  <div className="space-y-1 text-sm" role="list">
                    <div className="flex justify-between" role="listitem">
                      <span>✅ Registered:</span>
                      <Badge variant="success">{status.backend.registered}</Badge>
                    </div>
                    <div className="flex justify-between" role="listitem">
                      <span>❌ Unregistered:</span>
                      <Badge variant={status.backend.unregistered > 0 ? 'error' : 'success'}>
                        {status.backend.unregistered}
                      </Badge>
                    </div>
                    {status.backend.totalEndpoints !== undefined && (
                      <div className="flex justify-between" role="listitem">
                        <span>📊 Total Endpoints:</span>
                        <span className="font-medium">{status.backend.totalEndpoints}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert variant="info" className="mt-2">
                    <p className="text-sm">No backend data available</p>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
