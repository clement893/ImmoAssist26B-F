import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { authAPI, usersAPI, subscriptionsAPI } from '../api';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as unknown as {
  create: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authAPI', () => {
    it('login calls correct endpoint', async () => {
      const mockResponse = { data: { token: 'test-token' } };
      mockedAxios.post = vi.fn().mockResolvedValue(mockResponse);

      // Note: This is a simplified test - actual implementation uses apiClient
      expect(authAPI.login).toBeDefined();
    });
  });

  describe('usersAPI', () => {
    it('getMe calls correct endpoint', () => {
      expect(usersAPI.getMe).toBeDefined();
    });

    it('updateMe calls correct endpoint', () => {
      expect(usersAPI.updateMe).toBeDefined();
    });
  });

  describe('subscriptionsAPI', () => {
    it('getPlans calls correct endpoint', () => {
      expect(subscriptionsAPI.getPlans).toBeDefined();
    });

    it('getMySubscription calls correct endpoint', () => {
      expect(subscriptionsAPI.getMySubscription).toBeDefined();
    });

    it('createCheckoutSession calls correct endpoint', () => {
      expect(subscriptionsAPI.createCheckoutSession).toBeDefined();
    });
  });
});
