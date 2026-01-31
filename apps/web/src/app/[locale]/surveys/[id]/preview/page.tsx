'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SurveyTaker } from '@/components/surveys';
import type { Survey } from '@/components/surveys';
import { PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import { logger } from '@/lib/logger';
import { surveysAPI } from '@/lib/api';
import { formToSurvey } from '@/utils/surveyUtils';
import { handleApiError } from '@/lib/errors';

export default function SurveyPreviewPage() {
  const t = useTranslations('surveys.preview');
  const params = useParams();
  const router = useRouter();
  const surveyId = Number(params.id);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      loadSurvey();
    }
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await surveysAPI.get(surveyId);
      if (response.data) {
        // Convert form data to survey format using utility function
        setSurvey(formToSurvey({ ...response.data, status: 'published' }));
      }
    } catch (error) {
      logger.error(
        'Failed to load survey',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load survey. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      await surveysAPI.submit(surveyId, data);
      router.push(`/surveys/${surveyId}/thank-you`);
    } catch (error) {
      logger.error(
        'Failed to submit survey',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (!survey) {
    return (
      <PageContainer>
        <Alert variant="error" title={t('error') || 'Error'}>
          {t('errors.notFound') || 'Survey not found'}
        </Alert>
      </PageContainer>
    );
  }

  return <SurveyTaker survey={survey} onSubmit={handleSubmit} error={error} />;
}
