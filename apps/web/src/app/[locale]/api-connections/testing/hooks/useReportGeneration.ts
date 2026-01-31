/**
 * useReportGeneration Hook
 * Hook for generating health dashboard reports
 */

import { useState } from 'react';
import { generateCompleteReport, generateReportPath } from '../services/reportGenerator';
import type {
  CheckResult,
  ConnectionStatus,
  EndpointTestResult,
  ComponentTestResult,
} from '../types/health.types';

export function useReportGeneration() {
  const [report, setReport] = useState<CheckResult | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateCompleteReport = async (
    status: ConnectionStatus | null,
    frontendCheck: CheckResult | null,
    backendCheck: CheckResult | null,
    endpointTests: EndpointTestResult[],
    componentTests: ComponentTestResult[]
  ) => {
    setIsGeneratingReport(true);
    setError('');
    setReport(null);

    try {
      const reportContent = generateCompleteReport({
        status,
        frontendCheck,
        backendCheck,
        endpointTests,
        componentTests,
      });

      const reportPath = generateReportPath();

      setReport({
        success: true,
        reportContent,
        reportPath,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMessage);
      setReport({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const downloadReport = () => {
    if (report?.reportContent) {
      const blob = new Blob([report.reportContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.reportPath || 'API_CONNECTION_REPORT.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const openReportInNewTab = () => {
    if (report?.reportContent) {
      // Create HTML from markdown
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Connection Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #fff;
      color: #333;
    }
    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      border: 1px solid #ddd;
    }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    pre code {
      background: none;
      padding: 0;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 10px; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 8px; }
    h3 { font-size: 1.25em; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    ul, ol {
      padding-left: 30px;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 16px;
      margin: 16px 0;
      color: #666;
    }
    .markdown-body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
    }
    @media (max-width: 767px) {
      .markdown-body {
        padding: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="markdown-body">
    <pre>${report.reportContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  const openReportAsMarkdown = () => {
    if (report?.reportContent) {
      const blob = new Blob([report.reportContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  return {
    report,
    isGeneratingReport,
    error,
    setError,
    handleGenerateCompleteReport,
    downloadReport,
    openReportInNewTab,
    openReportAsMarkdown,
  };
}
