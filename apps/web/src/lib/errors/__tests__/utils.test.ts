/**
 * Error Utils Tests
 *
 * Comprehensive test suite for error utility functions covering:
 * - isApiError type guard
 * - isAxiosErrorType type guard
 * - getErrorMessage function
 * - getErrorDetail function
 */

import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import { isApiError, isAxiosErrorType, getErrorMessage, getErrorDetail } from '../utils';
import { AppError } from '../AppError';
import { ErrorCode } from '../types';

describe('Error Utils', () => {
  describe('isApiError', () => {
    it('returns true for API error with response', () => {
      const error = {
        name: 'Error',
        message: 'API Error',
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { detail: 'Resource not found' },
        },
      };
      expect(isApiError(error)).toBe(true);
    });

    it('returns true for error with isAxiosError flag', () => {
      const error = {
        name: 'Error',
        message: 'Axios Error',
        isAxiosError: true,
      };
      expect(isApiError(error)).toBe(true);
    });

    it('returns true for error with statusCode', () => {
      const error = {
        name: 'Error',
        message: 'HTTP Error',
        statusCode: 500,
      };
      expect(isApiError(error)).toBe(true);
    });

    it('returns false for standard Error', () => {
      const error = new Error('Standard error');
      expect(isApiError(error)).toBe(false);
    });
  });

  describe('isAxiosErrorType', () => {
    it('returns true for Axios error', () => {
      const error = {
        isAxiosError: true,
      };
      expect(isAxiosErrorType(error)).toBe(true);
    });

    it('returns false for non-Axios error', () => {
      const error = new Error('Standard error');
      expect(isAxiosErrorType(error)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('extracts message from AppError', () => {
      const error = new AppError(ErrorCode.UNKNOWN_ERROR, 'Custom error message');
      expect(getErrorMessage(error)).toBe('Custom error message');
    });

    it('extracts message from API error response', () => {
      const error = {
        name: 'Error',
        message: 'API Error',
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: {
            detail: 'Validation failed',
            message: 'Error message',
          },
        },
      };
      expect(getErrorMessage(error)).toBe('Validation failed');
    });

    it('extracts message from standard Error', () => {
      const error = new Error('Standard error');
      expect(getErrorMessage(error)).toBe('Standard error');
    });

    it('uses fallback message when error has no message', () => {
      const error = {};
      expect(getErrorMessage(error, 'Fallback message')).toBe('Fallback message');
    });

    it('handles string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });
  });

  describe('getErrorDetail', () => {
    it('extracts detail from AppError', () => {
      const error = new AppError(ErrorCode.UNKNOWN_ERROR, 'Error', 500, { detail: 'Error detail' });
      expect(getErrorDetail(error)).toBe('Error detail');
    });

    it('extracts detail from API error response', () => {
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
  });
});
