/**
 * React Query Client Configuration
 *
 * Provides a configured React Query client with default options
 * for caching, error handling, and request management.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Default query options for React Query
 */
const defaultQueryOptions = {
  queries: {
    // Stale time: 5 minutes (reduces refetches on navigation; was 2 min)
    staleTime: 1000 * 60 * 5,
    // Cache persists for 10 minutes
    gcTime: 1000 * 60 * 10, // Previously cacheTime
    // Retry failed requests
    retry: (failureCount: number, error: unknown) => {
      // Don't retry on 4xx errors (client errors)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on window focus only in production (disabled in dev for better DX)
    refetchOnWindowFocus: process.env.NODE_ENV === 'production',
    // Refetch on reconnect
    refetchOnReconnect: true,
    // Refetch on mount if data is stale (enabled to ensure fresh data when navigating)
    // This ensures data is up-to-date when users navigate between pages
    refetchOnMount: true,
  },
  mutations: {
    // Retry mutations once
    retry: 1,
    // Retry delay
    retryDelay: 1000,
  },
};

/**
 * Create a new QueryClient instance with default options
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
  });
}

/**
 * Singleton QueryClient instance
 * Use this for server-side rendering
 */
let queryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server-side: always create a new client
    return createQueryClient();
  }
  // Client-side: create singleton
  if (!queryClient) {
    queryClient = createQueryClient();
  }
  return queryClient;
}
