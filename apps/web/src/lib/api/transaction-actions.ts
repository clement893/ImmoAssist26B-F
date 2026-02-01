/**
 * Transaction Actions API Client
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface TransactionAction {
  id: number;
  code: string;
  name: string;
  description?: string;
  from_status: string;
  to_status: string;
  required_documents: string[];
  required_fields: string[];
  required_roles: string[];
  creates_deadline: boolean;
  deadline_days?: number;
  deadline_type?: string;
  generates_document: boolean;
  document_template?: string;
  sends_notification: boolean;
  notification_recipients: string[];
  order_index: number;
  is_active: boolean;
}

export interface ActionCompletion {
  id: number;
  transaction_id: number;
  action_code: string;
  action_name?: string;
  completed_by: number;
  completed_by_name?: string;
  completed_at: string;
  data: Record<string, any>;
  notes?: string;
  previous_status: string;
  new_status: string;
}

export interface ExecuteActionRequest {
  action_code: string;
  data?: Record<string, any>;
  notes?: string;
}

export interface ExecuteActionResponse {
  success: boolean;
  completion_id: number;
  new_status: string;
  previous_status: string;
  deadline?: {
    type: string;
    days: number;
    due_date: string;
  };
}

/**
 * Récupère les actions disponibles pour une transaction
 */
export async function getAvailableActions(transactionId: number): Promise<TransactionAction[]> {
  const response = await apiClient.get<TransactionAction[]>(
    `/v1/transactions/${transactionId}/actions/available`
  );
  const data = extractApiData(response);
  return Array.isArray(data) ? data : [];
}

/**
 * Récupère l'historique des actions d'une transaction
 */
export async function getActionHistory(transactionId: number): Promise<ActionCompletion[]> {
  const response = await apiClient.get<ActionCompletion[]>(
    `/v1/transactions/${transactionId}/actions/history`
  );
  const data = extractApiData(response);
  return Array.isArray(data) ? data : [];
}

/**
 * Exécute une action sur une transaction
 */
export async function executeAction(
  transactionId: number,
  request: ExecuteActionRequest
): Promise<ExecuteActionResponse> {
  const response = await apiClient.post<ExecuteActionResponse>(
    `/v1/transactions/${transactionId}/actions/execute`,
    request
  );
  const data = extractApiData(response);
  if (data && typeof data === 'object' && 'success' in data) {
    return data as ExecuteActionResponse;
  }
  return { success: false, completion_id: 0, new_status: '', previous_status: '' };
}
