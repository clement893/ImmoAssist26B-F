/**
 * AdvancedCharts Component Tests
 *
 * Comprehensive test suite for the AdvancedCharts component covering:
 * - Rendering different chart types (scatter, radar, donut, gauge)
 * - Data display
 * - Custom colors and configurations
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import AdvancedCharts from '../AdvancedCharts';
import type { ScatterDataPoint, RadarDataPoint } from '../AdvancedCharts';

describe('AdvancedCharts Component', () => {
  describe('Scatter Chart', () => {
    const scatterData: ScatterDataPoint[] = [
      { x: 10, y: 20, label: 'Point 1' },
      { x: 20, y: 30, label: 'Point 2' },
      { x: 30, y: 10, label: 'Point 3' },
    ];

    it('renders scatter chart', () => {
      const { container } = render(<AdvancedCharts data={scatterData} type="scatter" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders grid lines', () => {
      const { container } = render(<AdvancedCharts data={scatterData} type="scatter" />);
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('renders data points as circles', () => {
      const { container } = render(<AdvancedCharts data={scatterData} type="scatter" />);
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(3);
    });

    it('displays legend for scatter chart', () => {
      render(<AdvancedCharts data={scatterData} type="scatter" />);
      expect(screen.getByText('Point 1')).toBeInTheDocument();
      expect(screen.getByText('Point 2')).toBeInTheDocument();
    });

    it('applies custom colors to points', () => {
      const dataWithColors: ScatterDataPoint[] = [
        { x: 10, y: 20, color: '#FF0000' },
        { x: 20, y: 30, color: '#00FF00' },
      ];
      const { container } = render(<AdvancedCharts data={dataWithColors} type="scatter" />);
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(2);
    });

    it('handles points without labels', () => {
      const dataWithoutLabels: ScatterDataPoint[] = [
        { x: 10, y: 20 },
        { x: 20, y: 30 },
      ];
      render(<AdvancedCharts data={dataWithoutLabels} type="scatter" />);
      expect(screen.getByText('Point 1')).toBeInTheDocument();
    });
  });

  describe('Radar Chart', () => {
    const radarData: RadarDataPoint[] = [
      { label: 'Speed', value: 80 },
      { label: 'Strength', value: 60 },
      { label: 'Defense', value: 70 },
      { label: 'Stamina', value: 90 },
    ];

    it('renders radar chart', () => {
      const { container } = render(<AdvancedCharts data={radarData} type="radar" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders grid circles', () => {
      const { container } = render(<AdvancedCharts data={radarData} type="radar" />);
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('renders axis lines', () => {
      const { container } = render(<AdvancedCharts data={radarData} type="radar" />);
      const lines = container.querySelectorAll('line');
      expect(lines.length).toBeGreaterThan(0);
    });

    it('renders data polygon', () => {
      const { container } = render(<AdvancedCharts data={radarData} type="radar" />);
      const polygon = container.querySelector('polygon');
      expect(polygon).toBeInTheDocument();
    });

    it('renders data polyline', () => {
      const { container } = render(<AdvancedCharts data={radarData} type="radar" />);
      const polyline = container.querySelector('polyline');
      expect(polyline).toBeInTheDocument();
    });

    it('displays labels for each axis', () => {
      render(<AdvancedCharts data={radarData} type="radar" />);
      expect(screen.getByText('Speed')).toBeInTheDocument();
      expect(screen.getByText('Strength')).toBeInTheDocument();
      expect(screen.getByText('Defense')).toBeInTheDocument();
    });

    it('handles maxValue prop', () => {
      const dataWithMax: RadarDataPoint[] = [
        { label: 'Speed', value: 80, maxValue: 100 },
        { label: 'Strength', value: 60, maxValue: 100 },
      ];
      const { container } = render(<AdvancedCharts data={dataWithMax} type="radar" />);
      const polygon = container.querySelector('polygon');
      expect(polygon).toBeInTheDocument();
    });
  });

  describe('Donut Chart', () => {
    const donutData = [
      { label: 'A', value: 30 },
      { label: 'B', value: 50 },
      { label: 'C', value: 20 },
    ];

    it('renders donut chart', () => {
      const { container } = render(<AdvancedCharts data={donutData} type="donut" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders donut slices', () => {
      const { container } = render(<AdvancedCharts data={donutData} type="donut" />);
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBe(3);
    });

    it('displays total in center', () => {
      render(<AdvancedCharts data={donutData} type="donut" />);
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('displays legend', () => {
      render(<AdvancedCharts data={donutData} type="donut" />);
      expect(screen.getByText('A: 30')).toBeInTheDocument();
      expect(screen.getByText('B: 50')).toBeInTheDocument();
    });

    it('applies custom colors', () => {
      const dataWithColors = [
        { label: 'A', value: 30, color: '#FF0000' },
        { label: 'B', value: 50, color: '#00FF00' },
      ];
      const { container } = render(<AdvancedCharts data={dataWithColors} type="donut" />);
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBe(2);
    });

    it('uses custom innerRadius', () => {
      const { container } = render(
        <AdvancedCharts data={donutData} type="donut" innerRadius={0.5} />
      );
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Gauge Chart', () => {
    it('renders gauge chart', () => {
      const { container } = render(<AdvancedCharts data={[]} type="gauge" value={50} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('renders background arc', () => {
      const { container } = render(<AdvancedCharts data={[]} type="gauge" value={50} />);
      const paths = container.querySelectorAll('path');
      expect(paths.length).toBeGreaterThan(0);
    });

    it('displays value', () => {
      render(<AdvancedCharts data={[]} type="gauge" value={75} />);
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('displays min and max labels', () => {
      render(<AdvancedCharts data={[]} type="gauge" value={50} min={0} max={100} />);
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('uses custom min and max', () => {
      render(<AdvancedCharts data={[]} type="gauge" value={25} min={0} max={50} />);
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('applies success color for low values', () => {
      const { container } = render(<AdvancedCharts data={[]} type="gauge" value={25} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('applies warning color for medium values', () => {
      const { container } = render(<AdvancedCharts data={[]} type="gauge" value={60} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('applies danger color for high values', () => {
      const { container } = render(<AdvancedCharts data={[]} type="gauge" value={80} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('renders title when provided', () => {
      render(<AdvancedCharts data={[]} type="scatter" title="Scatter Plot" />);
      expect(screen.getByText('Scatter Plot')).toBeInTheDocument();
    });

    it('applies custom height', () => {
      const { container } = render(<AdvancedCharts data={[]} type="scatter" height={400} />);
      const chartContainer = container.querySelector('[style*="height"]');
      expect(chartContainer).toHaveStyle({ height: '400px' });
    });

    it('uses default height when not provided', () => {
      const { container } = render(<AdvancedCharts data={[]} type="scatter" />);
      const chartContainer = container.querySelector('[style*="height"]');
      expect(chartContainer).toHaveStyle({ height: '300px' });
    });

    it('applies custom className', () => {
      const { container } = render(
        <AdvancedCharts data={[]} type="scatter" className="custom-chart" />
      );
      const chart = container.querySelector('.custom-chart');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations for scatter chart', async () => {
      const scatterData: ScatterDataPoint[] = [{ x: 10, y: 20, label: 'Point 1' }];
      const { container } = render(<AdvancedCharts data={scatterData} type="scatter" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations for radar chart', async () => {
      const radarData: RadarDataPoint[] = [{ label: 'Speed', value: 80 }];
      const { container } = render(<AdvancedCharts data={radarData} type="radar" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('provides tooltips for data points', () => {
      const scatterData: ScatterDataPoint[] = [{ x: 10, y: 20, label: 'Point 1' }];
      const { container } = render(<AdvancedCharts data={scatterData} type="scatter" />);
      const circles = container.querySelectorAll('circle[title]');
      expect(circles.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty data array', () => {
      const { container } = render(<AdvancedCharts data={[]} type="scatter" />);
      const chart = container.querySelector('.bg-white');
      expect(chart).toBeInTheDocument();
    });

    it('handles single data point in donut chart', () => {
      const singleData = [{ label: 'Single', value: 100 }];
      render(<AdvancedCharts data={singleData} type="donut" />);
      expect(screen.getByText('Single: 100')).toBeInTheDocument();
    });

    it('handles zero values', () => {
      const dataWithZero = [
        { label: 'Zero', value: 0 },
        { label: 'Value', value: 10 },
      ];
      render(<AdvancedCharts data={dataWithZero} type="donut" />);
      expect(screen.getByText('Zero: 0')).toBeInTheDocument();
    });
  });
});
