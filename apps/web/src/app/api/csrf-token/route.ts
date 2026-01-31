/**
 * CSRF Token API Route
 * Provides CSRF token for double-submit cookie pattern
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';

const CSRF_TOKEN_COOKIE = 'csrf_token';

/**
 * GET /api/csrf-token
 * Get or generate CSRF token
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    let csrfToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;

    // Generate new token if not exists
    if (!csrfToken) {
      csrfToken = randomBytes(32).toString('base64url');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({ csrfToken });

    // Set CSRF token cookie (not httpOnly - must be readable by JavaScript)
    response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
      httpOnly: false, // Must be readable for double-submit pattern
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (error) {
    logger.error('CSRF Token API Error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 });
  }
}
