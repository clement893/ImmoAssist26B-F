/**
 * Locale Sync Component
 *
 * Syncs user's language preference from database with Next.js locale routing.
 * Redirects to the preferred locale if it differs from the current URL locale.
 */
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { apiClient } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useHydrated } from '@/hooks/useHydrated';
import type { Locale } from '@/i18n/routing';

interface LocaleSyncProps {
  children: React.ReactNode;
}

const SYNC_KEY = 'locale_sync_checked';
const SYNC_TIMEOUT = 10000; // 10 seconds - prevent infinite loops

/**
 * LocaleSync - Syncs user language preference with URL locale
 *
 * This component:
 * 1. Checks if user is authenticated
 * 2. Loads user preferences from database
 * 3. Compares preference language with current URL locale
 * 4. Redirects to preferred locale if different
 *
 * Should be placed in the layout to run on every page load.
 */
export function LocaleSync({ children }: LocaleSyncProps) {
  const pathname = usePathname(); // This returns pathname WITHOUT locale prefix (next-intl behavior)
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const { user, token } = useAuthStore();
  const isHydrated = useHydrated();

  const hasCheckedRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);
  const lastUserRef = useRef(user);
  const lastTokenRef = useRef(token);
  const lastPathnameRef = useRef<string>(pathname);

  useEffect(() => {
    // Wait for hydration to complete before syncing locale
    if (!isHydrated) {
      return;
    }

    const syncLocale = async () => {
      // Skip if not authenticated
      const isAuth = !!(user && token);
      if (!isAuth) {
        // Clear sync flag when user logs out
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(SYNC_KEY);
        }
        hasCheckedRef.current = null;
        isProcessingRef.current = false;
        return;
      }

      // Skip if already processing
      if (isProcessingRef.current) {
        return;
      }

      // Check if user, token, or pathname actually changed (not just hydration)
      const userChanged = lastUserRef.current !== user;
      const tokenChanged = lastTokenRef.current !== token;
      const pathnameChanged = lastPathnameRef.current !== pathname;

      // Update refs
      lastUserRef.current = user;
      lastTokenRef.current = token;
      if (pathnameChanged) {
        lastPathnameRef.current = pathname;
      }

      // Get actual URL pathname (includes locale prefix)
      const actualPathname =
        typeof window !== 'undefined' ? window.location.pathname : pathname;

      // Skip if on auth pages (login, register, callback) to avoid unnecessary API calls
      if (
        actualPathname.includes('/auth/login') ||
        actualPathname.includes('/auth/register') ||
        actualPathname.includes('/auth/callback')
      ) {
        return;
      }

      // Skip if we've already checked this exact combination in this render cycle
      const checkKey = `${currentLocale}_${actualPathname}`;
      if (
        hasCheckedRef.current === checkKey &&
        !userChanged &&
        !tokenChanged &&
        !pathnameChanged
      ) {
        return;
      }

      // Check sessionStorage to prevent infinite loops - use a more specific key
      const syncKey = `${SYNC_KEY}_${currentLocale}_${actualPathname}`;
      const lastSync =
        typeof window !== 'undefined' ? sessionStorage.getItem(syncKey) : null;
      const now = Date.now();

      if (lastSync) {
        const timeSinceLastSync = now - parseInt(lastSync, 10);
        // If we checked this locale/path combination recently, skip to prevent infinite loops
        if (timeSinceLastSync < SYNC_TIMEOUT) {
          return;
        }
      }

      isProcessingRef.current = true;
      hasCheckedRef.current = checkKey;

      try {
        // Fetch user preferences
        type UserPreferences = Record<
          string,
          string | number | boolean | object | null | undefined
        >;
        const response = await apiClient.get<UserPreferences>('/v1/users/preferences');
        const { extractApiData } = await import('@/lib/api/utils');
        const data = extractApiData<UserPreferences>(
          response as unknown as
            | UserPreferences
            | import('@modele/types').ApiResponse<UserPreferences>
        );

        if (data && typeof data === 'object') {
          // Get language preference (could be 'language' or 'locale')
          const preferredLanguage = (data.language || data.locale) as Locale | undefined;

          // First check: if locale already matches preference, clear any sync flags and exit
          if (preferredLanguage === currentLocale) {
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem(syncKey);
            }
            isProcessingRef.current = false;
            return;
          }

          // Only redirect if preference exists, is valid, and differs from current locale
          if (
            preferredLanguage &&
            preferredLanguage !== currentLocale &&
            ['en', 'fr', 'ar', 'he'].includes(preferredLanguage)
          ) {
            // Get path without locale prefix
            const pathWithoutLocale = actualPathname.replace(/^\/(en|fr|ar|he)(\/|$)/, '/') || '/';
            const cleanPath =
              pathWithoutLocale === '/' ? '/' : pathWithoutLocale.replace(/\/$/, '') || '/';

            // Build new path with preferred locale
            const newPath =
              preferredLanguage === 'en'
                ? cleanPath
                : `/${preferredLanguage}${cleanPath === '/' ? '' : cleanPath}`;

            // Only redirect if path is actually different
            if (newPath !== actualPathname) {
              // Mark that we've checked this locale/path combination to prevent infinite loops
              if (typeof window !== 'undefined') {
                sessionStorage.setItem(syncKey, now.toString());
              }

              logger.info(`Locale mismatch detected, redirecting to preferred locale`, {
                currentLocale,
                preferredLanguage,
                currentPath: actualPathname,
                newPath,
              });

              // Use router.replace instead of window.location.href to avoid polluting history
              // This prevents the "back" button from returning to the same page
              router.replace(newPath);
              return;
            }
          }
        }
      } catch (error) {
        // Silently fail - don't block page load if preferences can't be loaded
        logger.debug('Could not load preferences for locale sync:', error);
      } finally {
        // Reset processing flag after a delay to allow redirect to happen
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 100);
      }
    };

    syncLocale();
  }, [isHydrated, currentLocale, pathname, user, token, router]);

  // Show children immediately - don't block rendering
  return <>{children}</>;
}
