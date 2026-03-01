/**
 * API Client Configuration
 *
 * Axios client with automatic token injection, refresh token handling,
 * and comprehensive error management.
 *
 * Features:
 * - Automatic JWT token injection in requests
 * - Automatic token refresh on 401 errors
 * - Request queuing to prevent concurrent refresh attempts
 * - Centralized error handling and conversion
 *
 * @module lib/api
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { handleApiError, isClientError, isNetworkError } from './errors/api';
import { TokenStorage } from './auth/tokenStorage';
import { logger } from '@/lib/logger';
// Import mediaAPI - media.ts is in the api subdirectory
import { mediaAPI } from '@/lib/api/media';

/**
 * API base URL with trailing slash removed to avoid double slashes
 *
 * Priority:
 * 1. NEXT_PUBLIC_API_URL (explicit configuration)
 * 2. NEXT_PUBLIC_DEFAULT_API_URL (fallback for production)
 * 3. http://localhost:8000 (development fallback)
 *
 * Note: In Next.js, NEXT_PUBLIC_* vars are embedded at build time.
 * For production, NEXT_PUBLIC_API_URL MUST be set via environment variables.
 *
 * Automatically adds https:// if protocol is missing (for production).
 */
export const getApiUrl = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Priority order: explicit API URL > default API URL > smart fallback > localhost (dev only)
  let url = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_DEFAULT_API_URL;

  // Default to localhost for development if nothing is set
  if (!url) {
    if (isProduction) {
      // In production, fail fast if API URL is not configured
      logger.error(
        'NEXT_PUBLIC_API_URL is required in production but not set. Please set NEXT_PUBLIC_API_URL environment variable and rebuild.'
      );
      throw new Error(
        'NEXT_PUBLIC_API_URL is not configured. Please set NEXT_PUBLIC_API_URL environment variable.'
      );
    }
    url = 'http://localhost:8000';
  }

  url = url.trim();

  // Log to help debug (only in browser, not SSR)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    logger.debug('API Client Configuration', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '(not set at build time)',
      NEXT_PUBLIC_DEFAULT_API_URL: process.env.NEXT_PUBLIC_DEFAULT_API_URL || '(not set)',
      finalApiUrl: url,
    });
  }

  // If URL doesn't start with http:// or https://, add https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url.replace(/\/$/, ''); // Remove trailing slash
};

const API_URL = getApiUrl().replace(/\/$/, '');

/**
 * Axios client instance configured for API requests
 * Base URL includes /api prefix
 */
const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Include cookies in requests
});

/**
 * Request interceptor: Automatically adds JWT token to Authorization header
 * Only runs in browser environment (not SSR)
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // FormData: do not set Content-Type so browser sets multipart/form-data with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    if (typeof window !== 'undefined' && config.headers) {
      const token = TokenStorage.getToken();

      // Check if this is an authenticated endpoint
      const isAuthenticatedEndpoint =
        config.url?.includes('/users/me') ||
        config.url?.includes('/auth/me') ||
        config.url?.includes('/admin/') ||
        config.url?.includes('/v1/users/me') ||
        config.url?.includes('/v1/auth/me') ||
        config.url?.includes('/v1/lea/');

      if (isAuthenticatedEndpoint && !token) {
        // Reject the request immediately if it's an authenticated endpoint without token
        logger.warn('Blocking authenticated request without token', {
          url: config.url,
          sessionStorageAvailable: typeof sessionStorage !== 'undefined',
        });
        const error = new Error('Authentication required: No token available') as Error & {
          config: InternalAxiosRequestConfig;
          isAxiosError: boolean;
          response: {
            status: number;
            statusText: string;
            data: { detail: string };
            headers: Record<string, string>;
            config: InternalAxiosRequestConfig;
          };
        };
        error.config = config;
        error.isAxiosError = true;
        error.response = {
          status: 401,
          statusText: 'Unauthorized',
          data: { detail: 'Authentication required: No token available' },
          headers: {},
          config: config,
        };
        return Promise.reject(error);
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // Debug log to verify token is being sent
        if (isAuthenticatedEndpoint) {
          logger.debug('Sending authenticated request', {
            url: config.url,
            hasToken: !!token,
            tokenPrefix: token.substring(0, 20) + '...',
          });
        }
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Queue to prevent multiple simultaneous refresh token requests
 * When a refresh is in progress, subsequent 401 errors wait for the same promise
 */
