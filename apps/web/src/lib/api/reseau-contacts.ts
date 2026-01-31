/**
 * Réseau Contacts API
 * API client for network module contacts endpoints
 *
 * For now, uses the same commercial endpoints to maintain compatibility.
 * TODO: Migrate to /v1/reseau/contacts when backend endpoints are created.
 */

import { apiClient } from './client';
import { extractApiData } from './utils';
// Re-use types from contacts API to avoid duplication
import type { Contact, ContactCreate, ContactUpdate } from './contacts';

/**
 * Réseau Contacts API client
 * Currently uses commercial endpoints but with separate namespace
 */
export const reseauContactsAPI = {
  /**
   * Get list of contacts with pagination
   * Uses cache-busting to ensure fresh data
   */
  list: async (skip = 0, limit = 100): Promise<Contact[]> => {
    const response = await apiClient.get<Contact[]>('/v1/reseau/contacts', {
      params: {
        skip,
        limit,
        _t: Date.now(), // Cache-busting timestamp
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
    const response = await apiClient.get<Contact>(`/v1/reseau/contacts/${contactId}`);
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
    const response = await apiClient.post<Contact>('/v1/reseau/contacts', contact);
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
    const response = await apiClient.put<Contact>(`/v1/reseau/contacts/${contactId}`, contact);
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
    await apiClient.delete(`/v1/reseau/contacts/${id}`);
  },

  /**
   * Import contacts from Excel or ZIP (Excel + photos)
   */
  import: async (
    file: File
  ): Promise<{
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    errors: Array<{ row: number; data: unknown; error: string }>;
    warnings?: Array<{
      row: number;
      type: string;
      message: string;
      data?: Record<string, unknown>;
    }>;
    data: Contact[];
    photos_uploaded?: number;
    import_id?: string;
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    // Generate import_id for tracking logs
    const import_id = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = await apiClient.post<{
      total_rows: number;
      valid_rows: number;
      invalid_rows: number;
      errors: Array<{ row: number; data: unknown; error: string }>;
      warnings?: Array<{
        row: number;
        type: string;
        message: string;
        data?: Record<string, unknown>;
      }>;
      data: Contact[];
      photos_uploaded?: number;
      import_id?: string;
    }>('/v1/reseau/contacts/import', formData, {
      params: { import_id },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = extractApiData(response) || {
      total_rows: 0,
      valid_rows: 0,
      invalid_rows: 0,
      errors: [],
      warnings: [],
      data: [],
      photos_uploaded: 0,
    };

    return {
      ...result,
      import_id: result.import_id || import_id,
    };
  },

  /**
   * Export contacts to Excel
   */
  export: async (): Promise<Blob> => {
    try {
      const axios = (await import('axios')).default;
      const { getApiUrl } = await import('../api');
      const apiUrl = getApiUrl();
      const TokenStorage = (await import('../auth/tokenStorage')).TokenStorage;

      const response = await axios.get(`${apiUrl}/api/v1/reseau/contacts/export`, {
        responseType: 'blob',
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? TokenStorage.getToken() || '' : ''}`,
        },
      });

      if (response.status >= 400) {
        const text = await (response.data as Blob).text();
        let errorData: { detail?: string; [key: string]: unknown };
        try {
          errorData = JSON.parse(text) as { detail?: string; [key: string]: unknown };
        } catch (parseError) {
          errorData = { detail: text || 'Export failed' };
        }

        const axiosError = {
          response: {
            status: response.status,
            statusText: response.statusText,
            data: errorData,
            headers: response.headers,
            config: response.config,
          },
          config: response.config,
          isAxiosError: true,
          name: 'AxiosError',
          message: `Request failed with status code ${response.status}`,
        };

        throw axiosError;
      }

      return response.data as Blob;
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: Blob | { detail?: string; [key: string]: unknown } };
      };
      if (axiosError.response?.data instanceof Blob) {
        try {
          const text = await axiosError.response.data.text();
          let errorData: { detail?: string; [key: string]: unknown };
          try {
            errorData = JSON.parse(text) as { detail?: string; [key: string]: unknown };
          } catch (parseError) {
            errorData = { detail: text || 'Export failed' };
          }
          axiosError.response.data = errorData;
        } catch (parseError) {
          if (axiosError.response) {
            axiosError.response.data = { detail: "Erreur lors de l'export" };
          }
        }
      }
      throw error;
    }
  },

  /**
   * Download contact import template (Excel only)
   */
  downloadTemplate: async (): Promise<void> => {
    const { downloadContactTemplate } = await import('@/lib/utils/generateContactTemplate');
    downloadContactTemplate();
  },

  /**
   * Download contact import ZIP template (Excel + instructions + photos folder)
   */
  downloadZipTemplate: async (): Promise<void> => {
    const { downloadContactZipTemplate } = await import('@/lib/utils/generateContactTemplate');
    await downloadContactZipTemplate();
  },
};

// Re-export types for convenience
export type { Contact, ContactCreate, ContactUpdate };
