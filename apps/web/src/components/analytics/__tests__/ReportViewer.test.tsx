/**
 * ReportViewer Component Tests
 *
 * Comprehensive test suite for the ReportViewer component covering:
 * - Report display
 * - Table rendering
 * - Chart rendering
 * - Export functionality
 * - Refresh functionality
 * - Share functionality
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import ReportViewer, { type ReportData } from '../ReportViewer';

// Mock Chart component
vi.mock('@/components/ui', () => ({
  Chart: ({ data }: { data: unknown[] }) => (
    <div data-testid="chart">{data.length} data points</div>
  ),
  DataTable: ({ data }: { data: unknown[] }) => (
    <div data-testid="data-table">{data.length} rows</div>
  ),
}));

describe('ReportViewer Component', () => {
  const mockReport: ReportData = {
    id: '1',
    name: 'Revenue Report',
    description: 'Monthly revenue analysis',
    dateRange: {
      start: '2024-01-01',
      end: '2024-01-31',
    },
    format: 'both',
    data: {
      table: [
        { date: '2024-01-01', revenue: 1000, users: 100 },
        { date: '2024-01-02', revenue: 1200, users: 120 },
      ],
      chart: [
        { label: 'Jan', value: 1000 },
        { label: 'Feb', value: 1200 },
      ],
      chartType: 'line',
    },
    generatedAt: '2024-01-31T12:00:00Z',
  };

  const mockOnRefresh = vi.fn();
  const mockOnExport = vi.fn();
  const mockOnShare = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders report name', () => {
      render(<ReportViewer report={mockReport} />);
      expect(screen.getByText('Revenue Report')).toBeInTheDocument();
    });

    it('renders report description', () => {
      render(<ReportViewer report={mockReport} />);
      expect(screen.getByText('Monthly revenue analysis')).toBeInTheDocument();
    });

    it('renders date range', () => {
      render(<ReportViewer report={mockReport} />);
      expect(screen.getByText(/2024-01-01/i)).toBeInTheDocument();
      expect(screen.getByText(/2024-01-31/i)).toBeInTheDocument();
    });

    it('renders table when format is table', () => {
      const tableReport = { ...mockReport, format: 'table' as const };
      render(<ReportViewer report={tableReport} />);
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    it('renders chart when format is chart', async () => {
      const chartReport = { ...mockReport, format: 'chart' as const };
      render(<ReportViewer report={chartReport} />);
      await waitFor(() => {
        expect(screen.getByTestId('chart')).toBeInTheDocument();
      });
    });

    it('renders both table and chart when format is both', async () => {
      render(<ReportViewer report={mockReport} />);
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId('chart')).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('calls onRefresh when refresh button is clicked', async () => {
      render(<ReportViewer report={mockReport} onRefresh={mockOnRefresh} />);
      const refreshButton = screen.getByText(/refresh/i);
      fireEvent.click(refreshButton);
      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalled();
      });
    });

    it('calls onExport when export button is clicked', async () => {
      render(<ReportViewer report={mockReport} onExport={mockOnExport} />);
      const exportButton = screen.getByText(/export/i);
      fireEvent.click(exportButton);
      await waitFor(() => {
        expect(mockOnExport).toHaveBeenCalled();
      });
    });

    it('calls onShare when share button is clicked', () => {
      render(<ReportViewer report={mockReport} onShare={mockOnShare} />);
      const shareButton = screen.getByText(/share/i);
      fireEvent.click(shareButton);
      expect(mockOnShare).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles report without description', () => {
      const reportWithoutDesc = { ...mockReport, description: undefined };
      render(<ReportViewer report={reportWithoutDesc} />);
      expect(screen.getByText('Revenue Report')).toBeInTheDocument();
    });

    it('handles report without table data', () => {
      const reportWithoutTable = {
        ...mockReport,
        data: { chart: mockReport.data.chart, chartType: 'line' },
      };
      render(<ReportViewer report={reportWithoutTable} />);
      expect(screen.getByText('Revenue Report')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ReportViewer report={mockReport} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
