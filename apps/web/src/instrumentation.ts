/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts
 *
 * Use this to initialize monitoring, validate environment variables, etc.
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side only
    const { validateAndLogEnvironmentVariables } = await import('@/lib/utils/envValidation');

    // Initialize Sentry server-side
    // Note: Sentry is automatically initialized via sentry.server.config.ts
    // This is just a placeholder for any additional server-side initialization
    if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry will be initialized automatically by @sentry/nextjs
      // No manual initialization needed here
    }

    // Validate environment variables on server startup
    validateAndLogEnvironmentVariables();
  }
}

/**
 * Capture errors from nested React Server Components
 * This hook is called when an error occurs in a React Server Component
 *
 * @param err - The error that occurred
 * @param request - The request object containing path and headers
 * @param context - Context about the router and route
 */
export function onRequestError(
  err: Error,
  request: {
    path: string;
    headers: Headers;
  },
  context: {
    routerKind: string;
    routePath: string;
  }
) {
  // Only capture if Sentry is configured
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: {
        component: 'rsc',
        routerKind: context.routerKind,
        routePath: context.routePath,
        errorSource: 'onRequestError',
      },
      extra: {
        path: request.path,
        headers: Object.fromEntries(request.headers.entries()),
      },
    });
  }
}
