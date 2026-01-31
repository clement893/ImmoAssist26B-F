/**
 * OACIQ Forms Module Adapters
 * Adapters pour utiliser le package @immoassist/formulaire avec l'apiClient de l'application
 */

import { createOACIQFormsAPI } from '@immoassist/formulaire/api';
import { apiClient } from './client';
import { extractApiData } from './utils';

// Créer l'instance de l'API avec l'apiClient de l'application
export const oaciqFormsAPI = createOACIQFormsAPI(apiClient as any, extractApiData);

// Réexporter les types pour compatibilité
export type {
  OACIQForm,
  OACIQFormSubmission,
  OACIQFormCategory,
  FormSubmissionStatus,
  FormFieldConfig,
  FormSection,
  OACIQFormFields,
  CreateOACIQFormSubmission,
  ExtractFieldsRequest,
  ExtractFieldsResponse,
} from '@immoassist/formulaire/types';
