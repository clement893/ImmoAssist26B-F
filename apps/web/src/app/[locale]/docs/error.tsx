'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

/**
 * Error Boundary Component for Documentation Page
 *
 * Catches and displays errors that occur during rendering of the docs page.
 * Logs errors for debugging purposes.
 */
export default function DocsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to error tracking service
    logger.error('Documentation page error', error, {
      digest: error.digest,
      component: 'DocsPage',
    });
  }, [error]);

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full" aria-label="Error message">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-error-500 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Erreur de chargement</h2>
          <p className="text-muted-foreground mb-6">
            Une erreur s'est produite lors du chargement de la documentation. Veuillez réessayer.
          </p>
          {error.message && (
            <p className="text-sm text-error-600 dark:text-error-400 mb-4 font-mono bg-error-50 dark:bg-error-900/20 p-2 rounded">
              {error.message}
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <Button onClick={reset} variant="primary">
              Réessayer
            </Button>
            <Button onClick={handleGoHome} variant="outline">
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
