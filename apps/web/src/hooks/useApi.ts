/**
 * useApi Hook
 *
 * Reusable hook for API calls with loading, error, and retry handling.
 * Reduces code duplication across components that fetch data.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useApi('/api/v1/users');
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export interface UseApiOptions<T> {
  /** API endpoint URL */
  url: string;
  /** Request method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Request body */
  body?: unknown;
  /** Query parameters */
  params?: Record<string, unknown>;
  /** Whether to fetch immediately on mount */
  immediate?: boolean;
  /** Transform function for response data */
  transform?: (data: unknown) => T;
  /** Error handler */
  onError?: (error: Error) => void;
  /** Success handler */
  onSuccess?: (data: T) => void;
  /** Retry configuration */
  retry?: {
    attempts: number;
    delay: number;
  };
}

export interface UseApiResult<T> {
  /** Response data */
  data: T | null;
  /** Loading state */
  isLoading: boolean;
  /** Error object */
  error: Error | null;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Reset state */
  reset: () => void;
}

/**
 * useApi - Reusable hook for API calls
 */
export function useApi<T = unknown>(options: UseApiOptions<T>): UseApiResult<T> {
  const {
    url,
    method = 'GET',
    body,
    params,
    immediate = true,
    transform,
    onError,
    onSuccess,
    retry,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const executeRequest = useCallback(
    async (attempt = 1): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        let response;
        switch (method) {
          case 'GET':
            response = await apiClient.get<T>(url, { params });
            break;
          case 'POST':
            response = await apiClient.post<T>(url, body, { params });
            break;
          case 'PUT':
            response = await apiClient.put<T>(url, body, { params });
            break;
          case 'PATCH':
            response = await apiClient.patch<T>(url, body, { params });
            break;
          case 'DELETE':
            response = await apiClient.delete<T>(url, { params });
            break;
          default:
            throw new Error(`Unsupported HTTP method: ${method}`);
        }

        const result = transform ? transform(response.data) : (response.data as T);
        setData(result);
        onSuccess?.(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        // Retry logic
        if (retry && attempt < retry.attempts) {
          logger.warn(`API request failed, retrying (${attempt}/${retry.attempts})...`, {
            url,
            error,
          });
          await new Promise((resolve) => setTimeout(resolve, retry.delay));
          return executeRequest(attempt + 1);
        }

        setError(error);
        logger.error('API request failed', error, { url, method });
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [url, method, body, params, transform, onError, onSuccess, retry]
  );

  const refetch = useCallback(() => executeRequest(), [executeRequest]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      executeRequest();
    }
  }, [immediate, executeRequest]);

  return {
    data,
    isLoading,
    error,
    refetch,
    reset,
  };
}
