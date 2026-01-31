/**
 * Theme API client for managing platform themes.
 * Uses apiClient for centralized authentication and error handling.
 */
import type {
  Theme,
  ThemeCreate,
  ThemeUpdate,
  ThemeListResponse,
  ThemeConfigResponse,
} from '@modele/types';
import { apiClient } from './client';
import { logger } from '@/lib/logger';
import { TokenStorage } from '@/lib/auth/tokenStorage';
import { parseThemeError, formatValidationErrors, type ParsedThemeError } from './theme-errors';

/**
 * Custom error class for theme validation errors
 */
export class ThemeValidationError extends Error {
  constructor(
    public parsedError: ParsedThemeError,
    message?: string
  ) {
    super(message || parsedError.message);
    this.name = 'ThemeValidationError';
  }
}

/**
 * Helper function to extract data from FastAPI response.
 * FastAPI returns data directly, not wrapped in ApiResponse.
 * apiClient.get returns response.data from axios, which is already the FastAPI response.
 * This function handles both cases for compatibility.
 */
function extractFastApiData<T>(response: unknown): T {
  // FastAPI returns data directly, and apiClient.get already returns response.data from axios
  // So response is already the FastAPI data, not wrapped in ApiResponse
  if (!response) {
    return response as T;
  }

  if (typeof response === 'object') {
    // Check if response has 'data' property (ApiResponse wrapper case)
    // This happens if apiClient wraps the response in ApiResponse format
    if ('data' in response && (response as { data?: unknown }).data !== undefined) {
      const data = (response as { data: unknown }).data;
      // If data exists, return it
      if (data !== null && data !== undefined) {
        return data as T;
      }
    }

    // Check if response has 'success' property (ApiResponse format)
    // If it does, it's wrapped in ApiResponse, so extract data
    if ('success' in response && 'data' in response) {
      const apiResponse = response as { success: boolean; data?: T };
      if (apiResponse.data !== undefined) {
        return apiResponse.data;
      }
    }

    // Otherwise, FastAPI returned the data directly (most common case)
    // response is already ThemeListResponse, Theme, etc.
    return response as T;
  }

  return response as T;
}

/**
 * Get the currently active theme configuration.
 * Public endpoint - no authentication required.
 * Requires backend to be available - throws error if backend is unavailable.
 * The backend will always return TemplateTheme (ID 32) if no theme is active.
 */
export async function getActiveTheme(): Promise<ThemeConfigResponse> {
  const response = await apiClient.get<ThemeConfigResponse>('/v1/themes/active', {
    timeout: 5000, // 5 second timeout
  });

  // FastAPI returns data directly
  return extractFastApiData<ThemeConfigResponse>(response);
}

/**
 * List all themes.
 * Requires authentication and superadmin role.
 * Uses apiClient for automatic token management and error handling.
 */
export async function listThemes(
  token?: string,
  skip: number = 0,
  limit: number = 100
): Promise<ThemeListResponse> {
  // If a specific token is provided, temporarily set it in storage
  if (token && token !== TokenStorage.getToken()) {
    const originalToken = TokenStorage.getToken();
    await TokenStorage.setToken(token);
    try {
      const response = await apiClient.get<ThemeListResponse>(
        `/v1/themes?skip=${skip}&limit=${limit}`
      );
      return extractFastApiData<ThemeListResponse>(response);
    } finally {
      // Restore original token
      if (originalToken) {
        await TokenStorage.setToken(originalToken);
      } else {
        await TokenStorage.removeTokens();
      }
    }
  }

  // Use apiClient which automatically handles token from TokenStorage
  const response = await apiClient.get<ThemeListResponse>(`/v1/themes?skip=${skip}&limit=${limit}`);

  // Debug: log the response structure (works in production too)
  logger.log('[listThemes] apiClient response:', {
    responseType: typeof response,
    hasData: response && typeof response === 'object' && 'data' in response,
    hasThemes: response && typeof response === 'object' && 'themes' in response,
    hasSuccess: response && typeof response === 'object' && 'success' in response,
    responseKeys: response && typeof response === 'object' ? Object.keys(response) : [],
    response: response,
  });

  // Use extractFastApiData to handle both ApiResponse wrapper and direct FastAPI response
  return extractFastApiData<ThemeListResponse>(response);
}

