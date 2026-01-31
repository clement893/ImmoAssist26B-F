/**
 * Sentry Server Configuration
 * This file configures Sentry for the Node.js server-side
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
const SENTRY_RELEASE =
  process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';

// Only initialize Sentry if DSN is provided
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    release: SENTRY_RELEASE,

    // Enable debug mode in development to see what's happening
    debug: SENTRY_ENVIRONMENT === 'development' && process.env.SENTRY_DEBUG === 'true',

    // Performance Monitoring
    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development unless explicitly enabled
      if (SENTRY_ENVIRONMENT === 'development' && process.env.SENTRY_ENABLE_DEV !== 'true') {
        return null;
      }

      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore validation errors (these are expected)
        if (error.name === 'ValidationError' || error.message.includes('validation')) {
          return null;
        }
      }

      return event;
    },

    // Set server context
    initialScope: {
      tags: {
        component: 'server',
      },
    },
  });
} else {
  // Log warning if Sentry is not configured
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[Sentry] SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN is not set. Sentry error tracking is disabled.'
    );
  }
}
