/**
 * Admin API client for administrative operations.
 */
import { apiClient } from './client';
import { getApiUrl } from '../api';

const API_URL = getApiUrl().replace(/\/$/, '');

// Helper to get auth token
import { TokenStorage } from '@/lib/auth/tokenStorage';

function getAuthToken(): string {
  return TokenStorage.getToken() || '';
}

export interface MakeSuperAdminRequest {
  email: string;
}

export interface MakeSuperAdminResponse {
  success: boolean;
  message: string;
  user_id?: number | null;
  email?: string | null;
}

/**
 * Bootstrap the first superadmin user.
 * This endpoint uses a secret key and only works if no superadmin exists yet.
 */
export async function bootstrapSuperAdmin(
  email: string,
  bootstrapKey: string
): Promise<MakeSuperAdminResponse> {
  try {
    const response = await fetch(`${API_URL}/api/v1/admin/bootstrap-superadmin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Bootstrap-Key': bootstrapKey,
      },
      body: JSON.stringify({ email }),
      signal: (() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000); // 10 second timeout
        return controller.signal;
      })(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Failed to bootstrap superadmin: ${response.statusText}`);
    }

    return response.json();
  } catch (error: unknown) {
    // Handle network errors
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('Failed to fetch'))
    ) {
      throw new Error(
        `Le backend n'est pas accessible. Assurez-vous que le serveur backend est démarré sur ${API_URL}`
      );
    }
    throw error;
  }
}

/**
 * Make a user superadmin.
 * Requires authentication and superadmin role.
 */
export async function makeSuperAdmin(
  email: string,
  token?: string
): Promise<MakeSuperAdminResponse> {
  try {
    const authToken = token || getAuthToken();
    const response = await fetch(`${API_URL}/api/v1/admin/make-superadmin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ email }),
      signal: (() => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000); // 10 second timeout
        return controller.signal;
      })(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Failed to make superadmin: ${response.statusText}`);
    }

    return response.json();
  } catch (error: unknown) {
    // Handle network errors
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('Failed to fetch'))
    ) {
      throw new Error(
        `Le backend n'est pas accessible. Assurez-vous que le serveur backend est démarré sur ${API_URL}`
      );
    }
    throw error;
  }
}

/**
 * Check if the current authenticated user has superadmin role.
 * Uses apiClient to benefit from automatic token refresh.
 */
export async function checkMySuperAdminStatus(
  token?: string
): Promise<{ is_superadmin: boolean; email?: string; user_id?: number; is_active?: boolean }> {
  try {
    // Use apiClient which handles token refresh automatically
    // If a token is provided, temporarily set it in storage for this request
    if (token && token !== TokenStorage.getToken()) {
      const originalToken = TokenStorage.getToken();
      await TokenStorage.setToken(token); // Set token for this request
      try {
        const response = await apiClient.get<{
          email: string;
          user_id: number;
          is_superadmin: boolean;
          is_active: boolean;
        }>(`/v1/admin/check-my-superadmin-status`);

        // Backend FastAPI returns data directly: { email, user_id, is_superadmin, is_active }
        // apiClient.get returns ApiResponse<T> which wraps the data in { success, data, ... }
        // But FastAPI doesn't wrap it, so axios response.data is the dict directly
        // apiClient.get returns response.data, which should be ApiResponse<T>, but FastAPI returns dict directly
        // So we need to handle both cases: response.data (if ApiResponse) or response (if dict)
        interface SuperAdminStatusResponse {
          is_superadmin: boolean;
          email?: string;
          user_id?: number;
          is_active?: boolean;
        }

        interface ApiResponseWrapper {
          data?: SuperAdminStatusResponse;
        }

        let data: SuperAdminStatusResponse | undefined;

        // Check if response has the expected structure
        if (response && typeof response === 'object') {
          // If response has 'data' property and 'is_superadmin' is in data.data, it's ApiResponse format
          if (
            'data' in response &&
            response.data &&
            typeof response.data === 'object' &&
            'is_superadmin' in response.data
          ) {
            data = response.data as SuperAdminStatusResponse;
          }
          // If response has 'is_superadmin' directly, it's the dict format
          else if ('is_superadmin' in response) {
            data = response as SuperAdminStatusResponse;
          }
          // If response.data exists and has is_superadmin, use it
          else if (
            'data' in response &&
            (response as ApiResponseWrapper).data &&
            typeof (response as ApiResponseWrapper).data === 'object' &&
            'is_superadmin' in (response as ApiResponseWrapper).data!
          ) {
            data = (response as ApiResponseWrapper).data;
          }
          // Last resort: try response.data directly
          else if (
            response.data &&
            typeof response.data === 'object' &&
            'is_superadmin' in response.data
          ) {
            data = response.data as SuperAdminStatusResponse;
          }
        }

        if (data && typeof data === 'object' && 'is_superadmin' in data) {
          return {
            is_superadmin: data.is_superadmin === true,
            email: data.email,
            user_id: data.user_id,
            is_active: data.is_active,
          };
        }

        throw new Error(`Unexpected response format: ${JSON.stringify(response)}`);
      } finally {
        // Restore original token if it was different
        if (originalToken) {
          await TokenStorage.setToken(originalToken);
        }
      }
    }

    // Use apiClient which automatically handles token refresh on 401
    const response = await apiClient.get<{
      email: string;
      user_id: number;
      is_superadmin: boolean;
      is_active: boolean;
    }>(`/v1/admin/check-my-superadmin-status`);

    // Same logic as above
    interface SuperAdminStatusResponse {
      is_superadmin: boolean;
      email?: string;
      user_id?: number;
      is_active?: boolean;
    }

    interface ApiResponseWrapper {
      data?: SuperAdminStatusResponse;
    }

    let data: SuperAdminStatusResponse | undefined;

    if (response && typeof response === 'object') {
      if (
        'data' in response &&
        response.data &&
        typeof response.data === 'object' &&
        'is_superadmin' in response.data
      ) {
        data = response.data as SuperAdminStatusResponse;
      } else if ('is_superadmin' in response) {
        data = response as SuperAdminStatusResponse;
      } else if (
        'data' in response &&
        (response as ApiResponseWrapper).data &&
        typeof (response as ApiResponseWrapper).data === 'object' &&
        'is_superadmin' in (response as ApiResponseWrapper).data!
      ) {
        data = (response as ApiResponseWrapper).data;
      } else {
        data = response as unknown as SuperAdminStatusResponse;
      }
    }

    if (data && typeof data === 'object' && 'is_superadmin' in data) {
      return {
        is_superadmin: data.is_superadmin === true,
        email: data.email,
        user_id: data.user_id,
        is_active: data.is_active,
      };
    }

    throw new Error(`Unexpected response format: ${JSON.stringify(response)}`);
  } catch (error: unknown) {
    // Handle network errors
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('Failed to fetch'))
    ) {
      throw new Error(
        `Le backend n'est pas accessible. Assurez-vous que le serveur backend est démarré sur ${API_URL}`
      );
    }

    // Re-throw API errors (they're already formatted by apiClient)
    throw error;
  }
}

