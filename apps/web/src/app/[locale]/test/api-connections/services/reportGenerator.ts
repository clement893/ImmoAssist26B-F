/**
 * Report Generator Service
 * Service for generating health dashboard reports
 */

import type {
  ConnectionStatus,
  CheckResult,
  EndpointTestResult,
  ComponentTestResult,
} from '../types/health.types';

export interface ReportData {
  status?: ConnectionStatus | null;
  frontendCheck?: CheckResult | null;
  backendCheck?: CheckResult | null;
  endpointTests?: EndpointTestResult[];
  componentTests?: ComponentTestResult[];
}

/**
 * Generate a complete markdown report
 */
export function generateCompleteReport(data: ReportData): string {
  const reportData: string[] = [];
  reportData.push('# API Connection Test Report\n');
  reportData.push(`Generated: ${new Date().toISOString()}\n`);
  reportData.push('---\n\n');

  if (data.status) {
    reportData.push('## Quick Status\n\n');
    if (data.status.frontend) {
      reportData.push('### Frontend Connections\n');
      if (data.status.frontend.total !== undefined) {
        reportData.push(`- Total: ${data.status.frontend.total}\n`);
        reportData.push(`- Connected: ${data.status.frontend.connected}\n`);
        reportData.push(`- Partial: ${data.status.frontend.partial}\n`);
        reportData.push(`- Needs Integration: ${data.status.frontend.needsIntegration}\n`);
        reportData.push(`- Static: ${data.status.frontend.static}\n`);
      } else {
        reportData.push(`- Status: ${data.status.frontend.message || 'No data available'}\n`);
      }
      reportData.push('\n');
    }
    if (data.status.backend) {
      reportData.push('### Backend Endpoints\n');
      reportData.push(`- Registered: ${data.status.backend.registered}\n`);
      reportData.push(`- Unregistered: ${data.status.backend.unregistered}\n`);
      if (data.status.backend.totalEndpoints !== undefined) {
        reportData.push(`- Total Endpoints: ${data.status.backend.totalEndpoints}\n`);
      }
      reportData.push('\n');
    }
  }

  if (data.frontendCheck) {
    reportData.push('## Frontend API Connections Check\n\n');
    if (data.frontendCheck.summary) {
      reportData.push('### Summary\n');
      Object.entries(data.frontendCheck.summary).forEach(([key, value]) => {
        reportData.push(`- ${key}: ${String(value)}\n`);
      });
      reportData.push('\n');
    }
    if (data.frontendCheck.output) {
      reportData.push('### Detailed Output\n\n```\n');
      reportData.push(data.frontendCheck.output);
      reportData.push('\n```\n\n');
    }
  }

  if (data.backendCheck) {
    reportData.push('## Backend Endpoints Check\n\n');
    if (data.backendCheck.summary) {
      reportData.push('### Summary\n');
      Object.entries(data.backendCheck.summary).forEach(([key, value]) => {
        reportData.push(`- ${key}: ${value}\n`);
      });
      reportData.push('\n');
    }
    if (data.backendCheck.output) {
      reportData.push('### Detailed Output\n\n```\n');
      reportData.push(data.backendCheck.output);
      reportData.push('\n```\n\n');
    }
  }

  if (data.endpointTests && data.endpointTests.length > 0) {
    reportData.push('## Critical Endpoints Test Results\n\n');
    reportData.push(`Total Tests: ${data.endpointTests.length}\n`);
    reportData.push(
      `Success: ${data.endpointTests.filter((t) => t.status === 'success').length}\n`
    );
    reportData.push(`Errors: ${data.endpointTests.filter((t) => t.status === 'error').length}\n`);
    reportData.push(
      `Pending: ${data.endpointTests.filter((t) => t.status === 'pending').length}\n\n`
    );

    const categories = Array.from(
      new Set(data.endpointTests.map((t) => t.category).filter(Boolean))
    );
    categories.forEach((category) => {
      reportData.push(`### ${category}\n\n`);
      const categoryTests = data.endpointTests!.filter((t) => t.category === category);
      reportData.push('| Method | Endpoint | Status | Message | Response Time |\n');
      reportData.push('|--------|----------|--------|---------|---------------|\n');
      categoryTests.forEach((test) => {
        reportData.push(
          `| ${test.method} | ${test.endpoint} | ${test.status} | ${test.message || '-'} | ${test.responseTime ? test.responseTime + 'ms' : '-'} |\n`
        );
      });
      reportData.push('\n');
    });

    const uncategorizedTests = data.endpointTests.filter((t) => !t.category);
    if (uncategorizedTests.length > 0) {
      reportData.push('### Other\n\n');
      reportData.push('| Method | Endpoint | Status | Message | Response Time |\n');
      reportData.push('|--------|----------|--------|---------|---------------|\n');
      uncategorizedTests.forEach((test) => {
        reportData.push(
          `| ${test.method} | ${test.endpoint} | ${test.status} | ${test.message || '-'} | ${test.responseTime ? test.responseTime + 'ms' : '-'} |\n`
        );
      });
      reportData.push('\n');
    }
  }

  if (data.componentTests && data.componentTests.length > 0) {
    reportData.push('## Frontend Components & Hooks Test Results\n\n');
    reportData.push('| Test Name | Status | Message |\n');
    reportData.push('|-----------|--------|---------|\n');
    data.componentTests.forEach((test) => {
      reportData.push(`| ${test.name} | ${test.status} | ${test.message || '-'} |\n`);
    });
    reportData.push('\n');
  }

  reportData.push('---\n\n');
  reportData.push('*Report generated by API Connection Test Page*\n');

  return reportData.join('');
}

/**
 * Generate report file path
 */
export function generateReportPath(): string {
  return `API_CONNECTION_REPORT_${Date.now()}.md`;
}
