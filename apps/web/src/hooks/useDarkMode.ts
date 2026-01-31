/**
 * Simple Dark Mode Hook
 * Dark mode is ONLY activated manually via toggle - NO automatic system preference
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

type ThemeMode = 'light' | 'dark';

/**
 * Get current theme mode from localStorage (user preference)
 * Defaults to 'light' - NO automatic system preference
 */
function getThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  // Only accept 'dark' or 'light', default to 'light'
  return stored === 'dark' || stored === 'light' ? stored : 'light';
}

/**
 * Apply theme class to DOM
 */
function applyThemeClass(isDark: boolean) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(isDark ? 'dark' : 'light');
}

/**
 * Simple Dark Mode Hook
 *
 * Dark mode is ONLY activated manually via toggle - NO automatic system preference.
 * Defaults to 'light' mode.
 *
 * @returns { isDark: boolean, toggle: () => void, setMode: (mode: ThemeMode) => void, mode: ThemeMode }
 *
 * @example
 * ```tsx
 * const { isDark, toggle } = useDarkMode();
 *
 * return (
 *   <button onClick={toggle}>
 *     {isDark ? '☀️ Light' : '🌙 Dark'}
 *   </button>
 * );
 * ```
 */
export function useDarkMode() {
  // Read current state from DOM (defaults to light if not set)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Check localStorage first, then DOM
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    // Default to light if not set
    return document.documentElement.classList.contains('dark');
  });

  // Get mode from localStorage (defaults to 'light')
  const [mode, setModeState] = useState<ThemeMode>(() => getThemeMode());

  // Initialize on mount - apply stored preference or default to light
  useEffect(() => {
    const stored = getThemeMode();
    const shouldBeDark = stored === 'dark';
    if (document.documentElement.classList.contains('dark') !== shouldBeDark) {
      applyThemeClass(shouldBeDark);
      setIsDark(shouldBeDark);
    }
  }, []);

  // Sync with DOM changes (e.g., from external changes)
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const current = root.classList.contains('dark');
      if (current !== isDark) {
        setIsDark(current);
      }
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [isDark]);

  // NO automatic system preference - dark mode is ONLY manual

  const toggle = useCallback(() => {
    const newIsDark = !isDark;
    applyThemeClass(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    setModeState(newIsDark ? 'dark' : 'light');
    setIsDark(newIsDark);
  }, [isDark]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('theme', newMode);
    const isDarkMode = newMode === 'dark';
    applyThemeClass(isDarkMode);
    setIsDark(isDarkMode);
  }, []);

  return {
    isDark,
    toggle,
    setMode,
    mode,
  };
}
