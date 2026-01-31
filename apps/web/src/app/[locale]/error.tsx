/**
 * Error Page for Locale Routes
 * Catches errors in locale-specific routes
 */

'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/errors/ErrorDisplay';
import { logger } from '@/lib/logger';
import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    // Log error to error reporting service
    logger.error('Error boundary caught error', error, {
      digest: error.digest,
      errorBoundary: 'locale-error',
    });

    // Send to Sentry if configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        const { captureException } = require('@/lib/sentry/client');
        captureException(error, {
          tags: {
            errorBoundary: 'locale-error',
          },
        });
      } catch (e: unknown) {
        // Sentry not available, continue without it
        const errorMessage = String(e);
        logger.warn('Sentry not available', { error: errorMessage });
      }
    }
  }, [error]);

  return (
    <ErrorDisplay
      error={error}
      message={error.message || t('unexpectedError') || "Une erreur inattendue s'est produite"}
      statusCode={500}
      details={{
        digest: error.digest,
      }}
      onReset={reset}
      title={t('errorTitle') || 'Erreur'}
    />
  );
}
