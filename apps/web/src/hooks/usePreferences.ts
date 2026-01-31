import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';
import { extractApiData } from '@/lib/api/utils';

// User preferences can have various value types (string, number, boolean, object, etc.)
export type UserPreferenceValue = string | number | boolean | object | null | undefined;
export type UserPreferences = Record<string, UserPreferenceValue>;

/**
 * Hook to manage user preferences
 */
export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<UserPreferences>('/v1/users/preferences');
      // FastAPI returns data directly, not wrapped in ApiResponse
      // apiClient.get returns response.data from axios, which is already the FastAPI response
      // So response is already the data, or response.data if wrapped
      const data = extractApiData<UserPreferences>(
        response as unknown as
          | UserPreferences
          | import('@modele/types').ApiResponse<UserPreferences>
      );
      if (data && typeof data === 'object') {
        setPreferences(data);
      }
    } catch (error) {
      // Use logger instead of console.error for production safety
      if (process.env.NODE_ENV === 'development') {
        logger.error('', 'Failed to fetch preferences:', error);
      }
      // Set empty preferences on error to prevent UI issues
      setPreferences({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const getPreference = useCallback(
    <T = unknown>(key: string, defaultValue?: T): T => {
      return (preferences[key] !== undefined ? preferences[key] : defaultValue) as T;
    },
    [preferences]
  );

  const setPreference = useCallback(async (key: string, value: UserPreferenceValue) => {
    try {
      await apiClient.put(`/v1/users/preferences/${key}`, { value });
      setPreferences((prev) => ({ ...prev, [key]: value }) as UserPreferences);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('', `Failed to set preference ${key}:`, error);
      }
      return false;
    }
  }, []);

  const setPreferencesBatch = useCallback(async (prefs: Partial<UserPreferences>) => {
    try {
      await apiClient.put('/v1/users/preferences', prefs);
      setPreferences((prev) => ({ ...prev, ...prefs }));
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('', 'Failed to set preferences:', error);
      }
      return false;
    }
  }, []);

  return {
    preferences,
    isLoading,
    getPreference,
    setPreference,
    setPreferencesBatch,
    refresh: fetchPreferences,
  };
}
