/**
 * BackendCheckCard Component
 * Displays backend endpoints check results
 */

import { Button, Card, Alert, Badge } from '@/components/ui';
import { RefreshCw } from 'lucide-react';
import type { CheckResult } from '../types/health.types';

interface BackendCheckCardProps {
  backendCheck: CheckResult | null;
  isLoading: boolean;
  onCheck: () => void;
}

export function BackendCheckCard({ backendCheck, isLoading, onCheck }: BackendCheckCardProps) {
  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Backend Endpoints</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onCheck}
          disabled={isLoading}
          aria-label="Check backend endpoints"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Check Backend
        </Button>
      </div>

      {backendCheck && (
        <div className="space-y-4">
          {!backendCheck.success ? (
            <Alert variant="error">
              <div>
                <p className="font-medium">{backendCheck.error || 'Check failed'}</p>
                {backendCheck.message && <p className="text-sm mt-1">{backendCheck.message}</p>}
                {backendCheck.hint && (
                  <p className="text-sm mt-1 text-muted-foreground">{backendCheck.hint}</p>
                )}
              </div>
            </Alert>
          ) : backendCheck.summary && Object.keys(backendCheck.summary).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {backendCheck.summary.registered !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">
                    {backendCheck.summary.registered}
                  </div>
                  <div className="text-sm text-muted-foreground">✅ Registered</div>
                </div>
              )}
              {backendCheck.summary.unregistered !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-error-600">
                    {backendCheck.summary.unregistered}
                  </div>
                  <div className="text-sm text-muted-foreground">❌ Unregistered</div>
                </div>
              )}
              {backendCheck.summary.totalEndpoints !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{backendCheck.summary.totalEndpoints}</div>
                  <div className="text-sm text-muted-foreground">📊 Total Endpoints</div>
                </div>
              )}
            </div>
          ) : null}

          {backendCheck.output && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Detailed Output</h3>
                <Badge variant="info">{backendCheck.output.length} characters</Badge>
              </div>
              <pre
                className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96 border border-border"
                role="log"
                aria-label="Backend check detailed output"
              >
                {backendCheck.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
