/**
 * Formulaire API Client
 * API client pour les formulaires OACIQ
 */

import { AxiosInstance } from 'axios';
import {
  OACIQForm,
  OACIQFormSubmission,
  OACIQFormCategory,
  FormSubmissionStatus,
  CreateOACIQFormSubmission,
  ExtractFieldsRequest,
  ExtractFieldsResponse,
} from '../types';

export function createOACIQFormsAPI(
  apiClient: AxiosInstance,
  extractApiData: <T>(response: any) => T
) {
  return {
    /**
     * Liste tous les formulaires OACIQ
     */
    list: async (category?: OACIQFormCategory): Promise<OACIQForm[]> => {
      const params = category ? { category } : {};
      const response = await apiClient.get('/v1/oaciq/forms', { params });
      return extractApiData<OACIQForm[]>(response);
    },

    /**
     * Obtenir un formulaire par code
     */
    getByCode: async (code: string): Promise<OACIQForm> => {
      const response = await apiClient.get(`/v1/oaciq/forms/${code}`);
      return extractApiData<OACIQForm>(response);
    },

    /**
     * Créer un nouveau formulaire OACIQ
     */
    create: async (data: {
      code: string;
      name: string;
      category: OACIQFormCategory;
      pdfUrl?: string;
      fields?: Record<string, any>;
      transactionId?: number;
    }): Promise<OACIQForm> => {
      const response = await apiClient.post('/v1/oaciq/forms', data);
      return extractApiData<OACIQForm>(response);
    },

    /**
     * Mettre à jour un formulaire OACIQ
     */
    update: async (
      code: string,
      data: {
        name?: string;
        category?: OACIQFormCategory;
        pdfUrl?: string;
        fields?: Record<string, any>;
        transactionId?: number;
      }
    ): Promise<OACIQForm> => {
      const response = await apiClient.put(`/v1/oaciq/forms/${code}`, data);
      return extractApiData<OACIQForm>(response);
    },

    /**
     * Extraire les champs d'un formulaire PDF avec l'IA
     */
    extractFields: async (
      formCode: string,
      pdfUrl: string
    ): Promise<ExtractFieldsResponse> => {
      const response = await apiClient.post('/v1/oaciq/forms/extract-fields', {
        formCode,
        pdfUrl,
      });
      return extractApiData<ExtractFieldsResponse>(response);
    },

    /**
     * Créer une soumission de formulaire
     */
    createSubmission: async (
      data: CreateOACIQFormSubmission
    ): Promise<OACIQFormSubmission> => {
      const response = await apiClient.post('/v1/oaciq/forms/submissions', data);
      return extractApiData<OACIQFormSubmission>(response);
    },

    /**
     * Liste les soumissions de formulaires
     */
    listSubmissions: async (params?: {
      transactionId?: number;
      formCode?: string;
    }): Promise<OACIQFormSubmission[]> => {
      const response = await apiClient.get('/v1/oaciq/forms/submissions', {
        params,
      });
      return extractApiData<OACIQFormSubmission[]>(response);
    },

    /**
     * Obtenir une soumission par ID
     */
    getSubmission: async (
      submissionId: number
    ): Promise<OACIQFormSubmission> => {
      const response = await apiClient.get(
        `/v1/oaciq/forms/submissions/${submissionId}`
      );
      return extractApiData<OACIQFormSubmission>(response);
    },
  };
}
