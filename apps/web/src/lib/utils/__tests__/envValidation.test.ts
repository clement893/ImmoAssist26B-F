/**
 * Tests for environment variable validation utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateEnvironmentVariables,
  validateAndLogEnvironmentVariables,
  getEnvVar,
  getBooleanEnvVar,
  getNumberEnvVar,
} from '../envValidation';

describe('envValidation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  describe('validateEnvironmentVariables', () => {
    it('should validate required environment variables', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

      const result = validateEnvironmentVariables();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required variables', () => {
      delete process.env.NODE_ENV;

      const result = validateEnvironmentVariables();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate URL format', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_API_URL = 'not-a-valid-url';

      const result = validateEnvironmentVariables();

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('NEXT_PUBLIC_API_URL'))).toBe(true);
    });

    it('should validate NODE_ENV values', () => {
      process.env.NODE_ENV = 'invalid';

      const result = validateEnvironmentVariables();

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('NODE_ENV'))).toBe(true);
    });
  });

  describe('validateAndLogEnvironmentVariables', () => {
    it('should throw error in production if validation fails', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_API_URL;

      expect(() => {
        validateAndLogEnvironmentVariables();
      }).toThrow();
    });

    it('should not throw in development if validation fails', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PUBLIC_API_URL;

      expect(() => {
        validateAndLogEnvironmentVariables();
      }).not.toThrow();
    });
  });

  describe('getEnvVar', () => {
    it('should return environment variable value', () => {
      process.env.TEST_VAR = 'test-value';

      const value = getEnvVar('TEST_VAR');

      expect(value).toBe('test-value');
    });

    it('should return default value if variable not set', () => {
      delete process.env.TEST_VAR;

      const value = getEnvVar('TEST_VAR', 'default-value');

      expect(value).toBe('default-value');
    });

    it('should throw if variable not set and no default', () => {
      delete process.env.TEST_VAR;

      expect(() => {
        getEnvVar('TEST_VAR');
      }).toThrow();
    });
  });

  describe('getBooleanEnvVar', () => {
    it('should parse "true" as boolean true', () => {
      process.env.TEST_BOOL = 'true';

      const value = getBooleanEnvVar('TEST_BOOL');

      expect(value).toBe(true);
    });

    it('should parse "1" as boolean true', () => {
      process.env.TEST_BOOL = '1';

      const value = getBooleanEnvVar('TEST_BOOL');

      expect(value).toBe(true);
    });

    it('should parse "false" as boolean false', () => {
      process.env.TEST_BOOL = 'false';

      const value = getBooleanEnvVar('TEST_BOOL');

      expect(value).toBe(false);
    });

    it('should return default value if not set', () => {
      delete process.env.TEST_BOOL;

      const value = getBooleanEnvVar('TEST_BOOL', true);

      expect(value).toBe(true);
    });
  });

  describe('getNumberEnvVar', () => {
    it('should parse valid number', () => {
      process.env.TEST_NUM = '42';

      const value = getNumberEnvVar('TEST_NUM');

      expect(value).toBe(42);
    });

    it('should return default if not set', () => {
      delete process.env.TEST_NUM;

      const value = getNumberEnvVar('TEST_NUM', 100);

      expect(value).toBe(100);
    });

    it('should throw if invalid number', () => {
      process.env.TEST_NUM = 'not-a-number';

      expect(() => {
        getNumberEnvVar('TEST_NUM');
      }).toThrow();
    });

    it('should throw if not set and no default', () => {
      delete process.env.TEST_NUM;

      expect(() => {
        getNumberEnvVar('TEST_NUM');
      }).toThrow();
    });
  });
});
