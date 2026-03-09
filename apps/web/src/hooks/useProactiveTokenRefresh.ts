'use client';

import { useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { logger } from '@/lib/logger';

/**
 * How often to run the refresh check when the tab is visible (ms).
 * We only actually refresh when the user has been active within ACTIVE_WITHIN_MS.
 * Kept well below typical backend access token expiry (e.g. 120 min) so active users stay logged in.
 */
const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Consider user "active" if there was any activity in the last 40 minutes.
 * We only proactively refresh while active so we don't disconnect during use.
 */
const ACTIVE_WITHIN_MS = 40 * 60 * 1000; // 40 minutes

/**
 * If the user was idle longer than this and then interacts again, we refresh once
 * immediately so the next API call has a valid token (avoids 401 on first action after idle).
 */
const IDLE_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes

/** DOM events that count as user activity (used to avoid disconnecting while actively using the site). */
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
] as const;

/** Options for addEventListener for high-frequency events (passive = better scroll performance). */
const PASSIVE = { passive: true } as const;

/**
 * Proactive token refresh that only runs while the user is active.
 * - Refreshes the access token periodically (every 45 min) only when there was
 *   activity in the last 40 minutes, so you are not disconnected while using the site.
 * - When you return after being idle (e.g. >20 min), the first interaction triggers
 *   an immediate refresh so the next API call succeeds.
 * - When the tab becomes visible again, we refresh once.
 * Activity is determined by: mouse (move/click), keyboard, scroll, touch.
 */
export function useProactiveTokenRefresh() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityAtRef = useRef<number>(Date.now());

  const refreshIfVisible = useCallback(async () => {
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
      logger.debug('Proactive token refresh failed (will retry on next interval or on 401)', err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const runRefreshOnlyIfActive = () => {
      const now = Date.now();
      if (now - lastActivityAtRef.current <= ACTIVE_WITHIN_MS) {
        refreshIfVisible();
      }
    };

    const startInterval = () => {
      if (intervalRef.current) return;
      const token = TokenStorage.getToken();
      const refreshToken = TokenStorage.getRefreshToken();
      if (!token || !refreshToken) return;
      intervalRef.current = setInterval(runRefreshOnlyIfActive, REFRESH_INTERVAL_MS);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const onActivity = () => {
      const now = Date.now();
      const previous = lastActivityAtRef.current;
      lastActivityAtRef.current = now;
      // Return from idle: refresh once so next API call has a valid token
      if (previous && now - previous >= IDLE_THRESHOLD_MS) {
        refreshIfVisible();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastActivityAtRef.current = Date.now();
        startInterval();
        refreshIfVisible();
      } else {
        stopInterval();
      }
    };

    // Activity listeners: mouse, keyboard, scroll, touch (passive for scroll/touch for performance)
    ACTIVITY_EVENTS.forEach((event) => {
      const opts = event === 'scroll' || event === 'touchstart' || event === 'mousemove' ? PASSIVE : undefined;
      document.addEventListener(event, onActivity, opts);
    });
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (document.visibilityState === 'visible') {
      startInterval();
    }

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        const opts = event === 'scroll' || event === 'touchstart' || event === 'mousemove' ? PASSIVE : undefined;
        document.removeEventListener(event, onActivity, opts);
      });
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopInterval();
    };
  }, [refreshIfVisible]);
}
