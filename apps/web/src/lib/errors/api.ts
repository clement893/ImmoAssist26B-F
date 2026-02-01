/**
 * API Error Handling
 * Centralized error handling for API calls
 */

/**
 * API Error Handling
 * Centralized error handling for API calls with Sentry integration
 */

import { AxiosError } from 'axios';
import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './AppError';
import {
  ErrorCode,
  type ApiErrorResponse,
  type FastAPIValidationError,
  type ValidationErrorDetail,
} from './types';
import { captureException } from '@/lib/sentry/client';
import { logger } from '@/lib/logger';

/**
 * Convert HTTP status code to ErrorCode
 */
function statusCodeToErrorCode(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 422:
      return ErrorCode.VALIDATION_ERROR;
    case 429:
      return ErrorCode.RATE_LIMIT_EXCEEDED;
    case 500:
      return ErrorCode.INTERNAL_SERVER_ERROR;
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return ErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * Create AppError from HTTP status code
 */
function createErrorFromStatusCode(
  statusCode: number,
  message: string,
  details?: Record<string, unknown>
): AppError {
  const code = statusCodeToErrorCode(statusCode);

  switch (code) {
    case ErrorCode.BAD_REQUEST:
      return new BadRequestError(message, details);
    case ErrorCode.UNAUTHORIZED:
      return new UnauthorizedError(message, details);
    case ErrorCode.FORBIDDEN:
      return new ForbiddenError(message, details);
    case ErrorCode.NOT_FOUND:
      return new NotFoundError(message, details);
    case ErrorCode.CONFLICT:
      return new ConflictError(message, details);
    case ErrorCode.VALIDATION_ERROR:
      return new ValidationError(message, details);
    default:
      return new InternalServerError(message, details);
  }
}

/**
 * Handles Axios errors and converts them to standardized AppError instances.
 *
 * This function provides detailed error messages based on the error type:
 * - Network errors: Clear message about connection issues
 * - API errors: Uses server-provided message or generates contextual message
 * - Validation errors: Includes field-level validation details
 * - Unknown errors: Provides fallback message with error details
 *
 * @param error - The error to handle (AxiosError, AppError, Error, or unknown)
 * @returns A standardized AppError instance with detailed information
 *
 * @example
 * ```typescript
 * try {
 *   await apiClient.get('/users');
 * } catch (error) {
 *   const appError = handleApiError(error);
 *   logger.error('', appError.message); // Detailed error message
 *   logger.error('', appError.details); // Additional context
 * }
 * ```
 */
export function handleApiError(error: unknown): AppError {
  // Already an AppError - return as-is
  if (error instanceof AppError) {
    return error;
  }

  // Axios error - extract detailed information
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status ?? 500;
    const responseData = error.response?.data as
      | ApiErrorResponse
      | Record<string, unknown>
      | undefined;
    const requestUrl = error.config?.url ?? 'unknown';
    const requestMethod = error.config?.method?.toUpperCase() ?? 'UNKNOWN';

    // Check for FastAPI standard validation error format (detail array)
    // FastAPI returns 422 errors in format: { "detail": [{ "type": "...", "loc": [...], "msg": "..." }] }
    if (
      statusCode === 422 &&
      responseData &&
      typeof responseData === 'object' &&
      'detail' in responseData &&
      Array.isArray(responseData.detail)
    ) {
      logger.error(
        '[handleApiError] FastAPI standard validation format detected',
        new Error('Validation error'),
        { responseData }
      );

      // Convert FastAPI format to our format
      const fastApiErrors = responseData.detail as FastAPIValidationError[];
      const validationErrors: ValidationErrorDetail[] = fastApiErrors.map(
        (err: FastAPIValidationError) => ({
          field: Array.isArray(err.loc) ? err.loc.join('.') : String(err.loc || 'unknown'),
          message: err.msg || String(err),
          code: err.type || 'validation_error',
        })
      );

      // Extract messages
      const validationMessages = validationErrors
        .map((err: ValidationErrorDetail) => err.message)
        .filter((msg: string) => typeof msg === 'string' && msg.length > 0);

      if (validationMessages.length > 0) {
        // Use the validation messages
        const message = validationMessages.join('\n');
        logger.debug('[handleApiError] Extracted messages from FastAPI detail format', { message });

        return new ValidationError(message, {
          url: requestUrl,
          method: requestMethod,
          statusCode,
          validationErrors,
        });
      }
    }

    // Generate contextual error message based on status code
    // FastAPI returns HTTPException errors in format: { "detail": "message" }
    // Check for both formats: responseData.error.message and responseData.detail
    let message: string | undefined;
    
    if (
      responseData &&
      typeof responseData === 'object' &&
      'error' in responseData &&
      typeof responseData.error === 'object' &&
      responseData.error &&
      'message' in responseData.error
    ) {
      message = String(responseData.error.message);
    } else if (
      responseData &&
      typeof responseData === 'object' &&
      'detail' in responseData &&
      typeof responseData.detail === 'string'
    ) {
      // FastAPI HTTPException format
      message = String(responseData.detail);
    } else {
      message = error.message;
    }

    if (!message || message === 'Request failed with status code') {
      // Generate user-friendly messages for common status codes
      switch (statusCode) {
        case 400:
          message = `Invalid request to ${requestMethod} ${requestUrl}. Please check your input and try again.`;
          break;
        case 401:
          message = 'Your session has expired. Please log in again.';
          break;
        case 403:
          message = `You don't have permission to access ${requestUrl}.`;
          break;
        case 404:
          message = `The resource at ${requestUrl} was not found.`;
          break;
        case 409:
          message = `A conflict occurred while processing your request to ${requestUrl}.`;
          break;
        case 422:
          message = 'Validation failed. Please check your input and try again.';
          break;
        case 429:
          // Check if retry_after is provided in response
          const retryAfter =
            responseData && typeof responseData === 'object' && 'retry_after' in responseData
              ? responseData.retry_after
              : responseData &&
                  typeof responseData === 'object' &&
                  'error' in responseData &&
                  typeof responseData.error === 'object' &&
                  responseData.error &&
                  'retry_after' in responseData.error
                ? responseData.error.retry_after
                : undefined;
          if (retryAfter) {
            const seconds = parseInt(String(retryAfter), 10);
            const minutes = Math.ceil(seconds / 60);
            if (minutes > 1) {
              message = `Too many registration attempts. Please wait ${minutes} minutes before trying again.`;
            } else {
              message = `Too many registration attempts. Please wait ${seconds} seconds before trying again.`;
            }
          } else {
            message = 'Too many registration attempts. Please wait a minute before trying again.';
          }
          break;
        case 500:
          message = 'Server error occurred. Our team has been notified. Please try again later.';
          break;
        case 503:
          message = 'Service temporarily unavailable. Please try again in a few moments.';
          break;
        default:
          message = `An error occurred while processing your request (${statusCode}).`;
      }
    }

    // Extract comprehensive details from API response
    const errorDetails =
      responseData &&
      typeof responseData === 'object' &&
      'error' in responseData &&
      typeof responseData.error === 'object' &&
      responseData.error &&
      'details' in responseData.error &&
      typeof responseData.error.details === 'object'
        ? responseData.error.details
        : {};
    const details: Record<string, unknown> = {
      url: requestUrl,
      method: requestMethod,
      statusCode,
      ...errorDetails,
    };

    // Add validation errors if present (for 422 errors)
    const validationErrors =
      responseData &&
      typeof responseData === 'object' &&
      'error' in responseData &&
      typeof responseData.error === 'object' &&
      responseData.error &&
      'validationErrors' in responseData.error &&
      Array.isArray(responseData.error.validationErrors)
        ? responseData.error.validationErrors
        : undefined;
    if (validationErrors) {
      details.validationErrors = validationErrors;

      // Debug logging to help diagnose issues (always log, even in production for debugging)
      logger.error('[handleApiError] Validation errors received', new Error('Validation error'), {
        validationErrors,
        responseData,
        statusCode,
        fullResponse: JSON.stringify(responseData, null, 2),
      });

      // FastAPI returns validationErrors as an array of {field, message, code}
      // Extract field names and messages for better error message
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        // Extract the actual validation messages (they contain detailed info)
        const validationMessages = validationErrors
          .map((err: ValidationErrorDetail | Record<string, unknown>) => {
            // Handle both ValidationErrorDetail and unknown formats
            if ('message' in err && typeof err.message === 'string') {
              return err.message;
            }
            if ('msg' in err && typeof err.msg === 'string') {
              return err.msg;
            }
            if ('detail' in err && typeof err.detail === 'string') {
              return err.detail;
            }
            return String(err);
          })
          .filter(
            (msg: string) =>
              typeof msg === 'string' && msg.length > 0 && !msg.includes('Request failed')
          );

        logger.debug('[handleApiError] Extracted validation messages', { validationMessages });

        // If we have detailed validation messages, ALWAYS use them instead of generic message
        if (validationMessages.length > 0) {
          // Join all messages - they contain the formatted error details from Pydantic
          // The message from Pydantic validator contains the full formatted error with all details
          message = validationMessages.join('\n');
          logger.debug('[handleApiError] Using validation message', { message });
        } else {
          // If no messages extracted, try to extract from the error object itself
          logger.warn(
            '[handleApiError] No validation messages extracted, trying alternative extraction'
          );
          const alternativeMessages = validationErrors
            .map((err: ValidationErrorDetail | Record<string, unknown>) => {
              // Try to stringify the whole error object
              if (typeof err === 'object' && err !== null) {
                return JSON.stringify(err);
              }
              return String(err);
            })
            .filter((msg: string) => msg.length > 0 && !msg.includes('Request failed'));

          if (alternativeMessages.length > 0) {
            message = alternativeMessages.join('\n');
          } else {
            // Last resort: log the full validationErrors for debugging
            logger.error(
              '[handleApiError] No validation messages extracted',
              new Error('Validation extraction failed'),
              { validationErrors: JSON.stringify(validationErrors, null, 2) }
            );
            message = `Erreur de validation. Détails: ${JSON.stringify(validationErrors)}`;
          }
        }
      } else if (typeof validationErrors === 'object') {
        // Handle object format (legacy or other formats)
        const validationFields = Object.keys(validationErrors).join(', ');
        message = `Validation failed for fields: ${validationFields}. ${message}`;
      }
    } else if (statusCode === 422) {
      // Check for FastAPI standard validation error format (detail array)
      // FastAPI returns 422 errors in format: { "detail": [{ "type": "...", "loc": [...], "msg": "..." }] }
      if (
        responseData &&
        typeof responseData === 'object' &&
        'detail' in responseData &&
        Array.isArray(responseData.detail)
      ) {
        logger.error(
          '[handleApiError] FastAPI standard validation format detected',
          new Error('Validation error'),
          { responseData }
        );

        // Convert FastAPI format to our format
        const fastApiErrors = responseData.detail as FastAPIValidationError[];
        const validationErrors: ValidationErrorDetail[] = fastApiErrors.map(
          (err: FastAPIValidationError) => ({
            field: Array.isArray(err.loc) ? err.loc.join('.') : String(err.loc || 'unknown'),
            message: err.msg || String(err),
            code: err.type || 'validation_error',
          })
        );

        details.validationErrors = validationErrors;

        // Extract messages
        const validationMessages = validationErrors
          .map((err: ValidationErrorDetail) => err.message)
          .filter(
            (msg: string) =>
              typeof msg === 'string' && msg.length > 0 && !msg.includes('Request failed')
          );

        if (validationMessages.length > 0) {
          // Use the validation messages instead of generic message
          message = validationMessages.join('\n');
          logger.debug('[handleApiError] Extracted messages from FastAPI detail format', {
            message,
          });
        } else {
          // If no messages extracted, log the full detail for debugging
          logger.error(
            '[handleApiError] No validation messages extracted from FastAPI detail',
            new Error('Validation extraction failed'),
            { detail: JSON.stringify(responseData.detail, null, 2) }
          );
          message = `Erreur de validation. Détails: ${JSON.stringify(responseData.detail)}`;
        }
      } else {
        // If 422 but no validationErrors and no detail, log the full response for debugging
        logger.error(
          '[handleApiError] 422 error but no validationErrors or detail',
          new Error('Validation error format unknown'),
          {
            responseData,
            fullResponse: JSON.stringify(responseData, null, 2),
          }
        );
      }
    }

    const appError = createErrorFromStatusCode(statusCode, message, details);

    // Send to Sentry for server errors (5xx) and unexpected client errors
    // Don't send 401 errors to Sentry - they're expected for unauthorized users
    const hasErrorMessage =
      responseData &&
      typeof responseData === 'object' &&
      'error' in responseData &&
      typeof responseData.error === 'object' &&
      responseData.error &&
      'message' in responseData.error;
    if (statusCode >= 500 || (statusCode >= 400 && statusCode !== 401 && !hasErrorMessage)) {
      captureException(new Error(message), {
        tags: {
          errorType: 'api_error',
          statusCode: String(statusCode),
          method: requestMethod,
        },
        extra: details,
      });
    }

    return appError;
  }

  // Network error - provide clear guidance with retry suggestion
  if (error instanceof Error) {
    if (error.message.includes('Network Error') || error.message.includes('timeout')) {
      const networkError = new AppError(
        ErrorCode.NETWORK_ERROR,
        'Unable to connect to the server. Please check your internet connection and try again.',
        0,
        {
          originalMessage: error.message,
          suggestion: 'Check your network connection or try again in a few moments.',
          retryable: true,
          retryDelay: 2000, // Suggest retry after 2 seconds
        }
      );

      // Log network errors to Sentry (less critical, but useful for monitoring)
      captureException(error, {
        tags: {
          errorType: 'network_error',
        },
        level: 'warning',
      });

      return networkError;
    }

    const unexpectedError = new InternalServerError(
      `An unexpected error occurred: ${error.message}`,
      { originalError: error.message }
    );

    // Send unexpected errors to Sentry
    captureException(error, {
      tags: {
        errorType: 'unexpected_error',
      },
    });

    return unexpectedError;
  }

  // Unknown error - provide fallback with context
  const unknownError = new InternalServerError(
    'An unknown error occurred. Please try again or contact support if the problem persists.',
    { errorType: typeof error, errorValue: String(error) }
  );

  // Send unknown errors to Sentry
  captureException(new Error('Unknown error type'), {
    tags: {
      errorType: 'unknown_error',
    },
    extra: { errorType: typeof error, errorValue: String(error) },
  });

  return unknownError;
}

