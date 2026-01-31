/**
 * Theme API Error Handling Utilities
 * Parses and structures validation errors from the backend
 */

import { AppError } from '@/lib/errors/AppError';
import { logger } from '@/lib/logger';

export interface ThemeValidationErrorData {
  type: 'color_format' | 'contrast' | 'unknown';
  field?: string;
  message: string;
}

export interface ParsedThemeError {
  isValidationError: boolean;
  validationErrors: ThemeValidationErrorData[];
  originalError: Error;
  message: string;
}

/**
 * Check if an error is a validation error from the backend
 */
export function isThemeValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  // Check if it's a ValidationError (422 status)
  if (error instanceof AppError && error.statusCode === 422) {
    return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('color format') ||
    message.includes('contrast') ||
    message.includes('validation') ||
    message.includes('invalid color')
  );
}

/**
 * Extract validation message from backend validationErrors array
 */
function extractValidationMessageFromDetails(details: Record<string, unknown>): string | null {
  const validationErrors = details.validationErrors;

  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    // FastAPI returns validationErrors as array of {field, message, code}
    // The actual validation message is in the message field
    const messages = validationErrors
      .map((err: { message?: string; msg?: string }) => {
        // Handle both formats: err.message or err.msg (Pydantic format)
        return err.message || err.msg || '';
      })
      .filter((msg: string) => typeof msg === 'string' && msg.length > 0);

    if (messages.length > 0) {
      // Join all messages - they contain the formatted error details
      // The message from Pydantic validator contains the full formatted error
      return messages.join('\n');
    }
  }

  return null;
}

/**
 * Parse validation errors from backend error message
 */
export function parseThemeValidationErrors(error: Error): ThemeValidationErrorData[] {
  const errors: ThemeValidationErrorData[] = [];
  let message = error.message;

  // If it's an AppError with details, extract validation message from details
  if (error instanceof AppError && error.details) {
    const extractedMessage = extractValidationMessageFromDetails(error.details);
    if (extractedMessage) {
      // Prefer the extracted message as it contains the full formatted error from backend
      message = extractedMessage;
    }
  }

  // Debug: log the message to help diagnose issues (always log in production for debugging)
  logger.debug('[parseThemeValidationErrors] Parsing error', {
    message,
    errorMessage: error.message,
    hasDetails: error instanceof AppError && !!error.details,
    details: error instanceof AppError ? error.details : null,
    errorType: error.constructor.name,
    isAppError: error instanceof AppError,
    statusCode: error instanceof AppError ? error.statusCode : undefined,
  });

  // Parse color format errors
  if (message.includes('Color format errors:')) {
    const parts = message.split('Color format errors:');
    if (parts[1]) {
      const errorLines = parts[1].split('\n');
      errorLines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && trimmed.startsWith('-')) {
          // Extract field and message
          // Format: "  - field: message"
          const match = trimmed.match(/-\s*([^:]+):\s*(.+)/);
          if (match && match[1] && match[2]) {
            errors.push({
              type: 'color_format',
              field: match[1].trim(),
              message: match[2].trim(),
            });
          }
        }
      });
    }
  }

  // Parse contrast issues
  if (message.includes('Critical contrast issues:')) {
    const parts = message.split('Critical contrast issues:');
    if (parts[1]) {
      const errorLines = parts[1].split('\n');
      errorLines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && trimmed.startsWith('-')) {
          // Extract element and message
          // Format: "  - element: message"
          const match = trimmed.match(/-\s*([^:]+):\s*(.+)/);
          if (match && match[1] && match[2]) {
            errors.push({
              type: 'contrast',
              field: match[1].trim(),
              message: match[2].trim(),
            });
          }
        }
      });
    }
  }

  // If no structured errors found, but we have a message, create an error entry
  // This ensures we always return at least one error if there's a validation issue
  if (errors.length === 0) {
    // Check if this looks like a validation error
    const isValidationMessage =
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('Color format') ||
      message.includes('contrast') ||
      message.includes('422');

    // Don't create a generic error if the message is just "Request failed with status code 422"
    // This means we didn't extract the real validation message
    const isGenericError = message.includes('Request failed with status code');

    if ((isValidationMessage || message.length > 0) && !isGenericError) {
      errors.push({
        type: 'unknown',
        message: message || 'Erreur de validation inconnue',
      });
    } else if (isGenericError) {
      // If we have a generic error, try to extract from AppError details
      if (error instanceof AppError && error.details?.validationErrors) {
        const validationErrors = error.details.validationErrors;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          // Use the first validation error message
          const firstError = validationErrors[0];
          const errorMsg = firstError.message || firstError.msg || '';
          if (errorMsg && !errorMsg.includes('Request failed')) {
            errors.push({
              type: 'unknown',
              message: errorMsg,
            });
          }
        }
      }

      // If still no errors, add a helpful message
      if (errors.length === 0) {
        errors.push({
          type: 'unknown',
          message:
            'Erreur de validation. Vérifiez les formats de couleur et les ratios de contraste.',
        });
      }
    }
  }

  return errors;
}

/**
 * Parse theme API error into structured format
 */
export function parseThemeError(error: unknown): ParsedThemeError {
  if (!(error instanceof Error)) {
    return {
      isValidationError: false,
      validationErrors: [],
      originalError: new Error(String(error)),
      message: String(error),
    };
  }

  const isValidation = isThemeValidationError(error);
  let validationErrors: ThemeValidationErrorData[] = [];
  let message = error.message;

  if (isValidation) {
    // Try to extract validation message from AppError details first
    if (error instanceof AppError && error.details?.validationErrors) {
      const extractedMessage = extractValidationMessageFromDetails(error.details);
      if (extractedMessage && extractedMessage !== error.message) {
        // Use the extracted message which contains the full formatted error
        message = extractedMessage;
      }
    }

    // Parse validation errors
    validationErrors = parseThemeValidationErrors(error);

    // If no structured errors found but we have a detailed message, create an error entry
    if (
      validationErrors.length === 0 &&
      message &&
      !message.includes('Request failed with status code')
    ) {
      validationErrors.push({
        type: 'unknown',
        message: message,
      });
    }
  }

  return {
    isValidationError: isValidation,
    validationErrors,
    originalError: error,
    message: message,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ThemeValidationErrorData[]): string[] {
  const formatted: string[] = [];

  const colorErrors = errors.filter((e) => e.type === 'color_format');
  const contrastErrors = errors.filter((e) => e.type === 'contrast');

  if (colorErrors.length > 0) {
    formatted.push(`Erreurs de format de couleur (${colorErrors.length}):`);
    colorErrors.forEach((error) => {
      formatted.push(`  • ${error.field || 'Champ inconnu'}: ${error.message}`);
    });
  }

  if (contrastErrors.length > 0) {
    formatted.push(`Problèmes de contraste critiques (${contrastErrors.length}):`);
    contrastErrors.forEach((error) => {
      formatted.push(`  • ${error.field || 'Élément inconnu'}: ${error.message}`);
    });
  }

  const otherErrors = errors.filter((e) => e.type === 'unknown');
  if (otherErrors.length > 0) {
    otherErrors.forEach((error) => {
      formatted.push(`  • ${error.message}`);
    });
  }

  return formatted;
}
