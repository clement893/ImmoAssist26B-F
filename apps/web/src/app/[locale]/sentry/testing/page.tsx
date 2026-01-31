'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { captureException, captureMessage, setUser, clearUser } from '@/lib/sentry/client';
import { Button, Card, Textarea, Alert, Badge, Container } from '@/components/ui';

function SentryTestContent() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testMessage, setTestMessage] = useState('Test message from Sentry test page');
  const [testError, setTestError] = useState('Test error from Sentry test page');

  const isConfigured = () => {
    return !!process.env.NEXT_PUBLIC_SENTRY_DSN;
  };

  const handleTestException = () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const errorMessage = testError || 'Test exception from Sentry test page';
      const error = new Error(errorMessage);
      captureException(error, {
        test: true,
        source: 'sentry-test-page',
        timestamp: new Date().toISOString(),
      });

      setSuccess('Exception captured and sent to Sentry! Check your Sentry dashboard.');
    } catch (err) {
      setError(
        'Failed to capture exception: ' + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestMessage = () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      captureMessage(testMessage || 'Test message from Sentry test page', 'info');

      setSuccess('Message captured and sent to Sentry! Check your Sentry dashboard.');
    } catch (err) {
      setError('Failed to capture message: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleTestWarning = () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      captureMessage('Test warning message from Sentry test page', 'warning');

      setSuccess('Warning message captured and sent to Sentry! Check your Sentry dashboard.');
    } catch (err) {
      setError('Failed to capture warning: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleTestError = () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      captureMessage('Test error message from Sentry test page', 'error');

      setSuccess('Error message captured and sent to Sentry! Check your Sentry dashboard.');
    } catch (err) {
      setError(
        'Failed to capture error message: ' + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetUserContext = () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (user) {
        setUser({
          id: String(user.id || 'test-user'),
          email: user.email,
          username: user.email?.split('@')[0],
        });
        setSuccess('User context set in Sentry!');
      } else {
        setError('No user logged in');
      }
    } catch (err) {
      setError('Failed to set user context: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleClearUserContext = () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      clearUser();
      setSuccess('User context cleared in Sentry!');
    } catch (err) {
      setError(
        'Failed to clear user context: ' + (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleThrowError = () => {
    setError('');
    setSuccess('');
    // This will trigger the error boundary and Sentry will capture it
    throw new Error(
      'Unhandled error from Sentry test page - this should be caught by Error Boundary'
    );
  };

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Sentry Test</h1>
        <p className="text-muted-foreground">
          Test Sentry error tracking and monitoring integration
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          {success}
        </Alert>
      )}

      {/* Configuration Status */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Sentry DSN:</span>
            <Badge variant={isConfigured() ? 'success' : 'error'}>
              {isConfigured() ? 'Configured' : 'Not Configured'}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Environment:</span>
            <Badge variant="default">{process.env.NODE_ENV || 'development'}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Sentry Enabled in Dev:</span>
            <Badge
              variant={process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV === 'true' ? 'success' : 'warning'}
            >
              {process.env.NEXT_PUBLIC_SENTRY_ENABLE_DEV === 'true'
                ? 'Yes'
                : 'No (required for dev testing)'}
            </Badge>
          </div>
          {isConfigured() && (
            <div className="mt-4 p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground mb-2">DSN (masked):</p>
              <code className="text-xs break-all">
                {process.env.NEXT_PUBLIC_SENTRY_DSN?.replace(/@.*/, '@***') || 'Not set'}
              </code>
            </div>
          )}
        </div>
      </Card>

      {/* Test Exception */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Exception Capture</h2>
        <div className="space-y-4">
          <Textarea
            label="Error Message"
            value={testError}
            onChange={(e) => setTestError(e.target.value)}
            rows={2}
            placeholder="Enter error message to test"
            fullWidth
          />
          <Button
            onClick={handleTestException}
            disabled={loading || !isConfigured()}
            variant="primary"
            fullWidth
          >
            Capture Test Exception
          </Button>
          <p className="text-sm text-muted-foreground">
            This will send a test exception to Sentry with additional context.
          </p>
        </div>
      </Card>

      {/* Test Messages */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Message Capture</h2>
        <div className="space-y-4">
          <Textarea
            label="Message"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            rows={2}
            placeholder="Enter message to test"
            fullWidth
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleTestMessage}
              disabled={loading || !isConfigured()}
              variant="secondary"
              fullWidth
            >
              Send Info Message
            </Button>
            <Button
              onClick={handleTestWarning}
              disabled={loading || !isConfigured()}
              variant="outline"
              fullWidth
            >
              Send Warning
            </Button>
            <Button
              onClick={handleTestError}
              disabled={loading || !isConfigured()}
              variant="danger"
              fullWidth
            >
              Send Error Message
            </Button>
          </div>
        </div>
      </Card>

      {/* User Context */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">User Context</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleSetUserContext}
              disabled={loading || !isConfigured() || !user}
              variant="primary"
              fullWidth
            >
              Set User Context
            </Button>
            <Button
              onClick={handleClearUserContext}
              disabled={loading || !isConfigured()}
              variant="outline"
              fullWidth
            >
              Clear User Context
            </Button>
          </div>
          {user && (
            <div className="p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">
                Current user: {user.email} (ID: {user.id})
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Unhandled Error Test */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Error Boundary</h2>
        <div className="space-y-4">
          <Alert variant="warning" title="⚠️ Warning">
            This will trigger an unhandled error that will be caught by the Error Boundary. The page
            will show an error screen.
          </Alert>
          <Button
            onClick={handleThrowError}
            disabled={loading || !isConfigured()}
            variant="danger"
            fullWidth
          >
            Throw Unhandled Error
          </Button>
        </div>
      </Card>

      {/* Instructions */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">How to Test</h2>
        <div className="space-y-4 text-sm text-foreground">
          <div>
            <h3 className="font-semibold mb-1 text-foreground">1. Check Configuration</h3>
            <p>Verify that Sentry is configured in environment variables:</p>
            <ul className="list-disc list-inside ml-4 mt-1">
              <li>NEXT_PUBLIC_SENTRY_DSN (required)</li>
              <li>SENTRY_ENVIRONMENT (optional, defaults to NODE_ENV)</li>
              <li>SENTRY_RELEASE (optional, for release tracking)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-1 text-foreground">2. Test Exception Capture</h3>
            <p>
              Click "Capture Test Exception" to send a test error to Sentry. Check your Sentry
              dashboard to see the error appear.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1 text-foreground">3. Test Message Capture</h3>
            <p>
              Use the message buttons to send different severity levels (info, warning, error) to
              Sentry.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1 text-foreground">4. User Context</h3>
            <p>
              Set user context to associate errors with specific users. This helps track which users
              are experiencing issues.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-1 text-foreground">5. Error Boundary</h3>
            <p>
              The "Throw Unhandled Error" button tests the Error Boundary component, which catches
              React errors and reports them to Sentry.
            </p>
          </div>
          <Alert variant="info" title="ℹ️ Note" className="mt-4">
            In development mode, Sentry may be disabled unless SENTRY_ENABLE_DEV=true is set. Check
            your Sentry dashboard at{' '}
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              sentry.io
            </a>{' '}
            to view captured events.
          </Alert>
        </div>
      </Card>

      {/* Where to Find Errors */}
      <Card className="bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800">
        <h2 className="text-xl font-semibold mb-4 text-info-900 dark:text-info-100">
          📊 Où trouver vos erreurs dans Sentry
        </h2>
        <div className="space-y-4 text-sm text-info-800 dark:text-info-200">
          <div>
            <h3 className="font-semibold mb-2 text-info-900 dark:text-info-100">
              Section principale : <strong>Issues</strong>
            </h3>
            <ol className="list-decimal list-inside ml-2 space-y-1">
              <li>
                Connectez-vous à{' '}
                <a
                  href="https://sentry.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  sentry.io
                </a>
              </li>
              <li>
                Sélectionnez votre <strong>organisation</strong> (en haut à gauche)
              </li>
              <li>
                Sélectionnez votre <strong>projet</strong> (menu de gauche ou en haut)
              </li>
              <li>
                Cliquez sur <strong>"Issues"</strong> dans le menu de gauche ⭐
              </li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-info-900 dark:text-info-100">
              Filtres utiles :
            </h3>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>
                <strong>Environment</strong> : Filtrez par "development" ou "production"
              </li>
              <li>
                <strong>Tags</strong> : Recherchez "test:true" pour trouver vos erreurs de test
              </li>
              <li>
                <strong>Status</strong> : "Unresolved" pour voir les nouvelles erreurs
              </li>
              <li>
                <strong>Search</strong> : Recherchez par texte (ex: "Test exception")
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-info-900 dark:text-info-100">
              ⚠️ Important en développement :
            </h3>
            <p className="ml-2">
              Ajoutez{' '}
              <code className="bg-info-100 dark:bg-info-900 px-1 rounded">
                NEXT_PUBLIC_SENTRY_ENABLE_DEV=true
              </code>{' '}
              dans votre{' '}
              <code className="bg-info-100 dark:bg-info-900 px-1 rounded">.env.local</code> et{' '}
              <strong>redémarrez le serveur</strong>.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-info-900 dark:text-info-100">
              🔍 Vérifier l'envoi :
            </h3>
            <p className="ml-2">
              Ouvrez les DevTools (F12) → Onglet <strong>Network</strong> → Filtrez par "sentry" →
              Vous devriez voir une requête POST vers{' '}
              <code className="bg-info-100 dark:bg-info-900 px-1 rounded">*.ingest.sentry.io</code>{' '}
              avec un status 200.
            </p>
          </div>
          <div className="pt-2 border-t border-info-200 dark:border-info-700">
            <p className="text-xs">
              💡 <strong>Astuce</strong> : Les erreurs peuvent prendre 5-10 secondes à apparaître
              dans Sentry. Consultez{' '}
              <code className="bg-info-100 dark:bg-info-900 px-1 rounded">
                SENTRY_DASHBOARD_GUIDE.md
              </code>{' '}
              pour plus de détails.
            </p>
          </div>
        </div>
      </Card>
    </Container>
  );
}

export default function SentryTestPage() {
  return <SentryTestContent />;
}
