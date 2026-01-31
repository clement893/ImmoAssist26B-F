/**
 * useLogger Hook Tests
 *
 * Comprehensive test suite for the useLogger hook covering:
 * - Logger methods (debug, info, warn, error)
 * - Context parameter handling
 * - Error normalization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLogger } from '../useLogger';
import { logger } from '@/lib/logger';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useLogger Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Logger Methods', () => {
    it('provides debug method', () => {
      const { result } = renderHook(() => useLogger());
      result.current.debug('Debug message', { context: 'test' });
      expect(logger.debug).toHaveBeenCalledWith('Debug message', { context: 'test' });
    });

    it('provides info method', () => {
      const { result } = renderHook(() => useLogger());
      result.current.info('Info message', { context: 'test' });
      expect(logger.info).toHaveBeenCalledWith('Info message', { context: 'test' });
    });

    it('provides warn method', () => {
      const { result } = renderHook(() => useLogger());
      result.current.warn('Warning message', { context: 'test' });
      expect(logger.warn).toHaveBeenCalledWith('Warning message', { context: 'test' });
    });

    it('provides error method', () => {
      const { result } = renderHook(() => useLogger());
      const error = new Error('Test error');
      result.current.error('Error message', error, { context: 'test' });
      expect(logger.error).toHaveBeenCalledWith('Error message', error, { context: 'test' });
    });
  });

  describe('Error Normalization', () => {
    it('normalizes non-Error objects to Error', () => {
      const { result } = renderHook(() => useLogger());
      result.current.error('Error message', 'string error');
      expect(logger.error).toHaveBeenCalledWith('Error message', expect.any(Error), undefined);
    });

    it('handles undefined error', () => {
      const { result } = renderHook(() => useLogger());
      result.current.error('Error message');
      expect(logger.error).toHaveBeenCalledWith('Error message', undefined, undefined);
    });
  });
});