let refreshTokenPromise: Promise<string> | null = null;

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (typeof window === 'undefined') {
      return Promise.reject(error);
    }

    // Convert to AppError for better error handling
    const appError = handleApiError(error);

    // Handle 401 Unauthorized - try to refresh token or logout
    if (error.response?.status === 401) {
      const refreshToken = TokenStorage.getRefreshToken();

      // Try to refresh token if available
      if (refreshToken) {
        // If a refresh is already in progress, wait for it
        if (!refreshTokenPromise) {
          // Use the current access token if available, otherwise use refresh_token
          const currentToken = TokenStorage.getToken();
          refreshTokenPromise = apiClient
            .post('/v1/auth/refresh', {
              token: currentToken || undefined,
              refresh_token: refreshToken,
            })
            .then(async (response) => {
              // Response format: { access_token: string, token_type: string }
              const { access_token } = response.data;
              await TokenStorage.setToken(access_token, refreshToken); // Keep same refresh token
              return access_token;
            })
            .catch(async (refreshError) => {
              // Refresh failed, clear tokens and redirect
              await TokenStorage.removeTokens();

              // Only redirect if we're on a protected page (not public pages)
              const isPublicPage =
                typeof window !== 'undefined' &&
                (window.location.pathname === '/' ||
                  window.location.pathname.match(/^\/(en|fr|ar|he)?\/?$/) ||
                  window.location.pathname.includes('/auth/') ||
                  window.location.pathname.includes('/components') ||
                  window.location.pathname.includes('/pricing'));

              // Prevent redirect loop - check if already on login page or public page
              if (
                typeof window !== 'undefined' &&
                !isPublicPage &&
                !window.location.pathname.includes('/auth/login')
              ) {
                window.location.href = '/auth/login?error=session_expired';
              }
              throw refreshError;
            })
            .finally(() => {
              refreshTokenPromise = null; // Reset after completion
            });
        }

        try {
          const access_token = await refreshTokenPromise;

          // Retry original request
          if (error.config) {
            error.config.headers = error.config.headers || {};
            error.config.headers.Authorization = `Bearer ${access_token}`;
            return apiClient.request(error.config);
          }
        } catch (refreshError) {
          // Error already handled in the promise
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, clear tokens and redirect
        await TokenStorage.removeTokens();

        // Only redirect if we're on a protected page (not public pages)
        const isPublicPage =
          typeof window !== 'undefined' &&
          (window.location.pathname === '/' ||
            window.location.pathname.match(/^\/(en|fr|ar|he)?\/?$/) ||
            window.location.pathname.includes('/auth/') ||
            window.location.pathname.includes('/components') ||
            window.location.pathname.includes('/pricing'));

        // Prevent redirect loop - check if already on login page or public page
        if (
          typeof window !== 'undefined' &&
          !isPublicPage &&
          !window.location.pathname.includes('/auth/login')
        ) {
          window.location.href = '/auth/login?error=unauthorized';
        }
      }
    }

    // Handle network errors
    if (isNetworkError(appError)) {
      logger.error('Network error', appError, { endpoint: error.config?.url });
      // Could show a toast notification here
    }

    // Handle client errors (4xx) - don't redirect, let component handle
    if (isClientError(appError)) {
      // Component will handle the error display
      return Promise.reject(appError);
    }

    // Handle server errors (5xx) - show generic error
    logger.error('Server error', appError, {
      endpoint: error.config?.url,
      status: error.response?.status,
    });
    return Promise.reject(appError);
  }
);

export const authAPI = {
  login: (email: string, password: string) => {
    return apiClient.post('/v1/auth/login', { email, password });
  },
  register: (email: string, password: string, name: string) => {
    // Split name into first_name and last_name
    const nameParts = name.trim().split(/\s+/);
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';
    return apiClient.post('/v1/auth/register', {
      email,
      password,
      first_name,
      last_name: last_name || undefined, // Send undefined if empty to match backend Optional[str]
    });
  },
  refresh: (refreshToken: string) => {
    return apiClient.post('/v1/auth/refresh', { refresh_token: refreshToken });
  },
  logout: () => {
    return apiClient.post('/v1/auth/logout');
  },
  getGoogleAuthUrl: (redirectUrl?: string) => {
    const params = redirectUrl ? { redirect: redirectUrl } : {};
    return apiClient.get('/v1/auth/google', { params });
  },
};

