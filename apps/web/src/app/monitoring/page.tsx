/**
 * Monitoring Dashboard Page
 * Page complète de monitoring et observabilité
 */

'use client';

import { useEffect } from 'react';
import HealthStatus from '@/components/monitoring/HealthStatus';
import MetricsChart from '@/components/monitoring/MetricsChart';
import AlertsPanel from '@/components/monitoring/AlertsPanel';
import LogsViewer from '@/components/monitoring/LogsViewer';
import SystemMetrics from '@/components/monitoring/SystemMetrics';
import PerformanceProfiler from '@/components/monitoring/PerformanceProfiler';
import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard';
import { trackWebVital } from '@/lib/monitoring/metrics';
import { profiler } from '@/lib/monitoring/profiler';
import { createLog } from '@/lib/monitoring/logs';
import Container from '@/components/ui/Container';

export default function MonitoringPage() {
  useEffect(() => {
    // Profiler le chargement de la page
    profiler.start('monitoring-page-load');

    // Track page load
    createLog('info', 'Monitoring dashboard accessed', { page: 'monitoring' }, 'frontend');

    // Simuler quelques métriques pour la démo
    setTimeout(() => {
      trackWebVital('LCP', 1200, 'ms');
      trackWebVital('FID', 45, 'ms');
      trackWebVital('CLS', 0.05);
      trackWebVital('FCP', 800, 'ms');
      trackWebVital('TTFB', 200, 'ms');

      profiler.end('monitoring-page-load');
    }, 1000);

    // Générer quelques logs de démo
    setTimeout(() => {
      createLog('info', 'System check completed', { services: 3 }, 'system');
      createLog('debug', 'Cache hit rate: 85%', { cache: 'redis' }, 'cache');
    }, 2000);
  }, []);

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Monitoring & Observability</h1>
        <p className="text-muted-foreground">
          Dashboard de santé, métriques de performance, logs centralisés et alertes
        </p>
      </div>

      {/* Health Status */}
      <div className="mb-6">
        <HealthStatus />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <MetricsChart metricName="LCP" title="Largest Contentful Paint" />
        <MetricsChart metricName="FID" title="First Input Delay" />
        <MetricsChart metricName="CLS" title="Cumulative Layout Shift" />
        <MetricsChart metricName="FCP" title="First Contentful Paint" />
        <MetricsChart metricName="TTFB" title="Time to First Byte" />
        <SystemMetrics />
      </div>

      {/* Alerts and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <AlertsPanel />
        <LogsViewer />
      </div>

      {/* Performance Dashboard */}
      <div className="mb-6">
        <PerformanceDashboard />
      </div>

      {/* Performance Profiler */}
      <div className="mb-6">
        <PerformanceProfiler />
      </div>
    </Container>
  );
}
