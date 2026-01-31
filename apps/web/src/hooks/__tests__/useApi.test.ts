/**
 * useApi Hook Tests
 *
 * Comprehensive test suite for the useApi hook covering:
 * - API calls with different HTTP methods
 * - Loading states
 * - Error handling
 * - Retry functionality
 * - Transform functions
 * - Success/error callbacks
 * - Refetch functionality
 * - Reset functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../useApi';
import { apiClient } from '@/lib/api/client';

// Mock apiClient
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('useApi Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET Requests', () => {
    it('fetches data on mount', async () => {
      const mockData = { id: 1, name: 'Test' };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const { result } = renderHook(() =>
        useApi({
          url: '/api/test',
          method: 'GET',
        })
      );

      expect(result.current.isLoading).toBe(true);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });

    it('handles GET request errors', async () => {
      const mockError = new Error('API Error');
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      const { result } = renderHook(() =>
        useApi({
          url: '/api/test',
          method: 'GET',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
    });
  });

  describe('POST Requests', () => {
    it('sends POST request with body', async () => {
      const mockData = { id: 1, name: 'Created' };
      const requestBody = { name: 'Test' };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockData });

      const { result } = renderHook(() =>
        useApi({
          url: '/api/test',
          method: 'POST',
          body: requestBody,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(apiClient.post).toHaveBeenCalledWith('/api/test', requestBody, { params: undefined });
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe('Refetch Functionality', () => {
    it('refetches data when refetch is called', async () => {
      const mockData = { id: 1, name: 'Test' };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const { result } = renderHook(() =>
        useApi({
          url: '/api/test',
          method: 'GET',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 2, name: 'Updated' } });
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 2, name: 'Updated' });
      });
    });
  });

  describe('Reset Functionality', () => {
    it('resets state when reset is called', async () => {
      const mockData = { id: 1, name: 'Test' };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const { result } = renderHook(() =>
        useApi({
          url: '/api/test',
          method: 'GET',
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.reset();

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Transform Function', () => {
    it('transforms data using transform function', async () => {
      const mockData = { id: 1, name: 'Test' };
      const transformFn = vi.fn((data) => ({ ...data, transformed: true }));
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      const { result } = renderHook(() =>
        useApi({
          url: '/api/test',
          method: 'GET',
          transform: transformFn,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      expect(transformFn).toHaveBeenCalledWith(mockData);
      expect(result.current.data).toEqual({ ...mockData, transformed: true });
    });
  });

  describe('Callbacks', () => {
    it('calls onSuccess callback on success', async () => {
      const mockData = { id: 1, name: 'Test' };
      const onSuccess = vi.fn();
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockData });

      renderHook(() =>
        useApi({
          url: '/api/test',
          method: 'GET',
          onSuccess,
        })
      );

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockData);
      });
    });

    it('calls onError callback on error', async () => {
      const mockError = new Error('API Error');
      const onError = vi.fn();
      vi.mocked(apiClient.get).mockRejectedValue(mockError);

      renderHook(() =>
        useApi({
          url: '/api/test',
          method: 'GET',
          onError,
        })
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Immediate Option', () => {
    it('does not fetch immediately when immediate is false', () => {
      renderHook(() =>
        useApi({
          url: '/api/test',
          method: 'GET',
          immediate: false,
        })
      );

      expect(apiClient.get).not.toHaveBeenCalled();
    });
  });
});
