/**
 * API Error Component Tests
 *
 * Tests for the ApiError component covering:
 * - Error handling and display
 * - Retry functionality
 * - Network vs server error detection
 * - Error logging
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApiError } from '../ApiError';
import { AppError } from '@/lib/errors/AppError';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock error utilities
vi.mock('@/lib/errors/api', async () => {
  const actual = await vi.importActual('@/lib/errors/api');
  return {
    ...actual,
    handleApiError: vi.fn((error) => {
      if (error instanceof AppError) {
        return error;
      }
      return new AppError('UNKNOWN_ERROR', 'An error occurred');
    }),
    isNetworkError: vi.fn((error) => error.code === 'NETWORK_ERROR'),
    isServerError: vi.fn((error) => error.statusCode && error.statusCode >= 500),
  };
});

describe('ApiError Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error Display', () => {
    it('displays error message', () => {
      const error = new AppError('FETCH_ERROR', 'Failed to fetch data');
      render(<ApiError error={error} />);

      expect(screen.getByText(/failed to fetch data/i)).toBeInTheDocument();
    });

    it('handles unknown errors gracefully', () => {
      const error = new Error('Something went wrong');
      render(<ApiError error={error} />);

      expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
    });

    it('displays custom children', () => {
      const error = new AppError('FETCH_ERROR', 'Error message');
      render(
        <ApiError error={error}>
          <div>Custom error content</div>
        </ApiError>
      );

      expect(screen.getByText('Custom error content')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('shows retry button for network errors', async () => {
      const error = new AppError('NETWORK_ERROR', 'Network error');
      const onRetry = vi.fn();

      const errorApi = await import('@/lib/errors/api');
      vi.mocked(errorApi.handleApiError).mockReturnValue(error);
      vi.mocked(errorApi.isNetworkError).mockReturnValue(true);

      render(<ApiError error={error} onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('shows retry button for server errors', async () => {
      const error = new AppError('SERVER_ERROR', 'Server error', { statusCode: 500 });
      const onRetry = vi.fn();

      const errorApi = await import('@/lib/errors/api');
      vi.mocked(errorApi.handleApiError).mockReturnValue(error);
      vi.mocked(errorApi.isServerError).mockReturnValue(true);

      render(<ApiError error={error} onRetry={onRetry} />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('does not show retry button for client errors', async () => {
      const error = new AppError('VALIDATION_ERROR', 'Validation error', { statusCode: 400 });
      const onRetry = vi.fn();

      const errorApi = await import('@/lib/errors/api');
      vi.mocked(errorApi.handleApiError).mockReturnValue(error);
      vi.mocked(errorApi.isNetworkError).mockReturnValue(false);
      vi.mocked(errorApi.isServerError).mockReturnValue(false);

      render(<ApiError error={error} onRetry={onRetry} />);

      const retryButton = screen.queryByRole('button', { name: /retry/i });
      expect(retryButton).not.toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('logs errors with context', async () => {
      const { logger } = await import('@/lib/logger');
      const error = new AppError('FETCH_ERROR', 'Error message', { statusCode: 404 });

      render(<ApiError error={error} />);

      expect(logger.error).toHaveBeenCalledWith(
        'API error',
        expect.any(AppError),
        expect.objectContaining({
          code: 'FETCH_ERROR',
          statusCode: 404,
        })
      );
    });
  });

  describe('Network Error Specific Display', () => {
    it('shows network error message for network errors', async () => {
      const error = new AppError('NETWORK_ERROR', 'Network error');
      const errorApi = await import('@/lib/errors/api');
      vi.mocked(errorApi.handleApiError).mockReturnValue(error);
      vi.mocked(errorApi.isNetworkError).mockReturnValue(true);

      render(<ApiError error={error} />);

      expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
    });
  });

  describe('Reset Functionality', () => {
    it('calls onReset when reset button is clicked', () => {
      const error = new AppError('FETCH_ERROR', 'Error message');
      const onReset = vi.fn();

      render(<ApiError error={error} onReset={onReset} />);

      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);

      expect(onReset).toHaveBeenCalledTimes(1);
    });
  });
});
