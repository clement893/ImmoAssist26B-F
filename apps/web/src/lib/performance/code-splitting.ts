/**
 * Code Splitting Utilities
 * Optimize bundle size with dynamic imports
 */

import type { ComponentType } from 'react';

/**
 * Dynamically import a component only when needed
 */
export async function loadComponent<T>(importFn: () => Promise<{ default: T }>): Promise<T> {
  const module = await importFn();
  return module.default;
}

/**
 * Preload a component for faster subsequent loads
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<Record<string, unknown>> }>
) {
  if (typeof window !== 'undefined') {
    void importFn();
  }
}

/**
 * Load component with retry logic
 */
export async function loadComponentWithRetry<T>(
  importFn: () => Promise<{ default: T }>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const module = await importFn();
      return module.default;
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to load component');
}
