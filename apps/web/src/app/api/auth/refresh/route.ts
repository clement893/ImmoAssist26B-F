/**
 * Token Refresh API Route
 * Refreshes access tokens using refresh tokens
 */

import { NextResponse } from 'next/server';
import { createAccessToken, verifyToken } from '@/lib/auth/jwt';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken);

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 });
    }

    // Extract user info from payload
    const userId = payload.sub || (payload as { userId?: string }).userId || '';
    const email = (payload as { email?: string }).email;
    const role = (payload as { role?: string }).role;

    // Create new access token
    const accessToken = await createAccessToken({
      userId,
      email,
      role,
    });

    // Return new tokens
    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken, // Return same refresh token (or generate new one if needed)
      expiresIn: 900, // 15 minutes in seconds
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      },
      { status: 401 }
    );
  }
}
