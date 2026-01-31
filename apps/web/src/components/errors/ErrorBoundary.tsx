/**
 * Error Boundary Component with Sentry Integration
 *
 * Catches React component errors and displays a fallback UI.
 * Automatically reports errors to Sentry for monitoring.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomError />}>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * // With error handler
 * <ErrorBoundary
 *   onError={(error, errorInfo) => {
 *     logger.error('','Caught error:', error);
 *   }}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { logger, type LogContext } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface Props {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback UI to display on error */
  fallback?: ReactNode;
  /** Error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show error details in UI */
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to Sentry
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        errorBoundary: true,
      },
    });

    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('ErrorBoundary caught an error', error, errorInfo as LogContext);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted">
          <Card className="max-w-2xl w-full">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
                <p className="text-muted-foreground mt-2">
                  We're sorry, but something unexpected happened. Our team has been notified.
                </p>
              </div>

              {this.state.eventId && <Alert variant="info">Error ID: {this.state.eventId}</Alert>}

              {this.props.showDetails && this.state.error && (
                <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-error-900 dark:text-error-100 mb-2">
                    Error Details
                  </h3>
                  <pre className="text-xs text-error-800 dark:text-error-200 overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack && (
                      <div className="mt-2 pt-2 border-t border-error-200 dark:border-error-800">
                        {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </pre>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="primary" onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button variant="secondary" onClick={this.handleReload}>
                  Reload Page
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to manually trigger error boundary
 */
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    Sentry.captureException(error, {
      contexts: {
        react: errorInfo
          ? {
              componentStack: errorInfo.componentStack,
            }
          : undefined,
      },
    });
  };
}
