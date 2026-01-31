/**
 * API Utilities
 * Helper functions for working with API responses
 */

import type { ApiResponse } from '@modele/types';

/**
 * Type guard to check if response is ApiResponse
 */
export function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    typeof (response as ApiResponse<T>).success === 'boolean'
  );
}

/**
 * Extract data from API response (handles both ApiResponse<T> and direct T)
 * FastAPI may return data directly or wrapped in ApiResponse
 */
export function extractApiData<T>(response: ApiResponse<T> | T): T {
  if (isApiResponse(response)) {
    // If response.data exists, use it; otherwise response itself might be the data
    // This handles cases where FastAPI returns data directly
    return (response.data !== undefined && response.data !== null ? response.data : response) as T;
  }
  return response as T;
}
