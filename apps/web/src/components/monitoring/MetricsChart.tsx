/**
 * Metrics Chart Component
 * Affiche les métriques de performance sous forme de graphique
 */
'use client';

import { useEffect, useState, useRef } from 'react';
import type { PerformanceMetric } from '@/lib/monitoring/types';
import { metricsCollector } from '@/lib/monitoring/metrics';
import Card from '@/components/ui/Card';
import Chart from '@/components/ui/Chart';
import { getChartColorByStatus } from '@/lib/theme/colors';

interface MetricsChartProps {
  metricName: string;
  title?: string;
  height?: number;
}

export default function MetricsChart({
  metricName,
  title,
  height = 200,
}: MetricsChartProps) {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer pour ne fetch que si visible
  useEffect(() => {
    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Ne fetch que si le composant est visible
    if (!isVisible) return;

    const updateMetrics = () => {
      const latestMetrics = metricsCollector.getMetrics(metricName, 20);
      setMetrics(latestMetrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5s
    return () => clearInterval(interval);
  }, [metricName, isVisible]);

  const chartData = metrics.map((m) => ({
    label: new Date(m.timestamp).toLocaleTimeString(),
    value: m.value,
    color: getMetricColor(m),
  }));

  const latestMetric = metrics[0];
  const threshold = latestMetric?.threshold;

  return (
    <Card>
      <div ref={elementRef} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title || metricName}</h3>
          {latestMetric && (
            <div className="text-right">
              <div className="text-2xl font-bold">
                {latestMetric.value.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                {latestMetric.unit}
              </div>
            </div>
          )}
        </div>

        {chartData.length > 0 ? (
          <>
            <Chart data={chartData} type="line" height={height} />
            {threshold && (
              <div className="mt-4 flex gap-4 text-xs">
                <div className="text-warning-600 dark:text-warning-400">
                  Warning: {threshold.warning}
                  {latestMetric.unit}
                </div>
                <div className="text-error-600 dark:text-error-400">
                  Critical: {threshold.critical}
                  {latestMetric.unit}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No data available
          </div>
        )}
      </div>
    </Card>
  );
}

function getMetricColor(metric: PerformanceMetric): string {
  return getChartColorByStatus(metric.value, metric.threshold);
}
