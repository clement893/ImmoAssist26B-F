/**
 * Application Error Class
 * Standardized error class for the application
 */

import { ErrorCode, type AppErrorType } from './types';

export class AppError extends Error implements AppErrorType {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON(): AppErrorType {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }
}

// Predefined error classes
export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.BAD_REQUEST, message, 400, details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: Record<string, unknown>) {
    super(ErrorCode.UNAUTHORIZED, message, 401, details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: Record<string, unknown>) {
    super(ErrorCode.FORBIDDEN, message, 403, details);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: Record<string, unknown>) {
    super(ErrorCode.NOT_FOUND, message, 404, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.CONFLICT, message, 409, details);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(ErrorCode.VALIDATION_ERROR, message, 422, details);
    this.name = 'ValidationError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: Record<string, unknown>) {
    super(ErrorCode.INTERNAL_SERVER_ERROR, message, 500, details);
    this.name = 'InternalServerError';
  }
}
