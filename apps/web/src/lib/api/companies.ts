/**
 * Companies API
 * API client for companies/enterprises endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface Company {
  id: number;
  name: string;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  logo_filename?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  size?: string | null;
  city?: string | null;
  country?: string | null;
  is_client?: boolean;
  parent_company_id?: number | null;
  parent_company_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyCreate {
  name: string;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  logo_filename?: string | null;
  industry?: string | null;
  size?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface CompanyUpdate extends Partial<CompanyCreate> {}

/**
 * Companies API client
 */
export const companiesAPI = {
  /**
   * Get list of companies with pagination
   */
  list: async (skip = 0, limit = 100): Promise<Company[]> => {
    const response = await apiClient.get<Company[]>('/v1/reseau/companies', {
      params: { skip, limit },
    });

    const data = extractApiData<Company[] | { items: Company[] }>(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as { items: Company[] }).items;
    }
    return [];
  },

  /**
   * Get a company by ID
   */
  get: async (companyId: number): Promise<Company> => {
    const response = await apiClient.get<Company>(`/v1/reseau/companies/${companyId}`);
    const data = extractApiData<Company>(response);
    if (!data) {
      throw new Error(`Company not found: ${companyId}`);
    }
    return data;
  },

  /**
   * Create a new company
   */
  create: async (company: CompanyCreate): Promise<Company> => {
    const response = await apiClient.post<Company>('/v1/reseau/companies', company);
    const data = extractApiData<Company>(response);
    if (!data) {
      throw new Error('Failed to create company: no data returned');
    }
    return data;
  },

  /**
   * Update a company
   */
  update: async (companyId: number, company: CompanyUpdate): Promise<Company> => {
    const response = await apiClient.put<Company>(`/v1/reseau/companies/${companyId}`, company);
    const data = extractApiData<Company>(response);
    if (!data) {
      throw new Error('Failed to update company: no data returned');
    }
    return data;
  },

  /**
   * Delete a company
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/reseau/companies/${id}`);
  },

  /**
   * Import companies from file
   */
  import: async (
    file: File
  ): Promise<{
    valid_rows: number;
    invalid_rows: number;
    warnings?: Array<{ row: number; message: string }>;
    logos_uploaded?: number;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<{
      valid_rows: number;
      invalid_rows: number;
      warnings?: Array<{ row: number; message: string }>;
      logos_uploaded?: number;
    }>('/v1/reseau/companies/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return extractApiData(response) || { valid_rows: 0, invalid_rows: 0 };
  },

  /**
   * Export companies to Excel
   */
  export: async (): Promise<Blob> => {
    const response = await apiClient.get<Blob>('/v1/reseau/companies/export', {
      responseType: 'blob',
    });
    if (!response.data) {
      throw new Error('Failed to export companies: no data returned');
    }
    return response.data;
  },

  /**
   * Download Excel template
   */
  downloadTemplate: async (): Promise<void> => {
    const response = await apiClient.get<Blob>('/v1/reseau/companies/template', {
      responseType: 'blob',
    });
    if (!response.data) {
      throw new Error('Failed to download template: no data returned');
    }
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'companies-template.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Download ZIP template with logos
   */
  downloadZipTemplate: async (): Promise<void> => {
    const response = await apiClient.get<Blob>('/v1/reseau/companies/template-zip', {
      responseType: 'blob',
    });
    if (!response.data) {
      throw new Error('Failed to download ZIP template: no data returned');
    }
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'companies-template.zip';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
