/**
 * Media Library Page
 *
 * Page for managing media files with upload and organization.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { MediaLibrary } from '@/components/content';
import type { MediaItem } from '@/components/content';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { mediaAPI } from '@/lib/api/media';

export default function MediaLibraryPage() {
  const router = useRouter();
  const t = useTranslations('content.media');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadMedia();
  }, [isAuthenticated, router]);

  const loadMedia = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const mediaFiles = await mediaAPI.list();

      // Convert API Media to MediaItem format
      const convertedMedia: MediaItem[] = mediaFiles.map((file) => {
        // Determine media type from mime_type
        let type: 'image' | 'video' | 'document' | 'audio' | 'other' = 'other';
        if (file.mime_type) {
          if (file.mime_type.startsWith('image/')) {
            type = 'image';
          } else if (file.mime_type.startsWith('video/')) {
            type = 'video';
          } else if (file.mime_type.startsWith('audio/')) {
            type = 'audio';
          } else {
            type = 'document';
          }
        }

        return {
          id: file.id,
          name: file.filename,
          url: file.file_path, // This should be the full URL, but for now use file_path
          type,
          mime_type: file.mime_type || 'application/octet-stream',
          size: file.file_size,
          created_at: file.created_at,
          updated_at: file.updated_at,
        };
      });

      setMedia(convertedMedia);
    } catch (error: unknown) {
      logger.error(
        'Failed to load media',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load media. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      setError(null);
      logger.info('Uploading files', { count: files.length });

      // Upload each file
      for (const file of files) {
        await mediaAPI.upload(file, { folder: 'media' });
      }

      // Reload media list
      await loadMedia();
    } catch (error: unknown) {
      logger.error(
        'Failed to upload files',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to upload files. Please try again.');
      throw error;
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setError(null);
      logger.info('Deleting media', { id });

      await mediaAPI.delete(id);

      // Reload media list
      await loadMedia();
    } catch (error: unknown) {
      logger.error(
        'Failed to delete media',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to delete media. Please try again.');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Media Library'}
          description={t('description') || 'Upload and manage your media files'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.content') || 'Content', href: '/content' },
            { label: t('breadcrumbs.media') || 'Media' },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8">
          <MediaLibrary media={media} onUpload={handleUpload} onDelete={handleDelete} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
