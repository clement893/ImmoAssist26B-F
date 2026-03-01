'use client';

import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { checkMySuperAdminStatus } from '@/lib/api/admin';
import { logger } from '@/lib/logger';
import { getErrorStatus } from '@/lib/errors';
import { useHydrated } from '@/hooks/useHydrated';

/** Max time to wait for auth check before redirecting (avoids infinite "Verifying authentication..."). */
const AUTH_CHECK_TIMEOUT_MS = 15000;

/**
 * Protected Route Component
 *
 * Prevents unauthorized access to routes requiring authentication.
 * Automatically redirects to login if user is not authenticated.
 * Prevents flash of unauthenticated content during auth check.
 *
 * @example
 * ```tsx
 * // Basic protection
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 *
 * // Admin-only route
 * <ProtectedRoute requireAdmin>
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 */
interface ProtectedRouteProps {
  /** Child components to protect */
  children: ReactNode;
  /** Require admin privileges */
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, setUser } = useAuthStore();
  const isHydrated = useHydrated();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const checkingRef = useRef(false);
  const lastUserRef = useRef(user);
  const lastTokenRef = useRef(token);
  const lastPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    // Wait for hydration to complete before checking auth
    if (!isHydrated) {
      return;
    }

    // If user or token changed, update refs but only reset if going from authenticated to unauthenticated
    const userChanged = lastUserRef.current !== user;
    const tokenChanged = lastTokenRef.current !== token;
    const pathnameChanged = lastPathnameRef.current !== pathname;

    // Detect authentication state transitions
    const wasAuthenticated = !!lastUserRef.current && !!lastTokenRef.current;
    const isNowAuthenticated = !!user && !!token;

    if (userChanged || tokenChanged) {
      lastUserRef.current = user;
      lastTokenRef.current = token;

      // Only reset if we lost authentication (not if we gained it)
      if (wasAuthenticated && !isNowAuthenticated) {
        setIsAuthorized(false);
        setIsChecking(true);
        checkingRef.current = false;
      }
    }

    // Update pathname ref
    if (pathnameChanged) {
      lastPathnameRef.current = pathname;
    }

    // Prevent multiple simultaneous checks
    if (checkingRef.current) {
      return;
    }

    // If already authorized and only pathname changed (navigation), skip check
    if (isAuthorized && isNowAuthenticated && !userChanged && !tokenChanged && pathnameChanged) {
      setIsChecking(false);
      return;
    }

    // If already authorized and we're still authenticated, don't check again
    if (isAuthorized && isNowAuthenticated && !userChanged && !tokenChanged) {
      setIsChecking(false);
      return;
    }

    const checkAuth = async () => {
      checkingRef.current = true;
      setIsChecking(true);

      // Check authentication - prioritize sessionStorage if store not hydrated yet
      const tokenFromStorage = typeof window !== 'undefined' ? TokenStorage.getToken() : null;
      const currentToken = token || tokenFromStorage;
      const currentUser = user;

      const hasUser = !!currentUser;
      const hasToken = !!currentToken;

      // If we have a token but no user, try to fetch user from API
      // This handles the case where Zustand persist hasn't hydrated yet but token exists
      let fetchedUser = currentUser;

      if (hasToken && !hasUser && typeof window !== 'undefined') {
        try {
          const { usersAPI } = await import('@/lib/api');
          const { transformApiUserToStoreUser } = await import('@/lib/auth/userTransform');

          const response = await usersAPI.getMe();

          if (response.data) {
            const userForStore = transformApiUserToStoreUser(response.data);
            setUser(userForStore);

            // Update refs to reflect the new user
            lastUserRef.current = userForStore;
            fetchedUser = userForStore;
          }
        } catch (err: unknown) {
          // If fetching user fails, log but don't block - might be network issue
          const statusCode = getErrorStatus(err);

          if (process.env.NODE_ENV === 'development') {
            logger.debug('Failed to fetch user in ProtectedRoute', {
              error: err instanceof Error ? err.message : String(err),
              statusCode,
            });
          }

          // Only fail if it's an auth error (401/403), not server errors (500)
          if (statusCode === 401 || statusCode === 403) {
            // Token is invalid, clear it and redirect
            if (typeof window !== 'undefined') {
              TokenStorage.removeTokens();
            }

            checkingRef.current = false;
            setIsChecking(false);
            setIsAuthorized(false);
            router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
            return;
          }

          // For other errors (500, network, etc.), continue with token check
        }
      }

      // Final auth check with potentially fetched user
      const finalHasUser = !!fetchedUser;
      const isAuth = finalHasUser && hasToken;

      if (process.env.NODE_ENV === 'development') {
        logger.debug('ProtectedRoute auth check', {
          hasToken: !!tokenFromStorage,
          hasTokenFromStore: !!token,
          hasUser: !!user,
          fetchedUser: !!fetchedUser,
          isAuth,
          pathname,
          isAuthorized,
          wasAuthenticated,
          isNowAuthenticated: isAuth,
        });
      }

      // If we just became authenticated (transition from unauthenticated to authenticated),
      // authorize immediately without additional checks
      if (!wasAuthenticated && isAuth) {
        logger.debug('User just authenticated, authorizing immediately', {
          pathname,
        });
        setIsAuthorized(true);
        checkingRef.current = false;
        setIsChecking(false);
        return;
      }

      if (!isAuth) {
        logger.debug('Not authenticated, redirecting to login', { pathname });
        checkingRef.current = false;
        setIsChecking(false);
        setIsAuthorized(false);
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Check admin privileges if required
      if (requireAdmin) {
        // Check if user is admin OR superadmin (use fetchedUser if available)
        const userForAdminCheck = fetchedUser || user;
        let isAdmin = userForAdminCheck?.is_admin || false;

        // If not admin, check if user is superadmin
        if (!isAdmin) {
          const authToken = currentToken;

          try {
            if (authToken) {
              logger.debug('Checking superadmin status', {
                hasToken: !!authToken,
                tokenLength: authToken.length,
                userEmail: userForAdminCheck?.email,
                is_admin: userForAdminCheck?.is_admin,
              });

              const status = await checkMySuperAdminStatus(authToken);

              logger.debug('Superadmin status check result', {
                is_superadmin: status.is_superadmin,
                email: status.email,
                user_id: status.user_id,
                is_active: status.is_active,
                userEmail: userForAdminCheck?.email,
              });

              isAdmin = status.is_superadmin === true;

              if (isAdmin) {
                logger.info('User is superadmin, granting admin access', {
                  email: status.email || userForAdminCheck?.email,
                });
              } else {
                logger.warn('User is not superadmin', {
                  userEmail: userForAdminCheck?.email,
                  is_admin: userForAdminCheck?.is_admin,
                  apiResponse: status,
                });
              }
            } else {
              logger.warn('No token available for superadmin check', {
                hasTokenFromStorage: !!tokenFromStorage,
                hasTokenFromStore: !!token,
                userEmail: userForAdminCheck?.email,
              });
            }
          } catch (err: unknown) {
            // If superadmin check fails with 401/422, token might be invalid or expired
            const statusCode = getErrorStatus(err);

            logger.warn('Superadmin check failed', {
              status: statusCode,
              hasToken: !!authToken,
              error: err instanceof Error ? err.message : String(err),
              userEmail: userForAdminCheck?.email,
            });

            if (statusCode === 401 || statusCode === 422) {
              // Authentication error - try to refresh token
              const freshToken = TokenStorage.getToken();

              if (freshToken && freshToken !== authToken) {
                logger.debug('Found fresh token, retrying superadmin check');

                try {
                  const retryStatus = await checkMySuperAdminStatus(freshToken);
                  isAdmin = retryStatus.is_superadmin;

                  if (retryStatus.is_superadmin) {
                    logger.debug('User is superadmin after retry, granting admin access');
                  } else {
                    logger.debug('User is not superadmin after retry', {
                      userEmail: userForAdminCheck?.email,
                      is_admin: userForAdminCheck?.is_admin,
                    });
                  }
                } catch (retryErr: unknown) {
                  logger.warn('Retry also failed, redirecting to login', {
                    error: retryErr instanceof Error ? retryErr.message : String(retryErr),
                  });

                  checkingRef.current = false;
                  setIsChecking(false);
                  setIsAuthorized(false);
                  router.replace(
                    `/auth/login?redirect=${encodeURIComponent(pathname)}&error=unauthorized`
                  );
                  return;
                }
              } else {
                logger.warn('No valid token available, redirecting to login');

                checkingRef.current = false;
                setIsChecking(false);
                setIsAuthorized(false);
                router.replace(
                  `/auth/login?redirect=${encodeURIComponent(pathname)}&error=unauthorized`
                );
                return;
              }
            } else if (statusCode === 403) {
              // 403 means user is authenticated but doesn't have permission
              // This shouldn't happen for check-my-superadmin-status endpoint, but handle it
              logger.warn('Access forbidden (403) - user authenticated but not superadmin', {
                userEmail: userForAdminCheck?.email,
                is_admin: userForAdminCheck?.is_admin,
              });

              // Don't fall back to is_admin - 403 is definitive
              isAdmin = false;
            } else {
              // For network errors or other errors, log but allow fallback to is_admin
              // This handles cases where API is temporarily unavailable
              logger.warn('Superadmin check failed with non-auth error, using is_admin fallback', {
                status: statusCode,
                error: err instanceof Error ? err.message : String(err),
                is_admin: userForAdminCheck?.is_admin,
              });

              // Keep isAdmin as is (from is_admin field check above)
            }
          }

          if (!isAdmin) {
            checkingRef.current = false;
            setIsChecking(false);
            setIsAuthorized(false);
            router.replace('/dashboard?error=unauthorized');
            return;
          }
        }
      }

      // Authorize access
      setIsAuthorized(true);
      checkingRef.current = false;
      setIsChecking(false);
    };

    // Run auth check with timeout to avoid infinite "Verifying authentication..." if API hangs
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AUTH_TIMEOUT')), AUTH_CHECK_TIMEOUT_MS);
    });

    Promise.race([checkAuth(), timeoutPromise]).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'AUTH_TIMEOUT') {
        logger.warn('Auth check timed out, redirecting to login', { pathname });
        checkingRef.current = false;
        setIsChecking(false);
        setIsAuthorized(false);
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}&error=timeout`);
      }
    });
  }, [isHydrated, user, token, requireAdmin, isAuthorized]);

  // Show loader during verification
  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <div className="text-xl text-muted-foreground">Verifying authentication...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
