/**
 * JWT Token Verification Utility
 * Server-side JWT verification using jose library
 *
 * This utility provides secure JWT token verification for middleware
 * and server-side authentication checks.
 */

import { jwtVerify, type JWTPayload } from 'jose';

/**
 * JWT secret key from environment variables
 * In production, this should be stored securely and rotated regularly
 *
 * Security: Fails fast in production if secret is not set
 */
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;

  // In production, fail fast if secret is not set
  if (process.env.NODE_ENV === 'production') {
    if (!secret) {
      throw new Error(
        'JWT_SECRET or NEXTAUTH_SECRET environment variable is required in production. ' +
          'Please set one of these variables before starting the application.'
      );
    }
    // Ensure production secret is not the fallback
    if (secret === 'fallback-secret-change-in-production') {
      throw new Error(
        'JWT_SECRET cannot be the fallback value in production. ' +
          'Please set a secure secret before deploying.'
      );
    }
  }

  // In development/test, use fallback if not set
  const finalSecret = secret || 'fallback-secret-change-in-production';

  return new TextEncoder().encode(finalSecret);
}

/**
 * Verify a JWT token and return the payload
 *
 * @param token - The JWT token to verify
 * @returns The decoded JWT payload if valid, null otherwise
 *
 * @example
 * ```typescript
 * const payload = await verifyToken(token);
 * if (payload) {
 *   const { logger } = await import('@/lib/logger');
 *   logger.debug('User authenticated', { userId: payload.sub });
 * }
 * ```
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // Token is invalid, expired, or malformed
    return null;
  }
}

/**
 * Extract token from Authorization header
 *
 * @param authHeader - The Authorization header value (e.g., "Bearer <token>")
 * @returns The token string or null if not found/invalid format
 */
export function extractTokenFromHeader(authHeader: string | null | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Check if a JWT token is expired
 *
 * @param payload - The JWT payload
 * @returns True if token is expired, false otherwise
 */
export function isTokenExpired(payload: JWTPayload): boolean {
  if (!payload.exp) {
    return true; // No expiration claim means invalid token
  }
  return Date.now() >= payload.exp * 1000;
}

/**
 * Get user ID from JWT payload
 *
 * @param payload - The JWT payload
 * @returns User ID string or null if not found
 */
export function getUserIdFromPayload(payload: JWTPayload): string | null {
  return (payload.sub || payload.userId || payload.id) as string | null;
}

/**
 * Token payload type for TypeScript
 */
export interface TokenPayload extends JWTPayload {
  userId?: string;
  email?: string;
  role?: string;
}

/**
 * Create a new access token
 *
 * @param payload - The payload to encode in the token
 * @returns A signed JWT token string
 */
export async function createAccessToken(payload: {
  userId: string;
  email?: string;
  role?: string;
}): Promise<string> {
  const { SignJWT } = await import('jose');
  const secret = getJwtSecret();

  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // 15 minutes
    .setSubject(payload.userId)
    .sign(secret);

  return token;
}
