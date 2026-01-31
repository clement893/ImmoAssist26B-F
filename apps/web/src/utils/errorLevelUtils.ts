/**
 * Error Level Utilities
 * Configuration and utilities for error level handling
 */

import { AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

export type ErrorLevel = 'error' | 'warning' | 'info';

export interface ErrorLevelConfig {
  color: 'error' | 'warning' | 'info' | 'default';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export const ERROR_LEVEL_CONFIG: Record<ErrorLevel, ErrorLevelConfig> = {
  error: {
    color: 'error',
    icon: XCircle,
    label: 'Error',
  },
  warning: {
    color: 'warning',
    icon: AlertTriangle,
    label: 'Warning',
  },
  info: {
    color: 'info',
    icon: AlertCircle,
    label: 'Info',
  },
} as const;

/**
 * Get error level configuration
 */
export function getErrorLevelConfig(level: string): ErrorLevelConfig {
  return ERROR_LEVEL_CONFIG[level as ErrorLevel] || ERROR_LEVEL_CONFIG.info;
}

/**
 * Get error level color
 */
export function getErrorLevelColor(level: string): string {
  return getErrorLevelConfig(level).color;
}

/**
 * Get error level icon component
 */
export function getErrorLevelIcon(level: string): React.ComponentType<{ className?: string }> {
  return getErrorLevelConfig(level).icon;
}
