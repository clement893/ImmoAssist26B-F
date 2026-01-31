/**
 * API Client with Error Handling
 * Centralized API client with automatic error handling
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { handleApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { ApiResponse } from '@modele/types';
import { TokenStorage } from '../auth/tokenStorage';

// Lazy import getApiUrl to avoid circular dependency
function getApiUrlLazy(): string {
  // Dynamic import to break circular dependency
  const { getApiUrl } = require('../api');
  return getApiUrl();
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL?: string) {
    // Lazy evaluation of baseURL to avoid circular dependency
    if (!baseURL) {
      baseURL = `${getApiUrlLazy().replace(/\/$/, '')}/api`;
    }
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important: Include cookies in requests
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - Add authentication token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add authentication token if available
        if (typeof window !== 'undefined' && config.headers) {
          const token = TokenStorage.getToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        logger.debug('API request', {
          method: config.method,
          url: config.url,
          data: config.data,
        });
        return config;
      },
      (error) => {
        logger.error('API request error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with automatic token refresh
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('API response', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      async (error) => {
        const appError = handleApiError(error);
        const status = error.response?.status;
        const url = error.config?.url;
        const originalRequest = error.config;

        // Handle 401 Unauthorized - try to refresh token
        if (status === 401 && originalRequest && !originalRequest._retry) {
          // Mark request as retried to prevent infinite loop
          originalRequest._retry = true;

          const refreshToken = TokenStorage.getRefreshToken();

          if (refreshToken && typeof window !== 'undefined') {
            try {
              // Try to refresh the token
              // Use a separate axios instance to avoid interceptors recursion
              const refreshAxios = axios.create({
                baseURL: this.client.defaults.baseURL,
                timeout: 10000,
                withCredentials: true,
              });

              const refreshResponse = await refreshAxios.post('/v1/auth/refresh', {
                refresh_token: refreshToken,
              });

              // FastAPI returns data directly, not wrapped in ApiResponse
              const responseData = refreshResponse.data;
              const access_token = responseData?.access_token || responseData?.accessToken;

              if (access_token) {
                // Update token in storage
                await TokenStorage.setToken(access_token, refreshToken);

                // Update authorization header
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${access_token}`;

                // Retry the original request
                return this.client.request(originalRequest);
              } else {
                throw new Error('No access_token in refresh response');
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens and redirect to login
              logger.warn('Token refresh failed', refreshError);
              await TokenStorage.removeTokens();

              // Only redirect if we're on a protected page (not public pages like home, login, register)
              const isPublicPage =
                typeof window !== 'undefined' &&
                (window.location.pathname === '/' ||
                  window.location.pathname.match(/^\/(en|fr|ar|he)?\/?$/) ||
                  window.location.pathname.includes('/auth/') ||
                  window.location.pathname.includes('/components') ||
                  window.location.pathname.includes('/pricing'));

              // Prevent redirect loop - check if already on login page or public page
              if (
                typeof window !== 'undefined' &&
                !isPublicPage &&
                !window.location.pathname.includes('/auth/login')
              ) {
                window.location.href = '/auth/login?error=session_expired';
              }

              return Promise.reject(appError);
            }
          } else {
            // No refresh token available, clear tokens and redirect
            logger.warn('No refresh token available for 401 error');
            await TokenStorage.removeTokens();

            // Only redirect if we're on a protected page (not public pages like home, login, register)
            const isPublicPage =
              typeof window !== 'undefined' &&
              (window.location.pathname === '/' ||
                window.location.pathname.match(/^\/(en|fr|ar|he)?\/?$/) ||
                window.location.pathname.includes('/auth/') ||
                window.location.pathname.includes('/components') ||
                window.location.pathname.includes('/pricing'));

            // Prevent redirect loop - check if already on login page or public page
            if (
              typeof window !== 'undefined' &&
              !isPublicPage &&
              !window.location.pathname.includes('/auth/login')
            ) {
              window.location.href = '/auth/login?error=unauthorized';
            }

            return Promise.reject(appError);
          }
        }

        // Don't log 401 errors as critical - they're expected for unauthorized users
        // Log them as warnings instead
        if (status === 401) {
          logger.warn('API unauthorized access', {
            status,
            url,
            message: appError.message,
          });
        } else {
          logger.error('API response error', appError, {
            status,
            url,
          });
        }
        return Promise.reject(appError);
      }
    );
  }

  /**
   * Generic request method to reduce duplication
   */
  private async request<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      let response: AxiosResponse<ApiResponse<T>>;

      if (method === 'get' || method === 'delete') {
        response = await this.client[method](url, config);
      } else {
        response = await this.client[method](url, data, config);
      }

      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('get', url, undefined, config);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('post', url, data, config);
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('put', url, data, config);
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('patch', url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('delete', url, undefined, config);
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }
}

export { ApiClient };

// Lazy initialization to avoid circular dependency issues
// Use a getter function instead of direct instantiation
let _apiClientInstance: ApiClient | null = null;

function getApiClient(): ApiClient {
  if (!_apiClientInstance) {
    _apiClientInstance = new ApiClient();
  }
  return _apiClientInstance;
}

// Export as a Proxy to maintain the same API while using lazy initialization
export const apiClient = new Proxy({} as ApiClient, {
  get(_target, prop) {
    const instance = getApiClient();
    const propKey = typeof prop === 'string' ? prop : String(prop);
    const value = (instance as unknown as Record<string, unknown>)[propKey];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
  set(_target, prop, value) {
    const instance = getApiClient();
    const propKey = typeof prop === 'string' ? prop : String(prop);
    (instance as unknown as Record<string, unknown>)[propKey] = value;
    return true;
  },
});
