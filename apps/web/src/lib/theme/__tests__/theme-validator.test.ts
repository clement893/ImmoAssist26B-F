import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateThemeConfig,
  getValidationSummary,
  ThemeValidationResult,
} from '../theme-validator';

describe('validateThemeConfig', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates valid theme configuration', () => {
    const config = {
      colors: {
        background: '#ffffff',
        foreground: '#000000',
        primary: '#2563eb',
        danger: '#dc2626',
      },
      typography: {
        textHeading: '#0f172a',
        textBody: '#1e293b',
        textLink: '#2563eb',
      },
    };

    const result = validateThemeConfig(config);
    expect(result.valid).toBe(true);
    expect(result.colorFormatErrors.length).toBe(0);
    expect(result.contrastIssues.length).toBe(0);
  });

  it('detects color format errors', () => {
    const config = {
      primary_color: 'invalid',
      colors: {
        background: '#ffffff',
      },
    };

    const result = validateThemeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.colorFormatErrors.length).toBeGreaterThan(0);
    expect(result.contrastIssues.length).toBe(0); // Contrast validation skipped
  });

  it('detects contrast issues', () => {
    const config = {
      colors: {
        background: '#ffffff',
      },
      typography: {
        textHeading: '#cccccc', // Low contrast
        textBody: '#dddddd', // Low contrast
      },
    };

    const result = validateThemeConfig(config);
    expect(result.valid).toBe(false);
    expect(result.contrastIssues.length).toBeGreaterThan(0);
  });

  it('fails in strict mode with any contrast issue', () => {
    const config = {
      colors: {
        background: '#ffffff',
      },
      typography: {
        textHeading: '#cccccc', // Low contrast, does not meet AA
      },
    };

    const result = validateThemeConfig(config, { strictContrast: true });
    expect(result.valid).toBe(false);
  });

  it('passes in non-strict mode with AA Large contrast', () => {
    const config = {
      colors: {
        background: '#ffffff',
      },
      typography: {
        textHeading: '#767676', // Meets AA Large but not AA
      },
    };

    const result = validateThemeConfig(config, { strictContrast: false });
    // Should pass if no 'fail' level issues
    const hasFailIssues = result.contrastIssues.some((issue) => issue.level === 'fail');
    expect(result.valid).toBe(!hasFailIssues);
  });

  it('logs warnings when logWarnings is true', () => {
    const config = {
      colors: {
        background: '#ffffff',
      },
      typography: {
        textHeading: '#cccccc', // Low contrast
      },
    };

    validateThemeConfig(config, { logWarnings: true });
    expect(console.warn).toHaveBeenCalled();
  });

  it('does not log warnings when logWarnings is false', () => {
    const config = {
      colors: {
        background: '#ffffff',
      },
      typography: {
        textHeading: '#cccccc', // Low contrast
      },
    };

    validateThemeConfig(config, { logWarnings: false });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('generates warnings for contrast issues', () => {
    const config = {
      colors: {
        background: '#ffffff',
      },
      typography: {
        textHeading: '#cccccc', // Low contrast
      },
    };

    const result = validateThemeConfig(config);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('contrast'))).toBe(true);
  });

  it('skips contrast validation if color format is invalid', () => {
    const config = {
      primary_color: 'invalid',
      colors: {
        background: '#ffffff',
      },
      typography: {
        textHeading: '#cccccc',
      },
    };

    const result = validateThemeConfig(config);
    expect(result.colorFormatErrors.length).toBeGreaterThan(0);
    expect(result.contrastIssues.length).toBe(0);
    expect(result.warnings.some((w) => w.includes('skipped'))).toBe(true);
  });
});

describe('getValidationSummary', () => {
  it('generates summary for valid theme', () => {
    const result: ThemeValidationResult = {
      valid: true,
      colorFormatErrors: [],
      contrastIssues: [],
      warnings: [],
    };

    const summary = getValidationSummary(result);
    expect(summary).toContain('✅');
    expect(summary).toContain('valid');
  });

  it('generates summary for invalid theme', () => {
    const result: ThemeValidationResult = {
      valid: false,
      colorFormatErrors: [
        {
          field: 'primary_color',
          value: 'invalid',
          message: 'Invalid color format',
        },
      ],
      contrastIssues: [],
      warnings: [],
    };

    const summary = getValidationSummary(result);
    expect(summary).toContain('❌');
    expect(summary).toContain('Color Format Errors');
    expect(summary).toContain('primary_color');
  });

  it('includes contrast issues in summary', () => {
    const result: ThemeValidationResult = {
      valid: false,
      colorFormatErrors: [],
      contrastIssues: [
        {
          type: 'text',
          element: 'textHeading',
          foreground: '#cccccc',
          background: '#ffffff',
          ratio: 1.6,
          required: 4.5,
          level: 'fail',
          message: 'Contrast ratio too low',
        },
      ],
      warnings: [],
    };

    const summary = getValidationSummary(result);
    expect(summary).toContain('Contrast Issues');
    expect(summary).toContain('textHeading');
    expect(summary).toContain('1.6:1');
  });

  it('includes warnings in summary', () => {
    const result: ThemeValidationResult = {
      valid: false,
      colorFormatErrors: [],
      contrastIssues: [],
      warnings: ['Test warning'],
    };

    const summary = getValidationSummary(result);
    expect(summary).toContain('Warnings');
    expect(summary).toContain('Test warning');
  });
});
