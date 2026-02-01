/**
 * FileUpload Component
 * File upload component
 */
'use client';

import { forwardRef, type InputHTMLAttributes, useState } from 'react';
import { clsx } from 'clsx';

interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  accept?: string; // MIME types, e.g., "image/*", "application/pdf"
  allowedTypes?: string[]; // Specific file extensions, e.g., [".jpg", ".png", ".pdf"]
  multiple?: boolean;
  maxSize?: number; // Max file size in MB
  minSize?: number; // Min file size in MB
  maxFiles?: number; // Max number of files (for multiple uploads)
  validateContent?: boolean; // Validate file content (magic bytes)
  onFileChange?: (files: FileList | null) => void;
  onFileSelect?: (files: File[]) => void; // Alternative callback that receives File[]
  onValidationError?: (error: string) => void; // Callback for validation errors
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      label,
      error,
      helperText,
      className,
      fullWidth = false,
      accept,
      multiple = false,
      maxSize,
      maxFiles,
      allowedTypes,
      minSize,
      validateContent,
      onFileChange,
      onFileSelect,
      onValidationError,
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const [fileName, setFileName] = useState<string>('');
    const fileId = id || `file-${Math.random().toString(36).substring(7)}`;

    // File validation utilities
    const validateFileType = (file: File, accept?: string, allowedTypes?: string[]): boolean => {
      if (!accept && !allowedTypes) return true;

      // Check MIME type
      if (accept) {
        const acceptTypes = accept.split(',').map((t) => t.trim());
        const fileType = file.type;
        const fileName = file.name.toLowerCase();

        const matchesAccept = acceptTypes.some((pattern) => {
          if (pattern.endsWith('/*')) {
            // Wildcard pattern like "image/*"
            const baseType = pattern.slice(0, -2);
            return fileType.startsWith(baseType);
          } else if (pattern.startsWith('.')) {
            // Extension pattern like ".jpg"
            return fileName.endsWith(pattern.toLowerCase());
          } else {
            // Full MIME type
            return fileType === pattern;
          }
        });

        if (!matchesAccept) return false;
      }

      // Check allowed extensions
      if (allowedTypes && allowedTypes.length > 0) {
        const fileName = file.name.toLowerCase();
        const matchesExtension = allowedTypes.some((ext) => {
          const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
          return fileName.endsWith(normalizedExt.toLowerCase());
        });

        if (!matchesExtension) return false;
      }

      return true;
    };

    const validateFileSize = (file: File, minSize?: number, maxSize?: number): boolean => {
      const fileSizeMB = file.size / (1024 * 1024);

      // No size limit for images (removed restriction)
      const isImage = file.type.startsWith('image/');
      if (isImage) {
        // Only check minimum size for images, no maximum
        if (minSize && fileSizeMB < minSize) return false;
        return true;
      }

      // For non-images, apply size limits as before
      if (minSize && fileSizeMB < minSize) return false;
      if (maxSize && fileSizeMB > maxSize) return false;

      return true;
    };

    const validateFileContent = async (file: File): Promise<boolean> => {
      // Basic magic bytes validation for common file types
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer.slice(0, 4));

          // Check magic bytes for common file types
          const magicBytes: Record<string, number[][]> = {
            'image/jpeg': [[0xff, 0xd8, 0xff]],
            'image/png': [[0x89, 0x50, 0x4e, 0x47]],
            'image/gif': [[0x47, 0x49, 0x46, 0x38]],
            'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
          };

          const expectedBytes = magicBytes[file.type];
          if (expectedBytes) {
            const matches = expectedBytes.some((pattern) => {
              return pattern.every((byte, index) => bytes[index] === byte);
            });
            resolve(matches);
          } else {
            // If we don't have magic bytes for this type, allow it
            resolve(true);
          }
        };
        reader.onerror = () => resolve(false);
        reader.readAsArrayBuffer(file.slice(0, 4));
      });
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;

      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        const errors: string[] = [];

        // Validate number of files
        if (maxFiles && fileArray.length > maxFiles) {
          errors.push(`Maximum ${maxFiles} file(s) allowed`);
        }

        // Validate each file
        for (const file of fileArray) {
          // Validate file type
          if (!validateFileType(file, accept, allowedTypes)) {
            errors.push(`${file.name}: Invalid file type`);
            continue;
          }

          // Validate file size
          if (!validateFileSize(file, minSize, maxSize)) {
            const sizeError =
              maxSize && file.size > maxSize * 1024 * 1024
                ? `too large (max ${maxSize}MB)`
                : `too small (min ${minSize}MB)`;
            errors.push(`${file.name}: File ${sizeError}`);
            continue;
          }

          // Validate file content (magic bytes)
          if (validateContent) {
            const isValidContent = await validateFileContent(file);
            if (!isValidContent) {
              errors.push(`${file.name}: Invalid file content`);
              continue;
            }
          }
        }

        // If there are validation errors, show them and return
        if (errors.length > 0) {
          const errorMessage = errors.join(',');
          setFileName(`Erreur: ${errorMessage}`);
          onValidationError?.(errorMessage);
          // Clear the input
          e.target.value = '';
          return;
        }

        // All validations passed
        if (multiple) {
          setFileName(`${files.length} fichier(s) sélectionné(s)`);
        } else {
          setFileName(files[0]?.name || '');
        }

        // Call onFileSelect with File[] if provided
        if (onFileSelect) {
          onFileSelect(fileArray);
        }
      } else {
        setFileName('');
      }

      onChange?.(e);
      onFileChange?.(files);
    };

    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={fileId} className="block text-sm font-medium text-foreground mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          <input ref={ref} type="file" id={fileId} accept={accept} multiple={multiple} onChange={handleChange} className="hidden" {...props} />
          <label
            htmlFor={fileId}
            className={clsx(
              'flex flex-col items-center justify-center w-full h-32',
              'border-2 border-border border-dashed rounded-lg',
              'cursor-pointer bg-muted',
              'hover:bg-muted dark:hover:bg-muted',
              'transition-modern', // UI Revamp - Transition moderne
              error && 'border-error-500 dark:border-error-400',
              className
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-10 h-10 mb-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mb-2 text-sm text-foreground">
                <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
              </p>
              <p className="text-xs text-muted-foreground">{accept ? `Types acceptés: ${accept}` : 'Tous les types de fichiers'}</p>
              {fileName && (
                <p className="mt-2 text-sm text-foreground font-medium">
                  {fileName}
                </p>
              )}
            </div>
          </label>
        </div>

        {error && (
          <p className="mt-1 text-sm text-error-600 dark:text-error-400" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export default FileUpload;
