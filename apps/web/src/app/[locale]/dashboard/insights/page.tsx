/**
 * Dashboard Insights Page
 *
 * Business insights and analytics visualization page.
 * Shows key business metrics, trends, and insights.
 * Uses existing Chart and AnalyticsDashboard components.
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
import { Chart } from '@/components/ui';
import type { ChartDataPoint } from '@/components/ui';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Loading, Alert, Card } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { insightsAPI } from '@/lib/api/insights';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';

export default function DashboardInsightsPage() {
  const router = useRouter();
  const t = useTranslations('dashboard.insights');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [trendData, setTrendData] = useState<ChartDataPoint[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadInsights();
  }, [isAuthenticated, router]);

  const loadInsights = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const insights = await insightsAPI.get();

      // Add icons to metrics based on label
      const metricsWithIcons: AnalyticsMetric[] = insights.metrics.map((metric) => {
        let icon;
        if (
          metric.label.toLowerCase().includes('revenue') ||
          metric.label.toLowerCase().includes('growth')
        ) {
          icon = <TrendingUp className="w-5 h-5" />;
        } else if (metric.label.toLowerCase().includes('user')) {
          icon = <Users className="w-5 h-5" />;
        } else if (
          metric.label.toLowerCase().includes('revenue') ||
          metric.label.toLowerCase().includes('revenue')
        ) {
          icon = <DollarSign className="w-5 h-5" />;
        } else {
          icon = <Target className="w-5 h-5" />;
        }

        return {
          ...metric,
          icon,
        };
      });

      setMetrics(metricsWithIcons);
      setTrendData(insights.trends);
      setUserGrowthData(insights.userGrowth);
    } catch (error: unknown) {
      logger.error(
        'Failed to load insights',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load insights. Please try again.'
      );
    } finally {
      setIsLoading(false);
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
          title={t('title') || 'Business Insights'}
          description={t('description') || 'Key business metrics and trends'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.insights') || 'Insights' },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* Key Metrics */}
          <Section title={t('sections.metrics') || 'Key Metrics'} className="mt-6">
            <AnalyticsDashboard metrics={metrics} />
          </Section>

          {/* Revenue Trends */}
          {trendData.length > 0 && (
            <Section title={t('sections.revenue') || 'Revenue Trends'} className="mt-6">
              <Card className="bg-background">
                <Chart
                  type="line"
                  data={trendData}
                  title={t('charts.revenue') || 'Monthly Revenue'}
                  height={300}
                />
              </Card>
            </Section>
          )}

          {/* User Growth */}
          {userGrowthData.length > 0 && (
            <Section title={t('sections.users') || 'User Growth'} className="mt-6">
              <Card className="bg-background">
                <Chart
                  type="bar"
                  data={userGrowthData}
                  title={t('charts.users') || 'Active Users Over Time'}
                  height={300}
                />
              </Card>
            </Section>
          )}
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
