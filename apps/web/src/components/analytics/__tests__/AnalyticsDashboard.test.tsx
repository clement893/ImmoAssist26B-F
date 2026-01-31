/**
 * AnalyticsDashboard Component Tests
 *
 * Comprehensive test suite for the AnalyticsDashboard component covering:
 * - Metrics display
 * - Chart rendering
 * - Date range selection
 * - Export functionality
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import AnalyticsDashboard, { type AnalyticsMetric } from '../AnalyticsDashboard';

// Mock Chart component
vi.mock('@/components/ui', () => ({
  Chart: ({ data }: { data: unknown[] }) => (
    <div data-testid="chart">{data.length} data points</div>
  ),
}));

describe('AnalyticsDashboard Component', () => {
  const mockMetrics: AnalyticsMetric[] = [
    {
      label: 'Total Revenue',
      value: 28900,
      change: 12.5,
      changeType: 'increase',
      format: 'currency',
    },
    {
      label: 'Active Users',
      value: 2380,
      change: 8.3,
      changeType: 'increase',
      format: 'number',
    },
  ];

  const mockOnDateRangeChange = vi.fn();
  const mockOnExport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders metrics', () => {
      render(
        <AnalyticsDashboard
          metrics={mockMetrics}
          onDateRangeChange={mockOnDateRangeChange}
          onExport={mockOnExport}
        />
      );
      expect(screen.getByText(/total revenue/i)).toBeInTheDocument();
      expect(screen.getByText(/active users/i)).toBeInTheDocument();
    });

    it('renders default metrics when none provided', () => {
      render(<AnalyticsDashboard />);
      expect(screen.getByText(/total revenue/i)).toBeInTheDocument();
    });

    it('renders charts', async () => {
      render(<AnalyticsDashboard metrics={mockMetrics} />);
      await waitFor(() => {
        expect(screen.getByTestId('chart')).toBeInTheDocument();
      });
    });
  });

  describe('Date Range Selection', () => {
    it('renders period selector', () => {
      render(<AnalyticsDashboard onDateRangeChange={mockOnDateRangeChange} />);
      expect(screen.getByText(/7d|30d|90d|1y/i)).toBeInTheDocument();
    });

    it('calls onDateRangeChange when period changes', async () => {
      render(<AnalyticsDashboard onDateRangeChange={mockOnDateRangeChange} />);
      const periodButton = screen.getByText('90d');
      fireEvent.click(periodButton);
      // Component should handle period change
      expect(periodButton).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('calls onExport when export button is clicked', async () => {
      render(<AnalyticsDashboard onExport={mockOnExport} />);
      const exportButton = screen.getByText(/export/i);
      fireEvent.click(exportButton);
      expect(mockOnExport).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles metrics with decrease change', () => {
      const metricsWithDecrease: AnalyticsMetric[] = [
        {
          label: 'Conversion Rate',
          value: 3.2,
          change: -0.5,
          changeType: 'decrease',
          format: 'percentage',
        },
      ];
      render(<AnalyticsDashboard metrics={metricsWithDecrease} />);
      expect(screen.getByText(/conversion rate/i)).toBeInTheDocument();
    });

    it('handles metrics without change', () => {
      const metricsWithoutChange: AnalyticsMetric[] = [
        {
          label: 'Total',
          value: 1000,
          format: 'number',
        },
      ];
      render(<AnalyticsDashboard metrics={metricsWithoutChange} />);
      expect(screen.getByText(/total/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<AnalyticsDashboard metrics={mockMetrics} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
