/**
 * Forms Management Page
 *
 * Page for managing dynamic forms.
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CMSFormBuilder } from '@/components/cms';
import type { CMSForm } from '@/components/cms';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert, useToast } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { formsAPI } from '@/lib/api';
import { handleApiError } from '@/lib/errors/api';
import { logger } from '@/lib/logger';

export default function FormsPage() {
  const t = useTranslations('forms');
  const [form, setForm] = useState<CMSForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadForm();
  }, []);

  const { showToast } = useToast();

  const loadForm = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await formsAPI.list();
      const forms = response.data || [];

      if (forms.length > 0) {
        const firstForm = forms[0];
        setForm({
          id: String(firstForm.id),
          name: firstForm.name,
          description: firstForm.description || '',
          fields: firstForm.fields || [],
          submitButtonText: firstForm.submit_button_text || 'Submit',
          successMessage: firstForm.success_message || '',
        });
      } else {
        setForm(null);
      }
      setIsLoading(false);
    } catch (error) {
      const appError = handleApiError(error);
      logger.error('Failed to load form', appError);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load form. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedForm: CMSForm) => {
    try {
      setIsLoading(true);
      setError(null);

      if (updatedForm.id && updatedForm.id !== '') {
        // Update existing form
        const formId = parseInt(updatedForm.id, 10);
        await formsAPI.update(formId, {
          name: updatedForm.name,
          description: updatedForm.description,
          fields: updatedForm.fields,
          submit_button_text: updatedForm.submitButtonText,
          success_message: updatedForm.successMessage,
        });
        showToast({ message: 'Form updated successfully', type: 'success' });
      } else {
        // Create new form
        const response = await formsAPI.create({
          name: updatedForm.name,
          description: updatedForm.description,
          fields: updatedForm.fields,
          submit_button_text: updatedForm.submitButtonText,
          success_message: updatedForm.successMessage,
        });
        setForm({
          id: String(response.data.id),
          name: response.data.name,
          description: response.data.description || '',
          fields: response.data.fields || [],
          submitButtonText: response.data.submit_button_text || 'Submit',
          successMessage: response.data.success_message || '',
        });
        showToast({ message: 'Form created successfully', type: 'success' });
      }

      await loadForm();
    } catch (error) {
      const appError = handleApiError(error);
      logger.error('Failed to save form', appError);
      setError(appError.message || 'Failed to save form. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
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
          title={t('title') || 'Form Builder'}
          description={t('description') || 'Create and manage dynamic forms'}
          breadcrumbs={[
            { label: t('breadcrumbs.home') || 'Home', href: '/' },
            { label: t('breadcrumbs.forms') || 'Forms' },
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
          <CMSFormBuilder form={form || undefined} onSave={handleSave} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
