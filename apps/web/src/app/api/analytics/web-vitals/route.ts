/**
 * Web Vitals Analytics Endpoint
 * Receives and stores Web Vitals metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger, type LogContext } from '@/lib/logger';

// Ensure this route is dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, rating, delta, id, navigationType } = body;

    // Validate Web Vitals data
    if (!name || typeof value !== 'number') {
      return NextResponse.json({ error: 'Invalid Web Vitals data' }, { status: 400 });
    }

    // Log Web Vitals (in production, send to analytics service)
    if (process.env.NODE_ENV === 'production') {
      // Analytics integration - Send to analytics service (e.g., Google Analytics, Sentry, custom) when configured
      const webVitalsContext: LogContext = {
        name,
        value,
        rating,
        delta,
        id,
        navigationType,
        timestamp: new Date().toISOString(),
      };
      // Use logger.info instead of logger.performance to avoid TypeScript conflicts with global performance API
      logger.info('Web Vitals', webVitalsContext);
    }

    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Web Vitals API Error', errorObj, {});
    return NextResponse.json({ error: 'Failed to process Web Vitals' }, { status: 500 });
  }
}
