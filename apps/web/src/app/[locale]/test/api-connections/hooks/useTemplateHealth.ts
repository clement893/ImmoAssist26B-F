/**
 * useTemplateHealth Hook
 * Main hook for template health checking
 */

import { useState, useRef, useEffect } from 'react';
import { checkStatus, checkFrontend, checkBackend } from '../services/healthChecker';
import type { ConnectionStatus, CheckResult } from '../types/health.types';

export function useTemplateHealth() {
  // Mounted check to prevent memory leaks
  const isMountedRef = useRef(true);
  // AbortController for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [frontendCheck, setFrontendCheck] = useState<CheckResult | null>(null);
  const [backendCheck, setBackendCheck] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
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

  const handleCheckStatus = async () => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoadingStatus(true);
    setError('');

    try {
      const data = await checkStatus(signal);

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;

      setStatus(data);
    } catch (err: unknown) {
      // Don't update state if request was aborted or component unmounted
      if (signal.aborted || !isMountedRef.current) return;

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to check API connection status';
      setError(errorMessage);
      setStatus(null);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingStatus(false);
      }
    }
  };

  const handleCheckFrontend = async (detailed = false) => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError('');
    setFrontendCheck(null);

    try {
      const data = await checkFrontend(detailed, signal);

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;

      setFrontendCheck(data);
      // If the response indicates failure, also set error for visibility
      if (data && !data.success && data.error) {
        setError(data.error);
      }
    } catch (err: unknown) {
      // Don't update state if request was aborted or component unmounted
      if (signal.aborted || !isMountedRef.current) return;

      const errorMessage =
        err instanceof Error ? err.message : 'Failed to check frontend connections';
      setError(errorMessage);
      setFrontendCheck({
        success: false,
        error: errorMessage,
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleCheckBackend = async () => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError('');
    setBackendCheck(null);

    try {
      const data = await checkBackend(signal);

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;

      setBackendCheck(data);
      // If the response indicates failure, also set error for visibility
      if (data && !data.success && data.error) {
        setError(data.error);
      }
    } catch (err: unknown) {
      // Don't update state if request was aborted or component unmounted
      if (signal.aborted || !isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to check backend endpoints';
      setError(errorMessage);
      setBackendCheck({
        success: false,
        error: errorMessage,
      });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  return {
    status,
    frontendCheck,
    backendCheck,
    isLoading,
    isLoadingStatus,
    error,
    setError,
    handleCheckStatus,
    handleCheckFrontend,
    handleCheckBackend,
  };
}
