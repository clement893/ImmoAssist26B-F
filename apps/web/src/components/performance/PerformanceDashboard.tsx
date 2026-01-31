'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, Badge, Button } from '@/components/ui';

// Note: apiClient import removed - not used in this component

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  inp: number | null;
  timestamp: string;
}

interface PerformanceStats {
  average: PerformanceMetrics;
  p75: PerformanceMetrics;
  p95: PerformanceMetrics;
  totalSamples: number;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get current performance metrics
    if (typeof window !== 'undefined') {
      import('@/lib/performance/webVitals').then(({ getPerformanceSummary }) => {
        getPerformanceSummary().then(
          (summary: {
            lcp: number | null;
            fid: number | null;
            cls: number | null;
            fcp: number | null;
            ttfb: number | null;
            inp: number | null;
          }) => {
            setMetrics({
              ...summary,
              timestamp: new Date().toISOString(),
            });
          }
        );
      });
    }

    // Fetch aggregated stats from backend
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      // This would call a backend endpoint that aggregates performance data
      // For now, we'll use local storage or mock data
      const storedStats = localStorage.getItem('performance_stats');
      if (storedStats) {
        setStats(JSON.parse(storedStats));
      }
    } catch (error) {
      logger.error('', 'Failed to fetch performance stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRating = (
    metric: string,
    value: number | null
  ): 'good' | 'needs-improvement' | 'poor' => {
    if (value === null) return 'good';

    const thresholds: Record<string, { good: number; poor: number }> = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
      inp: { good: 200, poor: 500 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return 'success';
      case 'needs-improvement':
        return 'warning';
      case 'poor':
        return 'error';
    }
  };

  const formatValue = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A';
    return `${value.toFixed(0)}${unit}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <Button onClick={fetchStats} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Current Metrics */}
      {metrics && (
        <Card title="Current Page Metrics">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(['lcp', 'fcp', 'ttfb', 'cls', 'inp'] as const).map((metric) => {
              const value = metrics[metric];
              const rating = getRating(metric, value);
              return (
                <div key={metric} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold uppercase">{metric}</span>
                    <Badge variant={getRatingColor(rating)}>{rating}</Badge>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatValue(value, metric === 'cls' ? '' : 'ms')}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Performance Stats */}
      {stats && (
        <Card title="Performance Statistics">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Metric</span>
              </div>
              <div>
                <span className="text-muted-foreground">Average</span>
              </div>
              <div>
                <span className="text-muted-foreground">P75</span>
              </div>
              <div>
                <span className="text-muted-foreground">P95</span>
              </div>
            </div>
            {(['lcp', 'fcp', 'ttfb', 'cls', 'inp'] as const).map((metric) => (
              <div key={metric} className="grid grid-cols-4 gap-4">
                <div className="font-semibold uppercase">{metric}</div>
                <div>{formatValue(stats.average[metric], metric === 'cls' ? '' : 'ms')}</div>
                <div>{formatValue(stats.p75[metric], metric === 'cls' ? '' : 'ms')}</div>
                <div>{formatValue(stats.p95[metric], metric === 'cls' ? '' : 'ms')}</div>
              </div>
            ))}
            <div className="text-sm text-muted-foreground mt-4">
              Total Samples: {stats.totalSamples}
            </div>
          </div>
        </Card>
      )}

      {isLoading && !metrics && (
        <Card>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading performance metrics...</p>
          </div>
        </Card>
      )}
    </div>
  );
}
