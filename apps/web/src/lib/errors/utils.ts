/**
 * Error Handling Utilities
 * Consolidated error handling utilities for API errors and general errors
 */

import { AxiosError, AxiosRequestConfig } from 'axios';
import { AppError } from './AppError';

/**
 * API Error with proper typing
 */
export interface ApiError extends Error {
  response?: {
    status: number;
    statusText: string;
    data?: {
      detail?: string;
      message?: string;
      errors?: Record<string, unknown>;
    };
    headers?: Record<string, string>;
    config?: AxiosRequestConfig;
  };
  config?: AxiosRequestConfig;
  isAxiosError?: boolean;
  statusCode?: number;
}

/**
 * Type guard to check if error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  if (!error || typeof error !== 'object') {
    return false;
  }
  // Check if it has API error properties (response, isAxiosError, or statusCode)
  return 'response' in error || 'isAxiosError' in error || 'statusCode' in error;
}

/**
 * Type guard to check if error is an Axios error
 */
export function isAxiosErrorType(error: unknown): error is AxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as { isAxiosError?: boolean }).isAxiosError === true
  );
}

/**
 * Extract error message from various error types
 * Supports both English and French fallback messages
 */
export function getErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof AppError) {
    return error.message || fallback || 'An error occurred';
  }
  if (isApiError(error)) {
    // Check for detail first, then message, then error.message
    const apiError = error as ApiError;
    if (apiError.response?.data?.detail) {
      return apiError.response.data.detail;
    }
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
    if ('message' in apiError && typeof apiError.message === 'string') {
      return apiError.message;
    }
    return fallback || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message || fallback || 'An error occurred';
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback || 'An unknown error occurred';
}

/**
 * Extract error detail from API error response
 * Safe way to access error.response.data.detail
 */
export function getErrorDetail(error: unknown): string | undefined {
  if (error instanceof AppError) {
    // Check if details has a 'detail' property
    if (error.details && typeof error.details === 'object' && 'detail' in error.details) {
      return String(error.details.detail);
    }
    return undefined;
  }
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'detail' in error.response.data
  ) {
    return String(error.response.data.detail);
  }
  return undefined;
}

/**
 * Extract status code from error
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  if (isApiError(error)) {
    return error.response?.status || error.statusCode;
  }
  if (isAxiosErrorType(error)) {
    return error.response?.status;
  }
  return undefined;
}
