/**
 * Web Vitals Tracking
 *
 * Tracks Core Web Vitals and other performance metrics
 * Sends data to analytics endpoint or monitoring service
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import { logger } from '@/lib/logger';

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Send Web Vitals to analytics endpoint
 */
function sendToAnalytics(metric: WebVitalsMetric) {
  // Send to your analytics endpoint
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/v1/analytics/web-vitals';

  // Use navigator.sendBeacon for reliable delivery
  if (navigator.sendBeacon) {
    const body = JSON.stringify(metric);
    navigator.sendBeacon(endpoint, body);
  } else {
    // Fallback to fetch
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
      keepalive: true,
    }).catch((error) => {
      // Use logger instead of console.error for production safety
      if (process.env.NODE_ENV === 'development') {
        logger.error('', 'Failed to send Web Vitals:', error);
      }
    });
  }

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    logger.log('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
  }
}

/**
 * Get rating for a metric value
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  // Core Web Vitals thresholds (2024)
  const thresholds: Record<string, { good: number; poor: number }> = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Handle Web Vitals metric
 */
function handleMetric(metric: Metric) {
  const webVitalsMetric: WebVitalsMetric = {
    name: metric.name,
    value: metric.value,
    rating: getRating(metric.name, metric.value),
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType || 'navigate',
  };

  sendToAnalytics(webVitalsMetric);
}

/**
 * Initialize Web Vitals tracking
 */
export function reportWebVitals() {
  // Core Web Vitals
  onCLS(handleMetric);
  onFID(handleMetric);
  onFCP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
  onINP(handleMetric);
}

/**
 * Get current Web Vitals values (for debugging)
 */
export function getWebVitals(): Promise<Record<string, number>> {
  return new Promise((resolve) => {
    const vitals: Record<string, number> = {};
    let count = 0;
    const totalMetrics = 6;

    const handleMetricOnce = (metric: Metric) => {
      vitals[metric.name] = metric.value;
      count++;
      if (count === totalMetrics) {
        resolve(vitals);
      }
    };

    onCLS(handleMetricOnce);
    onFID(handleMetricOnce);
    onFCP(handleMetricOnce);
    onLCP(handleMetricOnce);
    onTTFB(handleMetricOnce);
    onINP(handleMetricOnce);

    // Timeout after 10 seconds
    setTimeout(() => {
      resolve(vitals);
    }, 10000);
  });
}

/**
 * Get performance summary with all metrics
 */
export async function getPerformanceSummary(): Promise<{
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  inp: number | null;
}> {
  const vitals = await getWebVitals();
  return {
    lcp: vitals.LCP ?? null,
    fid: vitals.FID ?? null,
    cls: vitals.CLS ?? null,
    fcp: vitals.FCP ?? null,
    ttfb: vitals.TTFB ?? null,
    inp: vitals.INP ?? null,
  };
}
