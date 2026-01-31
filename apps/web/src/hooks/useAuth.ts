/**
 * useAuth Hook
 * Centralized authentication logic and token management
 */

import { useCallback, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { authAPI, usersAPI } from '@/lib/api';
import { handleApiError } from '@/lib/errors/api';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { transformApiUserToStoreUser } from '@/lib/auth/userTransform';
import { logger } from '@/lib/logger';
import { getErrorStatus } from '@/lib/errors';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, login, logout, setUser, setError, error } = useAuthStore();

  /**
   * Login with email and password
   */
  const handleLogin = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setError(null);
        const response = await authAPI.login(credentials.email, credentials.password);
        const { access_token, refresh_token, user: userData } = response.data;

        // Transform user data to store format
        const userForStore = transformApiUserToStoreUser(userData);

        // Store tokens securely
        await TokenStorage.setToken(access_token, refresh_token);

        // Update store
        login(userForStore, access_token, refresh_token);

        return { success: true, user: userData };
      } catch (err) {
        const appError = handleApiError(err);
        setError(appError.message);
        return { success: false, error: appError };
      }
    },
    [login, setError]
  );

  /**
   * Register new user
   */
  const handleRegister = useCallback(
    async (data: RegisterData) => {
      try {
        setError(null);
        const response = await authAPI.register(data.email, data.password, data.name);
        const userData = response.data;

        // Auto-login after registration
        const loginResponse = await authAPI.login(data.email, data.password);
        const { access_token, refresh_token, user: loginUserData } = loginResponse.data;

        // Transform user data to store format
        const userForStore = transformApiUserToStoreUser(loginUserData);

        await TokenStorage.setToken(access_token, refresh_token);

        login(userForStore, access_token, refresh_token);
        return { success: true, user: userData };
      } catch (err) {
        const appError = handleApiError(err);
        setError(appError.message);
        return { success: false, error: appError };
      }
    },
    [login, setError]
  );

  /**
   * Logout user
   */
  const handleLogout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      // Ignore logout errors but log them
      logger.error('Logout error', err instanceof Error ? err : new Error(String(err)));
    } finally {
      // Clear tokens securely
      await TokenStorage.removeTokens();
      logout();
      router.push('/auth/login');
    }
  }, [logout, router]);

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async () => {
    try {
      const refreshTokenValue = TokenStorage.getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refresh(refreshTokenValue);
      const { access_token, refresh_token: newRefreshToken, user: userData } = response.data;

      await TokenStorage.setToken(access_token, newRefreshToken);

      // Update token in store
      useAuthStore.getState().setToken(access_token);

      // If user data is included in refresh response, update user in store
      if (userData) {
        const userForStore = transformApiUserToStoreUser(userData);
        setUser(userForStore);
      } else if (!user) {
        // If no user data in response and no user in store, fetch it
        try {
          const userResponse = await usersAPI.getMe();
          if (userResponse.data) {
            const userForStore = transformApiUserToStoreUser(userResponse.data);
            setUser(userForStore);
          }
        } catch (fetchErr) {
          // Log but don't fail - token refresh succeeded
          logger.warn('Failed to fetch user after token refresh', {
            error: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
          });
        }
      }

      return { success: true };
    } catch (err) {
      // Refresh failed, logout user
      handleLogout();
      return { success: false, error: err };
    }
  }, [handleLogout, user, setUser]);

  /**
   * Check if user is authenticated and refresh token if needed
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAuth = async () => {
      // Wait a bit for Zustand persist to hydrate
      await new Promise((resolve) => setTimeout(resolve, 100));

      const storedToken = TokenStorage.getToken();
      const storedRefreshToken = TokenStorage.getRefreshToken();
      const storeToken = token;
      const storeRefreshToken = useAuthStore.getState().refreshToken;

      // Sync: If store has token but TokenStorage doesn't, sync them
      // This handles cases where Zustand persisted but TokenStorage didn't (e.g., after browser restart)
      if (storeToken && !storedToken) {
        await TokenStorage.setToken(storeToken, storeRefreshToken || undefined);
      }

      // If we have a refresh token but no access token, try to refresh
      if (!storedToken && storedRefreshToken) {
        await refreshToken();
        return; // Exit early, refreshToken will handle user fetch
      }

      // If we have a token but no user, try to fetch user (non-critical, use startTransition)
      if (storedToken && !user) {
        startTransition(async () => {
          try {
            const response = await usersAPI.getMe();
            if (response.data) {
              // Transform user data to store format
              const userForStore = transformApiUserToStoreUser(response.data);
              setUser(userForStore);
            }
          } catch (err: unknown) {
            // Token might be invalid, try refresh
            const statusCode = getErrorStatus(err);

            // Only logout on authentication errors (401, 403), not server errors (500, 502, etc.)
            if (statusCode === 401 || statusCode === 403 || statusCode === 422) {
              // Authentication error - try refresh if available
              if (storedRefreshToken) {
                await refreshToken();
              } else {
                // No refresh token or refresh failed, logout
                logger.warn('Authentication failed, logging out', {
                  statusCode,
                  hasRefreshToken: !!storedRefreshToken,
                });
                handleLogout();
              }
            } else {
              // Server errors (500, 502, 503, etc.) or network errors - don't logout
              // User might still be authenticated, just server is having issues
              logger.warn('Failed to fetch user info, but not logging out (server/network error)', {
                statusCode,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
        });
      }
    };

    checkAuth();
  }, [user, refreshToken, setUser, handleLogout]);

  return {
    user,
    token,
    isAuthenticated: isAuthenticated(),
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshToken,
  };
}
