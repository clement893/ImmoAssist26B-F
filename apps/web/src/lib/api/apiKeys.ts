/**
 * API Keys API client
 * Manages API key creation, listing, rotation, and revocation
 */

import { apiClient } from './client';
import { extractApiData } from './utils';

export interface APIKeyCreate {
  name: string;
  description?: string;
  rotation_policy?: 'manual' | '30d' | '60d' | '90d' | '180d' | '365d';
  expires_in_days?: number;
}

export interface APIKeyResponse {
  id: number;
  name: string;
  key: string; // Only shown once on creation
  key_prefix: string;
  created_at: string;
  expires_at?: string | null;
  last_used_at?: string | null;
  rotation_policy: string;
  next_rotation_at?: string | null;
}

export interface APIKeyListResponse {
  id: number;
  name: string;
  key_prefix: string;
  created_at: string;
  expires_at?: string | null;
  last_used_at?: string | null;
  rotation_policy: string;
  next_rotation_at?: string | null;
  rotation_count: number;
  usage_count: number;
  is_active: boolean;
}

export interface APIKeyRotateResponse {
  old_key_id: number;
  new_key: APIKeyResponse;
  message: string;
}

export interface AdminAPIKeyListResponse extends APIKeyListResponse {
  user_id: number;
  user_email: string;
  user_name?: string | null;
}

/**
 * API Keys API client
 */
const apiKeysAPI = {
  /**
   * Generate a new API key
   */
  create: async (data: APIKeyCreate): Promise<APIKeyResponse> => {
    const response = await apiClient.post<APIKeyResponse>('/v1/api-keys/generate', data);
    const result = extractApiData<APIKeyResponse>(response);
    if (!result) {
      throw new Error('Failed to create API key: no data returned');
    }
    return result;
  },

  /**
   * List all API keys for the current user
   */
  list: async (includeInactive: boolean = false): Promise<APIKeyListResponse[]> => {
    const response = await apiClient.get<APIKeyListResponse[]>('/v1/api-keys/list', {
      params: { include_inactive: includeInactive },
    });
    const data = extractApiData<APIKeyListResponse[] | { items: APIKeyListResponse[] }>(response);
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as { items: APIKeyListResponse[] }).items;
    }
    return [];
  },

  /**
   * Rotate an API key (creates new key, deactivates old one)
   */
  rotate: async (keyId: number): Promise<APIKeyRotateResponse> => {
    const response = await apiClient.post<APIKeyRotateResponse>(`/v1/api-keys/${keyId}/rotate`);
    const result = extractApiData<APIKeyRotateResponse>(response);
    if (!result) {
      throw new Error('Failed to rotate API key: no data returned');
    }
    return result;
  },

  /**
   * Revoke an API key
   */
  revoke: async (keyId: number, reason?: string): Promise<void> => {
    await apiClient.delete(`/v1/api-keys/${keyId}`, {
      params: reason ? { reason } : undefined,
    });
  },

  /**
   * List all API keys (admin only)
   */
  adminList: async (
    includeInactive: boolean = false,
    userId?: number
  ): Promise<AdminAPIKeyListResponse[]> => {
    const response = await apiClient.get<AdminAPIKeyListResponse[]>('/v1/api-keys/admin/list', {
      params: {
        include_inactive: includeInactive,
        ...(userId && { user_id: userId }),
      },
    });
    const data = extractApiData<AdminAPIKeyListResponse[] | { items: AdminAPIKeyListResponse[] }>(
      response
    );
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'items' in data) {
      return (data as { items: AdminAPIKeyListResponse[] }).items;
    }
    return [];
  },
};

export default apiKeysAPI;
export { apiKeysAPI };
