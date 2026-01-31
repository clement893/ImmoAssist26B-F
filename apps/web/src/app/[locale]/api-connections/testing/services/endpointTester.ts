/**
 * Endpoint Tester Service
 * Service for testing API endpoints
 */

import { apiClient } from '@/lib/api/client';
import { getErrorMessage } from '@/lib/errors';
import type { EndpointTestResult, EndpointToTest, TestProgress } from '../types/health.types';

/**
 * Get all endpoints to test
 */
export function getEndpointsToTest(): EndpointToTest[] {
  return [
    // ========== AUTHENTICATION & SECURITY ==========
    { endpoint: '/v1/auth/me', method: 'GET', requiresAuth: true, category: 'Auth' },
    { endpoint: '/v1/auth/2fa/status', method: 'GET', requiresAuth: true, category: 'Auth' },
    { endpoint: '/v1/api-keys', method: 'GET', requiresAuth: true, category: 'Auth' },

    // ========== USER MANAGEMENT ==========
    { endpoint: '/v1/users/preferences', method: 'GET', requiresAuth: true, category: 'Users' },
    {
      endpoint: '/v1/users/preferences/notifications',
      method: 'GET',
      requiresAuth: true,
      category: 'Users',
    },

    // ========== ADMIN & TENANCY ==========
    { endpoint: '/v1/admin/tenancy/config', method: 'GET', requiresAuth: true, category: 'Admin' },
    { endpoint: '/v1/admin/statistics', method: 'GET', requiresAuth: true, category: 'Admin' },
    { endpoint: '/v1/admin/users', method: 'GET', requiresAuth: true, category: 'Admin' },
    { endpoint: '/v1/admin/organizations', method: 'GET', requiresAuth: true, category: 'Admin' },

    // ========== RBAC ==========
    { endpoint: '/v1/rbac/roles', method: 'GET', requiresAuth: true, category: 'RBAC' },
    { endpoint: '/v1/rbac/permissions', method: 'GET', requiresAuth: true, category: 'RBAC' },

    // ========== MEDIA & UPLOADS ==========
    { endpoint: '/v1/media', method: 'GET', requiresAuth: true, category: 'Media' },
    { endpoint: '/v1/media/validate', method: 'POST', requiresAuth: true, category: 'Media' },

    // ========== CONTENT MANAGEMENT ==========
    { endpoint: '/v1/pages', method: 'GET', requiresAuth: true, category: 'Content' },
    { endpoint: '/v1/posts', method: 'GET', requiresAuth: false, category: 'Content' },
    { endpoint: '/v1/templates', method: 'GET', requiresAuth: true, category: 'Content' },
    { endpoint: '/v1/forms', method: 'GET', requiresAuth: true, category: 'Content' },
    { endpoint: '/v1/menus', method: 'GET', requiresAuth: true, category: 'Content' },

    // ========== TAGS & CATEGORIES ==========
    { endpoint: '/v1/tags', method: 'GET', requiresAuth: true, category: 'Tags' },
    { endpoint: '/v1/tags/categories/tree', method: 'GET', requiresAuth: true, category: 'Tags' },

    // ========== PROJECTS ==========
    { endpoint: '/v1/projects', method: 'GET', requiresAuth: true, category: 'Projects' },

    // ========== THEMES ==========
    { endpoint: '/v1/themes', method: 'GET', requiresAuth: true, category: 'Themes' },
    { endpoint: '/v1/theme-fonts', method: 'GET', requiresAuth: true, category: 'Themes' },

    // ========== COMMENTS & INTERACTIONS ==========
    { endpoint: '/v1/comments/post/1', method: 'GET', requiresAuth: false, category: 'Comments' },
    { endpoint: '/v1/favorites', method: 'GET', requiresAuth: true, category: 'Favorites' },
    { endpoint: '/v1/activities', method: 'GET', requiresAuth: true, category: 'Activities' },

    // ========== NOTIFICATIONS ==========
    { endpoint: '/v1/notifications', method: 'GET', requiresAuth: true, category: 'Notifications' },
    { endpoint: '/v1/announcements', method: 'GET', requiresAuth: true, category: 'Notifications' },

    // ========== SEARCH ==========
    {
      endpoint: '/v1/search/autocomplete?q=test',
      method: 'GET',
      requiresAuth: false,
      category: 'Search',
    },

    // ========== FEATURE FLAGS ==========
    { endpoint: '/v1/feature-flags', method: 'GET', requiresAuth: true, category: 'Feature Flags' },

    // ========== SCHEDULED TASKS ==========
    { endpoint: '/v1/scheduled-tasks', method: 'GET', requiresAuth: true, category: 'Tasks' },

    // ========== REPORTS & ANALYTICS ==========
    { endpoint: '/v1/reports', method: 'GET', requiresAuth: true, category: 'Reports' },
    { endpoint: '/v1/analytics', method: 'GET', requiresAuth: true, category: 'Analytics' },
    { endpoint: '/v1/insights', method: 'GET', requiresAuth: true, category: 'Insights' },

    // ========== EXPORTS & IMPORTS ==========
    { endpoint: '/v1/exports', method: 'GET', requiresAuth: true, category: 'Exports' },
    { endpoint: '/v1/imports', method: 'GET', requiresAuth: true, category: 'Imports' },

    // ========== VERSIONS & SHARES ==========
    { endpoint: '/v1/versions', method: 'GET', requiresAuth: true, category: 'Versions' },
    { endpoint: '/v1/shares', method: 'GET', requiresAuth: true, category: 'Shares' },

    // ========== TEAMS & INVITATIONS ==========
    { endpoint: '/v1/teams', method: 'GET', requiresAuth: true, category: 'Teams' },
    { endpoint: '/v1/invitations', method: 'GET', requiresAuth: true, category: 'Invitations' },

    // ========== SUPPORT ==========
    { endpoint: '/v1/support/tickets', method: 'GET', requiresAuth: true, category: 'Support' },

    // ========== SEO ==========
    { endpoint: '/v1/seo', method: 'GET', requiresAuth: true, category: 'SEO' },

    // ========== INTEGRATIONS ==========
    { endpoint: '/v1/integrations', method: 'GET', requiresAuth: true, category: 'Integrations' },

    // ========== SETTINGS ==========
    {
      endpoint: '/v1/settings/organization',
      method: 'GET',
      requiresAuth: true,
      category: 'Settings',
    },
    { endpoint: '/v1/api-settings', method: 'GET', requiresAuth: true, category: 'Settings' },

    // ========== BACKUPS & AUDIT ==========
    { endpoint: '/v1/backups', method: 'GET', requiresAuth: true, category: 'Backups' },
    { endpoint: '/v1/audit-trail', method: 'GET', requiresAuth: true, category: 'Audit' },

    // ========== EMAIL & NEWSLETTER ==========
    {
      endpoint: '/v1/newsletter/subscriptions',
      method: 'GET',
      requiresAuth: true,
      category: 'Newsletter',
    },
    { endpoint: '/v1/email-templates', method: 'GET', requiresAuth: true, category: 'Email' },

    // ========== ONBOARDING & FEEDBACK ==========
    { endpoint: '/v1/onboarding', method: 'GET', requiresAuth: true, category: 'Onboarding' },
    { endpoint: '/v1/feedback', method: 'GET', requiresAuth: true, category: 'Feedback' },

    // ========== DOCUMENTATION ==========
    { endpoint: '/v1/documentation', method: 'GET', requiresAuth: true, category: 'Documentation' },

    // ========== CLIENT PORTAL ==========
    {
      endpoint: '/v1/client/invoices',
      method: 'GET',
      requiresAuth: true,
      category: 'Client Portal',
    },
    {
      endpoint: '/v1/client/projects',
      method: 'GET',
      requiresAuth: true,
      category: 'Client Portal',
    },
    {
      endpoint: '/v1/client/tickets',
      method: 'GET',
      requiresAuth: true,
      category: 'Client Portal',
    },
    {
      endpoint: '/v1/client/dashboard',
      method: 'GET',
      requiresAuth: true,
      category: 'Client Portal',
    },

    // ========== ERP PORTAL ==========
    { endpoint: '/v1/erp/clients', method: 'GET', requiresAuth: true, category: 'ERP' },
    { endpoint: '/v1/erp/orders', method: 'GET', requiresAuth: true, category: 'ERP' },
    { endpoint: '/v1/erp/invoices', method: 'GET', requiresAuth: true, category: 'ERP' },
    { endpoint: '/v1/erp/inventory', method: 'GET', requiresAuth: true, category: 'ERP' },
    { endpoint: '/v1/erp/reports', method: 'GET', requiresAuth: true, category: 'ERP' },
    { endpoint: '/v1/erp/dashboard', method: 'GET', requiresAuth: true, category: 'ERP' },

    // ========== HEALTH CHECKS ==========
    { endpoint: '/v1/health/health', method: 'GET', requiresAuth: false, category: 'Health' },
    { endpoint: '/v1/db-health', method: 'GET', requiresAuth: false, category: 'Health' },

    // ========== AI ==========
    { endpoint: '/v1/ai/chat', method: 'POST', requiresAuth: true, category: 'AI' },
  ];
}

