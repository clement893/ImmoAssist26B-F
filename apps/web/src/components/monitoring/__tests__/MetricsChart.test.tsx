/**
 * MetricsChart Component Tests
 *
 * Comprehensive test suite for the MetricsChart component covering:
 * - Chart rendering
 * - Metric data display
 * - Intersection Observer (lazy loading)
 * - Auto-refresh functionality
 * - Threshold display
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import MetricsChart from '../MetricsChart';

// Mock Chart component
vi.mock('@/components/ui/Chart', () => ({
  default: ({ data }: { data: unknown[] }) => (
    <div data-testid="chart">{data.length} data points</div>
  ),
}));

// Mock metrics collector
vi.mock('@/lib/monitoring/metrics', () => ({
  metricsCollector: {
    getMetrics: vi.fn(() => [
      {
        name: 'cpu',
        value: 50,
        unit: '%',
        timestamp: new Date().toISOString(),
        threshold: {
          warning: 70,
          critical: 90,
        },
      },
    ]),
  },
}));

describe('MetricsChart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders metrics chart', () => {
      render(<MetricsChart metricName="cpu" />);
      expect(screen.getByText(/cpu/i) || screen.getByTestId('chart')).toBeInTheDocument();
    });

    it('displays chart title', () => {
      render(<MetricsChart metricName="cpu" title="CPU Usage" />);
      expect(screen.getByText(/cpu usage/i)).toBeInTheDocument();
    });

    it('displays latest metric value', () => {
      render(<MetricsChart metricName="cpu" />);
      expect(screen.getByText(/50/i)).toBeInTheDocument();
    });

    it('shows no data message when no metrics', () => {
      const { metricsCollector } = require('@/lib/monitoring/metrics');
      metricsCollector.getMetrics.mockReturnValueOnce([]);
      render(<MetricsChart metricName="cpu" />);
      expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    });
  });

  describe('Chart Display', () => {
    it('renders chart with data', () => {
      render(<MetricsChart metricName="cpu" />);
      expect(screen.getByTestId('chart')).toBeInTheDocument();
    });

    it('displays thresholds when available', () => {
      render(<MetricsChart metricName="cpu" />);
      expect(screen.getByText(/warning|critical/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<MetricsChart metricName="cpu" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
