'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Card, Button } from '@immoassist/ui';
import { Cloud, Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export interface S3HealthResult {
  configured: boolean;
  bucket?: string;
  region?: string;
  endpoint_url?: string;
  error?: string;
  status?: string;
  tests?: Record<string, string>;
}

export default function ConnectionR2Page() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<S3HealthResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiClient.get<S3HealthResult>('/v1/health/s3');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du test de connexion.');
    } finally {
      setLoading(false);
    }
  }, []);

  const allTestsPassed =
    result?.status === 'all_tests_passed' &&
    result?.tests &&
    Object.values(result.tests).every((v) => typeof v === 'string' && v.startsWith('✅'));

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Cloud className="w-7 h-7" />
          Connexion R2 (Cloudflare)
        </h1>
        <p className="text-muted-foreground mt-1">
          Testez la connexion au bucket R2 configuré pour le stockage des fichiers (photos, documents).
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-medium">Test de connexion au bucket</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Vérifie l&apos;accès au bucket, l&apos;upload, la génération d&apos;URL présignée et la suppression.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={testConnection}
            disabled={loading}
            className="shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tester la connexion
              </>
            )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && !error && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              {result.configured ? (
                allTestsPassed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-700 dark:text-green-300">
                      Connexion réussie
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-amber-700 dark:text-amber-300">
                      Connexion partielle ou erreur
                    </span>
                  </>
                )
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="font-medium text-red-700 dark:text-red-300">
                    Non configuré
                  </span>
                </>
              )}
            </div>

            {result.error && (
              <p className="text-sm text-muted-foreground rounded-md bg-muted/50 p-3">
                {result.error}
              </p>
            )}

            {result.configured && (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {result.bucket && (
                  <>
                    <dt className="text-muted-foreground">Bucket</dt>
                    <dd className="font-mono">{result.bucket}</dd>
                  </>
                )}
                {result.region && (
                  <>
                    <dt className="text-muted-foreground">Région</dt>
                    <dd className="font-mono">{result.region}</dd>
                  </>
                )}
                {result.endpoint_url && (
                  <>
                    <dt className="text-muted-foreground">Endpoint</dt>
                    <dd className="font-mono break-all">{result.endpoint_url}</dd>
                  </>
                )}
              </dl>
            )}

            {result.tests && Object.keys(result.tests).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Détail des tests</h3>
                <ul className="space-y-1.5 text-sm">
                  {Object.entries(result.tests).map(([key, value]) => {
                    const isSuccess =
                      typeof value === 'string' && value.startsWith('✅');
                    return (
                      <li key={key} className="flex items-center gap-2">
                        <span className="text-muted-foreground capitalize w-36">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span
                          className={
                            isSuccess
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {typeof value === 'string' ? value : String(value)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
