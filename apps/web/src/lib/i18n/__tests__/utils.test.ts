/**
 * i18n Utils Tests
 *
 * Comprehensive test suite for i18n utility functions covering:
 * - formatDate function
 * - formatCurrency function
 * - formatNumber function
 * - formatRelativeTime function
 */

import { describe, it, expect } from 'vitest';
import { formatDate, formatCurrency, formatNumber, formatRelativeTime } from '../utils';

describe('i18n Utils', () => {
  describe('formatDate', () => {
    it('formats Date object', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'en');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('January');
    });

    it('formats date string', () => {
      const formatted = formatDate('2024-01-15', 'en');
      expect(formatted).toContain('2024');
    });

    it('uses default locale when not provided', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toBeTruthy();
    });
  });

  describe('formatCurrency', () => {
    it('formats currency with default locale', () => {
      const formatted = formatCurrency(1234.56);
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
    });

    it('formats currency with custom currency', () => {
      const formatted = formatCurrency(1234.56, 'EUR', 'en');
      expect(formatted).toContain('€') || expect(formatted).toContain('EUR');
    });

    it('formats currency with custom locale', () => {
      const formatted = formatCurrency(1234.56, 'USD', 'en');
      expect(formatted).toContain('$') || expect(formatted).toContain('USD');
    });
  });

  describe('formatNumber', () => {
    it('formats number with default locale', () => {
      const formatted = formatNumber(1234567.89);
      expect(formatted).toBeTruthy();
    });

    it('formats number with custom locale', () => {
      const formatted = formatNumber(1234567.89, 'en');
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
    });
  });

  describe('formatRelativeTime', () => {
    it('formats relative time for seconds', () => {
      const date = new Date(Date.now() - 30 * 1000);
      const formatted = formatRelativeTime(date, 'en');
      expect(formatted).toBeTruthy();
    });

    it('formats relative time for minutes', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000);
      const formatted = formatRelativeTime(date, 'en');
      expect(formatted).toBeTruthy();
    });

    it('formats relative time for hours', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const formatted = formatRelativeTime(date, 'en');
      expect(formatted).toBeTruthy();
    });

    it('formats relative time for days', () => {
      const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const formatted = formatRelativeTime(date, 'en');
      expect(formatted).toBeTruthy();
    });

    it('formats date string', () => {
      const dateStr = new Date(Date.now() - 30 * 1000).toISOString();
      const formatted = formatRelativeTime(dateStr, 'en');
      expect(formatted).toBeTruthy();
    });
  });
});
