/**
 * ComponentTestCard Component
 * Displays frontend components and hooks test results
 */

import { Button, Card, Alert } from '@/components/ui';
import { RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { ComponentTestResult } from '../types/health.types';

interface ComponentTestCardProps {
  componentTests: ComponentTestResult[];
  isTestingComponents: boolean;
  onTest: () => void;
}

export function ComponentTestCard({
  componentTests,
  isTestingComponents,
  onTest,
}: ComponentTestCardProps) {
  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Frontend Components & Hooks Test</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Test critical React hooks, services, and API client functionality
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onTest}
          disabled={isTestingComponents}
          aria-label="Run frontend components tests"
        >
          {isTestingComponents ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Tests
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {componentTests.length > 0 ? (
          <div className="space-y-2" role="list">
            {componentTests.map((test, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  test.status === 'success'
                    ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                    : test.status === 'error'
                      ? 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800'
                      : 'bg-muted border-border'
                }`}
                role="listitem"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {test.status === 'success' ? (
                        <CheckCircle
                          className="h-4 w-4 text-success-600 flex-shrink-0"
                          aria-hidden="true"
                        />
                      ) : test.status === 'error' ? (
                        <XCircle
                          className="h-4 w-4 text-error-600 flex-shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <Loader2
                          className="h-4 w-4 text-muted-foreground animate-spin flex-shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span className="font-semibold">{test.name}</span>
                    </div>
                    {test.message && (
                      <p className="text-sm text-muted-foreground mt-1">{test.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert variant="info">
            <div>
              <p className="font-medium mb-2">Available Tests:</p>
              <ul className="list-disc list-inside space-y-1 text-sm" role="list">
                <li role="listitem">
                  <strong>API Client - Token Refresh:</strong> Tests automatic token refresh
                  mechanism
                </li>
                <li role="listitem">
                  <strong>API Client - Error Handling:</strong> Tests error handling and parsing
                </li>
                <li role="listitem">
                  <strong>API Client - GET Request:</strong> Tests GET request functionality
                </li>
                <li role="listitem">
                  <strong>API Client - POST Request:</strong> Tests POST request functionality
                </li>
              </ul>
              <p className="text-sm mt-2 text-muted-foreground">
                💡 <strong>Note:</strong> Click "Run Tests" to execute these tests. For
                comprehensive testing, use the test suite:{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">pnpm test</code>
              </p>
            </div>
          </Alert>
        )}
      </div>
    </Card>
  );
}
