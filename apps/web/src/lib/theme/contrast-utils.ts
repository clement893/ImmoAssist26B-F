/**
 * Contrast Utilities
 * Functions to calculate color contrast ratios and validate WCAG compliance
 *
 * Based on WCAG 2.1 guidelines:
 * - Level AA: Normal text ≥ 4.5:1, Large text ≥ 3:1, UI components ≥ 3:1
 * - Level AAA: Normal text ≥ 7:1, Large text ≥ 4.5:1
 */

/**
 * Convert hex color to RGB values
 * Supports formats: #RGB, #RRGGBB, RGB, RRGGBB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove hash if present
  const cleanHex = hex.replace('#', '').trim();

  // Handle 3-digit hex (#RGB)
  if (cleanHex.length === 3) {
    const rChar = cleanHex[0];
    const gChar = cleanHex[1];
    const bChar = cleanHex[2];
    if (!rChar || !gChar || !bChar) return null;
    const r = parseInt(rChar + rChar, 16);
    const g = parseInt(gChar + gChar, 16);
    const b = parseInt(bChar + bChar, 16);
    return { r, g, b };
  }

  // Handle 6-digit hex (#RRGGBB)
  if (cleanHex.length === 6) {
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
    if (!result || !result[1] || !result[2] || !result[3]) return null;
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }

  return null;
}

/**
 * Convert RGB color to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 formula: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
 *
 * @param r Red component (0-255)
 * @param g Green component (0-255)
 * @param b Blue component (0-255)
 * @returns Relative luminance (0-1)
 */
