/**
 * Theme Font API client for managing custom uploaded fonts.
 * Uses apiClient for centralized authentication and error handling.
 */
import type { ThemeFont, ThemeFontCreate, ThemeFontListResponse } from '@modele/types';
import { apiClient } from './client';
import { logger } from '@/lib/logger';

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
    // response is already ThemeFont, ThemeFontListResponse, etc.
    return response as T;
  }

  return response as T;
}

/**
 * Upload a custom font file.
 * Requires authentication and superadmin role.
 */
export async function uploadFont(file: File, metadata?: ThemeFontCreate): Promise<ThemeFont> {
  const formData = new FormData();
  formData.append('file', file);

  if (metadata?.name) {
    formData.append('name', metadata.name);
  }
  if (metadata?.font_family) {
    formData.append('font_family', metadata.font_family);
  }
  if (metadata?.description) {
    formData.append('description', metadata.description);
  }
  if (metadata?.font_weight) {
    formData.append('font_weight', metadata.font_weight);
  }
  if (metadata?.font_style) {
    formData.append('font_style', metadata.font_style);
  }

  try {
    const response = await apiClient.post<ThemeFont>('/v1/theme-fonts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return extractFastApiData<ThemeFont>(response);
  } catch (error) {
    logger.error('Failed to upload font', error);
    throw error;
  }
}

/**
 * List all uploaded fonts.
 * Requires authentication and superadmin role.
 */
export async function listFonts(
  skip: number = 0,
  limit: number = 100
): Promise<ThemeFontListResponse> {
  try {
    const response = await apiClient.get<ThemeFontListResponse>(
      `/v1/theme-fonts?skip=${skip}&limit=${limit}`
    );
    return extractFastApiData<ThemeFontListResponse>(response);
  } catch (error) {
    logger.error('Failed to list fonts', error);
    throw error;
  }
}

/**
 * Get a specific font by ID.
 * Requires authentication and superadmin role.
 */
export async function getFont(fontId: number): Promise<ThemeFont> {
  try {
    const response = await apiClient.get<ThemeFont>(`/v1/theme-fonts/${fontId}`);
    return extractFastApiData<ThemeFont>(response);
  } catch (error) {
    logger.error('Failed to get font', error);
    throw error;
  }
}

/**
 * Delete a font.
 * Requires authentication and superadmin role.
 */
export async function deleteFont(fontId: number): Promise<void> {
  try {
    await apiClient.delete<void>(`/v1/theme-fonts/${fontId}`);
  } catch (error) {
    logger.error('Failed to delete font', error);
    throw error;
  }
}

/**
 * Check if font families exist in the database.
 * Returns a dictionary mapping font family names to boolean (exists or not).
 * Requires authentication.
 */
export async function checkFonts(fontFamilies: string[]): Promise<Record<string, boolean>> {
  try {
    const response = await apiClient.post<Record<string, boolean>>(
      '/v1/theme-fonts/check',
      fontFamilies
    );
    return extractFastApiData<Record<string, boolean>>(response);
  } catch (error) {
    logger.error('Failed to check fonts', error);
    throw error;
  }
}
