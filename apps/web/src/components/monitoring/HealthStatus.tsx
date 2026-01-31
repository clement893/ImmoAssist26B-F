/**
 * Health Status Component
 * Affiche le statut de santé des services
 */
'use client';

import { useEffect, useState, useRef } from 'react';
import type { HealthStatus } from '@/lib/monitoring/types';
import { checkApplicationHealth } from '@/lib/monitoring/health';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';

export default function HealthStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

    const fetchHealth = async () => {
      try {
        setLoading(true);
        const data = await checkApplicationHealth();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch health status'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [isVisible]);

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center p-8">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-4 text-danger-600 dark:text-danger-400">
          Error: {error}
        </div>
      </Card>
    );
  }

  if (!health) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-success-500';
      case 'degraded':
        return 'bg-warning-500';
      case 'down':
        return 'bg-danger-500';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Card>
      <div ref={elementRef} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">System Health</h3>
          <Badge
            variant={
              health.status === 'healthy'
                ? 'success'
                : health.status === 'degraded'
                  ? 'warning'
                  : 'error'
            }
          >
            {health.status.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-3">
          {health.services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`}
                />
                <div>
                  <div className="font-medium">{service.name}</div>
                  {service.message && (
                    <div className="text-sm text-muted-foreground">
                      {service.message}
                    </div>
                  )}
                </div>
              </div>
              {service.responseTime !== undefined && (
                <div className="text-sm text-muted-foreground">
                  {service.responseTime}ms
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          Last updated: {new Date(health.timestamp).toLocaleString()}
        </div>
      </div>
    </Card>
  );
}
