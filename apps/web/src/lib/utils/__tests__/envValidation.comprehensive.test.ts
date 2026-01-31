/**
 * Comprehensive Tests for Environment Validation
 * Tests all functions and edge cases
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateEnvironmentVariables,
  validateAndLogEnvironmentVariables,
  getEnvVar,
  getBooleanEnvVar,
  getNumberEnvVar,
} from '../envValidation';

describe('Environment Validation', () => {
  beforeEach(() => {
    // Reset environment variables before each test
    delete process.env.TEST_VAR;
    delete process.env.TEST_BOOL;
    delete process.env.TEST_NUM;
  });

  describe('validateEnvironmentVariables', () => {
    it('should validate required variables', () => {
      const configs = [
        {
          name: 'TEST_VAR',
          required: true,
        },
      ];

      const result = validateEnvironmentVariables(configs);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should pass validation when required variable is set', () => {
      process.env.TEST_VAR = 'test-value';

      const configs = [
        {
          name: 'TEST_VAR',
          required: true,
        },
      ];

      const result = validateEnvironmentVariables(configs);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should validate with custom validation function', () => {
      process.env.TEST_VAR = 'invalid-url';

      const configs = [
        {
          name: 'TEST_VAR',
          required: true,
          validate: (value: string) => {
            try {
              new URL(value);
              return true;
            } catch {
              return false;
            }
          },
          errorMessage: 'Must be a valid URL',
        },
      ];

      const result = validateEnvironmentVariables(configs);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Must be a valid URL'))).toBe(true);
    });

    it('should use default value when variable is not set', () => {
      const configs = [
        {
          name: 'TEST_VAR',
          required: false,
          defaultValue: 'default-value',
        },
      ];

      const result = validateEnvironmentVariables(configs);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle multiple variables', () => {
      process.env.TEST_VAR1 = 'value1';
      process.env.TEST_VAR2 = 'value2';

      const configs = [
        { name: 'TEST_VAR1', required: true },
        { name: 'TEST_VAR2', required: true },
        { name: 'TEST_VAR3', required: false },
      ];

      const result = validateEnvironmentVariables(configs);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateAndLogEnvironmentVariables', () => {
    it('should log warnings for missing optional variables', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const configs = [
        {
          name: 'TEST_VAR',
          required: false,
          defaultValue: 'default',
        },
      ];

      validateAndLogEnvironmentVariables(configs);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should throw error in production when validation fails', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const configs = [
        {
          name: 'TEST_VAR',
          required: true,
        },
      ];

      expect(() => {
        validateAndLogEnvironmentVariables(configs);
      }).toThrow();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('getEnvVar', () => {
    it('should return environment variable value', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getEnvVar('TEST_VAR')).toBe('test-value');
    });

    it('should return default value when variable is not set', () => {
      expect(getEnvVar('TEST_VAR', 'default-value')).toBe('default-value');
    });

    it('should throw error when variable is not set and no default', () => {
      expect(() => {
        getEnvVar('TEST_VAR');
      }).toThrow('Environment variable TEST_VAR is not set');
    });
  });

  describe('getBooleanEnvVar', () => {
    it('should return true for "true"', () => {
      process.env.TEST_BOOL = 'true';
      expect(getBooleanEnvVar('TEST_BOOL')).toBe(true);
    });

    it('should return true for "1"', () => {
      process.env.TEST_BOOL = '1';
      expect(getBooleanEnvVar('TEST_BOOL')).toBe(true);
    });

    it('should return false for "false"', () => {
      process.env.TEST_BOOL = 'false';
      expect(getBooleanEnvVar('TEST_BOOL')).toBe(false);
    });

    it('should return false for "0"', () => {
      process.env.TEST_BOOL = '0';
      expect(getBooleanEnvVar('TEST_BOOL')).toBe(false);
    });

    it('should return default value when variable is not set', () => {
      expect(getBooleanEnvVar('TEST_BOOL', true)).toBe(true);
      expect(getBooleanEnvVar('TEST_BOOL', false)).toBe(false);
    });

    it('should default to false when variable is not set and no default', () => {
      expect(getBooleanEnvVar('TEST_BOOL')).toBe(false);
    });
  });

  describe('getNumberEnvVar', () => {
    it('should return number value', () => {
      process.env.TEST_NUM = '42';
      expect(getNumberEnvVar('TEST_NUM')).toBe(42);
    });

    it('should return default value when variable is not set', () => {
      expect(getNumberEnvVar('TEST_NUM', 100)).toBe(100);
    });

    it('should throw error when variable is not set and no default', () => {
      expect(() => {
        getNumberEnvVar('TEST_NUM');
      }).toThrow('Environment variable TEST_NUM is not set');
    });

    it('should throw error for invalid number', () => {
      process.env.TEST_NUM = 'not-a-number';
      expect(() => {
        getNumberEnvVar('TEST_NUM');
      }).toThrow('not a valid number');
    });

    it('should handle decimal numbers', () => {
      process.env.TEST_NUM = '3.14';
      expect(getNumberEnvVar('TEST_NUM')).toBe(3.14);
    });

    it('should handle negative numbers', () => {
      process.env.TEST_NUM = '-10';
      expect(getNumberEnvVar('TEST_NUM')).toBe(-10);
    });
  });
});
