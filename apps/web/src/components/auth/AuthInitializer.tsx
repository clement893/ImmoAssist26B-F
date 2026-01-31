/**
 * AuthInitializer Component
 *
 * Initializes and restores authentication state on app startup.
 * This ensures that users remain logged in after page refresh.
 *
 * Key responsibilities:
 * 1. Wait for Zustand persist to hydrate
 * 2. Sync TokenStorage with Zustand store
 * 3. Restore user data if token exists but user is missing
 * 4. Refresh token if access token expired but refresh token exists
 */
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { usersAPI, authAPI } from '@/lib/api';
import { transformApiUserToStoreUser } from '@/lib/auth/userTransform';
import { logger } from '@/lib/logger';
import { getErrorStatus } from '@/lib/errors';
import { useHydrated } from '@/hooks/useHydrated';

export function AuthInitializer() {
  const isHydrated = useHydrated();
  const { user, token, refreshToken: storeRefreshToken, setUser, setToken, setRefreshToken, logout } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Wait for Zustand persist to hydrate before checking auth
    if (!isHydrated) {
      return;
    }

    // Prevent multiple initializations
    if (isInitialized) {
      return;
    }

    const initializeAuth = async () => {
      try {
        // Get tokens from storage (localStorage)
        const storedToken = TokenStorage.getToken();
        const storedRefreshToken = TokenStorage.getRefreshToken();

        // Sync: If store has token but TokenStorage doesn't, sync them
        // This handles cases where Zustand persisted but TokenStorage didn't
        if (token && !storedToken) {
          logger.debug('Syncing token from store to TokenStorage');
          await TokenStorage.setToken(token, storeRefreshToken || undefined);
        }

        // Sync: If TokenStorage has token but store doesn't, sync them
        // This handles cases where TokenStorage persisted but Zustand didn't
        if (storedToken && !token) {
          logger.debug('Syncing token from TokenStorage to store');
          await setToken(storedToken);
        }

        // Sync refresh token
        if (storedRefreshToken && !storeRefreshToken) {
          logger.debug('Syncing refresh token from TokenStorage to store');
          await setRefreshToken(storedRefreshToken);
        }

        // Get current state after sync
        const currentToken = token || storedToken;
        const currentRefreshToken = storeRefreshToken || storedRefreshToken;
        const currentUser = user;

        // If we have a refresh token but no access token, try to refresh
        if (!currentToken && currentRefreshToken) {
          logger.debug('Access token missing but refresh token exists, attempting refresh');
          try {
            const response = await authAPI.refresh(currentRefreshToken);
            const { access_token, refresh_token: newRefreshToken, user: userData } = response.data;

            // Store new tokens
            await TokenStorage.setToken(access_token, newRefreshToken);
            await setToken(access_token);
            if (newRefreshToken) {
              await setRefreshToken(newRefreshToken);
            }

            // If user data is included in refresh response, update user
            if (userData) {
              const userForStore = transformApiUserToStoreUser(userData);
              setUser(userForStore);
            } else if (!currentUser) {
              // If no user data in response and no user in store, fetch it
              try {
                const userResponse = await usersAPI.getMe();
                if (userResponse.data) {
                  const userForStore = transformApiUserToStoreUser(userResponse.data);
                  setUser(userForStore);
                }
              } catch (fetchErr) {
                logger.warn('Failed to fetch user after token refresh', {
                  error: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
                });
              }
            }

            logger.info('Token refreshed successfully on app initialization');
            setIsInitialized(true);
            return;
          } catch (refreshErr) {
            // Refresh failed, clear tokens and logout
            logger.warn('Token refresh failed on app initialization', {
              error: refreshErr instanceof Error ? refreshErr.message : String(refreshErr),
            });
            await TokenStorage.removeTokens();
            logout();
            setIsInitialized(true);
            return;
          }
        }

        // If we have a token but no user, fetch user data
        if (currentToken && !currentUser) {
          logger.debug('Token exists but user missing, fetching user data');
          try {
            const response = await usersAPI.getMe();
            if (response.data) {
              const userForStore = transformApiUserToStoreUser(response.data);
              setUser(userForStore);
              logger.info('User data restored on app initialization', {
                userId: userForStore.id,
                email: userForStore.email,
              });
            }
          } catch (fetchErr) {
            const statusCode = getErrorStatus(fetchErr);

            // Only logout on authentication errors (401, 403, 422)
            if (statusCode === 401 || statusCode === 403 || statusCode === 422) {
              // Authentication error - try refresh if available
              if (currentRefreshToken) {
                try {
                  const refreshResponse = await authAPI.refresh(currentRefreshToken);
                  const { access_token, refresh_token: newRefreshToken, user: userData } = refreshResponse.data;

                  await TokenStorage.setToken(access_token, newRefreshToken);
                  await setToken(access_token);
                  if (newRefreshToken) {
                    await setRefreshToken(newRefreshToken);
                  }

                  if (userData) {
                    const userForStore = transformApiUserToStoreUser(userData);
                    setUser(userForStore);
                  } else {
                    const userResponse = await usersAPI.getMe();
                    if (userResponse.data) {
                      const userForStore = transformApiUserToStoreUser(userResponse.data);
                      setUser(userForStore);
                    }
                  }

                  logger.info('Token refreshed and user restored after auth error');
                } catch (refreshErr) {
                  // Refresh failed, logout
                  logger.warn('Token refresh failed after auth error, logging out', {
                    error: refreshErr instanceof Error ? refreshErr.message : String(refreshErr),
                  });
                  await TokenStorage.removeTokens();
                  logout();
                }
              } else {
                // No refresh token, logout
                logger.warn('No refresh token available, logging out');
                await TokenStorage.removeTokens();
                logout();
              }
            } else {
              // Server errors (500, 502, 503, etc.) or network errors - don't logout
              // User might still be authenticated, just server is having issues
              logger.warn('Failed to fetch user info, but not logging out (server/network error)', {
                statusCode,
                error: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
              });
            }
          }
        }

        // If we have both token and user, verify token is still valid
        if (currentToken && currentUser) {
          logger.debug('Token and user exist, verifying token validity');
          try {
            // Make a lightweight API call to verify token
            await usersAPI.getMe();
            logger.debug('Token verified successfully');
          } catch (verifyErr) {
            const statusCode = getErrorStatus(verifyErr);

            // If token is invalid, try refresh
            if (statusCode === 401 || statusCode === 403 || statusCode === 422) {
              if (currentRefreshToken) {
                try {
                  const refreshResponse = await authAPI.refresh(currentRefreshToken);
                  const { access_token, refresh_token: newRefreshToken, user: userData } = refreshResponse.data;

                  await TokenStorage.setToken(access_token, newRefreshToken);
                  await setToken(access_token);
                  if (newRefreshToken) {
                    await setRefreshToken(newRefreshToken);
                  }

                  if (userData) {
                    const userForStore = transformApiUserToStoreUser(userData);
                    setUser(userForStore);
                  }

                  logger.info('Token refreshed after verification failure');
                } catch (refreshErr) {
                  logger.warn('Token refresh failed after verification failure, logging out', {
                    error: refreshErr instanceof Error ? refreshErr.message : String(refreshErr),
                  });
                  await TokenStorage.removeTokens();
                  logout();
                }
              } else {
                logger.warn('Token invalid and no refresh token, logging out');
                await TokenStorage.removeTokens();
                logout();
              }
            }
          }
        }

        setIsInitialized(true);
      } catch (err) {
        logger.error('Auth initialization error', err instanceof Error ? err : new Error(String(err)));
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [isHydrated, isInitialized, user, token, storeRefreshToken, setUser, setToken, setRefreshToken, logout]);

  // This component doesn't render anything
  return null;
}
