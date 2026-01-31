/**
 * Tests for Theme Component Helpers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  themeColors,
  themeSpacing,
  themeTypography,
  themeBorderRadius,
  getCSSVariable,
  setCSSVariable,
  getThemeColorRGB,
  getThemeColorWithOpacity,
  combineThemeClasses,
} from '../component-helpers';

describe('Theme Component Helpers', () => {
  beforeEach(() => {
    // Mock document and window for tests
    Object.defineProperty(window, 'getComputedStyle', {
      value: vi.fn(() => ({
        getPropertyValue: vi.fn((prop: string) => {
          // Mock CSS variables
          const mockVariables: Record<string, string> = {
            '--color-primary-500': '#2563eb',
            '--color-primary-rgb': '37, 99, 235',
            '--color-secondary-500': '#6366f1',
            '--color-secondary-rgb': '99, 102, 241',
            '--color-danger-500': '#dc2626',
            '--color-danger-rgb': '220, 38, 38',
            '--color-warning-500': '#d97706',
            '--color-warning-rgb': '217, 119, 6',
            '--color-info-500': '#0891b2',
            '--color-info-rgb': '8, 145, 178',
            '--color-success-500': '#059669',
            '--color-success-rgb': '5, 150, 105',
            '--color-error-500': '#dc2626',
            '--color-error-rgb': '220, 38, 38',
            '--color-background': '#ffffff',
            '--color-foreground': '#111827',
            '--color-muted': '#f3f4f6',
            '--color-muted-foreground': '#6b7280',
            '--color-border': '#e5e7eb',
            '--spacing-xs': '4px',
            '--spacing-sm': '8px',
            '--spacing-md': '16px',
          };
          return mockVariables[prop] || '';
        }),
      })),
      writable: true,
    });

    // Mock document.documentElement
    document.documentElement.style.setProperty = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('themeColors', () => {
    it('should provide background color classes', () => {
      expect(themeColors.bg.primary).toBe('bg-primary-500');
      expect(themeColors.bg.danger).toBe('bg-danger-500');
      expect(themeColors.bg.success).toBe('bg-success-500');
    });

    it('should provide text color classes', () => {
      expect(themeColors.text.primary).toBe('text-primary-500');
      expect(themeColors.text.danger).toBe('text-danger-500');
      expect(themeColors.text.foreground).toBe('text-[var(--color-foreground)]');
    });

    it('should provide border color classes', () => {
      expect(themeColors.border.primary).toBe('border-primary-500');
      expect(themeColors.border.danger).toBe('border-danger-500');
      expect(themeColors.border.default).toBe('border-[var(--color-border)]');
    });
  });

  describe('themeSpacing', () => {
    it('should provide spacing CSS variables', () => {
      expect(themeSpacing.xs).toBe('var(--spacing-xs, 4px)');
      expect(themeSpacing.sm).toBe('var(--spacing-sm, 8px)');
      expect(themeSpacing.md).toBe('var(--spacing-md, 16px)');
    });
  });

  describe('themeTypography', () => {
    it('should provide font family classes', () => {
      expect(themeTypography.font.sans).toBe('font-sans');
      expect(themeTypography.font.heading).toBe('font-heading');
      expect(themeTypography.font.subheading).toBe('font-subheading');
    });
  });

  describe('themeBorderRadius', () => {
    it('should provide border radius classes', () => {
      expect(themeBorderRadius.default).toBe('rounded');
      expect(themeBorderRadius.lg).toBe('rounded-lg');
      expect(themeBorderRadius.full).toBe('rounded-full');
    });
  });

  describe('getCSSVariable', () => {
    it('should return CSS variable value', () => {
      const value = getCSSVariable('--color-primary-500');
      expect(value).toBe('#2563eb');
    });

    it('should return fallback if variable not set', () => {
      const value = getCSSVariable('--color-nonexistent', '#000000');
      expect(value).toBe('#000000');
    });

    it('should return empty string if no fallback and variable not set', () => {
      const value = getCSSVariable('--color-nonexistent');
      expect(value).toBe('');
    });
  });

  describe('setCSSVariable', () => {
    it('should set CSS variable on document root', () => {
      setCSSVariable('--color-custom', '#ff0000');
      expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--color-custom',
        '#ff0000'
      );
    });

    it('should not set variable if window is undefined', () => {
      const originalWindow = global.window;
      // @ts-expect-error - Testing SSR scenario
      delete global.window;

      setCSSVariable('--color-custom', '#ff0000');
      expect(document.documentElement.style.setProperty).not.toHaveBeenCalled();

      global.window = originalWindow;
    });
  });

  describe('getThemeColorRGB', () => {
    it('should return RGB values for primary color', () => {
      const rgb = getThemeColorRGB('primary');
      expect(rgb).toBe('37, 99, 235');
    });

    it('should return RGB values for danger color', () => {
      const rgb = getThemeColorRGB('danger');
      expect(rgb).toBe('220, 38, 38');
    });

    it('should return fallback RGB if not set', () => {
      const rgb = getThemeColorRGB('primary');
      // Mock returns empty string, should use fallback
      (window.getComputedStyle as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        getPropertyValue: vi.fn(() => ''),
      });
      const rgbEmpty = getThemeColorRGB('primary');
      expect(rgbEmpty).toBe('0, 0, 0'); // Fallback
    });
  });

  describe('getThemeColorWithOpacity', () => {
    it('should return RGBA color string', () => {
      const rgba = getThemeColorWithOpacity('primary', 0.5);
      expect(rgba).toBe('rgba(37, 99, 235, 0.5)');
    });

    it('should handle different opacity values', () => {
      const rgba1 = getThemeColorWithOpacity('primary', 0.1);
      const rgba2 = getThemeColorWithOpacity('primary', 0.9);
      expect(rgba1).toBe('rgba(37, 99, 235, 0.1)');
      expect(rgba2).toBe('rgba(37, 99, 235, 0.9)');
    });
  });

  describe('combineThemeClasses', () => {
    it('should combine multiple theme classes', () => {
      const combined = combineThemeClasses(
        themeColors.bg.primary,
        themeColors.text.foreground,
        themeBorderRadius.default
      );
      expect(combined).toBe('bg-primary-500 text-[var(--color-foreground)] rounded');
    });

    it('should filter out empty strings', () => {
      const combined = combineThemeClasses(themeColors.bg.primary, '', themeColors.text.foreground);
      expect(combined).toBe('bg-primary-500 text-[var(--color-foreground)]');
    });

    it('should return empty string if no classes provided', () => {
      const combined = combineThemeClasses();
      expect(combined).toBe('');
    });
  });
});
