/**
 * Alerts Panel Component
 * Affiche les alertes du système
 */
'use client';

import { useEffect, useState } from 'react';
import type { Alert } from '@/lib/monitoring/types';
import { alertManager } from '@/lib/monitoring/alerts';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { dangerColors, warningColors, primaryColors } from '@/lib/theme/colors';

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const updateAlerts = () => {
      const unresolved = alertManager.getUnresolvedAlerts();
      setAlerts(unresolved.slice(0, 10)); // Show latest 10
    };

    updateAlerts();
    const interval = setInterval(updateAlerts, 2000); // Update every 2s

    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = (alertId: string) => {
    alertManager.acknowledgeAlert(alertId);
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  const handleResolve = (alertId: string) => {
    alertManager.resolveAlert(alertId);
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  const getSeverityColor = (
    severity: Alert['severity']
  ): 'error' | 'warning' | 'info' | 'default' => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Active Alerts</h3>
          <Badge variant={alerts.length > 0 ? 'error' : 'success'}>
            {alerts.length} active
          </Badge>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No active alerts
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 bg-muted rounded-lg border-l-4"
                style={{
                  borderLeftColor:
                    alert.severity === 'critical' || alert.severity === 'error'
                      ? dangerColors[500]()
                      : alert.severity === 'warning'
                        ? warningColors[500]()
                        : primaryColors[500](),
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.message}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleResolve(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
