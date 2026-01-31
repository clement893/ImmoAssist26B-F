/**
 * Edge Case Handlers
 *
 * Utility functions for handling edge cases and boundary conditions.
 * Reduces code duplication and ensures consistent edge case handling.
 */

/**
 * Safely parse a number with fallback
 */
export function safeParseNumber(
  value: unknown,
  fallback: number = 0,
  min?: number,
  max?: number
): number {
  if (value === null || value === undefined) {
    return fallback;
  }

  const num = typeof value === 'number' ? value : Number(value);

  if (Number.isNaN(num)) {
    return fallback;
  }

  if (min !== undefined && num < min) {
    return min;
  }

  if (max !== undefined && num > max) {
    return max;
  }

  return num;
}

/**
 * Safely parse a string with length limits
 */
export function safeParseString(
  value: unknown,
  fallback: string = '',
  maxLength?: number,
  minLength?: number
): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  let str = String(value).trim();

  if (maxLength !== undefined && str.length > maxLength) {
    str = str.substring(0, maxLength);
  }

  if (minLength !== undefined && str.length < minLength) {
    return fallback;
  }

  return str;
}

/**
 * Safely get array element with bounds checking
 */
export function safeArrayAccess<T>(
  array: T[] | null | undefined,
  index: number,
  fallback?: T
): T | undefined {
  if (!array || !Array.isArray(array)) {
    return fallback;
  }

  if (index < 0 || index >= array.length) {
    return fallback;
  }

  return array[index];
}

/**
 * Safely get object property with type checking
 */
export function safeGet<T>(
  obj: Record<string, unknown> | null | undefined,
  path: string,
  fallback?: T
): T | undefined {
  if (!obj || typeof obj !== 'object') {
    return fallback;
  }

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return fallback;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current as T | undefined;
}

/**
 * Debounce function with edge case handling
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  if (wait < 0) {
    throw new Error('Debounce wait time must be non-negative');
  }

  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) {
        func(...args);
      }
    };

    const callNow = immediate && !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) {
      func(...args);
    }
  };
}

/**
 * Throttle function with edge case handling
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  if (limit < 0) {
    throw new Error('Throttle limit must be non-negative');
  }

  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Safe async operation with retry and error handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  options: {
    retries?: number;
    retryDelay?: number;
    onError?: (error: Error) => void;
    fallback?: T;
  } = {}
): Promise<T | undefined> {
  const { retries = 0, retryDelay = 1000, onError, fallback } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      onError?.(lastError);
      return fallback;
    }
  }

  return fallback;
}

/**
 * Validate and sanitize input with edge case handling
 */
export function sanitizeInput(
  input: unknown,
  options: {
    maxLength?: number;
    allowEmpty?: boolean;
    trim?: boolean;
    sanitizeHtml?: boolean;
  } = {}
): string {
  const { maxLength = 10000, allowEmpty = false, trim = true, sanitizeHtml = true } = options;

  if (input === null || input === undefined) {
    return allowEmpty ? '' : '';
  }

  let str = String(input);

  if (trim) {
    str = str.trim();
  }

  if (!allowEmpty && str.length === 0) {
    return '';
  }

  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }

  if (sanitizeHtml && typeof window !== 'undefined') {
    // Basic HTML sanitization - remove script tags
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  return str;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error('Min value cannot be greater than max value');
  }

  return Math.min(Math.max(value, min), max);
}

/**
 * Check if value is within safe bounds
 */
export function isWithinBounds(value: number, min: number, max: number, inclusive = true): boolean {
  if (min > max) {
    return false;
  }

  if (inclusive) {
    return value >= min && value <= max;
  }

  return value > min && value < max;
}

/**
 * Safe division with zero handling
 */
export function safeDivide(numerator: number, denominator: number, fallback = 0): number {
  if (denominator === 0 || !Number.isFinite(denominator)) {
    return fallback;
  }

  const result = numerator / denominator;

  if (!Number.isFinite(result)) {
    return fallback;
  }

  return result;
}

/**
 * Format bytes with edge case handling
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  if (i >= sizes.length) {
    return `${bytes.toFixed(dm)} Bytes`;
  }

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