/**
 * Checks if the error is a client error (4xx status code).
 *
 * Client errors indicate issues with the request itself, such as:
 * - Invalid input (400)
 * - Authentication required (401)
 * - Insufficient permissions (403)
 * - Resource not found (404)
 * - Validation errors (422)
 *
 * @param error - The AppError instance to check
 * @returns True if the error is a client error (4xx), false otherwise
 */
export function isClientError(error: AppError): boolean {
  return error.statusCode >= 400 && error.statusCode < 500;
}

/**
 * Checks if the error is a server error (5xx status code).
 *
 * Server errors indicate issues on the server side, such as:
 * - Internal server errors (500)
 * - Service unavailable (503)
 * - Gateway errors (502)
 *
 * @param error - The AppError instance to check
 * @returns True if the error is a server error (5xx), false otherwise
 */
export function isServerError(error: AppError): boolean {
  return error.statusCode >= 500;
}

/**
 * Checks if the error is a network error.
 *
 * Network errors occur when:
 * - The request cannot reach the server
 * - Connection timeout
 * - DNS resolution failure
 * - No internet connection
 *
 * @param error - The AppError instance to check
 * @returns True if the error is a network error, false otherwise
 */
export function isNetworkError(error: AppError): boolean {
  return error.code === ErrorCode.NETWORK_ERROR || error.statusCode === 0;
}