export const leaAPI = {
  chat: (message: string, sessionId?: string, provider: string = 'auto') => {
    return apiClient.post('/v1/lea/chat', {
      message,
      session_id: sessionId,
      provider,
    });
  },
  /**
   * Chat with Léa in streaming mode (SSE). Calls onDelta for each chunk, onDone when finished.
   * onDone receives optional actions (backend-performed actions for logs).
   * Returns true if streaming was used, false if backend does not support streaming (fallback to chat).
   */
  chatStream: async (
    params: { message: string; sessionId?: string },
    callbacks: {
      onDelta: (delta: string) => void;
      onDone: (sessionId: string, actions?: string[]) => void;
      onError: (message: string) => void;
    }
  ): Promise<boolean> => {
    const token = TokenStorage.getToken();
    const url = `${getApiUrl().replace(/\/$/, '')}/api/v1/lea/chat/stream`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify({
        message: params.message,
        session_id: params.sessionId ?? null,
      }),
    });
    if (res.status === 501 || res.status === 404) return false;
    if (!res.ok) {
      const text = await res.text();
      try {
        const j = JSON.parse(text);
        callbacks.onError(j.detail ?? text);
      } catch {
        callbacks.onError(text || res.statusText);
      }
      return true; // we "used" streaming (got an error response)
    }
    const reader = res.body?.getReader();
    if (!reader) {
      callbacks.onError('Stream non disponible');
      return true;
    }
    const decoder = new TextDecoder();
    let buffer = '';
    let sessionId = params.sessionId ?? '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                callbacks.onError(data.error);
                return true;
              }
              if (typeof data.delta === 'string') callbacks.onDelta(data.delta);
              if (data.done && data.session_id) {
                sessionId = data.session_id;
                callbacks.onDone(data.session_id, data.actions);
              }
            } catch {
              /* ignore parse errors */
            }
          }
        }
      }
      if (sessionId) callbacks.onDone(sessionId);
    } catch (e) {
      callbacks.onError(e instanceof Error ? e.message : 'Erreur de lecture du flux');
    }
    return true;
  },
  chatVoice: (audioBlob: Blob, sessionId?: string, conversationId?: number) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    if (sessionId) formData.append('session_id', sessionId);
    if (conversationId != null) formData.append('conversation_id', String(conversationId));
    return apiClient.post('/v1/lea/chat/voice', formData);
  },
  getContext: (sessionId?: string) => {
    return apiClient.get('/v1/lea/context', {
      params: { session_id: sessionId },
    });
  },
  /** List user's Léa conversations (most recent first). */
  listConversations: (limit = 50) => {
    return apiClient.get<Array<{ session_id: string; title: string; updated_at: string | null }>>(
      '/v1/lea/conversations',
      { params: { limit } }
    );
  },
  resetContext: (sessionId?: string) => {
    return apiClient.delete('/v1/lea/context', {
      params: { session_id: sessionId },
    });
  },
  /** Synthèse vocale (OpenAI TTS, voix féminine douce shimmer). Retourne l'audio en base64. */
  synthesizeSpeech: (text: string, voice?: 'nova' | 'shimmer', speed?: number) => {
    return apiClient.post<{ audio_base64: string; content_type: string }>('/v1/lea/voice/synthesize', {
      text,
      voice: voice ?? 'shimmer',
      speed: speed ?? 1.2,
    });
  },
};

// transactionsAPI et realEstateContactsAPI sont exportés depuis les adaptateurs du module Transactions
export { transactionsAPI, realEstateContactsAPI } from './api/transactions-adapters';

