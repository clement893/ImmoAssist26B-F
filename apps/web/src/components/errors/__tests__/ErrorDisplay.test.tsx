/**
 * Error Display Component Tests
 *
 * Tests for the ErrorDisplay component covering:
 * - Error message display
 * - Retry functionality
 * - Auto-retry
 * - Error details display
 * - Status code display
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorDisplay } from '../ErrorDisplay';
import { AppError } from '@/lib/errors/AppError';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('ErrorDisplay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Error Message Display', () => {
    it('displays error message from error prop', () => {
      const error = new AppError('FETCH_ERROR', 'Failed to fetch data');
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('Failed to fetch data')).toBeInTheDocument();
    });

    it('displays custom title and message', () => {
      render(<ErrorDisplay title="Custom Title" message="Custom message" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });

    it('displays default message when no error provided', () => {
      render(<ErrorDisplay />);

      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  describe('Error Code and Status Display', () => {
    it('displays error code badge', () => {
      const error = new AppError('FETCH_ERROR', 'Error message');
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('FETCH_ERROR')).toBeInTheDocument();
    });

    it('displays status code badge', () => {
      render(<ErrorDisplay statusCode={404} />);

      expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('displays both code and status code', () => {
      const error = new AppError('NOT_FOUND', 'Not found', { statusCode: 404 });
      render(<ErrorDisplay error={error} />);

      expect(screen.getByText('NOT_FOUND')).toBeInTheDocument();
      expect(screen.getByText('404')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('calls onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('does not show retry button when onRetry is not provided', () => {
      render(<ErrorDisplay />);

      const retryButton = screen.queryByRole('button', { name: /retry/i });
      expect(retryButton).not.toBeInTheDocument();
    });
  });

  describe('Auto-Retry', () => {
    it('automatically retries when autoRetry is enabled', async () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay onRetry={onRetry} autoRetry retryDelay={1000} />);

      // Fast-forward time
      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(onRetry).toHaveBeenCalledTimes(1);
      });
    });

    it('does not auto-retry when autoRetry is disabled', async () => {
      const onRetry = vi.fn();
      render(<ErrorDisplay onRetry={onRetry} autoRetry={false} retryDelay={1000} />);

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(onRetry).not.toHaveBeenCalled();
      });
    });
  });

  describe('Error Details', () => {
    it('shows error details when showDetails is true', () => {
      const error = new AppError('FETCH_ERROR', 'Error message', {
        details: { field: 'email', reason: 'invalid' },
      });

      render(<ErrorDisplay error={error} showDetails />);

      expect(screen.getByText(/details/i)).toBeInTheDocument();
    });

    it('hides error details when showDetails is false', () => {
      const error = new AppError('FETCH_ERROR', 'Error message', {
        details: { field: 'email' },
      });

      render(<ErrorDisplay error={error} showDetails={false} />);

      expect(screen.queryByText(/details/i)).not.toBeInTheDocument();
    });
  });

  describe('Reset Functionality', () => {
    it('calls onReset when reset button is clicked', () => {
      const onReset = vi.fn();
      render(<ErrorDisplay onReset={onReset} />);

      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('does not show reset button when onReset is not provided', () => {
      render(<ErrorDisplay />);

      const resetButton = screen.queryByRole('button', { name: /reset/i });
      expect(resetButton).not.toBeInTheDocument();
    });
  });

  describe('Children Display', () => {
    it('renders children content', () => {
      render(
        <ErrorDisplay>
          <div>Custom content</div>
        </ErrorDisplay>
      );

      expect(screen.getByText('Custom content')).toBeInTheDocument();
    });
  });
});