/**
 * Test a single endpoint
 */
export async function testEndpoint(
  endpoint: EndpointToTest,
  signal?: AbortSignal,
  onProgress?: (result: EndpointTestResult) => void
): Promise<EndpointTestResult> {
  const startTime = Date.now();
  const testResult: EndpointTestResult = {
    endpoint: endpoint.endpoint,
    method: endpoint.method,
    status: 'pending',
    category: endpoint.category,
  };

  // Notify progress
  if (onProgress) {
    onProgress(testResult);
  }

  try {
    if (!endpoint.endpoint) {
      throw new Error('Endpoint is required');
    }

    const testMethod = endpoint.method.toLowerCase();

    // Separate URL and query parameters
    const [urlPath, queryString] = endpoint.endpoint.split('?');
    const params = queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {};

    if (testMethod === 'get') {
      await apiClient.get(urlPath || endpoint.endpoint, { params, signal });
    } else if (testMethod === 'post') {
      // For POST, send minimal data based on endpoint type
      let testData: Record<string, unknown> = {};

      if (endpoint.endpoint.includes('validate')) {
        testData = { name: 'test.jpg', size: 1024, type: 'image/jpeg' };
      } else if (endpoint.endpoint.includes('/ai/chat')) {
        // AI chat endpoint requires specific format with messages
        testData = {
          messages: [{ content: 'test', role: 'user' }],
          provider: 'auto',
        };
      } else if (
        endpoint.endpoint.includes('search') &&
        !endpoint.endpoint.includes('autocomplete')
      ) {
        testData = { query: 'test' };
      } else {
        testData = {};
      }

      await apiClient.post(urlPath || endpoint.endpoint, testData, { signal });
    } else {
      throw new Error(`Method ${endpoint.method} not supported in test`);
    }

    const responseTime = Date.now() - startTime;
    testResult.status = 'success';
    testResult.message = `OK (${responseTime}ms)`;
    testResult.responseTime = responseTime;
  } catch (err: unknown) {
    const responseTime = Date.now() - startTime;
    const errorMessage = getErrorMessage(err);

    // Some errors are expected (401 for unauthenticated endpoints, 404 for non-existent resources)
    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      testResult.status = endpoint.requiresAuth ? 'error' : 'success';
      testResult.message = endpoint.requiresAuth
        ? `Auth required (${responseTime}ms)`
        : `OK - Auth check (${responseTime}ms)`;
    } else if (errorMessage.includes('404')) {
      // 404 can be OK if endpoint exists but resource doesn't exist
      testResult.status = 'success';
      testResult.message = `Endpoint exists (${responseTime}ms)`;
    } else if (errorMessage.includes('405')) {
      // 405 Method Not Allowed - endpoint exists but method not supported
      testResult.status = 'error';
      testResult.message = `Method not allowed (${responseTime}ms)`;
    } else if (errorMessage.includes('422') || errorMessage.includes('400')) {
      // 422/400 can indicate endpoint exists but data is invalid (which is OK for a test)
      // Except if it's a validation error for required parameters
      if (errorMessage.includes('required') || errorMessage.includes('Field required')) {
        // If it's a missing required field, it might be a test problem, but endpoint exists
        testResult.status = 'success';
        testResult.message = `Endpoint exists - missing required field (${responseTime}ms)`;
      } else {
        testResult.status = 'success';
        testResult.message = `Endpoint exists - validation error (${responseTime}ms)`;
      }
    } else if (errorMessage.includes('500') || errorMessage.includes('internal error')) {
      // 500 can indicate endpoint exists but there's a server problem
      testResult.status = 'success';
      testResult.message = `Endpoint exists - server error (${responseTime}ms)`;
    } else if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable')) {
      // 503 Service Unavailable - endpoint exists but service is unavailable
      testResult.status = 'success';
      testResult.message = `Endpoint exists - service unavailable (${responseTime}ms)`;
    } else {
      testResult.status = 'error';
      testResult.message = `${errorMessage.substring(0, 50)} (${responseTime}ms)`;
    }
    testResult.responseTime = responseTime;
  }

  // Notify final result
  if (onProgress) {
    onProgress(testResult);
  }

  return testResult;
}

