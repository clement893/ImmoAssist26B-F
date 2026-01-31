/**
 * Analytics API
 * API client for dashboard analytics endpoints
 */

import { apiClient } from './client';
import { extractApiData } from './utils';
import type { AnalyticsMetric } from '@/components/analytics';

export interface AnalyticsResponse {
  metrics: AnalyticsMetric[];
}

export interface AnalyticsParams {
  start_date?: string;
  end_date?: string;
}

/**
 * Analytics API client
 */
export const analyticsAPI = {
  /**
   * Get analytics metrics
   */
  getMetrics: async (params?: AnalyticsParams): Promise<AnalyticsMetric[]> => {
    const response = await apiClient.get<AnalyticsResponse>('/v1/analytics/metrics', {
      params,
    });
    const data = extractApiData<AnalyticsResponse>(response);
    if (!data || !data.metrics) {
      throw new Error('Failed to load analytics: no data returned');
    }
    return data.metrics;
  },
};
