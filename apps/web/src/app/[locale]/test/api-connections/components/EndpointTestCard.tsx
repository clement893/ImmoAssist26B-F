/**
 * EndpointTestCard Component
 * Displays critical endpoints test results with progress indicator
 */

import { useMemo } from 'react';
import { Button, Card, Alert } from '@/components/ui';
import { RefreshCw, Loader2, CheckCircle, XCircle, Copy, Check } from 'lucide-react';
import type { EndpointTestResult, TestProgress } from '../types/health.types';

interface EndpointTestCardProps {
  endpointTests: EndpointTestResult[];
  isTestingEndpoints: boolean;
  testProgress: TestProgress | null;
  onTest: () => void;
  onCopyTestResult: (test: EndpointTestResult) => void;
  copiedTestId: string | null;
}

export function EndpointTestCard({
  endpointTests,
  isTestingEndpoints,
  testProgress,
  onTest,
  onCopyTestResult,
  copiedTestId,
}: EndpointTestCardProps) {
  const stats = useMemo(() => {
    const successCount = endpointTests.filter((t) => t.status === 'success').length;
    const errorCount = endpointTests.filter((t) => t.status === 'error').length;
    const pendingCount = endpointTests.filter((t) => t.status === 'pending').length;
    const testsWithResponseTime = endpointTests.filter((t) => t.responseTime);
    const avgResponseTime =
      testsWithResponseTime.length > 0
        ? Math.round(
            testsWithResponseTime.reduce((sum, t) => sum + (t.responseTime || 0), 0) /
              testsWithResponseTime.length
          )
        : null;
    return { successCount, errorCount, pendingCount, avgResponseTime };
  }, [endpointTests]);

  const categories = useMemo(
    () => Array.from(new Set(endpointTests.map((t) => t.category).filter(Boolean))),
    [endpointTests]
  );

  const uncategorizedTests = useMemo(
    () => endpointTests.filter((t) => !t.category),
    [endpointTests]
  );

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Critical Endpoints Test</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Test all critical endpoints that were created/fixed in the API alignment batches
          </p>
          {testProgress && (
            <div className="mt-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  Progress: {testProgress.completed}/{testProgress.total} ({testProgress.percentage}
                  %)
                </span>
                <div className="flex-1 bg-muted rounded-full h-2 max-w-md">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${testProgress.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={testProgress.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Test progress: ${testProgress.percentage}%`}
                  />
                </div>
                <span className="text-success-600 dark:text-success-400">
                  ✓ {testProgress.success}
                </span>
                <span className="text-error-600 dark:text-error-400">✗ {testProgress.error}</span>
                {testProgress.pending > 0 && (
                  <span className="text-muted-foreground">⏳ {testProgress.pending}</span>
                )}
              </div>
            </div>
          )}
        </div>
        <Button
          variant="primary"
          onClick={onTest}
          disabled={isTestingEndpoints}
          className="ml-4"
          aria-label="Test all critical endpoints"
        >
          {isTestingEndpoints ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Test All Endpoints
            </>
          )}
        </Button>
      </div>

      {endpointTests.length > 0 && (
        <div className="space-y-4">
          {/* Group by category */}
          {categories.map((category) => {
            const categoryTests = endpointTests.filter((t) => t.category === category);
            const categorySuccessCount = categoryTests.filter((t) => t.status === 'success').length;
            const categoryErrorCount = categoryTests.filter((t) => t.status === 'error').length;
            const categoryPendingCount = categoryTests.filter((t) => t.status === 'pending').length;

            return (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{category}</h3>
                  <div className="flex gap-4 text-sm">
                    <span className="text-success-600">✓ {categorySuccessCount}</span>
                    <span className="text-error-600">✗ {categoryErrorCount}</span>
                    {categoryPendingCount > 0 && (
                      <span className="text-muted-foreground">⏳ {categoryPendingCount}</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" role="list">
                  {categoryTests.map((test, index) => {
                    const testId = `${test.endpoint}-${test.method}`;
                    const isCopied = copiedTestId === testId;
                    return (
                      <div
                        key={`${category}-${index}`}
                        className={`p-3 rounded-lg border ${
                          test.status === 'success'
                            ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                            : test.status === 'error'
                              ? 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800'
                              : 'bg-muted border-border'
                        }`}
                        role="listitem"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
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
                              <span className="font-mono text-xs font-medium truncate">
                                {test.method} {test.endpoint}
                              </span>
                            </div>
                            {test.message && (
                              <p className="text-xs text-muted-foreground truncate">
                                {test.message}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onCopyTestResult(test)}
                            className="flex-shrink-0 h-6 w-6 p-0"
                            title="Copy test result"
                            aria-label={`Copy test result for ${test.method} ${test.endpoint}`}
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-success-600" aria-hidden="true" />
                            ) : (
                              <Copy className="h-3 w-3" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Tests without category */}
          {uncategorizedTests.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Other</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" role="list">
                {uncategorizedTests.map((test, index) => {
                  const testId = `${test.endpoint}-${test.method}`;
                  const isCopied = copiedTestId === testId;
                  return (
                    <div
                      key={`other-${index}`}
                      className={`p-3 rounded-lg border ${
                        test.status === 'success'
                          ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                          : test.status === 'error'
                            ? 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800'
                            : 'bg-muted border-border'
                      }`}
                      role="listitem"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
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
                            <span className="font-mono text-xs font-medium truncate">
                              {test.method} {test.endpoint}
                            </span>
                          </div>
                          {test.message && (
                            <p className="text-xs text-muted-foreground truncate">{test.message}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopyTestResult(test)}
                          className="flex-shrink-0 h-6 w-6 p-0"
                          title="Copy test result"
                          aria-label={`Copy test result for ${test.method} ${test.endpoint}`}
                        >
                          {isCopied ? (
                            <Check className="h-3 w-3 text-success-600" aria-hidden="true" />
                          ) : (
                            <Copy className="h-3 w-3" aria-hidden="true" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div className="mt-4 flex gap-4 text-sm" role="status" aria-live="polite">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" aria-hidden="true" />
              <span>Success: {stats.successCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-error-600" aria-hidden="true" />
              <span>Errors: {stats.errorCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Pending: {stats.pendingCount}</span>
            </div>
            {stats.avgResponseTime !== null && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  Avg Response: {stats.avgResponseTime}ms
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {endpointTests.length === 0 && !isTestingEndpoints && (
        <Alert variant="info">
          <p>
            Click "Test All Endpoints" to test all critical endpoints that were created or fixed.
          </p>
        </Alert>
      )}
    </Card>
  );
}
