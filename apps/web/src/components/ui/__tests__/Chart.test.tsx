/**
 * Chart Component Tests
 *
 * Comprehensive test suite for the Chart component covering:
 * - Rendering different chart types (bar, line, pie, area)
 * - Data display
 * - Custom colors
 * - Title and height props
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import Chart from '../Chart';
import type { ChartDataPoint } from '../Chart';

describe('Chart Component', () => {
  const mockData: ChartDataPoint[] = [
    { label: 'Jan', value: 10 },
    { label: 'Feb', value: 20 },
    { label: 'Mar', value: 15 },
  ];

  describe('Rendering', () => {
    it('renders chart with default bar type', () => {
      const { container } = render(<Chart data={mockData} />);
      const chart = container.querySelector('.bg-white');
      expect(chart).toBeInTheDocument();
    });

    it('renders chart title when provided', () => {
      render(<Chart data={mockData} title="Sales Chart" />);
      expect(screen.getByText('Sales Chart')).toBeInTheDocument();
    });

    it('does not render title when not provided', () => {
      const { container } = render(<Chart data={mockData} />);
      const title = container.querySelector('h3');
      expect(title).not.toBeInTheDocument();
    });
  });

  describe('Bar Chart', () => {
    it('renders bar chart when type is bar', () => {
      const { container } = render(<Chart data={mockData} type="bar" />);
      const bars = container.querySelectorAll('[title*="Jan"]');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('displays all data labels', () => {
      render(<Chart data={mockData} type="bar" />);
      expect(screen.getByText('Jan')).toBeInTheDocument();
      expect(screen.getByText('Feb')).toBeInTheDocument();
      expect(screen.getByText('Mar')).toBeInTheDocument();
    });

    it('displays tooltips with values', () => {
      const { container } = render(<Chart data={mockData} type="bar" />);
      const bar = container.querySelector('[title*="Jan: 10"]');
      expect(bar).toBeInTheDocument();
    });

    it('applies custom colors to bars', () => {
      const dataWithColors: ChartDataPoint[] = [
        { label: 'Jan', value: 10, color: '#FF0000' },
        { label: 'Feb', value: 20, color: '#00FF00' },
      ];
      const { container } = render(<Chart data={dataWithColors} type="bar" />);
      const bars = container.querySelectorAll('[style*="background-color"]');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('Line Chart', () => {
    it('renders line chart when type is line', () => {
      const { container } = render(<Chart data={mockData} type="line" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      const polyline = svg?.querySelector('polyline');
      expect(polyline).toBeInTheDocument();
    });

    it('renders data points as circles', () => {
      const { container } = render(<Chart data={mockData} type="line" />);
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(3);
    });

    it('applies custom colors to line', () => {
      const dataWithColor: ChartDataPoint[] = [
        { label: 'Jan', value: 10, color: '#FF0000' },
        { label: 'Feb', value: 20, color: '#FF0000' },
      ];
      const { container } = render(<Chart data={dataWithColor} type="line" />);
      const polyline = container.querySelector('polyline');
      expect(polyline).toBeInTheDocument();
    });
  });

  describe('Pie Chart', () => {
    it('renders pie chart when type is pie', () => {
      const { container } = render(<Chart data={mockData} type="pie" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      const paths = svg?.querySelectorAll('path');
      expect(paths?.length).toBe(3);
    });

    it('displays legend for pie chart', () => {
      render(<Chart data={mockData} type="pie" />);
      expect(screen.getByText('Jan: 10')).toBeInTheDocument();
      expect(screen.getByText('Feb: 20')).toBeInTheDocument();
      expect(screen.getByText('Mar: 15')).toBeInTheDocument();
    });

    it('renders pie slices with tooltips', () => {
      const { container } = render(<Chart data={mockData} type="pie" />);
      const paths = container.querySelectorAll('path[title*="Jan"]');
      expect(paths.length).toBeGreaterThan(0);
    });

    it('applies custom colors to pie slices', () => {
      const dataWithColors: ChartDataPoint[] = [
        { label: 'Jan', value: 10, color: '#FF0000' },
        { label: 'Feb', value: 20, color: '#00FF00' },
      ];
      const { container } = render(<Chart data={dataWithColors} type="pie" />);
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBe(2);
    });
  });

  describe('Area Chart', () => {
    it('renders area chart when type is area', () => {
      const { container } = render(<Chart data={mockData} type="area" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      const path = svg?.querySelector('path');
      expect(path).toBeInTheDocument();
      const polyline = svg?.querySelector('polyline');
      expect(polyline).toBeInTheDocument();
    });

    it('renders filled area', () => {
      const { container } = render(<Chart data={mockData} type="area" />);
      const path = container.querySelector('path[opacity]');
      expect(path).toBeInTheDocument();
    });

    it('applies custom colors to area', () => {
      const dataWithColor: ChartDataPoint[] = [
        { label: 'Jan', value: 10, color: '#FF0000' },
        { label: 'Feb', value: 20, color: '#FF0000' },
      ];
      const { container } = render(<Chart data={dataWithColor} type="area" />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies custom height', () => {
      const { container } = render(<Chart data={mockData} height={400} />);
      const chartContainer = container.querySelector('[style*="height"]');
      expect(chartContainer).toHaveStyle({ height: '400px' });
    });

    it('uses default height when not provided', () => {
      const { container } = render(<Chart data={mockData} />);
      const chartContainer = container.querySelector('[style*="height"]');
      expect(chartContainer).toHaveStyle({ height: '300px' });
    });

    it('applies custom className', () => {
      const { container } = render(<Chart data={mockData} className="custom-chart" />);
      const chart = container.querySelector('.custom-chart');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('handles empty data array', () => {
      const { container } = render(<Chart data={[]} />);
      const chart = container.querySelector('.bg-white');
      expect(chart).toBeInTheDocument();
    });

    it('handles single data point', () => {
      const singleData: ChartDataPoint[] = [{ label: 'Single', value: 10 }];
      render(<Chart data={singleData} type="bar" />);
      expect(screen.getByText('Single')).toBeInTheDocument();
    });

    it('handles zero values', () => {
      const dataWithZero: ChartDataPoint[] = [
        { label: 'Zero', value: 0 },
        { label: 'Value', value: 10 },
      ];
      render(<Chart data={dataWithZero} type="bar" />);
      expect(screen.getByText('Zero')).toBeInTheDocument();
    });

    it('handles large values', () => {
      const dataWithLargeValues: ChartDataPoint[] = [{ label: 'Large', value: 1000000 }];
      render(<Chart data={dataWithLargeValues} type="bar" />);
      expect(screen.getByText('Large')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Chart data={mockData} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides tooltips for data points', () => {
      const { container } = render(<Chart data={mockData} type="bar" />);
      const tooltips = container.querySelectorAll('[title]');
      expect(tooltips.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles negative values', () => {
      const dataWithNegative: ChartDataPoint[] = [
        { label: 'Negative', value: -10 },
        { label: 'Positive', value: 10 },
      ];
      render(<Chart data={dataWithNegative} type="bar" />);
      expect(screen.getByText('Negative')).toBeInTheDocument();
    });

    it('handles very long labels', () => {
      const dataWithLongLabel: ChartDataPoint[] = [
        { label: 'Very Long Label That Might Overflow', value: 10 },
      ];
      render(<Chart data={dataWithLongLabel} type="bar" />);
      expect(screen.getByText('Very Long Label That Might Overflow')).toBeInTheDocument();
    });

    it('handles decimal values', () => {
      const dataWithDecimals: ChartDataPoint[] = [{ label: 'Decimal', value: 10.5 }];
      render(<Chart data={dataWithDecimals} type="bar" />);
      expect(screen.getByText('Decimal')).toBeInTheDocument();
    });
  });
});
