/**
 * useFeatureFlag Hook Tests
 *
 * Comprehensive test suite for the useFeatureFlag hook covering:
 * - Feature flag checking
 * - Loading states
 * - Error handling
 * - Team-specific flags
 * - Variant support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFeatureFlag } from '../useFeatureFlag';
import { apiClient } from '@/lib/api/client';

// Mock apiClient
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('useFeatureFlag Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature Flag Checking', () => {
    it('checks feature flag on mount', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { enabled: true },
      } as never);

      const { result } = renderHook(() => useFeatureFlag('test-feature'));

      expect(result.current.isLoading).toBe(true);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.enabled).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith(
        '/api/v1/feature-flags/feature-flags/test-feature/check',
        { params: { team_id: undefined } }
      );
    });

    it('handles disabled feature flag', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { enabled: false },
      } as never);

      const { result } = renderHook(() => useFeatureFlag('test-feature'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.enabled).toBe(false);
    });

    it('handles feature flag with variant', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { enabled: true, variant: 'variant-a' },
      } as never);

      const { result } = renderHook(() => useFeatureFlag('test-feature'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.enabled).toBe(true);
      expect(result.current.variant).toBe('variant-a');
    });
  });

  describe('Team-Specific Flags', () => {
    it('checks feature flag with team ID', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { enabled: true },
      } as never);

      renderHook(() => useFeatureFlag('test-feature', 123));

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith(
          '/api/v1/feature-flags/feature-flags/test-feature/check',
          { params: { team_id: 123 } }
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useFeatureFlag('test-feature'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.enabled).toBe(false);
    });
  });
});
