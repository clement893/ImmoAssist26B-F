/**
 * Environment Variable Validation
 * Validates required environment variables on startup
 *
 * Security: Ensures critical configuration is present before runtime
 *
 * @module envValidation
 * @example
 * ```typescript
 * // Validate at startup
 * validateAndLogEnvironmentVariables();
 *
 * // Get validated env var
 * const apiUrl = getEnvVar('NEXT_PUBLIC_API_URL');
 *
 * // Get boolean env var with default
 * const isDev = getBooleanEnvVar('NODE_ENV', false);
 * ```
 */

import { logger } from '@/lib/logger';

/**
 * Configuration for an environment variable
 *
 * @interface EnvVarConfig
 * @property {string} name - Environment variable name
 * @property {boolean} required - Whether the variable is required
 * @property {string} [defaultValue] - Default value if not set
 * @property {(value: string) => boolean} [validate] - Custom validation function
 * @property {string} [errorMessage] - Custom error message for validation failures
 */
interface EnvVarConfig {
  name: string;
  required: boolean;
  defaultValue?: string;
  validate?: (value: string) => boolean;
  errorMessage?: string;
}

/**
 * Environment variable configurations
 */
const ENV_VAR_CONFIGS: EnvVarConfig[] = [
  {
    name: 'NEXT_PUBLIC_API_URL',
    required: process.env.NODE_ENV === 'production',
    validate: (value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    },
    errorMessage: 'NEXT_PUBLIC_API_URL must be a valid HTTP/HTTPS URL',
  },
  {
    name: 'NODE_ENV',
    required: true,
    validate: (value) => ['development', 'production', 'test'].includes(value),
    errorMessage: 'NODE_ENV must be one of: development, production, test',
  },
];

/**
 * Validate environment variables against provided configurations
 *
 * Checks each configured environment variable for:
 * - Presence (if required)
 * - Custom validation (if provided)
 * - Default value usage (if applicable)
 *
 * @param configs - Array of environment variable configurations (defaults to ENV_VAR_CONFIGS)
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateEnvironmentVariables();
 * if (!result.valid) {
 *   logger.error('', 'Validation errors:', result.errors);
 * }
 * ```
 */
export function validateEnvironmentVariables(configs: EnvVarConfig[] = ENV_VAR_CONFIGS): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const config of configs) {
    const value = process.env[config.name];

    // Check if required variable is missing
    if (config.required && !value) {
      errors.push(
        `Required environment variable ${config.name} is not set. ${config.errorMessage || ''}`
      );
      continue;
    }

    // Skip validation if variable is not set and not required
    if (!value) {
      if (config.defaultValue) {
        warnings.push(`Environment variable ${config.name} is not set, using default value`);
      }
      continue;
    }

    // Run custom validation if provided
    if (config.validate && !config.validate(value)) {
      const errorMsg = config.errorMessage || `Invalid value for ${config.name}`;
      errors.push(`${config.name}: ${errorMsg}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment variables and log results
 *
 * Validates all configured environment variables and logs warnings/errors.
 * In production, throws an error if validation fails to prevent startup with invalid config.
 *
 * Should be called at application startup before any other initialization.
 *
 * @throws {Error} In production if validation fails
 *
 * @example
 * ```typescript
 * // In app startup code
 * validateAndLogEnvironmentVariables();
 * ```
 */
export function validateAndLogEnvironmentVariables(): void {
  const result = validateEnvironmentVariables();

  if (result.warnings.length > 0) {
    logger.warn('Environment variable warnings', { warnings: result.warnings });
  }

  if (result.errors.length > 0) {
    logger.error('Environment variable validation failed', new Error(result.errors.join('; ')), {
      errors: result.errors,
    });

    if (process.env.NODE_ENV === 'production') {
      // In production, throw error to prevent startup with invalid config
      throw new Error(`Environment variable validation failed:\n${result.errors.join('\n')}`);
    }
  } else {
    logger.info('Environment variable validation passed');
  }
}

/**
 * Get environment variable with validation
 *
 * Retrieves an environment variable and throws an error if it's not set
 * (unless a default value is provided).
 *
 * @param name - Environment variable name
 * @param defaultValue - Optional default value if variable is not set
 * @returns Environment variable value (never undefined)
 * @throws {Error} If variable is not set and no default value provided
 *
 * @example
 * ```typescript
 * // Required variable (throws if not set)
 * const apiUrl = getEnvVar('NEXT_PUBLIC_API_URL');
 *
 * // Optional variable with default
 * const port = getEnvVar('PORT', '3000');
 * ```
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];

  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is not set and no default value provided`);
  }

  return value;
}

/**
 * Get boolean environment variable
 *
 * Parses an environment variable as a boolean. Accepts:
 * - "true" or "1" → true
 * - "false" or "0" → false
 * - Empty/undefined → defaultValue
 *
 * @param name - Environment variable name
 * @param defaultValue - Default value if variable is not set (default: false)
 * @returns Parsed boolean value
 *
 * @example
 * ```typescript
 * const enableFeature = getBooleanEnvVar('ENABLE_FEATURE', false);
 * const isDebug = getBooleanEnvVar('DEBUG', true);
 * ```
 */
export function getBooleanEnvVar(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name];

  if (!value) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get number environment variable
 *
 * Parses an environment variable as a number. Validates that the value
 * is a valid number before returning.
 *
 * @param name - Environment variable name
 * @param defaultValue - Optional default value if variable is not set
 * @returns Parsed number value
 * @throws {Error} If variable is not set and no default provided, or if value is not a valid number
 *
 * @example
 * ```typescript
 * // Required number (throws if not set or invalid)
 * const maxConnections = getNumberEnvVar('MAX_CONNECTIONS');
 *
 * // Optional number with default
 * const timeout = getNumberEnvVar('TIMEOUT_MS', 5000);
 * ```
 */
export function getNumberEnvVar(name: string, defaultValue?: number): number {
  const value = process.env[name];

  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${name} is not set and no default value provided`);
  }

  const num = Number(value);

  if (isNaN(num)) {
    throw new Error(`Environment variable ${name} is not a valid number: ${value}`);
  }

  return num;
}
