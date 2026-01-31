'use client';

import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { checkMySuperAdminStatus } from '@/lib/api/admin';
import { logger } from '@/lib/logger';
import { Card } from '@/components/ui';
import { AlertCircle } from 'lucide-react';
import { getErrorStatus } from '@/lib/errors';
import { useHydrated } from '@/hooks/useHydrated';

interface ProtectedSuperAdminRouteProps {
  children: ReactNode;
}

/**
 * Protected Super Admin Route Component
 * Prevents unauthorized access to routes requiring superadmin privileges
 * Only superadmins can access these routes
 */
export default function ProtectedSuperAdminRoute({ children }: ProtectedSuperAdminRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, token } = useAuthStore();
  const isHydrated = useHydrated();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const checkingRef = useRef(false);
  const lastUserEmailRef = useRef<string | undefined>(user?.email);
  const lastTokenRef = useRef<string | null>(token);
  const lastPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    // Wait for hydration to complete
    if (!isHydrated) {
      return;
    }

    // Prevent multiple simultaneous checks
    if (checkingRef.current) {
      return;
    }

    // Check if user email or token actually changed (not just hydration or pathname)
    const userEmailChanged = lastUserEmailRef.current !== user?.email;
    const tokenChanged = lastTokenRef.current !== token;
    const pathnameChanged = lastPathnameRef.current !== pathname;

    // If already authorized and only pathname changed (navigation), skip check
    if (isAuthorized && !userEmailChanged && !tokenChanged && pathnameChanged) {
      lastPathnameRef.current = pathname;
      setIsChecking(false);
      return;
    }

    // If already authorized and nothing changed, skip check
    if (isAuthorized && !userEmailChanged && !tokenChanged && !pathnameChanged) {
      setIsChecking(false);
      return;
    }

    // Update refs
    lastUserEmailRef.current = user?.email;
    lastTokenRef.current = token;
    lastPathnameRef.current = pathname;

    const checkAuth = async () => {
      checkingRef.current = true;
      setIsChecking(true);

      // Check authentication - also check token in sessionStorage as fallback
      const tokenFromStorage = typeof window !== 'undefined' ? TokenStorage.getToken() : null;
      const isAuth = isAuthenticated() || (tokenFromStorage && user);

      if (!isAuth) {
        logger.debug('Not authenticated, redirecting to login', { pathname });
        router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Check superadmin status
      try {
        if (user?.email) {
          const authToken = token || tokenFromStorage;

          if (!authToken) {
            logger.warn('No token available for superadmin check', {
              email: user.email,
            });
            router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
            return;
          }

          logger.debug('Checking superadmin status', {
            email: user.email,
            pathname,
            has_token: !!authToken,
            token_length: authToken?.length,
          });

          const status = await checkMySuperAdminStatus(authToken);

          logger.debug('Superadmin status check result', {
            email: user.email,
            is_superadmin: status.is_superadmin,
            status_full: status,
            pathname,
          });

          // Handle both response formats: { is_superadmin } or full response
          const isSuperAdmin = status.is_superadmin === true;
          setIsSuperAdmin(isSuperAdmin);

          if (!isSuperAdmin) {
            logger.warn('User is not superadmin, redirecting', {
              email: user.email,
              pathname,
              user_is_admin: user.is_admin,
              status_response: status,
            });
            router.replace('/dashboard?error=unauthorized_superadmin');
            return;
          }

          logger.info('User is superadmin, granting access', {
            email: user.email,
            pathname,
          });
        } else {
          // Fallback: check is_admin if email is not available
          // This is a temporary fallback - ideally all users should have email
          logger.warn('No email available, using is_admin fallback', {
            user_id: user?.id,
            is_admin: user?.is_admin,
            pathname,
          });

          if (!user?.is_admin) {
            logger.debug('User is not admin, redirecting', { pathname });
            router.replace('/dashboard?error=unauthorized_superadmin');
            return;
          }

          setIsSuperAdmin(true);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to check superadmin status');
        const statusCode = getErrorStatus(err);

        logger.error('Failed to check superadmin status', error, {
          email: user?.email,
          has_token: !!(token || tokenFromStorage),
          pathname,
          error_message: error.message,
          status_code: statusCode,
        });

        // Check if error is 401 (unauthorized) - token invalid/expired
        if (
          statusCode === 401 ||
          error.message.includes('expired') ||
          error.message.includes('refresh') ||
          error.message.includes('log in') ||
          error.message.includes('session')
        ) {
          logger.warn('Token expired or invalid during superadmin check, redirecting to login', {
            pathname,
            status_code: statusCode,
          });
          router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}&error=unauthorized`);
          return;
        }

        // Check if error is 403 (forbidden) - user is authenticated but not superadmin
        if (
          statusCode === 403 ||
          error.message.includes('permission') ||
          error.message.includes('forbidden')
        ) {
          logger.warn('User is authenticated but not superadmin, redirecting to dashboard', {
            email: user?.email,
            pathname,
            status_code: statusCode,
          });
          router.replace('/dashboard?error=unauthorized_superadmin');
          return;
        }

        // On other errors (network, 500, etc.), fallback to is_admin check (but log warning)
        logger.warn('Using is_admin fallback due to API error', {
          is_admin: user?.is_admin,
          pathname,
          status_code: statusCode,
          error_message: error.message,
        });

        if (!user?.is_admin) {
          router.replace('/dashboard?error=unauthorized_superadmin');
          return;
        }

        setIsSuperAdmin(true);
      }

      // Authorize access
      setIsAuthorized(true);
      setIsChecking(false);
      checkingRef.current = false;
    };

    // Check immediately
    checkAuth();
  }, [isHydrated, user?.email, token, isAuthorized, router]);

  // Show loader during verification
  if (isChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <div className="text-xl text-muted-foreground">Vérification des permissions...</div>
        </div>
      </div>
    );
  }

  // Show unauthorized message if not superadmin (should not reach here, but safety check)
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="max-w-md w-full">
          <div className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-error-900 dark:text-error-100 mb-1">
                  Accès Refusé
                </h4>
                <p className="text-sm text-error-800 dark:text-error-200">
                  Seuls les superadmins peuvent accéder à cette page.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
