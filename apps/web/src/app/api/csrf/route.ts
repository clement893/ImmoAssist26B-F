/**
 * CSRF Token API Route
 * Endpoint pour obtenir un token CSRF
 */

import { NextResponse } from 'next/server';
import { generateCSRFToken } from '@/lib/csrf';
import { cookies } from 'next/headers';

export async function GET() {
  const token = generateCSRFToken();
  const cookieStore = await cookies();

  // Set CSRF token in HTTP-only cookie
  cookieStore.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return NextResponse.json({ csrfToken: token });
}
