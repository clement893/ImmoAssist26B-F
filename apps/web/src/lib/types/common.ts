/**
 * Common TypeScript types to replace 'any' usage
 */

import { AxiosError, AxiosRequestConfig } from 'axios';

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
  return (
    error instanceof Error &&
    ('response' in error || 'isAxiosError' in error || 'statusCode' in error)
  );
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
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return (
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An error occurred'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Extract error detail from API error response
 * Safe way to access error.response.data.detail
 */
export function getErrorDetail(error: unknown): string | undefined {
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
  if (isApiError(error)) {
    return error.response?.status || error.statusCode;
  }
  if (isAxiosErrorType(error)) {
    return error.response?.status;
  }
  return undefined;
}

/**
 * User interface for statistics and admin operations
 */
export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  resource_type?: string;
  resource_id?: number;
  created_at: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Activity log entry
 */
export interface ActivityLog {
  id: number;
  user_id?: number;
  activity_type: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Team interface
 */
export interface Team {
  id: number;
  name: string;
  slug?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Post/Blog post interface
 */
export interface Post {
  id: number;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Page interface
 */
export interface Page {
  id: number;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Project interface
 */
export interface Project {
  id: number;
  name: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Organization interface
 */
export interface Organization {
  id: number;
  name: string;
  slug?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
