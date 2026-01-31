import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveThemeToCache,
  getThemeFromCache,
  clearThemeCache,
  hasValidThemeCache,
  getCacheAge,
} from '../theme-cache';
import type { ThemeConfig } from '@modele/types';

describe('theme-cache', () => {
  const mockThemeConfig: ThemeConfig = {
    primary_color: '#2563eb',
    secondary_color: '#6366f1',
    colors: {
      primary: '#2563eb',
      background: '#ffffff',
    },
  } as ThemeConfig;

  beforeEach(() => {
    // Clear cache before each test
    clearThemeCache();

    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      };
    })();

    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  describe('saveThemeToCache', () => {
    it('saves theme config to localStorage', () => {
      saveThemeToCache(mockThemeConfig);

      const cached = localStorage.getItem('modele_theme_cache');
      expect(cached).toBeTruthy();

      const parsed = JSON.parse(cached!);
      expect(parsed.config).toEqual(mockThemeConfig);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.timestamp).toBeGreaterThan(0);
    });

    it('saves theme with ID', () => {
      saveThemeToCache(mockThemeConfig, 123);

      const cached = localStorage.getItem('modele_theme_cache');
      const parsed = JSON.parse(cached!);
      expect(parsed.themeId).toBe(123);
    });

    it('handles localStorage errors gracefully', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Quota exceeded');
      });

      // Should not throw
      expect(() => saveThemeToCache(mockThemeConfig)).not.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('does nothing in SSR', () => {
      const originalWindow = global.window;
      (global as any).window = undefined;

      saveThemeToCache(mockThemeConfig);
      // Should not throw

      global.window = originalWindow;
    });
  });

  describe('getThemeFromCache', () => {
    it('retrieves cached theme config', () => {
      saveThemeToCache(mockThemeConfig);

      const cached = getThemeFromCache();
      expect(cached).toEqual(mockThemeConfig);
    });

    it('returns null if cache does not exist', () => {
      const cached = getThemeFromCache();
      expect(cached).toBeNull();
    });

    it('returns null if cache is expired', () => {
      // Save with old timestamp
      const oldCache = {
        version: '1.0.0',
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        config: mockThemeConfig,
      };
      localStorage.setItem('modele_theme_cache', JSON.stringify(oldCache));

      const cached = getThemeFromCache();
      expect(cached).toBeNull();
    });

    it('returns null if version mismatch', () => {
      const oldCache = {
        version: '0.9.0', // Old version
        timestamp: Date.now(),
        config: mockThemeConfig,
      };
      localStorage.setItem('modele_theme_cache', JSON.stringify(oldCache));

      const cached = getThemeFromCache();
      expect(cached).toBeNull();
    });

    it('returns null if theme ID does not match', () => {
      saveThemeToCache(mockThemeConfig, 123);

      const cached = getThemeFromCache(456);
      expect(cached).toBeNull();
    });

    it('returns cached theme if theme ID matches', () => {
      saveThemeToCache(mockThemeConfig, 123);

      const cached = getThemeFromCache(123);
      expect(cached).toEqual(mockThemeConfig);
    });

    it('handles corrupted cache gracefully', () => {
      localStorage.setItem('modele_theme_cache', 'invalid json');

      const cached = getThemeFromCache();
      expect(cached).toBeNull();
    });

    it('returns null in SSR', () => {
      const originalWindow = global.window;
      (global as any).window = undefined;

      const cached = getThemeFromCache();
      expect(cached).toBeNull();

      global.window = originalWindow;
    });
  });

  describe('clearThemeCache', () => {
    it('removes cache from localStorage', () => {
      saveThemeToCache(mockThemeConfig);
      expect(hasValidThemeCache()).toBe(true);

      clearThemeCache();
      expect(hasValidThemeCache()).toBe(false);
    });

    it('does nothing if cache does not exist', () => {
      expect(() => clearThemeCache()).not.toThrow();
    });

    it('handles errors gracefully', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => clearThemeCache()).not.toThrow();

      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('hasValidThemeCache', () => {
    it('returns true if valid cache exists', () => {
      saveThemeToCache(mockThemeConfig);
      expect(hasValidThemeCache()).toBe(true);
    });

    it('returns false if no cache', () => {
      expect(hasValidThemeCache()).toBe(false);
    });

    it('returns false if cache is expired', () => {
      const oldCache = {
        version: '1.0.0',
        timestamp: Date.now() - 10 * 60 * 1000,
        config: mockThemeConfig,
      };
      localStorage.setItem('modele_theme_cache', JSON.stringify(oldCache));

      expect(hasValidThemeCache()).toBe(false);
    });

    it('checks theme ID match if provided', () => {
      saveThemeToCache(mockThemeConfig, 123);
      expect(hasValidThemeCache(123)).toBe(true);
      expect(hasValidThemeCache(456)).toBe(false);
    });
  });

  describe('getCacheAge', () => {
    it('returns cache age in milliseconds', () => {
      const before = Date.now();
      saveThemeToCache(mockThemeConfig);
      const after = Date.now();

      const age = getCacheAge();
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThanOrEqual(after - before + 100); // Allow some margin
    });

    it('returns null if no cache', () => {
      expect(getCacheAge()).toBeNull();
    });

    it('handles corrupted cache gracefully', () => {
      localStorage.setItem('modele_theme_cache', 'invalid json');
      expect(getCacheAge()).toBeNull();
    });
  });
});
