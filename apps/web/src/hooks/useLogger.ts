/**
 * useLogger Hook
 * React hook for accessing the logger
 */

import { useMemo } from 'react';
import { logger } from '@/lib/logger';

export function useLogger() {
  return useMemo(
    () => ({
      debug: (message: string, context?: unknown) => logger.debug(message, context),
      info: (message: string, context?: unknown) => logger.info(message, context),
      warn: (message: string, context?: unknown) => logger.warn(message, context),
      error: (message: string, error?: Error | unknown, context?: unknown) => {
        const normalizedError =
          error instanceof Error ? error : error ? new Error(String(error)) : undefined;
        logger.error(message, normalizedError, context);
      },
    }),
    []
  );
}
