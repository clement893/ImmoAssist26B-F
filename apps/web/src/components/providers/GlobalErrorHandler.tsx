/**
 * Global Error Handler Component
 * Sets up global handlers for unhandled errors and promise rejections
 * Prevents crashes from unhandled promise rejections
 */
'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function GlobalErrorHandler() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Prevent default browser behavior (logging to console)
      event.preventDefault();

      const reason = event.reason;
      const error = reason instanceof Error ? reason : new Error(String(reason));

      // Log the error safely
      try {
        // Try to use logger if available
        import('@/lib/logger')
          .then(({ logger }) => {
            logger.error('Unhandled promise rejection', error, {
              type: 'unhandled_rejection',
              reason: String(reason),
            });
          })
          .catch(() => {
            // Fallback to console if logger fails
            logger.error('', 'Unhandled promise rejection:', error);
            logger.error('Reason:', reason);
          });
      } catch (e) {
        // Last resort fallback
        logger.error('', 'Unhandled promise rejection:', error);
        logger.error('Reason:', reason);
      }

      // Try to report to Sentry if available
      try {
        if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
          import('@/lib/sentry/client')
            .then(({ captureException }) => {
              captureException(error, {
                tags: {
                  errorType: 'unhandled_rejection',
                },
                extra: {
                  reason: String(reason),
                },
              });
            })
            .catch(() => {
              // Sentry not available, continue silently
            });
        }
      } catch (e) {
        // Ignore errors in error handling
      }
    };

    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      const error = event.error || new Error(event.message || 'Unknown error');

      // Log the error safely
      try {
        import('@/lib/logger')
          .then(({ logger }) => {
            logger.error('Unhandled error', error, {
              type: 'unhandled_error',
              message: event.message,
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
            });
          })
          .catch(() => {
            // Fallback to console if logger fails
            logger.error('', 'Unhandled error:', error);
            logger.error('Details:', {
              message: event.message,
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
            });
          });
      } catch (e) {
        // Last resort fallback
        logger.error('', 'Unhandled error:', error);
      }

      // Try to report to Sentry if available
      try {
        if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
          import('@/lib/sentry/client')
            .then(({ captureException }) => {
              captureException(error, {
                tags: {
                  errorType: 'unhandled_error',
                },
                extra: {
                  message: event.message,
                  filename: event.filename,
                  lineno: event.lineno,
                  colno: event.colno,
                },
              });
            })
            .catch(() => {
              // Sentry not available, continue silently
            });
        }
      } catch (e) {
        // Ignore errors in error handling
      }
    };

    // Register event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
