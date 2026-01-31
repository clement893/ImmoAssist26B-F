/**
 * Color utilities for theme management
 * Generates color shades from base colors
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    return null;
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
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
 * Generate color shades from a base color using HSL-based approach
 * This preserves hue and saturation while adjusting lightness
 * Returns an object with shades from 50 (lightest) to 950 (darkest)
 *
 * Uses Tailwind-like color scale:
 * - 50: Very light (95% lightness)
 * - 100: Light (90% lightness)
 * - 200: Lighter (80% lightness)
 * - 300: Light (70% lightness)
 * - 400: Medium-light (60% lightness)
 * - 500: Base color (original lightness)
 * - 600: Medium-dark (40% lightness)
 * - 700: Dark (30% lightness)
 * - 800: Darker (20% lightness)
 * - 900: Very dark (10% lightness)
 * - 950: Darkest (5% lightness)
 */
export function generateColorShades(baseColor: string): {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
} {
  const rgb = hexToRgb(baseColor);
  if (!rgb) {
    // Fallback if color parsing fails
    return {
      50: baseColor,
      100: baseColor,
      200: baseColor,
      300: baseColor,
      400: baseColor,
      500: baseColor,
      600: baseColor,
      700: baseColor,
      800: baseColor,
      900: baseColor,
      950: baseColor,
    };
  }

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const baseLightness = hsl.l;
  const baseSaturation = hsl.s;
  const baseHue = hsl.h;

  // Improved saturation adjustment for better contrast
  // Ensures lighter shades have enough saturation for visibility
  // and darker shades have rich, vibrant colors
  const adjustSaturation = (lightness: number, targetLightness: number): number => {
    if (targetLightness > lightness) {
      // Lighter shades: maintain minimum saturation for contrast
      // For very light shades (90+), maintain higher saturation for better contrast
      if (targetLightness >= 90) {
        // Keep at least 30% saturation for very light shades to ensure visibility
        const reduction = (targetLightness - lightness) / 200; // Even less aggressive reduction
        return Math.max(30, baseSaturation * (1 - reduction * 0.5)); // Minimum 30% saturation
      } else {
        // For medium-light shades, reduce more gradually
        const reduction = (targetLightness - lightness) / 150;
        return Math.max(25, baseSaturation * (1 - reduction)); // Minimum 25% saturation
      }
    } else {
      // Darker shades: increase saturation for richer colors
      return Math.min(100, baseSaturation * (1 + (lightness - targetLightness) / 150));
    }
  };

  const generateShade = (targetLightness: number): string => {
    const adjustedSaturation = adjustSaturation(baseLightness, targetLightness);
    const shadeRgb = hslToRgb(baseHue, adjustedSaturation, targetLightness);
    return rgbToHex(shadeRgb.r, shadeRgb.g, shadeRgb.b);
  };

  // Improved lightness values for better contrast
  // Increased gaps between shades for better contrast
  return {
    50: generateShade(98), // Very light (increased for maximum contrast)
    100: generateShade(93), // Light (increased gap from 50)
    200: generateShade(86), // Lighter (increased gap from 100)
    300: generateShade(76), // Light (increased gap from 200)
    400: generateShade(66), // Medium-light (increased gap from 300)
    500: baseColor, // Base color (original)
    600: generateShade(46), // Medium-dark (increased gap from 500)
    700: generateShade(36), // Dark (increased gap from 600)
    800: generateShade(26), // Darker (increased gap from 700)
    900: generateShade(16), // Very dark (increased gap from 800)
    950: generateShade(9), // Darkest (increased gap from 900)
  };
}

/**
 * Generate RGB values from hex color
 */
export function generateRgb(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return '0, 0, 0';
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}
