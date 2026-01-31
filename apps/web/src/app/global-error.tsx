/**
 * Global Error Boundary for Next.js App Router
 * This file must be a Client Component and handles errors that occur in the root layout
 */

'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/errors/ErrorDisplay';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to error reporting service
    logger.error('Global error caught', error, {
      digest: error.digest,
      errorBoundary: 'global-error',
    });

    // Send to Sentry if configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        const { captureException } = require('@/lib/sentry/client');
        captureException(error, {
          tags: {
            errorBoundary: 'global-error',
          },
        });
      } catch (e) {
        // Sentry not available, continue without it
        logger.warn('Sentry not available', { error: e instanceof Error ? e.message : String(e) });
      }
    }
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <ErrorDisplay
          error={error}
          message={error.message || "Une erreur inattendue s'est produite"}
          statusCode={500}
          details={{
            digest: error.digest,
          }}
          onReset={reset}
        />
      </body>
    </html>
  );
}
