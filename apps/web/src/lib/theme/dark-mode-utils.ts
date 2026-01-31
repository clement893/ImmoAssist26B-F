/**
 * Dark Mode Utilities
 * Functions to detect and apply dark mode
 */

import { DARK_MODE_CONFIG } from './dark-mode-config';
import { DEFAULT_THEME_CONFIG } from './default-theme-config';
import type { ThemeConfig, ThemeConfigAccessor } from '@modele/types';

/**
 * Detect system dark mode preference
 *
 * @returns true if system prefers dark mode
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') {
    return false; // SSR, default to light
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get theme mode from config or system preference
 *
 * @param config Theme configuration
 * @returns 'light' | 'dark' | 'system'
 */
export function getThemeMode(config: ThemeConfig): 'light' | 'dark' | 'system' {
  const mode = config.mode || 'system';

  if (mode === 'system') {
    return prefersDarkMode() ? 'dark' : 'light';
  }

  return mode as 'light' | 'dark';
}

/**
 * Base colors that should be protected in dark mode (use DARK_MODE_CONFIG defaults)
 * These colors are essential for dark mode readability and should not be overridden
 * by backend config unless explicitly provided in darkMode.colors
 */
const BASE_COLORS = [
  'background',
  'foreground',
  'muted',
  'mutedForeground',
  'border',
  'input',
  'ring',
] as const;

/**
 * Theme colors that can always be customized from backend (even in dark mode)
 * These are brand/theme colors that can be personalized
 */
const THEME_COLORS = [
  'primary',
  'secondary',
  'danger',
  'warning',
  'info',
  'success',
  'destructive',
  'destructiveForeground',
  'successForeground',
  'warningForeground',
] as const;

/**
 * Get appropriate theme config based on mode
 *
 * In dark mode:
 * - Base colors (background, foreground, muted, etc.) are protected and use DARK_MODE_CONFIG defaults
 * - Base colors can only be overridden if config.darkMode?.colors exists (for future backend extension)
 * - Theme colors (primary, secondary, etc.) can always be customized from backend
 *
 * @param config Theme configuration
 * @returns Theme config for current mode
 */
export function getThemeConfigForMode(config: ThemeConfig): ThemeConfig {
  const mode = getThemeMode(config);

  if (mode === 'dark') {
    const configAccessor = config as ThemeConfigAccessor;
    const configColors = configAccessor.colors;
    const configTypography = config.typography;
    const darkColors = DARK_MODE_CONFIG.colors as Record<string, unknown> | undefined;
    const darkTypography = DARK_MODE_CONFIG.typography as Record<string, unknown> | undefined;

    // Check if backend has explicit dark mode colors (for future extension)
    const darkModeColors = (config as { darkMode?: { colors?: Record<string, unknown> } }).darkMode
      ?.colors;
    const hasExplicitDarkMode =
      darkModeColors && typeof darkModeColors === 'object' && !Array.isArray(darkModeColors);

    // Start with dark mode defaults
    const mergedColors: Record<string, unknown> = darkColors ? { ...darkColors } : {};

    // Apply base colors:
    // - If backend has explicit darkMode.colors, use those for base colors
    // - Otherwise, protect base colors (keep DARK_MODE_CONFIG defaults)
    if (hasExplicitDarkMode) {
      // Backend has explicit dark mode config - allow base color customization
      BASE_COLORS.forEach((colorKey) => {
        if (darkModeColors[colorKey] !== undefined) {
          mergedColors[colorKey] = darkModeColors[colorKey];
        }
      });
    }
    // If no explicit darkMode.colors, base colors remain from DARK_MODE_CONFIG (already set above)

    // Always allow theme color customization from backend (even in dark mode)
    if (configColors && typeof configColors === 'object' && !Array.isArray(configColors)) {
      THEME_COLORS.forEach((colorKey) => {
        if (configColors[colorKey] !== undefined) {
          mergedColors[colorKey] = configColors[colorKey];
        }
      });

      // Also allow any other colors that are not base colors (for extensibility)
      Object.keys(configColors).forEach((colorKey) => {
        if (
          !(BASE_COLORS as readonly string[]).includes(colorKey) &&
          !(THEME_COLORS as readonly string[]).includes(colorKey)
        ) {
          mergedColors[colorKey] = configColors[colorKey];
        }
      });
    }

    // Typography: merge dark mode defaults with backend config
    const mergedTypography =
      configTypography &&
      typeof configTypography === 'object' &&
      !Array.isArray(configTypography) &&
      darkTypography &&
      typeof darkTypography === 'object'
        ? { ...darkTypography, ...configTypography }
        : darkTypography || {};

    return {
      ...config,
      colors: mergedColors,
      typography: mergedTypography,
    } as ThemeConfig;
  }

  // Light mode - use default or provided config
  const configAccessor = config as ThemeConfigAccessor;
  const configColors = configAccessor.colors;
  const configTypography = config.typography;
  const defaultColors = DEFAULT_THEME_CONFIG.colors as Record<string, unknown> | undefined;
  const defaultTypography = DEFAULT_THEME_CONFIG.typography as Record<string, unknown> | undefined;
  const mergedColors =
    configColors &&
    typeof configColors === 'object' &&
    !Array.isArray(configColors) &&
    defaultColors &&
    typeof defaultColors === 'object'
      ? { ...defaultColors, ...configColors }
      : defaultColors || {};
  const mergedTypography =
    configTypography &&
    typeof configTypography === 'object' &&
    !Array.isArray(configTypography) &&
    defaultTypography &&
    typeof defaultTypography === 'object'
      ? { ...defaultTypography, ...configTypography }
      : defaultTypography || {};
  return {
    ...DEFAULT_THEME_CONFIG,
    ...config,
    colors: mergedColors,
    typography: mergedTypography,
  } as ThemeConfig;
}

/**
 * Apply dark mode class to document root
 *
 * @param isDark Whether to apply dark mode
 */
export function applyDarkModeClass(isDark: boolean): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Listen to system dark mode preference changes
 *
 * @param callback Callback function when preference changes
 * @returns Cleanup function
 */
export function watchDarkModePreference(callback: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // SSR, return no-op cleanup
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    callback(e.matches);
  };

  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }

  // Legacy browsers
  if (mediaQuery.addListener) {
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }

  return () => {};
}
