/**
 * Theme Helper Utilities
 *
 * Utility functions for working with theme colors and configurations.
 * Provides type-safe access to theme colors and helpers for component styling.
 */

import { useGlobalTheme } from './global-theme-provider';
import type { ThemeConfig } from '@modele/types';

/**
 * Get a CSS variable value from the theme
 *
 * @param variableName - Name of the CSS variable (e.g., 'color-primary-500')
 * @param fallback - Fallback value if variable is not set
 * @returns CSS variable string
 */
export function getThemeVar(variableName: string, fallback?: string): string {
  if (typeof document === 'undefined') {
    return fallback || '';
  }

  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(`--${variableName}`).trim();

  return value || fallback || '';
}

/**
 * Get a theme color value
 *
 * @param colorName - Name of the color (e.g., 'primary-500', 'error-600')
 * @param fallback - Fallback color if not found
 * @returns Color value
 */
export function getThemeColor(colorName: string, fallback?: string): string {
  return getThemeVar(`color-${colorName}`, fallback || '#000000');
}

/**
 * Get theme color shades (50-950)
 *
 * @param baseColorName - Base color name (e.g., 'primary', 'error')
 * @returns Object with shade values
 */
export function getThemeColorShades(baseColorName: string): Record<string, string> {
  const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
  const result: Record<string, string> = {};

  shades.forEach((shade) => {
    result[shade] = getThemeColor(`${baseColorName}-${shade}`);
  });

  return result;
}

/**
 * Hook to get theme colors
 *
 * @returns Theme color helper functions
 */
export function useThemeColors() {
  // Note: useGlobalTheme() is called to ensure theme context is available
  // but we don't need to destructure theme directly here
  useGlobalTheme();

  return {
    /**
     * Get a theme color value
     */
    getColor: (colorName: string, fallback?: string) => {
      return getThemeColor(colorName, fallback);
    },

    /**
     * Get theme color shades
     */
    getShades: (baseColorName: string) => {
      return getThemeColorShades(baseColorName);
    },

    /**
     * Get CSS variable value
     */
    getVar: (variableName: string, fallback?: string) => {
      return getThemeVar(variableName, fallback);
    },

    /**
     * Get primary color
     */
    primary: getThemeColorShades('primary'),

    /**
     * Get secondary color
     */
    secondary: getThemeColorShades('secondary'),

    /**
     * Get error color
     */
    error: getThemeColorShades('error'),

    /**
     * Get warning color
     */
    warning: getThemeColorShades('warning'),

    /**
     * Get success color
     */
    success: getThemeColorShades('success'),

    /**
     * Get info color
     */
    info: getThemeColorShades('info'),

    /**
     * Base colors
     */
    background: getThemeColor('background', '#ffffff'),
    foreground: getThemeColor('foreground', '#000000'),
    muted: getThemeColor('muted', '#f3f4f6'),
    mutedForeground: getThemeColor('muted-foreground', '#6b7280'),
    border: getThemeColor('border', '#e5e7eb'),
    input: getThemeColor('input', '#ffffff'),
    ring: getThemeColor('ring', '#3b82f6'),
  };
}

/**
 * Convert a color value to CSS variable format
 *
 * @param colorName - Color name (e.g., 'primary-500')
 * @returns CSS variable string
 */
export function toThemeVar(colorName: string): string {
  return `var(--color-${colorName})`;
}

/**
 * Get theme spacing value
 *
 * @param size - Spacing size (e.g., 'sm', 'md', 'lg')
 * @param fallback - Fallback value
 * @returns Spacing value
 */
export function getThemeSpacing(size: string, fallback?: string): string {
  return getThemeVar(`spacing-${size}`, fallback || '1rem');
}

/**
 * Get theme border radius value
 *
 * @param size - Border radius size (e.g., 'sm', 'md', 'lg')
 * @param fallback - Fallback value
 * @returns Border radius value
 */
export function getThemeBorderRadius(size: string = 'DEFAULT', fallback?: string): string {
  const varName = size === 'DEFAULT' ? 'border-radius' : `border-radius-${size}`;
  return getThemeVar(varName, fallback || '0.5rem');
}

/**
 * Get theme font family
 *
 * @param type - Font type ('sans', 'heading', 'subheading')
 * @param fallback - Fallback font
 * @returns Font family string
 */
export function getThemeFontFamily(
  type: 'sans' | 'heading' | 'subheading' = 'sans',
  fallback?: string
): string {
  const varName = type === 'sans' ? 'font-family' : `font-family-${type}`;
  return getThemeVar(varName, fallback || 'system-ui, sans-serif');
}

/**
 * Check if dark mode is active
 *
 * @returns True if dark mode is active
 */
export function isDarkMode(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  return document.documentElement.classList.contains('dark');
}

/**
 * Get theme config for current mode
 *
 * @param config - Theme configuration
 * @returns Config for current mode (light/dark)
 */
export function getThemeConfigForCurrentMode(config: ThemeConfig): ThemeConfig {
  const mode = isDarkMode() ? 'dark' : 'light';

  // Return config appropriate for current mode
  // This is a simplified version - actual implementation might be more complex
  return {
    ...config,
    mode: mode as 'light' | 'dark' | 'system',
  };
}
