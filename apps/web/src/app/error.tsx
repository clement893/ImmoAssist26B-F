/**
 * Global Error Boundary for Next.js App Router
 * Catches errors in the app directory
 */

'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/errors/ErrorDisplay';
import { logger } from '@/lib/logger';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    logger.error('Error boundary caught error', error, {
      digest: error.digest,
      errorBoundary: 'error',
    });

    // Send to Sentry if configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        const { captureException } = require('@/lib/sentry/client');
        captureException(error, {
          tags: {
            errorBoundary: 'error',
          },
        });
      } catch (e: unknown) {
        // Sentry not available, continue without it
        // Convert error to string safely - use String() to avoid type narrowing issues
        const errorMessage = String(e);
        logger.warn('Sentry not available', { error: errorMessage });
      }
    }
  }, [error]);

  return (
    <ErrorDisplay
      error={error}
      message={error.message || "Une erreur inattendue s'est produite"}
      statusCode={500}
      details={{
        digest: error.digest,
      }}
      onReset={reset}
    />
  );
}