/**
 * Check if a user has superadmin role.
 * Requires authentication and superadmin role.
 * Uses apiClient to benefit from automatic token refresh.
 * @deprecated Use checkMySuperAdminStatus() to check your own status instead
 */
export async function checkSuperAdminStatus(
  email: string,
  token?: string
): Promise<{ is_superadmin: boolean }> {
  try {
    // Use apiClient which handles token refresh automatically
    // If a token is provided, temporarily set it in storage for this request
    if (token && token !== TokenStorage.getToken()) {
      const originalToken = TokenStorage.getToken();
      await TokenStorage.setToken(token); // Set token for this request
      try {
        const response = await apiClient.get<{ is_superadmin: boolean }>(
          `/v1/admin/check-superadmin/${encodeURIComponent(email)}`
        );
        // Handle both direct response and wrapped response.data
        if (response && typeof response === 'object' && 'is_superadmin' in response) {
          return { is_superadmin: (response as { is_superadmin: boolean }).is_superadmin };
        }
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          response.data &&
          typeof response.data === 'object' &&
          'is_superadmin' in response.data
        ) {
          return { is_superadmin: (response.data as { is_superadmin: boolean }).is_superadmin };
        }
        throw new Error(`Unexpected response format: ${JSON.stringify(response)}`);
      } finally {
        // Restore original token if it was different
        if (originalToken) {
          await TokenStorage.setToken(originalToken);
        }
      }
    }

    // Use apiClient which automatically handles token refresh on 401
    const response = await apiClient.get<{ is_superadmin: boolean }>(
      `/v1/admin/check-superadmin/${encodeURIComponent(email)}`
    );
    // Handle both direct response and wrapped response.data
    if (response && typeof response === 'object' && 'is_superadmin' in response) {
      return { is_superadmin: (response as { is_superadmin: boolean }).is_superadmin };
    }
    if (
      response &&
      typeof response === 'object' &&
      'data' in response &&
      response.data &&
      typeof response.data === 'object' &&
      'is_superadmin' in response.data
    ) {
      return { is_superadmin: (response.data as { is_superadmin: boolean }).is_superadmin };
    }
    throw new Error(`Unexpected response format: ${JSON.stringify(response)}`);
  } catch (error: unknown) {
    // Handle network errors
    if (
      error instanceof Error &&
      (error.name === 'AbortError' || error.message.includes('Failed to fetch'))
    ) {
      throw new Error(
        `Le backend n'est pas accessible. Assurez-vous que le serveur backend est démarré sur ${API_URL}`
      );
    }
    // Re-throw API errors (they're already formatted by apiClient)
    throw error;
  }
}

/**
 * Admin API object
 * Exports all admin-related functions as a single API object
 */
export const adminAPI = {
  bootstrapSuperAdmin,
  makeSuperAdmin,
  checkMySuperAdminStatus,
  checkSuperAdminStatus,
};
