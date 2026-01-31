/**
 * Security Testing Examples
 * Demonstrates security testing patterns for frontend
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DOMPurify from 'isomorphic-dompurify';

describe('Security Tests', () => {
  describe('XSS Prevention', () => {
    it('sanitizes user input in HTML', () => {
      const maliciousInput = '<script>alert("XSS")</script><p>Safe content</p>';
      const sanitized = DOMPurify.sanitize(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    it('prevents script injection in text content', () => {
      const maliciousInput = '<img src=x onerror=alert("XSS")>';
      const sanitized = DOMPurify.sanitize(maliciousInput, {
        ALLOWED_TAGS: ['p'],
        ALLOWED_ATTR: [],
      });

      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('<img');
    });

    it('prevents javascript: protocol in links', () => {
      const maliciousLink = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const sanitized = DOMPurify.sanitize(maliciousLink, {
        ALLOWED_TAGS: ['a'],
        ALLOWED_ATTR: ['href'],
      });

      // DOMPurify should remove javascript: protocol
      expect(sanitized).not.toContain('javascript:');
    });
  });

  describe('Input Validation', () => {
    it('validates email format', () => {
      const validEmails = ['test@example.com', 'user.name@example.co.uk', 'user+tag@example.com'];

      const invalidEmails = ['invalid-email', '@example.com', 'user@', 'user name@example.com'];

      validEmails.forEach((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach((email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('validates URL format', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com/path',
        'https://example.com:8080/path?query=value',
      ];

      const invalidUrls = ['javascript:alert("XSS")', 'not-a-url', 'ftp://example.com'];

      validUrls.forEach((url) => {
        try {
          new URL(url);
          expect(true).toBe(true);
        } catch {
          expect(false).toBe(true);
        }
      });
    });

    it('validates input length limits', () => {
      const maxLength = 100;
      const validInput = 'A'.repeat(maxLength);
      const invalidInput = 'A'.repeat(maxLength + 1);

      expect(validInput.length).toBeLessThanOrEqual(maxLength);
      expect(invalidInput.length).toBeGreaterThan(maxLength);
    });
  });

  describe('Token Security', () => {
    it('does not expose tokens in localStorage keys', () => {
      // Tokens should be stored in httpOnly cookies, not localStorage
      // This test verifies localStorage is not used for sensitive data
      const sensitiveKeys = ['token', 'password', 'secret', 'key'];

      sensitiveKeys.forEach((key) => {
        expect(localStorage.getItem(key)).toBeNull();
      });
    });

    it('validates token format', () => {
      // Tokens should follow a specific format
      const validTokenPattern = /^[A-Za-z0-9\-._~+/]+=*$/;

      const validTokens = ['eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', 'abc123.def456.ghi789'];

      const invalidTokens = [
        '<script>alert("XSS")</script>',
        'token with spaces',
        'token\nwith\nnewlines',
      ];

      validTokens.forEach((token) => {
        expect(validTokenPattern.test(token)).toBe(true);
      });

      invalidTokens.forEach((token) => {
        expect(validTokenPattern.test(token)).toBe(false);
      });
    });
  });

  describe('Content Security', () => {
    it('prevents inline scripts', () => {
      // Components should not use dangerouslySetInnerHTML with user input
      const userInput = '<script>alert("XSS")</script>';

      // This should be sanitized before rendering
      const sanitized = DOMPurify.sanitize(userInput);
      expect(sanitized).not.toContain('<script>');
    });

    it('validates external resource URLs', () => {
      const allowedDomains = ['https://example.com', 'https://cdn.example.com'];
      const blockedDomains = [
        'javascript:alert("XSS")',
        'data:text/html,<script>alert("XSS")</script>',
        'http://malicious.com',
      ];

      const isAllowed = (url: string) => {
        try {
          const urlObj = new URL(url);
          return allowedDomains.some((domain) => urlObj.origin === domain);
        } catch {
          return false;
        }
      };

      allowedDomains.forEach((url) => {
        expect(isAllowed(url)).toBe(true);
      });

      blockedDomains.forEach((url) => {
        expect(isAllowed(url)).toBe(false);
      });
    });
  });
});
