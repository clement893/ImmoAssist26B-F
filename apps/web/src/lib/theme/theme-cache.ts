/**
 * Theme Cache Utilities
 * Functions to cache theme configurations in localStorage for performance
 */

import type { ThemeConfig } from '@modele/types';
import { logger } from '@/lib/logger';

const THEME_CACHE_KEY = 'modele_theme_cache';
const THEME_CACHE_VERSION = '1.0.0';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedTheme {
  version: string;
  timestamp: number;
  config: ThemeConfig;
  themeId?: number;
}

/**
 * Save theme configuration to localStorage cache
 *
 * @param config Theme configuration to cache
 * @param themeId Optional theme ID for identification
 */
export function saveThemeToCache(config: ThemeConfig, themeId?: number): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return; // SSR or localStorage not available
  }

  try {
    const cached: CachedTheme = {
      version: THEME_CACHE_VERSION,
      timestamp: Date.now(),
      config,
      themeId,
    };

    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(cached));
  } catch (error: unknown) {
    // Silently fail if localStorage is full or unavailable
    logger.warn('[Theme Cache] Failed to save theme to cache', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

/**
 * Get theme configuration from localStorage cache
 *
 * @param themeId Optional theme ID to match cached theme
 * @returns Cached theme config or null if not found/expired
 */
export function getThemeFromCache(themeId?: number): ThemeConfig | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null; // SSR or localStorage not available
  }

  try {
    const cachedStr = localStorage.getItem(THEME_CACHE_KEY);
    if (!cachedStr) {
      return null;
    }

    const cached: CachedTheme = JSON.parse(cachedStr);

    // Check version compatibility
    if (cached.version !== THEME_CACHE_VERSION) {
      clearThemeCache();
      return null;
    }

    // Check expiry
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_EXPIRY_MS) {
      clearThemeCache();
      return null;
    }

    // Check theme ID match if provided
    if (themeId !== undefined && cached.themeId !== themeId) {
      return null;
    }

    return cached.config;
  } catch (error) {
    // Silently fail if cache is corrupted
    logger.warn('[Theme Cache] Failed to read theme from cache', { error });
    clearThemeCache();
    return null;
  }
}

/**
 * Clear theme cache from localStorage
 */
export function clearThemeCache(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return; // SSR or localStorage not available
  }

  try {
    localStorage.removeItem(THEME_CACHE_KEY);
  } catch (error) {
    logger.warn('[Theme Cache] Failed to clear theme cache', { error });
  }
}

/**
 * Check if theme cache exists and is valid
 *
 * @param themeId Optional theme ID to match
 * @returns true if valid cache exists
 */
export function hasValidThemeCache(themeId?: number): boolean {
  return getThemeFromCache(themeId) !== null;
}

/**
 * Get cache age in milliseconds
 *
 * @returns Cache age in ms or null if no cache
 */
export function getCacheAge(): number | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const cachedStr = localStorage.getItem(THEME_CACHE_KEY);
    if (!cachedStr) {
      return null;
    }

    const cached: CachedTheme = JSON.parse(cachedStr);
    return Date.now() - cached.timestamp;
  } catch {
    return null;
  }
}
