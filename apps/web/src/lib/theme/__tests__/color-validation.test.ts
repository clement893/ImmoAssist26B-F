import { describe, it, expect } from 'vitest';
import {
  isValidHexColor,
  isValidRgbColor,
  isValidHslColor,
  isValidColor,
  normalizeColor,
  validateThemeColors,
} from '../color-validation';

describe('isValidHexColor', () => {
  it('validates 6-digit hex with hash', () => {
    expect(isValidHexColor('#000000')).toBe(true);
    expect(isValidHexColor('#ffffff')).toBe(true);
    expect(isValidHexColor('#ff0000')).toBe(true);
    expect(isValidHexColor('#00ff00')).toBe(true);
    expect(isValidHexColor('#0000ff')).toBe(true);
  });

  it('validates 6-digit hex without hash', () => {
    expect(isValidHexColor('000000')).toBe(true);
    expect(isValidHexColor('ffffff')).toBe(true);
    expect(isValidHexColor('ff0000')).toBe(true);
  });

  it('validates 3-digit hex with hash', () => {
    expect(isValidHexColor('#000')).toBe(true);
    expect(isValidHexColor('#fff')).toBe(true);
    expect(isValidHexColor('#f00')).toBe(true);
  });

  it('validates 3-digit hex without hash', () => {
    expect(isValidHexColor('000')).toBe(true);
    expect(isValidHexColor('fff')).toBe(true);
    expect(isValidHexColor('f00')).toBe(true);
  });

  it('rejects invalid hex colors', () => {
    expect(isValidHexColor('invalid')).toBe(false);
    expect(isValidHexColor('#gggggg')).toBe(false);
    expect(isValidHexColor('#12345')).toBe(false);
    expect(isValidHexColor('#1234567')).toBe(false);
    expect(isValidHexColor('')).toBe(false);
    expect(isValidHexColor(null as any)).toBe(false);
    expect(isValidHexColor(undefined as any)).toBe(false);
  });

  it('handles case insensitive hex', () => {
    expect(isValidHexColor('#FF0000')).toBe(true);
    expect(isValidHexColor('#ff0000')).toBe(true);
    expect(isValidHexColor('#Ff0000')).toBe(true);
  });
});

describe('isValidRgbColor', () => {
  it('validates rgb() format', () => {
    expect(isValidRgbColor('rgb(255, 255, 255)')).toBe(true);
    expect(isValidRgbColor('rgb(0, 0, 0)')).toBe(true);
    expect(isValidRgbColor('rgb(255, 0, 0)')).toBe(true);
  });

  it('validates rgba() format', () => {
    expect(isValidRgbColor('rgba(255, 255, 255, 0.5)')).toBe(true);
    expect(isValidRgbColor('rgba(0, 0, 0, 1)')).toBe(true);
  });

  it('validates comma-separated format', () => {
    expect(isValidRgbColor('255, 255, 255')).toBe(true);
    expect(isValidRgbColor('0, 0, 0')).toBe(true);
    expect(isValidRgbColor('255,0,0')).toBe(true);
  });

  it('rejects invalid RGB colors', () => {
    expect(isValidRgbColor('rgb(256, 0, 0)')).toBe(false); // Out of range
    expect(isValidRgbColor('rgb(-1, 0, 0)')).toBe(false); // Out of range
    expect(isValidRgbColor('rgb(255, 0)')).toBe(false); // Missing component
    expect(isValidRgbColor('invalid')).toBe(false);
    expect(isValidRgbColor('')).toBe(false);
    expect(isValidRgbColor(null as any)).toBe(false);
  });

  it('handles whitespace variations', () => {
    expect(isValidRgbColor('rgb(255,255,255)')).toBe(true);
    expect(isValidRgbColor('rgb( 255 , 255 , 255 )')).toBe(true);
  });
});

describe('isValidHslColor', () => {
  it('validates hsl() format', () => {
    expect(isValidHslColor('hsl(360, 100%, 50%)')).toBe(true);
    expect(isValidHslColor('hsl(0, 0%, 0%)')).toBe(true);
    expect(isValidHslColor('hsl(180, 50%, 50%)')).toBe(true);
  });

  it('validates hsla() format', () => {
    expect(isValidHslColor('hsla(360, 100%, 50%, 0.5)')).toBe(true);
    expect(isValidHslColor('hsla(0, 0%, 0%, 1)')).toBe(true);
  });

  it('rejects invalid HSL colors', () => {
    expect(isValidHslColor('hsl(361, 0%, 0%)')).toBe(false); // Hue out of range
    expect(isValidHslColor('hsl(0, 101%, 0%)')).toBe(false); // Saturation out of range
    expect(isValidHslColor('hsl(0, 0%, 101%)')).toBe(false); // Lightness out of range
    expect(isValidHslColor('hsl(0, 0%)')).toBe(false); // Missing component
    expect(isValidHslColor('invalid')).toBe(false);
    expect(isValidHslColor('')).toBe(false);
    expect(isValidHslColor(null as any)).toBe(false);
  });

  it('handles whitespace variations', () => {
    expect(isValidHslColor('hsl(360,100%,50%)')).toBe(true);
    expect(isValidHslColor('hsl( 360 , 100% , 50% )')).toBe(true);
  });
});

