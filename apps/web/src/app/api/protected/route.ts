/**
 * Protected API Route Example
 * Demonstrates how to use authentication middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';

import type { TokenPayload } from '@/lib/auth/jwt';

async function handler(_request: NextRequest, { user }: { user: TokenPayload }) {
  return NextResponse.json({
    success: true,
    message: 'This is a protected route',
    user: {
      id: user.userId || user.sub || '',
      email: user.email || '',
    },
  });
}

export const GET = withAuth(handler);
