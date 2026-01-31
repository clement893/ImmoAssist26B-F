/**
 * Health Checker Service
 * Service for checking API connection health status
 */

import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type {
  ConnectionStatus,
  CheckResult,
  ApiResponseWrapper,
  HealthMetrics,
  EndpointTestResult,
  ComponentTestResult,
} from '../types/health.types';

/**
 * Check overall API connection status
 */
export async function checkStatus(signal?: AbortSignal): Promise<ConnectionStatus | null> {
  try {
    const response = await apiClient.get<ConnectionStatus>('/v1/api-connection-check/status', {
      signal,
    });
    // Extract data using proper type handling
    const apiResponse = response as unknown as ApiResponseWrapper<ConnectionStatus>;
    const data = apiResponse?.data || (response as ConnectionStatus);

    // If frontend/backend data is empty but success is true, it means scripts are not available
    // This is normal in production environments
    if (data && data.success && (!data.frontend || Object.keys(data.frontend).length === 0)) {
      return {
        ...data,
        frontend: {
          total: data.frontend?.total ?? 0,
          connected: data.frontend?.connected ?? 0,
          partial: data.frontend?.partial ?? 0,
          needsIntegration: data.frontend?.needsIntegration ?? 0,
          static: data.frontend?.static ?? 0,
          error: data.frontend?.error,
          message:
            data.frontend?.message || 'Frontend check scripts not available in this environment',
          note: 'This is normal in production. Use the "Check Frontend" button below for detailed analysis.',
        },
      };
    }

    return data;
  } catch (err: unknown) {
    if (signal?.aborted) {
      return null;
    }
    logger.error('Failed to check API connection status', { error: err });
    throw new Error(getErrorMessage(err) || 'Failed to check API connection status');
  }
}

/**
 * Analyze frontend files for API connections
 */
export async function analyzeFrontendFiles(signal?: AbortSignal): Promise<CheckResult> {
  // Try to fetch the API manifest generated at build time
  try {
    const manifestResponse = await fetch('/api-manifest.json', { signal });
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();

      // Send analysis to backend
      const response = await apiClient.post<CheckResult>(
        '/v1/api-connection-check/frontend/analyze',
        {
          pages: manifest.pages || [],
          summary: manifest.summary || {
            total: 0,
            connected: 0,
            partial: 0,
            needsIntegration: 0,
            static: 0,
          },
          timestamp: Date.now(),
        },
        { signal }
      );
      return (response as unknown as CheckResult) ?? { success: false, error: 'No data returned' };
    }
  } catch (manifestErr) {
    logger.warn('Could not load API manifest', { error: manifestErr });
  }

  // Fallback: create basic analysis from known routes
  // This is a simplified version for production when manifest is not available
  const pages: Array<{ path: string; apiCalls: Array<{ method: string; endpoint: string }> }> = [];
  const summary = {
    total: 0,
    connected: 0,
    partial: 0,
    needsIntegration: 0,
    static: 0,
  };

  // Send analysis to backend
  try {
    const response = await apiClient.post<CheckResult>(
      '/v1/api-connection-check/frontend/analyze',
      {
        pages,
        summary,
        timestamp: Date.now(),
      },
      { signal }
    );
    return (response as unknown as CheckResult) ?? { success: false, error: 'No data returned' };
  } catch (err: unknown) {
    throw err;
  }
}

/**
 * Check frontend API connections
 */
