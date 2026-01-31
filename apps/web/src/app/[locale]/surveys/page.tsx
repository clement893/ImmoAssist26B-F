'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SurveyBuilder } from '@/components/surveys';
import type { Survey } from '@/components/surveys';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert, Button } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { surveysAPI } from '@/lib/api';
import { formToSurvey, surveyToForm } from '@/utils/surveyUtils';
import { handleApiError } from '@/lib/errors';
import { Plus } from 'lucide-react';

export default function SurveysPage() {
  const t = useTranslations('surveys');
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await surveysAPI.list();
      if (response.data) {
        // Convert form data to survey format using utility function
        setSurveys(
          response.data.map((form: Parameters<typeof formToSurvey>[0]) => formToSurvey(form))
        );
      }
    } catch (error) {
      logger.error(
        'Failed to load surveys',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load surveys. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSurvey(null);
    setShowBuilder(true);
  };

  const handleEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setShowBuilder(true);
  };

  const handleSave = async (survey: Survey) => {
    try {
      const formData = surveyToForm(survey);
      if (survey.id && surveys.find((s) => s.id === survey.id)) {
        await surveysAPI.update(Number(survey.id), formData);
      } else {
        await surveysAPI.create(formData);
      }
      await loadSurveys();
      setShowBuilder(false);
      setEditingSurvey(null);
    } catch (error) {
      logger.error(
        'Failed to save survey',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  };

  const handlePublish = async (survey: Survey) => {
    await handleSave({ ...survey, status: 'published' });
  };

  if (showBuilder) {
    return (
      <ProtectedRoute>
        <SurveyBuilder
          survey={editingSurvey || undefined}
          onSave={handleSave}
          onPublish={handlePublish}
          onPreview={(survey: Survey) => router.push(`/surveys/${survey.id}/preview`)}
        />
      </ProtectedRoute>
    );
  }

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
          title={t('title') || 'Surveys'}
          description={t('description') || 'Create and manage surveys and questionnaires'}
          breadcrumbs={[
            { label: t('breadcrumbs.home') || 'Home', href: '/' },
            { label: t('breadcrumbs.surveys') || 'Surveys' },
          ]}
          actions={
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t('create_survey') || 'Create Survey'}
            </Button>
          }
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8">
          {surveys.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">{t('no_surveys') || 'No surveys yet'}</p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                {t('create_first_survey') || 'Create Your First Survey'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  className="p-4 border border-border rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleEdit(survey)}
                >
                  <h3 className="font-semibold mb-2">{survey.name}</h3>
                  {survey.description && (
                    <p className="text-sm text-muted-foreground mb-2">{survey.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {survey.questions.length} {t('questions') || 'questions'}
                    </span>
                    <span className="capitalize">{survey.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
