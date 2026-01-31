/**
 * Scheduled Content Page
 *
 * Page for managing scheduled content (posts, pages, etc.).
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { ScheduledContentManager } from '@/components/content';
import type { ScheduledContent } from '@/components/content';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api';
import { handleApiError } from '@/lib/errors';

export default function ScheduledContentPage() {
  const router = useRouter();
  const t = useTranslations('content.schedule');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadScheduledContent();
  }, [isAuthenticated, router]);

  const loadScheduledContent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/v1/scheduled-tasks');
      const backendTasks = response.data;

      interface BackendScheduledTask {
        id: number | string;
        name: string;
        description?: string;
        task_type: string;
        scheduled_at: string;
        recurrence?: string;
        status: string;
        started_at?: string;
        completed_at?: string;
        error_message?: string;
      }

      const mappedContent: ScheduledContent[] = (backendTasks as BackendScheduledTask[]).map(
        (task) => ({
          id: typeof task.id === 'string' ? parseInt(task.id, 10) : task.id,
          name: task.name,
          description: task.description,
          task_type:
            task.task_type === 'publish_post' ||
            task.task_type === 'publish_page' ||
            task.task_type === 'send_email' ||
            task.task_type === 'custom'
              ? task.task_type
              : ('custom' as const),
          scheduled_at: task.scheduled_at,
          status:
            task.status === 'pending' ||
            task.status === 'running' ||
            task.status === 'completed' ||
            task.status === 'failed' ||
            task.status === 'cancelled'
              ? task.status
              : ('pending' as const),
          recurrence: task.recurrence,
          content_id:
            typeof (task as unknown as { task_data?: { content_id?: unknown } }).task_data
              ?.content_id === 'number'
              ? (task as unknown as { task_data?: { content_id?: number } }).task_data?.content_id
              : undefined,
          content_type:
            typeof (task as unknown as { task_data?: { content_type?: unknown } }).task_data
              ?.content_type === 'string'
              ? (task as unknown as { task_data?: { content_type?: string } }).task_data
                  ?.content_type
              : undefined,
          created_at:
            (task as unknown as { created_at?: string }).created_at || new Date().toISOString(),
          updated_at:
            (task as unknown as { updated_at?: string }).updated_at || new Date().toISOString(),
        })
      );

      setScheduledContent(mappedContent);
      setIsLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load scheduled content',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message ||
          t('errors.loadFailed') ||
          'Failed to load scheduled content. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const handleScheduleCreate = async (
    scheduleData: Omit<ScheduledContent, 'id' | 'created_at' | 'updated_at'>
  ) => {
    try {
      await apiClient.post('/v1/scheduled-tasks', {
        name: scheduleData.name,
        description: scheduleData.description,
        task_type: scheduleData.task_type,
        scheduled_at: scheduleData.scheduled_at,
        recurrence: scheduleData.recurrence,
        task_data: scheduleData.content_id
          ? {
              content_id: scheduleData.content_id,
              content_type: scheduleData.content_type,
            }
          : undefined,
      });
      await loadScheduledContent();
    } catch (error) {
      logger.error(
        'Failed to create schedule',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to create schedule. Please try again.');
      throw error;
    }
  };

  const handleScheduleUpdate = async (id: number, scheduleData: Partial<ScheduledContent>) => {
    try {
      await apiClient.put(`/v1/scheduled-tasks/${id}`, scheduleData);
      await loadScheduledContent();
    } catch (error) {
      logger.error(
        'Failed to update schedule',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to update schedule. Please try again.');
      throw error;
    }
  };

  const handleScheduleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/v1/scheduled-tasks/${id}`);
      await loadScheduledContent();
    } catch (error) {
      logger.error(
        'Failed to delete schedule',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to delete schedule. Please try again.');
      throw error;
    }
  };

  const handleScheduleToggle = async (id: number) => {
    try {
      // NOTE: Toggle functionality can be implemented by:
      // 1. Checking if backend has a toggle endpoint (e.g., PUT /v1/content/schedule/{id}/toggle)
      // 2. If available, call: await apiClient.put(`/v1/content/schedule/${id}/toggle`)
      // 3. If not available, implement by getting current status and toggling it:
      //    const item = await getScheduledItem(id);
      //    await updateScheduledItem(id, { is_active: !item.is_active });
      // For now, we'll just reload the content
      logger.info('Schedule toggle requested - reloading content', { id });
      await loadScheduledContent();
    } catch (error) {
      logger.error(
        'Failed to toggle schedule',
        error instanceof Error ? error : new Error(String(error))
      );
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
          title={t('title') || 'Scheduled Content'}
          description={t('description') || 'Manage scheduled posts, pages, and other content'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.content') || 'Content', href: '/content' },
            { label: t('breadcrumbs.schedule') || 'Schedule' },
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
          <ScheduledContentManager
            scheduledContent={scheduledContent}
            onScheduleCreate={handleScheduleCreate}
            onScheduleUpdate={handleScheduleUpdate}
            onScheduleDelete={handleScheduleDelete}
            onScheduleToggle={handleScheduleToggle}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
