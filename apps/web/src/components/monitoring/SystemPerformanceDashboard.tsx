/**
 * Performance Monitoring Dashboard Component
 * Displays performance metrics and Web Vitals
 */
'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { TrendingUp, Zap, Clock, Activity, RefreshCw } from 'lucide-react';
import { getPerformanceSummary } from '@/lib/performance/webVitals';

interface PerformanceMetrics {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte
  inp: number | null; // Interaction to Next Paint
}

interface PerformanceRating {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  label: string;
}

function getRating(
  value: number,
  thresholds: { good: number; poor: number }
): PerformanceRating['rating'] {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function getRatingColor(rating: PerformanceRating['rating']) {
  switch (rating) {
    case 'good':
      return 'success';
    case 'needs-improvement':
      return 'warning';
    case 'poor':
      return 'error';
  }
}

function formatMetric(value: number | null, unit: string = 'ms'): string {
  if (value === null) return 'N/A';
  return `${value.toFixed(0)} ${unit}`;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    inp: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const summary = await getPerformanceSummary();
        setMetrics(summary);
      } catch (error) {
        logger.error('', 'Failed to load performance metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMetrics();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const lcpRating =
    metrics.lcp !== null ? getRating(metrics.lcp, { good: 2500, poor: 4000 }) : null;
  const fcpRating =
    metrics.fcp !== null ? getRating(metrics.fcp, { good: 1800, poor: 3000 }) : null;
  const clsRating = metrics.cls !== null ? getRating(metrics.cls, { good: 0.1, poor: 0.25 }) : null;
  const ttfbRating =
    metrics.ttfb !== null ? getRating(metrics.ttfb, { good: 800, poor: 1800 }) : null;
  const inpRating = metrics.inp !== null ? getRating(metrics.inp, { good: 200, poor: 500 }) : null;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Performance Monitoring</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time Core Web Vitals and performance metrics
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-lg hover:bg-muted"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Core Web Vitals */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Core Web Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LCP */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-500" />
                <span className="text-sm font-medium text-foreground">LCP</span>
              </div>
              {lcpRating && <Badge variant={getRatingColor(lcpRating)}>{lcpRating}</Badge>}
            </div>
            <p className="text-2xl font-bold text-foreground">{formatMetric(metrics.lcp)}</p>
            <p className="text-xs text-muted-foreground mt-1">Largest Contentful Paint</p>
          </Card>

          {/* INP */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning-500" />
                <span className="text-sm font-medium text-foreground">INP</span>
              </div>
              {inpRating && <Badge variant={getRatingColor(inpRating)}>{inpRating}</Badge>}
            </div>
            <p className="text-2xl font-bold text-foreground">{formatMetric(metrics.inp)}</p>
            <p className="text-xs text-muted-foreground mt-1">Interaction to Next Paint</p>
          </Card>

          {/* CLS */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                <span className="text-sm font-medium text-foreground">CLS</span>
              </div>
              {clsRating && <Badge variant={getRatingColor(clsRating)}>{clsRating}</Badge>}
            </div>
            <p className="text-2xl font-bold text-foreground">{formatMetric(metrics.cls, '')}</p>
            <p className="text-xs text-muted-foreground mt-1">Cumulative Layout Shift</p>
          </Card>
        </div>
      </div>

      {/* Other Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Other Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* FCP */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-success-500" />
                <span className="text-sm font-medium text-foreground">FCP</span>
              </div>
              {fcpRating && <Badge variant={getRatingColor(fcpRating)}>{fcpRating}</Badge>}
            </div>
            <p className="text-2xl font-bold text-foreground">{formatMetric(metrics.fcp)}</p>
            <p className="text-xs text-muted-foreground mt-1">First Contentful Paint</p>
          </Card>

          {/* TTFB */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-foreground">TTFB</span>
              </div>
              {ttfbRating && <Badge variant={getRatingColor(ttfbRating)}>{ttfbRating}</Badge>}
            </div>
            <p className="text-2xl font-bold text-foreground">{formatMetric(metrics.ttfb)}</p>
            <p className="text-xs text-muted-foreground mt-1">Time to First Byte</p>
          </Card>

          {/* FID */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-medium text-foreground">FID</span>
              </div>
              {metrics.fid !== null && (
                <Badge variant={getRatingColor(getRating(metrics.fid, { good: 100, poor: 300 }))}>
                  {getRating(metrics.fid, { good: 100, poor: 300 })}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{formatMetric(metrics.fid)}</p>
            <p className="text-xs text-muted-foreground mt-1">First Input Delay (deprecated)</p>
          </Card>
        </div>
      </div>

      {/* Performance Tips */}
      <Card className="p-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
            Performance Targets
          </h4>
          <ul className="text-xs text-primary-700 dark:text-primary-300 space-y-1">
            <li>• LCP: &lt; 2.5s (good), &lt; 4.0s (needs improvement)</li>
            <li>• INP: &lt; 200ms (good), &lt; 500ms (needs improvement)</li>
            <li>• CLS: &lt; 0.1 (good), &lt; 0.25 (needs improvement)</li>
            <li>• FCP: &lt; 1.8s (good), &lt; 3.0s (needs improvement)</li>
            <li>• TTFB: &lt; 800ms (good), &lt; 1.8s (needs improvement)</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
