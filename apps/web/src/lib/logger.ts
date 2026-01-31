/**
 * Secure Logger Utility
 *
 * Provides secure logging that:
 * - Removes console.log in production
 * - Sanitizes sensitive data
 * - Provides structured logging
 *
 * @module logger
 */

export type LogContext = Record<string, unknown> | unknown;

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Sanitize sensitive data from log context
   */
  private sanitize(context: LogContext | undefined): Record<string, unknown> | undefined {
    if (!context) return undefined;

    // If context is not an object, return it as-is wrapped
    if (typeof context !== 'object' || context === null || Array.isArray(context)) {
      return { value: context };
    }

    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'api_key',
      'authorization',
      'access_token',
      'refresh_token',
      'secret_key',
      'private_key',
      'credit_card',
      'card_number',
      'cvv',
    ];

    const sanitized = { ...(context as Record<string, unknown>) };
    for (const key in sanitized) {
      const keyLower = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => keyLower.includes(sensitive))) {
        sanitized[key] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  /**
   * Log a message (only in development)
   */
  log(message: string, context?: unknown): void {
    if (!this.isDevelopment) return;
    const sanitized = this.sanitize(context as LogContext);
    console.log(`[LOG] ${message}`, sanitized || '');
  }

  /**
   * Log an info message (only in development)
   */
  info(message: string, context?: unknown): void {
    if (!this.isDevelopment) return;
    const sanitized = this.sanitize(context as LogContext);
    console.info(`[INFO] ${message}`, sanitized || '');
  }

  /**
   * Log a warning (always logged, but sanitized)
   */
  warn(message: string, context?: unknown): void {
    const sanitized = this.sanitize(context as LogContext);
    console.warn(`[WARN] ${message}`, sanitized || '');
  }

  /**
   * Log an error (always logged, but sanitized)
   */
  error(message: string, error?: Error | unknown, context?: unknown): void {
    const sanitized = this.sanitize(context as LogContext);
    console.error(`[ERROR] ${message}`, error || '', sanitized || '');
  }

  /**
   * Log a debug message (only in development)
   */
  debug(message: string, context?: unknown): void {
    if (!this.isDevelopment) return;
    const sanitized = this.sanitize(context as LogContext);
    console.debug(`[DEBUG] ${message}`, sanitized || '');
  }

  /**
   * Log a user action (only in development)
   */
  userAction(action: string, context?: unknown): void {
    if (!this.isDevelopment) return;
    const sanitized = this.sanitize(context as LogContext);
    console.log(`[USER_ACTION] ${action}`, sanitized || '');
  }

  /**
   * Log a performance metric (only in development)
   */
  performance(label: string, value: number | string, unit?: string): void {
    if (!this.isDevelopment) return;
    const unitStr = unit ? ` ${unit}` : '';
    console.log(`[PERF] ${label}: ${value}${unitStr}`);
  }
}

export const logger = new SecureLogger();
