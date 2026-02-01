/**
 * OACIQ Forms API Client
 * Client API pour gérer les formulaires OACIQ
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface OACIQForm {
  id: number;
  code: string;
  name: string;
  category: 'obligatoire' | 'recommandé' | 'curateur_public';
  pdf_url?: string;
  fields?: any;
  transaction_id?: number;
  user_id?: number;
  created_at: string;
  updated_at: string;
}

export interface OACIQFormSubmission {
  id: number;
  form_id: number;
  form_code?: string;
  transaction_id?: number;
  data: Record<string, any>;
  status: 'draft' | 'completed' | 'signed';
  user_id?: number;
  submitted_at: string;
}

export interface ExtractFieldsRequest {
  form_code: string;
  pdf_url: string;
}

export interface ExtractFieldsResponse {
  success: boolean;
  fields: any;
  form: OACIQForm;
}

/**
 * OACIQ Forms API client
 */
export const oaciqFormsAPI = {
  /**
   * Liste tous les formulaires OACIQ
   */
  list: async (params?: {
    category?: 'obligatoire' | 'recommandé' | 'curateur_public';
    search?: string;
  }): Promise<OACIQForm[]> => {
    const response = await apiClient.get<OACIQForm[]>('/v1/oaciq/forms', {
      params,
    });
    return extractApiData(response);
  },

  /**
   * Obtenir un formulaire par code
   */
  getByCode: async (code: string): Promise<OACIQForm> => {
    const response = await apiClient.get<OACIQForm>(`/v1/oaciq/forms/${code}`);
    const data = extractApiData(response);
    if (!data) {
      throw new Error(`Formulaire OACIQ introuvable: ${code}`);
    }
    return data;
  },

  /**
   * Créer une nouvelle soumission
   */
  createSubmission: async (data: {
    form_code: string;
    transaction_id?: number;
  }): Promise<OACIQFormSubmission> => {
    const response = await apiClient.post<OACIQFormSubmission>('/v1/oaciq/forms/submissions', {
      form_code: data.form_code,
      transaction_id: data.transaction_id,
      data: {},
      status: 'draft',
    });
    return extractApiData(response);
  },

  /**
   * Sauvegarder une soumission
   */
  saveSubmission: async (
    submissionId: number,
    data: {
      data: Record<string, any>;
      isAutoSave?: boolean;
    }
  ): Promise<OACIQFormSubmission> => {
    const response = await apiClient.put<OACIQFormSubmission>(
      `/v1/oaciq/forms/submissions/${submissionId}`,
      {
        data: data.data,
        is_auto_save: data.isAutoSave || false,
      }
    );
    return extractApiData(response) as OACIQFormSubmission;
  },

  /**
   * Compléter une soumission
   */
  completeSubmission: async (submissionId: number): Promise<{ success: boolean }> => {
    const response = await apiClient.patch(`/v1/oaciq/forms/submissions/${submissionId}/complete`);
    return extractApiData(response) as { success: boolean };
  },

  /**
   * Obtenir une soumission
   */
  getSubmission: async (submissionId: number): Promise<OACIQFormSubmission> => {
    const response = await apiClient.get<OACIQFormSubmission>(
      `/v1/oaciq/forms/submissions/${submissionId}`
    );
    return extractApiData(response);
  },

  /**
   * Lister les soumissions d'une transaction
   */
  listSubmissions: async (params?: {
    transaction_id?: number;
    form_code?: string;
  }): Promise<OACIQFormSubmission[]> => {
    const response = await apiClient.get<OACIQFormSubmission[]>('/v1/oaciq/forms/submissions', {
      params,
    });
    return extractApiData(response);
  },

  /**
   * Extraire les champs d'un formulaire avec l'IA
   */
  extractFields: async (request: ExtractFieldsRequest): Promise<ExtractFieldsResponse> => {
    const response = await apiClient.post<ExtractFieldsResponse>(
      '/v1/oaciq/forms/extract-fields',
      request
    );
    return extractApiData(response);
  },
};
