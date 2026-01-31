/**
 * Utility Functions Test Example
 * Demonstrates unit testing patterns for utilities
 */

import { describe, it, expect } from 'vitest';
import { clsx } from 'clsx';

describe('Utility Functions', () => {
  describe('clsx', () => {
    it('combines class names correctly', () => {
      const result = clsx('foo', 'bar', { baz: true });
      expect(result).toBe('foo bar baz');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const result = clsx('base', { active: isActive, disabled: !isActive });
      expect(result).toBe('base active');
    });

    it('filters out falsy values', () => {
      const result = clsx('foo', false && 'bar', null, undefined, 'baz');
      expect(result).toBe('foo baz');
    });
  });
});
