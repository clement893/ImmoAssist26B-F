/**
 * Centralized Logging System
 * Système de logs centralisé avec stockage et recherche
 */

import type { LogEntry } from './types';
import { logger } from '../logger';

class LogStore {
  private logs: LogEntry[] = [];
  private maxLogs = 2000; // Limite de logs en mémoire

  addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): LogEntry {
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.unshift(logEntry);

    // Garder seulement les N derniers logs
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Logger aussi via le logger standard
    switch (entry.level) {
      case 'error':
        logger.error(entry.message, undefined, entry.context);
        break;
      case 'warn':
        logger.warn(entry.message, entry.context);
        break;
      case 'info':
        logger.info(entry.message, entry.context);
        break;
      case 'debug':
        logger.debug(entry.message, entry.context);
        break;
    }

    return logEntry;
  }

  getLogs(filters?: {
    level?: LogEntry['level'];
    service?: string;
    search?: string;
    limit?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (filters?.level) {
      filtered = filtered.filter((log) => log.level === filters.level);
    }

    if (filters?.service) {
      filtered = filtered.filter((log) => log.service === filters.service);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.context || {})
            .toLowerCase()
            .includes(searchLower)
      );
    }

    const limit = filters?.limit || 100;
    return filtered.slice(0, limit);
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogCounts(): Record<LogEntry['level'], number> {
    return {
      debug: this.logs.filter((l) => l.level === 'debug').length,
      info: this.logs.filter((l) => l.level === 'info').length,
      warn: this.logs.filter((l) => l.level === 'warn').length,
      error: this.logs.filter((l) => l.level === 'error').length,
    };
  }
}

export const logStore = new LogStore();

// Helper pour créer des logs
export function createLog(
  level: LogEntry['level'],
  message: string,
  context?: Record<string, unknown>,
  service?: string
): LogEntry {
  return logStore.addLog({ level, message, context, service });
}
