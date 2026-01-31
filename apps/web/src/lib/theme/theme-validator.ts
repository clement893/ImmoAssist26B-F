/**
 * Theme Validator
 * Validates theme configurations for contrast and color format compliance
 */

import { getContrastIssues, ContrastIssue } from './contrast-utils';
import { logger } from '@/lib/logger';

/**
 * Color validation result
 */
export interface ColorValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    value: string;
    message: string;
  }>;
}

/**
 * Validate hex color format
 */
function isValidHexColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }

  const cleanColor = color.trim();
  const hex = cleanColor.startsWith('#') ? cleanColor.slice(1) : cleanColor;

  if (hex.length === 3) {
    return /^[0-9a-f]{3}$/i.test(hex);
  }

  if (hex.length === 6) {
    return /^[0-9a-f]{6}$/i.test(hex);
  }

  return false;
}

/**
 * Validate RGB color format
 */
function isValidRgbColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }

  const cleanColor = color.trim();
  const rgbMatch = cleanColor.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/i
  );
  if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
  }

  const commaMatch = cleanColor.match(/^(\d+),\s*(\d+),\s*(\d+)$/);
  if (commaMatch && commaMatch[1] && commaMatch[2] && commaMatch[3]) {
    const r = parseInt(commaMatch[1], 10);
    const g = parseInt(commaMatch[2], 10);
    const b = parseInt(commaMatch[3], 10);
    return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
  }

  return false;
}

/**
 * Validate HSL color format
 */
function isValidHslColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }

  const cleanColor = color.trim();
  const hslMatch = cleanColor.match(
    /^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%(?:\s*,\s*[\d.]+)?\s*\)$/i
  );
  if (hslMatch && hslMatch[1] && hslMatch[2] && hslMatch[3]) {
    const h = parseInt(hslMatch[1], 10);
    const s = parseInt(hslMatch[2], 10);
    const l = parseInt(hslMatch[3], 10);
    return h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100;
  }

  return false;
}

/**
 * Check if color is in any valid format (hex, rgb, hsl)
 */
function isValidColor(color: string): boolean {
  return isValidHexColor(color) || isValidRgbColor(color) || isValidHslColor(color);
}

/**
 * Validate theme configuration colors
 */
