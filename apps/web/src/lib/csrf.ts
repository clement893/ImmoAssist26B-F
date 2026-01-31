/**
 * CSRF Protection
 * Protection contre les attaques Cross-Site Request Forgery
 */

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_HEADER = 'X-CSRF-Token';

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  // Generate a secure random token
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for server-side
    const crypto = require('crypto');
    crypto.randomFillSync(array);
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get CSRF token from cookies (server-side)
 * Note: This function must be called from a Server Component or Route Handler
 */
export async function getCSRFToken(): Promise<string> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    let token = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;

    if (!token) {
      token = generateCSRFToken();
      // Note: In Next.js App Router, you need to set cookies in Server Actions or Route Handlers
    }

    return token;
  } catch (error) {
    // Fallback if cookies() is not available (e.g., in middleware)
    return generateCSRFToken();
  }
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(token, expectedToken);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Set CSRF token in response headers (for API routes)
 */
export function setCSRFTokenHeader(token: string): Record<string, string> {
  return {
    [CSRF_HEADER]: token,
  };
}

/**
 * Get CSRF token from request headers
 */
export function getCSRFTokenFromHeader(headers: Headers): string | null {
  return headers.get(CSRF_HEADER);
}

/**
 * CSRF middleware for API routes
 * Note: This function must be called from a Route Handler
 */
export async function validateCSRF(request: Request): Promise<boolean> {
  const token = getCSRFTokenFromHeader(request.headers);

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const expectedToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;

    if (!token || !expectedToken) {
      return false;
    }

    return verifyCSRFToken(token, expectedToken);
  } catch (error) {
    // Fallback: try to get from request cookies directly
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = Object.fromEntries(cookieHeader.split('; ').map((c) => c.split('=')));
      const expectedToken = cookies[CSRF_TOKEN_COOKIE];
      if (token && expectedToken) {
        return verifyCSRFToken(token, expectedToken);
      }
    }
    return false;
  }
}
