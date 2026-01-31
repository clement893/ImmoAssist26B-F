/**
 * Survey Utilities
 *
 * Utility functions for survey/questionnaire data conversion and manipulation
 */

import type { Survey, SurveySettings } from '@/components/surveys/SurveyBuilder';

/**
 * Default survey settings
 */
export const defaultSurveySettings: SurveySettings = {
  allowAnonymous: true,
  requireAuth: false,
  limitOneResponse: false,
  limitOneResponsePerUser: true,
  showProgressBar: true,
  randomizeQuestions: false,
  publicLinkEnabled: false,
};

/**
 * Backend Form API response structure
 */
interface BackendForm {
  id: number | string;
  name?: string;
  description?: string;
  fields?: Array<Record<string, unknown>>;
  settings?: SurveySettings;
  submit_button_text?: string;
  success_message?: string;
  status?: string;
}

/**
 * Convert Form API response to Survey format
 */
export function formToSurvey(form: BackendForm): Survey {
  return {
    id: String(form.id),
    name: form.name || '',
    description: form.description || '',
    questions: (form.fields || []) as unknown as Survey['questions'],
    settings: form.settings || defaultSurveySettings,
    submitButtonText: form.submit_button_text,
    successMessage: form.success_message,
    status:
      form.status === 'draft' || form.status === 'published' || form.status === 'closed'
        ? form.status
        : 'draft',
  };
}

/**
 * Convert Survey format to Form API format
 */
export function surveyToForm(survey: Survey): {
  name: string;
  description?: string;
  fields: Array<Record<string, unknown>>;
  submit_button_text?: string;
  success_message?: string;
  settings?: Record<string, unknown>;
} {
  return {
    name: survey.name,
    description: survey.description,
    fields: survey.questions as unknown as Array<Record<string, unknown>>,
    submit_button_text: survey.submitButtonText,
    success_message: survey.successMessage,
    settings: survey.settings as unknown as Record<string, unknown>,
  };
}

/**
 * Validate survey before save
 */
export function validateSurvey(survey: Survey): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!survey.name || survey.name.trim() === '') {
    errors.push('Survey name is required');
  }

  if (survey.questions.length === 0) {
    errors.push('At least one question is required');
  }

  // Validate questions
  survey.questions.forEach((question, index) => {
    if (!question.label || question.label.trim() === '') {
      errors.push(`Question ${index + 1}: Label is required`);
    }
    if (!question.name || question.name.trim() === '') {
      errors.push(`Question ${index + 1}: Field name is required`);
    }
    if (
      (question.type === 'select' ||
        question.type === 'radio' ||
        question.type === 'checkbox' ||
        question.type === 'ranking') &&
      (!question.options || question.options.length === 0)
    ) {
      errors.push(`Question ${index + 1}: Options are required for ${question.type} type`);
    }
    if (
      question.type === 'matrix' &&
      (!question.matrixRows ||
        question.matrixRows.length === 0 ||
        !question.matrixColumns ||
        question.matrixColumns.length === 0)
    ) {
      errors.push(`Question ${index + 1}: Matrix rows and columns are required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