describe('isValidColor', () => {
  it('validates hex colors', () => {
    expect(isValidColor('#000000')).toBe(true);
    expect(isValidColor('#fff')).toBe(true);
  });

  it('validates RGB colors', () => {
    expect(isValidColor('rgb(255, 255, 255)')).toBe(true);
    expect(isValidColor('rgba(255, 255, 255, 0.5)')).toBe(true);
  });

  it('validates HSL colors', () => {
    expect(isValidColor('hsl(360, 100%, 50%)')).toBe(true);
    expect(isValidColor('hsla(360, 100%, 50%, 0.5)')).toBe(true);
  });

  it('rejects invalid colors', () => {
    expect(isValidColor('invalid')).toBe(false);
    expect(isValidColor('')).toBe(false);
    expect(isValidColor(null as any)).toBe(false);
  });
});

describe('normalizeColor', () => {
  it('normalizes hex colors', () => {
    expect(normalizeColor('#000000')).toBe('#000000');
    expect(normalizeColor('#fff')).toBe('#ffffff');
    expect(normalizeColor('fff')).toBe('#ffffff');
    expect(normalizeColor('000')).toBe('#000000');
  });

  it('normalizes RGB colors to hex', () => {
    expect(normalizeColor('rgb(0, 0, 0)')).toBe('#000000');
    expect(normalizeColor('rgb(255, 255, 255)')).toBe('#ffffff');
    expect(normalizeColor('rgb(255, 0, 0)')).toBe('#ff0000');
    expect(normalizeColor('rgba(255, 0, 0, 0.5)')).toBe('#ff0000');
  });

  it('normalizes comma-separated RGB to hex', () => {
    expect(normalizeColor('0, 0, 0')).toBe('#000000');
    expect(normalizeColor('255, 255, 255')).toBe('#ffffff');
  });

  it('normalizes HSL colors to hex', () => {
    // hsl(0, 0%, 0%) should be black
    expect(normalizeColor('hsl(0, 0%, 0%)')).toBe('#000000');
    // hsl(0, 0%, 100%) should be white
    expect(normalizeColor('hsl(0, 0%, 100%)')).toBe('#ffffff');
    // hsl(0, 100%, 50%) should be red
    expect(normalizeColor('hsl(0, 100%, 50%)')).toBe('#ff0000');
  });

  it('returns null for invalid colors', () => {
    expect(normalizeColor('invalid')).toBeNull();
    expect(normalizeColor('')).toBeNull();
    expect(normalizeColor(null as any)).toBeNull();
  });

  it('handles whitespace', () => {
    expect(normalizeColor('  #000000  ')).toBe('#000000');
    expect(normalizeColor('  rgb(255, 255, 255)  ')).toBe('#ffffff');
  });
});

describe('validateThemeColors', () => {
  it('validates valid theme colors', () => {
    const config = {
      primary_color: '#2563eb',
      secondary_color: '#6366f1',
      colors: {
        background: '#ffffff',
        foreground: '#000000',
      },
      typography: {
        textHeading: '#0f172a',
        textBody: '#1e293b',
      },
    };

    const result = validateThemeColors(config);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('detects invalid flat color fields', () => {
    const config = {
      primary_color: 'invalid',
      secondary_color: '#6366f1',
    };

    const result = validateThemeColors(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.field === 'primary_color')).toBe(true);
  });

  it('detects invalid nested colors', () => {
    const config = {
      colors: {
        background: 'invalid',
        foreground: '#000000',
      },
    };

    const result = validateThemeColors(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'colors.background')).toBe(true);
  });

  it('detects invalid typography colors', () => {
    const config = {
      typography: {
        textHeading: 'invalid',
        textBody: '#1e293b',
      },
    };

    const result = validateThemeColors(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'typography.textHeading')).toBe(true);
  });

  it('validates multiple color formats', () => {
    const config = {
      primary_color: '#2563eb',
      secondary_color: 'rgb(99, 102, 241)',
      danger_color: 'hsl(0, 84%, 60%)',
    };

    const result = validateThemeColors(config);
    expect(result.valid).toBe(true);
  });

  it('includes error messages', () => {
    const config = {
      primary_color: 'invalid',
    };

    const result = validateThemeColors(config);
    expect(result.errors[0].message).toContain('Invalid color format');
    expect(result.errors[0].value).toBe('invalid');
  });
});
