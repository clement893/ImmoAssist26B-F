'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SurveyResults } from '@/components/surveys';
import type { Survey, SurveySubmission } from '@/components/surveys';
import { PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { surveysAPI } from '@/lib/api';
import { formToSurvey } from '@/utils/surveyUtils';
import { handleApiError } from '@/lib/errors';

export default function SurveyResultsPage() {
  const t = useTranslations('surveys.results');
  const params = useParams();
  const surveyId = Number(params.id);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      loadData();
    }
  }, [surveyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [surveyResponse, submissionsResponse] = await Promise.all([
        surveysAPI.get(surveyId),
        surveysAPI.getSubmissions(surveyId),
      ]);

      if (surveyResponse.data) {
        // Convert form data to survey format using utility function
        setSurvey(formToSurvey({ ...surveyResponse.data, status: 'published' }));
      }

      if (submissionsResponse.data) {
        interface BackendSubmission {
          id: number | string;
          form_id: number | string;
          data: Record<string, unknown>;
          user_id?: number | string;
          submitted_at: string;
          ip_address?: string;
        }

        setSubmissions(
          (submissionsResponse.data as BackendSubmission[]).map((sub) => ({
            id: typeof sub.id === 'string' ? parseInt(sub.id, 10) : sub.id,
            survey_id: String(sub.form_id),
            data: sub.data,
            user_id:
              sub.user_id !== undefined
                ? typeof sub.user_id === 'string'
                  ? parseInt(sub.user_id, 10)
                  : sub.user_id
                : undefined,
            submitted_at: sub.submitted_at,
            ip_address: sub.ip_address,
          }))
        );
      }
    } catch (error) {
      logger.error(
        'Failed to load survey results',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message ||
          t('errors.loadFailed') ||
          'Failed to load survey results. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    try {
      const response = await surveysAPI.exportResults(surveyId, format);
      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `survey_${surveyId}_results.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      logger.error(
        'Failed to export results',
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

  if (!survey) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <Alert variant="error" title={t('error') || 'Error'}>
            {t('errors.notFound') || 'Survey not found'}
          </Alert>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <SurveyResults
        survey={survey}
        submissions={submissions}
        onExport={handleExport}
        error={error}
      />
    </ProtectedRoute>
  );
}
