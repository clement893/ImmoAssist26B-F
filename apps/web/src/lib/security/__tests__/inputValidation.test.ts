/**
 * Tests for input validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateLength,
  sanitizeHtml,
  sanitizeText,
  validateEmail,
  validateUrl,
  validatePassword,
  sanitizeAndValidate,
  MAX_LENGTHS,
  MIN_LENGTHS,
} from '../inputValidation';

describe('inputValidation', () => {
  describe('validateLength', () => {
    it('should validate length within range', () => {
      const result = validateLength('test', 1, 10);
      expect(result.valid).toBe(true);
    });

    it('should reject string shorter than minimum', () => {
      const result = validateLength('ab', 3, 10, 'Username');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3');
    });

    it('should reject string longer than maximum', () => {
      const result = validateLength('a'.repeat(101), 1, 100, 'Field');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no more than 100');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const result = sanitizeHtml('<script>alert("xss")</script><p>Safe</p>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Safe</p>');
    });

    it('should preserve allowed tags', () => {
      const html = '<p>Text</p><strong>Bold</strong><em>Italic</em>';
      const result = sanitizeHtml(html);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });

    it('should remove dangerous attributes', () => {
      const html = '<a href="javascript:alert(1)">Link</a>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const result = sanitizeText('<p>Hello <strong>World</strong></p>');
      expect(result).toBe('Hello World');
    });

    it('should handle plain text', () => {
      const result = sanitizeText('Plain text');
      expect(result).toBe('Plain text');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      const result = validateEmail('user@example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('email');
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
    });

    it('should validate email length', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URL format', () => {
      const result = validateUrl('https://example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid URL format', () => {
      const result = validateUrl('not-a-url');
      expect(result.valid).toBe(false);
    });

    it('should reject empty URL', () => {
      const result = validateUrl('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = validatePassword('StrongP@ssw0rd123');
      expect(result.valid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    it('should reject weak password', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.strength).toBe('weak');
    });

    it('should reject password shorter than minimum', () => {
      const result = validatePassword('Short1!');
      expect(result.valid).toBe(false);
    });

    it('should calculate password strength correctly', () => {
      const weak = validatePassword('password123');
      expect(weak.strength).toBe('weak');

      const medium = validatePassword('Password123');
      expect(medium.strength).toBe('medium');

      const strong = validatePassword('StrongP@ssw0rd123');
      expect(strong.strength).toBe('strong');
    });
  });

  describe('sanitizeAndValidate', () => {
    it('should sanitize and validate email', () => {
      const result = sanitizeAndValidate('  USER@EXAMPLE.COM  ', 'email', 'Email');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('user@example.com');
    });

    it('should sanitize and validate HTML', () => {
      const html = '<script>alert("xss")</script><p>Safe</p>';
      const result = sanitizeAndValidate(html, 'html');
      expect(result.valid).toBe(true);
      expect(result.sanitized).not.toContain('<script>');
      expect(result.sanitized).toContain('<p>Safe</p>');
    });

    it('should validate password without sanitizing', () => {
      const password = 'TestP@ssw0rd123';
      const result = sanitizeAndValidate(password, 'password');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe(password); // Unchanged
    });

    it('should sanitize and validate text', () => {
      const text = '<p>HTML</p>Plain text';
      const result = sanitizeAndValidate(text, 'text');
      expect(result.valid).toBe(true);
      expect(result.sanitized).not.toContain('<p>');
      expect(result.sanitized).toContain('Plain text');
    });
  });
});
