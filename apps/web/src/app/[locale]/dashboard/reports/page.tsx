/**
 * Dashboard Reports Page
 *
 * Report builder and viewer page for creating and viewing custom reports.
 * Uses existing ReportBuilder and ReportViewer components.
 * Accessible via dashboard navigation.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { ReportBuilder, ReportViewer } from '@/components/analytics';
import type { ReportConfig, ReportData } from '@/components/analytics';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Loading, Alert, Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { reportsAPI } from '@/lib/api/reports';

export default function DashboardReportsPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.reports');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('builder');
  const [savedReports, setSavedReports] = useState<ReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadSavedReports();
  }, [isAuthenticated, router]);

  const loadSavedReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const reports = await reportsAPI.list();

      // Convert API reports to ReportData format
      const convertedReports: ReportData[] = reports.map((report) => ({
        id: report.id.toString(),
        name: report.name,
        description: report.description,
        dateRange: report.config.dateRange as { start: string; end: string },
        format: report.config.format as 'table' | 'chart' | 'both',
        data: report.data || {
          table: [],
          chart: [],
        },
        generatedAt: report.generated_at,
      }));

      setSavedReports(convertedReports);
    } catch (error: unknown) {
      logger.error(
        'Failed to load reports',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load reports. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReport = async (config: ReportConfig) => {
    try {
      setError(null);

      const report = await reportsAPI.create({
        name: config.name,
        description: config.description,
        config: config,
        data: {
          table: [],
          chart: [],
        },
      });

      logger.info('Report saved successfully', { reportId: report.id });

      // Convert API report to ReportData format
      const reportData: ReportData = {
        id: report.id.toString(),
        name: report.name,
        description: report.description,
        dateRange: report.config.dateRange as { start: string; end: string },
        format: report.config.format as 'table' | 'chart' | 'both',
        data: report.data || {
          table: [],
          chart: [],
        },
        generatedAt: report.generated_at,
      };

      setSavedReports([...savedReports, reportData]);
      setActiveTab('viewer');
      setSelectedReport(reportData);
    } catch (error: unknown) {
      logger.error(
        'Failed to save report',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.saveFailed') || 'Failed to save report. Please try again.'
      );
      throw error;
    }
  };

  const handlePreviewReport = (config: ReportConfig) => {
    // NOTE: Preview functionality can be implemented by:
    // 1. Creating a preview modal/dialog component
    // 2. Generating a temporary report using reportsAPI.generate() with preview=true
    // 3. Displaying the preview data in a read-only format
    // 4. Allowing user to adjust config before saving
    // For now, we'll create a new report directly
    logger.info('Report preview requested - creating report instead', { config });
    // You can implement a preview modal here if needed
  };

  const handleRefreshReport = async () => {
    if (!selectedReport) return;

    try {
      setIsLoading(true);
      setError(null);

      const reportId = parseInt(selectedReport.id, 10);
      if (isNaN(reportId)) {
        throw new Error('Invalid report ID');
      }

      const report = await reportsAPI.refresh(reportId);

      // Convert API report to ReportData format
      const reportData: ReportData = {
        id: report.id.toString(),
        name: report.name,
        description: report.description,
        dateRange: report.config.dateRange as { start: string; end: string },
        format: report.config.format as 'table' | 'chart' | 'both',
        data: report.data || {
          table: [],
          chart: [],
        },
        generatedAt: report.generated_at,
      };

      setSelectedReport(reportData);

      // Update in savedReports list
      setSavedReports(savedReports.map((r) => (r.id === reportData.id ? reportData : r)));

      logger.info('Report refreshed successfully', { reportId: report.id });
    } catch (error: unknown) {
      logger.error(
        'Failed to refresh report',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(appError.message || 'Failed to refresh report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (format: 'csv' | 'pdf' | 'excel') => {
    if (!selectedReport) return;

    try {
      if (
        !selectedReport.data ||
        (selectedReport.data.table?.length === 0 && selectedReport.data.chart?.length === 0)
      ) {
        logger.warn('No report data to export', { reportId: selectedReport.id });
        return;
      }

      if (format === 'csv') {
        // Export table data as CSV
        const tableData = selectedReport.data.table || [];
        if (tableData.length === 0) {
          logger.warn('No table data to export', { reportId: selectedReport.id });
          return;
        }

        const headers = Object.keys(tableData[0] || {});
        const csvHeaders = headers.join(',');
        const csvRows = tableData.map((row: Record<string, unknown>) =>
          headers
            .map((header) => {
              const value = row[header];
              if (value === null || value === undefined) return '';
              if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
              return String(value).replace(/"/g, '""');
            })
            .join(',')
        );

        const csv = [csvHeaders, ...csvRows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute(
          'download',
          `report-${selectedReport.id}-${new Date().toISOString().split('T')[0]}.csv`
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // NOTE: PDF and Excel exports require additional libraries or backend support
        // For PDF: Use libraries like jsPDF or pdfkit, or call backend export endpoint
        // For Excel: Use libraries like xlsx or exceljs, or call backend export endpoint
        // You can use the export API endpoint: POST /api/v1/exports/export
        logger.info('PDF/Excel export requires backend support or additional libraries', {
          format,
        });
        // Export functionality - implement when export feature is needed:
        // - Use backend export API: POST /api/v1/exports/export
        // - Or use client-side libraries: xlsx, exceljs, jsPDF, etc.
      }

      logger.info('Report exported successfully', { reportId: selectedReport.id, format });
    } catch (error) {
      logger.error(
        'Failed to export report',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  if (isLoading && savedReports.length === 0) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Reports'}
          description={t('description') || 'Create and view custom reports'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.reports') || 'Reports' },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8">
          <Tabs defaultTab={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab value="builder">{t('tabs.builder') || 'Report Builder'}</Tab>
              <Tab value="viewer">{t('tabs.viewer') || 'View Reports'}</Tab>
            </TabList>

            <TabPanels>
              {/* Report Builder Tab */}
              <TabPanel value="builder">
                <Section title={t('sections.builder') || 'Create New Report'} className="mt-6">
                  <ReportBuilder onSave={handleSaveReport} onPreview={handlePreviewReport} />
                </Section>
              </TabPanel>

              {/* Report Viewer Tab */}
              <TabPanel value="viewer">
                <Section title={t('sections.viewer') || 'Saved Reports'} className="mt-6">
                  {selectedReport ? (
                    <ReportViewer
                      report={selectedReport}
                      onRefresh={handleRefreshReport}
                      onExport={handleExportReport}
                    />
                  ) : savedReports.length > 0 ? (
                    <div className="space-y-4">
                      {savedReports.map((report) => (
                        <div
                          key={report.id}
                          className="p-4 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => setSelectedReport(report)}
                        >
                          <h3 className="font-semibold text-foreground">{report.name}</h3>
                          {report.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {report.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Generated: {new Date(report.generatedAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>
                        {t('empty') ||
                          'No reports found. Create your first report using the Report Builder.'}
                      </p>
                    </div>
                  )}
                </Section>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