export const usersAPI = {
  getMe: () => {
    return apiClient.get('/v1/auth/me');
  },
  updateMe: (data: {
    name?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
  }) => {
    return apiClient.put('/v1/users/me', data);
  },
  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    // Use the /api/upload/file endpoint which returns FileUploadResponse with url field
    // This endpoint is more reliable for avatar uploads
    const uploadClient = axios.create({
      baseURL: getApiUrl(),
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });

    // Add auth token
    if (typeof window !== 'undefined') {
      const token = TokenStorage.getToken();
      if (token) {
        uploadClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const response = await uploadClient.post('/api/upload/file', formData, {
        params: {
          folder: 'avatars',
        },
      });

      // FileUploadResponse has: id, filename, original_filename, size, url, content_type, uploaded_at
      // Handle both direct response and wrapped response
      const responseData = response.data?.data || response.data;

      if (responseData?.url) {
        return responseData.url;
      }

      // Fallback: try to use mediaAPI if upload endpoint doesn't return url
      if (!responseData?.url) {
        const media = await mediaAPI.upload(file, {
          folder: 'avatars',
          is_public: true,
        });

        // Try file_path first, then construct URL from file_key if needed
        if (
          media.file_path &&
          (media.file_path.startsWith('http://') || media.file_path.startsWith('https://'))
        ) {
          return media.file_path;
        }

        // If file_path is a key, we need to get the URL from the media endpoint
        // For now, return file_path and let the backend handle it
        if (media.file_path) {
          return media.file_path;
        }
      }

      throw new Error('Upload succeeded but no URL returned in response');
    } catch (error) {
      // Better error message for debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      const axiosError = error as { response?: { status?: number; data?: unknown } };

      if (axiosError?.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data as
          | { detail?: string; error?: string; message?: string }
          | undefined;
        const detail = data?.detail || data?.error || data?.message || 'Unknown error';
        throw new Error(`Avatar upload failed (${status}): ${detail}`);
      }

      throw new Error(`Avatar upload failed: ${errorMessage}`);
    }
  },
  getUser: (userId: string) => {
    return apiClient.get(`/v1/users/${userId}`);
  },
  getUsers: () => {
    return apiClient.get('/v1/users');
  },
  createUser: (data: {
    email: string;
    first_name?: string;
    last_name?: string;
    password: string;
    is_active?: boolean;
  }) => {
    return apiClient.post('/v1/users', data);
  },
  updateUser: (
    userId: string,
    data: {
      email?: string;
      first_name?: string;
      last_name?: string;
      password?: string;
      is_active?: boolean;
    }
  ) => {
    return apiClient.put(`/v1/users/${userId}`, data);
  },
  deleteUser: (userId: string) => {
    return apiClient.delete(`/v1/users/${userId}`);
  },
};

export const resourcesAPI = {
  getResources: () => {
    return apiClient.get('/resources');
  },
  getResource: (resourceId: string) => {
    return apiClient.get(`/resources/${resourceId}`);
  },
  createResource: (data: Record<string, unknown>) => {
    return apiClient.post('/resources', data);
  },
  updateResource: (resourceId: string, data: Record<string, unknown>) => {
    return apiClient.put(`/resources/${resourceId}`, data);
  },
  deleteResource: (resourceId: string) => {
    return apiClient.delete(`/resources/${resourceId}`);
  },
};

export const projectsAPI = {
  list: () => {
    return apiClient.get('/v1/projects');
  },
  get: (projectId: string) => {
    return apiClient.get(`/v1/projects/${projectId}`);
  },
  create: (data: {
    name: string;
    description?: string;
    status?: 'active' | 'archived' | 'completed';
  }) => {
    return apiClient.post('/v1/projects', data);
  },
  update: (
    projectId: number,
    data: {
      name?: string;
      description?: string;
      status?: 'active' | 'archived' | 'completed';
    }
  ) => {
    return apiClient.put(`/v1/projects/${projectId}`, data);
  },
  delete: (projectId: number) => {
    return apiClient.delete(`/v1/projects/${projectId}`);
  },
};

export const aiAPI = {
  health: () => {
    return apiClient.get('/v1/ai/health');
  },
  simpleChat: (message: string, systemPrompt?: string, model?: string) => {
    return apiClient.post('/v1/ai/chat/simple', { message, system_prompt: systemPrompt, model });
  },
  chat: (
    messages: Array<{ role: string; content: string }>,
    model?: string,
    temperature?: number,
    maxTokens?: number
  ) => {
    return apiClient.post('/v1/ai/chat', { messages, model, temperature, max_tokens: maxTokens });
  },
};

export const emailAPI = {
  health: () => {
    return apiClient.get('/email/health');
  },
  sendTest: (toEmail: string) => {
    return apiClient.post('/email/test', { to_email: toEmail });
  },
  sendWelcome: (toEmail: string) => {
    return apiClient.post('/email/welcome', { to_email: toEmail });
  },
  sendCustom: (data: {
    to_email: string;
    subject: string;
    html_content: string;
    text_content?: string;
    from_email?: string;
    from_name?: string;
  }) => {
    return apiClient.post('/email/send', data);
  },
};

