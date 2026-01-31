/**
 * Insights API
 * API client for dashboard insights endpoints
 */

import { apiClient } from './client';
import type { AnalyticsMetric } from '@/components/analytics';
import type { ChartDataPoint } from '@/components/ui';
import { extractApiData } from './utils';

export interface InsightsResponse {
  metrics: AnalyticsMetric[];
  trends: ChartDataPoint[];
  userGrowth: ChartDataPoint[];
}

/**
 * Insights API client
 */
export const insightsAPI = {
  /**
   * Get dashboard insights
   */
  get: async (): Promise<InsightsResponse> => {
    const response = await apiClient.get<InsightsResponse>('/v1/insights');
    const data = extractApiData(response);
    if (!data) {
      throw new Error('Failed to load insights: no data returned');
    }
    return data;
  },
};
