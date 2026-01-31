/**
 * CSRF Middleware for API Routes
 * Middleware pour protéger les routes API contre CSRF
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateCSRF } from '../csrf';

/**
 * CSRF protection middleware
 * Use this in API routes that modify data (POST, PUT, DELETE, PATCH)
 */
export async function withCSRFProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Skip CSRF for GET, HEAD, OPTIONS
  const method = request.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return handler(request);
  }

  // Validate CSRF token
  try {
    const isValid = await validateCSRF(request);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token. Please refresh the page and try again.' },
        { status: 403 }
      );
    }
  } catch (error) {
    // If validation fails, return error
    return NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 });
  }

  return handler(request);
}
