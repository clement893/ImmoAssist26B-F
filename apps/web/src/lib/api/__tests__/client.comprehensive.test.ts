/**
 * Comprehensive Tests for API Client
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { apiClient } from '../client';
import { handleApiError } from '@/lib/errors';

// Mock dependencies
vi.mock('axios');
vi.mock('@/lib/errors');
vi.mock('@/lib/logger');
vi.mock('../api', () => ({
  getApiUrl: () => 'http://localhost:8000',
}));

describe('API Client', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (axios.create as any).mockReturnValue(mockAxiosInstance);
  });

  describe('GET requests', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = {
        data: { success: true, data: { id: 1 } },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiClient.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle GET request errors', async () => {
      const mockError = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(mockError);
      (handleApiError as any).mockReturnValue(mockError);

      await expect(apiClient.get('/test')).rejects.toThrow();
      expect(handleApiError).toHaveBeenCalled();
    });
  });

  describe('POST requests', () => {
    it('should make POST request successfully', async () => {
      const mockData = { name: 'Test' };
      const mockResponse = {
        data: { success: true, data: { id: 1, ...mockData } },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiClient.post('/test', mockData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', mockData, undefined);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('PUT requests', () => {
    it('should make PUT request successfully', async () => {
      const mockData = { name: 'Updated' };
      const mockResponse = {
        data: { success: true, data: { id: 1, ...mockData } },
      };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await apiClient.put('/test/1', mockData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', mockData, undefined);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('PATCH requests', () => {
    it('should make PATCH request successfully', async () => {
      const mockData = { name: 'Patched' };
      const mockResponse = {
        data: { success: true, data: { id: 1, ...mockData } },
      };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await apiClient.patch('/test/1', mockData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', mockData, undefined);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('DELETE requests', () => {
    it('should make DELETE request successfully', async () => {
      const mockResponse = {
        data: { success: true },
      };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await apiClient.delete('/test/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Request interceptors', () => {
    it('should setup request interceptors', () => {
      // Client creation should setup interceptors
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });
  });

  describe('Response interceptors', () => {
    it('should setup response interceptors', () => {
      // Client creation should setup interceptors
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });
});