export function getLuminance(r: number, g: number, b: number): number {
  // Normalize RGB values to 0-1
  const normalized = [r, g, b].map((val) => {
    const norm = val / 255;
    return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
  });

  const rs = normalized[0] ?? 0;
  const gs = normalized[1] ?? 0;
  const bs = normalized[2] ?? 0;

  // Calculate relative luminance using WCAG formula
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.1 formula: (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the lighter color and L2 is the darker color
 *
 * @param color1 First color (hex format: #RRGGBB)
 * @param color2 Second color (hex format: #RRGGBB)
 * @returns Contrast ratio (1-21, where 21 is maximum contrast)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error(`Invalid color format: ${color1} or ${color2}`);
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  // Ensure L1 is the lighter color
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  // Calculate contrast ratio
  const ratio = (lighter + 0.05) / (darker + 0.05);

  return Math.round(ratio * 100) / 100; // Round to 2 decimal places
}

/**
 * Check if contrast ratio meets WCAG Level AA requirements
 *
 * @param foreground Foreground color (hex format)
 * @param background Background color (hex format)
 * @param isLargeText Whether the text is large (≥18pt or ≥14pt bold)
 * @param isUIComponent Whether this is a UI component (button, link, etc.)
 * @returns true if meets WCAG AA requirements
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false,
  isUIComponent: boolean = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);

  // UI components require minimum 3:1
  if (isUIComponent) {
    return ratio >= 3.0;
  }

  // Large text requires minimum 3:1 for AA
  if (isLargeText) {
    return ratio >= 3.0;
  }

  // Normal text requires minimum 4.5:1 for AA
  return ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG Level AAA requirements
 *
 * @param foreground Foreground color (hex format)
 * @param background Background color (hex format)
 * @param isLargeText Whether the text is large (≥18pt or ≥14pt bold)
 * @returns true if meets WCAG AAA requirements
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);

  // Large text requires minimum 4.5:1 for AAA
  if (isLargeText) {
    return ratio >= 4.5;
  }

  // Normal text requires minimum 7:1 for AAA
  return ratio >= 7.0;
}

/**
 * Get contrast level description
 *
 * @param ratio Contrast ratio
 * @returns Level description: 'fail', 'AA Large', 'AA', 'AAA Large', 'AAA'
 */
export function getContrastLevel(ratio: number): {
  level: 'fail' | 'AA Large' | 'AA' | 'AAA Large' | 'AAA';
  description: string;
} {
  if (ratio < 3.0) {
    return {
      level: 'fail',
      description: 'Does not meet WCAG requirements',
    };
  }

  if (ratio < 4.5) {
    return {
      level: 'AA Large',
      description: 'Meets WCAG AA for large text only',
    };
  }

  if (ratio < 7.0) {
    return {
      level: 'AA',
      description: 'Meets WCAG AA for normal text',
    };
  }

  if (ratio < 4.5) {
    return {
      level: 'AAA Large',
      description: 'Meets WCAG AAA for large text',
    };
  }

  return {
    level: 'AAA',
    description: 'Meets WCAG AAA for normal text',
  };
}

/**
 * Get contrast issues for a theme configuration
 *
 * @param config Theme configuration object
 * @returns Array of contrast issues found
 */
export interface ContrastIssue {
  type: 'text' | 'ui';
  element: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
  level: 'fail' | 'AA Large' | 'AA' | 'AAA Large' | 'AAA';
  message: string;
}

export function getContrastIssues(config: {
  colors?: {
    background?: string;
    foreground?: string;
    primary?: string;
    danger?: string;
    warning?: string;
    success?: string;
  };
  typography?: {
    textHeading?: string;
    textBody?: string;
    textLink?: string;
  };
}): ContrastIssue[] {
  const issues: ContrastIssue[] = [];
  const colors = config.colors || {};
  const typography = config.typography || {};
  const background = colors.background || '#ffffff';

  // Check text contrast
  if (typography.textHeading) {
    const ratio = calculateContrastRatio(typography.textHeading, background);
    if (!meetsWCAGAA(typography.textHeading, background)) {
      issues.push({
        type: 'text',
        element: 'textHeading',
        foreground: typography.textHeading,
        background,
        ratio,
        required: 4.5,
        level: ratio >= 3.0 ? 'AA Large' : 'fail',
        message: `Heading text contrast ratio ${ratio}:1 does not meet WCAG AA (requires 4.5:1)`,
      });
    }
  }

  if (typography.textBody) {
    const ratio = calculateContrastRatio(typography.textBody, background);
    if (!meetsWCAGAA(typography.textBody, background)) {
      issues.push({
        type: 'text',
        element: 'textBody',
        foreground: typography.textBody,
        background,
        ratio,
        required: 4.5,
        level: ratio >= 3.0 ? 'AA Large' : 'fail',
        message: `Body text contrast ratio ${ratio}:1 does not meet WCAG AA (requires 4.5:1)`,
      });
    }
  }

  if (typography.textLink) {
    const ratio = calculateContrastRatio(typography.textLink, background);
    if (!meetsWCAGAA(typography.textLink, background)) {
      issues.push({
        type: 'text',
        element: 'textLink',
        foreground: typography.textLink,
        background,
        ratio,
        required: 4.5,
        level: ratio >= 3.0 ? 'AA Large' : 'fail',
        message: `Link text contrast ratio ${ratio}:1 does not meet WCAG AA (requires 4.5:1)`,
      });
    }
  }

  // Check UI component contrast
  if (colors.primary) {
    const ratio = calculateContrastRatio(colors.primary, background);
    if (!meetsWCAGAA(colors.primary, background, false, true)) {
      issues.push({
        type: 'ui',
        element: 'primary',
        foreground: colors.primary,
        background,
        ratio,
        required: 3.0,
        level: ratio >= 3.0 ? 'AA' : 'fail',
        message: `Primary button contrast ratio ${ratio}:1 does not meet WCAG AA for UI components (requires 3:1)`,
      });
    }
  }

  if (colors.danger) {
    const ratio = calculateContrastRatio(colors.danger, background);
    if (!meetsWCAGAA(colors.danger, background, false, true)) {
      issues.push({
        type: 'ui',
        element: 'danger',
        foreground: colors.danger,
        background,
        ratio,
        required: 3.0,
        level: ratio >= 3.0 ? 'AA' : 'fail',
        message: `Danger button contrast ratio ${ratio}:1 does not meet WCAG AA for UI components (requires 3:1)`,
      });
    }
  }

  if (colors.warning) {
    const ratio = calculateContrastRatio(colors.warning, background);
    if (!meetsWCAGAA(colors.warning, background, false, true)) {
      issues.push({
        type: 'ui',
        element: 'warning',
        foreground: colors.warning,
        background,
        ratio,
        required: 3.0,
        level: ratio >= 3.0 ? 'AA' : 'fail',
        message: `Warning button contrast ratio ${ratio}:1 does not meet WCAG AA for UI components (requires 3:1)`,
      });
    }
  }

  if (colors.success) {
    const ratio = calculateContrastRatio(colors.success, background);
    if (!meetsWCAGAA(colors.success, background, false, true)) {
      issues.push({
        type: 'ui',
        element: 'success',
        foreground: colors.success,
        background,
        ratio,
        required: 3.0,
        level: ratio >= 3.0 ? 'AA' : 'fail',
        message: `Success button contrast ratio ${ratio}:1 does not meet WCAG AA for UI components (requires 3:1)`,
      });
    }
  }

  return issues;
}
