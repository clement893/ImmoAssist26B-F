/**
 * Analytics Dashboard Component
 * Business analytics and metrics dashboard
 */
'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chart } from '@/components/ui';
import type { ChartDataPoint } from '@/components/ui';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Eye,
  Download,
} from 'lucide-react';

export interface AnalyticsMetric {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ReactNode;
  format?: 'number' | 'currency' | 'percentage';
}

export interface AnalyticsDashboardProps {
  metrics?: AnalyticsMetric[];
  dateRange?: {
    start: string;
    end: string;
  };
  onDateRangeChange?: (range: { start: string; end: string }) => void;
  onExport?: () => void;
  className?: string;
}

export default function AnalyticsDashboard({
  metrics,
  dateRange: _dateRange,
  onDateRangeChange,
  onExport,
  className,
}: AnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y' | 'custom'>(
    '30d'
  );
  const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Simulate revenue data
    const revenue: ChartDataPoint[] = [
      { label: 'Jan', value: 12500 },
      { label: 'Feb', value: 15200 },
      { label: 'Mar', value: 18900 },
      { label: 'Apr', value: 22100 },
      { label: 'May', value: 24500 },
      { label: 'Jun', value: 28900 },
    ];
    setRevenueData(revenue);

    // Simulate user growth data
    const users: ChartDataPoint[] = [
      { label: 'Jan', value: 1200 },
      { label: 'Feb', value: 1450 },
      { label: 'Mar', value: 1680 },
      { label: 'Apr', value: 1920 },
      { label: 'May', value: 2150 },
      { label: 'Jun', value: 2380 },
    ];
    setUserGrowthData(users);
  }, []);

  const defaultMetrics: AnalyticsMetric[] = [
    {
      label: 'Total Revenue',
      value: 28900,
      change: 12.5,
      changeType: 'increase',
      icon: <DollarSign className="w-5 h-5" />,
      format: 'currency',
    },
    {
      label: 'Active Users',
      value: 2380,
      change: 8.3,
      changeType: 'increase',
      icon: <Users className="w-5 h-5" />,
      format: 'number',
    },
    {
      label: 'Conversion Rate',
      value: 3.2,
      change: -0.5,
      changeType: 'decrease',
      icon: <ShoppingCart className="w-5 h-5" />,
      format: 'percentage',
    },
    {
      label: 'Page Views',
      value: 125000,
      change: 15.2,
      changeType: 'increase',
      icon: <Eye className="w-5 h-5" />,
      format: 'number',
    },
  ];

  const displayMetrics = metrics || defaultMetrics;

  const formatValue = (value: number | string, format?: string) => {
    if (typeof value === 'string') return value;
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  const periodOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your business metrics and performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => {
              const value = e.target.value as '7d' | '30d' | '90d' | '1y' | 'custom';
              setSelectedPeriod(value);
              if (value !== 'custom' && onDateRangeChange) {
                const end = new Date();
                const start = new Date();
                switch (value) {
                  case '7d':
                    start.setDate(end.getDate() - 7);
                    break;
                  case '30d':
                    start.setDate(end.getDate() - 30);
                    break;
                  case '90d':
                    start.setDate(end.getDate() - 90);
                    break;
                  case '1y':
                    start.setFullYear(end.getFullYear() - 1);
                    break;
                }
                onDateRangeChange({
                  start: start.toISOString(),
                  end: end.toISOString(),
                });
              }
            }}
            className={clsx(
              'px-4 py-2 border rounded-lg text-sm',
              'bg-background',
              'text-foreground',
              'border-border',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
            )}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayMetrics.map((metric, index) => (
          <Card key={index} className="bg-background">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {metric.icon && (
                    <div className="text-primary-600 dark:text-primary-400">{metric.icon}</div>
                  )}
                  <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {formatValue(metric.value, metric.format)}
                </div>
                {metric.change !== undefined && (
                  <div className="flex items-center gap-1">
                    {metric.changeType === 'increase' ? (
                      <TrendingUp className="w-4 h-4 text-success-600 dark:text-success-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-error-600 dark:text-error-400" />
                    )}
                    <span
                      className={clsx(
                        'text-sm font-medium',
                        metric.changeType === 'increase'
                          ? 'text-success-600 dark:text-success-400'
                          : 'text-error-600 dark:text-error-400'
                      )}
                    >
                      {Math.abs(metric.change)}%{' '}
                      {metric.changeType === 'increase' ? 'increase' : 'decrease'}
                    </span>
                    <span className="text-sm text-muted-foreground">vs last period</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue Trend" className="bg-background">
          <Chart type="line" data={revenueData} title="Revenue" height={250} />
        </Card>
        <Card title="User Growth" className="bg-background">
          <Chart type="bar" data={userGrowthData} title="Active Users" height={250} />
        </Card>
      </div>

      {/* Additional Analytics */}
      <Card title="Traffic Sources" className="bg-background">
        <div className="space-y-4">
          {[
            { source: 'Direct', visitors: 45230, percentage: 45 },
            { source: 'Search Engines', visitors: 32150, percentage: 32 },
            { source: 'Social Media', visitors: 15680, percentage: 16 },
            { source: 'Referrals', visitors: 6940, percentage: 7 },
          ].map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{item.source}</span>
                <span className="text-muted-foreground">
                  {item.visitors.toLocaleString()} ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