function validateThemeColors(config: {
  colors?: Record<string, unknown>;
  primary_color?: string;
  secondary_color?: string;
  danger_color?: string;
  warning_color?: string;
  info_color?: string;
  success_color?: string;
  typography?: {
    textHeading?: string;
    textSubheading?: string;
    textBody?: string;
    textSecondary?: string;
    textLink?: string;
  };
}): ColorValidationResult {
  const errors: ColorValidationResult['errors'] = [];

  const flatColors = [
    { key: 'primary_color', value: config.primary_color },
    { key: 'secondary_color', value: config.secondary_color },
    { key: 'danger_color', value: config.danger_color },
    { key: 'warning_color', value: config.warning_color },
    { key: 'info_color', value: config.info_color },
    { key: 'success_color', value: config.success_color },
  ];

  flatColors.forEach(({ key, value }) => {
    if (value && !isValidColor(value)) {
      errors.push({
        field: key,
        value: String(value),
        message: `Invalid color format: ${value}. Expected hex (#RRGGBB), rgb(), or hsl()`,
      });
    }
  });

  if (config.colors) {
    Object.entries(config.colors).forEach(([key, value]) => {
      if (typeof value === 'string' && !isValidColor(value)) {
        errors.push({
          field: `colors.${key}`,
          value: String(value),
          message: `Invalid color format: ${value}. Expected hex (#RRGGBB), rgb(), or hsl()`,
        });
      }
    });
  }

  if (config.typography) {
    const typographyColors = [
      { key: 'textHeading', value: config.typography.textHeading },
      { key: 'textSubheading', value: config.typography.textSubheading },
      { key: 'textBody', value: config.typography.textBody },
      { key: 'textSecondary', value: config.typography.textSecondary },
      { key: 'textLink', value: config.typography.textLink },
    ];

    typographyColors.forEach(({ key, value }) => {
      if (value && !isValidColor(value)) {
        errors.push({
          field: `typography.${key}`,
          value: String(value),
          message: `Invalid color format: ${value}. Expected hex (#RRGGBB), rgb(), or hsl()`,
        });
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Theme validation result
 */
export interface ThemeValidationResult {
  valid: boolean;
  colorFormatErrors: ColorValidationResult['errors'];
  contrastIssues: ContrastIssue[];
  warnings: string[];
}

/**
 * Validate a theme configuration
 * Checks both color format and contrast compliance
 *
 * @param config Theme configuration object
 * @param options Validation options
 * @returns Validation result with errors and warnings
 */
export function validateThemeConfig(
  config: {
    colors?: Record<string, unknown>;
    primary_color?: string;
    secondary_color?: string;
    danger_color?: string;
    warning_color?: string;
    info_color?: string;
    success_color?: string;
    typography?: {
      textHeading?: string;
      textSubheading?: string;
      textBody?: string;
      textSecondary?: string;
      textLink?: string;
    };
  },
  options: {
    strictContrast?: boolean; // If true, fails on any contrast issue
    logWarnings?: boolean; // If true, logs warnings for contrast issues
  } = {}
): ThemeValidationResult {
  const { strictContrast = false, logWarnings = true } = options;

  // Validate color formats
  const colorValidation = validateThemeColors(config);

  // Validate contrasts (only if color formats are valid)
  let contrastIssues: ContrastIssue[] = [];
  if (colorValidation.valid) {
    contrastIssues = getContrastIssues(config);
  }

  // Generate warnings
  const warnings: string[] = [];

  if (colorValidation.errors.length > 0) {
    warnings.push(
      `Found ${colorValidation.errors.length} color format error(s). Contrast validation skipped.`
    );
  }

  if (contrastIssues.length > 0) {
    const failCount = contrastIssues.filter((issue) => issue.level === 'fail').length;
    const aaLargeCount = contrastIssues.filter((issue) => issue.level === 'AA Large').length;

    if (failCount > 0) {
      warnings.push(`Found ${failCount} contrast issue(s) that do not meet WCAG requirements.`);
    }

    if (aaLargeCount > 0) {
      warnings.push(
        `Found ${aaLargeCount} contrast issue(s) that only meet WCAG AA for large text.`
      );
    }

    if (logWarnings) {
      contrastIssues.forEach((issue) => {
        logger.warn(`[Theme Validation] ${issue.message}`);
      });
    }
  }

  // Determine if theme is valid
  const valid =
    colorValidation.valid &&
    (strictContrast
      ? contrastIssues.length === 0
      : contrastIssues.filter((issue) => issue.level === 'fail').length === 0);

  return {
    valid,
    colorFormatErrors: colorValidation.errors,
    contrastIssues,
    warnings,
  };
}

/**
 * Get summary of validation issues
 *
 * @param result Validation result
 * @returns Human-readable summary
 */
export function getValidationSummary(result: ThemeValidationResult): string {
  const parts: string[] = [];

  if (result.valid) {
    parts.push('✅ Theme configuration is valid');
  } else {
    parts.push('❌ Theme configuration has issues');
  }

  if (result.colorFormatErrors.length > 0) {
    parts.push(`\nColor Format Errors (${result.colorFormatErrors.length}):`);
    result.colorFormatErrors.forEach((error: ColorValidationResult['errors'][0]) => {
      parts.push(`  - ${error.field}: ${error.message}`);
    });
  }

  if (result.contrastIssues.length > 0) {
    parts.push(`\nContrast Issues (${result.contrastIssues.length}):`);
    result.contrastIssues.forEach((issue) => {
      parts.push(`  - ${issue.element}: ${issue.message} (ratio: ${issue.ratio}:1)`);
    });
  }

  if (result.warnings.length > 0) {
    parts.push(`\nWarnings (${result.warnings.length}):`);
    result.warnings.forEach((warning) => {
      parts.push(`  - ${warning}`);
    });
  }

  return parts.join('\n');
}