export const subscriptionsAPI = {
  getPlans: (activeOnly: boolean = true) => {
    return apiClient.get('/v1/subscriptions/plans', {
      params: { active_only: activeOnly },
    });
  },
  getPlan: (planId: number) => {
    return apiClient.get(`/v1/subscriptions/plans/${planId}`);
  },
  getMySubscription: () => {
    return apiClient.get('/v1/subscriptions/me');
  },
  createCheckoutSession: (data: {
    plan_id: number;
    success_url: string;
    cancel_url: string;
    trial_days?: number;
  }) => {
    return apiClient.post('/v1/subscriptions/checkout', data);
  },
  createPortalSession: (returnUrl: string) => {
    return apiClient.post('/v1/subscriptions/portal', null, {
      params: { return_url: returnUrl },
    });
  },
  cancelSubscription: () => {
    return apiClient.post('/v1/subscriptions/cancel');
  },
  upgradePlan: (planId: number) => {
    return apiClient.post(`/v1/subscriptions/upgrade/${planId}`);
  },
  getPayments: () => {
    return apiClient.get('/v1/subscriptions/payments');
  },
};

export const teamsAPI = {
  list: (skip = 0, limit = 100) => {
    return apiClient.get('/v1/teams', {
      params: { skip, limit },
    });
  },
  get: (teamId: string) => {
    return apiClient.get(`/v1/teams/${teamId}`);
  },
  create: (data: { name: string; description?: string; organization_id?: string }) => {
    return apiClient.post('/v1/teams', data);
  },
  update: (teamId: string, data: { name?: string; description?: string }) => {
    return apiClient.put(`/v1/teams/${teamId}`, data);
  },
  delete: (teamId: string) => {
    return apiClient.delete(`/v1/teams/${teamId}`);
  },
  getMembers: (teamId: string) => {
    return apiClient.get(`/v1/teams/${teamId}/members`);
  },
  addMember: (teamId: string, data: { user_id: string; role: string }) => {
    return apiClient.post(`/v1/teams/${teamId}/members`, data);
  },
  removeMember: (teamId: string, memberId: string) => {
    return apiClient.delete(`/v1/teams/${teamId}/members/${memberId}`);
  },
  updateMemberRole: (teamId: string, memberId: string, role: string) => {
    return apiClient.put(`/v1/teams/${teamId}/members/${memberId}`, { role });
  },
};

export const invitationsAPI = {
  list: (params?: { status?: string; organization_id?: string }) => {
    return apiClient.get('/v1/invitations', { params });
  },
  get: (invitationId: string) => {
    return apiClient.get(`/v1/invitations/${invitationId}`);
  },
  create: (data: { email: string; role: string; organization_id?: string }) => {
    return apiClient.post('/v1/invitations', data);
  },
  cancel: (invitationId: string) => {
    return apiClient.delete(`/v1/invitations/${invitationId}`);
  },
  resend: (invitationId: string) => {
    return apiClient.post(`/v1/invitations/${invitationId}/resend`);
  },
  accept: (invitationId: string, token: string) => {
    return apiClient.post(`/v1/invitations/${invitationId}/accept`, { token });
  },
};

export const integrationsAPI = {
  list: () => {
    return apiClient.get('/v1/integrations/');
  },
  get: (integrationId: number) => {
    return apiClient.get(`/v1/integrations/${integrationId}`);
  },
  create: (data: {
    type: string;
    name: string;
    description?: string;
    config?: Record<string, unknown>;
    credentials?: Record<string, unknown>;
  }) => {
    return apiClient.post('/v1/integrations/', data);
  },
  update: (
    integrationId: number,
    data: {
      name?: string;
      description?: string;
      enabled?: boolean;
      config?: Record<string, unknown>;
      credentials?: Record<string, unknown>;
    }
  ) => {
    return apiClient.put(`/v1/integrations/${integrationId}`, data);
  },
  toggle: (integrationId: number) => {
    return apiClient.patch(`/v1/integrations/${integrationId}/toggle`);
  },
  delete: (integrationId: number) => {
    return apiClient.delete(`/v1/integrations/${integrationId}`);
  },
};

export const apiSettingsAPI = {
  get: () => {
    return apiClient.get('/v1/api-settings/');
  },
  update: (data: {
    base_url?: string;
    rate_limit?: number;
    enable_webhooks?: boolean;
    webhook_url?: string;
    enable_logging?: boolean;
  }) => {
    return apiClient.put('/v1/api-settings/', data);
  },
};

