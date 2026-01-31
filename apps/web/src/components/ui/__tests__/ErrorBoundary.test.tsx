import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders fallback UI when error occurs', () => {
    render(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  it('renders default error UI when no fallback provided', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    // Should show default error message
    expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const handleError = vi.fn();
    render(
      <ErrorBoundary onError={handleError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(handleError).toHaveBeenCalled();
  });

  it('shows error details when showDetails is true', () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    // Should show error details
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
  });

  it('hides error details when showDetails is false', () => {
    render(
      <ErrorBoundary showDetails={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    // Should not show detailed error message
    const errorMessage = screen.queryByText(/test error/i);
    expect(errorMessage).not.toBeInTheDocument();
  });

  it('resets error state when resetKeys change', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1']}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('resets error state when resetOnPropsChange is true', () => {
    const { rerender } = render(
      <ErrorBoundary resetOnPropsChange={true} title="Original">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetOnPropsChange={true} title="Changed">
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('displays error message in default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
  });

  it('displays technical details when showDetails is true', () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/détails techniques/i)).toBeInTheDocument();
  });

  it('renders reset button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/réessayer/i)).toBeInTheDocument();
  });

  it('renders reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText(/recharger la page/i)).toBeInTheDocument();
  });

  it('handles error without message', () => {
    const ThrowErrorNoMessage = () => {
      throw new Error();
    };
    render(
      <ErrorBoundary>
        <ThrowErrorNoMessage />
      </ErrorBoundary>
    );
    expect(screen.getByText(/une erreur inattendue/i)).toBeInTheDocument();
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
