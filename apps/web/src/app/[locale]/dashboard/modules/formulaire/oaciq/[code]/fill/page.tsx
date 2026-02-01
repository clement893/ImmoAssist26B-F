/**
 * OACIQ Form Fill Page
 * Page de remplissage dynamique d'un formulaire OACIQ
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import Progress from '@/components/ui/Progress';
import { Save, Check, ArrowLeft } from 'lucide-react';
import { oaciqFormsAPI } from '@/lib/api/oaciq-forms';
import { FormRenderer } from '@/components/forms/FormRenderer';
import { useToast } from '@/lib/toast';
import { handleApiError } from '@/lib/errors';

export default function FormFillPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const formCode = params.code as string;

  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: form, isLoading: formLoading } = useQuery({
    queryKey: ['oaciq-form', formCode],
    queryFn: () => oaciqFormsAPI.getByCode(formCode),
  });

  const createSubmissionMutation = useMutation({
    mutationFn: oaciqFormsAPI.createSubmission,
    onSuccess: (data) => {
      setSubmissionId(data.id);
      if (data.data) {
        setFormData(data.data);
      }
    },
  });

  const { success: showSuccess, error: showError } = useToast();

  const saveSubmissionMutation = useMutation({
    mutationFn: ({ id, data, isAutoSave }: { id: number; data: Record<string, any>; isAutoSave: boolean }) =>
      oaciqFormsAPI.saveSubmission(id, { data, isAutoSave }),
    onSuccess: () => {
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['oaciq-submission', submissionId] });
    },
    onError: (error) => {
      console.error('Erreur lors de la sauvegarde:', error);
    },
  });

  const completeSubmissionMutation = useMutation({
    mutationFn: oaciqFormsAPI.completeSubmission,
    onSuccess: () => {
      router.push('/dashboard/modules/formulaire/oaciq');
    },
  });

  // Créer une nouvelle soumission au chargement
  useEffect(() => {
    if (form && !submissionId && !createSubmissionMutation.isPending) {
      createSubmissionMutation.mutate({ form_code: form.code });
    }
  }, [form, submissionId]);

  // Sauvegarde automatique toutes les 30 secondes
  useEffect(() => {
    if (!submissionId || !hasUnsavedChanges) return;

    const interval = setInterval(() => {
      handleSave(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [submissionId, formData, hasUnsavedChanges]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async (isAutoSave = false) => {
    if (!submissionId) return;

    try {
      await saveSubmissionMutation.mutateAsync({
        id: submissionId,
        data: formData,
        isAutoSave,
      });

      if (!isAutoSave) {
        showSuccess('Formulaire sauvegardé');
      }
    } catch (error) {
      const appError = handleApiError(error);
      showError(appError.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleComplete = async () => {
    if (!submissionId) return;

    try {
      await handleSave(false);
      await completeSubmissionMutation.mutateAsync(submissionId);
    } catch (error) {
      const appError = handleApiError(error);
      showError(appError.message || 'Erreur lors de la complétion');
    }
  };

  if (formLoading || !form) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      </div>
    );
  }

  const fields = form.fields;
  const completionPercentage = calculateCompletion(formData, fields);

  return (
    <div className="container max-w-5xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {form.code}
              </span>
            </div>
            <h1 className="text-2xl font-bold">{form.name}</h1>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {completionPercentage}%
            </div>
            <div className="text-xs text-muted-foreground">Complété</div>
          </div>
        </div>

        <Progress value={completionPercentage} className="mt-4" />
      </div>

      {/* Formulaire */}
      {fields && (
        <FormRenderer
          fields={fields}
          data={formData}
          onChange={handleFieldChange}
        />
      )}

      {/* Actions */}
      <Card className="p-4 mt-6 sticky bottom-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasUnsavedChanges && '● Modifications non sauvegardées'}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={!hasUnsavedChanges || saveSubmissionMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>

            <Button
              size="sm"
              onClick={handleComplete}
              disabled={completionPercentage < 100 || completeSubmissionMutation.isPending}
            >
              <Check className="h-4 w-4 mr-2" />
              Compléter
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function calculateCompletion(data: Record<string, any>, fields: any): number {
  if (!fields || !fields.sections) return 0;

  const requiredFields = fields.sections.reduce((acc: string[], section: any) => {
    const required = section.fields
      ?.filter((f: any) => f.required)
      .map((f: any) => f.name || f.id) || [];
    return [...acc, ...required];
  }, []);

  if (requiredFields.length === 0) return 100;

  const filledFields = requiredFields.filter((field: string) => {
    const value = data[field];
    return value !== null && value !== undefined && value !== '';
  });

  return Math.round((filledFields.length / requiredFields.length) * 100);
}
