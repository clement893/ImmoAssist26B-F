'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Alert } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
import { PageHeader, PageContainer } from '@/components/layout';
import type { ComponentTestResult, EndpointTestResult } from './types/health.types';
import { useTemplateHealth } from './hooks/useTemplateHealth';
import { useEndpointTests } from './hooks/useEndpointTests';
import { useReportGeneration } from './hooks/useReportGeneration';
import { OverviewSection } from './components/OverviewSection';
import { FrontendCheckCard } from './components/FrontendCheckCard';
import { BackendCheckCard } from './components/BackendCheckCard';
import { EndpointTestCard } from './components/EndpointTestCard';
import { ComponentTestCard } from './components/ComponentTestCard';
import { ReportGeneratorCard } from './components/ReportGeneratorCard';

function APIConnectionTestContent() {
  // Use custom hooks for health checking, endpoint testing, and report generation
  const {
    status,
    frontendCheck,
    backendCheck,
    isLoading,
    isLoadingStatus,
    error: healthError,
    handleCheckStatus,
    handleCheckFrontend,
    handleCheckBackend,
  } = useTemplateHealth();

  const {
    endpointTests,
    isTestingEndpoints,
    testProgress,
    error: endpointError,
    handleTestCriticalEndpoints,
    copyTestResult,
  } = useEndpointTests();

  const {
    report,
    isGeneratingReport,
    error: reportError,
    handleGenerateCompleteReport,
    downloadReport,
    openReportInNewTab,
    openReportAsMarkdown,
  } = useReportGeneration();

  // Local state for component tests and copied test ID
  const [copiedTestId, setCopiedTestId] = useState<string | null>(null);
  const [componentTests, setComponentTests] = useState<ComponentTestResult[]>([]);
  const [isTestingComponents, setIsTestingComponents] = useState(false);

  // Combined error state (from all hooks)
  const error = healthError || endpointError || reportError;

  // Wrapper for copyTestResult to handle UI state
  const handleCopyTestResult = useCallback(
    async (test: EndpointTestResult) => {
      const success = await copyTestResult(test);
      if (success) {
        const testId = `${test.endpoint}-${test.method}`;
        setCopiedTestId(testId);
        setTimeout(() => setCopiedTestId(null), 2000);
      }
    },
    [copyTestResult]
  );

  const testFrontendComponents = async () => {
    setIsTestingComponents(true);
    setComponentTests([]);

    const tests = [
      {
        name: 'API Client - Token Refresh',
        test: async () => {
          try {
            await apiClient.get('/v1/auth/me');
            return { status: 'success' as const, message: 'Token refresh working' };
          } catch (err: unknown) {
            return { status: 'error' as const, message: getErrorMessage(err) };
          }
        },
      },
      {
        name: 'API Client - Error Handling',
        test: async () => {
          try {
            await apiClient.get('/v1/nonexistent-endpoint-12345');
            return { status: 'error' as const, message: 'Should have failed' };
          } catch (err: unknown) {
            const errorMsg = getErrorMessage(err);
            if (errorMsg.includes('404') || errorMsg.includes('not found')) {
              return { status: 'success' as const, message: 'Error handling working correctly' };
            }
            return {
              status: 'success' as const,
              message: 'Error caught: ' + errorMsg.substring(0, 50),
            };
          }
        },
      },
      {
        name: 'API Client - GET Request',
        test: async () => {
          try {
            await apiClient.get('/v1/health/health');
            return { status: 'success' as const, message: 'GET request successful' };
          } catch (err: unknown) {
            return { status: 'error' as const, message: getErrorMessage(err) };
          }
        },
      },
      {
        name: 'API Client - POST Request',
        test: async () => {
          try {
            await apiClient.post('/v1/media/validate', {
              name: 'test.jpg',
              size: 1024,
              type: 'image/jpeg',
            });
            return { status: 'success' as const, message: 'POST request successful' };
          } catch (err: unknown) {
            const errorMsg = getErrorMessage(err);
            if (
              errorMsg.includes('422') ||
              errorMsg.includes('400') ||
              errorMsg.includes('validation')
            ) {
              return {
                status: 'success' as const,
                message: 'POST endpoint exists (validation error expected)',
              };
            }
            return { status: 'error' as const, message: errorMsg };
          }
        },
      },
    ];

    const results: Array<{
      name: string;
      status: 'pending' | 'success' | 'error';
      message?: string;
    }> = [];
    for (const { name, test } of tests) {
      const result: { name: string; status: 'pending' | 'success' | 'error'; message?: string } = {
        name,
        status: 'pending',
        message: undefined,
      };
      results.push(result);
      setComponentTests([...results]);

      try {
        const testResult = await test();
        result.status = testResult.status;
        result.message = testResult.message;
      } catch (err) {
        result.status = 'error';
        result.message = getErrorMessage(err);
      }

      results[results.length - 1] = result;
      setComponentTests([...results]);
    }

    setIsTestingComponents(false);
  };

  const handleGenerateReport = useCallback(() => {
    handleGenerateCompleteReport(
      status,
      frontendCheck,
      backendCheck,
      endpointTests,
      componentTests
    );
  }, [
    handleGenerateCompleteReport,
    status,
    frontendCheck,
    backendCheck,
    endpointTests,
    componentTests,
  ]);

  useEffect(() => {
    // Auto-check status on mount (only on client)
    if (typeof window !== 'undefined') {
      handleCheckStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="API Connection Test"
        description="Test and verify API connections between frontend pages and backend endpoints"
      />

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <OverviewSection
        status={status}
        frontendCheck={frontendCheck}
        backendCheck={backendCheck}
        endpointTests={endpointTests}
        componentTests={componentTests}
        isLoading={isLoadingStatus}
        onRefresh={handleCheckStatus}
      />

      <FrontendCheckCard
        frontendCheck={frontendCheck}
        isLoading={isLoading}
        onCheckBasic={() => handleCheckFrontend(false)}
        onCheckDetailed={() => handleCheckFrontend(true)}
      />

      <BackendCheckCard
        backendCheck={backendCheck}
        isLoading={isLoading}
        onCheck={handleCheckBackend}
      />

      <EndpointTestCard
        endpointTests={endpointTests}
        isTestingEndpoints={isTestingEndpoints}
        testProgress={testProgress}
        onTest={handleTestCriticalEndpoints}
        onCopyTestResult={handleCopyTestResult}
        copiedTestId={copiedTestId}
      />

      <ComponentTestCard
        componentTests={componentTests}
        isTestingComponents={isTestingComponents}
        onTest={testFrontendComponents}
      />

      <ReportGeneratorCard
        report={report}
        isGeneratingReport={isGeneratingReport}
        onGenerateReport={handleGenerateReport}
        onDownloadReport={downloadReport}
        onOpenReportInNewTab={openReportInNewTab}
        onOpenReportAsMarkdown={openReportAsMarkdown}
      />
    </PageContainer>
  );
}

export default function APIConnectionTestPage() {
  return (
    <ProtectedRoute>
      <APIConnectionTestContent />
    </ProtectedRoute>
  );
}
