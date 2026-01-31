/**
 * Theme Hooks
 * Custom hooks for theme management
 *
 * NOTE: Theme colors are now managed by GlobalThemeProvider which uses API theme as single source of truth.
 * This hook is kept for backward compatibility but no longer manages its own localStorage.
 * All theme colors come from the API via GlobalThemeProvider.
 */

import { useState, useEffect } from 'react';
import type { ThemeConfig } from './types';
import { defaultTheme } from './presets';
import { logger } from '@/lib/logger';

export type { ThemeConfig };

/**
 * Hook to manage theme state
 *
 * DEPRECATED: Theme is now managed by GlobalThemeProvider using API as single source of truth.
 * This hook is kept for backward compatibility but is a no-op.
 * Use useGlobalTheme() from '@/lib/theme/global-theme-provider' for theme access.
 */
export function useThemeManager() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Theme is now managed by GlobalThemeProvider - no local state needed
  }, []);

  const updateColor = (_key: keyof ThemeConfig, _value: string) => {
    // No-op: Theme colors are managed by API via GlobalThemeProvider
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        'useThemeManager.updateColor is deprecated. Theme is managed by API via GlobalThemeProvider.'
      );
    }
  };

  const resetTheme = () => {
    // No-op: Theme reset should be done via API
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        'useThemeManager.resetTheme is deprecated. Theme is managed by API via GlobalThemeProvider.'
      );
    }
  };

  const updateTheme = (_newTheme: Partial<ThemeConfig>) => {
    // No-op: Theme updates should be done via API
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        'useThemeManager.updateTheme is deprecated. Theme is managed by API via GlobalThemeProvider.'
      );
    }
  };

  return {
    theme: defaultTheme, // Return default for backward compatibility
    setTheme: () => {
      if (process.env.NODE_ENV === 'development') {
        logger.warn(
          'useThemeManager.setTheme is deprecated. Theme is managed by API via GlobalThemeProvider.'
        );
      }
    },
    updateTheme,
    updateColor,
    resetTheme,
    mounted,
  };
}
