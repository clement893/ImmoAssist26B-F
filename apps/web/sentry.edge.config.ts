/**
 * Sentry Edge Configuration
 * This file configures Sentry for Edge Runtime (middleware, edge functions)
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
    beforeSend(event, _hint) {
      // Don't send errors in development unless explicitly enabled
      if (SENTRY_ENVIRONMENT === 'development' && process.env.SENTRY_ENABLE_DEV !== 'true') {
        return null;
      }

      return event;
    },

    // Set edge context
    initialScope: {
      tags: {
        component: 'edge',
      },
    },
  });
}