export async function checkFrontend(detailed = false, signal?: AbortSignal): Promise<CheckResult> {
  try {
    const params = detailed ? { detailed: 'true' } : {};
    const response = await apiClient.get<CheckResult>('/v1/api-connection-check/frontend', {
      params,
      signal,
    });
    const apiResponse = response as unknown as ApiResponseWrapper<CheckResult>;
    const data = (apiResponse?.data || (response as CheckResult)) ?? null;

    // If backend suggests using frontend analysis, do it
    if (data && !data.success && data.useFrontendAnalysis) {
      // Try frontend analysis
      try {
        const frontendAnalysis = await analyzeFrontendFiles(signal);
        return frontendAnalysis;
      } catch (frontendErr) {
        // If frontend analysis also fails, return the original error
        if (data.error) {
          logger.warn('Frontend analysis also unavailable', { error: frontendErr });
        }
        return data;
      }
    }

    return data ?? { success: false, error: 'No data returned' };
  } catch (err: unknown) {
    if (signal?.aborted) {
      return { success: false, error: 'Request aborted' };
    }
    const errorMessage = getErrorMessage(err) || 'Failed to check frontend connections';
    logger.error('Failed to check frontend connections', { error: err });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check backend endpoints
 */
export async function checkBackend(signal?: AbortSignal): Promise<CheckResult> {
  try {
    const response = await apiClient.get<CheckResult>('/v1/api-connection-check/backend', {
      signal,
    });
    // apiClient.get returns response.data from axios, which is the FastAPI response directly
    // FastAPI returns the data directly, not wrapped in ApiResponse
    // So response is already CheckResult, not ApiResponse<CheckResult>
    const apiResponse = response as unknown as ApiResponseWrapper<CheckResult>;
    const data = (apiResponse?.data || (response as CheckResult)) ?? null;

    return data ?? { success: false, error: 'No data returned' };
  } catch (err: unknown) {
    if (signal?.aborted) {
      return { success: false, error: 'Request aborted' };
    }
    const errorMessage = getErrorMessage(err) || 'Failed to check backend endpoints';
    logger.error('Failed to check backend endpoints', { error: err });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Calculate health metrics based on status, endpoint tests, and component tests
 */
export function calculateHealthMetrics(
  status: ConnectionStatus | null,
  frontendCheck: CheckResult | null,
  backendCheck: CheckResult | null,
  endpointTests: EndpointTestResult[],
  componentTests: ComponentTestResult[]
): HealthMetrics {
  // Calculate Connection Rate (0-100)
  let connectionRate = 0;
  let connectionWeight = 0;

  // Frontend connection rate
  if (status?.frontend && status.frontend.total > 0) {
    const frontendConnected = status.frontend.connected || 0;
    const frontendPartial = status.frontend.partial || 0;
    // Connected = 100%, Partial = 50%, Needs Integration = 0%
    const frontendScore = (frontendConnected * 100 + frontendPartial * 50) / status.frontend.total;
    connectionRate += frontendScore * 0.5; // Frontend is 50% of connection rate
    connectionWeight += 0.5;
  } else if (
    frontendCheck?.summary &&
    frontendCheck.summary.total &&
    frontendCheck.summary.total > 0
  ) {
    const connected = frontendCheck.summary.connected || 0;
    const partial = frontendCheck.summary.partial || 0;
    const total = frontendCheck.summary.total;
    const frontendScore = (connected * 100 + partial * 50) / total;
    connectionRate += frontendScore * 0.5;
    connectionWeight += 0.5;
  }

  // Backend connection rate
  if (status?.backend && status.backend.registered !== undefined) {
    const registered = status.backend.registered || 0;
    const unregistered = status.backend.unregistered || 0;
    const total = registered + unregistered;
    if (total > 0) {
      const backendScore = (registered / total) * 100;
      connectionRate += backendScore * 0.5; // Backend is 50% of connection rate
      connectionWeight += 0.5;
    }
  } else if (backendCheck?.summary && backendCheck.summary.registered !== undefined) {
    const registered = backendCheck.summary.registered || 0;
    const unregistered = backendCheck.summary.unregistered || 0;
    const total = registered + unregistered;
    if (total > 0) {
      const backendScore = (registered / total) * 100;
      connectionRate += backendScore * 0.5;
      connectionWeight += 0.5;
    }
  }

  // Normalize connection rate
  if (connectionWeight > 0) {
    connectionRate = connectionRate / connectionWeight;
  } else {
    connectionRate = 50; // Default to 50% if no data
  }

  // Calculate Performance Rate (0-100) based on endpoint response times
  let performanceRate = 100; // Default to 100%
  if (endpointTests.length > 0) {
    const successfulTests = endpointTests.filter(
      (t) => t.status === 'success' && t.responseTime !== undefined
    );
    if (successfulTests.length > 0) {
      const avgResponseTime =
        successfulTests.reduce((sum, t) => sum + (t.responseTime || 0), 0) / successfulTests.length;
      // Performance scoring: < 200ms = 100%, < 500ms = 90%, < 1000ms = 75%, < 2000ms = 50%, >= 2000ms = 25%
      if (avgResponseTime < 200) {
        performanceRate = 100;
      } else if (avgResponseTime < 500) {
        performanceRate = 90;
      } else if (avgResponseTime < 1000) {
        performanceRate = 75;
      } else if (avgResponseTime < 2000) {
        performanceRate = 50;
      } else {
        performanceRate = 25;
      }
    } else {
      performanceRate = 0; // No successful tests = 0% performance
    }
  }

  // Calculate Security Rate (0-100) based on authentication requirements
  let securityRate = 100; // Default to 100%
  if (endpointTests.length > 0) {
    const testsWithAuth = endpointTests.filter(
      (t) => t.category?.toLowerCase().includes('auth') || t.endpoint.includes('/auth/')
    );
    const secureTests = testsWithAuth.filter((t) => t.status === 'success');
    if (testsWithAuth.length > 0) {
      securityRate = (secureTests.length / testsWithAuth.length) * 100;
    }
  }

  // Calculate overall Health Score (weighted average)
  // Connection: 50%, Performance: 30%, Security: 20%
  const healthScore = Math.round(connectionRate * 0.5 + performanceRate * 0.3 + securityRate * 0.2);

  // Calculate feature counts
  const totalFeatures = endpointTests.length + componentTests.length;
  const activeFeatures =
    endpointTests.filter((t) => t.status === 'success').length +
    componentTests.filter((t) => t.status === 'success').length;
  const partialFeatures =
    endpointTests.filter((t) => t.status === 'pending').length +
    componentTests.filter((t) => t.status === 'pending').length;
  const inactiveFeatures =
    endpointTests.filter((t) => t.status === 'error').length +
    componentTests.filter((t) => t.status === 'error').length;
  const errorFeatures = inactiveFeatures; // Same as inactive for now

  return {
    healthScore: Math.max(0, Math.min(100, healthScore)),
    connectionRate: Math.max(0, Math.min(100, Math.round(connectionRate))),
    performanceRate: Math.max(0, Math.min(100, Math.round(performanceRate))),
    securityRate: Math.max(0, Math.min(100, Math.round(securityRate))),
    totalFeatures,
    activeFeatures,
    partialFeatures,
    inactiveFeatures,
    errorFeatures,
  };
}
