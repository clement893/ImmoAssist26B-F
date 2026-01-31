/**
 * File Validation Utilities
 *
 * Server-side file validation for security. Provides comprehensive validation
 * including file size, MIME type, extension matching, and filename sanitization.
 *
 * @module fileValidation
 * @example
 * ```typescript
 * // Validate a file
 * const result = validateFile(file, {
 *   allowedTypes: ALLOWED_MIME_TYPES.images,
 *   maxSize: 5 * 1024 * 1024, // 5MB
 * });
 *
 * if (result.valid) {
 *   // Use result.sanitizedName for safe storage
 * }
 * ```
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}

/**
 * Allowed MIME types for file uploads
 */
export const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain',
    'text/csv',
  ],
  all: [] as string[],
};

// Initialize all allowed types
ALLOWED_MIME_TYPES.all = [...ALLOWED_MIME_TYPES.images, ...ALLOWED_MIME_TYPES.documents];

/**
 * Maximum file size in bytes
 * Default: 10MB for non-image files
 * Images have no size limit (set to undefined/null to disable)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for non-images
export const MAX_FILE_SIZE_IMAGE = undefined; // No limit for images

/**
 * Sanitize file name to prevent directory traversal and other attacks
 *
 * Removes dangerous characters and path components:
 * - Strips directory separators (/, \)
 * - Replaces non-alphanumeric characters (except . _ -) with underscores
 * - Removes leading/trailing dots
 * - Limits length to 255 characters
 * - Generates fallback name if result is empty
 *
 * @param fileName - Original file name (may contain path components)
 * @returns Sanitized file name safe for storage
 *
 * @example
 * ```typescript
 * const safe = sanitizeFileName('../../../etc/passwd');
 * // Returns: 'etc_passwd'
 *
 * const safe2 = sanitizeFileName('my file<script>.exe');
 * // Returns: 'my_file_script_.exe'
 * ```
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path components (directory traversal protection)
  const baseName = fileName.split(/[/\\]/).pop() || fileName;

  // Remove or replace dangerous characters
  let sanitized = baseName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace non-alphanumeric (except . _ -) with _
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .substring(0, 255); // Limit length

  // Ensure we have a valid name
  if (!sanitized || sanitized.length === 0) {
    sanitized = `file_${Date.now()}`;
  }

  return sanitized;
}

/**
 * Validate file MIME type against allowed list
 *
 * Checks if the file's MIME type is in the allowed list. This prevents
 * uploading files with dangerous MIME types.
 *
 * @param mimeType - File MIME type (e.g., 'image/jpeg', 'application/pdf')
 * @param allowedTypes - Array of allowed MIME types (defaults to all allowed types)
 * @returns True if MIME type is allowed
 *
 * @example
 * ```typescript
 * const isValid = validateMimeType('image/jpeg', ALLOWED_MIME_TYPES.images);
 * // Returns: true
 *
 * const isInvalid = validateMimeType('application/x-executable', ALLOWED_MIME_TYPES.images);
 * // Returns: false
 * ```
 */
export function validateMimeType(
  mimeType: string,
  allowedTypes: string[] = ALLOWED_MIME_TYPES.all
): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 *
 * Checks if file size is within acceptable limits:
 * - Must be greater than 0
 * - Must not exceed maximum size
 *
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes (default: MAX_FILE_SIZE = 10MB)
 * @returns True if file size is valid
 *
 * @example
 * ```typescript
 * const isValid = validateFileSize(1024 * 1024, 5 * 1024 * 1024); // 1MB < 5MB
 * // Returns: true
 *
 * const isTooLarge = validateFileSize(10 * 1024 * 1024, 5 * 1024 * 1024); // 10MB > 5MB
 * // Returns: false
 * ```
 */
export function validateFileSize(
  size: number,
  maxSize: number | undefined = MAX_FILE_SIZE
): boolean {
  // If maxSize is undefined/null, skip size validation (no limit)
  if (maxSize === undefined || maxSize === null) {
    return size > 0;
  }
  return size > 0 && size <= maxSize;
}

/**
 * Get file extension from file name
 *
 * Extracts the file extension from a filename and returns it in lowercase
 * without the leading dot.
 *
 * @param fileName - File name (may include path)
 * @returns File extension in lowercase without dot, or empty string if no extension
 *
 * @example
 * ```typescript
 * const ext = getFileExtension('document.pdf');
 * // Returns: 'pdf'
 *
 * const ext2 = getFileExtension('image.JPEG');
 * // Returns: 'jpeg'
 *
 * const noExt = getFileExtension('README');
 * // Returns: ''
 * ```
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length < 2) return '';
  const extension = parts[parts.length - 1];
  return extension ? extension.toLowerCase() : '';
}

/**
 * Validate file extension matches MIME type
 *
 * Prevents MIME type spoofing by ensuring the file extension matches
 * the declared MIME type. This is a security measure to prevent malicious
 * files from being uploaded with misleading MIME types.
 *
 * @param fileName - File name (used to extract extension)
 * @param mimeType - Declared MIME type of the file
 * @returns True if extension matches MIME type
 *
 * @example
 * ```typescript
 * // Valid match
 * const valid = validateExtensionMatchesMimeType('image.jpg', 'image/jpeg');
 * // Returns: true
 *
 * // Invalid match (potential spoofing)
 * const invalid = validateExtensionMatchesMimeType('script.exe', 'image/jpeg');
 * // Returns: false
 * ```
 */
