/**
 * Error Statistics Service
 * Business logic for calculating error statistics
 * Separated from UI components for testability and reusability
 */

export interface Error {
  id: string;
  message: string;
  level: 'error' | 'warning' | 'info';
  timestamp: Date | string;
  url?: string;
  userAgent?: string;
}

export interface ErrorStats {
  totalErrors: number;
  errorsLast24h: number;
  errorsLast7d: number;
  criticalErrors: number;
  warningErrors: number;
}

export class ErrorStatisticsService {
  /**
   * Calculate error statistics from a list of errors
   */
  static calculateStats(errors: Error[]): ErrorStats {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalErrors: errors.length,
      errorsLast24h: this.countErrorsInPeriod(errors, last24h, now),
      errorsLast7d: this.countErrorsInPeriod(errors, last7d, now),
      criticalErrors: this.countByLevel(errors, 'error'),
      warningErrors: this.countByLevel(errors, 'warning'),
    };
  }

  /**
   * Count errors within a time period
   */
  private static countErrorsInPeriod(errors: Error[], start: Date, end: Date): number {
    return errors.filter((e) => {
      const timestamp = typeof e.timestamp === 'string' ? new Date(e.timestamp) : e.timestamp;
      return timestamp >= start && timestamp <= end;
    }).length;
  }

  /**
   * Count errors by level
   */
  private static countByLevel(errors: Error[], level: string): number {
    return errors.filter((e) => e.level === level).length;
  }

  /**
   * Get recent errors (sorted by timestamp, most recent first)
   */
  static getRecentErrors(errors: Error[], limit: number = 10): Error[] {
    return [...errors]
      .sort((a, b) => {
        const aTime =
          typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp.getTime();
        const bTime =
          typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp.getTime();
        return bTime - aTime;
      })
      .slice(0, limit);
  }

  /**
   * Filter errors by level
   */
  static filterByLevel(errors: Error[], level: 'error' | 'warning' | 'info'): Error[] {
    return errors.filter((e) => e.level === level);
  }
}