export const pagesAPI = {
  list: (params?: { skip?: number; limit?: number; status?: string }) => {
    return apiClient.get('/v1/pages', { params });
  },
  get: (slug: string) => {
    return apiClient.get(`/v1/pages/${slug}`);
  },
  create: (data: {
    title: string;
    slug: string;
    content?: string;
    content_html?: string;
    sections?: Array<{ id: string; type: string; [key: string]: unknown }>;
    status?: 'draft' | 'published' | 'archived';
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
  }) => {
    return apiClient.post('/v1/pages', data);
  },
  update: (
    slug: string,
    data: {
      title?: string;
      slug?: string;
      content?: string;
      content_html?: string;
      sections?: Array<{ id: string; type: string; [key: string]: unknown }>;
      status?: 'draft' | 'published' | 'archived';
      meta_title?: string;
      meta_description?: string;
      meta_keywords?: string;
    }
  ) => {
    return apiClient.put(`/v1/pages/${slug}`, data);
  },
  delete: (slug: string) => {
    return apiClient.delete(`/v1/pages/${slug}`);
  },
};

export const formsAPI = {
  list: () => {
    return apiClient.get('/v1/forms');
  },
  get: (formId: number) => {
    return apiClient.get(`/v1/forms/${formId}`);
  },
  create: (data: {
    name: string;
    description?: string;
    fields: Array<{
      id: string;
      type: string;
      label: string;
      name: string;
      placeholder?: string;
      required?: boolean;
      options?: Array<{ label: string; value: string }>;
      validation?: Record<string, unknown>;
    }>;
    submit_button_text?: string;
    success_message?: string;
  }) => {
    return apiClient.post('/v1/forms', data);
  },
  update: (
    formId: number,
    data: {
      name?: string;
      description?: string;
      fields?: Array<{
        id: string;
        type: string;
        label: string;
        name: string;
        placeholder?: string;
        required?: boolean;
        options?: Array<{ label: string; value: string }>;
        validation?: Record<string, unknown>;
      }>;
      submit_button_text?: string;
      success_message?: string;
    }
  ) => {
    return apiClient.put(`/v1/forms/${formId}`, data);
  },
  delete: (formId: number) => {
    return apiClient.delete(`/v1/forms/${formId}`);
  },
  submit: (formId: number, data: Record<string, unknown>) => {
    return apiClient.post(`/v1/forms/${formId}/submissions`, { form_id: formId, data });
  },
  getSubmissions: (formId: number, params?: { skip?: number; limit?: number }) => {
    return apiClient.get(`/v1/forms/${formId}/submissions`, { params });
  },
  getSubmission: (submissionId: number) => {
    return apiClient.get(`/v1/forms/submissions/${submissionId}`);
  },
  updateSubmission: (
    submissionId: number,
    data: { data?: Record<string, unknown>; needs_review?: boolean }
  ) => {
    return apiClient.patch(`/v1/forms/submissions/${submissionId}`, data);
  },
  deleteSubmission: (submissionId: number) => {
    return apiClient.delete(`/v1/forms/submissions/${submissionId}`);
  },
  /** Valider les données d'un formulaire contre les règles de conformité OACIQ (sans créer de soumission). */
  validateSubmission: (formId: number, data: Record<string, unknown>) => {
    return apiClient.post<Array<{ code: string; field: string; severity: string; message: string; description?: string }>>(
      `/v1/forms/${formId}/submissions/validate`,
      { data }
    );
  },
};

export const formOcrAPI = {
  uploadAndProcess: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ task_id: string; message: string }>(
      '/v1/forms/submissions/upload-and-process',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
  getTaskStatus: (taskId: string) => {
    return apiClient.get<{
      status: string;
      submission_id?: number;
      form_code?: string;
      error?: string;
      result?: Record<string, unknown>;
    }>(`/v1/tasks/${taskId}/status`);
  },
};

export const menusAPI = {
  list: (params?: { location?: string }) => {
    return apiClient.get('/v1/menus', { params });
  },
  get: (menuId: number) => {
    return apiClient.get(`/v1/menus/${menuId}`);
  },
  create: (data: {
    name: string;
    location: 'header' | 'footer' | 'sidebar';
    items: Array<{
      id: string;
      label: string;
      url: string;
      target?: '_self' | '_blank';
      children?: Array<unknown>;
    }>;
  }) => {
    return apiClient.post('/v1/menus', data);
  },
  update: (
    menuId: number,
    data: {
      name?: string;
      location?: 'header' | 'footer' | 'sidebar';
      items?: Array<{
        id: string;
        label: string;
        url: string;
        target?: '_self' | '_blank';
        children?: Array<unknown>;
      }>;
    }
  ) => {
    return apiClient.put(`/v1/menus/${menuId}`, data);
  },
  delete: (menuId: number) => {
    return apiClient.delete(`/v1/menus/${menuId}`);
  },
};

