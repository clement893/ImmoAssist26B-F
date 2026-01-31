/**
 * Input Validation Utilities
 *
 * Provides comprehensive input validation and sanitization to prevent
 * injection attacks, XSS, and other input-based vulnerabilities.
 *
 * @module inputValidation
 * @example
 * ```typescript
 * // Validate email
 * const emailResult = validateEmail('user@example.com');
 * if (!emailResult.valid) {
 *   logger.error('', emailResult.error);
 * }
 *
 * // Sanitize HTML
 * const safeHtml = sanitizeHtml('<script>alert("xss")</script><p>Safe</p>');
 * // Returns: '<p>Safe</p>'
 *
 * // Validate and sanitize
 * const result = sanitizeAndValidate(userInput, 'email', 'Email Address');
 * if (result.valid) {
 *   // Use result.sanitized
 * }
 * ```
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Maximum input lengths for different field types
 */
export const MAX_LENGTHS = {
  email: 254,
  username: 50,
  password: 128,
  name: 100,
  title: 200,
  description: 5000,
  url: 2048,
  text: 10000,
  comment: 1000,
  search: 200,
} as const;

/**
 * Minimum input lengths
 */
export const MIN_LENGTHS = {
  password: 8,
  username: 3,
  name: 1,
} as const;

/**
 * Validate input length
 *
 * Checks if a string value meets minimum and maximum length requirements.
 *
 * @param value - The string value to validate
 * @param min - Minimum allowed length (inclusive)
 * @param max - Maximum allowed length (inclusive)
 * @param fieldName - Name of the field for error messages (default: 'Field')
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateLength('username', 3, 50, 'Username');
 * if (!result.valid) {
 *   logger.error('', result.error); // "Username must be at least 3 characters"
 * }
 * ```
 */
