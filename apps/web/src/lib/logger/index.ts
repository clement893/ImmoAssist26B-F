/**
 * Structured Logging for Frontend
 * Provides consistent logging with levels and context
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export type LogContext = Record<string, unknown> | unknown;

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: unknown): string {
    const timestamp = new Date().toISOString();
    let contextStr = '';
    if (context) {
      try {
        const contextObj =
          typeof context === 'object' && context !== null && !Array.isArray(context)
            ? (context as Record<string, unknown>)
            : { value: context };
        contextStr = ` ${JSON.stringify(contextObj)}`;
      } catch {
        contextStr = ` ${String(context)}`;
      }
    }
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: unknown): void {
    if (!this.isDevelopment && level === LogLevel.DEBUG) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);

    // Convert context to LogContext format
    const logContext: Record<string, unknown> =
      typeof context === 'object' && context !== null && !Array.isArray(context)
        ? (context as Record<string, unknown>)
        : { value: context };

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`[DEBUG] ${formattedMessage}`, logContext);
        break;
      case LogLevel.INFO:
        console.info(`[INFO] ${formattedMessage}`, logContext);
        break;
      case LogLevel.WARN:
        console.warn(`[WARN] ${formattedMessage}`, logContext);
        break;
      case LogLevel.ERROR:
        console.error(`[ERROR] ${formattedMessage}`, logContext);
        break;
    }

    // Send to error tracking service in production (e.g., Sentry)
    if (level === LogLevel.ERROR && !this.isDevelopment) {
      // Use dynamic import to avoid bundling Sentry if not installed
      import('@/lib/sentry/client')
        .then(({ captureException }) => {
          const contextObj =
            typeof context === 'object' && context !== null && !Array.isArray(context)
              ? (context as Record<string, unknown>)
              : {};
          const error =
            (contextObj as { error?: unknown })?.error instanceof Error
              ? (contextObj as { error: Error }).error
              : new Error(message);
          captureException(error, contextObj);
        })
        .catch(() => {
          // Sentry not available or not configured, continue silently
        });
    }
  }

  debug(message: string, context?: unknown): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: unknown): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: unknown): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error | unknown, context?: unknown): void {
    const errorMessage = error instanceof Error ? error.message : error ? String(error) : '';
    const fullMessage = errorMessage ? `${message}: ${errorMessage}` : message;
    const contextObj =
      typeof context === 'object' && context !== null && !Array.isArray(context)
        ? (context as Record<string, unknown>)
        : {};
    const errorContext = {
      ...contextObj,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    };
    this.log(LogLevel.ERROR, fullMessage, errorContext);
  }

  performance(label: string, value: number | string, unit?: string): void {
    // Performance logs are treated as INFO level
    const unitStr = unit ? ` ${unit}` : '';
    this.log(LogLevel.INFO, `${label}: ${value}${unitStr}`);
  }
}

export const logger = new Logger();
