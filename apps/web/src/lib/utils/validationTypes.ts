/**
 * Shared Validation Types
 *
 * Common types used across validation utilities to ensure consistency
 * and reduce code duplication.
 */

/**
 * Standard validation result type
 *
 * @template T - Optional additional data type
 *
 * @example
 * ```typescript
 * const result: ValidationResult = validateEmail('user@example.com');
 * if (!result.valid) {
 *   logger.error('', result.error);
 * }
 * ```
 */
export interface ValidationResult<T = never> {
  /** Whether the validation passed */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Additional data (optional) */
  data?: T;
}

/**
 * Validation result with sanitized value
 *
 * @example
 * ```typescript
 * const result: SanitizedValidationResult = sanitizeAndValidate(
 *   '<script>alert("xss")</script>',
 *   'html'
 * );
 * if (result.valid) {
 *   logger.log('', { message: result.sanitized }); // Safe HTML
 * }
 * ```
 */
export interface SanitizedValidationResult extends ValidationResult {
  /** Sanitized version of the input */
  sanitized: string;
}
