/**
 * Survey Results Component
 *
 * Displays survey results with charts, statistics, and analytics.
 *
 * @component
 * @example
 * ```tsx
 * <SurveyResults
 *   surveyId="survey-123"
 *   submissions={submissions}
 *   onExport={async (format) => {
 *     await surveysAPI.exportResults(surveyId, format);
 *   }}
 * />
 * ```
 *
 * @features
 * - Response statistics (count, completion rate)
 * - Charts for each question (bar, pie, line)
 * - Response distribution
 * - Average scores
 * - Export to CSV/Excel
 * - Filter by date range
 * - Compare responses over time
 *
 * @see {@link https://github.com/your-repo/docs/components/survey-results} Component Documentation
 */
'use client';
import { useState, useMemo } from 'react';
import { Card, Button, Select, Alert, useToast } from '@/components/ui';
// Note: recharts needs to be installed: pnpm add recharts
// For now, using simple div-based charts
// import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/layout';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';
import type { Survey, SurveyQuestion } from './SurveyBuilder';

export interface SurveySubmission {
  id: number;
  survey_id: string;
  data: Record<string, unknown>;
  user_id?: number;
  submitted_at: string;
  ip_address?: string;
}

export interface SurveyResultsProps {
  survey: Survey;
  submissions: SurveySubmission[];
  onExport?: (format: 'csv' | 'excel' | 'json') => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

// Use theme CSS variables for chart colors
// These colors will adapt to the active theme
const COLORS = [
  'var(--color-primary-500)', // Primary blue
  'var(--color-success-500)', // Success green
  'var(--color-warning-500)', // Warning yellow/amber
  'var(--color-danger-500)', // Danger red
  'var(--color-info-500)', // Info cyan
  'var(--color-secondary-500)', // Secondary indigo
  'var(--color-warning-400)', // Lighter warning
  'var(--color-danger-400)', // Lighter danger
];

export default function SurveyResults({
  survey,
  submissions,
  onExport,
  error,
}: SurveyResultsProps) {
  const t = useTranslations('SurveyResults');
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [exporting, setExporting] = useState(false);

  // Filter submissions by date range
  const filteredSubmissions = useMemo(() => {
    if (dateRange === 'all') return submissions;
    const now = new Date();
    const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return submissions.filter((sub) => {
      const submittedDate = new Date(sub.submitted_at);
      return submittedDate >= cutoffDate;
    });
  }, [submissions, dateRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = submissions.length;
    const filtered = filteredSubmissions.length;
    const completionRate = total > 0 ? (filtered / total) * 100 : 0;
    // Note: Average time calculation would require start time tracking
    const averageTime = 0;
    return {
      totalResponses: total,
      filteredResponses: filtered,
      completionRate: Math.round(completionRate * 10) / 10,
      averageTime: Math.round(averageTime * 10) / 10,
    };
  }, [submissions, filteredSubmissions]);

  // Generate chart data for each question
  const getQuestionChartData = (question: SurveyQuestion) => {
    if (!question) return null;

    const responses = filteredSubmissions.map((sub) => sub.data[question.name]);

    if (question.type === 'scale' || question.type === 'rating' || question.type === 'number') {
      // Numeric data - show distribution
      const min = question.scaleMin || 1;
      const max = question.scaleMax || 5;
      const distribution: Record<number, number> = {};
      for (let i = min; i <= max; i++) {
        distribution[i] = 0;
      }
      responses.forEach((value) => {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= min && numValue <= max) {
          distribution[Math.round(numValue)] = (distribution[Math.round(numValue)] || 0) + 1;
        }
      });
      return {
        type: 'bar',
        data: Object.entries(distribution).map(([key, value]) => ({
          name: key,
          value: value,
          percentage: filteredSubmissions.length > 0 ? (value / filteredSubmissions.length) * 100 : 0,
        })),
        average:
          responses.reduce((acc: number, val: unknown) => acc + (Number(val) || 0), 0) /
          (responses.length || 1),
      };
    } else if (question.type === 'nps') {
      // NPS specific: 0-10 scale with NPS score calculation
      const distribution: Record<number, number> = {};
      for (let i = 0; i <= 10; i++) {
        distribution[i] = 0;
      }
      responses.forEach((value) => {
        const numValue = Number(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
          distribution[Math.round(numValue)] = (distribution[Math.round(numValue)] || 0) + 1;
        }
      });
      // Calculate NPS score: % Promoters (9-10) - % Detractors (0-6)
      const total = filteredSubmissions.length;
      const promoters = Object.entries(distribution)
        .filter(([key]) => Number(key) >= 9)
        .reduce((sum, [, value]) => sum + value, 0);
      const detractors = Object.entries(distribution)
        .filter(([key]) => Number(key) <= 6)
        .reduce((sum, [, value]) => sum + value, 0);
      const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
      return {
        type: 'bar',
        data: Object.entries(distribution).map(([key, value]) => ({
          name: key,
          value: value,
          percentage: total > 0 ? (value / total) * 100 : 0,
          category: Number(key) <= 6 ? 'detractor' : Number(key) >= 9 ? 'promoter' : 'passive',
        })),
        average:
          responses.reduce((acc: number, val: unknown) => acc + (Number(val) || 0), 0) /
          (responses.length || 1),
        npsScore,
        promoters,
        detractors,
        passives: total - promoters - detractors,
      };
    } else if (question.type === 'select' || question.type === 'radio' || question.type === 'yesno') {
      // Categorical data - show pie/bar chart
      const distribution: Record<string, number> = {};
      responses.forEach((value) => {
        const strValue = String(value || '');
        distribution[strValue] = (distribution[strValue] || 0) + 1;
      });
      return {
        type: 'pie',
        data: Object.entries(distribution)
          .map(([name, value]) => ({
            name,
            value,
            percentage: filteredSubmissions.length > 0 ? (value / filteredSubmissions.length) * 100 : 0,
          }))
          .sort((a, b) => b.value - a.value),
      };
    } else if (question.type === 'checkbox') {
      // Multiple selections
      const distribution: Record<string, number> = {};
      responses.forEach((value) => {
        const options = Array.isArray(value) ? value : [value];
        options.forEach((opt) => {
          const strOpt = String(opt || '');
          distribution[strOpt] = (distribution[strOpt] || 0) + 1;
        });
      });
      return {
        type: 'bar',
        data: Object.entries(distribution)
          .map(([name, value]) => ({
            name,
            value,
            percentage: filteredSubmissions.length > 0 ? (value / filteredSubmissions.length) * 100 : 0,
          }))
          .sort((a, b) => b.value - a.value),
      };
    } else if (question.type === 'matrix') {
      // Matrix questions - show distribution per row/column combination
      const matrixData: Record<string, Record<string, number>> = {};
      const rows = question.matrixRows || [];
      const columns = question.matrixColumns || [];

      // Initialize matrix
      rows.forEach((row) => {
        if (row) {
          matrixData[row] = {};
          columns.forEach((col) => {
            if (col && matrixData[row]) {
              matrixData[row][col] = 0;
            }
          });
        }
      });

      // Count responses
      responses.forEach((value) => {
        if (typeof value === 'object' && value !== null) {
          Object.entries(value as Record<string, string>).forEach(([row, col]) => {
            if (matrixData[row] && matrixData[row][col] !== undefined) {
              matrixData[row][col] = (matrixData[row][col] || 0) + 1;
            }
          });
        }
      });

      // Convert to chart data format
      const chartData = rows.flatMap((row) =>
        columns.map((col) => {
          const rowKey = row || '';
          const colKey = col || '';
          const value = matrixData[rowKey]?.[colKey] || 0;
          return {
            name: `${rowKey} - ${colKey}`,
            value,
            percentage: filteredSubmissions.length > 0 ? (value / filteredSubmissions.length) * 100 : 0,
            row: rowKey,
            col: colKey,
          };
        })
      );

      return {
        type: 'matrix',
        data: chartData,
        rows,
        columns,
      };
    } else if (question.type === 'ranking') {
      // Ranking questions - show average position for each option
      const rankingData: Record<string, { total: number; sum: number; count: number }> = {};
      const options = question.options || [];

      // Initialize
      options.forEach((opt) => {
        rankingData[opt.value] = { total: 0, sum: 0, count: 0 };
      });

      // Calculate average positions
      responses.forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((optionValue, index) => {
            const rank = index + 1;
            if (rankingData[optionValue]) {
              rankingData[optionValue].sum += rank;
              rankingData[optionValue].count += 1;
            }
          });
        }
      });

      // Calculate averages
      const chartData = options
        .map((opt) => {
          const data = rankingData[opt.value];
          if (!data) {
            return {
              name: opt.label,
              value: 0,
              count: 0,
              percentage: 0,
            };
          }
          const avgRank = data.count > 0 ? data.sum / data.count : 0;
          return {
            name: opt.label,
            value: avgRank,
            count: data.count,
            percentage: filteredSubmissions.length > 0 ? (data.count / filteredSubmissions.length) * 100 : 0,
          };
        })
        .sort((a, b) => a.value - b.value); // Sort by average rank (lower is better)

      return {
        type: 'bar',
        data: chartData,
        isRanking: true,
      };
    }
    return null;
  };

  const handleExport = async (format: 'csv' | 'excel' | 'json') => {
    setExporting(true);
    try {
      await onExport?.(format);
      showToast({
        message: t('export_success') || `Results exported as ${format.toUpperCase()}`,
        type: 'success',
      });
    } catch (error) {
      logger.error('Failed to export results', error instanceof Error ? error : new Error(String(error)));
      showToast({
        message: t('export_failed') || 'Failed to export results',
        type: 'error',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageContainer className="py-8">
      <PageHeader
        title={t('survey_results') || 'Survey Results'}
        description={survey.name}
        breadcrumbs={[
          { label: t('home') || 'Home', href: '/' },
          { label: t('surveys') || 'Surveys', href: '/surveys' },
          { label: survey.name, href: `/surveys/${survey.id}` },
          { label: t('results') || 'Results' },
        ]}
        actions={
          <div className="flex gap-2">
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
              options={[
                { label: t('all_time') || 'All Time', value: 'all' },
                { label: t('last_7_days') || 'Last 7 Days', value: '7d' },
                { label: t('last_30_days') || 'Last 30 Days', value: '30d' },
                { label: t('last_90_days') || 'Last 90 Days', value: '90d' },
              ]}
              className="w-40"
            />
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={exporting || filteredSubmissions.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />{' '}
              {exporting ? t('exporting') || 'Exporting...' : 'CSV'}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={exporting || filteredSubmissions.length === 0}
            >
              <Download className="h-4 w-4 mr-2" /> Excel
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="error" title={t('error') || 'Error'} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('total_responses') || 'Total Responses'}</p>
              <p className="text-2xl font-bold">{stats.totalResponses}</p>
            </div>
            <Users className="h-8 w-8 text-primary-500 dark:text-primary-400" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('filtered_responses') || 'Filtered Responses'}
              </p>
              <p className="text-2xl font-bold">{stats.filteredResponses}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-success-500 dark:text-success-400" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('completion_rate') || 'Completion Rate'}</p>
              <p className="text-2xl font-bold">{stats.completionRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary-500 dark:text-primary-400" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('questions') || 'Questions'}</p>
              <p className="text-2xl font-bold">{survey.questions.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-500 dark:text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Question Results */}
      <div className="space-y-6 mt-8">
        {survey.questions.map((question) => {
          const chartData = getQuestionChartData(question);
          if (!chartData || !chartData.data || chartData.data.length === 0) return null;

          return (
            <Card key={question.id} title={question.label}>
              {question.description && (
                <p className="text-sm text-muted-foreground mb-4">{question.description}</p>
              )}

              {chartData.type === 'bar' && !chartData.isRanking && (
                <div className="mt-4">
                  {chartData.average !== undefined && (
                    <div className="mb-4">
                      <p className="text-lg font-semibold">
                        {t('average') || 'Average'}: {Math.round(chartData.average * 10) / 10}
                      </p>
                    </div>
                  )}

                  {'npsScore' in chartData && chartData.npsScore !== undefined && (
                    <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        NPS Score: {chartData.npsScore}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-success-600 dark:text-success-400">
                          {t('promoters') || 'Promoters'} (9-10): {chartData.promoters} (
                          {Math.round((chartData.promoters / filteredSubmissions.length) * 100)}%)
                        </span>
                        <span className="text-warning-600 dark:text-warning-400">
                          {t('passives') || 'Passives'} (7-8): {chartData.passives} (
                          {Math.round((chartData.passives / filteredSubmissions.length) * 100)}%)
                        </span>
                        <span className="text-danger-600 dark:text-danger-400">
                          {t('detractors') || 'Detractors'} (0-6): {chartData.detractors} (
                          {Math.round((chartData.detractors / filteredSubmissions.length) * 100)}%)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Simple bar chart using divs - recharts can be added later */}
                  <div className="space-y-2">
                    {chartData.data.map(
                      (
                        item: { name: string; value: number; percentage: number; category?: string },
                        index: number
                      ) => {
                        // Use theme colors based on category
                        const color =
                          item.category === 'promoter'
                            ? 'bg-success-500' // Success green for promoters
                            : item.category === 'detractor'
                              ? 'bg-danger-500' // Danger red for detractors
                              : item.category === 'passive'
                                ? 'bg-warning-500' // Warning yellow for passive
                                : 'bg-primary-500'; // Primary blue for others

                        return (
                          <div key={index} className="flex items-center gap-4">
                            <span className="w-20 text-sm">{item.name}</span>
                            <div className="flex-1 bg-muted rounded-full h-6 relative">
                              <div
                                className={`${color} h-6 rounded-full flex items-center justify-end pr-2`}
                                style={{
                                  width: `${
                                    (item.value /
                                      Math.max(...chartData.data.map((d: { value: number }) => d.value))) *
                                    100
                                  }%`,
                                }}
                              >
                                <span className="text-background text-xs">{item.value}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {chartData.type === 'pie' && (
                <div className="mt-4">
                  {/* Simple pie chart visualization using divs */}
                  <div className="grid grid-cols-2 gap-4">
                    {chartData.data.map(
                      (item: { name: string; value: number; percentage: number }, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm">
                            {item.name}: {item.value} ({Math.round(item.percentage)}%)
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {chartData.type === 'matrix' && (
                <div className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border border-border p-2 text-left"></th>
                          {chartData.columns?.map((col: string) => (
                            <th key={col} className="border border-border p-2 text-center text-sm">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.rows?.map((row: string) => (
                          <tr key={row}>
                            <td className="border border-border p-2 text-sm font-medium">{row}</td>
                            {chartData.columns?.map((col: string) => {
                              interface ChartDataPoint {
                                row: string;
                                col: string;
                                value: number | string;
                                [key: string]: unknown;
                              }
                              const cellData = (chartData.data as ChartDataPoint[]).find(
                                (d) => d.row === row && d.col === col
                              );
                              return (
                                <td key={col} className="border border-border p-2 text-center">
                                  <div className="text-sm font-medium">{cellData?.value || 0}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {cellData && typeof cellData.percentage === 'number'
                                      ? Math.round(cellData.percentage)
                                      : 0}
                                    %
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {chartData.type === 'bar' && chartData.isRanking && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('average_rank') || 'Average Rank (lower is better)'}
                  </p>
                  <div className="space-y-2">
                    {chartData.data.map(
                      (
                        item: { name: string; value: number; count: number; percentage: number },
                        index: number
                      ) => (
                        <div key={index} className="flex items-center gap-4">
                          <span className="w-32 text-sm">{item.name}</span>
                          <div className="flex-1 bg-muted rounded-full h-6 relative">
                            <div
                              className="bg-success-500 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{
                                width: `${Math.min(
                                  (item.value /
                                    Math.max(...chartData.data.map((d: { value: number }) => d.value))) *
                                    100,
                                  100
                                )}%`,
                              }}
                            >
                              <span className="text-background text-xs">{item.value.toFixed(1)}</span>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground w-16 text-right">
                            {item.count} {t('responses') || 'responses'}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Response List */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">
                  {t('response_distribution') || 'Response Distribution'}
                </h4>
                <div className="space-y-2">
                  {chartData.data.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{item.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{item.value}</span>
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {Math.round(item.percentage)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {survey.questions.length === 0 && (
        <Card className="mt-8">
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('no_questions') || 'No questions in this survey'}</p>
          </div>
        </Card>
      )}

      {filteredSubmissions.length === 0 && survey.questions.length > 0 && (
        <Card className="mt-8">
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('no_responses') || 'No responses yet'}</p>
          </div>
        </Card>
      )}
    </PageContainer>
  );
}
