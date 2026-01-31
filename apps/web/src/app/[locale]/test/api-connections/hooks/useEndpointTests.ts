/**
 * useEndpointTests Hook
 * Hook for testing API endpoints
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { testCriticalEndpoints } from '../services/endpointTester';
import type { EndpointTestResult, TestProgress } from '../types/health.types';
import { logger } from '@/lib/logger';

export function useEndpointTests() {
  // Mounted check to prevent memory leaks
  const isMountedRef = useRef(true);
  // AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const [endpointTests, setEndpointTests] = useState<EndpointTestResult[]>([]);
  const [isTestingEndpoints, setIsTestingEndpoints] = useState(false);
  const [testProgress, setTestProgress] = useState<TestProgress | null>(null);
  const [error, setError] = useState('');

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleTestCriticalEndpoints = useCallback(async () => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsTestingEndpoints(true);
    setError('');
    setEndpointTests([]);
    setTestProgress(null);

    try {
      const results = await testCriticalEndpoints(
        signal,
        (updatedResults) => {
          // Check if component is still mounted before updating state
          if (isMountedRef.current) {
            setEndpointTests([...updatedResults]);
          }
        },
        (progress) => {
          // Update progress indicator
          if (isMountedRef.current) {
            setTestProgress(progress);
          }
        }
      );

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;

      setEndpointTests(results);
    } catch (err: unknown) {
      // Don't update state if request was aborted or component unmounted
      if (signal.aborted || !isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to test endpoints';
      setError(errorMessage);
      logger.error('Failed to test endpoints', { error: err });
    } finally {
      if (isMountedRef.current) {
        setIsTestingEndpoints(false);
        // Keep progress visible even after completion
      }
    }
  }, []);

  const copyTestResult = useCallback(async (test: EndpointTestResult) => {
    const testText = `${test.method} ${test.endpoint}\nStatus: ${test.status}\n${test.message ? `Message: ${test.message}` : ''}${test.responseTime ? `\nResponse Time: ${test.responseTime}ms` : ''}`;
    try {
      await navigator.clipboard.writeText(testText);
      return true;
    } catch (err: unknown) {
      logger.error('Failed to copy test result', { error: err });
      return false;
    }
  }, []);

  return {
    endpointTests,
    isTestingEndpoints,
    testProgress,
    error,
    setError,
    handleTestCriticalEndpoints,
    copyTestResult,
  };
}
