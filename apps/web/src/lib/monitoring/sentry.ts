/**
 * Sentry Monitoring Utilities
 * Helper functions for error tracking and performance monitoring
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Set user context for Sentry
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Set additional context/tags
 */
export function setContext(key: string, context: Record<string, unknown>) {
  Sentry.setContext(key, context);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: 'debug' | 'info' | 'warning' | 'error',
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category: category || 'default',
    level: level || 'info',
    data,
  });
}

/**
 * Capture exception with context
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: 'error' | 'warning' | 'info' | 'debug';
  }
) {
  return Sentry.captureException(error, {
    tags: context?.tags,
    extra: context?.extra,
    level: context?.level || 'error',
  });
}

/**
 * Capture message (non-error events)
 */
export function captureMessage(
  message: string,
  level: 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
) {
  return Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Start a transaction for performance monitoring
 * Note: startSpan executes the callback and doesn't return a transaction object
 */
export function startTransaction(
  name: string,
  op: string,
  callback: () => void,
  _description?: string
): void {
  if (typeof window === 'undefined') {
    callback();
    return;
  }

  Sentry.startSpan(
    {
      name,
      op,
      // description is not supported in StartSpanOptions
      // If description is needed, it should be set on the span after creation
    },
    callback
  );
}

/**
 * Track performance metric
 */
export function trackPerformanceMetric(
  name: string,
  value: number,
  unit: 'millisecond' | 'second' | 'byte' | 'element' = 'millisecond',
  _tags?: Record<string, string>
) {
  // Tags are not supported in MetricOptions
  // If tags are needed, they should be set on the scope before calling this function
  Sentry.metrics.distribution(name, value, {
    unit,
  });
}

/**
 * Track custom event
 */
export function trackEvent(
  name: string,
  data?: Record<string, unknown>,
  tags?: Record<string, string>
) {
  Sentry.captureMessage(name, {
    level: 'info',
    tags: {
      event: name,
      ...tags,
    },
    extra: data,
  });
}
