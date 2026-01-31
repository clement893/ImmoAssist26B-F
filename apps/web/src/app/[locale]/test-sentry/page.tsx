/**
 * Sentry Test Page
 * Use this page to test Sentry error tracking
 */

'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import { captureException, captureMessage, addBreadcrumb } from '@/lib/monitoring/sentry';

export default function TestSentryPage() {
  const [testResult, setTestResult] = useState<string | null>(null);

  const testError = () => {
    try {
      addBreadcrumb('User clicked test error button', 'user-action', 'info');
      throw new Error(`Sentry Test Error - ${new Date().toISOString()}`);
    } catch (error) {
      captureException(error as Error, {
        tags: { test: 'true', page: 'test-sentry' },
        extra: {
          timestamp: new Date().toISOString(),
          userAction: 'clicked-test-error-button',
        },
      });
      setTestResult('✅ Error sent to Sentry! Check your Sentry dashboard.');
    }
  };

  const testMessage = () => {
    addBreadcrumb('User clicked test message button', 'user-action', 'info');
    captureMessage('Test message from Sentry test page', 'info', {
      tags: { test: 'true', type: 'message' },
      extra: { timestamp: new Date().toISOString() },
    });
    setTestResult('✅ Message sent to Sentry! Check your Sentry dashboard.');
  };

  const testUnhandledError = () => {
    // This will trigger the error boundary
    throw new Error('Unhandled error test - should be caught by ErrorBoundary');
  };

  const testAsyncError = async () => {
    try {
      addBreadcrumb('User clicked async error button', 'user-action', 'info');
      await new Promise((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error(`Async Sentry Test Error - ${new Date().toISOString()}`));
        }, 100);
      });
    } catch (error) {
      captureException(error as Error, {
        tags: { test: 'true', type: 'async' },
        extra: { timestamp: new Date().toISOString() },
      });
      setTestResult('✅ Async error sent to Sentry! Check your Sentry dashboard.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sentry Testing Page</h1>
          <p className="text-muted-foreground mt-2">
            Use these buttons to test Sentry error tracking and monitoring
          </p>
        </div>

        {testResult && (
          <Alert variant="info" onClose={() => setTestResult(null)}>
            {testResult}
          </Alert>
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Test Error Tracking</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Test captured exception (handled error)
              </p>
              <Button onClick={testError} variant="primary">
                Test Error Exception
              </Button>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Test message capture (non-error event)
              </p>
              <Button onClick={testMessage} variant="secondary">
                Test Message
              </Button>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Test async error (handled async error)
              </p>
              <Button onClick={testAsyncError} variant="secondary">
                Test Async Error
              </Button>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Test unhandled error (triggers Error Boundary)
              </p>
              <Button onClick={testUnhandledError} variant="danger">
                Test Unhandled Error
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Browser Console Test</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Open browser DevTools (F12) and run this in the console:
          </p>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm">
            <code className="text-foreground">
              throw new Error('Sentry Test Error - ' + new Date().toISOString())
            </code>
          </div>
        </Card>

        <Card className="p-6 bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800">
          <h3 className="text-lg font-semibold text-info-900 dark:text-info-100 mb-2">
            📊 Check Your Results
          </h3>
          <ul className="text-sm text-info-700 dark:text-info-300 space-y-1">
            <li>
              • Go to your{' '}
              <a
                href="https://sentry.io"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Sentry Dashboard
              </a>
            </li>
            <li>
              • Click on <strong>"Issues"</strong> in the left sidebar
            </li>
            <li>• You should see your test errors appear within 5-10 seconds</li>
            <li>• Click on an error to see detailed information</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">🔗 Quick Links</h3>
          <div className="space-y-2">
            <a
              href="/monitoring/errors"
              className="block text-info-600 dark:text-info-400 hover:underline"
            >
              → Error Tracking Dashboard
            </a>
            <a
              href="/monitoring/performance"
              className="block text-info-600 dark:text-info-400 hover:underline"
            >
              → Performance Dashboard
            </a>
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-info-600 dark:text-info-400 hover:underline"
            >
              → Sentry Dashboard
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
