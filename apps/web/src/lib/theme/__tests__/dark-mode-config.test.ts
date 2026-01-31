import { describe, it, expect } from 'vitest';
import { DARK_MODE_CONFIG, getDarkModeConfig, meetsDarkModeContrast } from '../dark-mode-config';
import { calculateContrastRatio, meetsWCAGAA } from '../contrast-utils';
import { isValidColor } from '../color-validation';

describe('DARK_MODE_CONFIG', () => {
  const darkBackground = '#0f172a'; // Slate 900

  describe('Color Format Validation', () => {
    it('has valid colors in dark mode config', () => {
      expect(isValidColor(DARK_MODE_CONFIG.colors.background)).toBe(true);
      expect(isValidColor(DARK_MODE_CONFIG.colors.foreground)).toBe(true);
      expect(isValidColor(DARK_MODE_CONFIG.colors.primary)).toBe(true);
      expect(isValidColor(DARK_MODE_CONFIG.colors.danger)).toBe(true);
      expect(isValidColor(DARK_MODE_CONFIG.colors.warning)).toBe(true);
      expect(isValidColor(DARK_MODE_CONFIG.colors.success)).toBe(true);
    });

    it('has valid typography colors', () => {
      expect(isValidColor(DARK_MODE_CONFIG.typography.textHeading)).toBe(true);
      expect(isValidColor(DARK_MODE_CONFIG.typography.textBody)).toBe(true);
      expect(isValidColor(DARK_MODE_CONFIG.typography.textLink)).toBe(true);
    });
  });

  describe('Contrast Validation - Text Colors on Dark Background', () => {
    it('textHeading meets WCAG AA on dark background', () => {
      const ratio = calculateContrastRatio(DARK_MODE_CONFIG.typography.textHeading, darkBackground);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(DARK_MODE_CONFIG.typography.textHeading, darkBackground)).toBe(true);
    });

    it('textBody meets WCAG AA on dark background', () => {
      const ratio = calculateContrastRatio(DARK_MODE_CONFIG.typography.textBody, darkBackground);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(DARK_MODE_CONFIG.typography.textBody, darkBackground)).toBe(true);
    });

    it('textLink meets WCAG AA on dark background', () => {
      const ratio = calculateContrastRatio(DARK_MODE_CONFIG.typography.textLink, darkBackground);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWCAGAA(DARK_MODE_CONFIG.typography.textLink, darkBackground)).toBe(true);
    });
  });

  describe('Contrast Validation - UI Component Colors on Dark Background', () => {
    it('primary color meets WCAG AA for UI components on dark', () => {
      const ratio = calculateContrastRatio(DARK_MODE_CONFIG.colors.primary, darkBackground);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
      expect(meetsWCAGAA(DARK_MODE_CONFIG.colors.primary, darkBackground, false, true)).toBe(true);
    });

    it('danger color meets WCAG AA for UI components on dark', () => {
      const ratio = calculateContrastRatio(DARK_MODE_CONFIG.colors.danger, darkBackground);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
      expect(meetsWCAGAA(DARK_MODE_CONFIG.colors.danger, darkBackground, false, true)).toBe(true);
    });

    it('warning color meets WCAG AA for UI components on dark', () => {
      const ratio = calculateContrastRatio(DARK_MODE_CONFIG.colors.warning, darkBackground);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
      expect(meetsWCAGAA(DARK_MODE_CONFIG.colors.warning, darkBackground, false, true)).toBe(true);
    });

    it('success color meets WCAG AA for UI components on dark', () => {
      const ratio = calculateContrastRatio(DARK_MODE_CONFIG.colors.success, darkBackground);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
      expect(meetsWCAGAA(DARK_MODE_CONFIG.colors.success, darkBackground, false, true)).toBe(true);
    });
  });

  describe('getDarkModeConfig', () => {
    it('returns dark mode configuration', () => {
      const config = getDarkModeConfig();
      expect(config).toBeDefined();
      expect(config.colors.background).toBe(darkBackground);
    });
  });

  describe('meetsDarkModeContrast', () => {
    it('validates contrast on dark background', () => {
      expect(meetsDarkModeContrast('#f8fafc', '#0f172a')).toBe(true);
      // #333333 on #0f172a has very low contrast (~1.2:1)
      expect(meetsDarkModeContrast('#333333', '#0f172a')).toBe(false);
    });

    it('uses default dark background if not provided', () => {
      expect(meetsDarkModeContrast('#f8fafc')).toBe(true);
    });
  });

  describe('Dark Mode Specific Colors', () => {
    it('uses lighter shades for better visibility on dark', () => {
      // Primary should be lighter (400) instead of darker (600)
      expect(DARK_MODE_CONFIG.colors.primary).toBe('#60a5fa'); // Blue 400
      expect(DARK_MODE_CONFIG.colors.danger).toBe('#f87171'); // Red 400
      expect(DARK_MODE_CONFIG.colors.warning).toBe('#fbbf24'); // Amber 400
    });

    it('has appropriate foreground colors', () => {
      // Foreground should be light on dark background
      expect(DARK_MODE_CONFIG.colors.foreground).toBe('#f8fafc'); // Slate 50
      expect(DARK_MODE_CONFIG.typography.textHeading).toBe('#f8fafc'); // Slate 50
    });
  });
});
