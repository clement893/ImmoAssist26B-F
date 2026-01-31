/**
 * Alert System
 * Système d'alertes automatiques basé sur les métriques
 */

import type { Alert, PerformanceMetric } from './types';
import { logger } from '../logger';

class AlertManager {
  private alerts: Alert[] = [];
  private maxAlerts = 500;

  createAlert(severity: Alert['severity'], title: string, message: string): Alert {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      severity,
      title,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.unshift(alert);

    // Garder seulement les N dernières alertes
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.pop();
    }

    // Logger l'alerte
    logger.warn(`Alert: ${title}`, { severity, message });

    // En production, envoyer à Sentry pour les alertes critiques
    if (process.env.NODE_ENV === 'production' && severity === 'critical') {
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.captureMessage(title, {
          level: 'error',
          tags: { alert: true },
          extra: { message },
        });
      }
    }

    return alert;
  }

  checkMetricThresholds(metric: PerformanceMetric): void {
    if (!metric.threshold) return;

    const { warning, critical } = metric.threshold;

    if (critical && metric.value >= critical) {
      this.createAlert(
        'critical',
        `${metric.name} Critical Threshold Exceeded`,
        `${metric.name} is ${metric.value}${metric.unit}, exceeding critical threshold of ${critical}${metric.unit}`
      );
    } else if (warning && metric.value >= warning) {
      this.createAlert(
        'warning',
        `${metric.name} Warning Threshold Exceeded`,
        `${metric.name} is ${metric.value}${metric.unit}, exceeding warning threshold of ${warning}${metric.unit}`
      );
    }
  }

  getAlerts(filters?: {
    severity?: Alert['severity'];
    acknowledged?: boolean;
    resolved?: boolean;
  }): Alert[] {
    let filtered = [...this.alerts];

    if (filters?.severity) {
      filtered = filtered.filter((a) => a.severity === filters.severity);
    }

    if (filters?.acknowledged !== undefined) {
      filtered = filtered.filter((a) => a.acknowledged === filters.acknowledged);
    }

    if (filters?.resolved !== undefined) {
      filtered = filtered.filter((a) => a.resolved === filters.resolved);
    }

    return filtered;
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  getUnresolvedAlerts(): Alert[] {
    return this.getAlerts({ resolved: false });
  }

  getCriticalAlerts(): Alert[] {
    return this.getAlerts({ severity: 'critical', resolved: false });
  }
}

export const alertManager = new AlertManager();
