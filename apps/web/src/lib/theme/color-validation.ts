/**
 * Color Validation Utilities
 * Functions to validate and normalize color formats (hex, rgb, hsl)
 */

import { rgbToHex } from './contrast-utils';

/**
 * Validate hex color format
 * Supports: #RGB, #RRGGBB, RGB, RRGGBB
 *
 * @param color Color string to validate
 * @returns true if valid hex color
 */
export function isValidHexColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }

  const cleanColor = color.trim();

  // Remove hash if present
  const hex = cleanColor.startsWith('#') ? cleanColor.slice(1) : cleanColor;

  // Check 3-digit hex (#RGB)
  if (hex.length === 3) {
    return /^[0-9a-f]{3}$/i.test(hex);
  }

  // Check 6-digit hex (#RRGGBB)
  if (hex.length === 6) {
    return /^[0-9a-f]{6}$/i.test(hex);
  }

  return false;
}

/**
 * Validate RGB color format
 * Supports: rgb(255, 255, 255), rgba(255, 255, 255, 0.5), 255,255,255
 *
 * @param color Color string to validate
 * @returns true if valid RGB color
 */
export function isValidRgbColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }

  const cleanColor = color.trim();

  // Check rgb() or rgba() format
  const rgbMatch = cleanColor.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)$/i
  );
  if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);

    return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
  }

  // Check comma-separated format (255,255,255)
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
 * Supports: hsl(360, 100%, 50%), hsla(360, 100%, 50%, 0.5)
 *
 * @param color Color string to validate
 * @returns true if valid HSL color
 */
export function isValidHslColor(color: string): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }

  const cleanColor = color.trim();

  // Check hsl() or hsla() format
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
 *
 * @param color Color string to validate
 * @returns true if valid color in any format
 */
export function isValidColor(color: string): boolean {
  return isValidHexColor(color) || isValidRgbColor(color) || isValidHslColor(color);
}

/**
 * Normalize color to hex format
 * Converts rgb/rgba/hsl/hsla to hex
 *
 * @param color Color in any format
 * @returns Hex color (#RRGGBB) or null if invalid
 */
export function normalizeColor(color: string): string | null {
  if (!color || typeof color !== 'string') {
    return null;
  }

  const cleanColor = color.trim();

  // If already hex, validate and return
  if (isValidHexColor(cleanColor)) {
    const hex = cleanColor.startsWith('#') ? cleanColor.slice(1) : cleanColor;

    // Expand 3-digit to 6-digit
    if (hex.length === 3) {
      return (
        '#' +
        hex
          .split('')
          .map((c) => c + c)
          .join('')
      );
    }

    return '#' + hex;
  }

  // Convert RGB to hex
  if (isValidRgbColor(cleanColor)) {
    const rgbMatch =
      cleanColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i) ||
      cleanColor.match(/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*$/);

    if (rgbMatch && rgbMatch[1] && rgbMatch[2] && rgbMatch[3]) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      return rgbToHex(r, g, b);
    }
  }

  // Convert HSL to hex (via RGB)
  if (isValidHslColor(cleanColor)) {
    const hslMatch = cleanColor.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/i);
    if (hslMatch && hslMatch[1] && hslMatch[2] && hslMatch[3]) {
      const h = parseInt(hslMatch[1], 10) / 360;
      const s = parseInt(hslMatch[2], 10) / 100;
      const l = parseInt(hslMatch[3], 10) / 100;

      // Convert HSL to RGB
      const rgb = hslToRgb(h, s, l);
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    }
  }

  return null;
}

/**
 * Convert HSL to RGB
 * Helper function for normalizeColor
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Validate theme configuration colors
 * Checks all color fields in a theme config
 *
 * @param config Theme configuration object
 * @returns Object with validation results
 */
export interface ColorValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    value: string;
    message: string;
  }>;
}

export function validateThemeColors(config: {
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

  // Check flat color fields
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

  // Check nested colors object
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

  // Check typography colors
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
