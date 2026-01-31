/**
 * Theme Accessibility Tests
 * Automated tests for WCAG compliance and accessibility of theme configurations
 */

import { describe, it, expect } from 'vitest';
import { validateThemeConfig, type ThemeValidationResult } from '../theme-validator';
import {
  calculateContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  getContrastLevel,
  type ContrastIssue,
} from '../contrast-utils';
import { isValidColor, normalizeColor } from '../color-validation';

/**
 * WCAG 2.1 Compliance Levels
 */
const WCAG_AA_NORMAL_TEXT = 4.5;
const WCAG_AA_LARGE_TEXT = 3.0;
const WCAG_AA_UI_COMPONENT = 3.0;
const WCAG_AAA_NORMAL_TEXT = 7.0;
const WCAG_AAA_LARGE_TEXT = 4.5;

describe('Theme Accessibility - WCAG Compliance', () => {
  describe('Color Format Validation', () => {
    it('should validate all color formats are accessible', () => {
      const config = {
        primary_color: '#2563eb',
        secondary_color: '#6366f1',
        danger_color: '#dc2626',
        warning_color: '#d97706',
        info_color: '#0891b2',
        success_color: '#059669',
        colors: {
          background: '#ffffff',
          foreground: '#000000',
        },
      };

      const result = validateThemeConfig(config);
      expect(result.valid).toBe(true);
      expect(result.colorFormatErrors.length).toBe(0);
    });

    it('should reject invalid color formats that prevent accessibility checks', () => {
      const config = {
        primary_color: 'not-a-color',
        colors: {
          background: '#ffffff',
        },
      };

      const result = validateThemeConfig(config);
      expect(result.valid).toBe(false);
      expect(result.colorFormatErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Text Contrast - WCAG AA Compliance', () => {
    it('should meet WCAG AA for normal text (4.5:1)', () => {
      const config = {
        colors: {
          background: '#ffffff',
        },
        typography: {
          textHeading: '#000000', // Black on white = 21:1
          textBody: '#1e293b', // Dark slate on white = ~12:1
        },
      };

      const result = validateThemeConfig(config);
      expect(result.valid).toBe(true);

      // Check specific contrast ratios
      const headingRatio = calculateContrastRatio('#000000', '#ffffff');
      const bodyRatio = calculateContrastRatio('#1e293b', '#ffffff');

      expect(headingRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      expect(bodyRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });

    it('should meet WCAG AA for large text (3:1)', () => {
      const config = {
        colors: {
          background: '#ffffff',
        },
        typography: {
          textHeading: '#767676', // Meets AA Large but not AA normal
        },
      };

      const headingRatio = calculateContrastRatio('#767676', '#ffffff');
      expect(headingRatio).toBeGreaterThanOrEqual(WCAG_AA_LARGE_TEXT);
      expect(headingRatio).toBeLessThan(WCAG_AA_NORMAL_TEXT);

      // Should pass for large text
      expect(meetsWCAGAA('#767676', '#ffffff', true)).toBe(true);
      // Should fail for normal text
      expect(meetsWCAGAA('#767676', '#ffffff', false)).toBe(false);
    });

    it('should fail WCAG AA for insufficient contrast', () => {
      const config = {
        colors: {
          background: '#ffffff',
        },
        typography: {
          textHeading: '#cccccc', // Very low contrast
          textBody: '#dddddd', // Very low contrast
        },
      };

      const result = validateThemeConfig(config);
      expect(result.valid).toBe(false);
      expect(result.contrastIssues.length).toBeGreaterThan(0);

      const headingRatio = calculateContrastRatio('#cccccc', '#ffffff');
      expect(headingRatio).toBeLessThan(WCAG_AA_NORMAL_TEXT);
      expect(headingRatio).toBeLessThan(WCAG_AA_LARGE_TEXT);
    });

    it('should validate link text contrast', () => {
      const config = {
        colors: {
          background: '#ffffff',
        },
        typography: {
          textLink: '#2563eb', // Blue link on white
        },
      };

      const linkRatio = calculateContrastRatio('#2563eb', '#ffffff');
      expect(linkRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      expect(meetsWCAGAA('#2563eb', '#ffffff')).toBe(true);
    });
  });

  describe('UI Component Contrast - WCAG AA Compliance', () => {
    it('should meet WCAG AA for UI components (3:1)', () => {
      const config = {
        colors: {
          background: '#ffffff',
          primary: '#2563eb',
          danger: '#dc2626',
          warning: '#d97706',
          success: '#059669',
        },
      };

      const primaryRatio = calculateContrastRatio('#2563eb', '#ffffff');
      const dangerRatio = calculateContrastRatio('#dc2626', '#ffffff');
      const warningRatio = calculateContrastRatio('#d97706', '#ffffff');
      const successRatio = calculateContrastRatio('#059669', '#ffffff');

      expect(primaryRatio).toBeGreaterThanOrEqual(WCAG_AA_UI_COMPONENT);
      expect(dangerRatio).toBeGreaterThanOrEqual(WCAG_AA_UI_COMPONENT);
      expect(warningRatio).toBeGreaterThanOrEqual(WCAG_AA_UI_COMPONENT);
      expect(successRatio).toBeGreaterThanOrEqual(WCAG_AA_UI_COMPONENT);

      expect(meetsWCAGAA('#2563eb', '#ffffff', false, true)).toBe(true);
      expect(meetsWCAGAA('#dc2626', '#ffffff', false, true)).toBe(true);
    });

    it('should fail for UI components with insufficient contrast', () => {
      const config = {
        colors: {
          background: '#ffffff',
          primary: '#f0f0f0', // Very light, poor contrast
        },
      };

      const result = validateThemeConfig(config);
      const primaryRatio = calculateContrastRatio('#f0f0f0', '#ffffff');

      expect(primaryRatio).toBeLessThan(WCAG_AA_UI_COMPONENT);
      expect(meetsWCAGAA('#f0f0f0', '#ffffff', false, true)).toBe(false);
    });
  });

  describe('WCAG AAA Compliance', () => {
    it('should meet WCAG AAA for normal text (7:1)', () => {
      const config = {
        colors: {
          background: '#ffffff',
        },
        typography: {
          textHeading: '#000000', // Black on white = 21:1
          textBody: '#1e293b', // Dark slate on white = ~12:1
        },
      };

      expect(meetsWCAGAAA('#000000', '#ffffff')).toBe(true);
      expect(meetsWCAGAAA('#1e293b', '#ffffff')).toBe(true);
    });

    it('should meet WCAG AAA for large text (4.5:1)', () => {
      const config = {
        colors: {
          background: '#ffffff',
        },
        typography: {
          textHeading: '#4a5568', // Meets AAA Large
        },
      };

      const ratio = calculateContrastRatio('#4a5568', '#ffffff');
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AAA_LARGE_TEXT);
      expect(meetsWCAGAAA('#4a5568', '#ffffff', true)).toBe(true);
    });

    it('should identify AAA compliance level', () => {
      const blackWhite = getContrastLevel(21.0);
      expect(blackWhite.level).toBe('AAA');

      const aaLevel = getContrastLevel(5.0);
      expect(aaLevel.level).toBe('AA');

      const failLevel = getContrastLevel(2.0);
      expect(failLevel.level).toBe('fail');
    });
  });

  describe('Dark Mode Accessibility', () => {
    it('should validate dark mode theme contrast', () => {
      const darkConfig = {
        mode: 'dark',
        colors: {
          background: '#0f172a', // Dark background
          foreground: '#f8fafc', // Light foreground
        },
        typography: {
          textHeading: '#f8fafc',
          textBody: '#e2e8f0',
        },
      };

      const result = validateThemeConfig(darkConfig);
      expect(result.valid).toBe(true);

      const headingRatio = calculateContrastRatio('#f8fafc', '#0f172a');
      const bodyRatio = calculateContrastRatio('#e2e8f0', '#0f172a');

      expect(headingRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
      expect(bodyRatio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
    });

    it('should fail dark mode with insufficient contrast', () => {
      const darkConfig = {
        mode: 'dark',
        colors: {
          background: '#1e293b',
          foreground: '#334155', // Too dark on dark background
        },
        typography: {
          textBody: '#334155',
        },
      };

      const result = validateThemeConfig(darkConfig);
      const bodyRatio = calculateContrastRatio('#334155', '#1e293b');

      expect(bodyRatio).toBeLessThan(WCAG_AA_NORMAL_TEXT);
    });
  });

  describe('Complete Theme Accessibility Validation', () => {
    it('should validate complete accessible theme', () => {
      const accessibleTheme = {
        primary_color: '#2563eb',
        secondary_color: '#6366f1',
        danger_color: '#dc2626',
        warning_color: '#d97706',
        info_color: '#0891b2',
        success_color: '#059669',
        colors: {
          background: '#ffffff',
          foreground: '#000000',
          primary: '#2563eb',
          danger: '#dc2626',
          warning: '#d97706',
          success: '#059669',
        },
        typography: {
          textHeading: '#0f172a',
          textSubheading: '#334155',
          textBody: '#1e293b',
          textSecondary: '#64748b',
          textLink: '#2563eb',
        },
      };

      const result = validateThemeConfig(accessibleTheme, { strictContrast: false });

      expect(result.valid).toBe(true);
      expect(result.colorFormatErrors.length).toBe(0);
      expect(result.contrastIssues.length).toBe(0);
      expect(result.warnings.length).toBe(0);
    });

    it('should identify all accessibility issues in problematic theme', () => {
      const problematicTheme = {
        primary_color: 'invalid-color',
        colors: {
          background: '#ffffff',
          primary: '#f0f0f0', // Poor contrast
        },
        typography: {
          textHeading: '#cccccc', // Poor contrast
          textBody: '#dddddd', // Poor contrast
          textLink: '#eeeeee', // Poor contrast
        },
      };

      const result = validateThemeConfig(problematicTheme, { strictContrast: false });

      expect(result.valid).toBe(false);
      expect(result.colorFormatErrors.length).toBeGreaterThan(0);
      expect(result.contrastIssues.length).toBeGreaterThan(0);
    });

    it('should provide detailed accessibility report', () => {
      const theme = {
        colors: {
          background: '#ffffff',
        },
        typography: {
          textHeading: '#000000', // Perfect contrast
          textBody: '#767676', // AA Large only
        },
      };

      const result = validateThemeConfig(theme, { strictContrast: false });

      // Should have warnings for AA Large issues
      const aaLargeIssues = result.contrastIssues.filter((issue) => issue.level === 'AA Large');

      expect(aaLargeIssues.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Accessibility', () => {
    it('should handle color normalization for accessibility checks', () => {
      const hexColor = '#ffffff';
      const rgbColor = 'rgb(255, 255, 255)';
      const shortHex = '#fff';

      expect(isValidColor(hexColor)).toBe(true);
      expect(isValidColor(rgbColor)).toBe(true);
      expect(isValidColor(shortHex)).toBe(true);

      const normalizedHex = normalizeColor(hexColor);
      const normalizedRgb = normalizeColor(rgbColor);
      const normalizedShort = normalizeColor(shortHex);

      expect(normalizedHex).toBe('#ffffff');
      expect(normalizedRgb).toBe('#ffffff');
      expect(normalizedShort).toBe('#ffffff');
    });

    it('should validate minimum contrast requirements', () => {
      // Test various contrast ratios
      const testCases = [
        { foreground: '#000000', background: '#ffffff', expected: true }, // 21:1
        { foreground: '#1e293b', background: '#ffffff', expected: true }, // ~12:1
        { foreground: '#4a5568', background: '#ffffff', expected: true }, // ~7:1
        { foreground: '#767676', background: '#ffffff', expected: false }, // ~3:1 (AA Large only)
        { foreground: '#cccccc', background: '#ffffff', expected: false }, // ~1.6:1
      ];

      testCases.forEach(({ foreground, background, expected }) => {
        const meetsAA = meetsWCAGAA(foreground, background, false);
        expect(meetsAA).toBe(expected);
      });
    });

    it('should handle empty or missing theme configs gracefully', () => {
      const emptyConfig = {};
      const result = validateThemeConfig(emptyConfig);

      // Empty config should be valid (no colors to validate)
      expect(result.valid).toBe(true);
    });
  });

  describe('Accessibility Best Practices', () => {
    it('should recommend accessible color combinations', () => {
      // Test common accessible color pairs
      const accessiblePairs = [
        { foreground: '#000000', background: '#ffffff' }, // Black on white
        { foreground: '#ffffff', background: '#000000' }, // White on black
        { foreground: '#1e293b', background: '#ffffff' }, // Dark slate on white
        { foreground: '#f8fafc', background: '#0f172a' }, // Light on dark
      ];

      accessiblePairs.forEach(({ foreground, background }) => {
        const ratio = calculateContrastRatio(foreground, background);
        expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_NORMAL_TEXT);
        expect(meetsWCAGAA(foreground, background)).toBe(true);
      });
    });

    it('should flag non-accessible color combinations', () => {
      const nonAccessiblePairs = [
        { foreground: '#cccccc', background: '#ffffff' }, // Light gray on white
        { foreground: '#333333', background: '#1e293b' }, // Dark gray on dark
        { foreground: '#f0f0f0', background: '#ffffff' }, // Very light on white
      ];

      nonAccessiblePairs.forEach(({ foreground, background }) => {
        const ratio = calculateContrastRatio(foreground, background);
        expect(ratio).toBeLessThan(WCAG_AA_NORMAL_TEXT);
        expect(meetsWCAGAA(foreground, background)).toBe(false);
      });
    });
  });
});
