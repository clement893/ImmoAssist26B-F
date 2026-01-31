/**
 * Theme Utilities
 * Helper functions for theme management
 */

import type { ThemeConfig } from './types';
import { logger } from '@/lib/logger';

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : null;
}

/**
 * Convert hex color to RGB string for CSS
 */
export function hexToRgbString(hex: string): string | null {
  const rgb = hexToRgb(hex);
  return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : null;
}

/**
 * Generate color shades (50-900) from a base color
 */
export function generateColorShades(hex: string, baseName: string): void {
  const root = document.documentElement;
  const rgb = hexToRgb(hex);
  if (!rgb) return;

  // Generate shades (50-950)
  const shades = {
    50: {
      r: Math.min(255, rgb.r + 200),
      g: Math.min(255, rgb.g + 200),
      b: Math.min(255, rgb.b + 200),
    },
    100: {
      r: Math.min(255, rgb.r + 150),
      g: Math.min(255, rgb.g + 150),
      b: Math.min(255, rgb.b + 150),
    },
    200: {
      r: Math.min(255, rgb.r + 100),
      g: Math.min(255, rgb.g + 100),
      b: Math.min(255, rgb.b + 100),
    },
    300: {
      r: Math.min(255, rgb.r + 50),
      g: Math.min(255, rgb.g + 50),
      b: Math.min(255, rgb.b + 50),
    },
    400: {
      r: Math.min(255, rgb.r + 25),
      g: Math.min(255, rgb.g + 25),
      b: Math.min(255, rgb.b + 25),
    },
    500: rgb,
    600: { r: Math.max(0, rgb.r - 25), g: Math.max(0, rgb.g - 25), b: Math.max(0, rgb.b - 25) },
    700: { r: Math.max(0, rgb.r - 50), g: Math.max(0, rgb.g - 50), b: Math.max(0, rgb.b - 50) },
    800: { r: Math.max(0, rgb.r - 100), g: Math.max(0, rgb.g - 100), b: Math.max(0, rgb.b - 100) },
    900: { r: Math.max(0, rgb.r - 150), g: Math.max(0, rgb.g - 150), b: Math.max(0, rgb.b - 150) },
    950: { r: Math.max(0, rgb.r - 180), g: Math.max(0, rgb.g - 180), b: Math.max(0, rgb.b - 180) },
  };

  Object.entries(shades).forEach(([shade, color]) => {
    const hexValue = `#${[color.r, color.g, color.b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')}`;
    root.style.setProperty(`--color-${baseName}-${shade}`, hexValue);
  });

  root.style.setProperty(`--color-${baseName}-rgb`, `${rgb.r}, ${rgb.g}, ${rgb.b}`);
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: ThemeConfig): void {
  const root = document.documentElement;

  // Generate color shades
  generateColorShades(theme.primary, 'primary');
  generateColorShades(theme.secondary, 'secondary');
  generateColorShades(theme.danger, 'danger');
  generateColorShades(theme.warning, 'warning');
  generateColorShades(theme.info, 'info');

  // Apply fonts
  root.style.setProperty('--font-family', theme.fontFamily);
  root.style.setProperty('--font-family-heading', theme.fontFamilyHeading);
  root.style.setProperty('--font-family-subheading', theme.fontFamilySubheading);
  document.body.style.fontFamily = `var(--font-family), sans-serif`;

  // Apply text colors
  root.style.setProperty('--color-text-heading', theme.textHeading);
  root.style.setProperty(
    '--color-text-heading-rgb',
    hexToRgbString(theme.textHeading) || '17, 24, 39'
  );
  root.style.setProperty('--color-text-subheading', theme.textSubheading);
  root.style.setProperty(
    '--color-text-subheading-rgb',
    hexToRgbString(theme.textSubheading) || '55, 65, 81'
  );
  root.style.setProperty('--color-text-body', theme.textBody);
  root.style.setProperty('--color-text-body-rgb', hexToRgbString(theme.textBody) || '31, 41, 55');
  root.style.setProperty('--color-text-secondary', theme.textSecondary);
  root.style.setProperty(
    '--color-text-secondary-rgb',
    hexToRgbString(theme.textSecondary) || '107, 114, 128'
  );
  root.style.setProperty('--color-text-link', theme.textLink);
  root.style.setProperty('--color-text-link-rgb', hexToRgbString(theme.textLink) || '59, 130, 246');

  // Apply error and success colors
  root.style.setProperty('--color-error', theme.errorColor);
  root.style.setProperty('--color-error-rgb', hexToRgbString(theme.errorColor) || '239, 68, 68');
  root.style.setProperty('--color-error-bg', theme.errorBg);
  root.style.setProperty('--color-success', theme.successColor);
  root.style.setProperty(
    '--color-success-rgb',
    hexToRgbString(theme.successColor) || '16, 185, 129'
  );
  root.style.setProperty('--color-success-bg', theme.successBg);

  // Apply border radius
  root.style.setProperty('--border-radius', theme.borderRadius);
  const style = document.createElement('style');
  style.id = 'theme-border-radius';
  style.textContent = `
    * {
      --rounded: var(--border-radius);
    }
    .rounded-lg {
      border-radius: var(--border-radius) !important;
    }
  `;
  const existingStyle = document.getElementById('theme-border-radius');
  if (existingStyle) {
    existingStyle.remove();
  }
  document.head.appendChild(style);
}

/**
 * Load theme from localStorage
 */
export function loadThemeFromStorage(): ThemeConfig | null {
  if (typeof window === 'undefined') return null;

  const savedTheme = localStorage.getItem('theme-colors');
  if (!savedTheme) return null;

  try {
    return JSON.parse(savedTheme) as ThemeConfig;
  } catch (e) {
    logger.error(
      'Failed to load theme from storage',
      e instanceof Error ? e : new Error(String(e)),
      { savedTheme }
    );
    return null;
  }
}

/**
 * Save theme to localStorage
 */
export function saveThemeToStorage(theme: ThemeConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('theme-colors', JSON.stringify(theme));
}
