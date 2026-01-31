/**
 * Comprehensive Tests for Rate Limiter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../rateLimiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter(60000, 10); // 1 minute, 10 requests
  });

  describe('isAllowed', () => {
    it('should allow requests within limit', () => {
      const result = rateLimiter.isAllowed('user1', 10, 60000);
      expect(result).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        rateLimiter.isAllowed('user1', 10, 60000);
      }

      // 11th request should be blocked
      const result = rateLimiter.isAllowed('user1', 10, 60000);
      expect(result).toBe(false);
    });

    it('should reset limit after window expires', async () => {
      // Make 10 requests
      const shortLimiter = new RateLimiter(100, 10); // 100ms window for testing

      for (let i = 0; i < 10; i++) {
        shortLimiter.isAllowed('user1', 10, 100);
      }

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      const result = shortLimiter.isAllowed('user1', 10, 100);
      expect(result).toBe(true);
    });

    it('should track different keys separately', () => {
      // Key 1 makes 10 requests
      for (let i = 0; i < 10; i++) {
        rateLimiter.isAllowed('key1', 10, 60000);
      }

      // Key 2 should still have full limit
      const result = rateLimiter.isAllowed('key2', 10, 60000);
      expect(result).toBe(true);
    });
  });

  describe('getRemaining', () => {
    it('should return correct remaining requests', () => {
      rateLimiter.isAllowed('user1', 10, 60000);
      rateLimiter.isAllowed('user1', 10, 60000);

      const remaining = rateLimiter.getRemaining('user1', 10);
      expect(remaining).toBeLessThan(10);
      expect(remaining).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when limit exceeded', () => {
      for (let i = 0; i < 10; i++) {
        rateLimiter.isAllowed('user1', 10, 60000);
      }

      const remaining = rateLimiter.getRemaining('user1', 10);
      expect(remaining).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset limit for a key', () => {
      // Make some requests
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed('user1', 10, 60000);
      }

      // Reset limit
      rateLimiter.reset('user1');

      // Should have full limit again
      const remaining = rateLimiter.getRemaining('user1', 10);
      expect(remaining).toBe(10);
    });
  });
});
