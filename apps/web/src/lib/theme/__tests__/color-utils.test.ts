import { describe, it, expect } from 'vitest';
import { generateColorShades, generateRgb } from '../color-utils';

describe('generateColorShades', () => {
  it('generates all shade levels from 50 to 950', () => {
    const shades = generateColorShades('#3b82f6');
    expect(shades).toHaveProperty('50');
    expect(shades).toHaveProperty('100');
    expect(shades).toHaveProperty('200');
    expect(shades).toHaveProperty('300');
    expect(shades).toHaveProperty('400');
    expect(shades).toHaveProperty('500');
    expect(shades).toHaveProperty('600');
    expect(shades).toHaveProperty('700');
    expect(shades).toHaveProperty('800');
    expect(shades).toHaveProperty('900');
    expect(shades).toHaveProperty('950');
  });

  it('returns base color for 500 shade', () => {
    const baseColor = '#3b82f6';
    const shades = generateColorShades(baseColor);
    expect(shades[500]).toBe(baseColor);
  });

  it('generates lighter shades for 50-400', () => {
    const baseColor = '#000000';
    const shades = generateColorShades(baseColor);

    // Lighter shades should have higher hex values
    expect(shades[50]).not.toBe(baseColor);
    expect(shades[100]).not.toBe(baseColor);
    expect(shades[200]).not.toBe(baseColor);
    expect(shades[300]).not.toBe(baseColor);
    expect(shades[400]).not.toBe(baseColor);
  });

  it('generates darker shades for 600-950', () => {
    const baseColor = '#ffffff';
    const shades = generateColorShades(baseColor);

    // Darker shades should have lower hex values
    expect(shades[600]).not.toBe(baseColor);
    expect(shades[700]).not.toBe(baseColor);
    expect(shades[800]).not.toBe(baseColor);
    expect(shades[900]).not.toBe(baseColor);
    expect(shades[950]).not.toBe(baseColor);
  });

  it('generates valid hex colors', () => {
    const shades = generateColorShades('#3b82f6');
    Object.values(shades).forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('handles color without hash prefix', () => {
    const shades = generateColorShades('3b82f6');
    expect(shades[500]).toBe('#3b82f6');
  });
});

describe('generateRgb', () => {
  it('converts hex to RGB string', () => {
    expect(generateRgb('#000000')).toBe('0, 0, 0');
    expect(generateRgb('#ffffff')).toBe('255, 255, 255');
    expect(generateRgb('#ff0000')).toBe('255, 0, 0');
    expect(generateRgb('#00ff00')).toBe('0, 255, 0');
    expect(generateRgb('#0000ff')).toBe('0, 0, 255');
  });

  it('handles color without hash prefix', () => {
    expect(generateRgb('000000')).toBe('0, 0, 0');
    expect(generateRgb('ffffff')).toBe('255, 255, 255');
  });

  it('returns default RGB for invalid color', () => {
    expect(generateRgb('invalid')).toBe('0, 0, 0');
    expect(generateRgb('')).toBe('0, 0, 0');
    expect(generateRgb('#gggggg')).toBe('0, 0, 0');
  });

  it('handles mixed case hex', () => {
    expect(generateRgb('#FF0000')).toBe('255, 0, 0');
    expect(generateRgb('#ff00FF')).toBe('255, 0, 255');
  });
});
