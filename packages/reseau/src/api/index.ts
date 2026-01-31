/**
 * Réseau Contacts API
 * API client for network module contacts endpoints
 * 
 * Note: This package requires an apiClient instance to be provided
 * by the consuming application. The apiClient should be compatible
 * with axios-like interface.
 */

import type { AxiosInstance } from 'axios';
import type { Contact, ContactCreate, ContactUpdate } from '../types';

export interface ReseauContactsAPIConfig {
  apiClient: AxiosInstance;
  extractApiData?: <T>(response: any) => T;
}

/**
 * Create reseau contacts API client
 */
export function createReseauContactsAPI(config: ReseauContactsAPIConfig) {
  const { apiClient, extractApiData = <T>(data: any): T => data as T } = config;

  return {
    /**
     * Get list of contacts with pagination
     */
    list: async (skip = 0, limit = 100): Promise<Contact[]> => {
      const response = await apiClient.get<Contact[]>('/v1/reseau/contacts', {
        params: {
          skip,
          limit,
          _t: Date.now(), // Cache-busting timestamp
        },
      });

      const data = extractApiData<Contact[] | { items: Contact[] }>(response.data || response);
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object' && 'items' in data) {
        return (data as { items: Contact[] }).items;
      }
      return [];
    },

    /**
     * Get a contact by ID
     */
    get: async (contactId: number): Promise<Contact> => {
      const response = await apiClient.get<Contact>(`/v1/reseau/contacts/${contactId}`);
      const data = extractApiData<Contact>(response.data || response);
      if (!data) {
        throw new Error(`Contact not found: ${contactId}`);
      }
      return data;
    },

    /**
     * Create a new contact
     */
    create: async (contact: ContactCreate): Promise<Contact> => {
      const response = await apiClient.post<Contact>('/v1/reseau/contacts', contact);
      const data = extractApiData<Contact>(response.data || response);
      if (!data) {
        throw new Error('Failed to create contact: no data returned');
      }
      return data;
    },

    /**
     * Update a contact
     */
    update: async (contactId: number, contact: ContactUpdate): Promise<Contact> => {
      const response = await apiClient.put<Contact>(`/v1/reseau/contacts/${contactId}`, contact);
      const data = extractApiData<Contact>(response.data || response);
      if (!data) {
        throw new Error('Failed to update contact: no data returned');
      }
      return data;
    },

    /**
     * Delete a contact
     */
    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/v1/reseau/contacts/${id}`);
    },
  };
}

export type { Contact, ContactCreate, ContactUpdate };