/**
 * Get a specific theme by ID.
 * Requires authentication and superadmin role.
 * Uses apiClient for automatic token management and error handling.
 */
export async function getTheme(themeId: number, token?: string): Promise<Theme> {
  // If a specific token is provided, temporarily set it in storage
  if (token && token !== TokenStorage.getToken()) {
    const originalToken = TokenStorage.getToken();
    await TokenStorage.setToken(token);
    try {
      const response = await apiClient.get<Theme>(`/v1/themes/${themeId}`);
      return extractFastApiData<Theme>(response);
    } finally {
      // Restore original token
      if (originalToken) {
        await TokenStorage.setToken(originalToken);
      } else {
        await TokenStorage.removeTokens();
      }
    }
  }

  // Use apiClient which automatically handles token from TokenStorage
  const response = await apiClient.get<Theme>(`/v1/themes/${themeId}`);
  return extractFastApiData<Theme>(response);
}

/**
 * Create a new theme.
 * Requires authentication and superadmin role.
 * Uses apiClient for automatic token management and error handling.
 * Throws ThemeValidationError if validation fails.
 */
export async function createTheme(themeData: ThemeCreate, token?: string): Promise<Theme> {
  try {
    // If a specific token is provided, temporarily set it in storage
    if (token && token !== TokenStorage.getToken()) {
      const originalToken = TokenStorage.getToken();
      await TokenStorage.setToken(token);
      try {
        const response = await apiClient.post<Theme>('/v1/themes', themeData);
        return extractFastApiData<Theme>(response);
      } finally {
        // Restore original token
        if (originalToken) {
          await TokenStorage.setToken(originalToken);
        } else {
          await TokenStorage.removeTokens();
        }
      }
    }

    // Use apiClient which automatically handles token from TokenStorage
    const response = await apiClient.post<Theme>('/v1/themes', themeData);
    return extractFastApiData<Theme>(response);
  } catch (error) {
    const parsed = parseThemeError(error);
    if (parsed.isValidationError) {
      throw new ThemeValidationError(
        parsed,
        formatValidationErrors(parsed.validationErrors).join('\n')
      );
    }
    throw error;
  }
}

/**
 * Update an existing theme.
 * Requires authentication and superadmin role.
 * Uses apiClient for automatic token management and error handling.
 * Throws ThemeValidationError if validation fails.
 */
export async function updateTheme(
  themeId: number,
  themeData: ThemeUpdate,
  token?: string
): Promise<Theme> {
  try {
    // If a specific token is provided, temporarily set it in storage
    if (token && token !== TokenStorage.getToken()) {
      const originalToken = TokenStorage.getToken();
      await TokenStorage.setToken(token);
      try {
        const response = await apiClient.put<Theme>(`/v1/themes/${themeId}`, themeData);
        return extractFastApiData<Theme>(response);
      } finally {
        // Restore original token
        if (originalToken) {
          await TokenStorage.setToken(originalToken);
        } else {
          await TokenStorage.removeTokens();
        }
      }
    }

    // Log what we're sending for debugging
    logger.debug('[updateTheme] Sending theme data', {
      themeId,
      themeData: JSON.stringify(themeData, null, 2),
      config: themeData.config ? JSON.stringify(themeData.config, null, 2) : 'no config',
    });

    // Use apiClient which automatically handles token from TokenStorage
    const response = await apiClient.put<Theme>(`/v1/themes/${themeId}`, themeData);
    return extractFastApiData<Theme>(response);
  } catch (error) {
    // Always log errors for debugging
    logger.error(
      '[updateTheme] Error caught',
      error instanceof Error ? error : new Error(String(error)),
      {
        context: 'updateTheme',
      }
    );

    // If it's an AxiosError, log the full response
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      logger.error('[updateTheme] Axios error response', new Error('Axios error'), {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        fullResponse: JSON.stringify(axiosError.response?.data, null, 2),
      });
    }

    const parsed = parseThemeError(error);
    logger.error('[updateTheme] Parsed error', parsed.originalError, {
      isValidationError: parsed.isValidationError,
      message: parsed.message,
      validationErrors: parsed.validationErrors,
    });

    if (parsed.isValidationError) {
      const formattedErrors = formatValidationErrors(parsed.validationErrors);
      // Always prefer the parsed message if it's not generic
      let errorMessage = parsed.message;

      // If formatted errors exist and are not generic, use them
      if (formattedErrors.length > 0) {
        const formattedMessage = formattedErrors.join('\n');
        // Only use formatted message if it's not the generic fallback
        if (
          !formattedMessage.includes('Erreur de validation inconnue') &&
          !formattedMessage.includes('Request failed with status code')
        ) {
          errorMessage = formattedMessage;
        } else if (parsed.message && !parsed.message.includes('Request failed')) {
          // Use parsed message if it's not generic
          errorMessage = parsed.message;
        }
      } else if (parsed.message && !parsed.message.includes('Request failed')) {
        // Use parsed message directly if no formatted errors
        errorMessage = parsed.message;
      } else {
        // Last resort: use formatted errors even if generic
        errorMessage =
          formattedErrors.length > 0
            ? formattedErrors.join('\n')
            : 'Erreur de validation. Vérifiez les formats de couleur et les ratios de contraste.';
      }

      logger.error('[updateTheme] Throwing ThemeValidationError', new Error(errorMessage), {
        message: errorMessage,
      });
      throw new ThemeValidationError(parsed, errorMessage);
    }
    throw error;
  }
}

