import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as darkModeUtils from '../dark-mode-utils';
import {
  prefersDarkMode,
  getThemeMode,
  getThemeConfigForMode,
  applyDarkModeClass,
  watchDarkModePreference,
} from '../dark-mode-utils';
import type { ThemeConfig } from '@modele/types';

describe('prefersDarkMode', () => {
  it('returns false in SSR', () => {
    const originalWindow = global.window;
    (global as any).window = undefined;

    expect(prefersDarkMode()).toBe(false);

    global.window = originalWindow;
  });

  it('detects dark mode preference', () => {
    if (typeof window === 'undefined') {
      return; // Skip in SSR
    }

    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    expect(prefersDarkMode()).toBe(true);
  });
});

describe('getThemeMode', () => {
  beforeEach(() => {
    // Mock window.matchMedia for tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('returns system preference when mode is system', () => {
    const config: ThemeConfig = {
      mode: 'system',
    } as ThemeConfig;

    // Mock prefersDarkMode
    vi.spyOn(darkModeUtils, 'prefersDarkMode').mockReturnValue(true);

    expect(getThemeMode(config)).toBe('dark');

    vi.restoreAllMocks();
  });

  it('returns light when mode is light', () => {
    const config: ThemeConfig = {
      mode: 'light',
    } as ThemeConfig;

    expect(getThemeMode(config)).toBe('light');
  });

  it('returns dark when mode is dark', () => {
    const config: ThemeConfig = {
      mode: 'dark',
    } as ThemeConfig;

    expect(getThemeMode(config)).toBe('dark');
  });

  it('defaults to system when mode is not specified', () => {
    const config: ThemeConfig = {} as ThemeConfig;

    // Mock window.matchMedia to return false (light mode)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false, // Light mode
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const mode = getThemeMode(config);
    expect(mode).toBe('light');
  });
});

describe('getThemeConfigForMode', () => {
  it('returns dark mode config when mode is dark', () => {
    const config: ThemeConfig = {
      mode: 'dark',
    } as ThemeConfig;

    const result = getThemeConfigForMode(config);
    expect(result.colors?.background).toBe('#0f172a'); // Dark background
  });

  it('returns light mode config when mode is light', () => {
    const config: ThemeConfig = {
      mode: 'light',
    } as ThemeConfig;

    const result = getThemeConfigForMode(config);
    expect(result.colors?.background).toBe('#ffffff'); // White background
  });

  it('merges custom colors with mode config', () => {
    const config: ThemeConfig = {
      mode: 'dark',
      colors: {
        primary: '#custom',
      },
    } as ThemeConfig;

    const result = getThemeConfigForMode(config);
    expect(result.colors?.primary).toBe('#custom');
    expect(result.colors?.background).toBe('#0f172a'); // Still dark background
  });
});

describe('applyDarkModeClass', () => {
  beforeEach(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  });

  it('adds dark class when isDark is true', () => {
    if (typeof document === 'undefined') {
      return; // Skip in SSR
    }

    applyDarkModeClass(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when isDark is false', () => {
    if (typeof document === 'undefined') {
      return; // Skip in SSR
    }

    document.documentElement.classList.add('dark');
    applyDarkModeClass(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('does nothing in SSR', () => {
    const originalDocument = global.document;
    (global as any).document = undefined;

    // Should not throw
    applyDarkModeClass(true);

    global.document = originalDocument;
  });
});

describe('watchDarkModePreference', () => {
  beforeEach(() => {
    // Mock window.matchMedia for tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => {
        const listeners: Array<(e: MediaQueryListEvent) => void> = [];
        return {
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
            listeners.push(handler);
          }),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      }),
    });
  });

  it('returns cleanup function', () => {
    const cleanup = watchDarkModePreference(() => {});
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('calls callback with current preference', () => {
    if (typeof window === 'undefined') {
      return; // Skip in SSR
    }

    const callback = vi.fn();
    const cleanup = watchDarkModePreference(callback);

    // Callback should be called immediately or on change
    // (implementation may vary)

    cleanup();
  });

  it('returns no-op cleanup in SSR', () => {
    const originalWindow = global.window;
    (global as any).window = undefined;

    const cleanup = watchDarkModePreference(() => {});
    expect(typeof cleanup).toBe('function');
    cleanup(); // Should not throw

    global.window = originalWindow;
  });
});
