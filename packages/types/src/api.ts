/**
 * API-related types
 */

// Import types directly to avoid circular dependency
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// HTTP Methods
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// API Endpoint configuration
export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  requiresAuth?: boolean;
}

// Request configuration
export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
}

// API Client interface
export interface ApiClient {
  get<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
  post<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>>;
  put<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>>;
  patch<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
  ): Promise<ApiResponse<T>>;
  delete<T>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>;
}

// Paginated request
export interface PaginatedRequest extends PaginationParams {
  [key: string]: unknown;
}
