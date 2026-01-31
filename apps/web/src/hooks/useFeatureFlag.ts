import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { apiClient } from '@/lib/api/client';

interface FeatureFlagResult {
  enabled: boolean;
  variant?: string;
}

/**
 * Hook to check if a feature flag is enabled
 */
export function useFeatureFlag(
  key: string,
  teamId?: number
): {
  enabled: boolean;
  variant?: string;
  isLoading: boolean;
} {
  const [result, setResult] = useState<FeatureFlagResult>({ enabled: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFlag = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get<FeatureFlagResult>(
          `/api/v1/feature-flags/feature-flags/${key}/check`,
          {
            params: {
              team_id: teamId,
            },
          }
        );
        if (response.data) {
          setResult(response.data);
        }
      } catch (error) {
        logger.error('', `Failed to check feature flag ${key}:`, error);
        setResult({ enabled: false });
      } finally {
        setIsLoading(false);
      }
    };

    checkFlag();
  }, [key, teamId]);

  return {
    enabled: result.enabled,
    variant: result.variant,
    isLoading,
  };
}
