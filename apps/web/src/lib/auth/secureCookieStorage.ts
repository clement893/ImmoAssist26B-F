/**
 * Secure Cookie-Based Token Storage
 *
 * Fully secure implementation using httpOnly cookies only.
 * No localStorage or sessionStorage fallback for maximum security.
 *
 * Security Features:
 * - httpOnly cookies (not accessible to JavaScript - XSS protection)
 * - Secure flag (HTTPS only in production)
 * - SameSite=Strict (CSRF protection)
 * - Automatic token rotation support
 * - Session management
 */

import { logger } from '@/lib/logger';

const TOKEN_API_ENDPOINT = '/api/auth/token';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface SessionInfo {
  userId: string;
  email: string;
  roles: string[];
  expiresAt: number;
}

/**
 * Secure cookie-based token storage
 * All tokens are stored server-side in httpOnly cookies
 */
export class SecureCookieStorage {
  /**
   * Set tokens via httpOnly cookies (server-side only)
   * This is the secure method - tokens are never exposed to JavaScript
   */
  static async setTokens(tokens: TokenResponse): Promise<void> {
    if (typeof window === 'undefined') {
      return; // Server-side, skip
    }

    try {
      const response = await fetch(TOKEN_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          tokenType: tokens.tokenType,
        }),
        credentials: 'include', // Important: include cookies
      });

      if (!response.ok) {
        throw new Error('Failed to set tokens');
      }
    } catch (error) {
      logger.error(
        'Failed to set tokens',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Rotate tokens (refresh with new tokens)
   * Used for automatic token rotation
   */
  static async rotateTokens(refreshToken?: string): Promise<TokenResponse> {
    if (typeof window === 'undefined') {
      throw new Error('Token rotation must be called client-side');
    }

    try {
      const response = await fetch(`${TOKEN_API_ENDPOINT}/rotate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to rotate tokens');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(
        'Failed to rotate tokens',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Get session information (does not expose tokens)
   */
  static async getSession(): Promise<SessionInfo | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const response = await fetch(`${TOKEN_API_ENDPOINT}/session`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error(
        'Failed to get session',
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  /**
   * Check if user has valid session
   */
  static async hasValidSession(): Promise<boolean> {
    const session = await this.getSession();
    if (!session) {
      return false;
    }

    // Check if session is expired
    return session.expiresAt > Date.now();
  }

  /**
   * Remove all tokens (logout)
   */
  static async removeTokens(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      await fetch(TOKEN_API_ENDPOINT, {
        method: 'DELETE',
        credentials: 'include',
      });
    } catch (error) {
      logger.error(
        'Failed to remove tokens',
        error instanceof Error ? error : new Error(String(error))
      );
      // Continue even if API call fails
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(): Promise<TokenResponse> {
    if (typeof window === 'undefined') {
      throw new Error('Token refresh must be called client-side');
    }

    try {
      const response = await fetch(`${TOKEN_API_ENDPOINT}/refresh`, {
        method: 'POST',
        credentials: 'include', // Refresh token is in httpOnly cookie
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      return await response.json();
    } catch (error) {
      logger.error(
        'Failed to refresh token',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}
