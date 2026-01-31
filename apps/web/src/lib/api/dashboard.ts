/**
 * Dashboard API Client
 * Client API pour récupérer les statistiques du dashboard des courtiers immobiliers
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface BrokerDashboardStats {
  total_transactions: number;
  active_transactions: number;
  conditional_transactions: number;
  closed_transactions: number;
  cancelled_transactions: number;
  total_contacts: number;
  total_companies: number;
  total_commission: string; // Decimal as string
  pending_commission: string; // Decimal as string
  closed_commission: string; // Decimal as string
  upcoming_events: number;
  total_forms: number;
  pending_submissions: number;
}

/**
 * Récupère les statistiques du dashboard pour le courtier connecté
 */
export async function getBrokerDashboardStats(): Promise<BrokerDashboardStats> {
  const response = await apiClient.get<BrokerDashboardStats>('/v1/dashboard/stats');
  const data = extractApiData(response);
  if (!data) {
    throw new Error('Failed to fetch dashboard stats: no data returned');
  }
  return data;
}