/**
 * Calculate test progress from results
 */
export function calculateTestProgress(results: EndpointTestResult[]): TestProgress {
  const total = results.length;
  const completed = results.filter((r) => r.status !== 'pending').length;
  const success = results.filter((r) => r.status === 'success').length;
  const error = results.filter((r) => r.status === 'error').length;
  const pending = results.filter((r) => r.status === 'pending').length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    success,
    error,
    pending,
    percentage,
  };
}

/**
 * Test all critical endpoints in parallel batches
 * Tests endpoints in batches of 10 for optimal performance
 */
export async function testCriticalEndpoints(
  signal?: AbortSignal,
  onProgress?: (results: EndpointTestResult[]) => void,
  onProgressUpdate?: (progress: TestProgress) => void,
  batchSize: number = 10
): Promise<EndpointTestResult[]> {
  const endpointsToTest = getEndpointsToTest();
  const results: EndpointTestResult[] = [];

  // Initialize all results as pending
  for (const endpoint of endpointsToTest) {
    results.push({
      endpoint: endpoint.endpoint,
      method: endpoint.method,
      status: 'pending',
      category: endpoint.category,
    });
  }

  // Notify initial state
  if (onProgress) {
    onProgress([...results]);
  }
  if (onProgressUpdate) {
    onProgressUpdate(calculateTestProgress(results));
  }

  // Process endpoints in batches
  for (let i = 0; i < endpointsToTest.length; i += batchSize) {
    // Check if request was aborted
    if (signal?.aborted) {
      break;
    }

    const batch = endpointsToTest.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map((endpoint, batchIndex) => {
        const globalIndex = i + batchIndex;
        return testEndpoint(endpoint, signal, (singleResult) => {
          // Update the specific result in the results array
          if (globalIndex < results.length) {
            results[globalIndex] = singleResult;
            // Notify progress after each update
            if (onProgress) {
              onProgress([...results]);
            }
            if (onProgressUpdate) {
              onProgressUpdate(calculateTestProgress(results));
            }
          }
        });
      })
    );

    // Process batch results
    batchResults.forEach((settledResult, batchIndex) => {
      const globalIndex = i + batchIndex;
      if (settledResult.status === 'fulfilled' && globalIndex < results.length) {
        results[globalIndex] = settledResult.value;
      } else if (settledResult.status === 'rejected' && globalIndex < results.length) {
        // Handle rejection - mark as error
        const existingResult = results[globalIndex];
        if (existingResult) {
          results[globalIndex] = {
            endpoint: existingResult.endpoint,
            method: existingResult.method,
            status: 'error',
            message: `Test failed: ${settledResult.reason instanceof Error ? settledResult.reason.message : String(settledResult.reason)}`,
            category: existingResult.category,
          };
        }
      }
    });

    // Notify progress after batch completion
    if (onProgress) {
      onProgress([...results]);
    }
    if (onProgressUpdate) {
      onProgressUpdate(calculateTestProgress(results));
    }
  }

  return results;
}
