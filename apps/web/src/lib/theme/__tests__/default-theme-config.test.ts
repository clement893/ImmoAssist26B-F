import { describe, it, expect } from 'vitest';
import { DEFAULT_THEME_CONFIG } from '../default-theme-config';
import { calculateContrastRatio, meetsWCAGAA } from '../contrast-utils';
import { isValidColor } from '../color-validation';

describe('DEFAULT_THEME_CONFIG', () => {
  const white = '#ffffff';

  describe('Color Format Validation', () => {
    it('has valid hex colors for primary colors', () => {
      expect(isValidColor(DEFAULT_THEME_CONFIG.primary_color)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.secondary_color)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.danger_color)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.warning_color)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.info_color)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.success_color)).toBe(true);
    });

    it('has valid colors in nested colors object', () => {
      expect(isValidColor(DEFAULT_THEME_CONFIG.colors.primary)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.colors.secondary)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.colors.danger)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.colors.warning)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.colors.info)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.colors.success)).toBe(true);
    });

    it('has valid typography colors', () => {
      expect(isValidColor(DEFAULT_THEME_CONFIG.typography.textHeading)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.typography.textSubheading)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.typography.textBody)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.typography.textSecondary)).toBe(true);
      expect(isValidColor(DEFAULT_THEME_CONFIG.typography.textLink)).toBe(true);
    });
  });

  describe('Contrast Validation - Text Colors', () => {
    it('textHeading meets WCAG AA on white background', () => {
      const ratio = calculateContrastRatio(DEFAULT_THEME_CONFIG.typography.textHeading, white);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(DEFAULT_THEME_CONFIG.typography.textHeading, white)).toBe(true);
    });

    it('textBody meets WCAG AA on white background', () => {
      const ratio = calculateContrastRatio(DEFAULT_THEME_CONFIG.typography.textBody, white);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(DEFAULT_THEME_CONFIG.typography.textBody, white)).toBe(true);
    });

    it('textLink meets WCAG AA on white background', () => {
      const ratio = calculateContrastRatio(DEFAULT_THEME_CONFIG.typography.textLink, white);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(DEFAULT_THEME_CONFIG.typography.textLink, white)).toBe(true);
    });
  });

  describe('Contrast Validation - UI Component Colors', () => {
    it('primary color meets WCAG AA for UI components on white', () => {
      const ratio = calculateContrastRatio(DEFAULT_THEME_CONFIG.primary_color, white);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
      expect(meetsWCAGAA(DEFAULT_THEME_CONFIG.primary_color, white, false, true)).toBe(true);
    });

    it('danger color meets WCAG AA for UI components on white', () => {
      const ratio = calculateContrastRatio(DEFAULT_THEME_CONFIG.danger_color, white);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
      expect(meetsWCAGAA(DEFAULT_THEME_CONFIG.danger_color, white, false, true)).toBe(true);
    });

    it('warning color meets WCAG AA for UI components on white', () => {
      const ratio = calculateContrastRatio(DEFAULT_THEME_CONFIG.warning_color, white);
      expect(ratio).toBeGreaterThanOrEqual(4.5); // Should meet text standard, not just UI
      expect(meetsWCAGAA(DEFAULT_THEME_CONFIG.warning_color, white, false, true)).toBe(true);
      expect(meetsWCAGAA(DEFAULT_THEME_CONFIG.warning_color, white, false, false)).toBe(true);
    });

    it('success color meets WCAG AA for UI components on white', () => {
      const ratio = calculateContrastRatio(DEFAULT_THEME_CONFIG.success_color, white);
      expect(ratio).toBeGreaterThanOrEqual(4.5); // Should meet text standard, not just UI
      expect(meetsWCAGAA(DEFAULT_THEME_CONFIG.success_color, white, false, true)).toBe(true);
      expect(meetsWCAGAA(DEFAULT_THEME_CONFIG.success_color, white, false, false)).toBe(true);
    });

    it('info color meets WCAG AA for UI components on white', () => {
      const ratio = calculateContrastRatio(DEFAULT_THEME_CONFIG.info_color, white);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
      expect(meetsWCAGAA(DEFAULT_THEME_CONFIG.info_color, white, false, true)).toBe(true);
    });
  });

  describe('Color Consistency', () => {
    it('primary_color matches colors.primary', () => {
      expect(DEFAULT_THEME_CONFIG.primary_color).toBe(DEFAULT_THEME_CONFIG.colors.primary);
    });

    it('secondary_color matches colors.secondary', () => {
      expect(DEFAULT_THEME_CONFIG.secondary_color).toBe(DEFAULT_THEME_CONFIG.colors.secondary);
    });

    it('danger_color matches colors.danger', () => {
      expect(DEFAULT_THEME_CONFIG.danger_color).toBe(DEFAULT_THEME_CONFIG.colors.danger);
    });

    it('warning_color matches colors.warning', () => {
      expect(DEFAULT_THEME_CONFIG.warning_color).toBe(DEFAULT_THEME_CONFIG.colors.warning);
    });

    it('success_color matches colors.success', () => {
      expect(DEFAULT_THEME_CONFIG.success_color).toBe(DEFAULT_THEME_CONFIG.colors.success);
    });

    it('info_color matches colors.info', () => {
      expect(DEFAULT_THEME_CONFIG.info_color).toBe(DEFAULT_THEME_CONFIG.colors.info);
    });
  });

  describe('Specific Color Improvements', () => {
    it('warning color is improved from previous version', () => {
      // Previous: #d97706 (Amber 600) = ~3.0:1
      // Current: #b45309 (Amber 700) = ~4.5:1
      const oldWarning = '#d97706';
      const newWarning = DEFAULT_THEME_CONFIG.warning_color;

      const oldRatio = calculateContrastRatio(oldWarning, white);
      const newRatio = calculateContrastRatio(newWarning, white);

      expect(newRatio).toBeGreaterThan(oldRatio);
      expect(newRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('success color is improved from previous version', () => {
      // Previous: #059669 (Green 600) = ~3.2:1
      // Current: #047857 (Green 700) = ~4.5:1
      const oldSuccess = '#059669';
      const newSuccess = DEFAULT_THEME_CONFIG.success_color;

      const oldRatio = calculateContrastRatio(oldSuccess, white);
      const newRatio = calculateContrastRatio(newSuccess, white);

      expect(newRatio).toBeGreaterThan(oldRatio);
      expect(newRatio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