export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string = 'Field'
): { valid: boolean; error?: string } {
  if (value.length < min) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${min} characters`,
    };
  }

  if (value.length > max) {
    return {
      valid: false,
      error: `${fieldName} must be no more than ${max} characters`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize HTML input to prevent XSS attacks
 *
 * Removes potentially dangerous HTML tags and attributes while preserving
 * safe formatting. Uses DOMPurify for robust sanitization.
 *
 * @param html - Raw HTML string to sanitize
 * @param allowedTags - Optional array of allowed HTML tags (defaults to common safe tags)
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```typescript
 * // Basic usage
 * const safe = sanitizeHtml('<script>alert("xss")</script><p>Safe</p>');
 * // Returns: '<p>Safe</p>'
 *
 * // Custom allowed tags
 * const custom = sanitizeHtml(html, ['p', 'strong', 'em']);
 * ```
 */
export function sanitizeHtml(html: string, allowedTags?: string[]): string {
  const defaultTags = [
    'p',
    'br',
    'strong',
    'em',
    'u',
    'b',
    'i',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'blockquote',
    'code',
    'pre',
    'span',
    'div',
  ];

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags || defaultTags,
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize plain text by removing all HTML tags
 *
 * Strips all HTML tags and attributes from text, leaving only plain text.
 * Useful for sanitizing user input that should not contain HTML.
 *
 * @param text - Text that may contain HTML
 * @returns Plain text with all HTML removed
 *
 * @example
 * ```typescript
 * const plain = sanitizeText('<p>Hello <strong>World</strong></p>');
 * // Returns: 'Hello World'
 * ```
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Validate email format
 *
 * Checks if an email address is valid by:
 * - Ensuring it's not empty
 * - Validating length (max 254 characters per RFC 5321)
 * - Checking format with regex pattern
 *
 * @param email - Email address to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateEmail('user@example.com');
 * if (result.valid) {
 *   // Email is valid
 * } else {
 *   logger.error('', result.error);
 * }
 * ```
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  const lengthCheck = validateLength(email, 1, MAX_LENGTHS.email, 'Email');
  if (!lengthCheck.valid) {
    return lengthCheck;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Validate URL format
 *
 * Validates that a string is a properly formatted URL by:
 * - Checking length constraints
 * - Using the URL constructor to validate format
 *
 * @param url - URL string to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateUrl('https://example.com');
 * if (!result.valid) {
 *   logger.error('', result.error);
 * }
 * ```
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.length === 0) {
    return { valid: false, error: 'URL is required' };
  }

  const lengthCheck = validateLength(url, 1, MAX_LENGTHS.url, 'URL');
  if (!lengthCheck.valid) {
    return lengthCheck;
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate password strength
 *
 * Validates password meets security requirements and calculates strength:
 * - Minimum length: 8 characters
 * - Maximum length: 128 characters
 * - Strength based on: length, lowercase, uppercase, numbers, special characters
 *
 * Strength levels:
 * - Weak: Less than 3 criteria met
 * - Medium: 3 criteria met
 * - Strong: 4+ criteria met
 *
 * @param password - Password to validate
 * @returns Validation result with strength indicator
 *
 * @example
 * ```typescript
 * const result = validatePassword('MyP@ssw0rd123');
 * if (result.valid) {
 *   logger.log(`Password strength: ${result.strength}`); // 'strong'
 * }
 * ```
 */
export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
  strength?: 'weak' | 'medium' | 'strong';
} {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Password is required' };
  }

  const lengthCheck = validateLength(
    password,
    MIN_LENGTHS.password,
    MAX_LENGTHS.password,
    'Password'
  );
  if (!lengthCheck.valid) {
    return lengthCheck;
  }

  // Check password strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;

  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score >= 4) strength = 'strong';
  else if (score >= 3) strength = 'medium';

  if (score < 3) {
    return {
      valid: false,
      error: 'Password must contain uppercase, lowercase, number, and special character',
      strength,
    };
  }

  return { valid: true, strength };
}

/**
 * Sanitize and validate input based on type
 *
 * Performs type-specific sanitization and validation:
 * - **email**: Trims, lowercases, and validates email format
 * - **url**: Trims and validates URL format
 * - **html**: Sanitizes HTML while preserving safe tags
 * - **password**: Validates strength (no sanitization)
 * - **text**: Removes HTML and validates length
 *
 * @param value - Input value to sanitize and validate
 * @param type - Type of input ('text' | 'email' | 'url' | 'html' | 'password')
 * @param fieldName - Optional field name for error messages
 * @returns Validation result with sanitized value
 *
 * @example
 * ```typescript
 * // Validate email
 * const emailResult = sanitizeAndValidate('  USER@EXAMPLE.COM  ', 'email', 'Email');
 * // Returns: { valid: true, sanitized: 'user@example.com' }
 *
 * // Sanitize HTML
 * const htmlResult = sanitizeAndValidate('<script>alert("xss")</script><p>Safe</p>', 'html');
 * // Returns: { valid: true, sanitized: '<p>Safe</p>' }
 * ```
 */
export function sanitizeAndValidate(
  value: string,
  type: 'text' | 'email' | 'url' | 'html' | 'password',
  fieldName?: string
): { valid: boolean; sanitized: string; error?: string } {
  let sanitized = value;
  let validation: { valid: boolean; error?: string } = { valid: true };

  switch (type) {
    case 'email':
      sanitized = sanitizeText(value.trim().toLowerCase());
      validation = validateEmail(sanitized);
      break;

    case 'url':
      sanitized = sanitizeText(value.trim());
      validation = validateUrl(sanitized);
      break;

    case 'html':
      sanitized = sanitizeHtml(value);
      // HTML validation - check length
      validation = validateLength(sanitized, 0, MAX_LENGTHS.text, fieldName || 'HTML');
      break;

    case 'password':
      sanitized = value; // Don't sanitize passwords
      validation = validatePassword(sanitized);
      break;

    case 'text':
    default:
      sanitized = sanitizeText(value.trim());
      const maxLength: number =
        fieldName && fieldName in MAX_LENGTHS
          ? MAX_LENGTHS[fieldName as keyof typeof MAX_LENGTHS]
          : MAX_LENGTHS.text;
      validation = validateLength(sanitized, 0, maxLength, fieldName || 'Text');
      break;
  }

  return {
    valid: validation.valid,
    sanitized,
    error: validation.error,
  };
}
