/**
 * Real Estate Contacts API
 * API client for real estate contacts endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';
import {
  RealEstateContact,
  RealEstateContactCreate,
  RealEstateContactUpdate,
  RealEstateContactListResponse,
  TransactionContact,
  TransactionContactCreate,
  TransactionContactListResponse,
  ContactType,
} from '@/types/real-estate-contact';

export interface ListContactsParams {
  skip?: number;
  limit?: number;
  type?: ContactType;
  search?: string;
}

export const realEstateContactsAPI = {
  /**
   * Create a new contact
   */
  async create(data: RealEstateContactCreate): Promise<{ data: RealEstateContact }> {
    const response = await apiClient.post<RealEstateContact>('/real-estate-contacts', data);
    return { data: extractApiData<RealEstateContact>(response) };
  },

  /**
   * List all contacts with optional filters
   */
  async list(params?: ListContactsParams): Promise<{ data: RealEstateContactListResponse }> {
    const response = await apiClient.get<RealEstateContactListResponse>('/real-estate-contacts', { params });
    return { data: extractApiData<RealEstateContactListResponse>(response) };
  },

  /**
   * Get a specific contact by ID
   */
  async get(id: number): Promise<{ data: RealEstateContact }> {
    const response = await apiClient.get<RealEstateContact>(`/real-estate-contacts/${id}`);
    return { data: extractApiData<RealEstateContact>(response) };
  },

  /**
   * Update a contact
   */
  async update(id: number, data: RealEstateContactUpdate): Promise<{ data: RealEstateContact }> {
    const response = await apiClient.put<RealEstateContact>(`/real-estate-contacts/${id}`, data);
    return { data: extractApiData<RealEstateContact>(response) };
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
    const response = await apiClient.post<TransactionContact>(`/v1/transactions/${transactionId}/contacts`, data);
    return { data: extractApiData<TransactionContact>(response) };
  },

  /**
   * Get all contacts for a transaction
   */
  async getTransactionContacts(
    transactionId: number,
    role?: string
  ): Promise<{ data: TransactionContactListResponse }> {
    const response = await apiClient.get<TransactionContactListResponse>(`/v1/transactions/${transactionId}/contacts`, {
      params: role ? { role } : undefined,
    });
    return { data: extractApiData<TransactionContactListResponse>(response) };
  },

  /**
   * Remove a contact from a transaction
   */
  async removeFromTransaction(
    transactionId: number,
    contactId: number,
    role: string
  ): Promise<void> {
    await apiClient.delete(`/v1/transactions/${transactionId}/contacts/${contactId}/${encodeURIComponent(role)}`);
  },
};
