/**
 * Tests for file validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeFileName,
  validateMimeType,
  validateFileSize,
  getFileExtension,
  validateExtensionMatchesMimeType,
  validateFile,
  generateUniqueFileName,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '../fileValidation';

describe('fileValidation', () => {
  describe('sanitizeFileName', () => {
    it('should remove path components', () => {
      const result = sanitizeFileName('../../../etc/passwd');
      expect(result).toBe('passwd');
    });

    it('should replace dangerous characters', () => {
      const result = sanitizeFileName('my file<script>.exe');
      expect(result).toBe('my_file_script_.exe');
    });

    it('should remove leading and trailing dots', () => {
      const result = sanitizeFileName('...hidden.file...');
      expect(result).toBe('hidden.file');
    });

    it('should limit length to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('should generate fallback name for empty result', () => {
      const result = sanitizeFileName('...');
      expect(result).toMatch(/^file_\d+$/);
    });
  });

  describe('validateMimeType', () => {
    it('should validate allowed MIME types', () => {
      expect(validateMimeType('image/jpeg', ALLOWED_MIME_TYPES.images)).toBe(true);
      expect(validateMimeType('application/pdf', ALLOWED_MIME_TYPES.documents)).toBe(true);
    });

    it('should reject disallowed MIME types', () => {
      expect(validateMimeType('application/x-executable', ALLOWED_MIME_TYPES.images)).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should validate file size within limit', () => {
      expect(validateFileSize(1024 * 1024, 5 * 1024 * 1024)).toBe(true);
    });

    it('should reject files exceeding limit', () => {
      expect(validateFileSize(10 * 1024 * 1024, 5 * 1024 * 1024)).toBe(false);
    });

    it('should reject zero-size files', () => {
      expect(validateFileSize(0)).toBe(false);
    });

    it('should use default MAX_FILE_SIZE', () => {
      expect(validateFileSize(MAX_FILE_SIZE)).toBe(true);
      expect(validateFileSize(MAX_FILE_SIZE + 1)).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should extract extension', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.JPEG')).toBe('jpeg');
    });

    it('should return empty string for no extension', () => {
      expect(getFileExtension('README')).toBe('');
    });

    it('should handle multiple dots', () => {
      expect(getFileExtension('file.backup.tar.gz')).toBe('gz');
    });
  });

  describe('validateExtensionMatchesMimeType', () => {
    it('should validate matching extension and MIME type', () => {
      expect(validateExtensionMatchesMimeType('image.jpg', 'image/jpeg')).toBe(true);
      expect(validateExtensionMatchesMimeType('document.pdf', 'application/pdf')).toBe(true);
    });

    it('should reject mismatched extension and MIME type', () => {
      expect(validateExtensionMatchesMimeType('script.exe', 'image/jpeg')).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('should validate valid file', () => {
      const file = {
        name: 'test.jpg',
        size: 1024 * 1024,
        type: 'image/jpeg',
      };

      const result = validateFile(file, {
        allowedTypes: ALLOWED_MIME_TYPES.images,
        maxSize: 5 * 1024 * 1024,
      });

      expect(result.valid).toBe(true);
      expect(result.sanitizedName).toBeDefined();
    });

    it('should reject file exceeding size limit', () => {
      const file = {
        name: 'large.jpg',
        size: 10 * 1024 * 1024,
        type: 'image/jpeg',
      };

      const result = validateFile(file, {
        maxSize: 5 * 1024 * 1024,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('size');
    });

    it('should reject disallowed MIME type', () => {
      const file = {
        name: 'script.exe',
        size: 1024,
        type: 'application/x-executable',
      };

      const result = validateFile(file, {
        allowedTypes: ALLOWED_MIME_TYPES.images,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('type');
    });

    it('should reject mismatched extension and MIME type', () => {
      const file = {
        name: 'script.exe',
        size: 1024,
        type: 'image/jpeg',
      };

      const result = validateFile(file, {
        requireExtensionMatch: true,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('extension');
    });
  });

  describe('generateUniqueFileName', () => {
    it('should generate unique filename', () => {
      const original = 'document.pdf';
      const unique = generateUniqueFileName(original);

      expect(unique).toContain('document');
      expect(unique).toContain('.pdf');
      expect(unique).not.toBe(original);
    });

    it('should include timestamp and random identifier', () => {
      const unique = generateUniqueFileName('test.txt');
      const parts = unique.split('-');

      expect(parts.length).toBeGreaterThan(2);
    });

    it('should handle files without extension', () => {
      const unique = generateUniqueFileName('README');
      expect(unique).toContain('README');
      expect(unique).not.toContain('.');
    });
  });
});
