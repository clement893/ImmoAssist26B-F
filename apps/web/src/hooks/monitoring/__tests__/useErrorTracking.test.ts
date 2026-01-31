/**
 * useErrorTracking Hook Tests
 *
 * Comprehensive test suite for the useErrorTracking hook covering:
 * - Error data fetching
 * - Statistics calculation
 * - Loading states
 * - Error handling
 * - Refresh functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useErrorTracking } from '../useErrorTracking';
import { ErrorStatisticsService } from '@/services/errorStatisticsService';

// Mock ErrorStatisticsService
vi.mock('@/services/errorStatisticsService', () => ({
  ErrorStatisticsService: {
    calculateStats: vi.fn(),
    getRecentErrors: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useErrorTracking Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Error Data Fetching', () => {
    it('fetches error data from localStorage', async () => {
      const mockErrors = [
        {
          id: '1',
          message: 'Test error',
          level: 'error' as const,
          timestamp: new Date().toISOString(),
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockErrors));
      vi.mocked(ErrorStatisticsService.calculateStats).mockReturnValue({
        totalErrors: 1,
        errorsLast24h: 1,
        errorsLast7d: 1,
        errorsByLevel: { error: 1, warning: 0, info: 0 },
      });

      const { result } = renderHook(() => useErrorTracking());

      expect(result.current.isLoading).toBe(true);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.errors).toEqual(mockErrors);
      expect(ErrorStatisticsService.calculateStats).toHaveBeenCalledWith(mockErrors);
    });

    it('handles empty localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      vi.mocked(ErrorStatisticsService.calculateStats).mockReturnValue({
        totalErrors: 0,
        errorsLast24h: 0,
        errorsLast7d: 0,
        errorsByLevel: { error: 0, warning: 0, info: 0 },
      });

      const { result } = renderHook(() => useErrorTracking());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.errors).toEqual([]);
    });
  });

  describe('Statistics Calculation', () => {
    it('calculates statistics from errors', async () => {
      const mockErrors = [
        {
          id: '1',
          message: 'Error 1',
          level: 'error' as const,
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          message: 'Warning 1',
          level: 'warning' as const,
          timestamp: new Date().toISOString(),
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockErrors));
      const mockStats = {
        totalErrors: 2,
        errorsLast24h: 2,
        errorsLast7d: 2,
        errorsByLevel: { error: 1, warning: 1, info: 0 },
      };
      vi.mocked(ErrorStatisticsService.calculateStats).mockReturnValue(mockStats);

      const { result } = renderHook(() => useErrorTracking());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.stats).toEqual(mockStats);
    });
  });

  describe('Refresh Functionality', () => {
    it('refreshes error data when refresh is called', async () => {
      localStorageMock.getItem.mockReturnValue(null);
      vi.mocked(ErrorStatisticsService.calculateStats).mockReturnValue({
        totalErrors: 0,
        errorsLast24h: 0,
        errorsLast7d: 0,
        errorsByLevel: { error: 0, warning: 0, info: 0 },
      });

      const { result } = renderHook(() => useErrorTracking());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const initialCallCount = localStorageMock.getItem.mock.calls.length;

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(localStorageMock.getItem.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles localStorage parse errors', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      vi.mocked(ErrorStatisticsService.calculateStats).mockReturnValue({
        totalErrors: 0,
        errorsLast24h: 0,
        errorsLast7d: 0,
        errorsByLevel: { error: 0, warning: 0, info: 0 },
      });

      const { result } = renderHook(() => useErrorTracking());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.error).toBeTruthy();
    });
  });
});
