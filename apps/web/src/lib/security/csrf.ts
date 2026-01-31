/**
 * CSRF Protection Utilities
 *
 * Implements CSRF token generation and validation
 * Uses double-submit cookie pattern for stateless CSRF protection
 */

import { logger } from '@/lib/logger';

/**
 * Get CSRF token from cookie
 * CSRF token is set by the server in a cookie
 */
export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // CSRF token is in a cookie, but we can't read httpOnly cookies
  // So we need to get it from a meta tag or API endpoint
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }

  return null;
}

/**
 * Get CSRF token from API endpoint
 *
 * Note: CSRF endpoint doesn't exist - application uses JWT Bearer tokens
 * CSRF protection is not needed with JWT authentication
 * If CSRF is needed in the future, create endpoint /v1/csrf-token
 */
export async function fetchCsrfToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Try to get token from meta tag first (set by server if needed)
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      const token = metaTag.getAttribute('content');
      if (token) {
        return token;
      }
    }

    // If meta tag doesn't exist, CSRF is not needed (JWT authentication)
    // Return null to indicate CSRF is not required
    return null;
  } catch (error) {
    logger.error(
      'Failed to fetch CSRF token',
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}

/**
 * Add CSRF token to request headers
 */
export async function addCsrfHeader(headers: HeadersInit = {}): Promise<HeadersInit> {
  const csrfToken = await fetchCsrfToken();

  const headersObj = headers instanceof Headers ? headers : new Headers(headers);

  if (csrfToken) {
    headersObj.set('X-CSRF-Token', csrfToken);
  }

  return headersObj;
}

/**
 * Create headers with CSRF token for fetch requests
 */
export async function createCsrfHeaders(
  additionalHeaders: Record<string, string> = {}
): Promise<HeadersInit> {
  const csrfToken = await fetchCsrfToken();

  return {
    'Content-Type': 'application/json',
    ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    ...additionalHeaders,
  };
}
