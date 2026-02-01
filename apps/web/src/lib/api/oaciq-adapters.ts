/**
 * OACIQ Forms Module Adapters
 * Adapters pour utiliser le package @immoassist/formulaire avec l'apiClient de l'application
 */

import { createOACIQFormsAPI } from '@immoassist/formulaire/api';
import { apiClient } from './client';
import { extractApiData } from './utils';

// Créer l'instance de l'API avec l'apiClient de l'application
const baseOaciqAPI = createOACIQFormsAPI(apiClient as any, extractApiData);

export const oaciqFormsAPI = {
  ...baseOaciqAPI,
  getPdfPreviewApiUrl: (code: string, lang: 'fr' | 'en' = 'fr'): string =>
    `/v1/oaciq/forms/${code}/pdf-preview?lang=${lang}`,
  getPdfPreviewBlob: async (code: string, lang: 'fr' | 'en' = 'fr'): Promise<Blob> => {
    const url = oaciqFormsAPI.getPdfPreviewApiUrl(code, lang);
    const result = await apiClient.get<Blob>(url, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    } as any);
    return result instanceof Blob ? result : new Blob([result as unknown as BlobPart], { type: 'application/pdf' });
  },
};

// Réexporter les types pour compatibilité
export type {
  OACIQForm,
  OACIQFormSubmission,
  FormFieldConfig,
  FormSection,
  OACIQFormFields,
  CreateOACIQFormSubmission,
  ExtractFieldsRequest,
  ExtractFieldsResponse,
} from '@immoassist/formulaire/types';

// Réexporter les enums comme valeurs (pas comme types)
export {
  OACIQFormCategory,
  FormSubmissionStatus,
} from '@immoassist/formulaire/types';
