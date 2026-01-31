/**
 * Error Types
 * Standardized error types for the application
 */

export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',

  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppErrorType {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
  timestamp?: string;
  stack?: string;
  retryable?: boolean;
  retryDelay?: number;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

/**
 * FastAPI validation error structure
 * FastAPI returns 422 errors in format: { "detail": [{ "type": "...", "loc": [...], "msg": "..." }] }
 */
export interface FastAPIValidationError {
  type: string;
  loc: (string | number)[];
  msg: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface FastAPIErrorResponse {
  detail: FastAPIValidationError[];
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    validationErrors?: ValidationErrorDetail[];
  };
  timestamp: string;
}
