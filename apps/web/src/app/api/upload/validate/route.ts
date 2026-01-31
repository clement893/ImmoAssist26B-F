/**
 * File Upload Validation API Route
 * Server-side file validation endpoint
 *
 * Security: Validates file metadata before upload to prevent malicious files
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateFile, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@/lib/utils/fileValidation';
import { logger } from '@/lib/logger';

/**
 * POST /api/upload/validate
 * Validate file metadata before upload
 *
 * Body: {
 *   name: string;
 *   size: number;
 *   type: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, size, type } = body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    if (typeof size !== 'number' || size <= 0) {
      return NextResponse.json({ error: 'Valid file size is required' }, { status: 400 });
    }

    if (!type || typeof type !== 'string') {
      return NextResponse.json({ error: 'File MIME type is required' }, { status: 400 });
    }

    // Perform validation - no size limit for images
    const isImage = type.startsWith('image/');
    const validation = validateFile(
      { name, size, type },
      {
        allowedTypes: ALLOWED_MIME_TYPES.all,
        maxSize: isImage ? undefined : MAX_FILE_SIZE, // No limit for images
        requireExtensionMatch: true,
      }
    );

    if (!validation.valid) {
      logger.warn('File validation failed', {
        fileName: name,
        size,
        type,
        error: validation.error,
      });

      return NextResponse.json(
        {
          valid: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    logger.debug('File validation successful', {
      fileName: name,
      sanitizedName: validation.sanitizedName,
      size,
      type,
    });

    return NextResponse.json({
      valid: true,
      sanitizedName: validation.sanitizedName,
    });
  } catch (error) {
    logger.error(
      'File validation API error',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ error: 'Failed to validate file' }, { status: 500 });
  }
}
