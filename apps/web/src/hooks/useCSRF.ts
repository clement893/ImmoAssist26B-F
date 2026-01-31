/**
 * useCSRF Hook
 * Hook React pour gérer les tokens CSRF côté client
 */

'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

export function useCSRF() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCSRFToken() {
      try {
        // Note: CSRF endpoint doesn't exist - application uses JWT Bearer tokens
        // CSRF protection is not needed with JWT authentication
        // If CSRF is needed in the future, create endpoint /v1/csrf-token
        // For now, try to get token from meta tag or cookie
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
          const token = metaTag.getAttribute('content');
          if (token) {
            setCsrfToken(token);
          }
        }
      } catch (error) {
        logger.error(
          'Failed to fetch CSRF token',
          error instanceof Error ? error : new Error(String(error)),
          {
            type: 'csrf',
          }
        );
      } finally {
        setLoading(false);
      }
    }

    fetchCSRFToken();
  }, []);

  return { csrfToken, loading };
}

/**
 * Helper function to add CSRF token to fetch requests
 */
export function withCSRF(url: string, options: RequestInit = {}): [string, RequestInit] {
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf-token='))
    ?.split('=')[1];

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('X-CSRF-Token', token);
  }

  return [url, { ...options, headers }];
}
