/**
 * Form Submissions Page
 *
 * Page for viewing form submissions.
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FormSubmissions } from '@/components/cms';
import type { FormSubmission } from '@/components/cms';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { formsAPI } from '@/lib/api';
import { handleApiError } from '@/lib/errors';
import { extractApiData } from '@/lib/api/utils';
import type { ApiResponse } from '@modele/types';

export default function FormSubmissionsPage() {
  const params = useParams();
  const t = useTranslations('forms.submissions');
  const formId = params.id as string;

  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, [formId]);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const formIdNum = parseInt(formId, 10);
      if (isNaN(formIdNum)) {
        throw new Error('Invalid form ID');
      }

      const response = await formsAPI.getSubmissions(formIdNum, { skip: 0, limit: 100 });
      // apiClient.get returns ApiResponse<T>, extractApiData handles both ApiResponse<T> and T
      // Type assertion needed because formsAPI.getSubmissions return type is not properly inferred
      const data = extractApiData<
        FormSubmission[] | { items: FormSubmission[] } | { submissions: FormSubmission[] }
      >(
        response as unknown as
          | ApiResponse<
              FormSubmission[] | { items: FormSubmission[] } | { submissions: FormSubmission[] }
            >
          | FormSubmission[]
          | { items: FormSubmission[] }
          | { submissions: FormSubmission[] }
      );

      // Handle both array and paginated response formats
      const submissionsList = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && ('items' in data || 'submissions' in data)
          ? 'items' in data
            ? data.items
            : data.submissions
          : [];

      setSubmissions(submissionsList);
      setIsLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load submissions',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message ||
          t('errors.loadFailed') ||
          'Failed to load submissions. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await formsAPI.deleteSubmission(id);
      logger.info('Submission deleted successfully', { submissionId: id });
      setSubmissions(submissions.filter((s) => s.id !== id));
    } catch (error) {
      logger.error(
        'Failed to delete submission',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to delete submission. Please try again.');
      throw error;
    }
  };

  const handleExport = () => {
    try {
      if (submissions.length === 0) {
        logger.warn('No submissions to export', { formId });
        return;
      }

      // Convert submissions to CSV
      const headers = Object.keys(submissions[0] || {});
      const csvHeaders = headers.join(',');
      const csvRows = submissions.map((submission) =>
        headers
          .map((header) => {
            const value = (submission as Record<string, unknown>)[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
            return String(value).replace(/"/g, '""');
          })
          .join(',')
      );

      const csv = [csvHeaders, ...csvRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `form-${formId}-submissions-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info('Submissions exported successfully', { formId, count: submissions.length });
    } catch (error) {
      logger.error(
        'Failed to export submissions',
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
          title={t('title') || 'Form Submissions'}
          description={t('description') || `Submissions for form ${formId}`}
          breadcrumbs={[
            { label: t('breadcrumbs.home') || 'Home', href: '/' },
            { label: t('breadcrumbs.forms') || 'Forms', href: '/forms' },
            { label: formId, href: `/forms/${formId}` },
            { label: t('breadcrumbs.submissions') || 'Submissions' },
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
          <FormSubmissions
            submissions={submissions}
            onDelete={handleDelete}
            onExport={handleExport}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
