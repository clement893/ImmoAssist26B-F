/**
 * Sentry Client Configuration
 * Error tracking and monitoring
 * Sentry is optional - functions will no-op if @sentry/nextjs is not installed
 */

// Type definitions for Sentry (optional dependency)
interface SentryInitOptions {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
  debug?: boolean;
  replaysOnErrorSampleRate?: number;
  replaysSessionSampleRate?: number;
  integrations?: unknown[];
  beforeSend?: (event: SentryEvent, hint?: unknown) => SentryEvent | null;
}

interface SentryEvent {
  request?: {
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
  };
  [key: string]: unknown;
}

interface BrowserTracingOptions {
  tracePropagationTargets?: (string | RegExp)[];
}

interface ReplayOptions {
  maskAllText?: boolean;
  blockAllMedia?: boolean;
}

interface CaptureExceptionOptions {
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
  [key: string]: unknown;
}

// Type definition for Sentry (optional dependency)
type SentryType = {
  init: (options: SentryInitOptions) => void;
  BrowserTracing: new (options?: BrowserTracingOptions) => unknown;
  Replay: new (options?: ReplayOptions) => unknown;
  captureException: (error: Error, options?: CaptureExceptionOptions) => void;
  captureMessage: (message: string, level?: string) => void;
  setUser: (user: { id: string; email?: string; username?: string } | null) => void;
};

let Sentry: SentryType | null = null;

// Lazy load Sentry to avoid webpack static analysis
// Use static import with try-catch for Turbopack compatibility
function loadSentry(): SentryType | null {
  if (Sentry !== null) return Sentry;

  try {
    // Use static import instead of dynamic require for Turbopack compatibility
    // @ts-ignore - Sentry is optional, module may not exist
    Sentry = require('@sentry/nextjs');
  } catch {
    // Sentry not installed, continue without it
    Sentry = null;
  }

  return Sentry;
}

export function initSentry() {
  const sentry = loadSentry();
  if (!sentry || !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  if (typeof window === 'undefined') {
    // Server-side initialization
    sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      beforeSend(event: SentryEvent, _hint?: unknown) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.authorization;
        }
        return event;
      },
    });
  } else {
    // Client-side initialization
    sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === 'development',
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      integrations: [
        new sentry.BrowserTracing({
          tracePropagationTargets: [
            'localhost',
            /^https:\/\/.*\.sentry\.io\/api/,
            process.env.NEXT_PUBLIC_API_URL || '',
          ],
        }),
        new sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      beforeSend(event: SentryEvent, _hint?: unknown) {
        // Filter out sensitive data
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.authorization;
        }
        return event;
      },
    });
  }
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  const sentry = loadSentry();
  if (!sentry) return;
  sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' | 'debug' | 'fatal' = 'info'
) {
  const sentry = loadSentry();
  if (!sentry) return;
  sentry.captureMessage(message, level);
}

export function setUser(user: { id: string; email?: string; username?: string }) {
  const sentry = loadSentry();
  if (!sentry) return;
  sentry.setUser(user);
}

export function clearUser() {
  const sentry = loadSentry();
  if (!sentry) return;
  sentry.setUser(null);
}
