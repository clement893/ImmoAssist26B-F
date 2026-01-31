/**
 * Performance Monitoring Dashboard Component
 * Comprehensive metrics UI for performance monitoring
 */
'use client';
import { useState, useEffect, useCallback, memo } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Chart } from '@/components/ui';
import type { ChartDataPoint } from '@/components/ui';

export interface PerformanceDashboardProps {
  className?: string;
  refreshInterval?: number;
}

// Browser API type extensions
interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources: LayoutShiftAttribution[];
}

interface LayoutShiftAttribution {
  node?: Node;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface NetworkInformation {
  effectiveType: string;
  downlink: number;
  rtt: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

interface PerformanceMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint
  tti: number; // Time to Interactive
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  network?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

const PerformanceDashboardComponent = memo(function PerformanceDashboard({
  className,
  refreshInterval = 5000,
}: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    fcp: 0,
    tti: 0,
  });

  const [history, setHistory] = useState<ChartDataPoint[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  const getPerformanceMetrics = useCallback(() => {
    const newMetrics: PerformanceMetrics = {
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0,
      fcp: 0,
      tti: 0,
    };

    // Get Web Vitals if available
    if (typeof window !== 'undefined' && 'performance' in window) {
      const perfEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (perfEntries.length > 0) {
        const nav = perfEntries[0];
        if (nav) {
          newMetrics.ttfb = nav.responseStart - nav.requestStart;
          newMetrics.fcp = nav.domContentLoadedEventEnd - nav.fetchStart;
          newMetrics.tti = nav.domInteractive - nav.fetchStart;
        }
      }

      // Get paint timing
      const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[];
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          newMetrics.fcp = entry.startTime;
        }
      });

      // Get layout shift
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            let clsValue = 0;
            for (const entry of list.getEntries()) {
              const layoutShiftEntry = entry as LayoutShiftEntry;
              if (!layoutShiftEntry.hadRecentInput) {
                clsValue += layoutShiftEntry.value;
              }
            }
            newMetrics.cls = clsValue;
          });
          observer.observe({ type: 'layout-shift', buffered: true });
        } catch (_e: unknown) {
          // CLS not supported
        }
      }
    }

    // Get memory info if available
    const perfWithMemory = performance as PerformanceWithMemory;
    if (perfWithMemory.memory) {
      newMetrics.memory = {
        usedJSHeapSize: perfWithMemory.memory.usedJSHeapSize / 1048576, // Convert to MB
        totalJSHeapSize: perfWithMemory.memory.totalJSHeapSize / 1048576,
        jsHeapSizeLimit: perfWithMemory.memory.jsHeapSizeLimit / 1048576,
      };
    }

    // Get network info if available
    const navWithConnection = navigator as NavigatorWithConnection;
    if ('connection' in navigator) {
      const conn =
        navWithConnection.connection ||
        navWithConnection.mozConnection ||
        navWithConnection.webkitConnection;
      if (conn) {
        newMetrics.network = {
          effectiveType: conn.effectiveType || 'unknown',
          downlink: conn.downlink || 0,
          rtt: conn.rtt || 0,
        };
      }
    }

    return newMetrics;
  }, []);

  useEffect(() => {
    if (!isMonitoring) return;

    const updateMetrics = () => {
      const newMetrics = getPerformanceMetrics();
      setMetrics(newMetrics);

      // Add to history
      const timestamp = new Date().toLocaleTimeString();
      setHistory((prev) => {
        const updated = [...prev, { label: timestamp, value: newMetrics.lcp || 0 }];
        return updated.slice(-10); // Keep last 10 entries
      });
    };

    // Initial update
    updateMetrics();

    // Set up interval
    const interval = setInterval(updateMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, refreshInterval, getPerformanceMetrics]);

  const getMetricStatus = (value: number, thresholds: { good: number; needsImprovement: number }) => {
    if (value <= thresholds.good) return 'success';
    if (value <= thresholds.needsImprovement) return 'warning';
    return 'error';
  };

  const lcpStatus = getMetricStatus(metrics.lcp, { good: 2500, needsImprovement: 4000 });
  const fidStatus = getMetricStatus(metrics.fid, { good: 100, needsImprovement: 300 });
  const clsStatus = getMetricStatus(metrics.cls, { good: 0.1, needsImprovement: 0.25 });
  const ttfbStatus = getMetricStatus(metrics.ttfb, { good: 600, needsImprovement: 800 });

  return (
    <Card className={clsx('p-6', className)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground"> Performance Dashboard </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {' '}
              Real-time performance metrics and monitoring{' '}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isMonitoring ? 'success' : 'default'}>
              {' '}
              {isMonitoring ? 'Monitoring' : 'Paused'}{' '}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setIsMonitoring(!isMonitoring)}>
              {' '}
              {isMonitoring ? 'Pause' : 'Resume'}{' '}
            </Button>
          </div>
        </div>

        {/* Core Web Vitals */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3"> Core Web Vitals </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">LCP</span>
                <Badge variant={lcpStatus}>
                  {' '}
                  {metrics.lcp > 0 ? `${Math.round(metrics.lcp)}ms` : 'N/A'}{' '}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground"> Largest Contentful Paint </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">FID</span>
                <Badge variant={fidStatus}>
                  {' '}
                  {metrics.fid > 0 ? `${Math.round(metrics.fid)}ms` : 'N/A'}{' '}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground"> First Input Delay </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">CLS</span>
                <Badge variant={clsStatus}>
                  {' '}
                  {metrics.cls > 0 ? metrics.cls.toFixed(3) : 'N/A'}{' '}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground"> Cumulative Layout Shift </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">TTFB</span>
                <Badge variant={ttfbStatus}>
                  {' '}
                  {metrics.ttfb > 0 ? `${Math.round(metrics.ttfb)}ms` : 'N/A'}{' '}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground"> Time to First Byte </div>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3"> Additional Metrics </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">FCP</div>
              <div className="text-lg font-semibold text-foreground">
                {' '}
                {metrics.fcp > 0 ? `${Math.round(metrics.fcp)}ms` : 'N/A'}{' '}
              </div>
              <div className="text-xs text-muted-foreground mt-1"> First Contentful Paint </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">TTI</div>
              <div className="text-lg font-semibold text-foreground">
                {' '}
                {metrics.tti > 0 ? `${Math.round(metrics.tti)}ms` : 'N/A'}{' '}
              </div>
              <div className="text-xs text-muted-foreground mt-1"> Time to Interactive </div>
            </div>
            {metrics.memory && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Memory</div>
                <div className="text-lg font-semibold text-foreground">
                  {' '}
                  {Math.round(metrics.memory.usedJSHeapSize)} MB{' '}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {' '}
                  Used / {Math.round(metrics.memory.jsHeapSizeLimit)} MB limit{' '}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Network Information */}
        {metrics.network && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3"> Network Information </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Connection Type</div>
                <div className="text-lg font-semibold text-foreground capitalize">
                  {' '}
                  {metrics.network.effectiveType}{' '}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Downlink</div>
                <div className="text-lg font-semibold text-foreground">
                  {' '}
                  {metrics.network.downlink} Mbps{' '}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">RTT</div>
                <div className="text-lg font-semibold text-foreground">
                  {' '}
                  {metrics.network.rtt} ms{' '}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance History Chart */}
        {history.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3"> Performance History </h4>
            <Card className="p-4">
              <Chart type="line" data={history} title="LCP Over Time" height={200} />
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
});

PerformanceDashboardComponent.displayName = 'PerformanceDashboard';

export default PerformanceDashboardComponent;
