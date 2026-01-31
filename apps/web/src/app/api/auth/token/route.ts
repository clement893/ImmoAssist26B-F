/**
 * Token Management API Route
 * Handles httpOnly cookie-based token storage
 *
 * Security: Tokens are stored in httpOnly cookies (not accessible to JavaScript)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const CSRF_TOKEN_COOKIE = 'csrf_token';

// Cookie options for production
const getCookieOptions = (isProduction: boolean) => ({
  httpOnly: true, // Not accessible to JavaScript (XSS protection)
  secure: isProduction, // HTTPS only in production
  sameSite: 'strict' as const, // CSRF protection
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
});

/**
 * POST /api/auth/token
 * Set tokens in httpOnly cookies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken, expiresIn } = body;

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = getCookieOptions(isProduction);

    const response = NextResponse.json({ success: true });

    // Set access token cookie
    response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
      ...cookieOptions,
      maxAge: expiresIn || 60 * 60, // Default 1 hour
    });

    // Set refresh token cookie if provided
    if (refreshToken) {
      response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error) {
    logger.error(
      'Token API Error setting tokens',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ error: 'Failed to set tokens' }, { status: 500 });
  }
}

/**
 * GET /api/auth/token
 * Check if tokens exist (without exposing them)
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const hasAccessToken = cookieStore.has(ACCESS_TOKEN_COOKIE);
    const hasRefreshToken = cookieStore.has(REFRESH_TOKEN_COOKIE);

    return NextResponse.json({
      hasToken: hasAccessToken,
      hasRefreshToken: hasRefreshToken,
    });
  } catch (error) {
    logger.error(
      'Token API Error checking tokens',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ error: 'Failed to check tokens' }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/token
 * Remove all tokens (logout)
 */
export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });

    // Clear all token cookies
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    response.cookies.delete(CSRF_TOKEN_COOKIE);

    return response;
  } catch (error) {
    logger.error(
      'Token API Error removing tokens',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ error: 'Failed to remove tokens' }, { status: 500 });
  }
}
