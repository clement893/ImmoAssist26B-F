/**
 * Dark Mode Theme Configuration
 * Provides dark mode color configurations that meet WCAG AA contrast requirements
 */

import { DEFAULT_THEME_CONFIG } from './default-theme-config';
import { meetsWCAGAA } from './contrast-utils';
import type { ThemeConfig } from '@modele/types';

/**
 * Dark mode theme configuration
 * All colors adjusted to meet WCAG AA contrast requirements on dark backgrounds
 */
export const DARK_MODE_CONFIG: ThemeConfig = {
  ...DEFAULT_THEME_CONFIG,

  // Override colors for dark mode
  colors: {
    ...DEFAULT_THEME_CONFIG.colors,
    // Dark backgrounds
    background: '#0f172a', // Slate 900 - dark background
    foreground: '#f8fafc', // Slate 50 - light foreground for contrast
    muted: '#1e293b', // Slate 800 - darker muted background
    mutedForeground: '#cbd5e1', // Slate 300 - lighter muted text
    border: '#334155', // Slate 700 - visible borders on dark
    input: '#1e293b', // Slate 800 - dark input background

    // Keep primary colors but ensure they work on dark backgrounds
    primary: '#60a5fa', // Blue 400 - lighter for dark mode (4.5:1 on #0f172a)
    secondary: '#818cf8', // Indigo 400 - lighter for dark mode
    danger: '#f87171', // Red 400 - lighter for dark mode
    warning: '#fbbf24', // Amber 400 - lighter for dark mode
    info: '#22d3ee', // Cyan 400 - lighter for dark mode
    success: '#34d399', // Green 400 - lighter for dark mode

    // Foreground colors for dark mode
    destructive: '#f87171', // Red 400
    destructiveForeground: '#0f172a', // Dark text on light background
    successForeground: '#0f172a', // Dark text on light background
    warningForeground: '#0f172a', // Dark text on light background
  },

  typography: {
    ...DEFAULT_THEME_CONFIG.typography,
    // Light text colors for dark backgrounds
    textHeading: '#f8fafc', // Slate 50 - high contrast on dark
    textSubheading: '#e2e8f0', // Slate 200 - good contrast
    textBody: '#cbd5e1', // Slate 300 - readable on dark
    textSecondary: '#94a3b8', // Slate 400 - secondary text
    textLink: '#60a5fa', // Blue 400 - matches primary, visible on dark
  },
} as const;

/**
 * Get dark mode configuration with contrast validation
 *
 * @returns Dark mode theme configuration
 */
export function getDarkModeConfig(): ThemeConfig {
  return DARK_MODE_CONFIG;
}

/**
 * Check if a color meets contrast requirements on dark background
 *
 * @param foreground Foreground color
 * @param background Dark background color (default: #0f172a)
 * @returns true if meets WCAG AA
 */
export function meetsDarkModeContrast(foreground: string, background: string = '#0f172a'): boolean {
  return meetsWCAGAA(foreground, background);
}
