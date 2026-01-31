/**
 * Performance Metrics Collection
 * Collecte et stocke les métriques de performance
 */

import type { PerformanceMetric, SystemMetrics } from './types';
import { logger } from '../logger';

class MetricsCollector {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Limite de métriques en mémoire

  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Garder seulement les N dernières métriques
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Logger en production
    if (process.env.NODE_ENV === 'production') {
      logger.performance(metric.name, metric.value, metric.unit);
    }
  }

  getMetrics(name?: string, limit: number = 100): PerformanceMetric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter((m) => m.name === name);
    }

    return filtered.slice(-limit).reverse();
  }

  getLatestMetric(name: string): PerformanceMetric | null {
    const metrics = this.getMetrics(name, 1);
    return metrics[0] || null;
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  // Collect system metrics
  async collectSystemMetrics(): Promise<SystemMetrics> {
    if (typeof window === 'undefined') {
      // Server-side: return mock data or fetch from monitoring service
      return {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: { in: 0, out: 0 },
        timestamp: new Date().toISOString(),
      };
    }

    // Client-side: collect browser metrics
    const memory = performance.memory
      ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
        }
      : null;

    const memoryUsage = memory ? (memory.used / memory.limit) * 100 : 0;

    return {
      cpu: 0, // Not available in browser
      memory: memoryUsage,
      disk: 0, // Not available in browser
      network: {
        in: 0, // Would need Network Information API
        out: 0,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export const metricsCollector = new MetricsCollector();

// Helper pour créer des métriques
export function createMetric(
  name: string,
  value: number,
  unit: string,
  threshold?: { warning: number; critical: number }
): PerformanceMetric {
  return {
    name,
    value,
    unit,
    timestamp: new Date().toISOString(),
    threshold,
  };
}

// Track Web Vitals
export function trackWebVital(name: string, value: number, unit: string = 'ms'): void {
  const metric = createMetric(name, value, unit, {
    warning: getWarningThreshold(name),
    critical: getCriticalThreshold(name),
  });

  metricsCollector.addMetric(metric);
}

function getWarningThreshold(name: string): number {
  const thresholds: Record<string, number> = {
    LCP: 2500, // ms
    FID: 100, // ms
    CLS: 0.1,
    FCP: 1800, // ms
    TTFB: 800, // ms
  };
  return thresholds[name] || 0;
}

function getCriticalThreshold(name: string): number {
  const thresholds: Record<string, number> = {
    LCP: 4000, // ms
    FID: 300, // ms
    CLS: 0.25,
    FCP: 3000, // ms
    TTFB: 1500, // ms
  };
  return thresholds[name] || 0;
}
