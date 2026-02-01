/**
 * Transaction Steps API Adapters
 * API pour les étapes guidées (parcours acheteur/vendeur)
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface StepAction {
  code: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  due_date?: string | null;
  documents: string[];
  lea_guidance: string;
}

export interface StepReminder {
  id: string;
  type: 'deadline' | 'action' | 'document';
  title: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Step {
  code: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'overdue';
  completed_date?: string | null;
  due_date?: string | null;
  actions: StepAction[];
  reminders: StepReminder[];
}

export interface TransactionStepsTransaction {
  id: number;
  name: string;
  address: string;
  price?: number | null;
  buyer: string;
  seller: string;
  status: string;
  progress: number;
}

export interface TransactionStepsResponse {
  transaction: TransactionStepsTransaction;
  buyer_steps: Step[];
  vendor_steps: Step[];
}

export const transactionStepsAPI = {
  getSteps: async (transactionId: number): Promise<TransactionStepsResponse> => {
    const response = await apiClient.get<TransactionStepsResponse>(
      `/v1/transactions/${transactionId}/steps`
    );
    // Extract data from ApiResponse wrapper
    const data = extractApiData<TransactionStepsResponse>(response);
    if (!data || typeof data !== 'object' || !('transaction' in data)) {
      throw new Error('Empty response from transaction steps API');
    }
    return data;
  },

  completeAction: async (
    transactionId: number,
    actionCode: string,
    completed: boolean = true
  ): Promise<{ success: boolean; completed_actions: string[] }> => {
    const response = await apiClient.post<{
      success: boolean;
      action_code: string;
      completed: boolean;
      completed_actions: string[];
    }>(`/v1/transactions/${transactionId}/step-actions/${actionCode}/complete`, {
      completed,
    });
    // Extract data from ApiResponse wrapper
    const data = extractApiData<{ success: boolean; completed_actions: string[] }>(response);
    if (!data) {
      throw new Error('Empty response from complete action API');
    }
    return {
      success: data.success,
      completed_actions: data.completed_actions ?? [],
    };
  },
};
