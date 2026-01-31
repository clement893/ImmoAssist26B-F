/**
 * Contacts API
 * API client for commercial contacts endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  company_id: number | null;
  company_name?: string;
  position: string | null;
  circle: string | null;
  linkedin: string | null;
  photo_url: string | null;
  photo_filename: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  birthday: string | null;
  language: string | null;
  employee_id: number | null;
  employee_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactCreate {
  first_name: string;
  last_name: string;
  company_id?: number | null;
  company_name?: string | null;
  position?: string | null;
  circle?: string | null;
  linkedin?: string | null;
  photo_url?: string | null;
  photo_filename?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  birthday?: string | null;
  language?: string | null;
  employee_id?: number | null;
}

export interface ContactUpdate extends Partial<ContactCreate> {}

/**
 * Contacts API client
 */
export const contactsAPI = {
  /**
   * Get list of contacts with pagination
   */
  list: async (skip = 0, limit = 100): Promise<Contact[]> => {
    const response = await apiClient.get<Contact[]>('/v1/commercial/contacts', {
      params: {
        skip,
        limit,
        _t: Date.now(),
      },
    });

    const data = extractApiData<Contact[] | { items: Contact[] }>(response);
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
    const response = await apiClient.get<Contact>(`/v1/commercial/contacts/${contactId}`);
    const data = extractApiData<Contact>(response);
    if (!data) {
      throw new Error(`Contact not found: ${contactId}`);
    }
    return data;
  },

  /**
   * Create a new contact
   */
  create: async (contact: ContactCreate): Promise<Contact> => {
    const response = await apiClient.post<Contact>('/v1/commercial/contacts', contact);
    const data = extractApiData<Contact>(response);
    if (!data) {
      throw new Error('Failed to create contact: no data returned');
    }
    return data;
  },

  /**
   * Update a contact
   */
  update: async (contactId: number, contact: ContactUpdate): Promise<Contact> => {
    const response = await apiClient.put<Contact>(`/v1/commercial/contacts/${contactId}`, contact);
    const data = extractApiData<Contact>(response);
    if (!data) {
      throw new Error('Failed to update contact: no data returned');
    }
    return data;
  },

  /**
   * Delete a contact
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/commercial/contacts/${id}`);
  },
};
