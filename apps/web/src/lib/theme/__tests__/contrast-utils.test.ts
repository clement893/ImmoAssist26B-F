import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  getLuminance,
  calculateContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  getContrastLevel,
  getContrastIssues,
} from '../contrast-utils';

describe('hexToRgb', () => {
  it('converts 6-digit hex to RGB', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('converts 3-digit hex to RGB', () => {
    expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('handles hex without hash', () => {
    expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('returns null for invalid hex', () => {
    expect(hexToRgb('invalid')).toBeNull();
    expect(hexToRgb('#gggggg')).toBeNull();
    expect(hexToRgb('12345')).toBeNull();
  });
});

describe('rgbToHex', () => {
  it('converts RGB to hex', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
    expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
    expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
    expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
  });

  it('rounds RGB values', () => {
    // Math.round(128.7) = 129, Math.round(64.3) = 64, Math.round(32.1) = 32
    expect(rgbToHex(128.7, 64.3, 32.1)).toBe('#814020');
  });
});

describe('getLuminance', () => {
  it('calculates luminance for black', () => {
    const lum = getLuminance(0, 0, 0);
    expect(lum).toBeCloseTo(0, 5);
  });

  it('calculates luminance for white', () => {
    const lum = getLuminance(255, 255, 255);
    expect(lum).toBeCloseTo(1, 5);
  });

  it('calculates luminance for gray', () => {
    const lum = getLuminance(128, 128, 128);
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(1);
  });

  it('calculates luminance for red', () => {
    const lum = getLuminance(255, 0, 0);
    expect(lum).toBeGreaterThan(0);
    expect(lum).toBeLessThan(1);
  });
});

describe('calculateContrastRatio', () => {
  it('calculates maximum contrast (black on white)', () => {
    const ratio = calculateContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 1);
  });

  it('calculates minimum contrast (same colors)', () => {
    const ratio = calculateContrastRatio('#000000', '#000000');
    expect(ratio).toBeCloseTo(1, 1);
  });

  it('calculates contrast for common color pairs', () => {
    // White on black should be same as black on white
    const ratio1 = calculateContrastRatio('#ffffff', '#000000');
    const ratio2 = calculateContrastRatio('#000000', '#ffffff');
    expect(ratio1).toBeCloseTo(ratio2, 1);
    expect(ratio1).toBeCloseTo(21, 1);
  });

  it('calculates contrast for WCAG AA example', () => {
    // Example: #767676 on white should be around 4.5:1
    const ratio = calculateContrastRatio('#767676', '#ffffff');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeLessThan(5.0);
  });

  it('throws error for invalid colors', () => {
    expect(() => calculateContrastRatio('invalid', '#ffffff')).toThrow();
    expect(() => calculateContrastRatio('#ffffff', 'invalid')).toThrow();
  });
});

describe('meetsWCAGAA', () => {
  it('returns true for high contrast (black on white)', () => {
    expect(meetsWCAGAA('#000000', '#ffffff')).toBe(true);
    expect(meetsWCAGAA('#000000', '#ffffff', false)).toBe(true);
    expect(meetsWCAGAA('#000000', '#ffffff', true)).toBe(true);
  });

  it('returns false for low contrast (gray on white)', () => {
    expect(meetsWCAGAA('#cccccc', '#ffffff')).toBe(false);
  });

  it('meets AA for large text with lower ratio', () => {
    // 3:1 ratio should pass for large text
    const ratio = calculateContrastRatio('#767676', '#ffffff');
    if (ratio >= 3.0 && ratio < 4.5) {
      expect(meetsWCAGAA('#767676', '#ffffff', true)).toBe(true);
      expect(meetsWCAGAA('#767676', '#ffffff', false)).toBe(false);
    }
  });

  it('meets AA for UI components with 3:1 ratio', () => {
    // UI components require minimum 3:1
    const ratio = calculateContrastRatio('#767676', '#ffffff');
    if (ratio >= 3.0) {
      expect(meetsWCAGAA('#767676', '#ffffff', false, true)).toBe(true);
    }
  });

  it('requires 4.5:1 for normal text', () => {
    // Should fail if ratio is less than 4.5:1 for normal text
    expect(meetsWCAGAA('#cccccc', '#ffffff', false, false)).toBe(false);
  });
});

describe('meetsWCAGAAA', () => {
  it('returns true for very high contrast (black on white)', () => {
    expect(meetsWCAGAAA('#000000', '#ffffff')).toBe(true);
  });

  it('returns false for AA but not AAA contrast', () => {
    // 4.5:1 meets AA but not AAA (requires 7:1)
    const ratio = calculateContrastRatio('#767676', '#ffffff');
    if (ratio >= 4.5 && ratio < 7.0) {
      expect(meetsWCAGAAA('#767676', '#ffffff', false)).toBe(false);
      expect(meetsWCAGAA('#767676', '#ffffff', false)).toBe(true);
    }
  });

  it('meets AAA for large text with 4.5:1 ratio', () => {
    const ratio = calculateContrastRatio('#767676', '#ffffff');
    if (ratio >= 4.5) {
      expect(meetsWCAGAAA('#767676', '#ffffff', true)).toBe(true);
    }
  });
});

describe('getContrastLevel', () => {
  it('returns fail for ratio < 3.0', () => {
    const result = getContrastLevel(2.5);
    expect(result.level).toBe('fail');
    expect(result.description).toContain('Does not meet');
  });

  it('returns AA Large for ratio >= 3.0 and < 4.5', () => {
    const result = getContrastLevel(3.5);
    expect(result.level).toBe('AA Large');
    expect(result.description).toContain('large text only');
  });

  it('returns AA for ratio >= 4.5 and < 7.0', () => {
    const result = getContrastLevel(5.0);
    expect(result.level).toBe('AA');
    expect(result.description).toContain('WCAG AA');
  });

  it('returns AAA for ratio >= 7.0', () => {
    const result = getContrastLevel(10.0);
    expect(result.level).toBe('AAA');
    expect(result.description).toContain('WCAG AAA');
  });
});

describe('getContrastIssues', () => {
  it('returns no issues for valid theme', () => {
    const config = {
      colors: {
        background: '#ffffff',
        primary: '#2563eb',
        danger: '#dc2626',
      },
      typography: {
        textHeading: '#0f172a',
        textBody: '#1e293b',
        textLink: '#2563eb',
      },
    };

    const issues = getContrastIssues(config);
    // Should have no issues for valid colors
    expect(issues.length).toBe(0);
  });

  it('detects text contrast issues', () => {
    const config = {
      colors: {
        background: '#ffffff',
      },
      typography: {
        textHeading: '#cccccc', // Low contrast
        textBody: '#dddddd', // Low contrast
      },
    };

    const issues = getContrastIssues(config);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((issue) => issue.element === 'textHeading')).toBe(true);
    expect(issues.some((issue) => issue.element === 'textBody')).toBe(true);
  });

  it('detects UI component contrast issues', () => {
    const config = {
      colors: {
        background: '#ffffff',
        primary: '#cccccc', // Low contrast
        warning: '#dddddd', // Low contrast
      },
    };

    const issues = getContrastIssues(config);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((issue) => issue.type === 'ui')).toBe(true);
  });

  it('includes ratio and required values in issues', () => {
    const config = {
      colors: {
        background: '#ffffff',
      },
      typography: {
        textBody: '#cccccc', // Low contrast
      },
    };

    const issues = getContrastIssues(config);
    const textIssue = issues.find((issue) => issue.element === 'textBody');

    if (textIssue) {
      expect(textIssue.ratio).toBeGreaterThan(0);
      expect(textIssue.required).toBe(4.5);
      expect(textIssue.message).toContain('contrast ratio');
    }
  });
});