export const supportTicketsAPI = {
  list: (params?: { status?: string; category?: string }) => {
    return apiClient.get('/v1/support/tickets', { params });
  },
  get: (ticketId: number) => {
    return apiClient.get(`/v1/support/tickets/${ticketId}`);
  },
  create: (data: {
    email: string;
    subject: string;
    category: 'technical' | 'billing' | 'feature' | 'general' | 'bug';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    message: string;
  }) => {
    return apiClient.post('/v1/support/tickets', data);
  },
  update: (
    ticketId: number,
    data: {
      subject?: string;
      category?: 'technical' | 'billing' | 'feature' | 'general' | 'bug';
      status?: 'open' | 'in_progress' | 'resolved' | 'closed';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    }
  ) => {
    return apiClient.put(`/v1/support/tickets/${ticketId}`, data);
  },
  getMessages: (ticketId: number) => {
    return apiClient.get(`/v1/support/tickets/${ticketId}/messages`);
  },
  addMessage: (ticketId: number, message: string) => {
    return apiClient.post(`/v1/support/tickets/${ticketId}/messages`, { message });
  },
};

export const seoAPI = {
  getSettings: () => {
    return apiClient.get('/v1/seo/settings');
  },
  updateSettings: (data: {
    title?: string;
    description?: string;
    keywords?: string;
    canonical_url?: string;
    robots?: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
    og_type?: string;
    twitter_card?: string;
    twitter_title?: string;
    twitter_description?: string;
    twitter_image?: string;
    schema?: string;
  }) => {
    return apiClient.put('/v1/seo/settings', data);
  },
};

// Surveys API - Uses Forms API but with survey-specific endpoints
export const surveysAPI = {
  list: (params?: { skip?: number; limit?: number; status?: string }) => {
    return apiClient.get('/v1/forms', { params });
  },
  get: (surveyId: number) => {
    return apiClient.get(`/v1/forms/${surveyId}`);
  },
  create: (data: {
    name: string;
    description?: string;
    fields: Array<Record<string, unknown>>;
    submit_button_text?: string;
    success_message?: string;
    settings?: Record<string, unknown>;
  }) => {
    return apiClient.post('/v1/forms', data);
  },
  update: (
    surveyId: number,
    data: {
      name?: string;
      description?: string;
      fields?: Array<Record<string, unknown>>;
      submit_button_text?: string;
      success_message?: string;
      settings?: Record<string, unknown>;
    }
  ) => {
    return apiClient.put(`/v1/forms/${surveyId}`, data);
  },
  delete: (surveyId: number) => {
    return apiClient.delete(`/v1/forms/${surveyId}`);
  },
  submit: (surveyId: number, data: Record<string, unknown>) => {
    return apiClient.post(`/v1/forms/${surveyId}/submissions`, { data });
  },
  getSubmissions: (surveyId: number, params?: { skip?: number; limit?: number }) => {
    return apiClient.get(`/v1/forms/${surveyId}/submissions`, { params });
  },
  getStatistics: (surveyId: number) => {
    return apiClient.get(`/v1/forms/${surveyId}/statistics`);
  },
  exportResults: (surveyId: number, format: 'csv' | 'excel' | 'json') => {
    return apiClient.get(`/v1/forms/${surveyId}/export`, { params: { format } });
  },
};

// Export default for backward compatibility
export default apiClient;

// Named export for easier imports
export const api = apiClient;
export { apiClient };

// Re-export theme-font functions for convenience
export { checkFonts } from './api/theme-font';

// Re-export API keys API
export { apiKeysAPI } from './api/apiKeys';
export type {
  APIKeyCreate,
  APIKeyResponse,
  APIKeyListResponse,
  APIKeyRotateResponse,
  AdminAPIKeyListResponse,
} from './api/apiKeys';

// Re-export API utilities
export { extractApiData } from './api/utils';

// Re-export reseau adapters
export { reseauContactsAPI } from './api/reseau-adapters';
export type { Contact, ContactCreate, ContactUpdate } from './api/reseau-adapters';