export function validateExtensionMatchesMimeType(fileName: string, mimeType: string): boolean {
  const extension = getFileExtension(fileName);

  // MIME type to extension mapping
  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/jpg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'image/svg+xml': ['svg'],
    'application/pdf': ['pdf'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'application/vnd.ms-excel': ['xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
    'text/plain': ['txt'],
    'text/csv': ['csv'],
  };

  const allowedExtensions = mimeToExt[mimeType];
  if (!allowedExtensions) return false;

  return allowedExtensions.includes(extension);
}

/**
 * Comprehensive file validation
 *
 * Performs complete file validation including:
 * - File size validation
 * - MIME type validation
 * - Extension-to-MIME-type matching (prevents spoofing)
 * - Filename sanitization
 *
 * @param file - File object or file metadata with name, size, and type
 * @param options - Validation options
 * @param options.allowedTypes - Array of allowed MIME types (defaults to all allowed types)
 * @param options.maxSize - Maximum file size in bytes (defaults to MAX_FILE_SIZE = 10MB)
 * @param options.requireExtensionMatch - Whether to require extension matches MIME type (default: true)
 * @returns Validation result with sanitized filename if valid
 *
 * @example
 * ```typescript
 * const result = validateFile(uploadedFile, {
 *   allowedTypes: ALLOWED_MIME_TYPES.images,
 *   maxSize: 5 * 1024 * 1024, // 5MB
 *   requireExtensionMatch: true,
 * });
 *
 * if (result.valid) {
 *   // File is safe, use result.sanitizedName for storage
 *   await saveFile(result.sanitizedName, file);
 * } else {
 *   logger.error('', result.error);
 * }
 * ```
 */
export function validateFile(
  file: { name: string; size: number; type: string },
  options: {
    allowedTypes?: string[];
    maxSize?: number | undefined;
    requireExtensionMatch?: boolean;
  } = {}
): FileValidationResult {
  const { allowedTypes = ALLOWED_MIME_TYPES.all, maxSize, requireExtensionMatch = true } = options;

  // Determine maxSize: use provided, or no limit for images, or default for others
  const isImage = file.type.startsWith('image/');
  const effectiveMaxSize =
    maxSize !== undefined ? maxSize : isImage ? MAX_FILE_SIZE_IMAGE : MAX_FILE_SIZE;

  // Validate file size (skip if maxSize is undefined/null)
  if (effectiveMaxSize !== undefined && effectiveMaxSize !== null) {
    if (!validateFileSize(file.size, effectiveMaxSize)) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${Math.round(effectiveMaxSize / 1024 / 1024)}MB`,
      };
    }
  } else if (file.size <= 0) {
    // Still check for empty files even if no size limit
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  // Validate MIME type
  if (!validateMimeType(file.type, allowedTypes)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Validate extension matches MIME type (prevent MIME type spoofing)
  if (requireExtensionMatch && !validateExtensionMatchesMimeType(file.name, file.type)) {
    return {
      valid: false,
      error: `File extension does not match MIME type. File: ${file.name}, MIME: ${file.type}`,
    };
  }

  // Sanitize file name
  const sanitizedName = sanitizeFileName(file.name);

  return {
    valid: true,
    sanitizedName,
  };
}

/**
 * Generate a unique file name using timestamp and random identifier
 *
 * Creates a unique filename by:
 * - Sanitizing the original filename
 * - Preserving the file extension
 * - Appending a timestamp and random identifier
 *
 * Useful for preventing filename collisions when storing files.
 *
 * @param originalFileName - Original file name
 * @returns Unique file name with timestamp-random identifier prefix
 *
 * @example
 * ```typescript
 * const unique = generateUniqueFileName('document.pdf');
 * // Returns: 'document-1704067200000-abc123xyz.pdf'
 *
 * const unique2 = generateUniqueFileName('image.jpg');
 * // Returns: 'image-1704067200001-def456uvw.jpg'
 * ```
 */
export function generateUniqueFileName(originalFileName: string): string {
  const sanitized = sanitizeFileName(originalFileName);
  const extension = getFileExtension(sanitized);
  const baseName = sanitized.replace(/\.[^/.]+$/, '') || 'file';

  // Generate UUID-like identifier
  const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

  return extension ? `${baseName}-${uuid}.${extension}` : `${baseName}-${uuid}`;
}
