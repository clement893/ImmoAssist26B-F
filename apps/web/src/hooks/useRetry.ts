/**
 * useRetry Hook
 * Provides retry functionality for failed operations
 */

import { useState, useCallback } from 'react';

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Delay between retries in milliseconds */
  delay?: number;
  /** Whether to use exponential backoff */
  exponentialBackoff?: boolean;
  /** Base delay for exponential backoff */
  baseDelay?: number;
  /** Maximum delay cap for exponential backoff */
  maxDelay?: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
}

export interface RetryState {
  /** Current attempt number (0 = initial attempt) */
  attempt: number;
  /** Whether operation is currently retrying */
  isRetrying: boolean;
  /** Last error encountered */
  lastError: Error | null;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  exponentialBackoff: true,
  baseDelay: 1000,
  maxDelay: 10000,
  isRetryable: (error: unknown) => {
    // Retry on network errors and 5xx server errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') || message.includes('timeout') || message.includes('fetch')
      );
    }
    return false;
  },
};

/**
 * Hook for retrying failed operations
 *
 * @example
 * ```tsx
 * const { execute, attempt, isRetrying, lastError } = useRetry({
 *   maxAttempts: 3,
 *   delay: 1000
 * });
 *
 * const result = await execute(async () => {
 *   return await apiCall();
 * });
 * ```
 */
export function useRetry(options: RetryOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [state, setState] = useState<RetryState>({
    attempt: 0,
    isRetrying: false,
    lastError: null,
  });

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const calculateDelay = useCallback(
    (attempt: number): number => {
      if (!opts.exponentialBackoff) {
        return opts.delay;
      }

      const delay = opts.baseDelay * Math.pow(2, attempt);
      return Math.min(delay, opts.maxDelay);
    },
    [opts]
  );

  const execute = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= opts.maxAttempts; attempt++) {
        setState({
          attempt,
          isRetrying: attempt > 0,
          lastError: null,
        });

        try {
          const result = await operation();

          // Success - reset state
          setState({
            attempt: 0,
            isRetrying: false,
            lastError: null,
          });

          return result;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Check if error is retryable
          if (!opts.isRetryable(error)) {
            setState({
              attempt,
              isRetrying: false,
              lastError,
            });
            throw error;
          }

          // If this was the last attempt, throw the error
          if (attempt >= opts.maxAttempts) {
            setState({
              attempt,
              isRetrying: false,
              lastError,
            });
            throw error;
          }

          // Wait before retrying
          const delay = calculateDelay(attempt);
          await sleep(delay);
        }
      }

      // This should never be reached, but TypeScript needs it
      throw lastError || new Error('Operation failed after all retries');
    },
    [opts, calculateDelay]
  );

  const reset = useCallback(() => {
    setState({
      attempt: 0,
      isRetrying: false,
      lastError: null,
    });
  }, []);

  return {
    execute,
    reset,
    attempt: state.attempt,
    isRetrying: state.isRetrying,
    lastError: state.lastError,
  };
}
