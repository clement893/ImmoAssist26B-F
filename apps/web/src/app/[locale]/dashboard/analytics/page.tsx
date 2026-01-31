/**
 * Dashboard Analytics Page
 *
 * Analytics dashboard showing business metrics, charts, and performance data.
 * Uses existing AnalyticsDashboard component.
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
import { AnalyticsDashboard } from '@/components/analytics';
import type { AnalyticsMetric } from '@/components/analytics';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { analyticsAPI } from '@/lib/api/analytics';

export default function DashboardAnalyticsPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.analytics');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
    end: new Date().toISOString().split('T')[0] || '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadAnalytics();
  }, [isAuthenticated, router, dateRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const metrics = await analyticsAPI.getMetrics({
        start_date: dateRange.start,
        end_date: dateRange.end,
      });

      setMetrics(metrics);
    } catch (error: unknown) {
      logger.error(
        'Failed to load analytics',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load analytics. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (range: { start: string; end: string }) => {
    setDateRange(range);
  };

  const handleExport = async () => {
    try {
      if (metrics.length === 0) {
        logger.warn('No analytics data to export', { dateRange });
        return;
      }

      // Convert metrics to CSV
      const headers = ['label', 'value', 'change', 'changeType'];
      const csvHeaders = headers.join(',');
      const csvRows = metrics.map((metric) =>
        [
          metric.label,
          metric.value.toString(),
          metric.change?.toString() || '',
          metric.changeType || '',
        ].join(',')
      );

      const csv = [csvHeaders, ...csvRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-${dateRange.start}-to-${dateRange.end}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info('Analytics exported successfully', { dateRange, count: metrics.length });
    } catch (error) {
      logger.error(
        'Failed to export analytics',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };

  if (isLoading) {
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
          title={t('title') || 'Analytics'}
          description={t('description') || 'Track your business metrics and performance'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.analytics') || 'Analytics' },
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
          <Section title={t('section.title') || 'Analytics Dashboard'} className="mt-6">
            <AnalyticsDashboard
              metrics={metrics.length > 0 ? metrics : undefined}
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              onExport={handleExport}
            />
          </Section>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
