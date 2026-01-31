/**
 * Error Utils Tests
 *
 * Comprehensive test suite for error utility functions covering:
 * - getErrorMessage function
 * - getErrorDetail function
 */

import { describe, it, expect } from 'vitest';
import { getErrorMessage, getErrorDetail } from '../error-utils';

describe('Error Utils', () => {
  describe('getErrorMessage', () => {
    it('extracts message from Axios error with detail', () => {
      const error = {
        response: {
          data: {
            detail: 'Validation failed',
            message: 'Error message',
          },
        },
        message: 'Axios error',
      };
      expect(getErrorMessage(error)).toBe('Validation failed');
    });

    it('extracts message from Axios error with message only', () => {
      const error = {
        response: {
          data: {
            message: 'Error message',
          },
        },
        message: 'Axios error',
      };
      expect(getErrorMessage(error)).toBe('Error message');
    });

    it('extracts message from standard Error', () => {
      const error = new Error('Standard error');
      expect(getErrorMessage(error)).toBe('Standard error');
    });

    it('uses fallback message when error has no message', () => {
      const error = {};
      expect(getErrorMessage(error, 'Custom fallback')).toBe('Custom fallback');
    });

    it('handles string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('uses default fallback when no message available', () => {
      const error = {};
      expect(getErrorMessage(error)).toBe('Une erreur est survenue');
    });
  });

  describe('getErrorDetail', () => {
    it('extracts detail from Axios error response', () => {
      const error = {
        response: {
          data: {
            detail: 'Error detail',
          },
        },
      };
      expect(getErrorDetail(error)).toBe('Error detail');
    });

    it('returns undefined when no detail available', () => {
      const error = new Error('Standard error');
      expect(getErrorDetail(error)).toBeUndefined();
    });

    it('returns undefined for non-Axios error', () => {
      const error = {};
      expect(getErrorDetail(error)).toBeUndefined();
    });
  });
});
