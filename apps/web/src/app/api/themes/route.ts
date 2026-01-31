/**
 * Next.js API route for theme management (server-side proxy).
 * This allows server-side rendering and better security.
 */
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Get API URL with production fallback
 * Uses NEXT_PUBLIC_API_URL or NEXT_PUBLIC_DEFAULT_API_URL, falls back to localhost in development
 */
const getApiUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Priority order: explicit API URL > default API URL > smart fallback > localhost (dev only)
  let url = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_DEFAULT_API_URL;

  // Smart fallback for production: NEXT_PUBLIC_API_URL must be set
  if (!url && isProduction) {
    // This should never happen - NEXT_PUBLIC_API_URL must be configured
    logger.error(
      'CRITICAL: NEXT_PUBLIC_API_URL is not set at build time. Please set NEXT_PUBLIC_API_URL in Railway environment variables before building. Application may not work correctly.'
    );
    // Do not use hardcoded fallback - fail safely
    url = undefined;
  }

  // Default to localhost for development if nothing is set
  if (!url) {
    url = 'http://localhost:8000';
  }

  url = url.trim();

  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url.replace(/\/$/, ''); // Remove trailing slash
};

const API_URL = getApiUrl();

/**
 * GET /api/themes/active
 * Proxy to backend to get active theme.
 * Public endpoint - no authentication required.
 * Requires backend to be available - returns error if backend is unavailable.
 * The backend will always return TemplateTheme (ID 32) if no theme is active.
 */
export async function GET() {
  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

  try {
    const response = await fetch(`${API_URL}/api/v1/themes/active`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error(`Backend returned ${response.status} when fetching active theme.`);
      return NextResponse.json(
        { error: `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle network errors, timeouts, and connection refused
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        logger.error('Theme fetch timeout. Backend is not responding.');
        return NextResponse.json(
          { error: 'Backend timeout - theme service unavailable' },
          { status: 503 }
        );
      } else {
        logger.error('Backend not available when fetching theme.', { message: error.message });
        return NextResponse.json(
          { error: 'Backend unavailable - theme service not accessible' },
          { status: 503 }
        );
      }
    } else {
      logger.error(
        'Error fetching active theme',
        error instanceof Error ? error : new Error(String(error))
      );
      return NextResponse.json({ error: 'Unknown error fetching theme' }, { status: 500 });
    }
  }
}
