/**
 * FrontendCheckCard Component
 * Displays frontend API connections check results
 */

import { Button, Card, Alert, Badge } from '@/components/ui';
import { RefreshCw, FileText } from 'lucide-react';
import type { CheckResult } from '../types/health.types';

interface FrontendCheckCardProps {
  frontendCheck: CheckResult | null;
  isLoading: boolean;
  onCheckBasic: () => void;
  onCheckDetailed: () => void;
}

export function FrontendCheckCard({
  frontendCheck,
  isLoading,
  onCheckBasic,
  onCheckDetailed,
}: FrontendCheckCardProps) {
  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Frontend API Connections</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCheckBasic}
            disabled={isLoading}
            aria-label="Check basic frontend connections"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Check Basic
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCheckDetailed}
            disabled={isLoading}
            aria-label="Check detailed frontend connections"
          >
            <FileText className="h-4 w-4 mr-2" />
            Check Detailed
          </Button>
        </div>
      </div>

      {frontendCheck && (
        <div className="space-y-4">
          {!frontendCheck.success ? (
            <Alert variant="error">
              <div>
                <p className="font-medium">{frontendCheck.error || 'Check failed'}</p>
                {frontendCheck.message && <p className="text-sm mt-1">{frontendCheck.message}</p>}
                {frontendCheck.hint && (
                  <p className="text-sm mt-1 text-muted-foreground">{frontendCheck.hint}</p>
                )}
              </div>
            </Alert>
          ) : frontendCheck.summary && Object.keys(frontendCheck.summary).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {frontendCheck.summary.total !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold">{frontendCheck.summary.total}</div>
                  <div className="text-sm text-muted-foreground">Total Pages</div>
                </div>
              )}
              {frontendCheck.summary.connected !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">
                    {frontendCheck.summary.connected}
                  </div>
                  <div className="text-sm text-muted-foreground">✅ Connected</div>
                </div>
              )}
              {frontendCheck.summary.partial !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-600">
                    {frontendCheck.summary.partial}
                  </div>
                  <div className="text-sm text-muted-foreground">⚠️ Partial</div>
                </div>
              )}
              {frontendCheck.summary.needsIntegration !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-error-600">
                    {frontendCheck.summary.needsIntegration}
                  </div>
                  <div className="text-sm text-muted-foreground">❌ Needs Integration</div>
                </div>
              )}
              {frontendCheck.summary.static !== undefined && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-info-600">
                    {frontendCheck.summary.static}
                  </div>
                  <div className="text-sm text-muted-foreground">🟡 Static</div>
                </div>
              )}
            </div>
          ) : null}

          {frontendCheck.output && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Detailed Output</h3>
                <Badge variant="info">{frontendCheck.output.length} characters</Badge>
              </div>
              <pre
                className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96 border border-border"
                role="log"
                aria-label="Frontend check detailed output"
              >
                {frontendCheck.output}
              </pre>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
