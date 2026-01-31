/**
 * Reports API
 * API client for dashboard reports endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';
import type { ReportConfig, ReportData } from '@/components/analytics';

export interface Report {
  id: number;
  name: string;
  description?: string;
  config: ReportConfig;
  data: ReportData['data'];
  user_id: number;
  generated_at: string;
  created_at: string;
  updated_at: string;
}

export interface ReportCreate {
  name: string;
  description?: string;
  config: ReportConfig;
  data?: ReportData['data'];
}

export interface ReportUpdate {
  name?: string;
  description?: string;
  config?: ReportConfig;
  data?: ReportData['data'];
}

/**
 * Reports API client
 */
export const reportsAPI = {
  /**
   * Get list of reports with pagination
   */
  list: async (skip = 0, limit = 100): Promise<Report[]> => {
    const response = await apiClient.get<Report[]>('/v1/reports', {
      params: { skip, limit },
    });

    // Handle both array and paginated response formats
    const data = extractApiData<Report[] | { items: Report[] }>(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as { items: Report[] }).items;
    }
    return [];
  },

  /**
   * Get a report by ID
   */
  get: async (reportId: number): Promise<Report> => {
    const response = await apiClient.get<Report>(`/v1/reports/${reportId}`);
    const data = extractApiData<Report>(response);
    if (!data) {
      throw new Error(`Report not found: ${reportId}`);
    }
    return data;
  },

  /**
   * Create a new report
   */
  create: async (data: ReportCreate): Promise<Report> => {
    const response = await apiClient.post<Report>('/v1/reports', data);
    const result = extractApiData<Report>(response);
    if (!result) {
      throw new Error('Failed to create report: no data returned');
    }
    return result;
  },

  /**
   * Update an existing report
   */
  update: async (id: number, data: ReportUpdate): Promise<Report> => {
    const response = await apiClient.put<Report>(`/v1/reports/${id}`, data);
    const result = extractApiData<Report>(response);
    if (!result) {
      throw new Error('Failed to update report: no data returned');
    }
    return result;
  },

  /**
   * Delete a report
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/v1/reports/${id}`);
  },

  /**
   * Refresh a report (regenerate data)
   */
  refresh: async (id: number): Promise<Report> => {
    const response = await apiClient.post<Report>(`/v1/reports/${id}/refresh`);
    const result = extractApiData<Report>(response);
    if (!result) {
      throw new Error('Failed to refresh report: no data returned');
    }
    return result;
  },
};
