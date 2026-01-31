/**
 * Comprehensive Tests for File Validation Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateFileSize,
  validateMimeType,
  sanitizeFileName,
  validateFile,
  ALLOWED_MIME_TYPES,
} from '../fileValidation';

describe('File Validation Utilities', () => {
  describe('validateFileSize', () => {
    it('should validate file size within limit', () => {
      expect(validateFileSize(1024, 2048)).toBe(true);
    });

    it('should reject file exceeding size limit', () => {
      expect(validateFileSize(2048, 1024)).toBe(false);
    });
  });

  describe('validateMimeType', () => {
    it('should validate allowed file type', () => {
      expect(validateMimeType('application/pdf', ['application/pdf', 'image/jpeg'])).toBe(true);
    });

    it('should reject disallowed file type', () => {
      expect(validateMimeType('application/x-msdownload', ['application/pdf', 'image/jpeg'])).toBe(
        false
      );
    });
  });

  describe('sanitizeFileName', () => {
    it('should validate safe file name', () => {
      const result1 = sanitizeFileName('test-file.txt');
      expect(result1).toBe('test-file.txt');
      const result2 = sanitizeFileName('document_123.pdf');
      expect(result2).toBe('document_123.pdf');
    });

    it('should sanitize dangerous file names', () => {
      const result1 = sanitizeFileName('../../../etc/passwd');
      expect(result1).toBe('passwd');
      const result2 = sanitizeFileName('file<script>.txt');
      expect(result2).toContain('file');
      expect(result2).toContain('txt');
      expect(result2).not.toContain('<script>');
    });
  });

  describe('validateFile (comprehensive)', () => {
    it('should validate image file', () => {
      const file = {
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
      };

      const result = validateFile(file, {
        allowedTypes: ALLOWED_MIME_TYPES.images,
        maxSize: 2048,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject non-image file', () => {
      const file = {
        name: 'test.txt',
        size: 1024,
        type: 'text/plain',
      };

      const result = validateFile(file, {
        allowedTypes: ALLOWED_MIME_TYPES.images,
        maxSize: 2048,
      });

      expect(result.valid).toBe(false);
    });

    it('should reject image exceeding size limit', () => {
      const file = {
        name: 'test.jpg',
        size: 2048,
        type: 'image/jpeg',
      };

      const result = validateFile(file, {
        allowedTypes: ALLOWED_MIME_TYPES.images,
        maxSize: 1024,
      });

      expect(result.valid).toBe(false);
    });
  });
});
