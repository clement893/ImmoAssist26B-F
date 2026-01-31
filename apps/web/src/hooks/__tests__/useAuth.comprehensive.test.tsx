/**
 * Comprehensive Tests for useAuth Hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../useAuth';
import { useAuthStore } from '@/lib/store';
import { authAPI, usersAPI } from '@/lib/api';
import { TokenStorage } from '@/lib/auth/tokenStorage';

// Mock dependencies
vi.mock('next/navigation');
vi.mock('@/lib/store');
vi.mock('@/lib/api');
vi.mock('@/lib/auth/tokenStorage');
vi.mock('@/lib/errors/api');
vi.mock('@/lib/logger');

describe('useAuth', () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  };

  const mockStore = {
    user: null,
    token: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    setError: vi.fn(),
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useAuthStore as any).mockReturnValue(mockStore);
  });

  describe('handleLogin', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'access_token_123',
          refresh_token: 'refresh_token_123',
          user: { id: 1, email: 'test@example.com' },
        },
      };

      (authAPI.login as any).mockResolvedValue(mockResponse);
      (TokenStorage.setToken as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.handleLogin({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(loginResult.success).toBe(true);
      expect(authAPI.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(TokenStorage.setToken).toHaveBeenCalledWith('access_token_123', 'refresh_token_123');
      expect(mockStore.login).toHaveBeenCalled();
    });

    it('should handle login errors', async () => {
      const mockError = new Error('Invalid credentials');
      (authAPI.login as any).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth());

      let loginResult: any;
      await act(async () => {
        loginResult = await result.current.handleLogin({
          email: 'test@example.com',
          password: 'wrong',
        });
      });

      expect(loginResult.success).toBe(false);
      expect(mockStore.setError).toHaveBeenCalled();
    });
  });

  describe('handleRegister', () => {
    it('should register and auto-login successfully', async () => {
      const mockUser = { id: 1, email: 'new@example.com' };
      const mockRegisterResponse = { data: mockUser };
      const mockLoginResponse = {
        data: {
          access_token: 'access_token_123',
          refresh_token: 'refresh_token_123',
        },
      };

      (authAPI.register as any).mockResolvedValue(mockRegisterResponse);
      (authAPI.login as any).mockResolvedValue(mockLoginResponse);
      (TokenStorage.setToken as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      let registerResult: any;
      await act(async () => {
        registerResult = await result.current.handleRegister({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        });
      });

      expect(registerResult.success).toBe(true);
      expect(authAPI.register).toHaveBeenCalled();
      expect(authAPI.login).toHaveBeenCalled();
      expect(TokenStorage.setToken).toHaveBeenCalled();
    });
  });

  describe('handleLogout', () => {
    it('should logout successfully', async () => {
      (authAPI.logout as any).mockResolvedValue({});
      (TokenStorage.removeTokens as any).mockReturnValue(undefined);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogout();
      });

      expect(TokenStorage.removeTokens).toHaveBeenCalled();
      expect(mockStore.logout).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/login');
    });

    it('should logout even if API call fails', async () => {
      (authAPI.logout as any).mockRejectedValue(new Error('API Error'));
      (TokenStorage.removeTokens as any).mockReturnValue(undefined);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.handleLogout();
      });

      // Should still clear tokens and logout
      expect(TokenStorage.removeTokens).toHaveBeenCalled();
      expect(mockStore.logout).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        data: {
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
        },
      };

      (authAPI.refreshToken as any).mockResolvedValue(mockResponse);
      (TokenStorage.setToken as any).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.refreshToken();
      });

      expect(authAPI.refreshToken).toHaveBeenCalled();
      expect(TokenStorage.setToken).toHaveBeenCalled();
    });
  });
});
