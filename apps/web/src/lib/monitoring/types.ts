/**
 * Types pour le système de monitoring
 */

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: ServiceHealth[];
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  lastCheck: string;
  message?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  service?: string;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}

export interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  timestamp: string;
}
