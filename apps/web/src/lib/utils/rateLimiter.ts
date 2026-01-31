/**
 * Client-Side Rate Limiter
 *
 * Prevents excessive API calls from the client to protect against abuse
 * and reduce server load. Uses a sliding window algorithm to track requests.
 *
 * @module rateLimiter
 * @example
 * ```typescript
 * // Check if request is allowed
 * if (rateLimiter.isAllowed('api:/users', 60, 60000)) {
 *   await fetch('/api/users');
 * } else {
 *   logger.log('Rate limit exceeded');
 * }
 *
 * // Use endpoint-specific config
 * const config = getRateLimitConfig('/api/auth/login');
 * if (rateLimiter.isAllowed('/api/auth/login', config.maxRequests, config.windowMs)) {
 *   // Make request
 * }
 * ```
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly defaultWindowMs: number;
  private readonly defaultMaxRequests: number;

  constructor(
    defaultWindowMs: number = 60000, // 1 minute
    defaultMaxRequests: number = 60 // 60 requests per minute
  ) {
    this.defaultWindowMs = defaultWindowMs;
    this.defaultMaxRequests = defaultMaxRequests;
  }

  /**
   * Check if request is allowed within rate limit
   * 
   * Uses a sliding window algorithm:
   - If no entry exists or window expired, creates new entry and allows request
   - If limit exceeded, denies request
   - Otherwise, increments count and allows request
   * 
   * @param key - Unique identifier for the rate limit (e.g., endpoint URL, user ID)
   * @param maxRequests - Maximum requests allowed in the window (defaults to defaultMaxRequests)
   * @param windowMs - Time window in milliseconds (defaults to defaultWindowMs)
   * @returns True if request is allowed, false if rate limit exceeded
   * 
   * @example
   * ```typescript
   * // Check with defaults (60 requests per minute)
   * if (rateLimiter.isAllowed('api:/users')) {
   *   await fetch('/api/users');
   * }
   * 
   * // Custom limits (10 requests per 30 seconds)
   * if (rateLimiter.isAllowed('api:/auth/login', 10, 30000)) {
   *   await login();
   * }
   * ```
   */
  isAllowed(
    key: string,
    maxRequests: number = this.defaultMaxRequests,
    windowMs: number = this.defaultWindowMs
  ): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No entry or window expired, allow request
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      return false;
    }

    // Increment count
    entry.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   *
   * Calculates how many requests are still allowed within the current window.
   *
   * @param key - Unique identifier for the rate limit
   * @param maxRequests - Maximum requests allowed (defaults to defaultMaxRequests)
   * @returns Number of remaining requests (0 if limit exceeded, maxRequests if no entry)
   *
   * @example
   * ```typescript
   * const remaining = rateLimiter.getRemaining('api:/users', 60);
   * logger.log(`${remaining} requests remaining`);
   * ```
   */
  getRemaining(key: string, maxRequests: number = this.defaultMaxRequests): number {
    const entry = this.limits.get(key);
    if (!entry) {
      return maxRequests;
    }

    const now = Date.now();
    if (now > entry.resetTime) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - entry.count);
  }

  /**
   * Get time until reset for a key
   *
   * Calculates how long until the rate limit window resets.
   *
   * @param key - Unique identifier for the rate limit
   * @returns Milliseconds until reset (0 if no entry exists or already reset)
   *
   * @example
   * ```typescript
   * const resetIn = rateLimiter.getResetTime('api:/users');
   * logger.log(`Rate limit resets in ${resetIn}ms`);
   * ```
   */
  getResetTime(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) {
      return 0;
    }

    const now = Date.now();
    return Math.max(0, entry.resetTime - now);
  }

  /**
   * Reset rate limit for a specific key
   *
   * Removes the rate limit entry for the given key, effectively
   * resetting the limit immediately.
   *
   * @param key - Unique identifier for the rate limit to reset
   *
   * @example
   * ```typescript
   * // Reset limit after successful authentication
   * rateLimiter.reset('api:/auth/login');
   * ```
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   *
   * Removes all rate limit entries. Useful for testing or
   * when resetting all limits is needed.
   *
   * @example
   * ```typescript
   * // Clear all limits (e.g., on logout)
   * rateLimiter.clear();
   * ```
   */
  clear(): void {
    this.limits.clear();
  }

  /**
   * Clean up expired entries
   *
   * Removes all rate limit entries that have exceeded their reset time.
   * This prevents memory leaks from accumulating expired entries.
   *
   * Called automatically every 5 minutes, but can be called manually
   * if needed for more frequent cleanup.
   *
   * @example
   * ```typescript
   * // Manual cleanup
   * rateLimiter.cleanup();
   * ```
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(
    () => {
      rateLimiter.cleanup();
    },
    5 * 60 * 1000
  );
}

/**
 * Rate limit configuration for different endpoints
 */
export const RATE_LIMIT_CONFIG = {
  // Authentication endpoints - stricter limits
  auth: {
    maxRequests: 10, // 10 requests per minute
    windowMs: 60000, // 1 minute
  },
  // File upload endpoints - very strict limits
  upload: {
    maxRequests: 5, // 5 requests per minute
    windowMs: 60000, // 1 minute
  },
  // General API endpoints - standard limits
  api: {
    maxRequests: 60, // 60 requests per minute
    windowMs: 60000, // 1 minute
  },
  // Search endpoints - moderate limits
  search: {
    maxRequests: 30, // 30 requests per minute
    windowMs: 60000, // 1 minute
  },
} as const;

/**
 * Get rate limit key from endpoint URL
 *
 * Extracts a rate limit key from an API endpoint URL by categorizing
 * the endpoint (auth, upload, search, or general API).
 *
 * @param url - API endpoint URL (can be relative or absolute)
 * @returns Rate limit key with category prefix (e.g., 'auth:/api/auth/login')
 *
 * @example
 * ```typescript
 * const key = getRateLimitKey('/api/auth/login');
 * // Returns: 'auth:/api/auth/login'
 *
 * const key2 = getRateLimitKey('/api/users/search');
 * // Returns: 'search:/api/users/search'
 * ```
 */
export function getRateLimitKey(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    const pathname = urlObj.pathname;

    // Extract endpoint category from path
    if (pathname.includes('/auth/')) {
      return `auth:${pathname}`;
    }
    if (pathname.includes('/upload')) {
      return `upload:${pathname}`;
    }
    if (pathname.includes('/search')) {
      return `search:${pathname}`;
    }

    return `api:${pathname}`;
  } catch {
    return `api:${url}`;
  }
}

/**
 * Get rate limit configuration for an endpoint
 *
 * Determines the appropriate rate limit configuration based on the
 * endpoint URL category (auth, upload, search, or general API).
 *
 * @param url - API endpoint URL
 * @returns Rate limit configuration with maxRequests and windowMs
 *
 * @example
 * ```typescript
 * const config = getRateLimitConfig('/api/auth/login');
 * // Returns: { maxRequests: 10, windowMs: 60000 }
 *
 * const config2 = getRateLimitConfig('/api/users');
 * // Returns: { maxRequests: 60, windowMs: 60000 }
 * ```
 */
export function getRateLimitConfig(url: string): {
  maxRequests: number;
  windowMs: number;
} {
  const key = getRateLimitKey(url);

  if (key.startsWith('auth:')) {
    return RATE_LIMIT_CONFIG.auth;
  }
  if (key.startsWith('upload:')) {
    return RATE_LIMIT_CONFIG.upload;
  }
  if (key.startsWith('search:')) {
    return RATE_LIMIT_CONFIG.search;
  }

  return RATE_LIMIT_CONFIG.api;
}
