/**
 * usePreferences Hook Tests
 *
 * Comprehensive test suite for the usePreferences hook covering:
 * - Fetch preferences
 * - Get preference
 * - Set preference
 * - Set preferences batch
 * - Loading states
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePreferences } from '../usePreferences';
import { apiClient } from '@/lib/api/client';

// Mock apiClient
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('usePreferences Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fetch Preferences', () => {
    it('fetches preferences on mount', async () => {
      const mockPreferences = { theme: 'dark', language: 'en' };
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockPreferences,
      } as never);

      const { result } = renderHook(() => usePreferences());

      expect(result.current.isLoading).toBe(true);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.preferences).toEqual(mockPreferences);
      expect(apiClient.get).toHaveBeenCalledWith('/v1/users/preferences');
    });

    it('handles fetch errors gracefully', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Fetch failed'));

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.preferences).toEqual({});
    });
  });

  describe('Get Preference', () => {
    it('returns preference value', async () => {
      const mockPreferences = { theme: 'dark', language: 'en' };
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockPreferences,
      } as never);

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getPreference('theme')).toBe('dark');
      expect(result.current.getPreference('language')).toBe('en');
    });

    it('returns default value when preference not found', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {},
      } as never);

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.getPreference('missing', 'default')).toBe('default');
    });
  });

  describe('Set Preference', () => {
    it('sets preference successfully', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {},
      } as never);
      vi.mocked(apiClient.put).mockResolvedValue({} as never);

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const success = await result.current.setPreference('theme', 'dark');

      expect(apiClient.put).toHaveBeenCalledWith('/v1/users/preferences/theme', { value: 'dark' });
      expect(success).toBe(true);
      expect(result.current.preferences.theme).toBe('dark');
    });

    it('handles set preference errors', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {},
      } as never);
      vi.mocked(apiClient.put).mockRejectedValue(new Error('Set failed'));

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const success = await result.current.setPreference('theme', 'dark');

      expect(success).toBe(false);
    });
  });

  describe('Set Preferences Batch', () => {
    it('sets multiple preferences successfully', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {},
      } as never);
      vi.mocked(apiClient.put).mockResolvedValue({} as never);

      const { result } = renderHook(() => usePreferences());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const prefs = { theme: 'dark', language: 'en' };
      const success = await result.current.setPreferencesBatch(prefs);

      expect(apiClient.put).toHaveBeenCalledWith('/v1/users/preferences', prefs);
      expect(success).toBe(true);
      expect(result.current.preferences).toEqual(prefs);
    });
  });
});
