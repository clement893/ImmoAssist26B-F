/**
 * Error handling utilities
 * Type-safe error handling for API errors (Axios) and general errors
 */

interface AxiosErrorResponse {
  response?: {
    data?: {
      detail?: string;
      message?: string;
    };
  };
  message?: string;
}

/**
 * Check if error is an Axios error
 */
function isAxiosError(error: unknown): error is AxiosErrorResponse {
  return typeof error === 'object' && error !== null && ('response' in error || 'message' in error);
}

/**
 * Extract error message from unknown error
 * Handles Axios errors and standard Error objects
 */
export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.detail || error.response?.data?.message || error.message || fallback
    );
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

/**
 * Extract error detail from Axios error response
 */
export function getErrorDetail(error: unknown): string | undefined {
  if (isAxiosError(error)) {
    return error.response?.data?.detail;
  }
  return undefined;
}
