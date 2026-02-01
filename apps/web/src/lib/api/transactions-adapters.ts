/**
 * Transactions Module Adapters
 * Adapters pour utiliser le package @immoassist/transactions avec l'apiClient de l'application
 */

import {
  createTransactionsAPI,
  createRealEstateContactsAPI,
} from '@immoassist/transactions/api';
import { apiClient } from './client';
import { extractApiData } from './utils';

// Créer les instances de l'API avec l'apiClient de l'application
const _transactionsAPI = createTransactionsAPI({
  apiClient: apiClient as any, // apiClient est compatible avec AxiosInstance
  extractApiData,
});

// Wrapper pour maintenir la compatibilité avec l'ancienne API
// L'ancienne API retournait directement les réponses axios avec response.data
// On doit donc wrapper pour retourner le même format
export const transactionsAPI = {
  list: async (params?: { skip?: number; limit?: number; status?: string; search?: string }) => {
    const result = await _transactionsAPI.list(params);
    // Retourner dans le format axios attendu par le code existant
    return {
      data: result.data, // result.data contient { transactions: [...] }
    } as any;
  },
  get: async (transactionId: number) => {
    const result = await _transactionsAPI.get(transactionId);
    // Retourner dans le format axios attendu
    return {
      data: result.data, // result.data contient la transaction
    } as any;
  },
  create: async (data: any) => {
    const result = await _transactionsAPI.create(data);
    // Retourner dans le format axios attendu
    return {
      data: result.data, // result.data contient la transaction créée
    } as any;
  },
  update: async (transactionId: number, data: any) => {
    const result = await _transactionsAPI.update(transactionId, data);
    // Retourner dans le format axios attendu
    return {
      data: result.data, // result.data contient la transaction mise à jour
    } as any;
  },
  delete: async (transactionId: number) => {
    await _transactionsAPI.delete(transactionId);
  },
  analyzePDF: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/v1/transactions/analyze-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      data: response.data,
    } as any;
  },
  addDocument: async (transactionId: number, file: File, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    const response = await apiClient.post(`/v1/transactions/${transactionId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      data: response.data,
    } as any;
  },
  removeDocument: async (transactionId: number, documentId: number) => {
    const response = await apiClient.delete(`/v1/transactions/${transactionId}/documents/${documentId}`);
    return {
      data: response.data,
    } as any;
  },
  addPhoto: async (transactionId: number, file: File, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    const response = await apiClient.post(`/v1/transactions/${transactionId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      data: response.data,
    } as any;
  },
  refreshDocumentUrl: async (transactionId: number, documentId: number) => {
    const response = await apiClient.post(`/v1/transactions/${transactionId}/documents/${documentId}/refresh-url`);
    return {
      data: response.data,
    } as any;
  },
};

export const realEstateContactsAPI = createRealEstateContactsAPI({
  apiClient: apiClient as any,
  extractApiData,
});

// Réexporter les types pour compatibilité
export type {
  Transaction,
  TransactionCreate,
  TransactionUpdate,
  RealEstateContact,
  RealEstateContactCreate,
  RealEstateContactUpdate,
  TransactionContact,
  TransactionContactCreate,
  ContactType,
  TransactionRole,
  TRANSACTION_ROLES,
} from '@immoassist/transactions';
