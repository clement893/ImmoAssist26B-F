/**
 * Tests for rate limiter utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  rateLimiter,
  getRateLimitKey,
  getRateLimitConfig,
  RATE_LIMIT_CONFIG,
} from '../rateLimiter';

describe('rateLimiter', () => {
  beforeEach(() => {
    rateLimiter.clear();
  });

  describe('isAllowed', () => {
    it('should allow request when under limit', () => {
      const result = rateLimiter.isAllowed('test-key', 10, 60000);
      expect(result).toBe(true);
    });

    it('should deny request when limit exceeded', () => {
      const key = 'limit-test';
      const maxRequests = 2;

      // Make requests up to limit
      expect(rateLimiter.isAllowed(key, maxRequests, 60000)).toBe(true);
      expect(rateLimiter.isAllowed(key, maxRequests, 60000)).toBe(true);

      // Next request should be denied
      expect(rateLimiter.isAllowed(key, maxRequests, 60000)).toBe(false);
    });

    it('should reset after window expires', async () => {
      const key = 'window-test';
      const windowMs = 100; // 100ms window

      // Exhaust limit
      rateLimiter.isAllowed(key, 1, windowMs);
      expect(rateLimiter.isAllowed(key, 1, windowMs)).toBe(false);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be allowed again
      expect(rateLimiter.isAllowed(key, 1, windowMs)).toBe(true);
    });

    it('should use default limits', () => {
      const result = rateLimiter.isAllowed('default-test');
      expect(result).toBe(true);
    });
  });

  describe('getRemaining', () => {
    it('should return correct remaining count', () => {
      const key = 'remaining-test';
      const maxRequests = 10;

      rateLimiter.isAllowed(key, maxRequests, 60000);
      rateLimiter.isAllowed(key, maxRequests, 60000);

      const remaining = rateLimiter.getRemaining(key, maxRequests);
      expect(remaining).toBe(8);
    });

    it('should return maxRequests for new key', () => {
      const remaining = rateLimiter.getRemaining('new-key', 10);
      expect(remaining).toBe(10);
    });

    it('should return 0 when limit exceeded', () => {
      const key = 'exceeded-test';
      const maxRequests = 2;

      rateLimiter.isAllowed(key, maxRequests, 60000);
      rateLimiter.isAllowed(key, maxRequests, 60000);
      rateLimiter.isAllowed(key, maxRequests, 60000); // Exceeds limit

      const remaining = rateLimiter.getRemaining(key, maxRequests);
      expect(remaining).toBe(0);
    });
  });

  describe('getResetTime', () => {
    it('should return time until reset', () => {
      const key = 'reset-test';
      const windowMs = 60000;

      rateLimiter.isAllowed(key, 10, windowMs);

      const resetTime = rateLimiter.getResetTime(key);
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(windowMs);
    });

    it('should return 0 for non-existent key', () => {
      const resetTime = rateLimiter.getResetTime('non-existent');
      expect(resetTime).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset rate limit for key', () => {
      const key = 'reset-test';
      const maxRequests = 2;

      // Exhaust limit
      rateLimiter.isAllowed(key, maxRequests, 60000);
      rateLimiter.isAllowed(key, maxRequests, 60000);
      expect(rateLimiter.isAllowed(key, maxRequests, 60000)).toBe(false);

      // Reset
      rateLimiter.reset(key);

      // Should be allowed again
      expect(rateLimiter.isAllowed(key, maxRequests, 60000)).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all rate limits', () => {
      rateLimiter.isAllowed('key1', 1, 60000);
      rateLimiter.isAllowed('key2', 1, 60000);

      rateLimiter.clear();

      expect(rateLimiter.getRemaining('key1', 1)).toBe(1);
      expect(rateLimiter.getRemaining('key2', 1)).toBe(1);
    });
  });

  describe('getRateLimitKey', () => {
    it('should categorize auth endpoints', () => {
      const key = getRateLimitKey('/api/auth/login');
      expect(key).toContain('auth:');
    });

    it('should categorize upload endpoints', () => {
      const key = getRateLimitKey('/api/upload');
      expect(key).toContain('upload:');
    });

    it('should categorize search endpoints', () => {
      const key = getRateLimitKey('/api/users/search');
      expect(key).toContain('search:');
    });

    it('should default to api category', () => {
      const key = getRateLimitKey('/api/users');
      expect(key).toContain('api:');
    });
  });

  describe('getRateLimitConfig', () => {
    it('should return auth config for auth endpoints', () => {
      const config = getRateLimitConfig('/api/auth/login');
      expect(config).toEqual(RATE_LIMIT_CONFIG.auth);
    });

    it('should return upload config for upload endpoints', () => {
      const config = getRateLimitConfig('/api/upload');
      expect(config).toEqual(RATE_LIMIT_CONFIG.upload);
    });

    it('should return search config for search endpoints', () => {
      const config = getRateLimitConfig('/api/search');
      expect(config).toEqual(RATE_LIMIT_CONFIG.search);
    });

    it('should return api config for general endpoints', () => {
      const config = getRateLimitConfig('/api/users');
      expect(config).toEqual(RATE_LIMIT_CONFIG.api);
    });
  });
});
