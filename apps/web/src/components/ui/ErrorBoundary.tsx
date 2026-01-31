/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '@/lib/logger';
import { Alert } from './index';
import { Button } from './index';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Import logger dynamically to avoid SSR issues
    if (typeof window !== 'undefined') {
      import('@/lib/logger')
        .then(({ logger }) => {
          logger.error('ErrorBoundary caught an error', error, {
            componentStack: errorInfo.componentStack,
          });
        })
        .catch((importError) => {
          // Fallback to console if logger import fails
          logger.error('ErrorBoundary caught an error (logger unavailable)', error, {
            componentStack: errorInfo.componentStack,
            importError,
          });
        });
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error reporting service in production
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });

    this.setState({ errorInfo });
  }

  override componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary if resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index]);

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Reset error boundary if resetOnPropsChange is true and props changed
    if (hasError && resetOnPropsChange) {
      const propsChanged = Object.keys(this.props).some(
        (key) =>
          key !== 'children' &&
          this.props[key as keyof ErrorBoundaryProps] !== prevProps[key as keyof ErrorBoundaryProps]
      );

      if (propsChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }, 0);
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <Alert variant="error" title="Une erreur est survenue" onClose={this.resetErrorBoundary}>
              <div className="space-y-4">
                <p className="text-sm">
                  {this.state.error?.message || "Une erreur inattendue s'est produite"}
                </p>

                {this.props.showDetails && this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium mb-2">Détails techniques</summary>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack && (
                        <>
                          {'\n\n'}
                          {this.state.errorInfo.componentStack}
                        </>
                      )}
                    </pre>
                  </details>
                )}

                <div className="flex gap-2 mt-4">
                  <Button variant="primary" size="sm" onClick={this.resetErrorBoundary}>
                    Réessayer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    Recharger la page
                  </Button>
                </div>
              </div>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap a component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

export default ErrorBoundary;
