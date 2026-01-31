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
    const response = await apiClient.post('/real-estate-contacts', data);
    return extractApiData(response);
  },

  /**
   * List all contacts with optional filters
   */
  async list(params?: ListContactsParams): Promise<{ data: RealEstateContactListResponse }> {
    const response = await apiClient.get('/real-estate-contacts', { params });
    return extractApiData(response);
  },

  /**
   * Get a specific contact by ID
   */
  async get(id: number): Promise<{ data: RealEstateContact }> {
    const response = await apiClient.get(`/real-estate-contacts/${id}`);
    return extractApiData(response);
  },

  /**
   * Update a contact
   */
  async update(id: number, data: RealEstateContactUpdate): Promise<{ data: RealEstateContact }> {
    const response = await apiClient.put(`/real-estate-contacts/${id}`, data);
    return extractApiData(response);
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
    const response = await apiClient.post(`/transactions/${transactionId}/contacts`, data);
    return extractApiData(response);
  },

  /**
   * Get all contacts for a transaction
   */
  async getTransactionContacts(
    transactionId: number,
    role?: string
  ): Promise<{ data: TransactionContactListResponse }> {
    const response = await apiClient.get(`/transactions/${transactionId}/contacts`, {
      params: role ? { role } : undefined,
    });
    return extractApiData(response);
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
