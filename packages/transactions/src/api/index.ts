/**
 * Transactions API
 * API client for real estate transactions endpoints
 * 
 * Note: This package requires an apiClient instance to be provided
 * by the consuming application. The apiClient should be compatible
 * with axios-like interface.
 */

import type { AxiosInstance } from 'axios';
import type {
  Transaction,
  TransactionCreate,
  TransactionUpdate,
  RealEstateContact,
  RealEstateContactCreate,
  RealEstateContactUpdate,
  RealEstateContactListResponse,
  TransactionContact,
  TransactionContactCreate,
  TransactionContactListResponse,
  ContactType,
} from '../types';

export interface TransactionsAPIConfig {
  apiClient: AxiosInstance;
  extractApiData?: <T>(response: any) => T;
}

/**
 * Create transactions API client
 */
export function createTransactionsAPI(config: TransactionsAPIConfig) {
  const { apiClient, extractApiData = <T>(data: any): T => data as T } = config;

  return {
    /**
     * List all transactions with optional filters
     */
    list: async (params?: {
      skip?: number;
      limit?: number;
      status?: string;
      search?: string;
    }): Promise<{ data: { transactions: Transaction[] } }> => {
      const response = await apiClient.get('/v1/transactions', { params });
      const data = extractApiData<{ transactions: Transaction[] }>(response.data || response);
      return { data };
    },

    /**
     * Get a specific transaction by ID
     */
    get: async (transactionId: number): Promise<{ data: Transaction }> => {
      const response = await apiClient.get(`/v1/transactions/${transactionId}`);
      const data = extractApiData<Transaction>(response.data || response);
      return { data };
    },

    /**
     * Create a new transaction
     */
    create: async (data: TransactionCreate): Promise<{ data: Transaction }> => {
      const response = await apiClient.post('/v1/transactions', data);
      const transaction = extractApiData<Transaction>(response.data || response);
      return { data: transaction };
    },

    /**
     * Update a transaction
     */
    update: async (transactionId: number, data: TransactionUpdate): Promise<{ data: Transaction }> => {
      const response = await apiClient.put(`/v1/transactions/${transactionId}`, data);
      const transaction = extractApiData<Transaction>(response.data || response);
      return { data: transaction };
    },

    /**
     * Delete a transaction
     */
    delete: async (transactionId: number): Promise<void> => {
      await apiClient.delete(`/v1/transactions/${transactionId}`);
    },
  };
}

/**
 * Create real estate contacts API client
 */
export function createRealEstateContactsAPI(config: TransactionsAPIConfig) {
  const { apiClient, extractApiData = (data: any) => data } = config;

  return {
    /**
     * Create a new contact
     */
    async create(data: RealEstateContactCreate): Promise<{ data: RealEstateContact }> {
      const response = await apiClient.post<RealEstateContact>('/real-estate-contacts', data);
      return { data: extractApiData<RealEstateContact>(response.data || response) };
    },

    /**
     * List all contacts with optional filters
     */
    async list(params?: {
      skip?: number;
      limit?: number;
      type?: ContactType;
      search?: string;
    }): Promise<{ data: RealEstateContactListResponse }> {
      const response = await apiClient.get<RealEstateContactListResponse>('/real-estate-contacts', { params });
      return { data: extractApiData<RealEstateContactListResponse>(response.data || response) };
    },

    /**
     * Get a specific contact by ID
     */
    async get(id: number): Promise<{ data: RealEstateContact }> {
      const response = await apiClient.get<RealEstateContact>(`/real-estate-contacts/${id}`);
      return { data: extractApiData<RealEstateContact>(response.data || response) };
    },

    /**
     * Update a contact
     */
    async update(id: number, data: RealEstateContactUpdate): Promise<{ data: RealEstateContact }> {
      const response = await apiClient.put<RealEstateContact>(`/real-estate-contacts/${id}`, data);
      return { data: extractApiData<RealEstateContact>(response.data || response) };
    },

    /**
     * Delete a contact
     */
    async delete(id: number): Promise<void> {
      await apiClient.delete(`/real-estate-contacts/${id}`);
    },

    /**
     * Add a contact to a transaction with a role
     */
    async addToTransaction(
      transactionId: number,
      data: TransactionContactCreate
    ): Promise<{ data: TransactionContact }> {
      const response = await apiClient.post<TransactionContact>(`/transactions/${transactionId}/contacts`, data);
      return { data: extractApiData<TransactionContact>(response.data || response) };
    },

    /**
     * Get all contacts for a transaction
     */
    async getTransactionContacts(
      transactionId: number,
      role?: string
    ): Promise<{ data: TransactionContactListResponse }> {
      const response = await apiClient.get<TransactionContactListResponse>(`/transactions/${transactionId}/contacts`, {
        params: role ? { role } : undefined,
      });
      return { data: extractApiData<TransactionContactListResponse>(response.data || response) };
    },

    /**
     * Remove a contact from a transaction
     */
    async removeFromTransaction(
      transactionId: number,
      contactId: number,
      role: string
    ): Promise<void> {
      await apiClient.delete(`/transactions/${transactionId}/contacts/${contactId}/${encodeURIComponent(role)}`);
    },
  };
}

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
};