/**
 * Activate a theme (deactivates all others).
 * Requires authentication and superadmin role.
 * Uses apiClient for automatic token management and error handling.
 */
export async function activateTheme(themeId: number, token?: string): Promise<Theme> {
  // If a specific token is provided, temporarily set it in storage
  if (token && token !== TokenStorage.getToken()) {
    const originalToken = TokenStorage.getToken();
    await TokenStorage.setToken(token);
    try {
      const response = await apiClient.post<Theme>(`/v1/themes/${themeId}/activate`);
      return extractFastApiData<Theme>(response);
    } finally {
      // Restore original token
      if (originalToken) {
        await TokenStorage.setToken(originalToken);
      } else {
        await TokenStorage.removeTokens();
      }
    }
  }

  // Use apiClient which automatically handles token from TokenStorage
  const response = await apiClient.post<Theme>(`/v1/themes/${themeId}/activate`);
  return extractFastApiData<Theme>(response);
}

/**
 * Update the active theme mode (light/dark/system).
 * Requires authentication and superadmin role.
 * Uses apiClient for automatic token management and error handling.
 */
export async function updateActiveThemeMode(
  mode: 'light' | 'dark' | 'system',
  token?: string
): Promise<void> {
  // If a specific token is provided, temporarily set it in storage
  if (token && token !== TokenStorage.getToken()) {
    const originalToken = TokenStorage.getToken();
    await TokenStorage.setToken(token);
    try {
      await apiClient.put<void>('/v1/themes/active/mode', { mode });
    } finally {
      // Restore original token
      if (originalToken) {
        await TokenStorage.setToken(originalToken);
      } else {
        await TokenStorage.removeTokens();
      }
    }
    return;
  }

  // Use apiClient which automatically handles token from TokenStorage
  await apiClient.put<void>('/v1/themes/active/mode', { mode });
}

/**
 * Delete a theme.
 * Requires authentication and superadmin role.
 * Cannot delete the active theme.
 * Uses apiClient for automatic token management and error handling.
 */
export async function deleteTheme(themeId: number, token?: string): Promise<void> {
  // If a specific token is provided, temporarily set it in storage
  if (token && token !== TokenStorage.getToken()) {
    const originalToken = TokenStorage.getToken();
    await TokenStorage.setToken(token);
    try {
      await apiClient.delete<void>(`/v1/themes/${themeId}`);
    } finally {
      // Restore original token
      if (originalToken) {
        await TokenStorage.setToken(originalToken);
      } else {
        await TokenStorage.removeTokens();
      }
    }
    return;
  }

  // Use apiClient which automatically handles token from TokenStorage
  await apiClient.delete<void>(`/v1/themes/${themeId}`);
}
