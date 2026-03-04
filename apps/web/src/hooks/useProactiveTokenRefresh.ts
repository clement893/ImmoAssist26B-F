'use client';

import { useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { logger } from '@/lib/logger';

/**
 * Interval (ms) for proactive refresh when tab is visible.
 * Refresh before token expires (e.g. access token ~120 min) so user stays logged in while active.
 */
const REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes

/**
 * Proactive token refresh: when the user is "present" (tab visible), refresh the access token
 * periodically so the session does not expire while they are active.
 * Only runs in browser, when both access and refresh tokens exist.
 */
export function useProactiveTokenRefresh() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refreshIfVisible = async () => {
      if (document.visibilityState !== 'visible') return;
      const refreshToken = TokenStorage.getRefreshToken();
      if (!refreshToken) return;
      try {
        const res = await apiClient.post<{ access_token: string }>('/v1/auth/refresh', {
          refresh_token: refreshToken,
        });
        const access_token = res.data?.access_token;
        if (access_token) {
          await TokenStorage.setToken(access_token, refreshToken);
          logger.debug('Proactive token refresh succeeded');
        }
      } catch (err) {
        // Do not redirect or clear tokens; next 401 will trigger normal flow
        logger.debug('Proactive token refresh failed (will retry on next interval or on 401)', err);
      }
    };

    const startInterval = () => {
      if (intervalRef.current) return;
      const token = TokenStorage.getToken();
      const refreshToken = TokenStorage.getRefreshToken();
      if (!token || !refreshToken) return;
      intervalRef.current = setInterval(refreshIfVisible, REFRESH_INTERVAL_MS);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startInterval();
        refreshIfVisible(); // Refresh once when user comes back to tab
      } else {
        stopInterval();
      }
    };

    if (document.visibilityState === 'visible') {
      startInterval();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopInterval();
    };
  }, []);
}
